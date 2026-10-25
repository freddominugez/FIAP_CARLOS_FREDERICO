import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@fastify/type-provider-typebox';
import type { MovimentarEstoque } from '../../../application/use-cases/estoque/movimentar.js';
import {
  EstornoBody,
  EstornoParams,
  MovimentoBody,
  MovimentoResposta,
  MovimentoSchema,
} from '../schemas/atendimento.js';
import { IdParams, ListaSchema, paginacao, PaginacaoQuery } from '../schemas/cadastros.js';
import { respostasErro } from '../schemas/comum.js';

const comum = { tags: ['Estoque'], security: [{ bearerAuth: [] }] };
const erros = {
  400: respostasErro[400],
  401: respostasErro[401],
  403: respostasErro[403],
  404: respostasErro[404],
  409: respostasErro[409],
};

export const rotasEstoque: FastifyPluginAsyncTypebox<{ estoque: MovimentarEstoque }> = async (app, { estoque }) => {
  app.post(
    '/parts/:id/movements',
    {
      preHandler: app.exigirPerfil('ADMIN'),
      schema: {
        ...comum,
        summary: 'Registra entrada ou ajuste. Reserva, liberação e consumo são gerados pelo fluxo da OS',
        params: IdParams,
        body: MovimentoBody,
        response: { 201: MovimentoResposta, ...erros },
      },
    },
    async (req, reply) =>
      reply
        .status(201)
        .send(await estoque.registrar(req.params.id, req.body.tipo, req.body.quantidade, req.body.observacao, req.user.sub)),
  );

  app.post(
    '/parts/:id/movements/:movimentoId/reversal',
    {
      preHandler: app.exigirPerfil('ADMIN'),
      schema: {
        ...comum,
        summary: 'Estorna entrada, ajuste ou consumo com um movimento novo. O original não muda',
        params: EstornoParams,
        body: EstornoBody,
        response: { 201: MovimentoResposta, ...erros },
      },
    },
    async (req, reply) =>
      reply
        .status(201)
        .send(await estoque.estornar(req.params.id, req.params.movimentoId, req.body.observacao, req.user.sub)),
  );

  app.get(
    '/parts/:id/movements',
    {
      preHandler: app.exigirPerfil('ADMIN', 'ATENDENTE', 'TECNICO'),
      schema: {
        ...comum,
        summary: 'Extrato de movimentos da peça, mais recentes primeiro',
        params: IdParams,
        querystring: Type.Object({ ...PaginacaoQuery }),
        response: { 200: ListaSchema(MovimentoSchema), ...erros },
      },
    },
    async (req) => {
      const pagina = paginacao(req.query);
      return { ...(await estoque.listar(req.params.id, pagina)), ...pagina };
    },
  );
};
