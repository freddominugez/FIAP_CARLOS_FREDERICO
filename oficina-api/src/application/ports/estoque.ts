import type { SaldoPeca, TipoMovimento } from '../../domain/estoque/estoque.js';
import type { Lista, Paginacao, TipoPeca } from './cadastros.js';

export interface MovimentoEstoque {
  id: string;
  pecaId: string;
  tipo: TipoMovimento;
  quantidade: number;
  itemOrcamentoId: string | null;
  referenteA: string | null;
  observacao: string | null;
  autorId: string;
  em: Date;
}

export interface NovoMovimento {
  pecaId: string;
  tipo: TipoMovimento;
  quantidade: number;
  /** saldo resultante, já validado no domínio */
  saldo: { fisico: number; reservado: number };
  itemOrcamentoId?: string;
  /** movimento que este desfaz ou encerra (liberação e consumo apontam para a reserva, estorno para o original) */
  referenteA?: string;
  observacao?: string;
  autorId: string;
}

export interface ReservaAberta {
  movimentoId: string;
  pecaId: string;
  itemOrcamentoId: string;
  quantidade: number;
}

/** Movimentos são só inseridos (RN07). O saldo da peça é atualizado na mesma transação. */
export interface EstoqueRepository {
  /** Bloqueia as peças em ordem de UUID, para duas transações nunca esperarem uma pela outra em ciclo (RN06). */
  bloquearPecas(ids: string[]): Promise<(SaldoPeca & { tipo: TipoPeca })[]>;
  registrar(movimento: NovoMovimento): Promise<MovimentoEstoque>;
  /** Linhas de peça de uma versão do orçamento. */
  pecasDoOrcamento(orcamentoId: string): Promise<{ itemOrcamentoId: string; pecaId: string; quantidade: number }[]>;
  /** Reservas do orçamento que ainda não foram liberadas nem consumidas. */
  reservasAbertas(orcamentoId: string): Promise<ReservaAberta[]>;
  /** null quando a peça não existe. */
  consumoDoItem(itemOrcamentoId: string): Promise<MovimentoEstoque | null>;
  buscarMovimento(id: string): Promise<MovimentoEstoque | null>;
  jaEstornado(movimentoId: string): Promise<boolean>;
  movimentos(pecaId: string, pagina: Paginacao): Promise<Lista<MovimentoEstoque> | null>;
}
