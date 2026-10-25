import { ConflictError, ValidationError } from '../shared/errors.js';

export type TipoItem = 'SERVICO' | 'PECA';

/** Item como está no catálogo agora, antes de ser congelado no orçamento. */
export interface ItemPrecificavel {
  tipo: TipoItem;
  referenciaId: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  precoUnitarioCentavos: number;
  ativo: boolean;
}

export interface LinhaOrcamento extends Omit<ItemPrecificavel, 'ativo'> {
  totalCentavos: number;
}

export interface Precificacao {
  linhas: LinhaOrcamento[];
  totalCentavos: number;
}

const QUANTIDADE_MAXIMA = 100_000;

/**
 * Quantidade positiva com até 3 casas (insumo em litro, quilo, metro).
 * Peça e serviço são contados em unidades inteiras.
 */
export function validarQuantidade(quantidade: number, inteira: boolean): number {
  const milesimos = quantidade * 1000;
  const casasOk = Math.abs(milesimos - Math.round(milesimos)) < 1e-6;
  if (!(quantidade > 0) || quantidade > QUANTIDADE_MAXIMA || !casasOk || (inteira && !Number.isInteger(quantidade))) {
    throw new ValidationError(
      'QUANTIDADE_INVALIDA',
      inteira
        ? `Quantidade deve ser inteira entre 1 e ${QUANTIDADE_MAXIMA}`
        : `Quantidade deve ser positiva, até ${QUANTIDADE_MAXIMA}, com no máximo 3 casas`,
    );
  }
  return quantidade;
}

/**
 * Total da linha em centavos (RN04). A conta é feita em milésimos com BigInt para não perder
 * precisão, e o meio centavo arredonda para cima (0,5 L a 999 centavos = 500).
 */
export function totalDaLinha(quantidade: number, precoUnitarioCentavos: number): number {
  const milesimos = BigInt(Math.round(quantidade * 1000));
  const total = (milesimos * BigInt(precoUnitarioCentavos) + 500n) / 1000n;
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new ValidationError('VALOR_EXCESSIVO', 'Total fora do limite');
  return Number(total);
}

/** Soma as linhas sem checar regra. */
export function precificar(itens: ItemPrecificavel[]): Precificacao {
  const linhas = itens.map((i) => ({
    tipo: i.tipo,
    referenciaId: i.referenciaId,
    descricao: i.descricao,
    unidade: i.unidade,
    quantidade: i.quantidade,
    precoUnitarioCentavos: i.precoUnitarioCentavos,
    totalCentavos: totalDaLinha(i.quantidade, i.precoUnitarioCentavos),
  }));
  return { linhas, totalCentavos: linhas.reduce((soma, l) => soma + l.totalCentavos, 0) };
}

/**
 * Orçamento para publicação: ao menos um item e nenhum item inativo no catálogo (RN03, RN04).
 * Preço e descrição saem daqui copiados e não mudam mais.
 */
export function calcularOrcamento(itens: ItemPrecificavel[]): Precificacao {
  if (itens.length === 0) throw new ConflictError('ORCAMENTO_SEM_ITENS', 'Orçamento precisa de ao menos um item');
  const inativo = itens.find((i) => !i.ativo);
  if (inativo) {
    throw new ConflictError('ITEM_INATIVO', `${inativo.descricao} está inativo no catálogo. Remova o item antes de publicar`);
  }
  return precificar(itens);
}
