import bcrypt from 'bcryptjs';
import type { GeradorHash, VerificadorSenha } from '../../application/ports/usuario-repository.js';

const CUSTO = 10;

export class BcryptVerificador implements VerificadorSenha, GeradorHash {
  confere(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  gerar(senha: string): Promise<string> {
    return gerarHash(senha);
  }
}

export function gerarHash(senha: string): Promise<string> {
  return bcrypt.hash(senha, CUSTO);
}
