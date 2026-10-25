import { ConflictError } from '../shared/errors.js';

export type Decisao = 'APROVADO' | 'REJEITADO';
export type StatusOrcamento = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'INVALIDADO';

/**
 * Regras da decisão do cliente (RN05).
 * Devolve 'NOVA' quando a decisão deve ser gravada e 'REPETIDA' quando é a mesma já registrada,
 * caso em que nada muda e nada é reservado de novo.
 */
export function avaliarDecisao(
  status: StatusOrcamento,
  anterior: Decisao | null,
  pedida: Decisao,
): 'NOVA' | 'REPETIDA' {
  if (status === 'INVALIDADO') {
    throw new ConflictError('ORCAMENTO_OBSOLETO', 'Esta versão do orçamento foi substituída. Consulte a versão atual');
  }
  if (anterior === null) return 'NOVA';
  if (anterior === pedida) return 'REPETIDA';
  throw new ConflictError('DECISAO_JA_REGISTRADA', `Orçamento já foi ${anterior.toLowerCase()}`);
}
