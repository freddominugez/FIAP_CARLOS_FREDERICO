import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { Perfil } from '../../../domain/identidade/perfil.js';
import { ForbiddenError, UnauthorizedError } from '../../../domain/shared/errors.js';
import type { Config } from '../../../main/config.js';

export interface UsuarioToken {
  sub: string;
  nome: string;
  perfil: Perfil;
  clienteId: string | null;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UsuarioToken;
    user: UsuarioToken;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /** preHandler: exige JWT válido. */
    autenticar: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** preHandler: exige JWT válido e um dos perfis. */
    exigirPerfil: (...perfis: Perfil[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function autenticacao(app: FastifyInstance, opts: { jwt: Config['jwt'] }) {
  await app.register(fastifyJwt, {
    secret: opts.jwt.secret,
    sign: { expiresIn: opts.jwt.expiresIn, iss: opts.jwt.issuer, aud: opts.jwt.audience },
    verify: { allowedIss: opts.jwt.issuer, allowedAud: opts.jwt.audience },
  });

  const autenticar = async (req: FastifyRequest) => {
    try {
      await req.jwtVerify();
    } catch {
      throw new UnauthorizedError('TOKEN_INVALIDO', 'Token ausente, expirado ou inválido');
    }
  };

  app.decorate('autenticar', autenticar);
  app.decorate('exigirPerfil', (...perfis: Perfil[]) => async (req: FastifyRequest) => {
    await autenticar(req);
    if (!perfis.includes(req.user.perfil)) {
      throw new ForbiddenError('PERFIL_SEM_PERMISSAO', 'Perfil sem permissão para esta operação');
    }
  });
}

export default fp(autenticacao, { name: 'autenticacao' });
