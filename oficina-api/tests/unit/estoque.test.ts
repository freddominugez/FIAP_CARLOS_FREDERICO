import { describe, expect, it } from 'vitest';
import { avaliarDecisao } from '../../src/domain/atendimento/decisao.js';
import {
  aplicarMovimento,
  disponivel,
  exigirDisponibilidade,
  somarPorPeca,
} from '../../src/domain/estoque/estoque.js';

describe('aplicarMovimento', () => {
  const saldo = { fisico: 10, reservado: 4 };

  it.each([
    ['ENTRADA', 2, { fisico: 12, reservado: 4 }],
    ['AJUSTE', 6, { fisico: 4, reservado: 4 }],
    ['RESERVA', 6, { fisico: 10, reservado: 10 }],
    ['LIBERACAO', 4, { fisico: 10, reservado: 0 }],
    ['CONSUMO', 4, { fisico: 6, reservado: 0 }],
  ] as const)('%s de %s', (tipo, q, esperado) => {
    expect(aplicarMovimento(saldo, tipo, q)).toEqual(esperado);
  });

  it.each([
    ['AJUSTE', 7], // tiraria o que está reservado
    ['RESERVA', 7], // reservaria mais que o físico
    ['LIBERACAO', 5], // liberaria mais que o reservado
    ['CONSUMO', 5],
  ] as const)('recusa %s de %s', (tipo, q) => {
    expect(() => aplicarMovimento(saldo, tipo, q)).toThrow(expect.objectContaining({ code: 'ESTOQUE_INSUFICIENTE' }));
  });

  it('não acumula erro de ponto flutuante', () => {
    const r = aplicarMovimento({ fisico: 0.3, reservado: 0.1 }, 'RESERVA', 0.2);
    expect(r).toEqual({ fisico: 0.3, reservado: 0.3 });
    expect(disponivel(r)).toBe(0);
  });
});

describe('reserva do orçamento', () => {
  it('soma linhas da mesma peça', () => {
    const total = somarPorPeca([
      { pecaId: 'a', quantidade: 0.1 },
      { pecaId: 'b', quantidade: 1 },
      { pecaId: 'a', quantidade: 0.2 },
    ]);
    expect(total).toEqual(new Map([['a', 0.3], ['b', 1]]));
  });

  it('lista todas as peças em falta', () => {
    const necessidade = new Map([['a', 3], ['b', 1], ['c', 2]]);
    const saldos = [
      { id: 'a', nome: 'Filtro', fisico: 5, reservado: 3 },
      { id: 'b', nome: 'Vela', fisico: 1, reservado: 0 },
      { id: 'c', nome: 'Pastilha', fisico: 1, reservado: 0 },
    ];
    expect(() => exigirDisponibilidade(necessidade, saldos)).toThrow(
      expect.objectContaining({
        code: 'ESTOQUE_INSUFICIENTE',
        message: 'Sem saldo para: Filtro (pedido 3, disponível 2), Pastilha (pedido 2, disponível 1)',
      }),
    );
    expect(() => exigirDisponibilidade(new Map([['b', 1]]), saldos)).not.toThrow();
  });
});

describe('avaliarDecisao', () => {
  it('grava a primeira decisão e reconhece a repetida', () => {
    expect(avaliarDecisao('PENDENTE', null, 'APROVADO')).toBe('NOVA');
    expect(avaliarDecisao('APROVADO', 'APROVADO', 'APROVADO')).toBe('REPETIDA');
    expect(avaliarDecisao('REJEITADO', 'REJEITADO', 'REJEITADO')).toBe('REPETIDA');
  });

  it('recusa trocar a decisão e decidir versão invalidada', () => {
    expect(() => avaliarDecisao('APROVADO', 'APROVADO', 'REJEITADO')).toThrow(
      expect.objectContaining({ code: 'DECISAO_JA_REGISTRADA', status: 409 }),
    );
    expect(() => avaliarDecisao('INVALIDADO', null, 'APROVADO')).toThrow(
      expect.objectContaining({ code: 'ORCAMENTO_OBSOLETO' }),
    );
    expect(() => avaliarDecisao('INVALIDADO', 'APROVADO', 'APROVADO')).toThrow(
      expect.objectContaining({ code: 'ORCAMENTO_OBSOLETO' }),
    );
  });
});
