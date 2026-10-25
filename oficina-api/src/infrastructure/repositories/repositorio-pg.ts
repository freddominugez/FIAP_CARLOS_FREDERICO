import type { CadastroRepository, Lista, Paginacao } from '../../application/ports/cadastros.js';
import { ConflictError } from '../../domain/shared/errors.js';
import type { Db } from '../db/pool.js';

export interface Condicoes {
  where: string[];
  params: unknown[];
}

/** Erro do PostgreSQL com o código SQLSTATE e o nome da constraint. */
interface ErroPg {
  code?: string;
  constraint?: string;
}

/**
 * Base dos repositórios de cadastro. Cada subclasse informa tabela, colunas,
 * mapeamento de linha e filtros. Unicidade e histórico são garantidos pelo banco
 * e traduzidos aqui em ConflictError, sem consulta prévia sujeita a corrida.
 */
export abstract class RepositorioPg<T, Novo, Alteracao, Filtro>
  implements CadastroRepository<T, Novo, Alteracao, Filtro>
{
  protected abstract readonly tabela: string;
  /** Lista do SELECT. */
  protected abstract readonly colunas: string;
  /** Propriedade do objeto de domínio para coluna da tabela. */
  protected abstract readonly campos: Record<string, string>;
  /** Constraint única para [código, mensagem] do conflito. */
  protected abstract readonly unicos: Record<string, [string, string]>;
  protected abstract readonly ordem: string;

  constructor(protected readonly db: Db) {}

  protected abstract mapear(linha: Record<string, unknown>): T;
  protected abstract condicoes(filtro: Filtro): Condicoes;

  async criar(dados: Novo): Promise<T> {
    const pares = this.pares(dados as Record<string, unknown>);
    const sql = `INSERT INTO ${this.tabela} (${pares.map(([c]) => c).join(', ')})
                 VALUES (${pares.map((_, i) => `$${i + 1}`).join(', ')})
                 RETURNING ${this.colunas}`;
    const { rows } = await this.executar(sql, pares.map(([, v]) => v));
    return this.mapear(rows[0]!);
  }

  async buscar(id: string): Promise<T | null> {
    const { rows } = await this.db.query(`SELECT ${this.colunas} FROM ${this.tabela} WHERE id = $1`, [id]);
    return rows[0] ? this.mapear(rows[0]) : null;
  }

  async listar(filtro: Filtro, { limite, deslocamento }: Paginacao): Promise<Lista<T>> {
    const { where, params } = this.condicoes(filtro);
    const clausula = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const n = params.length;
    const { rows } = await this.db.query(
      `SELECT ${this.colunas}, count(*) OVER () AS total_geral
         FROM ${this.tabela} ${clausula}
        ORDER BY ${this.ordem}
        LIMIT $${n + 1} OFFSET $${n + 2}`,
      [...params, limite, deslocamento],
    );
    const total = rows[0] ? Number(rows[0].total_geral) : await this.contar(clausula, params);
    return { itens: rows.map((l) => this.mapear(l)), total };
  }

  async atualizar(id: string, dados: Alteracao): Promise<T | null> {
    const pares = this.pares(dados as Record<string, unknown>);
    if (!pares.length) return this.buscar(id);
    const sets = pares.map(([c], i) => `${c} = $${i + 2}`).join(', ');
    const { rows } = await this.executar(
      `UPDATE ${this.tabela} SET ${sets}, updated_at = now() WHERE id = $1 RETURNING ${this.colunas}`,
      [id, ...pares.map(([, v]) => v)],
    );
    return rows[0] ? this.mapear(rows[0]) : null;
  }

  /** Exclusão física só sem histórico. Com referência, recusa e indica a inativação (RN12). */
  async remover(id: string): Promise<boolean> {
    const { rowCount } = await this.executar(`DELETE FROM ${this.tabela} WHERE id = $1`, [id]);
    return rowCount === 1;
  }

  private async contar(clausula: string, params: unknown[]): Promise<number> {
    const { rows } = await this.db.query(`SELECT count(*) AS n FROM ${this.tabela} ${clausula}`, params);
    return Number(rows[0]?.n ?? 0);
  }

  private pares(dados: Record<string, unknown>): [string, unknown][] {
    return Object.entries(dados)
      .filter(([prop, valor]) => valor !== undefined && prop in this.campos)
      .map(([prop, valor]) => [this.campos[prop]!, valor]);
  }

  private async executar(sql: string, params: unknown[]) {
    try {
      return await this.db.query(sql, params);
    } catch (erro) {
      const { code, constraint } = erro as ErroPg;
      const unico = code === '23505' && constraint ? this.unicos[constraint] : undefined;
      if (unico) throw new ConflictError(...unico);
      if (code === '23503' && sql.startsWith('DELETE')) {
        throw new ConflictError(
          'CADASTRO_COM_HISTORICO',
          'Registro referenciado por outros dados. Inative com PATCH { "ativo": false }',
        );
      }
      if (code === '23503') {
        throw new ConflictError('REFERENCIA_INEXISTENTE', 'Registro relacionado não existe');
      }
      throw erro;
    }
  }
}
