import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { ConsultarMinhasOrdens } from '../../../application/use-cases/atendimento/consulta-cliente.js';
import { MinhaOSDetalheSchema, MinhaOSSchema } from '../schemas/atendimento.js';
import { IdParams, ListaSchema, paginacao, PaginacaoQuery } from '../schemas/cadastros.js';
import { respostasErro } from '../schemas/comum.js';

const comum = { tags: ['Cliente'], security: [{ bearerAuth: [] }] };
const erros = { 400: respostasErro[400], 401: respostasErro[401], 403: respostasErro[403], 404: respostasErro[404] };

/** Rotas do cliente. O cliente sai do token: não há como pedir a OS de outro pela URL. */
export const rotasCliente: FastifyPluginAsyncTypebox<{ consulta: ConsultarMinhasOrdens }> = async (app, { consulta }) => {
  app.addHook('preHandler', app.exigirPerfil('CLIENTE'));

  app.get(
    '/me/orders',
    {
      schema: {
        ...comum,
        summary: 'Minhas ordens de serviço, mais recentes primeiro',
        querystring: Type.Object({ ...PaginacaoQuery }),
        response: { 200: ListaSchema(MinhaOSSchema), ...erros },
      },
    },
    async (req) => {
      const pagina = paginacao(req.query);
      return { ...(await consulta.listar(req.user.clienteId!, pagina)), ...pagina };
    },
  );

  app.get(
    '/me/orders/:id',
    {
      schema: {
        ...comum,
        summary: 'Andamento e orçamentos da minha OS. A decisão vai em POST /quotes/{id}/decision',
        params: IdParams,
        response: { 200: MinhaOSDetalheSchema, ...erros },
      },
    },
    async (req) => consulta.detalhar(req.user.clienteId!, req.params.id),
  );
};
