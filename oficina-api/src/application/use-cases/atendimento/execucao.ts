import { exigirAprovado, exigirServicosConcluidos, validarPeriodo } from '../../../domain/atendimento/execucao.js';
import { exigirExecucao, exigirVersao, transicionar } from '../../../domain/atendimento/ordem-servico.js';
import { aplicarMovimento } from '../../../domain/estoque/estoque.js';
import { NotFoundError } from '../../../domain/shared/errors.js';
import type { AtendimentoRepository, Orcamento, UnidadeTrabalho } from '../../ports/atendimento.js';
import { liberarReservas } from '../estoque/reservas.js';
import { bloquear, detalhar, type DetalheOS } from './ordens.js';

export interface TempoMedio {
  de: Date;
  ate: Date;
  amostra: number;
  mediaSegundos: number | null;
}

/** Execução, finalização e entrega da OS (seção 5 do plano, RN07, RN10). */
export class ExecutarOrdens {
  constructor(private readonly uow: UnidadeTrabalho) {}

  /** AGUARDANDO_APROVACAO para EM_EXECUCAO, só com a versão atual aprovada. As peças já estão reservadas. */
  iniciar(id: string, versao: number, autorId: string): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento }) => {
      const os = await bloquear(atendimento, id);
      exigirVersao(os.versao, versao);
      const para = transicionar(os.status, 'INICIAR_EXECUCAO');
      exigirAprovado((await atendimento.orcamentos(id))[0]?.status);
      await atendimento.mudarStatus(os, para, autorId);
      return detalhar(atendimento, id);
    });
  }

  /**
   * Baixa física de uma linha de peça do orçamento aprovado (RN07). Cada linha é consumida uma vez:
   * repetir devolve o mesmo resultado sem nova baixa.
   */
  consumirPeca(id: string, itemOrcamentoId: string, autorId: string): Promise<{ os: DetalheOS; repetida: boolean }> {
    return this.uow.executar(async ({ atendimento, estoque }) => {
      const os = await bloquear(atendimento, id);
      exigirExecucao(os.status);
      const aprovado = await orcamentoAprovado(atendimento, id);
      const item = aprovado.itens.find((i) => i.id === itemOrcamentoId && i.tipo === 'PECA');
      if (!item) throw new NotFoundError('ITEM_NAO_ENCONTRADO', 'Peça não encontrada no orçamento aprovado desta OS');

      if (await estoque.consumoDoItem(item.id)) return { os: await detalhar(atendimento, id), repetida: true };

      const reserva = (await estoque.reservasAbertas(aprovado.id)).find((r) => r.itemOrcamentoId === item.id)!;
      const [peca] = await estoque.bloquearPecas([reserva.pecaId]);
      await estoque.registrar({
        pecaId: reserva.pecaId,
        tipo: 'CONSUMO',
        quantidade: reserva.quantidade,
        saldo: aplicarMovimento(peca!, 'CONSUMO', reserva.quantidade),
        itemOrcamentoId: item.id,
        referenteA: reserva.movimentoId,
        observacao: `Consumo na ${os.numero}`,
        autorId,
      });
      await atendimento.incrementarVersao(id);
      return { os: await detalhar(atendimento, id), repetida: false };
    });
  }

  concluirServico(id: string, itemId: string): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento }) => {
      const os = await bloquear(atendimento, id);
      exigirExecucao(os.status);
      const servico = (await atendimento.servicosDaOS(id)).find((s) => s.id === itemId);
      if (!servico) throw new NotFoundError('ITEM_NAO_ENCONTRADO', 'Serviço não encontrado nesta OS');
      if (!servico.concluidoEm) {
        await atendimento.concluirServico(id, itemId);
        await atendimento.incrementarVersao(id);
      }
      return detalhar(atendimento, id);
    });
  }

  /**
   * EM_EXECUCAO para FINALIZADA. Exige todos os serviços concluídos.
   * Peça reservada e não usada volta ao disponível com uma liberação.
   */
  finalizar(id: string, versao: number, autorId: string): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento, estoque }) => {
      const os = await bloquear(atendimento, id);
      exigirVersao(os.versao, versao);
      const para = transicionar(os.status, 'FINALIZAR');
      exigirServicosConcluidos(await atendimento.servicosDaOS(id));
      const aprovado = await orcamentoAprovado(atendimento, id);
      await liberarReservas(estoque, aprovado.id, autorId, `Não utilizada na ${os.numero}`);
      await atendimento.mudarStatus(os, para, autorId);
      return detalhar(atendimento, id);
    });
  }

  /** FINALIZADA para ENTREGUE. */
  entregar(id: string, versao: number, autorId: string): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento }) => {
      const os = await bloquear(atendimento, id);
      exigirVersao(os.versao, versao);
      await atendimento.mudarStatus(os, transicionar(os.status, 'ENTREGAR'), autorId);
      return detalhar(atendimento, id);
    });
  }

  /** Tempo médio de execução das OS finalizadas no período (RN10). Sem amostra, a média é null, nunca zero. */
  tempoMedio(de: Date, ate: Date): Promise<TempoMedio> {
    validarPeriodo(de, ate);
    return this.uow.executar(async ({ atendimento }) => ({
      de,
      ate,
      ...(await atendimento.tempoMedioExecucao(de, ate)),
    }));
  }
}

async function orcamentoAprovado(atendimento: AtendimentoRepository, osId: string): Promise<Orcamento> {
  const atual = (await atendimento.orcamentos(osId))[0];
  exigirAprovado(atual?.status);
  return atual!;
}
