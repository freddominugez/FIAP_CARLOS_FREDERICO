import type {
  AlteracaoCliente,
  AlteracaoPeca,
  AlteracaoServico,
  AlteracaoVeiculo,
  Cliente,
  FiltroCliente,
  FiltroPeca,
  FiltroServico,
  FiltroVeiculo,
  NovaPeca,
  NovoCliente,
  NovoServico,
  NovoVeiculo,
  Peca,
  Servico,
  Veiculo,
} from '../../application/ports/cadastros.js';
import { RepositorioPg, type Condicoes } from './repositorio-pg.js';

type Linha = Record<string, unknown>;

/** Escapa %, _ e \ para o texto valer literalmente dentro do ILIKE. */
function escaparLike(texto: string): string {
  return texto.replaceAll(/[%_\\]/g, String.raw`\$&`);
}

/** Monta WHERE só com os filtros informados. */
function condicoes(pares: [string, unknown][]): Condicoes {
  const where: string[] = [];
  const params: unknown[] = [];
  for (const [expressao, valor] of pares) {
    if (valor === undefined) continue;
    params.push(valor);
    where.push(expressao.replace('?', `$${params.length}`));
  }
  return { where, params };
}

export class ClientePgRepository extends RepositorioPg<Cliente, NovoCliente, AlteracaoCliente, FiltroCliente> {
  protected readonly tabela = 'customers';
  protected readonly colunas = 'id, document, document_type, name, email, phone, active, created_at';
  protected readonly ordem = 'name, id';
  protected readonly campos = {
    documento: 'document',
    tipoDocumento: 'document_type',
    nome: 'name',
    email: 'email',
    telefone: 'phone',
    ativo: 'active',
  };
  protected readonly unicos: Record<string, [string, string]> = {
    customers_document_uk: ['DOCUMENTO_DUPLICADO', 'Já existe cliente com este CPF ou CNPJ'],
  };

  protected mapear(l: Linha): Cliente {
    return {
      id: l.id as string,
      documento: l.document as string,
      tipoDocumento: l.document_type as Cliente['tipoDocumento'],
      nome: l.name as string,
      email: l.email as string | null,
      telefone: l.phone as string | null,
      ativo: l.active as boolean,
      criadoEm: l.created_at as Date,
    };
  }

  protected condicoes(f: FiltroCliente): Condicoes {
    return condicoes([
      ['document = ?', f.documento],
      ['name ILIKE ?', f.nome === undefined ? undefined : `%${escaparLike(f.nome)}%`],
      ['active = ?', f.ativo],
    ]);
  }
}

export class VeiculoPgRepository extends RepositorioPg<Veiculo, NovoVeiculo, AlteracaoVeiculo, FiltroVeiculo> {
  protected readonly tabela = 'vehicles';
  protected readonly colunas = 'id, customer_id, plate, brand, model, year, active, created_at';
  protected readonly ordem = 'plate, id';
  protected readonly campos = {
    clienteId: 'customer_id',
    placa: 'plate',
    marca: 'brand',
    modelo: 'model',
    ano: 'year',
    ativo: 'active',
  };
  protected readonly unicos: Record<string, [string, string]> = {
    vehicles_plate_active_uk: ['PLACA_DUPLICADA', 'Já existe veículo ativo com esta placa'],
  };

  protected mapear(l: Linha): Veiculo {
    return {
      id: l.id as string,
      clienteId: l.customer_id as string,
      placa: l.plate as string,
      marca: l.brand as string,
      modelo: l.model as string,
      ano: l.year as number,
      ativo: l.active as boolean,
      criadoEm: l.created_at as Date,
    };
  }

  protected condicoes(f: FiltroVeiculo): Condicoes {
    return condicoes([
      ['customer_id = ?', f.clienteId],
      ['plate = ?', f.placa],
      ['active = ?', f.ativo],
    ]);
  }
}

export class ServicoPgRepository extends RepositorioPg<Servico, NovoServico, AlteracaoServico, FiltroServico> {
  protected readonly tabela = 'service_catalog';
  protected readonly colunas = 'id, name, description, price_cents, active, created_at';
  protected readonly ordem = 'name, id';
  protected readonly campos = { nome: 'name', descricao: 'description', precoCentavos: 'price_cents', ativo: 'active' };
  protected readonly unicos: Record<string, [string, string]> = {};

  protected mapear(l: Linha): Servico {
    return {
      id: l.id as string,
      nome: l.name as string,
      descricao: l.description as string | null,
      precoCentavos: l.price_cents as number,
      ativo: l.active as boolean,
      criadoEm: l.created_at as Date,
    };
  }

  protected condicoes(f: FiltroServico): Condicoes {
    return condicoes([['active = ?', f.ativo]]);
  }
}

export class PecaPgRepository extends RepositorioPg<Peca, NovaPeca, AlteracaoPeca, FiltroPeca> {
  protected readonly tabela = 'parts';
  protected readonly colunas = 'id, sku, name, kind, unit, price_cents, physical, reserved, active, created_at';
  protected readonly ordem = 'name, id';
  protected readonly campos = {
    sku: 'sku',
    nome: 'name',
    tipo: 'kind',
    unidade: 'unit',
    precoCentavos: 'price_cents',
    ativo: 'active',
  };
  protected readonly unicos: Record<string, [string, string]> = {
    parts_sku_key: ['SKU_DUPLICADO', 'Já existe peça com este SKU'],
  };

  protected mapear(l: Linha): Peca {
    return {
      id: l.id as string,
      sku: l.sku as string,
      nome: l.name as string,
      tipo: l.kind as Peca['tipo'],
      unidade: l.unit as Peca['unidade'],
      precoCentavos: l.price_cents as number,
      // numeric chega do pg como string
      estoqueFisico: Number(l.physical),
      estoqueReservado: Number(l.reserved),
      ativo: l.active as boolean,
      criadoEm: l.created_at as Date,
    };
  }

  protected condicoes(f: FiltroPeca): Condicoes {
    return condicoes([
      ['kind = ?', f.tipo],
      ['active = ?', f.ativo],
    ]);
  }
}
