import { Type, type Static, type TSchema } from '@fastify/type-provider-typebox';

export const IdParams = Type.Object({ id: Type.String({ format: 'uuid' }) });

// Query string chega como texto e o AJV roda sem coerção de tipos, por isso números e booleanos vão como padrão.
export const PaginacaoQuery = {
  limite: Type.Optional(Type.String({ pattern: '^(100|[1-9][0-9]?)$', description: '1 a 100, padrão 20' })),
  deslocamento: Type.Optional(Type.String({ pattern: '^[0-9]{1,6}$', description: 'padrão 0' })),
};
export const AtivoQuery = Type.Optional(Type.Union([Type.Literal('true'), Type.Literal('false')]));

export function paginacao(q: { limite?: string; deslocamento?: string }) {
  return { limite: Number(q.limite ?? 20), deslocamento: Number(q.deslocamento ?? 0) };
}

export function booleano(valor: 'true' | 'false' | undefined): boolean | undefined {
  return valor === undefined ? undefined : valor === 'true';
}

export function ListaSchema<T extends TSchema>(item: T) {
  return Type.Object({
    itens: Type.Array(item),
    total: Type.Integer(),
    limite: Type.Integer(),
    deslocamento: Type.Integer(),
  });
}

// o repositório devolve Date e o serializador escreve ISO 8601
const Data = Type.Unsafe<Date>({ type: 'string', format: 'date-time' });
const Centavos = Type.Integer({ minimum: 0, maximum: 10_000_000_000, description: 'valor em centavos' });
const TextoCurto = (max: number) => Type.String({ minLength: 1, maxLength: max });
const Nulavel = <T extends TSchema>(t: T) => Type.Union([t, Type.Null()]);

// Clientes ------------------------------------------------------------------

export const ClienteSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  documento: Type.String({ description: 'sem pontuação, CNPJ pode ter letras' }),
  tipoDocumento: Type.Union([Type.Literal('CPF'), Type.Literal('CNPJ')]),
  nome: Type.String(),
  email: Nulavel(Type.String()),
  telefone: Nulavel(Type.String()),
  ativo: Type.Boolean(),
  criadoEm: Data,
});

export const NovoClienteBody = Type.Object(
  {
    documento: Type.String({ minLength: 11, maxLength: 18, examples: ['529.982.247-25', '12.ABC.345/01DE-35'] }),
    nome: TextoCurto(200),
    email: Type.Optional(Nulavel(Type.String({ format: 'email', maxLength: 254 }))),
    telefone: Type.Optional(Nulavel(Type.String({ maxLength: 20 }))),
  },
  { additionalProperties: false },
);

export const AlteracaoClienteBody = Type.Object(
  {
    nome: Type.Optional(TextoCurto(200)),
    email: Type.Optional(Nulavel(Type.String({ format: 'email', maxLength: 254 }))),
    telefone: Type.Optional(Nulavel(Type.String({ maxLength: 20 }))),
    ativo: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false, minProperties: 1 },
);

export const AcessoClienteBody = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 254 }),
    senha: Type.String({ minLength: 8, maxLength: 200 }),
  },
  { additionalProperties: false },
);

// Veículos ------------------------------------------------------------------

export const VeiculoSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  clienteId: Type.String({ format: 'uuid' }),
  placa: Type.String(),
  marca: Type.String(),
  modelo: Type.String(),
  ano: Type.Integer(),
  ativo: Type.Boolean(),
  criadoEm: Data,
});

export const NovoVeiculoBody = Type.Object(
  {
    clienteId: Type.String({ format: 'uuid' }),
    placa: Type.String({ minLength: 7, maxLength: 8, examples: ['ABC1D23', 'ABC-1234'] }),
    marca: TextoCurto(60),
    modelo: TextoCurto(80),
    ano: Type.Integer(),
  },
  { additionalProperties: false },
);

export const AlteracaoVeiculoBody = Type.Object(
  {
    clienteId: Type.Optional(Type.String({ format: 'uuid' })),
    marca: Type.Optional(TextoCurto(60)),
    modelo: Type.Optional(TextoCurto(80)),
    ano: Type.Optional(Type.Integer()),
    ativo: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false, minProperties: 1 },
);

// Serviços ------------------------------------------------------------------

export const ServicoSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  nome: Type.String(),
  descricao: Nulavel(Type.String()),
  precoCentavos: Type.Integer(),
  ativo: Type.Boolean(),
  criadoEm: Data,
});

export const NovoServicoBody = Type.Object(
  {
    nome: TextoCurto(120),
    descricao: Type.Optional(Nulavel(Type.String({ maxLength: 2000 }))),
    precoCentavos: Centavos,
  },
  { additionalProperties: false },
);

export const AlteracaoServicoBody = Type.Object(
  {
    nome: Type.Optional(TextoCurto(120)),
    descricao: Type.Optional(Nulavel(Type.String({ maxLength: 2000 }))),
    precoCentavos: Type.Optional(Centavos),
    ativo: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false, minProperties: 1 },
);

// Peças e insumos -------------------------------------------------------------

const TipoPeca = Type.Union([Type.Literal('PECA'), Type.Literal('INSUMO')]);

export const PecaSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  sku: Type.String(),
  nome: Type.String(),
  tipo: TipoPeca,
  unidade: Type.Union([Type.Literal('UN'), Type.Literal('L'), Type.Literal('KG'), Type.Literal('M')]),
  precoCentavos: Type.Integer({ description: 'preço por unidade' }),
  estoqueFisico: Type.Number(),
  estoqueReservado: Type.Number(),
  estoqueDisponivel: Type.Number({ description: 'físico menos reservado' }),
  ativo: Type.Boolean(),
  criadoEm: Data,
});

export const NovaPecaBody = Type.Object(
  {
    sku: Type.String({ minLength: 1, maxLength: 40, pattern: '^[A-Za-z0-9._-]+$' }),
    nome: TextoCurto(120),
    tipo: TipoPeca,
    unidade: Type.Union([Type.Literal('UN'), Type.Literal('L'), Type.Literal('KG'), Type.Literal('M')]),
    precoCentavos: Centavos,
  },
  { additionalProperties: false },
);

export const AlteracaoPecaBody = Type.Object(
  {
    nome: Type.Optional(TextoCurto(120)),
    precoCentavos: Type.Optional(Centavos),
    ativo: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false, minProperties: 1 },
);

export type PecaResposta = Static<typeof PecaSchema>;
export { TipoPeca };
