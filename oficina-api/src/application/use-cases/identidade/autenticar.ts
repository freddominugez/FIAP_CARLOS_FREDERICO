import { UnauthorizedError } from '../../../domain/shared/errors.js';
import type { Perfil } from '../../../domain/identidade/perfil.js';
import type { UsuarioRepository, VerificadorSenha } from '../../ports/usuario-repository.js';

export interface Identidade {
  usuarioId: string;
  nome: string;
  perfil: Perfil;
  clienteId: string | null;
}

// Mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails existem.
const CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos';

export class Autenticar {
  constructor(
    private readonly usuarios: Pick<UsuarioRepository, 'buscarPorEmail'>,
    private readonly senhas: VerificadorSenha,
  ) {}

  async executar(email: string, senha: string): Promise<Identidade> {
    const usuario = await this.usuarios.buscarPorEmail(email.trim().toLowerCase());
    if (!usuario?.ativo) {
      throw new UnauthorizedError('CREDENCIAIS_INVALIDAS', CREDENCIAIS_INVALIDAS);
    }
    if (!(await this.senhas.confere(senha, usuario.senhaHash))) {
      throw new UnauthorizedError('CREDENCIAIS_INVALIDAS', CREDENCIAIS_INVALIDAS);
    }
    return {
      usuarioId: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
      clienteId: usuario.clienteId,
    };
  }
}
