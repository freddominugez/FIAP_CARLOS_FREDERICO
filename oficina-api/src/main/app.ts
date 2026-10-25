import { randomUUID } from 'node:crypto';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { ConsultarMinhasOrdens } from '../application/use-cases/atendimento/consulta-cliente.js';
import { DecidirOrcamento } from '../application/use-cases/atendimento/decidir-orcamento.js';
import { ExecutarOrdens } from '../application/use-cases/atendimento/execucao.js';
import { GerenciarOrdens } from '../application/use-cases/atendimento/ordens.js';
import { MovimentarEstoque } from '../application/use-cases/estoque/movimentar.js';
import { GerenciarPecas, GerenciarServicos } from '../application/use-cases/cadastros/catalogo.js';
import { GerenciarClientes } from '../application/use-cases/cadastros/clientes.js';
import { GerenciarVeiculos } from '../application/use-cases/cadastros/veiculos.js';
import { Autenticar } from '../application/use-cases/identidade/autenticar.js';
import { BcryptVerificador } from '../infrastructure/auth/bcrypt-verificador.js';
import type { Db } from '../infrastructure/db/pool.js';
import { UnidadeTrabalhoPg } from '../infrastructure/repositories/atendimento-pg.js';
import {
  ClientePgRepository,
  PecaPgRepository,
  ServicoPgRepository,
  VeiculoPgRepository,
} from '../infrastructure/repositories/cadastros-pg.js';
import { UsuarioPgRepository } from '../infrastructure/repositories/usuario-pg-repository.js';
import autenticacao from '../interfaces/http/plugins/autenticacao.js';
import tratamentoErros from '../interfaces/http/plugins/tratamento-erros.js';
import { rotasAutenticacao } from '../interfaces/http/routes/autenticacao.js';
import { rotasCatalogo } from '../interfaces/http/routes/catalogo.js';
import { rotasCliente } from '../interfaces/http/routes/cliente.js';
import { rotasClientes } from '../interfaces/http/routes/clientes.js';
import { rotasEstoque } from '../interfaces/http/routes/estoque.js';
import { rotasExecucao } from '../interfaces/http/routes/execucao.js';
import { rotasOrcamentos } from '../interfaces/http/routes/orcamentos.js';
import { rotasOrdens } from '../interfaces/http/routes/ordens.js';
import { rotasSaude } from '../interfaces/http/routes/saude.js';
import { rotasVeiculos } from '../interfaces/http/routes/veiculos.js';
import { ErroSchema } from '../interfaces/http/schemas/comum.js';
import type { Config } from './config.js';

export interface Dependencias {
  config: Config;
  db: Db;
  logger?: FastifyServerOptions['logger'];
}

/** Monta a aplicação. Composição das dependências fica toda aqui. */
export async function criarApp({ config, db, logger }: Dependencias) {
  const app = Fastify({
    logger: logger ?? {
      level: config.logLevel,
      redact: ['req.headers.authorization', 'req.body.senha', '*.senha', '*.password_hash'],
      // a query string pode trazer CPF ou placa: o log guarda só o caminho (RN12)
      serializers: {
        req: (req: { id: string; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url.split('?')[0],
        }),
      },
    },
    genReqId: () => randomUUID(),
    ajv: { customOptions: { removeAdditional: false, coerceTypes: false } },
  }).withTypeProvider<TypeBoxTypeProvider>();

  // POST sem corpo com content-type JSON (comum em clientes HTTP) vale como corpo ausente.
  // O resto continua no parser padrão, que barra __proto__ e constructor.
  const jsonPadrao = app.getDefaultJsonParser('error', 'error');
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, corpo, done) =>
    corpo === '' ? done(null, undefined) : jsonPadrao(req, corpo as string, done),
  );

  app.addHook('onSend', async (req, reply) => {
    reply.header('x-request-id', req.id);
  });

  app.addSchema(ErroSchema);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Oficina API',
        description: 'Back-end da oficina mecânica. Tech Challenge Fase 1, FIAP SOAT.',
        version: '0.5.1',
      },
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/api/docs' });

  await app.register(tratamentoErros);
  await app.register(autenticacao, { jwt: config.jwt });

  const usuarios = new UsuarioPgRepository(db);
  const bcrypt = new BcryptVerificador();
  const clientes = new ClientePgRepository(db);
  const autenticar = new Autenticar(usuarios, bcrypt);

  await app.register(
    async (v1) => {
      await v1.register(rotasSaude, { db });
      await v1.register(rotasAutenticacao, { autenticar });
      await v1.register(rotasClientes, { clientes: new GerenciarClientes(clientes, usuarios, bcrypt) });
      await v1.register(rotasVeiculos, { veiculos: new GerenciarVeiculos(new VeiculoPgRepository(db), clientes) });
      await v1.register(rotasCatalogo, {
        servicos: new GerenciarServicos(new ServicoPgRepository(db)),
        pecas: new GerenciarPecas(new PecaPgRepository(db)),
      });
      const uow = new UnidadeTrabalhoPg(db);
      await v1.register(rotasEstoque, { estoque: new MovimentarEstoque(uow) });
      await v1.register(rotasOrdens, { ordens: new GerenciarOrdens(uow) });
      await v1.register(rotasOrcamentos, { decidir: new DecidirOrcamento(uow) });
      await v1.register(rotasExecucao, { execucao: new ExecutarOrdens(uow) });
      await v1.register(rotasCliente, { consulta: new ConsultarMinhasOrdens(uow) });
    },
    { prefix: '/api/v1' },
  );

  return app;
}

export type App = Awaited<ReturnType<typeof criarApp>>;
