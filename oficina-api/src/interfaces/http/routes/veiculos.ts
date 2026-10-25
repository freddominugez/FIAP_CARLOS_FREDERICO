import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { GerenciarVeiculos } from '../../../application/use-cases/cadastros/veiculos.js';
import {
  AlteracaoVeiculoBody,
  AtivoQuery,
  booleano,
  IdParams,
  ListaSchema,
  NovoVeiculoBody,
  paginacao,
  PaginacaoQuery,
  VeiculoSchema,
} from '../schemas/cadastros.js';
import { respostasErro } from '../schemas/comum.js';

const comum = { tags: ['Veículos'], security: [{ bearerAuth: [] }] };
const erros = { 401: respostasErro[401], 403: respostasErro[403] };

export const rotasVeiculos: FastifyPluginAsyncTypebox<{ veiculos: GerenciarVeiculos }> = async (app, { veiculos }) => {
  app.addHook('preHandler', app.exigirPerfil('ATENDENTE', 'ADMIN'));

  app.post(
    '/vehicles',
    {
      schema: {
        ...comum,
        summary: 'Cadastra veículo de um cliente. Placa antiga ou Mercosul',
        body: NovoVeiculoBody,
        response: {
          201: VeiculoSchema,
          400: respostasErro[400],
          404: respostasErro[404],
          409: respostasErro[409],
          ...erros,
        },
      },
    },
    async (req, reply) => reply.status(201).send(await veiculos.criar(req.body)),
  );

  app.get(
    '/vehicles',
    {
      schema: {
        ...comum,
        summary: 'Lista veículos',
        querystring: Type.Object({
          ...PaginacaoQuery,
          clienteId: Type.Optional(Type.String({ format: 'uuid' })),
          placa: Type.Optional(Type.String({ maxLength: 8 })),
          ativo: AtivoQuery,
        }),
        response: { 200: ListaSchema(VeiculoSchema), 400: respostasErro[400], ...erros },
      },
    },
    async (req) => {
      const pagina = paginacao(req.query);
      const { clienteId, placa } = req.query;
      const lista = await veiculos.listar({ clienteId, placa, ativo: booleano(req.query.ativo) }, pagina);
      return { ...lista, ...pagina };
    },
  );

  app.get(
    '/vehicles/:id',
    {
      schema: {
        ...comum,
        summary: 'Detalha veículo',
        params: IdParams,
        response: { 200: VeiculoSchema, 404: respostasErro[404], ...erros },
      },
    },
    async (req) => veiculos.buscar(req.params.id),
  );

  app.patch(
    '/vehicles/:id',
    {
      schema: {
        ...comum,
        summary: 'Altera dados, dono ou situação. A placa não muda',
        params: IdParams,
        body: AlteracaoVeiculoBody,
        response: {
          200: VeiculoSchema,
          400: respostasErro[400],
          404: respostasErro[404],
          409: respostasErro[409],
          ...erros,
        },
      },
    },
    async (req) => veiculos.atualizar(req.params.id, req.body),
  );

  app.delete(
    '/vehicles/:id',
    {
      schema: {
        ...comum,
        summary: 'Exclui veículo sem OS. Com OS, devolve 409 e o caminho é inativar',
        params: IdParams,
        response: { 204: Type.Null(), 404: respostasErro[404], 409: respostasErro[409], ...erros },
      },
    },
    async (req, reply) => {
      await veiculos.remover(req.params.id);
      return reply.status(204).send(null);
    },
  );
};
