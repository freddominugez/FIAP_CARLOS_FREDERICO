import { randomUUID } from 'node:crypto';
import type { CadastroRepository, Lista, Paginacao } from '../../src/application/ports/cadastros.js';

/** Repositório em memória para testar casos de uso sem banco. */
export class RepositorioMemoria<T extends { id: string }, Novo extends object, Alteracao extends object>
  implements CadastroRepository<T, Novo, Alteracao, Partial<T>>
{
  readonly itens = new Map<string, T>();
  /** ids que simulam registro com histórico */
  readonly comHistorico = new Set<string>();

  constructor(private readonly padrao: Omit<T, 'id' | keyof Novo>) {}

  async criar(dados: Novo): Promise<T> {
    const item = { ...this.padrao, ...dados, id: randomUUID() } as unknown as T;
    this.itens.set(item.id, item);
    return item;
  }

  async buscar(id: string): Promise<T | null> {
    return this.itens.get(id) ?? null;
  }

  async listar(filtro: Partial<T>, { limite, deslocamento }: Paginacao): Promise<Lista<T>> {
    const todos = [...this.itens.values()].filter((i) =>
      Object.entries(filtro).every(([k, v]) => v === undefined || i[k as keyof T] === v),
    );
    return { itens: todos.slice(deslocamento, deslocamento + limite), total: todos.length };
  }

  async atualizar(id: string, dados: Alteracao): Promise<T | null> {
    const atual = this.itens.get(id);
    if (!atual) return null;
    const definidos = Object.fromEntries(Object.entries(dados).filter(([, v]) => v !== undefined));
    const novo = { ...atual, ...definidos };
    this.itens.set(id, novo);
    return novo;
  }

  async remover(id: string): Promise<boolean> {
    if (this.comHistorico.has(id)) throw new Error('com histórico');
    return this.itens.delete(id);
  }
}
