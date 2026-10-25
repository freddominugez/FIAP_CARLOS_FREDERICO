import { ValidationError } from '../shared/errors.js';

export type TipoDocumento = 'CPF' | 'CNPJ';

export interface Documento {
  /** Sem pontuação, em maiúsculas. */
  valor: string;
  tipo: TipoDocumento;
}

const PESOS_CPF_1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CPF_2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Valida e normaliza CPF ou CNPJ (RN01).
 * O CNPJ aceita o formato alfanumérico da IN RFB 2.229/2024: 12 posições com letras ou números
 * e 2 dígitos verificadores numéricos. Cada caractere vale seu código ASCII menos 48.
 */
export function criarDocumento(entrada: string): Documento {
  const valor = entrada.replace(/[\s./-]/g, '').toUpperCase();

  if (/^\d{11}$/.test(valor) && cpfValido(valor)) return { valor, tipo: 'CPF' };
  if (/^[\dA-Z]{12}\d{2}$/.test(valor) && cnpjValido(valor)) return { valor, tipo: 'CNPJ' };

  throw new ValidationError('DOCUMENTO_INVALIDO', 'CPF ou CNPJ inválido');
}

function cpfValido(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const digitos = [...cpf].map(Number);
  return dvCpf(digitos, PESOS_CPF_1) === digitos[9] && dvCpf(digitos, PESOS_CPF_2) === digitos[10];
}

function dvCpf(digitos: number[], pesos: number[]): number {
  const resto = (soma(digitos, pesos) * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function cnpjValido(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  const valores = [...cnpj].map((c) => c.codePointAt(0)! - 48);
  return dvCnpj(valores, PESOS_CNPJ_1) === valores[12] && dvCnpj(valores, PESOS_CNPJ_2) === valores[13];
}

function dvCnpj(valores: number[], pesos: number[]): number {
  const resto = soma(valores, pesos) % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function soma(valores: number[], pesos: number[]): number {
  return pesos.reduce((total, peso, i) => total + peso * (valores[i] ?? 0), 0);
}
