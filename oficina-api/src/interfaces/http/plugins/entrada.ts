import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ValidationError } from '../../../domain/shared/errors.js';

const NULO = String.raw`Caractere nulo (\u0000) não é aceito`;

function contemNulo(valor: unknown): boolean {
  if (typeof valor === 'string') return valor.includes('\u0000');
  if (Array.isArray(valor)) return valor.some(contemNulo);
  if (valor && typeof valor === 'object') return Object.values(valor).some(contemNulo);
  return false;
}

/**
 * Leitura da entrada antes da validação de schema.
 * - JSON vazio com content-type JSON (comum em clientes HTTP) vale como corpo ausente.
 * - O resto passa pelo parser padrão do Fastify, que barra __proto__ e constructor.
 * - Caractere nulo é recusado no corpo e na URL: o PostgreSQL não grava esse byte e responderia
 *   com erro interno (achado do OWASP ZAP na D+7).
 */
async function entrada(app: FastifyInstance) {
  const jsonPadrao = app.getDefaultJsonParser('error', 'error');
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, corpo, done) => {
    if (corpo === '') return done(null, undefined);
    jsonPadrao(req, corpo as string, (erro, valor) => {
      if (erro) return done(erro);
      if (contemNulo(valor)) return done(new ValidationError('ENTRADA_INVALIDA', NULO));
      done(null, valor);
    });
  });

  app.addHook('onRequest', async (req) => {
    if (/%00/i.test(req.url)) throw new ValidationError('ENTRADA_INVALIDA', NULO);
  });
}

export default fp(entrada, { name: 'entrada' });
