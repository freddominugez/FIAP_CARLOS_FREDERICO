import type { TipoDocumento } from '../../domain/cadastros/documento.js';

export interface Paginacao {
  limite: number;
  deslocamento: number;
}

export interface Lista<T> {
  itens: T[];
  total: number;
}

/**
 * Repositórios de cadastro. `remover` devolve false se o registro não existe e
 * lança ConflictError se ele tem histórico (RN12).
 * Duplicidade de documento, placa ativa, SKU ou e-mail vira ConflictError.
 */
export interface CadastroRepository<T, Novo, Alteracao, Filtro> {
  criar(dados: Novo): Promise<T>;
  buscar(id: string): Promise<T | null>;
  listar(filtro: Filtro, pagina: Paginacao): Promise<Lista<T>>;
  atualizar(id: string, dados: Alteracao): Promise<T | null>;
  remover(id: string): Promise<boolean>;
}

// Clientes ------------------------------------------------------------------

export interface Cliente {
  id: string;
  documento: string;
  tipoDocumento: TipoDocumento;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  criadoEm: Date;
}

export type NovoCliente = Pick<Cliente, 'documento' | 'tipoDocumento' | 'nome' | 'email' | 'telefone'>;
export type AlteracaoCliente = Partial<Pick<Cliente, 'nome' | 'email' | 'telefone' | 'ativo'>>;
export interface FiltroCliente {
  documento?: string;
  nome?: string;
  ativo?: boolean;
}
export type ClienteRepository = CadastroRepository<Cliente, NovoCliente, AlteracaoCliente, FiltroCliente>;

// Veículos ------------------------------------------------------------------

export interface Veiculo {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  ativo: boolean;
  criadoEm: Date;
}

export type NovoVeiculo = Pick<Veiculo, 'clienteId' | 'placa' | 'marca' | 'modelo' | 'ano'>;
export type AlteracaoVeiculo = Partial<Pick<Veiculo, 'clienteId' | 'marca' | 'modelo' | 'ano' | 'ativo'>>;
export interface FiltroVeiculo {
  clienteId?: string;
  placa?: string;
  ativo?: boolean;
}
export type VeiculoRepository = CadastroRepository<Veiculo, NovoVeiculo, AlteracaoVeiculo, FiltroVeiculo>;

// Serviços ------------------------------------------------------------------

export interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  precoCentavos: number;
  ativo: boolean;
  criadoEm: Date;
}

export type NovoServico = Pick<Servico, 'nome' | 'descricao' | 'precoCentavos'>;
export type AlteracaoServico = Partial<Pick<Servico, 'nome' | 'descricao' | 'precoCentavos' | 'ativo'>>;
export interface FiltroServico {
  ativo?: boolean;
}
export type ServicoRepository = CadastroRepository<Servico, NovoServico, AlteracaoServico, FiltroServico>;

// Peças e insumos -------------------------------------------------------------

export type TipoPeca = 'PECA' | 'INSUMO';
export type Unidade = 'UN' | 'L' | 'KG' | 'M';

export interface Peca {
  id: string;
  sku: string;
  nome: string;
  tipo: TipoPeca;
  unidade: Unidade;
  precoCentavos: number;
  estoqueFisico: number;
  estoqueReservado: number;
  ativo: boolean;
  criadoEm: Date;
}

export type NovaPeca = Pick<Peca, 'sku' | 'nome' | 'tipo' | 'unidade' | 'precoCentavos'>;
export type AlteracaoPeca = Partial<Pick<Peca, 'nome' | 'precoCentavos' | 'ativo'>>;
export interface FiltroPeca {
  tipo?: TipoPeca;
  ativo?: boolean;
}
export type PecaRepository = CadastroRepository<Peca, NovaPeca, AlteracaoPeca, FiltroPeca>;
