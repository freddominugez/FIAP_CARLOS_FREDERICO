import { describe, expect, it } from 'vitest';
import {
  calcularOrcamento,
  precificar,
  totalDaLinha,
  validarQuantidade,
  type ItemPrecificavel,
} from '../../src/domain/atendimento/orcamento.js';

// T02: cálculo do orçamento em centavos.
const item = (parcial: Partial<ItemPrecificavel>): ItemPrecificavel => ({
  tipo: 'SERVICO',
  referenciaId: 'r',
  descricao: 'Troca de óleo',
  unidade: 'UN',
  quantidade: 1,
  precoUnitarioCentavos: 8000,
  ativo: true,
  ...parcial,
});

describe('totalDaLinha', () => {
  it.each([
    [2, 8000, 16000],
    [4.5, 4599, 20696], // 20.695,5 arredonda para cima
    [0.333, 100, 33], // 33,3
    [0.001, 1, 0], // 0,001 centavo
    [1.005, 1000, 1005],
    [0.1, 3, 0], // 0,3
    [0.5, 1, 1], // meio centavo sobe
  ])('%s x %s = %s', (quantidade, preco, total) => {
    expect(totalDaLinha(quantidade, preco)).toBe(total);
  });

  it('não perde precisão em valores grandes', () => {
    expect(totalDaLinha(100_000, 10_000_000_000)).toBe(1_000_000_000_000_000);
  });

  it('recusa total acima do inteiro seguro', () => {
    expect(() => totalDaLinha(100_000, 100_000_000_000_000)).toThrow(expect.objectContaining({ code: 'VALOR_EXCESSIVO' }));
  });
});

describe('validarQuantidade', () => {
  it('aceita inteiro para peça e até 3 casas para insumo', () => {
    expect(validarQuantidade(3, true)).toBe(3);
    expect(validarQuantidade(0.25, false)).toBe(0.25);
    expect(validarQuantidade(1.005, false)).toBe(1.005);
  });

  it.each([
    [1.5, true],
    [0, false],
    [-1, false],
    [0.0001, false],
    [100_001, false],
    [Number.NaN, false],
  ])('recusa %s (inteira=%s)', (q, inteira) => {
    expect(() => validarQuantidade(q, inteira)).toThrow(expect.objectContaining({ code: 'QUANTIDADE_INVALIDA' }));
  });
});

describe('calcularOrcamento', () => {
  it('soma serviços e peças e devolve linhas sem o campo ativo', () => {
    const r = calcularOrcamento([
      item({ quantidade: 2 }),
      item({ tipo: 'PECA', descricao: 'Filtro', quantidade: 4, precoUnitarioCentavos: 3500 }),
      item({ tipo: 'PECA', descricao: 'Óleo', unidade: 'L', quantidade: 4.5, precoUnitarioCentavos: 4599 }),
    ]);
    expect(r.totalCentavos).toBe(16000 + 14000 + 20696);
    expect(r.linhas.map((l) => l.totalCentavos)).toEqual([16000, 14000, 20696]);
    expect(r.linhas[0]).not.toHaveProperty('ativo');
  });

  it('recusa orçamento vazio e item inativo', () => {
    expect(() => calcularOrcamento([])).toThrow(expect.objectContaining({ code: 'ORCAMENTO_SEM_ITENS', status: 409 }));
    expect(() => calcularOrcamento([item({}), item({ descricao: 'Alinhamento', ativo: false })])).toThrow(
      expect.objectContaining({ code: 'ITEM_INATIVO', message: expect.stringContaining('Alinhamento') }),
    );
  });

  it('precificar não aplica as regras de publicação', () => {
    expect(precificar([]).totalCentavos).toBe(0);
    expect(precificar([item({ ativo: false })]).totalCentavos).toBe(8000);
  });
});
