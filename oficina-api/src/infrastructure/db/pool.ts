import pg from 'pg';

export type Db = pg.Pool;
export type Tx = pg.PoolClient;

// bigint (centavos) vem do pg como string. Converte para number, seguro até 2^53.
pg.types.setTypeParser(pg.types.builtins.INT8, Number);

/**
 * Com `ca`, a conexão usa TLS e confere o certificado do servidor contra essa CA.
 * Sem `ca`, segue o que a URL disser (no Compose, sem TLS dentro da rede do Docker).
 */
export function criarPool(connectionString: string, max: number, ca?: string): Db {
  return new pg.Pool({ connectionString, max, ssl: ca ? { ca, rejectUnauthorized: true } : undefined });
}

/**
 * Unidade de trabalho: uma transação por caso de uso.
 * Commit se a função resolver, rollback em qualquer erro.
 */
export async function emTransacao<T>(db: Db, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const tx = await db.connect();
  try {
    await tx.query('BEGIN');
    const resultado = await fn(tx);
    await tx.query('COMMIT');
    return resultado;
  } catch (erro) {
    await tx.query('ROLLBACK');
    throw erro;
  } finally {
    tx.release();
  }
}
