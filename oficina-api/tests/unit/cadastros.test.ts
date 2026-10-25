import { beforeEach, describe, expect, it } from 'vitest';
import type {
  AlteracaoCliente,
  AlteracaoPeca,
  AlteracaoServico,
  AlteracaoVeiculo,
  Cliente,
  NovaPeca,
  NovoCliente,
  NovoServico,
  NovoVeiculo,
  Peca,
  Servico,
  Veiculo,
} from '../../src/application/ports/cadastros.js';
import type { NovoUsuarioCliente } from '../../src/application/ports/usuario-repository.js';
import { GerenciarPecas, GerenciarServicos } from '../../src/application/use-cases/cadastros/catalogo.js';
import { GerenciarClientes } from '../../src/application/use-cases/cadastros/clientes.js';
import { GerenciarVeiculos } from '../../src/application/use-cases/cadastros/veiculos.js';
import { RepositorioMemoria } from '../support/memoria.js';

const pagina = { limite: 20, deslocamento: 0 };
const ID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

function repoClientes() {
  return new RepositorioMemoria<Cliente, NovoCliente, AlteracaoCliente>({ ativo: true, criadoEm: new Date() });
}

describe('GerenciarClientes', () => {
  let clientes: ReturnType<typeof repoClientes>;
  let criados: NovoUsuarioCliente[];
  let uc: GerenciarClientes;

  beforeEach(() => {
    clientes = repoClientes();
    criados = [];
    uc = new GerenciarClientes(
      clientes,
      {
        buscarPorEmail: async () => null,
        criarCliente: async (dados) => (criados.push(dados), { id: 'u1' }),
      },
      { gerar: async (senha) => `hash:${senha}` },
    );
  });

  it('normaliza documento, nome, e-mail e telefone', async () => {
    const c = await uc.criar({ documento: '12.abc.345/01de-35', nome: ' Oficina X ', email: ' A@B.COM ', telefone: ' ' });
    expect(c).toMatchObject({
      documento: '12ABC34501DE35',
      tipoDocumento: 'CNPJ',
      nome: 'Oficina X',
      email: 'a@b.com',
      telefone: null,
    });
  });

  it('recusa documento inválido antes de gravar', async () => {
    await expect(uc.criar({ documento: '123', nome: 'X' })).rejects.toMatchObject({ code: 'DOCUMENTO_INVALIDO' });
    expect(clientes.itens.size).toBe(0);
  });

  it('busca por documento com qualquer pontuação', async () => {
    await uc.criar({ documento: '52998224725', nome: 'Ana' });
    const lista = await uc.listar({ documento: '529.982.247-25' }, pagina);
    expect(lista.total).toBe(1);
  });

  it('devolve 404 para cliente inexistente', async () => {
    await expect(uc.buscar(ID_INEXISTENTE)).rejects.toMatchObject({ status: 404 });
    await expect(uc.atualizar(ID_INEXISTENTE, { nome: 'x' })).rejects.toMatchObject({ status: 404 });
    await expect(uc.remover(ID_INEXISTENTE)).rejects.toMatchObject({ status: 404 });
  });

  it('atualiza só os campos enviados', async () => {
    const c = await uc.criar({ documento: '52998224725', nome: 'Ana', email: 'ana@x.com' });
    const alterado = await uc.atualizar(c.id, { telefone: ' 11 99999-0000 ', email: null });
    expect(alterado).toMatchObject({ nome: 'Ana', email: null, telefone: '11 99999-0000' });
    await uc.atualizar(c.id, { nome: 'Ana Maria' });
    await uc.remover(c.id);
    expect(clientes.itens.size).toBe(0);
  });

  it('cria acesso CLIENTE com hash e e-mail normalizado', async () => {
    const c = await uc.criar({ documento: '52998224725', nome: 'Ana' });
    await expect(uc.criarAcesso(c.id, ' Ana@X.com ', 'segredo-123')).resolves.toEqual({ usuarioId: 'u1' });
    expect(criados[0]).toEqual({ email: 'ana@x.com', nome: 'Ana', clienteId: c.id, senhaHash: 'hash:segredo-123' });
  });

  it('não cria acesso para cliente inativo nem com senha curta', async () => {
    const c = await uc.criar({ documento: '52998224725', nome: 'Ana' });
    await expect(uc.criarAcesso(c.id, 'a@x.com', 'curta')).rejects.toMatchObject({ code: 'SENHA_FRACA' });
    await uc.atualizar(c.id, { ativo: false });
    await expect(uc.criarAcesso(c.id, 'a@x.com', 'segredo-123')).rejects.toMatchObject({ code: 'CLIENTE_INATIVO' });
    expect(criados).toHaveLength(0);
  });
});

describe('GerenciarVeiculos', () => {
  let clientes: ReturnType<typeof repoClientes>;
  let veiculos: RepositorioMemoria<Veiculo, NovoVeiculo, AlteracaoVeiculo>;
  let uc: GerenciarVeiculos;
  let dono: Cliente;

  beforeEach(async () => {
    clientes = repoClientes();
    veiculos = new RepositorioMemoria({ ativo: true, criadoEm: new Date() });
    uc = new GerenciarVeiculos(veiculos, clientes);
    dono = await clientes.criar({ documento: '52998224725', tipoDocumento: 'CPF', nome: 'Ana', email: null, telefone: null });
  });

  const novo = (clienteId: string) => ({ clienteId, placa: 'abc-1234', marca: ' Fiat ', modelo: 'Uno', ano: 2010 });

  it('normaliza placa e textos', async () => {
    expect(await uc.criar(novo(dono.id))).toMatchObject({ placa: 'ABC1234', marca: 'Fiat' });
  });

  it('exige cliente existente e ativo', async () => {
    await expect(uc.criar(novo(ID_INEXISTENTE))).rejects.toMatchObject({ code: 'CLIENTE_NAO_ENCONTRADO' });
    await clientes.atualizar(dono.id, { ativo: false });
    await expect(uc.criar(novo(dono.id))).rejects.toMatchObject({ code: 'CLIENTE_INATIVO' });
  });

  it('valida placa e ano antes de consultar o cliente', async () => {
    await expect(uc.criar({ ...novo(dono.id), placa: 'XX' })).rejects.toMatchObject({ code: 'PLACA_INVALIDA' });
    await expect(uc.criar({ ...novo(dono.id), ano: 1800 })).rejects.toMatchObject({ code: 'ANO_INVALIDO' });
  });

  it('troca o dono só para cliente ativo e altera os demais campos', async () => {
    const v = await uc.criar(novo(dono.id));
    const outro = await clientes.criar({ documento: '11144477735', tipoDocumento: 'CPF', nome: 'Bia', email: null, telefone: null });
    const alterado = await uc.atualizar(v.id, { clienteId: outro.id, marca: 'VW', modelo: 'Gol', ano: 2012 });
    expect(alterado).toMatchObject({ clienteId: outro.id, marca: 'VW', modelo: 'Gol', ano: 2012 });
    await expect(uc.atualizar(v.id, { clienteId: ID_INEXISTENTE })).rejects.toMatchObject({ status: 404 });
  });

  it('lista por placa normalizada e devolve 404 para inexistente', async () => {
    await uc.criar(novo(dono.id));
    expect((await uc.listar({ placa: 'ABC-1234' }, pagina)).total).toBe(1);
    expect((await uc.listar({}, pagina)).total).toBe(1);
    await expect(uc.buscar(ID_INEXISTENTE)).rejects.toMatchObject({ code: 'VEICULO_NAO_ENCONTRADO' });
    await expect(uc.atualizar(ID_INEXISTENTE, { ano: 2000 })).rejects.toMatchObject({ status: 404 });
    await expect(uc.remover(ID_INEXISTENTE)).rejects.toMatchObject({ status: 404 });
  });

  it('busca e remove veículo existente', async () => {
    const v = await uc.criar(novo(dono.id));
    expect((await uc.buscar(v.id)).placa).toBe('ABC1234');
    await uc.remover(v.id);
    expect(veiculos.itens.size).toBe(0);
  });
});

describe('catálogo', () => {
  it('serviço: normaliza, altera e devolve 404', async () => {
    const repo = new RepositorioMemoria<Servico, NovoServico, AlteracaoServico>({ ativo: true, criadoEm: new Date() });
    const uc = new GerenciarServicos(repo);
    const s = await uc.criar({ nome: ' Troca de óleo ', descricao: '  ', precoCentavos: 8000 });
    expect(s).toMatchObject({ nome: 'Troca de óleo', descricao: null, precoCentavos: 8000 });
    expect(await uc.atualizar(s.id, { nome: 'Troca', descricao: 'com filtro', precoCentavos: 9000 })).toMatchObject({
      nome: 'Troca',
      descricao: 'com filtro',
      precoCentavos: 9000,
    });
    expect((await uc.buscar(s.id)).id).toBe(s.id);
    expect((await uc.listar({}, pagina)).total).toBe(1);
    await uc.remover(s.id);
    await expect(uc.buscar(s.id)).rejects.toMatchObject({ code: 'SERVICO_NAO_ENCONTRADO' });
    await expect(uc.atualizar(s.id, { ativo: false })).rejects.toMatchObject({ status: 404 });
    await expect(uc.remover(s.id)).rejects.toMatchObject({ status: 404 });
  });

  it('peça: SKU em maiúsculas, altera e devolve 404', async () => {
    const repo = new RepositorioMemoria<Peca, NovaPeca, AlteracaoPeca>({
      ativo: true,
      criadoEm: new Date(),
      estoqueFisico: 0,
      estoqueReservado: 0,
    });
    const uc = new GerenciarPecas(repo);
    const p = await uc.criar({ sku: ' flt-01 ', nome: 'Filtro', tipo: 'PECA', unidade: 'UN', precoCentavos: 3500 });
    expect(p).toMatchObject({ sku: 'FLT-01', estoqueFisico: 0 });
    expect(await uc.atualizar(p.id, { nome: ' Filtro de óleo ', ativo: false })).toMatchObject({
      nome: 'Filtro de óleo',
      ativo: false,
    });
    expect((await uc.buscar(p.id)).id).toBe(p.id);
    expect((await uc.listar({ tipo: 'PECA' }, pagina)).total).toBe(1);
    await uc.remover(p.id);
    await expect(uc.buscar(p.id)).rejects.toMatchObject({ code: 'PECA_NAO_ENCONTRADA' });
    await expect(uc.atualizar(p.id, { precoCentavos: 1 })).rejects.toMatchObject({ status: 404 });
    await expect(uc.remover(p.id)).rejects.toMatchObject({ status: 404 });
  });
});
