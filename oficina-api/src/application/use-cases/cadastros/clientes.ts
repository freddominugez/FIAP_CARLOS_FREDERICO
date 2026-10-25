import { criarDocumento } from '../../../domain/cadastros/documento.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../domain/shared/errors.js';
import { textoObrigatorio, textoOpcional } from '../../../domain/shared/texto.js';
import type {
  AlteracaoCliente,
  Cliente,
  ClienteRepository,
  FiltroCliente,
  Lista,
  Paginacao,
} from '../../ports/cadastros.js';
import type { GeradorHash, UsuarioRepository } from '../../ports/usuario-repository.js';

export interface DadosCliente {
  documento: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
}

const SENHA_MINIMA = 8;

export class GerenciarClientes {
  constructor(
    private readonly clientes: ClienteRepository,
    private readonly usuarios: UsuarioRepository,
    private readonly hash: GeradorHash,
  ) {}

  async criar(dados: DadosCliente): Promise<Cliente> {
    const documento = criarDocumento(dados.documento);
    return this.clientes.criar({
      documento: documento.valor,
      tipoDocumento: documento.tipo,
      nome: textoObrigatorio(dados.nome, 'nome'),
      email: textoOpcional(dados.email)?.toLowerCase() ?? null,
      telefone: textoOpcional(dados.telefone),
    });
  }

  async buscar(id: string): Promise<Cliente> {
    return (await this.clientes.buscar(id)) ?? naoEncontrado();
  }

  async listar(filtro: FiltroCliente, pagina: Paginacao): Promise<Lista<Cliente>> {
    // documento chega com ou sem pontuação, a busca é pelo valor normalizado
    const documento = filtro.documento ? criarDocumento(filtro.documento).valor : undefined;
    return this.clientes.listar({ ...filtro, documento }, pagina);
  }

  async atualizar(id: string, dados: AlteracaoCliente): Promise<Cliente> {
    const alteracao: AlteracaoCliente = { ativo: dados.ativo };
    if (dados.nome !== undefined) alteracao.nome = textoObrigatorio(dados.nome, 'nome');
    if (dados.email !== undefined) alteracao.email = textoOpcional(dados.email)?.toLowerCase() ?? null;
    if (dados.telefone !== undefined) alteracao.telefone = textoOpcional(dados.telefone);
    return (await this.clientes.atualizar(id, alteracao)) ?? naoEncontrado();
  }

  async remover(id: string): Promise<void> {
    if (!(await this.clientes.remover(id))) naoEncontrado();
  }

  /**
   * Cria o acesso do cliente à API (perfil CLIENTE). Só atendente ou admin chamam (RN11).
   * Um usuário por cliente.
   */
  async criarAcesso(clienteId: string, email: string, senha: string): Promise<{ usuarioId: string }> {
    const cliente = await this.buscar(clienteId);
    if (!cliente.ativo) throw new ConflictError('CLIENTE_INATIVO', 'Cliente inativo não recebe acesso');
    if (senha.length < SENHA_MINIMA) {
      throw new ValidationError('SENHA_FRACA', `Senha precisa de ao menos ${SENHA_MINIMA} caracteres`);
    }
    const { id } = await this.usuarios.criarCliente({
      email: email.trim().toLowerCase(),
      nome: cliente.nome,
      clienteId: cliente.id,
      senhaHash: await this.hash.gerar(senha),
    });
    return { usuarioId: id };
  }
}

function naoEncontrado(): never {
  throw new NotFoundError('CLIENTE_NAO_ENCONTRADO', 'Cliente não encontrado');
}
