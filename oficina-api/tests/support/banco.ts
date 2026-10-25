import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { runner } from 'node-pg-migrate';
import pg from 'pg';
import { gerarHash } from '../../src/infrastructure/auth/bcrypt-verificador.js';
import { criarPool, type Db } from '../../src/infrastructure/db/pool.js';
import type { Config } from '../../src/main/config.js';

const DIR_MIGRACOES = fileURLToPath(new URL('../../db/migrations', import.meta.url));

export interface BancoTeste {
  db: Db;
  url: string;
  parar: () => Promise<void>;
}

/**
 * Banco PostgreSQL real e vazio para uma suíte, com as migrações aplicadas.
 * Com TEST_DATABASE_URL (CI ou Docker sem encaminhamento de porta), cria um banco
 * descartável nesse servidor. Sem ela, sobe um container com Testcontainers.
 */
export async function subirBanco(): Promise<BancoTeste> {
  const { url, liberar } = process.env.TEST_DATABASE_URL
    ? await bancoNoServidor(process.env.TEST_DATABASE_URL)
    : await bancoEmContainer();

  await runner({ databaseUrl: url, dir: DIR_MIGRACOES, direction: 'up', migrationsTable: 'pgmigrations', log: () => {} });
  const db = criarPool(url, 5);
  return {
    db,
    url,
    parar: async () => {
      await db.end();
      await liberar();
    },
  };
}

async function bancoEmContainer() {
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();
  return { url: container.getConnectionUri(), liberar: async () => void (await container.stop()) };
}

async function bancoNoServidor(urlServidor: string) {
  const nome = `teste_${randomBytes(6).toString('hex')}`;
  const admin = new pg.Client({ connectionString: urlServidor });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${nome}`);
  await admin.end();

  const url = new URL(urlServidor);
  url.pathname = `/${nome}`;
  return {
    url: url.toString(),
    liberar: async () => {
      const c = new pg.Client({ connectionString: urlServidor });
      await c.connect();
      await c.query(`DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`);
      await c.end();
    },
  };
}

export function configTeste(url: string): Config {
  return {
    port: 0,
    host: '127.0.0.1',
    databaseUrl: url,
    databasePoolMax: 5,
    jwt: {
      secret: 'segredo-de-teste-com-mais-de-32-caracteres',
      expiresIn: '1h',
      issuer: 'oficina-api',
      audience: 'oficina-clientes',
    },
    logLevel: 'silent',
  };
}

export async function criarUsuario(
  db: Db,
  dados: { email: string; senha: string; perfil: string; nome?: string; ativo?: boolean },
): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO users (email, name, role, password_hash, active) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [dados.email, dados.nome ?? 'Usuário Teste', dados.perfil, await gerarHash(dados.senha), dados.ativo ?? true],
  );
  return rows[0]!.id;
}
