import { avaliarDecisao, type Decisao } from '../../../domain/atendimento/decisao.js';
import { ConflictError, NotFoundError } from '../../../domain/shared/errors.js';
import { textoOpcional } from '../../../domain/shared/texto.js';
import type { Orcamento, UnidadeTrabalho } from '../../ports/atendimento.js';
import { reservarOrcamento } from '../estoque/reservas.js';
import { hashCorpo } from './idempotencia.js';

export interface ResultadoDecisao {
  osId: string;
  numeroOS: string;
  orcamento: Orcamento;
  repetida: boolean;
}

const OPERACAO = 'DECIDIR_ORCAMENTO';

/**
 * Aprovação ou rejeição do orçamento pelo cliente dono da OS (RN05, RN06).
 * Aprovar reserva todas as peças na mesma transação. Nenhuma das duas decisões muda o status da OS:
 * a aprovação libera o início da execução e a rejeição o bloqueia até a reabertura do diagnóstico.
 */
export class DecidirOrcamento {
  constructor(private readonly uow: UnidadeTrabalho) {}

  executar(
    orcamentoId: string,
    decisao: Decisao,
    motivo: string | undefined,
    usuario: { id: string; clienteId: string | null },
    chave?: string,
  ): Promise<ResultadoDecisao> {
    return this.uow.executar(async ({ atendimento, estoque }) => {
      const nota = textoOpcional(motivo);
      const hash = hashCorpo({ orcamentoId, decisao, motivo: nota });

      if (chave) {
        const anterior = await atendimento.buscarIdempotencia(usuario.id, chave);
        if (anterior && (anterior.operacao !== OPERACAO || anterior.hash !== hash)) {
          throw new ConflictError('IDEMPOTENCIA_CONFLITO', 'Chave de idempotência já usada com outro conteúdo');
        }
      }

      // OS de outro cliente responde como inexistente, para não revelar que ela existe (BOLA)
      const referencia = await atendimento.buscarOrcamento(orcamentoId);
      const os = referencia && (await atendimento.buscarOS(referencia.osId, { bloquear: true }));
      if (!os || os.clienteId !== usuario.clienteId) {
        throw new NotFoundError('ORCAMENTO_NAO_ENCONTRADO', 'Orçamento não encontrado');
      }

      // relê depois do lock: outra decisão ou uma reabertura pode ter terminado enquanto esperava
      const atual = (await atendimento.buscarOrcamento(orcamentoId))!;
      const repetida = avaliarDecisao(atual.status, atual.decisao, decisao) === 'REPETIDA';
      if (!repetida) {
        if (decisao === 'APROVADO') await reservarOrcamento(estoque, orcamentoId, usuario.id);
        await atendimento.mudarStatusOrcamento(orcamentoId, decisao);
        await atendimento.registrarDecisao(orcamentoId, decisao, nota, usuario.id);
        await atendimento.incrementarVersao(os.id);
      }
      if (chave && !(await atendimento.buscarIdempotencia(usuario.id, chave))) {
        await atendimento.salvarIdempotencia(usuario.id, chave, {
          operacao: OPERACAO,
          hash,
          status: 200,
          corpo: { id: orcamentoId },
        });
      }

      const orcamento = (await atendimento.orcamentos(os.id)).find((o) => o.id === orcamentoId)!;
      return { osId: os.id, numeroOS: os.numero, orcamento, repetida };
    });
  }
}
