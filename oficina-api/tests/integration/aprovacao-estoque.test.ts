import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp, type App } from '../../src/main/app.js';
import { configTeste, criarUsuario, subirBanco, type BancoTeste } from '../support/banco.js';

// T04 (versão obsoleta, decisão repetida, rejeição), T05 (reserva atômica e concorrência) e T06 (BOLA).
describe('aprovação do orçamento e estoque', () => {
  let banco: BancoTeste;
  let app: App;
  const token: Record<string, string> = {};
  const ids = {
    ana: '',
    beto: '',
    carro_ana: '',
    carro_beto: '',
    revisao: '',
    filtro: '',
    oleo: '',
    osAna: '',
    orcAna: '',
    osBeto: '',
  };

  const chamar = (
    quem: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    payload?: object,
    headers: Record<string, string> = {},
  ) =>
    app.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${token[quem]}`, ...headers } });

  const criar = async (quem: string, url: string, payload: object) => {
    const res = await chamar(quem, 'POST', url, payload);
    expect(res.statusCode, res.body).toBe(201);
    return res.json().id as string;
  };

  const login = async (email: string, senha: string) =>
    (await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, senha } })).json().token as string;

  const saldo = async (pecaId: string) => {
    const p = (await chamar('ADMIN', 'GET', `/parts/${pecaId}`)).json();
    return { fisico: p.estoqueFisico, reservado: p.estoqueReservado, disponivel: p.estoqueDisponivel };
  };

  const entrada = (pecaId: string, quantidade: number) =>
    chamar('ADMIN', 'POST', `/parts/${pecaId}/movements`, { tipo: 'ENTRADA', quantidade });

  /** Abre a OS, faz o diagnóstico com as peças pedidas e publica. Devolve OS e orçamento. */
  const osPublicada = async (dono: 'ana' | 'beto', pecas: [string, number][]) => {
    const os = (
      await chamar('ATENDENTE', 'POST', '/orders', {
        clienteId: ids[dono],
        veiculoId: ids[`carro_${dono}`],
        solicitacao: 'Revisão',
      })
    ).json();
    await chamar('TECNICO', 'POST', `/orders/${os.id}/diagnosis`, { versao: 1 });
    await chamar('TECNICO', 'POST', `/orders/${os.id}/services`, { servicoId: ids.revisao, quantidade: 1 });
    for (const [pecaId, quantidade] of pecas) {
      await chamar('TECNICO', 'POST', `/orders/${os.id}/parts`, { pecaId, quantidade });
    }
    const versao = (await chamar('TECNICO', 'GET', `/orders/${os.id}`)).json().versao;
    const publicada = await chamar('TECNICO', 'POST', `/orders/${os.id}/quotes`, { versao });
    expect(publicada.statusCode, publicada.body).toBe(201);
    return { osId: os.id as string, orcamentoId: publicada.json().orcamentos[0].id as string };
  };

  const decidir = (quem: string, orcamentoId: string, decisao: string, extra: object = {}, headers = {}) =>
    chamar(quem, 'POST', `/quotes/${orcamentoId}/decision`, { decisao, ...extra }, headers);

  beforeAll(async () => {
    banco = await subirBanco();
    app = await criarApp({ config: configTeste(banco.url), db: banco.db, logger: false });
    await app.ready();
    for (const perfil of ['ADMIN', 'ATENDENTE', 'TECNICO']) {
      const email = `${perfil.toLowerCase()}@teste.local`;
      await criarUsuario(banco.db, { email, senha: 'senha-certa', perfil });
      token[perfil] = await login(email, 'senha-certa');
    }
    for (const [nome, documento, placa] of [
      ['ana', '529.982.247-25', 'ANA1A11'],
      ['beto', '111.444.777-35', 'BET2B22'],
    ] as const) {
      ids[nome] = await criar('ATENDENTE', '/customers', { documento, nome });
      ids[`carro_${nome}`] = await criar('ATENDENTE', '/vehicles', {
        clienteId: ids[nome],
        placa,
        marca: 'Fiat',
        modelo: 'Argo',
        ano: 2020,
      });
      await chamar('ATENDENTE', 'POST', `/customers/${ids[nome]}/user`, { email: `${nome}@cliente.com`, senha: 'senha-cliente' });
      token[nome] = await login(`${nome}@cliente.com`, 'senha-cliente');
    }
    ids.revisao = await criar('ADMIN', '/services', { nome: 'Revisão', precoCentavos: 20000 });
    const peca = (sku: string, nome: string, tipo = 'PECA', unidade = 'UN') =>
      criar('ADMIN', '/parts', { sku, nome, tipo, unidade, precoCentavos: 1000 });
    ids.filtro = await peca('FLT-01', 'Filtro');
    ids.oleo = await peca('OLEO-01', 'Óleo', 'INSUMO', 'L');
  });

  afterAll(async () => {
    await app?.close();
    await banco?.parar();
  });

  describe('movimentos manuais', () => {
    it('ADMIN registra entrada e ajuste com observação', async () => {
      const res = await entrada(ids.filtro, 10);
      expect(res.statusCode).toBe(201);
      expect(res.json().saldo).toEqual({ fisico: 10, reservado: 0, disponivel: 10 });
      expect((await entrada(ids.oleo, 20.5)).json().saldo.fisico).toBe(20.5);

      const semMotivo = await chamar('ADMIN', 'POST', `/parts/${ids.filtro}/movements`, { tipo: 'AJUSTE', quantidade: 2 });
      expect(semMotivo.json().code).toBe('OBSERVACAO_OBRIGATORIA');
      const ajuste = await chamar('ADMIN', 'POST', `/parts/${ids.filtro}/movements`, {
        tipo: 'AJUSTE',
        quantidade: 2,
        observacao: 'Duas unidades avariadas',
      });
      expect(ajuste.json().saldo.fisico).toBe(8);
    });

    it('recusa ajuste maior que o saldo, peça fracionada e outros perfis', async () => {
      const grande = await chamar('ADMIN', 'POST', `/parts/${ids.filtro}/movements`, {
        tipo: 'AJUSTE',
        quantidade: 100,
        observacao: 'inventário',
      });
      expect(grande.json().code).toBe('ESTOQUE_INSUFICIENTE');
      expect((await entrada(ids.filtro, 1.5)).json().code).toBe('QUANTIDADE_INVALIDA');
      const atendente = await chamar('ATENDENTE', 'POST', `/parts/${ids.filtro}/movements`, { tipo: 'ENTRADA', quantidade: 1 });
      expect(atendente.statusCode).toBe(403);
      const reserva = await chamar('ADMIN', 'POST', `/parts/${ids.filtro}/movements`, { tipo: 'RESERVA', quantidade: 1 });
      expect(reserva.statusCode).toBe(400);
      expect((await entrada('00000000-0000-4000-8000-000000000000', 1)).statusCode).toBe(404);
    });

    it('mostra o extrato da peça', async () => {
      const extrato = (await chamar('TECNICO', 'GET', `/parts/${ids.filtro}/movements`)).json();
      expect(extrato.total).toBe(2);
      expect(extrato.itens.map((m: { tipo: string }) => m.tipo).sort()).toEqual(['AJUSTE', 'ENTRADA']);
      expect((await chamar('TECNICO', 'GET', '/parts/00000000-0000-4000-8000-000000000000/movements')).statusCode).toBe(404);
    });
  });

  describe('decisão do cliente', () => {
    it('aprovação reserva todas as peças e não muda o status da OS', async () => {
      const { osId, orcamentoId } = await osPublicada('ana', [
        [ids.filtro, 4],
        [ids.oleo, 4.5],
      ]);
      ids.osAna = osId;
      ids.orcAna = orcamentoId;
      const res = await decidir('ana', orcamentoId, 'APROVADO');
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().orcamento).toMatchObject({ status: 'APROVADO', decisao: { decisao: 'APROVADO' } });

      expect(await saldo(ids.filtro)).toEqual({ fisico: 8, reservado: 4, disponivel: 4 });
      expect(await saldo(ids.oleo)).toEqual({ fisico: 20.5, reservado: 4.5, disponivel: 16 });
      const os = (await chamar('ATENDENTE', 'GET', `/orders/${osId}`)).json();
      expect(os.status).toBe('AGUARDANDO_APROVACAO');
    });

    it('repetir a aprovação não reserva de novo e trocar a decisão dá 409', async () => {
      const repetida = await decidir('ana', ids.orcAna, 'APROVADO');
      expect(repetida.statusCode).toBe(200);
      expect(repetida.headers['idempotent-replayed']).toBe('true');
      expect((await saldo(ids.filtro)).reservado).toBe(4);
      expect((await decidir('ana', ids.orcAna, 'REJEITADO')).json().code).toBe('DECISAO_JA_REGISTRADA');
    });

    it('cliente não decide orçamento de outro cliente: 404, sem revelar que existe', async () => {
      const res = await decidir('beto', ids.orcAna, 'APROVADO');
      expect(res.statusCode).toBe(404);
      expect(res.json().code).toBe('ORCAMENTO_NAO_ENCONTRADO');
      expect((await decidir('ATENDENTE', ids.orcAna, 'APROVADO')).statusCode).toBe(403);
      expect((await decidir('ana', '00000000-0000-4000-8000-000000000000', 'APROVADO')).statusCode).toBe(404);
    });

    it('falta de uma peça cancela a reserva de todas', async () => {
      const { orcamentoId } = await osPublicada('ana', [
        [ids.oleo, 1],
        [ids.filtro, 5],
      ]);
      const res = await decidir('ana', orcamentoId, 'APROVADO');
      expect(res.statusCode).toBe(409);
      expect(res.json()).toMatchObject({ code: 'ESTOQUE_INSUFICIENTE', message: expect.stringContaining('Filtro') });
      expect((await saldo(ids.oleo)).reservado).toBe(4.5);
      const os = (await chamar('ATENDENTE', 'GET', `/orders?clienteId=${ids.ana}&status=AGUARDANDO_APROVACAO`)).json();
      const detalhe = (await chamar('ATENDENTE', 'GET', `/orders/${os.itens[0].id}`)).json();
      expect(detalhe.orcamentos[0]).toMatchObject({ status: 'PENDENTE', decisao: null });
    });

    it('rejeição grava motivo e não reserva', async () => {
      const { osId, orcamentoId } = await osPublicada('beto', [[ids.filtro, 1]]);
      ids.osBeto = osId;
      const res = await decidir('beto', orcamentoId, 'REJEITADO', { motivo: 'Vou pensar' });
      expect(res.json().orcamento).toMatchObject({ status: 'REJEITADO', decisao: { motivo: 'Vou pensar' } });
      expect((await saldo(ids.filtro)).reservado).toBe(4);
      expect((await decidir('beto', orcamentoId, 'APROVADO')).json().code).toBe('DECISAO_JA_REGISTRADA');
    });

    it('mesma Idempotency-Key com outra decisão dá 409', async () => {
      const { orcamentoId } = await osPublicada('beto', [[ids.oleo, 1]]);
      const chave = { 'idempotency-key': 'decisao-beto-0001' };
      expect((await decidir('beto', orcamentoId, 'APROVADO', {}, chave)).statusCode).toBe(200);
      const outra = await decidir('beto', orcamentoId, 'REJEITADO', {}, chave);
      expect(outra.json().code).toBe('IDEMPOTENCIA_CONFLITO');
      expect((await decidir('beto', orcamentoId, 'APROVADO', {}, chave)).headers['idempotent-replayed']).toBe('true');
    });
  });

  describe('reabertura do diagnóstico', () => {
    it('invalida a versão aprovada e libera as reservas', async () => {
      const versao = (await chamar('ATENDENTE', 'GET', `/orders/${ids.osAna}`)).json().versao;
      expect((await chamar('ATENDENTE', 'POST', `/orders/${ids.osAna}/reopen`, { versao: versao - 1 })).json().code).toBe(
        'VERSAO_DESATUALIZADA',
      );
      const res = await chamar('ATENDENTE', 'POST', `/orders/${ids.osAna}/reopen`, { versao });
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().status).toBe('EM_DIAGNOSTICO');
      expect(res.json().orcamentos[0].status).toBe('INVALIDADO');

      expect(await saldo(ids.filtro)).toEqual({ fisico: 8, reservado: 0, disponivel: 8 });
      expect((await saldo(ids.oleo)).reservado).toBe(1); // sobra só a reserva do Beto
      const extrato = (await chamar('ADMIN', 'GET', `/parts/${ids.filtro}/movements`)).json();
      const liberacao = extrato.itens.find((m: { tipo: string }) => m.tipo === 'LIBERACAO');
      expect(liberacao.referenteA).toBeTruthy();
      expect(liberacao.observacao).toContain('Diagnóstico reaberto');
    });

    it('decisão sobre a versão invalidada dá 409 e a nova publicação vira versão 2', async () => {
      expect((await decidir('ana', ids.orcAna, 'APROVADO')).json().code).toBe('ORCAMENTO_OBSOLETO');
      const versao = (await chamar('TECNICO', 'GET', `/orders/${ids.osAna}`)).json().versao;
      const v2 = await chamar('TECNICO', 'POST', `/orders/${ids.osAna}/quotes`, { versao });
      expect(v2.json().orcamentos.map((o: { versao: number; status: string }) => [o.versao, o.status])).toEqual([
        [2, 'PENDENTE'],
        [1, 'INVALIDADO'],
      ]);
    });

    it('orçamento só com serviços aprova e reabre sem movimentar estoque', async () => {
      const { osId, orcamentoId } = await osPublicada('ana', []);
      expect((await decidir('ana', orcamentoId, 'APROVADO')).statusCode).toBe(200);
      const versao = (await chamar('ATENDENTE', 'GET', `/orders/${osId}`)).json().versao;
      const res = await chamar('ATENDENTE', 'POST', `/orders/${osId}/reopen`, { versao });
      expect(res.json().orcamentos[0].status).toBe('INVALIDADO');
    });

    it('versão rejeitada continua rejeitada no histórico', async () => {
      const versao = (await chamar('ATENDENTE', 'GET', `/orders/${ids.osBeto}`)).json().versao;
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.osBeto}/reopen`, { versao });
      expect(res.json().orcamentos[0].status).toBe('REJEITADO');
      expect((await chamar('TECNICO', 'POST', `/orders/${ids.osBeto}/reopen`, { versao: res.json().versao })).json().code).toBe(
        'TRANSICAO_INVALIDA',
      );
    });
  });

  describe('concorrência', () => {
    it('duas OS disputando a última unidade: só uma aprova', async () => {
      const ultima = await criar('ADMIN', '/parts', { sku: 'ULT-01', nome: 'Sensor', tipo: 'PECA', unidade: 'UN', precoCentavos: 50000 });
      await entrada(ultima, 1);
      const a = await osPublicada('ana', [[ultima, 1]]);
      const b = await osPublicada('beto', [[ultima, 1]]);

      const respostas = await Promise.all([
        decidir('ana', a.orcamentoId, 'APROVADO'),
        decidir('beto', b.orcamentoId, 'APROVADO'),
      ]);
      expect(respostas.map((r) => r.statusCode).sort()).toEqual([200, 409]);
      expect(respostas.find((r) => r.statusCode === 409)!.json().code).toBe('ESTOQUE_INSUFICIENTE');
      expect(await saldo(ultima)).toEqual({ fisico: 1, reservado: 1, disponivel: 0 });
      const extrato = (await chamar('ADMIN', 'GET', `/parts/${ultima}/movements`)).json();
      expect(extrato.itens.filter((m: { tipo: string }) => m.tipo === 'RESERVA')).toHaveLength(1);
    });

    it('peças pedidas em ordem inversa por duas OS não travam (sem deadlock)', async () => {
      const p1 = await criar('ADMIN', '/parts', { sku: 'P-01', nome: 'Vela', tipo: 'PECA', unidade: 'UN', precoCentavos: 100 });
      const p2 = await criar('ADMIN', '/parts', { sku: 'P-02', nome: 'Cabo', tipo: 'PECA', unidade: 'UN', precoCentavos: 100 });
      await entrada(p1, 10);
      await entrada(p2, 10);
      const a = await osPublicada('ana', [
        [p1, 1],
        [p2, 1],
      ]);
      const b = await osPublicada('beto', [
        [p2, 1],
        [p1, 1],
      ]);
      const respostas = await Promise.all([decidir('ana', a.orcamentoId, 'APROVADO'), decidir('beto', b.orcamentoId, 'APROVADO')]);
      expect(respostas.map((r) => r.statusCode)).toEqual([200, 200]);
      expect((await saldo(p1)).reservado).toBe(2);
      expect((await saldo(p2)).reservado).toBe(2);
    });
  });
});
