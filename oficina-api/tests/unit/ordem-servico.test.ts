import { describe, expect, it } from 'vitest';
import {
  exigirDiagnostico,
  exigirVersao,
  isStatusOS,
  STATUS_OS,
  TRANSICOES,
  transicionar,
  type ComandoOS,
} from '../../src/domain/atendimento/ordem-servico.js';

// T03: todas as transições permitidas e todas as recusadas.
describe('máquina de estados da OS', () => {
  const comandos = Object.keys(TRANSICOES) as ComandoOS[];

  it.each([
    ['RECEBIDA', 'INICIAR_DIAGNOSTICO', 'EM_DIAGNOSTICO'],
    ['EM_DIAGNOSTICO', 'PUBLICAR_ORCAMENTO', 'AGUARDANDO_APROVACAO'],
    ['AGUARDANDO_APROVACAO', 'REABRIR_DIAGNOSTICO', 'EM_DIAGNOSTICO'],
    ['AGUARDANDO_APROVACAO', 'INICIAR_EXECUCAO', 'EM_EXECUCAO'],
    ['EM_EXECUCAO', 'FINALIZAR', 'FINALIZADA'],
    ['FINALIZADA', 'ENTREGAR', 'ENTREGUE'],
  ] as const)('%s + %s = %s', (de, comando, para) => {
    expect(transicionar(de, comando)).toBe(para);
  });

  const recusadas = STATUS_OS.flatMap((status) =>
    comandos.filter((c) => TRANSICOES[c].de !== status).map((c) => [status, c] as const),
  );

  it(`recusa as ${recusadas.length} combinações fora da tabela com 409`, () => {
    expect(recusadas).toHaveLength(STATUS_OS.length * comandos.length - comandos.length);
    for (const [status, comando] of recusadas) {
      expect(() => transicionar(status, comando)).toThrow(
        expect.objectContaining({ code: 'TRANSICAO_INVALIDA', status: 409 }),
      );
    }
  });

  it('ENTREGUE é estado final', () => {
    expect(comandos.some((c) => TRANSICOES[c].de === 'ENTREGUE')).toBe(false);
  });

  it('confere versão e fase de diagnóstico', () => {
    expect(() => exigirVersao(3, 3)).not.toThrow();
    expect(() => exigirVersao(3, 2)).toThrow(expect.objectContaining({ code: 'VERSAO_DESATUALIZADA' }));
    expect(() => exigirDiagnostico('EM_DIAGNOSTICO')).not.toThrow();
    expect(() => exigirDiagnostico('RECEBIDA')).toThrow(expect.objectContaining({ code: 'OS_FORA_DO_DIAGNOSTICO' }));
  });

  it('reconhece status válidos', () => {
    expect(isStatusOS('FINALIZADA')).toBe(true);
    expect(isStatusOS('CANCELADA')).toBe(false);
    expect(isStatusOS(1)).toBe(false);
  });
});
