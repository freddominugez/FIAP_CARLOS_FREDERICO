import { NotFoundError } from '../../../domain/shared/errors.js';
import { textoObrigatorio, textoOpcional } from '../../../domain/shared/texto.js';
import type {
  AlteracaoPeca,
  AlteracaoServico,
  FiltroPeca,
  FiltroServico,
  Lista,
  NovaPeca,
  NovoServico,
  Paginacao,
  Peca,
  PecaRepository,
  Servico,
  ServicoRepository,
} from '../../ports/cadastros.js';

export type DadosServico = Omit<NovoServico, 'descricao'> & { descricao?: string | null };

/** Catálogo de serviços. Preço em centavos inteiros (RN04). */
export class GerenciarServicos {
  constructor(private readonly servicos: ServicoRepository) {}

  async criar(dados: DadosServico): Promise<Servico> {
    return this.servicos.criar({
      nome: textoObrigatorio(dados.nome, 'nome'),
      descricao: textoOpcional(dados.descricao),
      precoCentavos: dados.precoCentavos,
    });
  }

  async buscar(id: string): Promise<Servico> {
    return (await this.servicos.buscar(id)) ?? servicoNaoEncontrado();
  }

  async listar(filtro: FiltroServico, pagina: Paginacao): Promise<Lista<Servico>> {
    return this.servicos.listar(filtro, pagina);
  }

  async atualizar(id: string, dados: AlteracaoServico): Promise<Servico> {
    const alteracao: AlteracaoServico = { ativo: dados.ativo, precoCentavos: dados.precoCentavos };
    if (dados.nome !== undefined) alteracao.nome = textoObrigatorio(dados.nome, 'nome');
    if (dados.descricao !== undefined) alteracao.descricao = textoOpcional(dados.descricao);
    return (await this.servicos.atualizar(id, alteracao)) ?? servicoNaoEncontrado();
  }

  async remover(id: string): Promise<void> {
    if (!(await this.servicos.remover(id))) servicoNaoEncontrado();
  }
}

/**
 * Peças e insumos. O saldo não é editável aqui: entra e sai só por movimento de estoque (RN07).
 * SKU, tipo e unidade são fixos depois de criados.
 */
export class GerenciarPecas {
  constructor(private readonly pecas: PecaRepository) {}

  async criar(dados: NovaPeca): Promise<Peca> {
    return this.pecas.criar({
      sku: textoObrigatorio(dados.sku, 'sku').toUpperCase(),
      nome: textoObrigatorio(dados.nome, 'nome'),
      tipo: dados.tipo,
      unidade: dados.unidade,
      precoCentavos: dados.precoCentavos,
    });
  }

  async buscar(id: string): Promise<Peca> {
    return (await this.pecas.buscar(id)) ?? pecaNaoEncontrada();
  }

  async listar(filtro: FiltroPeca, pagina: Paginacao): Promise<Lista<Peca>> {
    return this.pecas.listar(filtro, pagina);
  }

  async atualizar(id: string, dados: AlteracaoPeca): Promise<Peca> {
    const alteracao: AlteracaoPeca = { ativo: dados.ativo, precoCentavos: dados.precoCentavos };
    if (dados.nome !== undefined) alteracao.nome = textoObrigatorio(dados.nome, 'nome');
    return (await this.pecas.atualizar(id, alteracao)) ?? pecaNaoEncontrada();
  }

  async remover(id: string): Promise<void> {
    if (!(await this.pecas.remover(id))) pecaNaoEncontrada();
  }
}

function servicoNaoEncontrado(): never {
  throw new NotFoundError('SERVICO_NAO_ENCONTRADO', 'Serviço não encontrado');
}

function pecaNaoEncontrada(): never {
  throw new NotFoundError('PECA_NAO_ENCONTRADA', 'Peça não encontrada');
}
