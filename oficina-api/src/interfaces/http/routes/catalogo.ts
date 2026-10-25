import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { Peca } from '../../../application/ports/cadastros.js';
import type { GerenciarPecas, GerenciarServicos } from '../../../application/use-cases/cadastros/catalogo.js';
import {
  AlteracaoPecaBody,
  AlteracaoServicoBody,
  AtivoQuery,
  booleano,
  IdParams,
  ListaSchema,
  NovaPecaBody,
  NovoServicoBody,
  paginacao,
  PaginacaoQuery,
  PecaSchema,
  ServicoSchema,
  TipoPeca,
  type PecaResposta,
} from '../schemas/cadastros.js';
import { respostasErro } from '../schemas/comum.js';

const seguranca = { security: [{ bearerAuth: [] }] };
const erros = { 401: respostasErro[401], 403: respostasErro[403] };

function comDisponivel(p: Peca): PecaResposta {
  return { ...p, estoqueDisponivel: p.estoqueFisico - p.estoqueReservado };
}

/**
 * Catálogo de serviços e peças. Escrita só pelo ADMIN (RN11).
 * Atendente e técnico leem, porque montam o orçamento a partir do catálogo.
 */
export const rotasCatalogo: FastifyPluginAsyncTypebox<{
  servicos: GerenciarServicos;
  pecas: GerenciarPecas;
}> = async (app, { servicos, pecas }) => {
  const leitura = app.exigirPerfil('ADMIN', 'ATENDENTE', 'TECNICO');
  const escrita = app.exigirPerfil('ADMIN');

  // Serviços ----------------------------------------------------------------

  const servico = { tags: ['Serviços'], ...seguranca };

  app.post(
    '/services',
    {
      preHandler: escrita,
      schema: {
        ...servico,
        summary: 'Cadastra serviço do catálogo',
        body: NovoServicoBody,
        response: { 201: ServicoSchema, 400: respostasErro[400], ...erros },
      },
    },
    async (req, reply) => reply.status(201).send(await servicos.criar(req.body)),
  );

  app.get(
    '/services',
    {
      preHandler: leitura,
      schema: {
        ...servico,
        summary: 'Lista serviços',
        querystring: Type.Object({ ...PaginacaoQuery, ativo: AtivoQuery }),
        response: { 200: ListaSchema(ServicoSchema), 400: respostasErro[400], ...erros },
      },
    },
    async (req) => {
      const pagina = paginacao(req.query);
      return { ...(await servicos.listar({ ativo: booleano(req.query.ativo) }, pagina)), ...pagina };
    },
  );

  app.get(
    '/services/:id',
    {
      preHandler: leitura,
      schema: {
        ...servico,
        summary: 'Detalha serviço',
        params: IdParams,
        response: { 200: ServicoSchema, 404: respostasErro[404], ...erros },
      },
    },
    async (req) => servicos.buscar(req.params.id),
  );

  app.patch(
    '/services/:id',
    {
      preHandler: escrita,
      schema: {
        ...servico,
        summary: 'Altera serviço. Orçamentos já publicados mantêm o preço antigo',
        params: IdParams,
        body: AlteracaoServicoBody,
        response: { 200: ServicoSchema, 400: respostasErro[400], 404: respostasErro[404], ...erros },
      },
    },
    async (req) => servicos.atualizar(req.params.id, req.body),
  );

  app.delete(
    '/services/:id',
    {
      preHandler: escrita,
      schema: {
        ...servico,
        summary: 'Exclui serviço nunca usado. Usado em OS, devolve 409 e o caminho é inativar',
        params: IdParams,
        response: { 204: Type.Null(), 404: respostasErro[404], 409: respostasErro[409], ...erros },
      },
    },
    async (req, reply) => {
      await servicos.remover(req.params.id);
      return reply.status(204).send(null);
    },
  );

  // Peças e insumos ---------------------------------------------------------

  const peca = { tags: ['Peças e insumos'], ...seguranca };

  app.post(
    '/parts',
    {
      preHandler: escrita,
      schema: {
        ...peca,
        summary: 'Cadastra peça ou insumo com saldo zero. Saldo entra por movimento de estoque',
        body: NovaPecaBody,
        response: { 201: PecaSchema, 400: respostasErro[400], 409: respostasErro[409], ...erros },
      },
    },
    async (req, reply) => reply.status(201).send(comDisponivel(await pecas.criar(req.body))),
  );

  app.get(
    '/parts',
    {
      preHandler: leitura,
      schema: {
        ...peca,
        summary: 'Lista peças e insumos com saldo físico, reservado e disponível',
        querystring: Type.Object({ ...PaginacaoQuery, tipo: Type.Optional(TipoPeca), ativo: AtivoQuery }),
        response: { 200: ListaSchema(PecaSchema), 400: respostasErro[400], ...erros },
      },
    },
    async (req) => {
      const pagina = paginacao(req.query);
      const lista = await pecas.listar({ tipo: req.query.tipo, ativo: booleano(req.query.ativo) }, pagina);
      return { itens: lista.itens.map(comDisponivel), total: lista.total, ...pagina };
    },
  );

  app.get(
    '/parts/:id',
    {
      preHandler: leitura,
      schema: {
        ...peca,
        summary: 'Detalha peça ou insumo',
        params: IdParams,
        response: { 200: PecaSchema, 404: respostasErro[404], ...erros },
      },
    },
    async (req) => comDisponivel(await pecas.buscar(req.params.id)),
  );

  app.patch(
    '/parts/:id',
    {
      preHandler: escrita,
      schema: {
        ...peca,
        summary: 'Altera nome, preço ou situação. SKU, tipo, unidade e saldo não mudam aqui',
        params: IdParams,
        body: AlteracaoPecaBody,
        response: { 200: PecaSchema, 400: respostasErro[400], 404: respostasErro[404], ...erros },
      },
    },
    async (req) => comDisponivel(await pecas.atualizar(req.params.id, req.body)),
  );

  app.delete(
    '/parts/:id',
    {
      preHandler: escrita,
      schema: {
        ...peca,
        summary: 'Exclui peça sem movimento nem uso em OS. Caso contrário, 409 e o caminho é inativar',
        params: IdParams,
        response: { 204: Type.Null(), 404: respostasErro[404], 409: respostasErro[409], ...erros },
      },
    },
    async (req, reply) => {
      await pecas.remover(req.params.id);
      return reply.status(204).send(null);
    },
  );
};
