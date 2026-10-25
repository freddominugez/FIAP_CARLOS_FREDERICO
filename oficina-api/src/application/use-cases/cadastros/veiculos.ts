import { normalizarPlaca, validarAno } from '../../../domain/cadastros/veiculo.js';
import { ConflictError, NotFoundError } from '../../../domain/shared/errors.js';
import { textoObrigatorio } from '../../../domain/shared/texto.js';
import type {
  AlteracaoVeiculo,
  ClienteRepository,
  FiltroVeiculo,
  Lista,
  NovoVeiculo,
  Paginacao,
  Veiculo,
  VeiculoRepository,
} from '../../ports/cadastros.js';

export class GerenciarVeiculos {
  constructor(
    private readonly veiculos: VeiculoRepository,
    private readonly clientes: ClienteRepository,
  ) {}

  async criar(dados: NovoVeiculo): Promise<Veiculo> {
    const novo: NovoVeiculo = {
      clienteId: dados.clienteId,
      placa: normalizarPlaca(dados.placa),
      marca: textoObrigatorio(dados.marca, 'marca'),
      modelo: textoObrigatorio(dados.modelo, 'modelo'),
      ano: validarAno(dados.ano),
    };
    await this.exigirClienteAtivo(novo.clienteId);
    return this.veiculos.criar(novo);
  }

  async buscar(id: string): Promise<Veiculo> {
    return (await this.veiculos.buscar(id)) ?? naoEncontrado();
  }

  async listar(filtro: FiltroVeiculo, pagina: Paginacao): Promise<Lista<Veiculo>> {
    const placa = filtro.placa ? normalizarPlaca(filtro.placa) : undefined;
    return this.veiculos.listar({ ...filtro, placa }, pagina);
  }

  /** Trocar o dono não mexe nas OS antigas, que guardam o cliente da época (RN02). */
  async atualizar(id: string, dados: AlteracaoVeiculo): Promise<Veiculo> {
    const alteracao: AlteracaoVeiculo = { ativo: dados.ativo };
    if (dados.marca !== undefined) alteracao.marca = textoObrigatorio(dados.marca, 'marca');
    if (dados.modelo !== undefined) alteracao.modelo = textoObrigatorio(dados.modelo, 'modelo');
    if (dados.ano !== undefined) alteracao.ano = validarAno(dados.ano);
    if (dados.clienteId !== undefined) {
      await this.exigirClienteAtivo(dados.clienteId);
      alteracao.clienteId = dados.clienteId;
    }
    return (await this.veiculos.atualizar(id, alteracao)) ?? naoEncontrado();
  }

  async remover(id: string): Promise<void> {
    if (!(await this.veiculos.remover(id))) naoEncontrado();
  }

  private async exigirClienteAtivo(clienteId: string): Promise<void> {
    const cliente = await this.clientes.buscar(clienteId);
    if (!cliente) throw new NotFoundError('CLIENTE_NAO_ENCONTRADO', 'Cliente não encontrado');
    if (!cliente.ativo) throw new ConflictError('CLIENTE_INATIVO', 'Cliente inativo não recebe veículo');
  }
}

function naoEncontrado(): never {
  throw new NotFoundError('VEICULO_NAO_ENCONTRADO', 'Veículo não encontrado');
}
