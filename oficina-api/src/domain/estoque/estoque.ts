import { ConflictError } from '../shared/errors.js';

export type TipoMovimento = 'ENTRADA' | 'AJUSTE' | 'RESERVA' | 'LIBERACAO' | 'CONSUMO' | 'ESTORNO';

export interface Saldo {
  fisico: number;
  reservado: number;
}

export interface SaldoPeca extends Saldo {
  id: string;
  nome: string;
}

// Quantidades têm até 3 casas. A conta é feita em milésimos inteiros para não acumular erro de ponto flutuante.
const mil = (q: number) => Math.round(q * 1000);
const deMil = (m: number) => m / 1000;

export function disponivel(s: Saldo): number {
  return deMil(mil(s.fisico) - mil(s.reservado));
}

/**
 * Efeito de cada movimento no saldo (RN06, RN07).
 * ENTRADA soma ao físico. AJUSTE é baixa por perda ou inventário e tira do físico.
 * RESERVA prende parte do físico para um orçamento aprovado e LIBERACAO devolve.
 * CONSUMO tira do físico e da reserva ao mesmo tempo.
 */
export function aplicarMovimento(saldo: Saldo, tipo: Exclude<TipoMovimento, 'ESTORNO'>, quantidade: number): Saldo {
  const f = mil(saldo.fisico);
  const r = mil(saldo.reservado);
  const q = mil(quantidade);
  const efeito: Record<typeof tipo, [number, number]> = {
    ENTRADA: [f + q, r],
    AJUSTE: [f - q, r],
    RESERVA: [f, r + q],
    LIBERACAO: [f, r - q],
    CONSUMO: [f - q, r - q],
  };
  const [fisico, reservado] = efeito[tipo];
  if (reservado < 0 || fisico < reservado) {
    throw new ConflictError('ESTOQUE_INSUFICIENTE', `${tipo} deixaria o saldo negativo`);
  }
  return { fisico: deMil(fisico), reservado: deMil(reservado) };
}

/** Soma as quantidades pedidas por peça. Um orçamento pode ter a mesma peça em mais de uma linha. */
export function somarPorPeca(linhas: { pecaId: string; quantidade: number }[]): Map<string, number> {
  const total = new Map<string, number>();
  for (const l of linhas) total.set(l.pecaId, deMil(mil(total.get(l.pecaId) ?? 0) + mil(l.quantidade)));
  return total;
}

/**
 * Confere se há saldo para reservar tudo. Ou reserva todas as peças, ou nenhuma (RN06).
 * A mensagem lista cada peça em falta para o atendente saber o que comprar.
 */
export function exigirDisponibilidade(necessidade: Map<string, number>, saldos: SaldoPeca[]): void {
  const faltas = saldos
    .filter((s) => mil(disponivel(s)) < mil(necessidade.get(s.id) ?? 0))
    .map((s) => `${s.nome} (pedido ${necessidade.get(s.id)}, disponível ${disponivel(s)})`);
  if (faltas.length) throw new ConflictError('ESTOQUE_INSUFICIENTE', `Sem saldo para: ${faltas.join(', ')}`);
}

export type MovimentoEstornavel = 'ENTRADA' | 'AJUSTE' | 'CONSUMO';

/**
 * Estorno corrige um movimento gravado sem apagá-lo (RN07). Desfaz só o efeito no físico:
 * consumo estornado volta ao disponível, não à reserva. Reserva e liberação são do fluxo da OS
 * e não se estornam à mão.
 */
export function aplicarEstorno(saldo: Saldo, tipoOriginal: TipoMovimento, quantidade: number): Saldo {
  const inverso: Partial<Record<TipoMovimento, 'ENTRADA' | 'AJUSTE'>> = {
    ENTRADA: 'AJUSTE',
    AJUSTE: 'ENTRADA',
    CONSUMO: 'ENTRADA',
  };
  const tipo = inverso[tipoOriginal];
  if (!tipo) throw new ConflictError('MOVIMENTO_NAO_ESTORNAVEL', `${tipoOriginal} não se estorna manualmente`);
  return aplicarMovimento(saldo, tipo, quantidade);
}
