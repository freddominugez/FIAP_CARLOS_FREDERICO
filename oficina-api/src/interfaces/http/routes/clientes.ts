import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { GerenciarClientes } from '../../../application/use-cases/cadastros/clientes.js';
import {
  AcessoClienteBody,
  AlteracaoClienteBody,
  AtivoQuery,
  booleano,
  ClienteSchema,
  IdParams,
  ListaSchema,
  NovoClienteBody,
  paginacao,
  PaginacaoQuery,
} from '../schemas/cadastros.js';
import { respostasErro } from '../schemas/comum.js';

const comum = { tags: ['Clientes'], security: [{ bearerAuth: [] }] };
const erros = { 401: respostasErro[401], 403: respostasErro[403] };

export const rotasClientes: FastifyPluginAsyncTypebox<{ clientes: GerenciarClientes }> = async (app, { clientes }) => {
  app.addHook('preHandler', app.exigirPerfil('ATENDENTE', 'ADMIN'));

  app.post(
    '/customers',
    {
      schema: {
        ...comum,
        summary: 'Cadastra cliente com CPF ou CNPJ (inclusive alfanumérico)',
        body: NovoClienteBody,
        response: { 201: ClienteSchema, 400: respostasErro[400], 409: respostasErro[409], ...erros },
      },
    },
    async (req, reply) => reply.status(201).send(await clientes.criar(req.body)),
  );

  app.get(
    '/customers',
    {
      schema: {
        ...comum,
        summary: 'Lista clientes',
        querystring: Type.Object({
          ...PaginacaoQuery,
          documento: Type.Optional(Type.String({ maxLength: 18 })),
          nome: Type.Optional(Type.String({ minLength: 1, maxLength: 200 })),
          ativo: AtivoQuery,
        }),
        response: { 200: ListaSchema(ClienteSchema), 400: respostasErro[400], ...erros },
      },
    },
    async (req) => {
      const pagina = paginacao(req.query);
      const { documento, nome } = req.query;
      const lista = await clientes.listar({ documento, nome, ativo: booleano(req.query.ativo) }, pagina);
      return { ...lista, ...pagina };
    },
  );

  app.get(
    '/customers/:id',
    {
      schema: {
        ...comum,
        summary: 'Detalha cliente',
        params: IdParams,
        response: { 200: ClienteSchema, 404: respostasErro[404], ...erros },
      },
    },
    async (req) => clientes.buscar(req.params.id),
  );

  app.patch(
    '/customers/:id',
    {
      schema: {
        ...comum,
        summary: 'Altera nome, contato ou situação. O documento não muda',
        params: IdParams,
        body: AlteracaoClienteBody,
        response: { 200: ClienteSchema, 400: respostasErro[400], 404: respostasErro[404], ...erros },
      },
    },
    async (req) => clientes.atualizar(req.params.id, req.body),
  );

  app.delete(
    '/customers/:id',
    {
      schema: {
        ...comum,
        summary: 'Exclui cliente sem histórico. Com veículo ou OS, devolve 409 e o caminho é inativar',
        params: IdParams,
        response: { 204: Type.Null(), 404: respostasErro[404], 409: respostasErro[409], ...erros },
      },
    },
    async (req, reply) => {
      await clientes.remover(req.params.id);
      return reply.status(204).send(null);
    },
  );

  app.post(
    '/customers/:id/user',
    {
      schema: {
        ...comum,
        summary: 'Cria o acesso do cliente (perfil CLIENTE) para consultar e aprovar as próprias OS',
        params: IdParams,
        body: AcessoClienteBody,
        response: {
          201: Type.Object({ usuarioId: Type.String({ format: 'uuid' }) }),
          400: respostasErro[400],
          404: respostasErro[404],
          409: respostasErro[409],
          ...erros,
        },
      },
    },
    async (req, reply) =>
      reply.status(201).send(await clientes.criarAcesso(req.params.id, req.body.email, req.body.senha)),
  );
};
