import { ValidationError } from '../shared/errors.js';

const PLACA = /^[A-Z]{3}\d[A-Z\d]\d{2}$/;

/**
 * Placa no padrão antigo (AAA9999) ou Mercosul (AAA9A99), em maiúsculas e sem hífen (RN02).
 */
export function normalizarPlaca(entrada: string): string {
  const placa = entrada.replace(/[\s-]/g, '').toUpperCase();
  if (!PLACA.test(placa)) throw new ValidationError('PLACA_INVALIDA', 'Placa fora do padrão AAA9999 ou AAA9A99');
  return placa;
}

/** Ano entre 1900 e o ano corrente mais um (RN02). */
export function validarAno(ano: number, hoje: Date = new Date()): number {
  const maximo = hoje.getUTCFullYear() + 1;
  if (!Number.isInteger(ano) || ano < 1900 || ano > maximo) {
    throw new ValidationError('ANO_INVALIDO', `Ano deve estar entre 1900 e ${maximo}`);
  }
  return ano;
}
