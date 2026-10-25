import {
  exigirDiagnostico,
  exigirVersao,
  transicionar,
  type ComandoOS,
} from '../../../domain/atendimento/ordem-servico.js';
import {
  calcularOrcamento,
  totalDaLinha,
  validarQuantidade,
  type ItemPrecificavel,
  type TipoItem,
} from '../../../domain/atendimento/orcamento.js';
import { ConflictError, NotFoundError } from '../../../domain/shared/errors.js';
import { textoObrigatorio } from '../../../domain/shared/texto.js';
import type {
  AtendimentoRepository,
  FiltroOS,
  ItemPecaOS,
  ItemServicoOS,
  MudancaStatus,
  Orcamento,
  OrdemServico,
  UnidadeTrabalho,
} from '../../ports/atendimento.js';
import type { Lista, Paginacao } from '../../ports/cadastros.js';
import { liberarReservas } from '../estoque/reservas.js';
import { hashCorpo } from './idempotencia.js';

export interface DetalheOS extends OrdemServico {
  servicos: (ItemServicoOS & { totalCentavos: number })[];
  pecas: (ItemPecaOS & { totalCentavos: number })[];
  /** Soma dos itens a preço atual. Vale só como estimativa até a publicação. */
  estimativaCentavos: number;
  orcamentos: Orcamento[];
  historico: MudancaStatus[];
}

export interface DadosAbertura {
  clienteId: string;
  veiculoId: string;
  solicitacao: string;
}

const OPERACAO_ABRIR = 'ABRIR_OS';

export class GerenciarOrdens {
  constructor(private readonly uow: UnidadeTrabalho) {}

  /**
   * Abre a OS em RECEBIDA (RN03). Com chave de idempotência, repetir a chamada com o mesmo corpo
   * devolve a mesma OS e corpo diferente com a mesma chave devolve 409 (RN09).
   */
  abrir(dados: DadosAbertura, autorId: string, chave?: string): Promise<{ os: DetalheOS; repetida: boolean }> {
    return this.uow.executar(async ({ atendimento: repo }) => {
      const solicitacao = textoObrigatorio(dados.solicitacao, 'solicitacao');
      const hash = hashCorpo({ clienteId: dados.clienteId, veiculoId: dados.veiculoId, solicitacao });

      if (chave) {
        const anterior = await repo.buscarIdempotencia(autorId, chave);
        if (anterior) {
          if (anterior.operacao !== OPERACAO_ABRIR || anterior.hash !== hash) {
            throw new ConflictError('IDEMPOTENCIA_CONFLITO', 'Chave de idempotência já usada com outro conteúdo');
          }
          return { os: await detalhar(repo, anterior.corpo.id), repetida: true };
        }
      }

      const cliente = await repo.buscarCliente(dados.clienteId);
      if (!cliente) throw new NotFoundError('CLIENTE_NAO_ENCONTRADO', 'Cliente não encontrado');
      if (!cliente.ativo) throw new ConflictError('CLIENTE_INATIVO', 'Cliente inativo não abre OS');
      const veiculo = await repo.buscarVeiculo(dados.veiculoId);
      if (!veiculo) throw new NotFoundError('VEICULO_NAO_ENCONTRADO', 'Veículo não encontrado');
      if (veiculo.clienteId !== dados.clienteId) {
        throw new ConflictError('VEICULO_DE_OUTRO_CLIENTE', 'Veículo não pertence ao cliente informado');
      }
      if (!veiculo.ativo) throw new ConflictError('VEICULO_INATIVO', 'Veículo inativo não abre OS');

      const os = await repo.inserirOS({ ...dados, solicitacao, criadaPor: autorId });
      if (chave) {
        await repo.salvarIdempotencia(autorId, chave, { operacao: OPERACAO_ABRIR, hash, status: 201, corpo: { id: os.id } });
      }
      return { os: await detalhar(repo, os.id), repetida: false };
    });
  }

  buscar(id: string): Promise<DetalheOS> {
    return this.uow.executar(({ atendimento: repo }) => detalhar(repo, id));
  }

  listar(filtro: FiltroOS, pagina: Paginacao): Promise<Lista<OrdemServico>> {
    return this.uow.executar(({ atendimento: repo }) => repo.listarOS(filtro, pagina));
  }

  iniciarDiagnostico(id: string, versao: number, autorId: string): Promise<DetalheOS> {
    return this.transicao(id, versao, autorId, 'INICIAR_DIAGNOSTICO');
  }

  adicionarServico(id: string, servicoId: string, quantidade: number): Promise<DetalheOS> {
    return this.alterarItens(id, async (repo) => {
      const servico = await repo.buscarServico(servicoId);
      if (!servico) throw new NotFoundError('SERVICO_NAO_ENCONTRADO', 'Serviço não encontrado');
      if (!servico.ativo) throw new ConflictError('ITEM_INATIVO', `${servico.nome} está inativo no catálogo`);
      await repo.adicionarServico(id, servicoId, validarQuantidade(quantidade, true));
    });
  }

  adicionarPeca(id: string, pecaId: string, quantidade: number): Promise<DetalheOS> {
    return this.alterarItens(id, async (repo) => {
      const peca = await repo.buscarPeca(pecaId);
      if (!peca) throw new NotFoundError('PECA_NAO_ENCONTRADA', 'Peça não encontrada');
      if (!peca.ativo) throw new ConflictError('ITEM_INATIVO', `${peca.nome} está inativo no catálogo`);
      await repo.adicionarPeca(id, pecaId, validarQuantidade(quantidade, peca.tipo === 'PECA'));
    });
  }

  removerItem(id: string, tipo: TipoItem, itemId: string): Promise<DetalheOS> {
    return this.alterarItens(id, async (repo) => {
      if (!(await repo.removerItem(id, tipo, itemId))) {
        throw new NotFoundError('ITEM_NAO_ENCONTRADO', 'Item não encontrado nesta OS');
      }
    });
  }

  /**
   * Publica nova versão do orçamento com preço e descrição congelados (RN04)
   * e leva a OS para AGUARDANDO_APROVACAO.
   */
  publicarOrcamento(id: string, versao: number, autorId: string): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento: repo }) => {
      const os = await bloquear(repo, id);
      exigirVersao(os.versao, versao);
      const para = transicionar(os.status, 'PUBLICAR_ORCAMENTO');

      const itens = await itensPrecificaveis(repo, id);
      const { linhas, totalCentavos } = calcularOrcamento(itens);
      const anteriores = await repo.orcamentos(id);
      await repo.publicarOrcamento(id, (anteriores[0]?.versao ?? 0) + 1, linhas, totalCentavos, autorId);
      await repo.mudarStatus(os, para, autorId);
      return detalhar(repo, id);
    });
  }

  /**
   * Volta ao diagnóstico (RN05). A versão atual do orçamento, pendente ou aprovada, é invalidada
   * e as peças reservadas por ela voltam ao disponível. Uma versão rejeitada continua no histórico.
   */
  reabrirDiagnostico(id: string, versao: number, autorId: string): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento, estoque }) => {
      const os = await bloquear(atendimento, id);
      exigirVersao(os.versao, versao);
      const para = transicionar(os.status, 'REABRIR_DIAGNOSTICO');

      const atual = (await atendimento.orcamentos(id)).find((o) => o.status === 'PENDENTE' || o.status === 'APROVADO');
      if (atual) {
        await liberarReservas(estoque, atual.id, autorId, `Diagnóstico reaberto na ${os.numero}`);
        await atendimento.mudarStatusOrcamento(atual.id, 'INVALIDADO');
      }
      await atendimento.mudarStatus(os, para, autorId);
      return detalhar(atendimento, id);
    });
  }

  private transicao(id: string, versao: number, autorId: string, comando: ComandoOS): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento: repo }) => {
      const os = await bloquear(repo, id);
      exigirVersao(os.versao, versao);
      await repo.mudarStatus(os, transicionar(os.status, comando), autorId);
      return detalhar(repo, id);
    });
  }

  /** Mudança de item incrementa a versão: publicar sobre uma lista que mudou depois da leitura dá 409. */
  private alterarItens(id: string, fn: (repo: AtendimentoRepository) => Promise<void>): Promise<DetalheOS> {
    return this.uow.executar(async ({ atendimento: repo }) => {
      const os = await bloquear(repo, id);
      exigirDiagnostico(os.status);
      await fn(repo);
      await repo.incrementarVersao(id);
      return detalhar(repo, id);
    });
  }
}

export async function bloquear(repo: AtendimentoRepository, id: string): Promise<OrdemServico> {
  return (await repo.buscarOS(id, { bloquear: true })) ?? naoEncontrada();
}

async function itensPrecificaveis(repo: AtendimentoRepository, id: string): Promise<ItemPrecificavel[]> {
  // em sequência: a transação usa uma única conexão
  const servicos = await repo.servicosDaOS(id);
  const pecas = await repo.pecasDaOS(id);
  return [
    ...servicos.map((s) => ({
      tipo: 'SERVICO' as const,
      referenciaId: s.servicoId,
      descricao: s.nome,
      unidade: 'UN',
      quantidade: s.quantidade,
      precoUnitarioCentavos: s.precoUnitarioCentavos,
      ativo: s.ativo,
    })),
    ...pecas.map((p) => ({
      tipo: 'PECA' as const,
      referenciaId: p.pecaId,
      descricao: p.nome,
      unidade: p.unidade,
      quantidade: p.quantidade,
      precoUnitarioCentavos: p.precoUnitarioCentavos,
      ativo: p.ativo,
    })),
  ];
}

export async function detalhar(repo: AtendimentoRepository, id: string): Promise<DetalheOS> {
  const os = (await repo.buscarOS(id)) ?? naoEncontrada();
  const servicos = await repo.servicosDaOS(id);
  const pecas = await repo.pecasDaOS(id);
  const orcamentos = await repo.orcamentos(id);
  const historico = await repo.historico(id);
  const comTotal = <T extends { quantidade: number; precoUnitarioCentavos: number }>(i: T) => ({
    ...i,
    totalCentavos: totalDaLinha(i.quantidade, i.precoUnitarioCentavos),
  });
  const s = servicos.map(comTotal);
  const p = pecas.map(comTotal);
  const estimativaCentavos = [...s, ...p].reduce((soma, i) => soma + i.totalCentavos, 0);
  return { ...os, servicos: s, pecas: p, estimativaCentavos, orcamentos, historico };
}

function naoEncontrada(): never {
  throw new NotFoundError('OS_NAO_ENCONTRADA', 'Ordem de serviço não encontrada');
}
