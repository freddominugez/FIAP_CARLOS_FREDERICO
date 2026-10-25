import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { DecidirOrcamento } from '../../../application/use-cases/atendimento/decidir-orcamento.js';
import { DecisaoBody, DecisaoResposta, IdempotenciaHeaders } from '../schemas/atendimento.js';
import { IdParams } from '../schemas/cadastros.js';
import { respostasErro } from '../schemas/comum.js';

export const rotasOrcamentos: FastifyPluginAsyncTypebox<{ decidir: DecidirOrcamento }> = async (app, { decidir }) => {
  app.post(
    '/quotes/:id/decision',
    {
      preHandler: app.exigirPerfil('CLIENTE'),
      schema: {
        tags: ['Orçamentos'],
        security: [{ bearerAuth: [] }],
        summary: 'Cliente aprova ou rejeita a versão do orçamento. Aprovar reserva as peças. Aceita Idempotency-Key',
        params: IdParams,
        headers: IdempotenciaHeaders,
        body: DecisaoBody,
        response: {
          200: DecisaoResposta,
          400: respostasErro[400],
          401: respostasErro[401],
          403: respostasErro[403],
          404: respostasErro[404],
          409: respostasErro[409],
        },
      },
    },
    async (req, reply) => {
      const { repetida, ...resultado } = await decidir.executar(
        req.params.id,
        req.body.decisao,
        req.body.motivo,
        { id: req.user.sub, clienteId: req.user.clienteId },
        req.headers['idempotency-key'],
      );
      if (repetida) reply.header('idempotent-replayed', 'true');
      return resultado;
    },
  );
};
