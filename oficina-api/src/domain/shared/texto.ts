import { ValidationError } from './errors.js';

/** Tira espaços das pontas e recusa texto vazio. */
export function textoObrigatorio(valor: string, campo: string): string {
  const limpo = valor.trim();
  if (!limpo) throw new ValidationError('CAMPO_OBRIGATORIO', `${campo} é obrigatório`);
  return limpo;
}

/** Texto opcional: vazio vira null. */
export function textoOpcional(valor: string | null | undefined): string | null {
  const limpo = valor?.trim();
  return limpo || null;
}
