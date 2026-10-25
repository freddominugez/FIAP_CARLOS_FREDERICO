import { describe, expect, it } from 'vitest';
import { exigirAprovado, exigirServicosConcluidos, validarPeriodo } from '../../src/domain/atendimento/execucao.js';
import { exigirExecucao } from '../../src/domain/atendimento/ordem-servico.js';
import { aplicarEstorno } from '../../src/domain/estoque/estoque.js';

describe('pré-condições da execução', () => {
  it('só inicia com a versão atual aprovada', () => {
    expect(() => exigirAprovado('APROVADO')).not.toThrow();
    expect(() => exigirAprovado('REJEITADO')).toThrow(
      expect.objectContaining({ code: 'ORCAMENTO_NAO_APROVADO', message: expect.stringContaining('rejeitado') }),
    );
    expect(() => exigirAprovado('PENDENTE')).toThrow(expect.objectContaining({ message: expect.stringContaining('ainda não') }));
    expect(() => exigirAprovado(undefined)).toThrow(expect.objectContaining({ code: 'ORCAMENTO_NAO_APROVADO' }));
  });

  it('finaliza só com todos os serviços concluídos', () => {
    expect(() => exigirServicosConcluidos([{ nome: 'Revisão', concluidoEm: new Date() }])).not.toThrow();
    expect(() =>
      exigirServicosConcluidos([
        { nome: 'Revisão', concluidoEm: new Date() },
        { nome: 'Alinhamento', concluidoEm: null },
      ]),
    ).toThrow(expect.objectContaining({ code: 'SERVICOS_PENDENTES', message: 'Serviços não concluídos: Alinhamento' }));
  });

  it('consumo e conclusão só em EM_EXECUCAO', () => {
    expect(() => exigirExecucao('EM_EXECUCAO')).not.toThrow();
    expect(() => exigirExecucao('FINALIZADA')).toThrow(expect.objectContaining({ code: 'OS_FORA_DA_EXECUCAO' }));
  });
});

describe('validarPeriodo', () => {
  it('aceita período de até um ano com início antes do fim', () => {
    expect(() => validarPeriodo(new Date('2026-01-01'), new Date('2026-12-31'))).not.toThrow();
  });

  it.each([
    ['2026-02-01', '2026-01-01'],
    ['2026-01-01', '2026-01-01'],
    ['2025-01-01', '2026-06-01'],
    ['invalida', '2026-01-01'],
  ])('recusa de %s até %s', (de, ate) => {
    expect(() => validarPeriodo(new Date(de), new Date(ate))).toThrow(expect.objectContaining({ code: 'PERIODO_INVALIDO' }));
  });
});

describe('aplicarEstorno', () => {
  const saldo = { fisico: 10, reservado: 2 };

  it('desfaz o efeito no físico', () => {
    expect(aplicarEstorno(saldo, 'CONSUMO', 3)).toEqual({ fisico: 13, reservado: 2 });
    expect(aplicarEstorno(saldo, 'AJUSTE', 1)).toEqual({ fisico: 11, reservado: 2 });
    expect(aplicarEstorno(saldo, 'ENTRADA', 8)).toEqual({ fisico: 2, reservado: 2 });
  });

  it('recusa estorno de entrada já comprometida e de movimento do fluxo', () => {
    expect(() => aplicarEstorno(saldo, 'ENTRADA', 9)).toThrow(expect.objectContaining({ code: 'ESTOQUE_INSUFICIENTE' }));
    for (const tipo of ['RESERVA', 'LIBERACAO', 'ESTORNO'] as const) {
      expect(() => aplicarEstorno(saldo, tipo, 1)).toThrow(expect.objectContaining({ code: 'MOVIMENTO_NAO_ESTORNAVEL' }));
    }
  });
});
