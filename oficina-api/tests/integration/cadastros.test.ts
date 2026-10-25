import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp, type App } from '../../src/main/app.js';
import { configTeste, criarUsuario, subirBanco, type BancoTeste } from '../support/banco.js';

// T01 na borda HTTP, T06 (perfis) e RN12 (exclusão com histórico).
describe('cadastros', () => {
  let banco: BancoTeste;
  let app: App;
  const token: Record<string, string> = {};
  let atendenteId: string;

  beforeAll(async () => {
    banco = await subirBanco();
    app = await criarApp({ config: configTeste(banco.url), db: banco.db, logger: false });
    await app.ready();
    for (const perfil of ['ADMIN', 'ATENDENTE', 'TECNICO']) {
      const email = `${perfil.toLowerCase()}@teste.local`;
      const id = await criarUsuario(banco.db, { email, senha: 'senha-certa', perfil });
      if (perfil === 'ATENDENTE') atendenteId = id;
      const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, senha: 'senha-certa' } });
      token[perfil] = res.json().token;
    }
  });

  afterAll(async () => {
    await app?.close();
    await banco?.parar();
  });

  const chamar = (perfil: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, payload?: object) =>
    app.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${token[perfil]}` } });

  describe('clientes', () => {
    it('cadastra CPF e CNPJ alfanumérico normalizados', async () => {
      const cpf = await chamar('ATENDENTE', 'POST', '/customers', { documento: '529.982.247-25', nome: 'Ana Souza' });
      expect(cpf.statusCode).toBe(201);
      expect(cpf.json()).toMatchObject({ documento: '52998224725', tipoDocumento: 'CPF', ativo: true });
      expect(cpf.json().criadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      const cnpj = await chamar('ADMIN', 'POST', '/customers', { documento: '12.ABC.345/01DE-35', nome: 'Frota Ltda' });
      expect(cnpj.statusCode).toBe(201);
      expect(cnpj.json()).toMatchObject({ documento: '12ABC34501DE35', tipoDocumento: 'CNPJ' });
    });

    it('recusa documento inválido com 400 e duplicado com 409', async () => {
      const invalido = await chamar('ATENDENTE', 'POST', '/customers', { documento: '529.982.247-24', nome: 'X' });
      expect(invalido.statusCode).toBe(400);
      expect(invalido.json().code).toBe('DOCUMENTO_INVALIDO');

      const duplicado = await chamar('ATENDENTE', 'POST', '/customers', { documento: '52998224725', nome: 'Outra' });
      expect(duplicado.statusCode).toBe(409);
      expect(duplicado.json().code).toBe('DOCUMENTO_DUPLICADO');
    });

    it('recusa campo desconhecido e corpo vazio no PATCH', async () => {
      const extra = await chamar('ATENDENTE', 'POST', '/customers', { documento: '11144477735', nome: 'X', admin: true });
      expect(extra.statusCode).toBe(400);
      const lista = (await chamar('ATENDENTE', 'GET', '/customers')).json();
      const vazio = await chamar('ATENDENTE', 'PATCH', `/customers/${lista.itens[0].id}`, {});
      expect(vazio.statusCode).toBe(400);
    });

    it('lista com filtro por documento formatado, nome e paginação', async () => {
      const porDoc = await chamar('ATENDENTE', 'GET', '/customers?documento=529.982.247-25');
      expect(porDoc.json()).toMatchObject({ total: 1, limite: 20, deslocamento: 0 });
      const porNome = await chamar('ATENDENTE', 'GET', '/customers?nome=frota');
      expect(porNome.json().itens[0].nome).toBe('Frota Ltda');
      const pagina = await chamar('ATENDENTE', 'GET', '/customers?limite=1&deslocamento=1');
      expect(pagina.json()).toMatchObject({ total: 2, limite: 1 });
      expect(pagina.json().itens).toHaveLength(1);
      expect((await chamar('ATENDENTE', 'GET', '/customers?limite=0')).statusCode).toBe(400);
      expect((await chamar('ATENDENTE', 'GET', '/customers?nome=%25')).json().total).toBe(0);
    });

    it('bloqueia técnico com 403 e sem token com 401', async () => {
      expect((await chamar('TECNICO', 'GET', '/customers')).statusCode).toBe(403);
      expect((await app.inject({ method: 'GET', url: '/api/v1/customers' })).statusCode).toBe(401);
    });

    it('devolve 404 para id inexistente e 400 para id malformado', async () => {
      expect((await chamar('ATENDENTE', 'GET', '/customers/00000000-0000-4000-8000-000000000000')).statusCode).toBe(404);
      expect((await chamar('ATENDENTE', 'GET', '/customers/123')).statusCode).toBe(400);
    });
  });

  describe('acesso do cliente', () => {
    it('atendente cria o usuário CLIENTE, que entra e não acessa cadastros', async () => {
      const cliente = (await chamar('ATENDENTE', 'POST', '/customers', { documento: '11.222.333/0001-81', nome: 'Beto' })).json();
      const criado = await chamar('ATENDENTE', 'POST', `/customers/${cliente.id}/user`, {
        email: 'Beto@Cliente.com',
        senha: 'senha-do-beto',
      });
      expect(criado.statusCode).toBe(201);

      const login = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'beto@cliente.com', senha: 'senha-do-beto' },
      });
      expect(login.json().usuario).toMatchObject({ perfil: 'CLIENTE', clienteId: cliente.id });

      const cadastros = await app.inject({
        method: 'GET',
        url: '/api/v1/customers',
        headers: { authorization: `Bearer ${login.json().token}` },
      });
      expect(cadastros.statusCode).toBe(403);

      const segundo = await chamar('ATENDENTE', 'POST', `/customers/${cliente.id}/user`, {
        email: 'outro@cliente.com',
        senha: 'senha-do-beto',
      });
      expect(segundo.json().code).toBe('CLIENTE_JA_TEM_ACESSO');
    });

    it('recusa e-mail já usado', async () => {
      const cliente = (await chamar('ATENDENTE', 'POST', '/customers', { documento: '111.444.777-35', nome: 'Caio' })).json();
      const res = await chamar('ATENDENTE', 'POST', `/customers/${cliente.id}/user`, {
        email: 'tecnico@teste.local',
        senha: 'senha-do-caio',
      });
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe('EMAIL_EM_USO');
    });
  });

  describe('veículos', () => {
    let donoId: string;

    beforeAll(async () => {
      donoId = (await chamar('ATENDENTE', 'GET', '/customers?documento=52998224725')).json().itens[0].id;
    });

    it('cadastra placa antiga e Mercosul normalizadas', async () => {
      const antiga = await chamar('ATENDENTE', 'POST', '/vehicles', {
        clienteId: donoId,
        placa: 'abc-1234',
        marca: 'Fiat',
        modelo: 'Uno',
        ano: 2010,
      });
      expect(antiga.statusCode).toBe(201);
      expect(antiga.json().placa).toBe('ABC1234');
      const mercosul = await chamar('ATENDENTE', 'POST', '/vehicles', {
        clienteId: donoId,
        placa: 'BRA2E19',
        marca: 'VW',
        modelo: 'Gol',
        ano: 2022,
      });
      expect(mercosul.statusCode).toBe(201);
    });

    it('recusa placa inválida, ano fora da faixa e cliente inexistente', async () => {
      const base = { clienteId: donoId, placa: 'XYZ9876', marca: 'Ford', modelo: 'Ka', ano: 2015 };
      expect((await chamar('ATENDENTE', 'POST', '/vehicles', { ...base, placa: 'AB-12345' })).json().code).toBe('PLACA_INVALIDA');
      expect((await chamar('ATENDENTE', 'POST', '/vehicles', { ...base, ano: 1850 })).json().code).toBe('ANO_INVALIDO');
      const semDono = await chamar('ATENDENTE', 'POST', '/vehicles', {
        ...base,
        clienteId: '00000000-0000-4000-8000-000000000000',
      });
      expect(semDono.statusCode).toBe(404);
    });

    it('recusa placa repetida entre ativos e libera depois da inativação', async () => {
      const novo = { clienteId: donoId, placa: 'ABC1234', marca: 'Fiat', modelo: 'Uno', ano: 2010 };
      const repetida = await chamar('ATENDENTE', 'POST', '/vehicles', novo);
      expect(repetida.statusCode).toBe(409);
      expect(repetida.json().code).toBe('PLACA_DUPLICADA');

      const atual = (await chamar('ATENDENTE', 'GET', '/vehicles?placa=abc-1234')).json().itens[0];
      expect((await chamar('ATENDENTE', 'PATCH', `/vehicles/${atual.id}`, { ativo: false })).json().ativo).toBe(false);
      expect((await chamar('ATENDENTE', 'POST', '/vehicles', novo)).statusCode).toBe(201);

      // reativar o antigo esbarra na placa ativa
      const reativar = await chamar('ATENDENTE', 'PATCH', `/vehicles/${atual.id}`, { ativo: true });
      expect(reativar.json().code).toBe('PLACA_DUPLICADA');
    });

    it('exclui sem histórico e recusa com histórico (RN12)', async () => {
      const solto = (
        await chamar('ATENDENTE', 'POST', '/vehicles', { clienteId: donoId, placa: 'DEL0A00', marca: 'X', modelo: 'Y', ano: 2000 })
      ).json();
      expect((await chamar('ATENDENTE', 'DELETE', `/vehicles/${solto.id}`)).statusCode).toBe(204);
      expect((await chamar('ATENDENTE', 'GET', `/vehicles/${solto.id}`)).statusCode).toBe(404);

      const comOs = (await chamar('ATENDENTE', 'GET', '/vehicles?placa=BRA2E19')).json().itens[0];
      await banco.db.query(
        `INSERT INTO service_orders (number, customer_id, vehicle_id, status, complaint, created_by)
         VALUES ('OS-2026-000001', $1, $2, 'RECEBIDA', 'barulho no motor', $3)`,
        [donoId, comOs.id, atendenteId],
      );
      const veiculo = await chamar('ATENDENTE', 'DELETE', `/vehicles/${comOs.id}`);
      expect(veiculo.statusCode).toBe(409);
      expect(veiculo.json().code).toBe('CADASTRO_COM_HISTORICO');
      const cliente = await chamar('ATENDENTE', 'DELETE', `/customers/${donoId}`);
      expect(cliente.json().code).toBe('CADASTRO_COM_HISTORICO');
      expect((await chamar('ATENDENTE', 'GET', `/vehicles/${comOs.id}`)).statusCode).toBe(200);
    });
  });

  describe('catálogo', () => {
    it('só ADMIN escreve, atendente e técnico leem', async () => {
      const servico = { nome: 'Troca de óleo', precoCentavos: 8000 };
      expect((await chamar('ATENDENTE', 'POST', '/services', servico)).statusCode).toBe(403);
      const criado = await chamar('ADMIN', 'POST', '/services', servico);
      expect(criado.statusCode).toBe(201);
      expect(criado.json()).toMatchObject({ precoCentavos: 8000, descricao: null });
      expect((await chamar('TECNICO', 'GET', '/services')).json().total).toBe(1);
      expect((await chamar('ATENDENTE', 'GET', `/services/${criado.json().id}`)).statusCode).toBe(200);
      expect((await chamar('TECNICO', 'PATCH', `/services/${criado.json().id}`, { precoCentavos: 1 })).statusCode).toBe(403);
    });

    it('recusa preço fracionado ou negativo', async () => {
      expect((await chamar('ADMIN', 'POST', '/services', { nome: 'X', precoCentavos: 10.5 })).statusCode).toBe(400);
      expect((await chamar('ADMIN', 'POST', '/services', { nome: 'X', precoCentavos: -1 })).statusCode).toBe(400);
    });

    it('altera e exclui serviço', async () => {
      const s = (await chamar('ADMIN', 'POST', '/services', { nome: 'Alinhamento', precoCentavos: 12000 })).json();
      const alterado = await chamar('ADMIN', 'PATCH', `/services/${s.id}`, { precoCentavos: 13000, ativo: false });
      expect(alterado.json()).toMatchObject({ precoCentavos: 13000, ativo: false });
      expect((await chamar('ADMIN', 'GET', '/services?ativo=false')).json().total).toBe(1);
      expect((await chamar('ADMIN', 'DELETE', `/services/${s.id}`)).statusCode).toBe(204);
    });

    it('peça nasce com saldo zero e SKU único', async () => {
      const peca = { sku: 'flt-oleo-01', nome: 'Filtro de óleo', tipo: 'PECA', unidade: 'UN', precoCentavos: 3500 };
      const criada = await chamar('ADMIN', 'POST', '/parts', peca);
      expect(criada.statusCode).toBe(201);
      expect(criada.json()).toMatchObject({
        sku: 'FLT-OLEO-01',
        estoqueFisico: 0,
        estoqueReservado: 0,
        estoqueDisponivel: 0,
      });
      const repetida = await chamar('ADMIN', 'POST', '/parts', { ...peca, sku: 'FLT-OLEO-01' });
      expect(repetida.json().code).toBe('SKU_DUPLICADO');

      await chamar('ADMIN', 'POST', '/parts', { sku: 'OLEO-5W30', nome: 'Óleo 5W30', tipo: 'INSUMO', unidade: 'L', precoCentavos: 4500 });
      expect((await chamar('TECNICO', 'GET', '/parts?tipo=INSUMO')).json().itens[0]).toMatchObject({ unidade: 'L' });

      const id = criada.json().id;
      expect((await chamar('ADMIN', 'PATCH', `/parts/${id}`, { estoqueFisico: 10 })).statusCode).toBe(400);
      expect((await chamar('ADMIN', 'PATCH', `/parts/${id}`, { precoCentavos: 3700 })).json().precoCentavos).toBe(3700);
      expect((await chamar('ATENDENTE', 'GET', `/parts/${id}`)).json().estoqueDisponivel).toBe(0);
    });

    it('recusa excluir peça com movimento de estoque', async () => {
      const p = (
        await chamar('ADMIN', 'POST', '/parts', { sku: 'PAST-01', nome: 'Pastilha', tipo: 'PECA', unidade: 'UN', precoCentavos: 9000 })
      ).json();
      await banco.db.query(
        `INSERT INTO stock_movements (part_id, kind, quantity, created_by) VALUES ($1, 'ENTRADA', 4, $2)`,
        [p.id, atendenteId],
      );
      const res = await chamar('ADMIN', 'DELETE', `/parts/${p.id}`);
      expect(res.statusCode).toBe(409);
      expect(res.json().code).toBe('CADASTRO_COM_HISTORICO');
    });
  });

  it('publica as rotas de cadastro no OpenAPI', async () => {
    const paths = Object.keys((await app.inject({ method: 'GET', url: '/api/docs/json' })).json().paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/v1/customers',
        '/api/v1/customers/{id}',
        '/api/v1/customers/{id}/user',
        '/api/v1/vehicles',
        '/api/v1/services',
        '/api/v1/parts/{id}',
      ]),
    );
  });
});
