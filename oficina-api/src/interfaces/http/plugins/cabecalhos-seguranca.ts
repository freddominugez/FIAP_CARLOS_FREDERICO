import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Cabeçalhos de segurança em todas as respostas (achados do OWASP ZAP na D+7).
 * Resposta da API não vai para cache, porque pode trazer dado de cliente.
 */
async function cabecalhosSeguranca(app: FastifyInstance) {
  app.addHook('onSend', async (req, reply) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('cross-origin-resource-policy', 'same-origin');
    reply.header('x-frame-options', 'DENY');
    reply.header('referrer-policy', 'no-referrer');
    if (req.url.startsWith('/api/v1/')) reply.header('cache-control', 'no-store');
  });
}

export default fp(cabecalhosSeguranca, { name: 'cabecalhos-seguranca' });
