import { describe, expect, it } from 'vitest';
import { criarDocumento } from '../../src/domain/cadastros/documento.js';
import { normalizarPlaca, validarAno } from '../../src/domain/cadastros/veiculo.js';
import { textoObrigatorio, textoOpcional } from '../../src/domain/shared/texto.js';

// T01: CPF, CNPJ e placa válidos e inválidos.
describe('criarDocumento', () => {
  it.each([
    ['529.982.247-25', '52998224725'],
    ['11144477735', '11144477735'],
  ])('aceita CPF %s', (entrada, valor) => {
    expect(criarDocumento(entrada)).toEqual({ valor, tipo: 'CPF' });
  });

  it.each([
    ['11.222.333/0001-81', '11222333000181'],
    // exemplo publicado pela Receita para o CNPJ alfanumérico (IN RFB 2.229/2024)
    ['12.ABC.345/01DE-35', '12ABC34501DE35'],
    ['12abc34501de35', '12ABC34501DE35'],
  ])('aceita CNPJ %s', (entrada, valor) => {
    expect(criarDocumento(entrada)).toEqual({ valor, tipo: 'CNPJ' });
  });

  it.each([
    '529.982.247-24', // dígito errado
    '111.111.111-11', // sequência repetida
    '11.111.111/1111-11',
    '11.222.333/0001-82',
    '12.ABC.345/01DE-36',
    '12ABC34501DEA5', // verificador com letra
    '1234567890', // curto
    '',
  ])('recusa %s', (entrada) => {
    expect(() => criarDocumento(entrada)).toThrow(expect.objectContaining({ code: 'DOCUMENTO_INVALIDO', status: 400 }));
  });
});

describe('normalizarPlaca', () => {
  it.each([
    ['ABC-1234', 'ABC1234'],
    ['abc1d23', 'ABC1D23'],
    [' BRA 2E19 ', 'BRA2E19'],
  ])('normaliza %s', (entrada, placa) => {
    expect(normalizarPlaca(entrada)).toBe(placa);
  });

  it.each(['AB12345', 'ABCD123', 'ABC12D3', '1BC1234', 'ABC123'])('recusa %s', (entrada) => {
    expect(() => normalizarPlaca(entrada)).toThrow(expect.objectContaining({ code: 'PLACA_INVALIDA' }));
  });
});

describe('validarAno', () => {
  const hoje = new Date('2026-10-25T12:00:00Z');

  it('aceita de 1900 até o ano seguinte', () => {
    expect(validarAno(1900, hoje)).toBe(1900);
    expect(validarAno(2027, hoje)).toBe(2027);
  });

  it.each([1899, 2028, 2020.5])('recusa %s', (ano) => {
    expect(() => validarAno(ano, hoje)).toThrow(expect.objectContaining({ code: 'ANO_INVALIDO' }));
  });
});

describe('texto', () => {
  it('recusa obrigatório vazio e limpa espaços', () => {
    expect(textoObrigatorio('  Ana  ', 'nome')).toBe('Ana');
    expect(() => textoObrigatorio('   ', 'nome')).toThrow(expect.objectContaining({ code: 'CAMPO_OBRIGATORIO' }));
  });

  it('transforma opcional vazio em null', () => {
    expect(textoOpcional('  ')).toBeNull();
    expect(textoOpcional(undefined)).toBeNull();
    expect(textoOpcional(' x ')).toBe('x');
  });
});
