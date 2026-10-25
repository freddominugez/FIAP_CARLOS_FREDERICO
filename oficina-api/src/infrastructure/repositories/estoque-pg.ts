import type { Lista, Paginacao, TipoPeca } from '../../application/ports/cadastros.js';
import type {
  EstoqueRepository,
  MovimentoEstoque,
  NovoMovimento,
  ReservaAberta,
} from '../../application/ports/estoque.js';
import type { SaldoPeca, TipoMovimento } from '../../domain/estoque/estoque.js';
import type { Tx } from '../db/pool.js';

const COLUNAS = 'id, part_id, kind, quantity, quote_item_id, reverses_id, note, created_by, created_at';

function mapear(l: Record<string, unknown>): MovimentoEstoque {
  return {
    id: l.id as string,
    pecaId: l.part_id as string,
    tipo: l.kind as TipoMovimento,
    quantidade: Number(l.quantity),
    itemOrcamentoId: l.quote_item_id as string | null,
    referenteA: l.reverses_id as string | null,
    observacao: l.note as string | null,
    autorId: l.created_by as string,
    em: l.created_at as Date,
  };
}

export class EstoquePg implements EstoqueRepository {
  constructor(private readonly tx: Tx) {}

  async bloquearPecas(ids: string[]): Promise<(SaldoPeca & { tipo: TipoPeca })[]> {
    if (!ids.length) return [];
    // ORDER BY id: todas as transações pegam os locks na mesma ordem e não há deadlock
    const { rows } = await this.tx.query(
      `SELECT id, name, kind, physical, reserved FROM parts
        WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`,
      [ids],
    );
    return rows.map((l) => ({
      id: l.id,
      nome: l.name,
      tipo: l.kind,
      fisico: Number(l.physical),
      reservado: Number(l.reserved),
    }));
  }

  async registrar(m: NovoMovimento): Promise<MovimentoEstoque> {
    const { rows } = await this.tx.query(
      `INSERT INTO stock_movements (part_id, kind, quantity, quote_item_id, reverses_id, note, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${COLUNAS}`,
      [m.pecaId, m.tipo, m.quantidade, m.itemOrcamentoId ?? null, m.referenteA ?? null, m.observacao ?? null, m.autorId],
    );
    // a constraint parts_stock_ck segura o saldo mesmo se o domínio errar
    await this.tx.query('UPDATE parts SET physical = $2, reserved = $3, updated_at = now() WHERE id = $1', [
      m.pecaId,
      m.saldo.fisico,
      m.saldo.reservado,
    ]);
    return mapear(rows[0]!);
  }

  async pecasDoOrcamento(orcamentoId: string) {
    const { rows } = await this.tx.query(
      `SELECT id, part_id, quantity FROM quote_items
        WHERE quote_id = $1 AND kind = 'PECA' ORDER BY part_id, id`,
      [orcamentoId],
    );
    return rows.map((l) => ({ itemOrcamentoId: l.id, pecaId: l.part_id, quantidade: Number(l.quantity) }));
  }

  async reservasAbertas(orcamentoId: string): Promise<ReservaAberta[]> {
    const { rows } = await this.tx.query(
      `SELECT m.id, m.part_id, m.quote_item_id, m.quantity
         FROM stock_movements m JOIN quote_items i ON i.id = m.quote_item_id
        WHERE i.quote_id = $1 AND m.kind = 'RESERVA'
          AND NOT EXISTS (SELECT 1 FROM stock_movements l WHERE l.reverses_id = m.id AND l.kind = 'LIBERACAO')
          AND NOT EXISTS (SELECT 1 FROM stock_movements c WHERE c.quote_item_id = m.quote_item_id AND c.kind = 'CONSUMO')
        ORDER BY m.part_id, m.id`,
      [orcamentoId],
    );
    return rows.map((l) => ({
      movimentoId: l.id,
      pecaId: l.part_id,
      itemOrcamentoId: l.quote_item_id,
      quantidade: Number(l.quantity),
    }));
  }

  async consumoDoItem(itemOrcamentoId: string): Promise<MovimentoEstoque | null> {
    const { rows } = await this.tx.query(
      `SELECT ${COLUNAS} FROM stock_movements WHERE quote_item_id = $1 AND kind = 'CONSUMO'`,
      [itemOrcamentoId],
    );
    return rows[0] ? mapear(rows[0]) : null;
  }

  async buscarMovimento(id: string): Promise<MovimentoEstoque | null> {
    const { rows } = await this.tx.query(`SELECT ${COLUNAS} FROM stock_movements WHERE id = $1`, [id]);
    return rows[0] ? mapear(rows[0]) : null;
  }

  async jaEstornado(movimentoId: string): Promise<boolean> {
    const { rowCount } = await this.tx.query(
      `SELECT 1 FROM stock_movements WHERE reverses_id = $1 AND kind = 'ESTORNO'`,
      [movimentoId],
    );
    return rowCount === 1;
  }

  async movimentos(pecaId: string, { limite, deslocamento }: Paginacao): Promise<Lista<MovimentoEstoque> | null> {
    const existe = await this.tx.query('SELECT 1 FROM parts WHERE id = $1', [pecaId]);
    if (!existe.rowCount) return null;
    const { rows } = await this.tx.query(
      `SELECT ${COLUNAS}, count(*) OVER () AS total_geral FROM stock_movements
        WHERE part_id = $1 ORDER BY created_at DESC, id LIMIT $2 OFFSET $3`,
      [pecaId, limite, deslocamento],
    );
    let total = rows[0] ? Number(rows[0].total_geral) : 0;
    if (!rows[0] && deslocamento > 0) {
      const c = await this.tx.query('SELECT count(*) AS n FROM stock_movements WHERE part_id = $1', [pecaId]);
      total = Number(c.rows[0]?.n ?? 0);
    }
    return { itens: rows.map(mapear), total };
  }
}
