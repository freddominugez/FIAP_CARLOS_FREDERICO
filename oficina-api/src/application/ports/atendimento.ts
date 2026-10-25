import type { Decisao, StatusOrcamento } from '../../domain/atendimento/decisao.js';
import type { StatusOS } from '../../domain/atendimento/ordem-servico.js';
import type { LinhaOrcamento, TipoItem } from '../../domain/atendimento/orcamento.js';
import type { Lista, Paginacao, TipoPeca, Unidade } from './cadastros.js';
import type { EstoqueRepository } from './estoque.js';

export type { StatusOrcamento };

export interface OrdemServico {
  id: string;
  numero: string;
  status: StatusOS;
  versao: number;
  clienteId: string;
  veiculoId: string;
  solicitacao: string;
  criadaPor: string;
  recebidaEm: Date;
  execucaoIniciadaEm: Date | null;
  finalizadaEm: Date | null;
  entregueEm: Date | null;
}

export interface ItemServicoOS {
  id: string;
  servicoId: string;
  nome: string;
  quantidade: number;
  precoUnitarioCentavos: number;
  ativo: boolean;
  concluidoEm: Date | null;
}

export interface ItemPecaOS {
  id: string;
  pecaId: string;
  sku: string;
  nome: string;
  tipo: TipoPeca;
  unidade: Unidade;
  quantidade: number;
  precoUnitarioCentavos: number;
  ativo: boolean;
}

export interface ItemOrcamentoGravado extends LinhaOrcamento {
  id: string;
  /** baixa física da peça na execução; null para serviço ou peça ainda não usada */
  consumidoEm: Date | null;
}

export interface DecisaoRegistrada {
  decisao: Decisao;
  motivo: string | null;
  decididoPor: string;
  decididoEm: Date;
}

export interface Orcamento {
  id: string;
  versao: number;
  status: StatusOrcamento;
  totalCentavos: number;
  publicadoPor: string;
  publicadoEm: Date;
  decisao: DecisaoRegistrada | null;
  itens: ItemOrcamentoGravado[];
}

export interface ReferenciaOrcamento {
  id: string;
  osId: string;
  versao: number;
  status: StatusOrcamento;
  decisao: Decisao | null;
}

export interface MudancaStatus {
  de: StatusOS | null;
  para: StatusOS;
  autorId: string;
  em: Date;
}

export interface RegistroIdempotente {
  operacao: string;
  hash: string;
  status: number;
  corpo: { id: string };
}

export interface FiltroOS {
  status?: StatusOS;
  clienteId?: string;
}

/** Acesso aos dados do contexto Atendimento. Sempre usado dentro de uma unidade de trabalho. */
export interface AtendimentoRepository {
  /** Com `bloquear`, segura a linha da OS até o fim da transação (SELECT FOR UPDATE). */
  buscarOS(id: string, opcoes?: { bloquear?: boolean }): Promise<OrdemServico | null>;
  listarOS(filtro: FiltroOS, pagina: Paginacao): Promise<Lista<OrdemServico>>;
  /** Gera o número público e grava a entrada no histórico. */
  inserirOS(dados: { clienteId: string; veiculoId: string; solicitacao: string; criadaPor: string }): Promise<OrdemServico>;
  /** Grava o novo status, incrementa a versão, carimba a data e registra o histórico. */
  mudarStatus(os: OrdemServico, para: StatusOS, autorId: string): Promise<OrdemServico>;
  incrementarVersao(osId: string): Promise<void>;
  /** Marca o serviço como concluído. Repetir não muda a data da primeira conclusão. */
  concluirServico(osId: string, itemId: string): Promise<void>;
  /** Média de (finalizada - execução iniciada) das OS finalizadas no período [de, ate) (RN10). */
  tempoMedioExecucao(de: Date, ate: Date): Promise<{ mediaSegundos: number | null; amostra: number }>;
  historico(osId: string): Promise<MudancaStatus[]>;

  buscarCliente(id: string): Promise<{ ativo: boolean } | null>;
  buscarVeiculo(id: string): Promise<{ clienteId: string; ativo: boolean } | null>;
  buscarServico(id: string): Promise<{ nome: string; ativo: boolean } | null>;
  buscarPeca(id: string): Promise<{ nome: string; tipo: TipoPeca; ativo: boolean } | null>;

  adicionarServico(osId: string, servicoId: string, quantidade: number): Promise<void>;
  adicionarPeca(osId: string, pecaId: string, quantidade: number): Promise<void>;
  removerItem(osId: string, tipo: TipoItem, itemId: string): Promise<boolean>;
  /** Itens com nome, preço e situação atuais do catálogo. */
  servicosDaOS(osId: string): Promise<ItemServicoOS[]>;
  pecasDaOS(osId: string): Promise<ItemPecaOS[]>;

  /** Versões publicadas, da mais nova para a mais antiga. */
  orcamentos(osId: string): Promise<Orcamento[]>;
  publicarOrcamento(osId: string, versao: number, linhas: LinhaOrcamento[], totalCentavos: number, autorId: string): Promise<void>;
  buscarOrcamento(id: string): Promise<ReferenciaOrcamento | null>;
  mudarStatusOrcamento(id: string, status: StatusOrcamento): Promise<void>;
  registrarDecisao(orcamentoId: string, decisao: Decisao, motivo: string | null, autorId: string): Promise<void>;

  /** Bloqueia a chave até o fim da transação, para que duas requisições iguais não rodem juntas. */
  buscarIdempotencia(usuarioId: string, chave: string): Promise<RegistroIdempotente | null>;
  salvarIdempotencia(usuarioId: string, chave: string, registro: RegistroIdempotente): Promise<void>;
}

export interface Repositorios {
  atendimento: AtendimentoRepository;
  estoque: EstoqueRepository;
}

/** Uma transação por caso de uso: commit no sucesso, rollback em qualquer erro (RN13). */
export interface UnidadeTrabalho {
  executar<T>(fn: (repos: Repositorios) => Promise<T>): Promise<T>;
}
