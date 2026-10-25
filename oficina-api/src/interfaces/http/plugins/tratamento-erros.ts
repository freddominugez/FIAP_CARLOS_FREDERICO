import type { FastifyError, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../../../domain/shared/errors.js';

/**
 * Traduz erros em respostas com código estável e request_id.
 * Erro inesperado vira 500 sem detalhe interno. O detalhe vai só para o log.
 */
async function tratamentoErros(app: FastifyInstance) {
  app.setErrorHandler((erro: FastifyError | AppError, req, reply) => {
    const requestId = req.id;

    if (erro instanceof AppError) {
      return reply.status(erro.status).send({ code: erro.code, message: erro.message, request_id: requestId });
    }
    if ('validation' in erro && erro.validation) {
      return reply.status(400).send({ code: 'ENTRADA_INVALIDA', message: erro.message, request_id: requestId });
    }
    if (erro.statusCode && erro.statusCode >= 400 && erro.statusCode < 500) {
      return reply
        .status(erro.statusCode)
        .send({ code: erro.code ?? 'REQUISICAO_INVALIDA', message: erro.message, request_id: requestId });
    }

    req.log.error({ err: erro }, 'erro não tratado');
    return reply.status(500).send({ code: 'ERRO_INTERNO', message: 'Erro interno', request_id: requestId });
  });

  app.setNotFoundHandler((req, reply) =>
    reply.status(404).send({ code: 'ROTA_INEXISTENTE', message: 'Rota não encontrada', request_id: req.id }),
  );
}

export default fp(tratamentoErros, { name: 'tratamento-erros' });
