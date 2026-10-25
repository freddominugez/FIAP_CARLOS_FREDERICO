import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { GerenciarOrdens } from '../../../application/use-cases/atendimento/ordens.js';
import {
  AberturaBody,
  DetalheOSSchema,
  IdempotenciaHeaders,
  ItemParams,
  OrdemSchema,
  PecaItemBody,
  ServicoItemBody,
  StatusOSSchema,
  VersaoBody,
} from '../schemas/atendimento.js';
import { IdParams, ListaSchema, paginacao, PaginacaoQuery } from '../schemas/cadastros.js';
import { respostasErro } from '../schemas/comum.js';

const comum = { tags: ['Ordens de serviço'], security: [{ bearerAuth: [] }] };
const erros = {
  400: respostasErro[400],
  401: respostasErro[401],
  403: respostasErro[403],
  404: respostasErro[404],
  409: respostasErro[409],
};

/** Fluxo da OS até a publicação do orçamento. Perfis conforme RN11 e a seção 5 do plano. */
export const rotasOrdens: FastifyPluginAsyncTypebox<{ ordens: GerenciarOrdens }> = async (app, { ordens }) => {
  const atendente = app.exigirPerfil('ATENDENTE', 'ADMIN');
  const equipe = app.exigirPerfil('ATENDENTE', 'TECNICO', 'ADMIN');
  const tecnico = app.exigirPerfil('TECNICO');
  const publicador = app.exigirPerfil('TECNICO', 'ATENDENTE');

  app.post(
    '/orders',
    {
      preHandler: atendente,
      schema: {
        ...comum,
        summary: 'Abre OS em RECEBIDA. Aceita Idempotency-Key',
        headers: IdempotenciaHeaders,
        body: AberturaBody,
        response: { 201: DetalheOSSchema, ...erros },
      },
    },
    async (req, reply) => {
      const { os, repetida } = await ordens.abrir(req.body, req.user.sub, req.headers['idempotency-key']);
      if (repetida) reply.header('idempotent-replayed', 'true');
      return reply.status(201).send(os);
    },
  );

  app.get(
    '/orders',
    {
      preHandler: equipe,
      schema: {
        ...comum,
        summary: 'Lista OS, mais recentes primeiro',
        querystring: Type.Object({
          ...PaginacaoQuery,
          status: Type.Optional(StatusOSSchema),
          clienteId: Type.Optional(Type.String({ format: 'uuid' })),
        }),
        response: { 200: ListaSchema(OrdemSchema), ...erros },
      },
    },
    async (req) => {
      const pagina = paginacao(req.query);
      const lista = await ordens.listar({ status: req.query.status, clienteId: req.query.clienteId }, pagina);
      return { ...lista, ...pagina };
    },
  );

  app.get(
    '/orders/:id',
    {
      preHandler: equipe,
      schema: {
        ...comum,
        summary: 'Detalha OS com itens, orçamentos e histórico de status',
        params: IdParams,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => ordens.buscar(req.params.id),
  );

  app.post(
    '/orders/:id/diagnosis',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Inicia o diagnóstico: RECEBIDA para EM_DIAGNOSTICO',
        params: IdParams,
        body: VersaoBody,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => ordens.iniciarDiagnostico(req.params.id, req.body.versao, req.user.sub),
  );

  app.post(
    '/orders/:id/services',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Inclui serviço do catálogo durante o diagnóstico',
        params: IdParams,
        body: ServicoItemBody,
        response: { 201: DetalheOSSchema, ...erros },
      },
    },
    async (req, reply) =>
      reply.status(201).send(await ordens.adicionarServico(req.params.id, req.body.servicoId, req.body.quantidade)),
  );

  app.delete(
    '/orders/:id/services/:itemId',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Remove serviço durante o diagnóstico',
        params: ItemParams,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => ordens.removerItem(req.params.id, 'SERVICO', req.params.itemId),
  );

  app.post(
    '/orders/:id/parts',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Inclui peça ou insumo durante o diagnóstico',
        params: IdParams,
        body: PecaItemBody,
        response: { 201: DetalheOSSchema, ...erros },
      },
    },
    async (req, reply) =>
      reply.status(201).send(await ordens.adicionarPeca(req.params.id, req.body.pecaId, req.body.quantidade)),
  );

  app.delete(
    '/orders/:id/parts/:itemId',
    {
      preHandler: tecnico,
      schema: {
        ...comum,
        summary: 'Remove peça ou insumo durante o diagnóstico',
        params: ItemParams,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => ordens.removerItem(req.params.id, 'PECA', req.params.itemId),
  );

  app.post(
    '/orders/:id/quotes',
    {
      preHandler: publicador,
      schema: {
        ...comum,
        summary: 'Publica nova versão do orçamento com preços congelados: EM_DIAGNOSTICO para AGUARDANDO_APROVACAO',
        params: IdParams,
        body: VersaoBody,
        response: { 201: DetalheOSSchema, ...erros },
      },
    },
    async (req, reply) => reply.status(201).send(await ordens.publicarOrcamento(req.params.id, req.body.versao, req.user.sub)),
  );

  app.post(
    '/orders/:id/reopen',
    {
      preHandler: publicador,
      schema: {
        ...comum,
        summary: 'Reabre o diagnóstico: invalida a versão atual do orçamento e libera as peças reservadas',
        params: IdParams,
        body: VersaoBody,
        response: { 200: DetalheOSSchema, ...erros },
      },
    },
    async (req) => ordens.reabrirDiagnostico(req.params.id, req.body.versao, req.user.sub),
  );
};
