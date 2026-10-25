import { Type } from '@fastify/type-provider-typebox';

export const ErroSchema = Type.Object(
  {
    code: Type.String({ examples: ['ENTRADA_INVALIDA'] }),
    message: Type.String(),
    request_id: Type.String(),
  },
  { $id: 'Erro' },
);

export const respostasErro = {
  400: ErroSchema,
  401: ErroSchema,
  403: ErroSchema,
  404: ErroSchema,
  409: ErroSchema,
  500: ErroSchema,
};
