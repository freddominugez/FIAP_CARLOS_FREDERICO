import type { Perfil } from '../../domain/identidade/perfil.js';

export interface UsuarioComSenha {
  id: string;
  email: string;
  nome: string;
  perfil: Perfil;
  clienteId: string | null;
  senhaHash: string;
  ativo: boolean;
}

export interface NovoUsuarioCliente {
  email: string;
  nome: string;
  clienteId: string;
  senhaHash: string;
}

export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<UsuarioComSenha | null>;
  /** Cria usuário CLIENTE. E-mail em uso ou cliente já vinculado vira ConflictError. */
  criarCliente(dados: NovoUsuarioCliente): Promise<{ id: string }>;
}

export interface VerificadorSenha {
  confere(senha: string, hash: string): Promise<boolean>;
}

export interface GeradorHash {
  gerar(senha: string): Promise<string>;
}
