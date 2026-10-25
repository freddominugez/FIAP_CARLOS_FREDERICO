import {
  aplicarMovimento,
  exigirDisponibilidade,
  somarPorPeca,
  type Saldo,
} from '../../../domain/estoque/estoque.js';
import type { EstoqueRepository } from '../../ports/estoque.js';

/**
 * Reserva todas as peças e insumos de uma versão aprovada do orçamento (RN06).
 * Roda dentro da transação da aprovação: se faltar uma peça, nada fica reservado.
 */
export async function reservarOrcamento(estoque: EstoqueRepository, orcamentoId: string, autorId: string) {
  const linhas = await estoque.pecasDoOrcamento(orcamentoId);
  if (!linhas.length) return;

  const necessidade = somarPorPeca(linhas);
  const pecas = await estoque.bloquearPecas([...necessidade.keys()]);
  exigirDisponibilidade(necessidade, pecas);

  const saldos = new Map<string, Saldo>(pecas.map((p) => [p.id, p]));
  for (const linha of linhas) {
    const saldo = aplicarMovimento(saldos.get(linha.pecaId)!, 'RESERVA', linha.quantidade);
    saldos.set(linha.pecaId, saldo);
    await estoque.registrar({
      pecaId: linha.pecaId,
      tipo: 'RESERVA',
      quantidade: linha.quantidade,
      saldo,
      itemOrcamentoId: linha.itemOrcamentoId,
      autorId,
    });
  }
}

/** Devolve ao disponível as reservas ainda abertas de um orçamento. Cada liberação aponta para a sua reserva. */
export async function liberarReservas(
  estoque: EstoqueRepository,
  orcamentoId: string,
  autorId: string,
  observacao: string,
) {
  const reservas = await estoque.reservasAbertas(orcamentoId);
  if (!reservas.length) return;

  const pecas = await estoque.bloquearPecas([...new Set(reservas.map((r) => r.pecaId))]);
  const saldos = new Map<string, Saldo>(pecas.map((p) => [p.id, p]));
  for (const reserva of reservas) {
    const saldo = aplicarMovimento(saldos.get(reserva.pecaId)!, 'LIBERACAO', reserva.quantidade);
    saldos.set(reserva.pecaId, saldo);
    await estoque.registrar({
      pecaId: reserva.pecaId,
      tipo: 'LIBERACAO',
      quantidade: reserva.quantidade,
      saldo,
      itemOrcamentoId: reserva.itemOrcamentoId,
      referenteA: reserva.movimentoId,
      observacao,
      autorId,
    });
  }
}
