import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { Db } from '../../../infrastructure/db/pool.js';

export const rotasSaude: FastifyPluginAsyncTypebox<{ db: Db }> = async (app, { db }) => {
  app.get(
    '/health',
    {
      schema: {
        tags: ['Saúde'],
        summary: 'Verifica se a API e o banco respondem',
        response: {
          200: Type.Object({ status: Type.Literal('ok'), banco: Type.Literal('ok') }),
          503: Type.Object({ status: Type.Literal('indisponivel'), banco: Type.Literal('falha') }),
        },
      },
    },
    async (req, reply) => {
      try {
        await db.query('SELECT 1');
        return { status: 'ok' as const, banco: 'ok' as const };
      } catch (erro) {
        req.log.error({ err: erro }, 'banco indisponível');
        return reply.status(503).send({ status: 'indisponivel', banco: 'falha' });
      }
    },
  );
};
