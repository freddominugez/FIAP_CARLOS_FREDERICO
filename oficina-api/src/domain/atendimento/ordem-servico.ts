import { ConflictError } from '../shared/errors.js';

export const STATUS_OS = [
  'RECEBIDA',
  'EM_DIAGNOSTICO',
  'AGUARDANDO_APROVACAO',
  'EM_EXECUCAO',
  'FINALIZADA',
  'ENTREGUE',
] as const;

export type StatusOS = (typeof STATUS_OS)[number];

export type ComandoOS =
  | 'INICIAR_DIAGNOSTICO'
  | 'PUBLICAR_ORCAMENTO'
  | 'REABRIR_DIAGNOSTICO'
  | 'INICIAR_EXECUCAO'
  | 'FINALIZAR'
  | 'ENTREGAR';

/**
 * Transições permitidas (seção 5 do plano, RN08). Aprovar e rejeitar não mudam o status:
 * a decisão fica gravada no orçamento e a OS segue em AGUARDANDO_APROVACAO.
 */
export const TRANSICOES: Record<ComandoOS, { de: StatusOS; para: StatusOS }> = {
  INICIAR_DIAGNOSTICO: { de: 'RECEBIDA', para: 'EM_DIAGNOSTICO' },
  PUBLICAR_ORCAMENTO: { de: 'EM_DIAGNOSTICO', para: 'AGUARDANDO_APROVACAO' },
  REABRIR_DIAGNOSTICO: { de: 'AGUARDANDO_APROVACAO', para: 'EM_DIAGNOSTICO' },
  INICIAR_EXECUCAO: { de: 'AGUARDANDO_APROVACAO', para: 'EM_EXECUCAO' },
  FINALIZAR: { de: 'EM_EXECUCAO', para: 'FINALIZADA' },
  ENTREGAR: { de: 'FINALIZADA', para: 'ENTREGUE' },
};

export function isStatusOS(valor: unknown): valor is StatusOS {
  return typeof valor === 'string' && (STATUS_OS as readonly string[]).includes(valor);
}

/** Devolve o status de destino ou recusa com 409 qualquer transição fora da tabela. */
export function transicionar(atual: StatusOS, comando: ComandoOS): StatusOS {
  const regra = TRANSICOES[comando];
  if (regra.de !== atual) {
    throw new ConflictError('TRANSICAO_INVALIDA', `${comando} não é permitido com a OS em ${atual}`);
  }
  return regra.para;
}

/** Concorrência otimista (RN09): a alteração vale só sobre a versão que o cliente leu. */
export function exigirVersao(atual: number, esperada: number): void {
  if (atual !== esperada) {
    throw new ConflictError('VERSAO_DESATUALIZADA', `OS está na versão ${atual}, a requisição usou ${esperada}`);
  }
}

/** Itens só mudam durante o diagnóstico. Depois disso, valem as versões publicadas do orçamento. */
export function exigirDiagnostico(atual: StatusOS): void {
  if (atual !== 'EM_DIAGNOSTICO') {
    throw new ConflictError('OS_FORA_DO_DIAGNOSTICO', `Itens só mudam com a OS em EM_DIAGNOSTICO, ela está em ${atual}`);
  }
}

export function exigirExecucao(atual: StatusOS): void {
  if (atual !== 'EM_EXECUCAO') {
    throw new ConflictError('OS_FORA_DA_EXECUCAO', `Operação só vale com a OS em EM_EXECUCAO, ela está em ${atual}`);
  }
}
