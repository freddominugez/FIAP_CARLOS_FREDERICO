import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { ExecutarOrdens } from '../../../application/use-cases/atendimento/execucao.js';
import {
  ConsumoBody,
  DetalheOSSchema,
  ServicoItemParams,
  TempoMedioQuery,
  TempoMedioSchema,
  VersaoBody,
} from '../schemas/atendimento.js';
import { IdParams } from '../schemas/cadastros.js';
import { respostasErro } from '../schemas/comum.js';

const comum = { tags: ['Ordens de serviço'], security: [{ bearerAuth: [] }] };
const erros = {
  400: respostasErro[400],
  401: respostasErro[401],
  403: respostasErro[403],
  404: respostasErro[404],
  409: respostasErro[409],
};

export const rotasExecucao: FastifyPluginAsyncTypebox<{ execucao: ExecutarOrdens }> = async (app, { execucao }) => {
  const tecnico = app.exigirPerfil('TECNICO');

  app.post(
    '/orders/:id/start',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Inicia a execução: exige a versão atual do orçamento aprovada',
        params: IdParams,
        body: VersaoBody,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => execucao.iniciar(req.params.id, req.body.versao, req.user.sub),
  );

  app.post(
    '/orders/:id/consumptions',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Dá baixa física numa peça reservada. Repetir não baixa de novo',
        params: IdParams,
        body: ConsumoBody,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req, reply) => {
      const { os, repetida } = await execucao.consumirPeca(req.params.id, req.body.itemOrcamentoId, req.user.sub);
      if (repetida) reply.header('idempotent-replayed', 'true');
      return os;
    },
  );

  app.post(
    '/orders/:id/services/:itemId/complete',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Marca um serviço como concluído durante a execução',
        params: ServicoItemParams,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => execucao.concluirServico(req.params.id, req.params.itemId),
  );

  app.post(
    '/orders/:id/finish',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Finaliza a OS: serviços concluídos, peças não usadas voltam ao estoque',
        params: IdParams,
        body: VersaoBody,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => execucao.finalizar(req.params.id, req.body.versao, req.user.sub),
  );

  app.post(
    '/orders/:id/deliver',
    {
      preHandler: app.exigirPerfil('ATENDENTE'),
      schema: {
        ...comum,
        summary: 'Registra a entrega do veículo: FINALIZADA para ENTREGUE',
        params: IdParams,
        body: VersaoBody,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => execucao.entregar(req.params.id, req.body.versao, req.user.sub),
  );

  app.get(
    '/metrics/execution-time',
    {
      preHandler: app.exigirPerfil('ADMIN', 'ATENDENTE'),
      schema: {
        tags: ['Indicadores'],
        security: [{ bearerAuth: [] }],
        summary: 'Tempo médio de execução das OS finalizadas no período [de, ate)',
        querystring: TempoMedioQuery,
        response: { 200: TempoMedioSchema, ...erros },
      },
    },
    async (req) => {
      const r = await execucao.tempoMedio(new Date(req.query.de), new Date(req.query.ate));
      const mediaHoras = r.mediaSegundos === null ? null : Math.round((r.mediaSegundos / 3600) * 100) / 100;
      return { ...r, mediaHoras };
    },
  );
};
