import { validarQuantidade } from '../../../domain/atendimento/orcamento.js';
import { aplicarEstorno, aplicarMovimento, disponivel } from '../../../domain/estoque/estoque.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { textoOpcional } from '../../../domain/shared/texto.js';
import type { UnidadeTrabalho } from '../../ports/atendimento.js';
import type { Lista, Paginacao } from '../../ports/cadastros.js';
import type { MovimentoEstoque } from '../../ports/estoque.js';

export interface ResultadoMovimento {
  movimento: MovimentoEstoque;
  saldo: { fisico: number; reservado: number; disponivel: number };
}

/**
 * Entrada e ajuste manual de estoque, feitos pelo ADMIN (RN11).
 * ENTRADA soma ao físico. AJUSTE é baixa por perda ou inventário, exige observação
 * e não pode tirar o que está reservado para OS aprovada.
 */
export class MovimentarEstoque {
  constructor(private readonly uow: UnidadeTrabalho) {}

  registrar(
    pecaId: string,
    tipo: 'ENTRADA' | 'AJUSTE',
    quantidade: number,
    observacao: string | undefined,
    autorId: string,
  ): Promise<ResultadoMovimento> {
    return this.uow.executar(async ({ estoque }) => {
      const nota = textoOpcional(observacao);
      if (tipo === 'AJUSTE' && !nota) {
        throw new ValidationError('OBSERVACAO_OBRIGATORIA', 'Ajuste exige observação com o motivo');
      }
      const [peca] = await estoque.bloquearPecas([pecaId]);
      if (!peca) throw new NotFoundError('PECA_NAO_ENCONTRADA', 'Peça não encontrada');
      validarQuantidade(quantidade, peca.tipo === 'PECA');

      const saldo = aplicarMovimento(peca, tipo, quantidade);
      const movimento = await estoque.registrar({
        pecaId,
        tipo,
        quantidade,
        saldo,
        observacao: nota ?? undefined,
        autorId,
      });
      return { movimento, saldo: { ...saldo, disponivel: disponivel(saldo) } };
    });
  }

  /**
   * Estorna entrada, ajuste ou consumo com um movimento novo que aponta para o original (RN07).
   * Cada movimento é estornado uma vez.
   */
  estornar(pecaId: string, movimentoId: string, observacao: string, autorId: string): Promise<ResultadoMovimento> {
    return this.uow.executar(async ({ estoque }) => {
      const nota = textoOpcional(observacao);
      if (!nota) throw new ValidationError('OBSERVACAO_OBRIGATORIA', 'Estorno exige observação com o motivo');
      const [peca] = await estoque.bloquearPecas([pecaId]);
      const original = peca && (await estoque.buscarMovimento(movimentoId));
      if (!original || original.pecaId !== pecaId) {
        throw new NotFoundError('MOVIMENTO_NAO_ENCONTRADO', 'Movimento não encontrado nesta peça');
      }
      if (await estoque.jaEstornado(movimentoId)) {
        throw new ConflictError('MOVIMENTO_JA_ESTORNADO', 'Este movimento já foi estornado');
      }
      const saldo = aplicarEstorno(peca, original.tipo, original.quantidade);
      const movimento = await estoque.registrar({
        pecaId,
        tipo: 'ESTORNO',
        quantidade: original.quantidade,
        saldo,
        referenteA: original.id,
        observacao: nota,
        autorId,
      });
      return { movimento, saldo: { ...saldo, disponivel: disponivel(saldo) } };
    });
  }

  listar(pecaId: string, pagina: Paginacao): Promise<Lista<MovimentoEstoque>> {
    return this.uow.executar(async ({ estoque }) => {
      const lista = await estoque.movimentos(pecaId, pagina);
      if (!lista) throw new NotFoundError('PECA_NAO_ENCONTRADA', 'Peça não encontrada');
      return lista;
    });
  }
}
