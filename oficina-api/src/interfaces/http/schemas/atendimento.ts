import { Type } from '@fastify/type-provider-typebox';

const Data = Type.Unsafe<Date>({ type: 'string', format: 'date-time' });
const DataNula = Type.Union([Data, Type.Null()]);
const Id = Type.String({ format: 'uuid' });

export const StatusOSSchema = Type.Union([
  Type.Literal('RECEBIDA'),
  Type.Literal('EM_DIAGNOSTICO'),
  Type.Literal('AGUARDANDO_APROVACAO'),
  Type.Literal('EM_EXECUCAO'),
  Type.Literal('FINALIZADA'),
  Type.Literal('ENTREGUE'),
]);

const TipoItem = Type.Union([Type.Literal('SERVICO'), Type.Literal('PECA')]);

export const OrdemSchema = Type.Object({
  id: Id,
  numero: Type.String({ examples: ['OS-2026-000123'] }),
  status: StatusOSSchema,
  versao: Type.Integer({ description: 'enviar de volta em toda mudança de status (concorrência otimista)' }),
  clienteId: Id,
  veiculoId: Id,
  solicitacao: Type.String(),
  criadaPor: Id,
  recebidaEm: Data,
  execucaoIniciadaEm: DataNula,
  finalizadaEm: DataNula,
  entregueEm: DataNula,
});

const ItemOrcamentoSchema = Type.Object({
  id: Id,
  tipo: TipoItem,
  referenciaId: Id,
  descricao: Type.String(),
  unidade: Type.String(),
  quantidade: Type.Number(),
  precoUnitarioCentavos: Type.Integer(),
  totalCentavos: Type.Integer(),
  consumidoEm: Type.Union([Data, Type.Null()], { description: 'baixa da peça na execução' }),
});

export const OrcamentoSchema = Type.Object({
  id: Id,
  versao: Type.Integer(),
  status: Type.Union([
    Type.Literal('PENDENTE'),
    Type.Literal('APROVADO'),
    Type.Literal('REJEITADO'),
    Type.Literal('INVALIDADO'),
  ]),
  totalCentavos: Type.Integer(),
  publicadoPor: Id,
  publicadoEm: Data,
  decisao: Type.Union([
    Type.Object({
      decisao: Type.Union([Type.Literal('APROVADO'), Type.Literal('REJEITADO')]),
      motivo: Type.Union([Type.String(), Type.Null()]),
      decididoPor: Id,
      decididoEm: Data,
    }),
    Type.Null(),
  ]),
  itens: Type.Array(ItemOrcamentoSchema),
});

export const DetalheOSSchema = Type.Object({
  ...OrdemSchema.properties,
  servicos: Type.Array(
    Type.Object({
      id: Id,
      servicoId: Id,
      nome: Type.String(),
      quantidade: Type.Integer(),
      precoUnitarioCentavos: Type.Integer({ description: 'preço atual do catálogo' }),
      totalCentavos: Type.Integer(),
      ativo: Type.Boolean(),
      concluidoEm: DataNula,
    }),
  ),
  pecas: Type.Array(
    Type.Object({
      id: Id,
      pecaId: Id,
      sku: Type.String(),
      nome: Type.String(),
      tipo: Type.Union([Type.Literal('PECA'), Type.Literal('INSUMO')]),
      unidade: Type.String(),
      quantidade: Type.Number(),
      precoUnitarioCentavos: Type.Integer({ description: 'preço atual do catálogo' }),
      totalCentavos: Type.Integer(),
      ativo: Type.Boolean(),
    }),
  ),
  estimativaCentavos: Type.Integer({ description: 'itens a preço atual. O valor que vale é o do orçamento publicado' }),
  orcamentos: Type.Array(OrcamentoSchema, { description: 'versões publicadas, da mais nova para a mais antiga' }),
  historico: Type.Array(
    Type.Object({ de: Type.Union([StatusOSSchema, Type.Null()]), para: StatusOSSchema, autorId: Id, em: Data }),
  ),
});

export const AberturaBody = Type.Object(
  {
    clienteId: Id,
    veiculoId: Id,
    solicitacao: Type.String({ minLength: 1, maxLength: 2000, examples: ['Barulho na suspensão dianteira'] }),
  },
  { additionalProperties: false },
);

export const VersaoBody = Type.Object(
  { versao: Type.Integer({ minimum: 1, description: 'versão da OS lida pelo cliente' }) },
  { additionalProperties: false },
);

export const ServicoItemBody = Type.Object(
  { servicoId: Id, quantidade: Type.Integer({ minimum: 1 }) },
  { additionalProperties: false },
);

export const PecaItemBody = Type.Object(
  { pecaId: Id, quantidade: Type.Number({ exclusiveMinimum: 0, description: 'peça inteira, insumo até 3 casas' }) },
  { additionalProperties: false },
);

export const ItemParams = Type.Object({ id: Id, itemId: Id });

export const IdempotenciaHeaders = Type.Object({
  'idempotency-key': Type.Optional(
    Type.String({ minLength: 8, maxLength: 100, description: 'repetir a chamada com a mesma chave não abre outra OS' }),
  ),
});

export const DecisaoBody = Type.Object(
  {
    decisao: Type.Union([Type.Literal('APROVADO'), Type.Literal('REJEITADO')]),
    motivo: Type.Optional(Type.String({ maxLength: 500 })),
  },
  { additionalProperties: false },
);

export const DecisaoResposta = Type.Object({
  osId: Id,
  numeroOS: Type.String(),
  orcamento: OrcamentoSchema,
});

const TipoMovimento = Type.Union([
  Type.Literal('ENTRADA'),
  Type.Literal('AJUSTE'),
  Type.Literal('RESERVA'),
  Type.Literal('LIBERACAO'),
  Type.Literal('CONSUMO'),
  Type.Literal('ESTORNO'),
]);

export const MovimentoSchema = Type.Object({
  id: Id,
  pecaId: Id,
  tipo: TipoMovimento,
  quantidade: Type.Number(),
  itemOrcamentoId: Type.Union([Id, Type.Null()]),
  referenteA: Type.Union([Id, Type.Null()], { description: 'movimento desfeito por este' }),
  observacao: Type.Union([Type.String(), Type.Null()]),
  autorId: Id,
  em: Data,
});

export const MovimentoBody = Type.Object(
  {
    tipo: Type.Union([Type.Literal('ENTRADA'), Type.Literal('AJUSTE')], {
      description: 'ENTRADA soma ao físico. AJUSTE é baixa por perda ou inventário',
    }),
    quantidade: Type.Number({ exclusiveMinimum: 0 }),
    observacao: Type.Optional(Type.String({ maxLength: 500, description: 'obrigatória no AJUSTE' })),
  },
  { additionalProperties: false },
);

export const MovimentoResposta = Type.Object({
  movimento: MovimentoSchema,
  saldo: Type.Object({ fisico: Type.Number(), reservado: Type.Number(), disponivel: Type.Number() }),
});

export const ConsumoBody = Type.Object(
  { itemOrcamentoId: Type.String({ format: 'uuid', description: 'linha de peça do orçamento aprovado' }) },
  { additionalProperties: false },
);

export const ServicoItemParams = Type.Object({ id: Id, itemId: Id });

export const EstornoParams = Type.Object({ id: Id, movimentoId: Id });

export const EstornoBody = Type.Object(
  { observacao: Type.String({ minLength: 1, maxLength: 500 }) },
  { additionalProperties: false },
);

/** Visão do cliente: sem itens de rascunho, estimativa nem identificação de quem operou. */
export const MinhaOSSchema = Type.Object({
  id: Id,
  numero: Type.String(),
  status: StatusOSSchema,
  veiculoId: Id,
  solicitacao: Type.String(),
  recebidaEm: Data,
  execucaoIniciadaEm: DataNula,
  finalizadaEm: DataNula,
  entregueEm: DataNula,
});

export const MinhaOSDetalheSchema = Type.Object({
  ...MinhaOSSchema.properties,
  orcamentos: Type.Array(
    Type.Object({
      id: Id,
      versao: Type.Integer(),
      status: OrcamentoSchema.properties.status,
      totalCentavos: Type.Integer(),
      publicadoEm: Data,
      decisao: Type.Union([
        Type.Object({
          decisao: Type.Union([Type.Literal('APROVADO'), Type.Literal('REJEITADO')]),
          motivo: Type.Union([Type.String(), Type.Null()]),
          decididoEm: Data,
        }),
        Type.Null(),
      ]),
      itens: Type.Array(
        Type.Object({
          tipo: TipoItem,
          descricao: Type.String(),
          unidade: Type.String(),
          quantidade: Type.Number(),
          precoUnitarioCentavos: Type.Integer(),
          totalCentavos: Type.Integer(),
        }),
      ),
    }),
  ),
  historico: Type.Array(Type.Object({ de: Type.Union([StatusOSSchema, Type.Null()]), para: StatusOSSchema, em: Data })),
});

export const TempoMedioQuery = Type.Object({
  de: Type.String({ format: 'date-time', examples: ['2026-10-01T00:00:00-03:00'] }),
  ate: Type.String({ format: 'date-time', examples: ['2026-11-01T00:00:00-03:00'] }),
});

export const TempoMedioSchema = Type.Object({
  de: Data,
  ate: Data,
  amostra: Type.Integer({ description: 'OS finalizadas no período' }),
  mediaSegundos: Type.Union([Type.Integer(), Type.Null()], { description: 'null sem amostra' }),
  mediaHoras: Type.Union([Type.Number(), Type.Null()]),
});
