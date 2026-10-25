import type {
  AtendimentoRepository,
  FiltroOS,
  ItemPecaOS,
  ItemServicoOS,
  MudancaStatus,
  Orcamento,
  OrdemServico,
  ReferenciaOrcamento,
  RegistroIdempotente,
  Repositorios,
  StatusOrcamento,
  UnidadeTrabalho,
} from '../../application/ports/atendimento.js';
import type { Lista, Paginacao, TipoPeca, Unidade } from '../../application/ports/cadastros.js';
import type { Decisao } from '../../domain/atendimento/decisao.js';
import type { LinhaOrcamento, TipoItem } from '../../domain/atendimento/orcamento.js';
import { isStatusOS, type StatusOS } from '../../domain/atendimento/ordem-servico.js';
import { emTransacao, type Db, type Tx } from '../db/pool.js';
import { EstoquePg } from './estoque-pg.js';

type Linha = Record<string, unknown>;

const COLUNAS_OS = `id, number, status, version, customer_id, vehicle_id, complaint, created_by,
  received_at, execution_started_at, finalized_at, delivered_at`;

function status(valor: unknown): StatusOS {
  if (!isStatusOS(valor)) throw new Error(`Status desconhecido no banco: ${String(valor)}`);
  return valor;
}

function mapearOS(l: Linha): OrdemServico {
  return {
    id: l.id as string,
    numero: l.number as string,
    status: status(l.status),
    versao: l.version as number,
    clienteId: l.customer_id as string,
    veiculoId: l.vehicle_id as string,
    solicitacao: l.complaint as string,
    criadaPor: l.created_by as string,
    recebidaEm: l.received_at as Date,
    execucaoIniciadaEm: l.execution_started_at as Date | null,
    finalizadaEm: l.finalized_at as Date | null,
    entregueEm: l.delivered_at as Date | null,
  };
}

/** Repositório do Atendimento ligado a uma conexão em transação. */
export class AtendimentoPg implements AtendimentoRepository {
  constructor(private readonly tx: Tx) {}

  async buscarOS(id: string, opcoes: { bloquear?: boolean } = {}): Promise<OrdemServico | null> {
    const { rows } = await this.tx.query(
      `SELECT ${COLUNAS_OS} FROM service_orders WHERE id = $1 ${opcoes.bloquear ? 'FOR UPDATE' : ''}`,
      [id],
    );
    return rows[0] ? mapearOS(rows[0]) : null;
  }

  async listarOS(filtro: FiltroOS, { limite, deslocamento }: Paginacao): Promise<Lista<OrdemServico>> {
    const { rows } = await this.tx.query(
      `SELECT ${COLUNAS_OS}, count(*) OVER () AS total_geral
         FROM service_orders
        WHERE ($1::varchar IS NULL OR status = $1) AND ($2::uuid IS NULL OR customer_id = $2)
        ORDER BY received_at DESC, id
        LIMIT $3 OFFSET $4`,
      [filtro.status ?? null, filtro.clienteId ?? null, limite, deslocamento],
    );
    let total = rows[0] ? Number(rows[0].total_geral) : 0;
    if (!rows[0] && deslocamento > 0) {
      const contagem = await this.tx.query(
        `SELECT count(*) AS n FROM service_orders
          WHERE ($1::varchar IS NULL OR status = $1) AND ($2::uuid IS NULL OR customer_id = $2)`,
        [filtro.status ?? null, filtro.clienteId ?? null],
      );
      total = Number(contagem.rows[0]?.n ?? 0);
    }
    return { itens: rows.map(mapearOS), total };
  }

  async inserirOS(dados: { clienteId: string; veiculoId: string; solicitacao: string; criadaPor: string }) {
    // número público OS-AAAA-NNNNNN, ano no fuso da oficina (RN03)
    const { rows } = await this.tx.query(
      `INSERT INTO service_orders (number, customer_id, vehicle_id, status, complaint, created_by)
       VALUES ('OS-' || to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY') || '-' ||
               lpad(nextval('service_order_number_seq')::text, 6, '0'),
               $1, $2, 'RECEBIDA', $3, $4)
       RETURNING ${COLUNAS_OS}`,
      [dados.clienteId, dados.veiculoId, dados.solicitacao, dados.criadaPor],
    );
    const os = mapearOS(rows[0]!);
    await this.registrarHistorico(os.id, null, 'RECEBIDA', dados.criadaPor);
    return os;
  }

  async mudarStatus(os: OrdemServico, para: StatusOS, autorId: string): Promise<OrdemServico> {
    const { rows } = await this.tx.query(
      `UPDATE service_orders
          SET status = $2::varchar,
              version = version + 1,
              execution_started_at = CASE WHEN $2::varchar = 'EM_EXECUCAO' THEN now() ELSE execution_started_at END,
              finalized_at = CASE WHEN $2::varchar = 'FINALIZADA' THEN now() ELSE finalized_at END,
              delivered_at = CASE WHEN $2::varchar = 'ENTREGUE' THEN now() ELSE delivered_at END
        WHERE id = $1
        RETURNING ${COLUNAS_OS}`,
      [os.id, para],
    );
    await this.registrarHistorico(os.id, os.status, para, autorId);
    return mapearOS(rows[0]!);
  }

  async incrementarVersao(osId: string): Promise<void> {
    await this.tx.query('UPDATE service_orders SET version = version + 1 WHERE id = $1', [osId]);
  }

  async concluirServico(osId: string, itemId: string): Promise<void> {
    await this.tx.query(
      'UPDATE order_service_items SET completed_at = now() WHERE id = $1 AND order_id = $2 AND completed_at IS NULL',
      [itemId, osId],
    );
  }

  async tempoMedioExecucao(de: Date, ate: Date) {
    const { rows } = await this.tx.query<{ media: number | null; amostra: number }>(
      `SELECT avg(extract(epoch FROM finalized_at - execution_started_at))::float8 AS media, count(*)::int AS amostra
         FROM service_orders
        WHERE finalized_at >= $1 AND finalized_at < $2 AND execution_started_at IS NOT NULL`,
      [de, ate],
    );
    const { media, amostra } = rows[0]!;
    return { mediaSegundos: media === null ? null : Math.round(media), amostra };
  }

  async historico(osId: string): Promise<MudancaStatus[]> {
    const { rows } = await this.tx.query(
      `SELECT from_status, to_status, changed_by, changed_at
         FROM status_history WHERE order_id = $1 ORDER BY changed_at, id`,
      [osId],
    );
    return rows.map((l) => ({
      de: l.from_status === null ? null : status(l.from_status),
      para: status(l.to_status),
      autorId: l.changed_by,
      em: l.changed_at,
    }));
  }

  async buscarCliente(id: string) {
    const { rows } = await this.tx.query<{ active: boolean }>('SELECT active FROM customers WHERE id = $1', [id]);
    return rows[0] ? { ativo: rows[0].active } : null;
  }

  async buscarVeiculo(id: string) {
    const { rows } = await this.tx.query<{ customer_id: string; active: boolean }>(
      'SELECT customer_id, active FROM vehicles WHERE id = $1',
      [id],
    );
    return rows[0] ? { clienteId: rows[0].customer_id, ativo: rows[0].active } : null;
  }

  async buscarServico(id: string) {
    const { rows } = await this.tx.query<{ name: string; active: boolean }>(
      'SELECT name, active FROM service_catalog WHERE id = $1',
      [id],
    );
    return rows[0] ? { nome: rows[0].name, ativo: rows[0].active } : null;
  }

  async buscarPeca(id: string) {
    const { rows } = await this.tx.query<{ name: string; kind: TipoPeca; active: boolean }>(
      'SELECT name, kind, active FROM parts WHERE id = $1',
      [id],
    );
    return rows[0] ? { nome: rows[0].name, tipo: rows[0].kind, ativo: rows[0].active } : null;
  }

  async adicionarServico(osId: string, servicoId: string, quantidade: number): Promise<void> {
    await this.tx.query('INSERT INTO order_service_items (order_id, service_id, quantity) VALUES ($1, $2, $3)', [
      osId,
      servicoId,
      quantidade,
    ]);
  }

  async adicionarPeca(osId: string, pecaId: string, quantidade: number): Promise<void> {
    await this.tx.query('INSERT INTO order_part_items (order_id, part_id, quantity) VALUES ($1, $2, $3)', [
      osId,
      pecaId,
      quantidade,
    ]);
  }

  async removerItem(osId: string, tipo: TipoItem, itemId: string): Promise<boolean> {
    const tabela = tipo === 'SERVICO' ? 'order_service_items' : 'order_part_items';
    const { rowCount } = await this.tx.query(`DELETE FROM ${tabela} WHERE id = $1 AND order_id = $2`, [itemId, osId]);
    return rowCount === 1;
  }

  async servicosDaOS(osId: string): Promise<ItemServicoOS[]> {
    const { rows } = await this.tx.query(
      `SELECT i.id, i.service_id, s.name, i.quantity, s.price_cents, s.active, i.completed_at
         FROM order_service_items i JOIN service_catalog s ON s.id = i.service_id
        WHERE i.order_id = $1 ORDER BY s.name, i.id`,
      [osId],
    );
    return rows.map((l) => ({
      id: l.id,
      servicoId: l.service_id,
      nome: l.name,
      quantidade: l.quantity,
      precoUnitarioCentavos: l.price_cents,
      ativo: l.active,
      concluidoEm: l.completed_at,
    }));
  }

  async pecasDaOS(osId: string): Promise<ItemPecaOS[]> {
    const { rows } = await this.tx.query(
      `SELECT i.id, i.part_id, p.sku, p.name, p.kind, p.unit, i.quantity, p.price_cents, p.active
         FROM order_part_items i JOIN parts p ON p.id = i.part_id
        WHERE i.order_id = $1 ORDER BY p.name, i.id`,
      [osId],
    );
    return rows.map((l) => ({
      id: l.id,
      pecaId: l.part_id,
      sku: l.sku,
      nome: l.name,
      tipo: l.kind as TipoPeca,
      unidade: l.unit as Unidade,
      // numeric chega do pg como string
      quantidade: Number(l.quantity),
      precoUnitarioCentavos: l.price_cents,
      ativo: l.active,
    }));
  }

  async orcamentos(osId: string): Promise<Orcamento[]> {
    const { rows: cabecalhos } = await this.tx.query(
      `SELECT q.id, q.version, q.status, q.total_cents, q.published_by, q.published_at,
              d.decision, d.reason, d.decided_by, d.decided_at
         FROM quotes q LEFT JOIN quote_decisions d ON d.quote_id = q.id
        WHERE q.order_id = $1 ORDER BY q.version DESC`,
      [osId],
    );
    if (!cabecalhos.length) return [];
    const { rows: itens } = await this.tx.query(
      `SELECT i.id, i.quote_id, i.kind, i.service_id, i.part_id, i.description, i.unit, i.quantity,
              i.unit_price_cents, i.total_cents, c.created_at AS consumed_at
         FROM quote_items i
         LEFT JOIN stock_movements c ON c.quote_item_id = i.id AND c.kind = 'CONSUMO'
        WHERE i.quote_id = ANY($1::uuid[]) ORDER BY i.kind DESC, i.description, i.id`,
      [cabecalhos.map((c) => c.id)],
    );
    return cabecalhos.map((c) => ({
      id: c.id,
      versao: c.version,
      status: c.status,
      totalCentavos: c.total_cents,
      publicadoPor: c.published_by,
      publicadoEm: c.published_at,
      decisao: c.decision
        ? { decisao: c.decision, motivo: c.reason, decididoPor: c.decided_by, decididoEm: c.decided_at }
        : null,
      itens: itens
        .filter((i) => i.quote_id === c.id)
        .map((i) => ({
          id: i.id,
          tipo: i.kind as TipoItem,
          referenciaId: (i.service_id ?? i.part_id) as string,
          descricao: i.description,
          unidade: i.unit,
          quantidade: Number(i.quantity),
          precoUnitarioCentavos: i.unit_price_cents,
          totalCentavos: i.total_cents,
          consumidoEm: i.consumed_at,
        })),
    }));
  }

  async publicarOrcamento(
    osId: string,
    versao: number,
    linhas: LinhaOrcamento[],
    totalCentavos: number,
    autorId: string,
  ): Promise<void> {
    const { rows } = await this.tx.query<{ id: string }>(
      `INSERT INTO quotes (order_id, version, total_cents, published_by) VALUES ($1, $2, $3, $4) RETURNING id`,
      [osId, versao, totalCentavos, autorId],
    );
    const quoteId = rows[0]!.id;
    for (const l of linhas) {
      await this.tx.query(
        `INSERT INTO quote_items
           (quote_id, kind, service_id, part_id, description, unit, quantity, unit_price_cents, total_cents)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          quoteId,
          l.tipo,
          l.tipo === 'SERVICO' ? l.referenciaId : null,
          l.tipo === 'PECA' ? l.referenciaId : null,
          l.descricao,
          l.unidade,
          l.quantidade,
          l.precoUnitarioCentavos,
          l.totalCentavos,
        ],
      );
    }
  }

  async buscarOrcamento(id: string): Promise<ReferenciaOrcamento | null> {
    const { rows } = await this.tx.query(
      `SELECT q.id, q.order_id, q.version, q.status, d.decision
         FROM quotes q LEFT JOIN quote_decisions d ON d.quote_id = q.id
        WHERE q.id = $1`,
      [id],
    );
    const l = rows[0];
    return l ? { id: l.id, osId: l.order_id, versao: l.version, status: l.status, decisao: l.decision } : null;
  }

  async mudarStatusOrcamento(id: string, status: StatusOrcamento): Promise<void> {
    await this.tx.query('UPDATE quotes SET status = $2 WHERE id = $1', [id, status]);
  }

  async registrarDecisao(orcamentoId: string, decisao: Decisao, motivo: string | null, autorId: string) {
    await this.tx.query(
      'INSERT INTO quote_decisions (quote_id, decision, reason, decided_by) VALUES ($1, $2, $3, $4)',
      [orcamentoId, decisao, motivo, autorId],
    );
  }

  async buscarIdempotencia(usuarioId: string, chave: string): Promise<RegistroIdempotente | null> {
    await this.tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${usuarioId}:${chave}`]);
    const { rows } = await this.tx.query(
      `SELECT operation, request_hash, response_status, response_body
         FROM idempotency_keys WHERE user_id = $1 AND key = $2`,
      [usuarioId, chave],
    );
    const l = rows[0];
    return l ? { operacao: l.operation, hash: l.request_hash, status: l.response_status, corpo: l.response_body } : null;
  }

  async salvarIdempotencia(usuarioId: string, chave: string, r: RegistroIdempotente): Promise<void> {
    await this.tx.query(
      `INSERT INTO idempotency_keys (key, user_id, operation, request_hash, response_status, response_body)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [chave, usuarioId, r.operacao, r.hash, r.status, JSON.stringify(r.corpo)],
    );
  }

  private async registrarHistorico(osId: string, de: StatusOS | null, para: StatusOS, autorId: string) {
    await this.tx.query(
      'INSERT INTO status_history (order_id, from_status, to_status, changed_by) VALUES ($1, $2, $3, $4)',
      [osId, de, para, autorId],
    );
  }
}

export class UnidadeTrabalhoPg implements UnidadeTrabalho {
  constructor(private readonly db: Db) {}

  executar<T>(fn: (repos: Repositorios) => Promise<T>): Promise<T> {
    return emTransacao(this.db, (tx) => fn({ atendimento: new AtendimentoPg(tx), estoque: new EstoquePg(tx) }));
  }
}
