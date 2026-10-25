import { Type, type FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import type { Autenticar } from '../../../application/use-cases/identidade/autenticar.js';
import { respostasErro } from '../schemas/comum.js';

const PerfilSchema = Type.Union([
  Type.Literal('ADMIN'),
  Type.Literal('ATENDENTE'),
  Type.Literal('TECNICO'),
  Type.Literal('CLIENTE'),
]);

const UsuarioSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  nome: Type.String(),
  perfil: PerfilSchema,
  clienteId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
});

export const rotasAutenticacao: FastifyPluginAsyncTypebox<{ autenticar: Autenticar }> = async (
  app,
  { autenticar },
) => {
  app.post(
    '/auth/login',
    {
      schema: {
        tags: ['Autenticação'],
        summary: 'Troca e-mail e senha por um JWT',
        body: Type.Object({
          email: Type.String({ format: 'email', maxLength: 254 }),
          senha: Type.String({ minLength: 1, maxLength: 200 }),
        }),
        response: {
          200: Type.Object({ token: Type.String(), tipo: Type.Literal('Bearer'), usuario: UsuarioSchema }),
          400: respostasErro[400],
          401: respostasErro[401],
        },
      },
    },
    async (req) => {
      const id = await autenticar.executar(req.body.email, req.body.senha);
      const token = await app.jwt.sign({
        sub: id.usuarioId,
        nome: id.nome,
        perfil: id.perfil,
        clienteId: id.clienteId,
      });
      return {
        token,
        tipo: 'Bearer' as const,
        usuario: { id: id.usuarioId, nome: id.nome, perfil: id.perfil, clienteId: id.clienteId },
      };
    },
  );

  app.get(
    '/auth/me',
    {
      preHandler: app.autenticar,
      schema: {
        tags: ['Autenticação'],
        summary: 'Dados do usuário do token',
        security: [{ bearerAuth: [] }],
        response: { 200: UsuarioSchema, 401: respostasErro[401] },
      },
    },
    async (req) => ({
      id: req.user.sub,
      nome: req.user.nome,
      perfil: req.user.perfil,
      clienteId: req.user.clienteId,
    }),
  );
};
