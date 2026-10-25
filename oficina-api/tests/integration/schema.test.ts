import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarUsuario, subirBanco, type BancoTeste } from '../support/banco.js';

// Constraints do schema que sustentam regras de negócio, provadas contra o PostgreSQL real.
describe('schema do banco', () => {
  let banco: BancoTeste;

  beforeAll(async () => {
    banco = await subirBanco();
  });
  afterAll(async () => banco?.parar());

  const peca = (fisico: number, reservado: number, tipo = 'PECA') =>
    banco.db.query(
      `INSERT INTO parts (sku, name, kind, unit, price_cents, physical, reserved)
       VALUES (gen_random_uuid()::text, 'Filtro', $3, 'UN', 1000, $1, $2)`,
      [fisico, reservado, tipo],
    );

  it('impede reservado maior que físico (RN06)', async () => {
    await expect(peca(1, 2)).rejects.toThrow(/parts_stock_ck/);
    await expect(peca(2, 2)).resolves.toBeTruthy();
  });

  it('impede peça fracionada e aceita insumo fracionado', async () => {
    await expect(peca(1.5, 0)).rejects.toThrow(/parts_integer_ck/);
    await expect(peca(1.5, 0, 'INSUMO')).resolves.toBeTruthy();
  });

  it('aceita CNPJ alfanumérico e recusa documento fora do formato (RN01)', async () => {
    const cliente = (doc: string, tipo: string) =>
      banco.db.query(`INSERT INTO customers (document, document_type, name) VALUES ($1, $2, 'X')`, [doc, tipo]);
    await expect(cliente('12ABC34501DE35', 'CNPJ')).resolves.toBeTruthy();
    await expect(cliente('1234567890', 'CPF')).rejects.toThrow(/customers_document_len_ck/);
    await expect(cliente('12ABC34501DE35', 'CNPJ')).rejects.toThrow(/customers_document_uk/);
  });

  it('impede alterar ou apagar movimento de estoque (RN07)', async () => {
    const usuario = await criarUsuario(banco.db, { email: 'mov@teste.local', senha: 'x', perfil: 'ADMIN' });
    const { rows } = await banco.db.query<{ id: string }>(
      `INSERT INTO parts (sku, name, kind, unit, price_cents) VALUES ('SKU-MOV', 'Óleo', 'INSUMO', 'L', 3000) RETURNING id`,
    );
    const mov = await banco.db.query<{ id: string }>(
      `INSERT INTO stock_movements (part_id, kind, quantity, created_by) VALUES ($1, 'ENTRADA', 5, $2) RETURNING id`,
      [rows[0]!.id, usuario],
    );
    await expect(banco.db.query(`UPDATE stock_movements SET quantity = 1 WHERE id = $1`, [mov.rows[0]!.id])).rejects.toThrow(
      /somente inserção/,
    );
    await expect(banco.db.query(`DELETE FROM stock_movements WHERE id = $1`, [mov.rows[0]!.id])).rejects.toThrow(
      /somente inserção/,
    );
  });

  it('exige cliente vinculado só para o perfil CLIENTE (RN11)', async () => {
    await expect(criarUsuario(banco.db, { email: 'c@teste.local', senha: 'x', perfil: 'CLIENTE' })).rejects.toThrow(
      /users_customer_ck/,
    );
  });
});
