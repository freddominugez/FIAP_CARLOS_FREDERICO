import { ConflictError, ValidationError } from '../shared/errors.js';
import type { StatusOrcamento } from './decisao.js';

/** Início da execução exige a versão atual aprovada pelo cliente (seção 5 do plano). */
export function exigirAprovado(statusDaUltimaVersao: StatusOrcamento | undefined): void {
  if (statusDaUltimaVersao === 'APROVADO') return;
  const motivo =
    statusDaUltimaVersao === 'REJEITADO'
      ? 'o orçamento foi rejeitado. Reabra o diagnóstico'
      : 'o orçamento ainda não foi aprovado pelo cliente';
  throw new ConflictError('ORCAMENTO_NAO_APROVADO', `Execução bloqueada: ${motivo}`);
}

/** Finalizar exige todos os serviços concluídos. */
export function exigirServicosConcluidos(servicos: { nome: string; concluidoEm: Date | null }[]): void {
  const pendentes = servicos.filter((s) => !s.concluidoEm).map((s) => s.nome);
  if (pendentes.length) {
    throw new ConflictError('SERVICOS_PENDENTES', `Serviços não concluídos: ${pendentes.join(', ')}`);
  }
}

const UM_ANO_MS = 366 * 24 * 60 * 60 * 1000;

/** Período do indicador de tempo médio (RN10): início antes do fim e no máximo um ano. */
export function validarPeriodo(de: Date, ate: Date): void {
  if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime()) || de >= ate) {
    throw new ValidationError('PERIODO_INVALIDO', 'Informe "de" anterior a "ate"');
  }
  if (ate.getTime() - de.getTime() > UM_ANO_MS) {
    throw new ValidationError('PERIODO_INVALIDO', 'Período máximo de um ano');
  }
}
