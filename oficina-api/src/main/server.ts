import { criarPool } from '../infrastructure/db/pool.js';
import { criarApp } from './app.js';
import { carregarConfig } from './config.js';

const config = carregarConfig();
const db = criarPool(config.databaseUrl, config.databasePoolMax, config.databaseSslCa);
const app = await criarApp({ config, db });

const encerrar = async (sinal: string) => {
  app.log.info({ sinal }, 'encerrando');
  await app.close();
  await db.end();
  process.exit(0);
};
process.on('SIGTERM', () => void encerrar('SIGTERM'));
process.on('SIGINT', () => void encerrar('SIGINT'));

await app.ready();

if (process.env.VERCEL) {
  // A Vercel captura o server.listen() feito durante a carga do módulo. O app.listen() do Fastify
  // chamaria o listen só depois, e a plataforma esperaria 60 s antes de encaminhar o primeiro pedido.
  app.server.listen(config.port, config.host);
} else {
  await app.listen({ port: config.port, host: config.host });
}
