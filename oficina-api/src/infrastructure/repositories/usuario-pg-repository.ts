import type {
  NovoUsuarioCliente,
  UsuarioComSenha,
  UsuarioRepository,
} from '../../application/ports/usuario-repository.js';
import { isPerfil } from '../../domain/identidade/perfil.js';
import { ConflictError } from '../../domain/shared/errors.js';
import type { Db } from '../db/pool.js';

interface Linha {
  id: string;
  email: string;
  name: string;
  role: string;
  customer_id: string | null;
  password_hash: string;
  active: boolean;
}

const CONFLITOS: Record<string, [string, string]> = {
  users_email_key: ['EMAIL_EM_USO', 'E-mail já usado por outro usuário'],
  users_customer_uk: ['CLIENTE_JA_TEM_ACESSO', 'Cliente já tem usuário de acesso'],
};

export class UsuarioPgRepository implements UsuarioRepository {
  constructor(private readonly db: Db) {}

  async buscarPorEmail(email: string): Promise<UsuarioComSenha | null> {
    const { rows } = await this.db.query<Linha>(
      `SELECT id, email, name, role, customer_id, password_hash, active
         FROM users WHERE email = $1`,
      [email],
    );
    const l = rows[0];
    if (!l) return null;
    if (!isPerfil(l.role)) throw new Error(`Perfil desconhecido no banco: ${l.role}`);
    return {
      id: l.id,
      email: l.email,
      nome: l.name,
      perfil: l.role,
      clienteId: l.customer_id,
      senhaHash: l.password_hash,
      ativo: l.active,
    };
  }

  async criarCliente(dados: NovoUsuarioCliente): Promise<{ id: string }> {
    try {
      const { rows } = await this.db.query<{ id: string }>(
        `INSERT INTO users (email, name, role, customer_id, password_hash)
         VALUES ($1, $2, 'CLIENTE', $3, $4) RETURNING id`,
        [dados.email, dados.nome, dados.clienteId, dados.senhaHash],
      );
      return rows[0]!;
    } catch (erro) {
      const conflito = CONFLITOS[(erro as { constraint?: string }).constraint ?? ''];
      if ((erro as { code?: string }).code === '23505' && conflito) throw new ConflictError(...conflito);
      throw erro;
    }
  }
}
