import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp, type App } from '../../src/main/app.js';
import { configTeste, criarUsuario, subirBanco, type BancoTeste } from '../support/banco.js';

// T05 (consumo e estorno), T07 (consulta do cliente e BOLA), T09 (tempo médio) e T10 (ciclo completo).
describe('execução, entrega, consulta do cliente e tempo médio', () => {
  let banco: BancoTeste;
  let app: App;
  const token: Record<string, string> = {};
  const ids = {
    ana: '',
    beto: '',
    carro_ana: '',
    carro_beto: '',
    revisao: '',
    alinhamento: '',
    filtro: '',
    oleo: '',
    os: '',
    tecnicoId: '',
  };

  const chamar = (quem: string, method: 'GET' | 'POST' | 'PATCH', url: string, payload?: object) =>
    app.inject({ method, url: `/api/v1${url}`, payload, headers: { authorization: `Bearer ${token[quem]}` } });

  const criar = async (quem: string, url: string, payload: object) => {
    const res = await chamar(quem, 'POST', url, payload);
    expect(res.statusCode, res.body).toBe(201);
    return res.json().id as string;
  };

  const login = async (email: string, senha: string) =>
    (await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, senha } })).json().token as string;

  const detalhe = async (osId: string) => (await chamar('ATENDENTE', 'GET', `/orders/${osId}`)).json();

  const saldo = async (pecaId: string) => {
    const p = (await chamar('ADMIN', 'GET', `/parts/${pecaId}`)).json();
    return { fisico: p.estoqueFisico, reservado: p.estoqueReservado };
  };

  const osPublicada = async (dono: 'ana' | 'beto', servicos: string[], pecas: [string, number][]) => {
    const os = (
      await chamar('ATENDENTE', 'POST', '/orders', {
        clienteId: ids[dono],
        veiculoId: ids[`carro_${dono}`],
        solicitacao: 'Revisão completa',
      })
    ).json();
    await chamar('TECNICO', 'POST', `/orders/${os.id}/diagnosis`, { versao: 1 });
    for (const servicoId of servicos) await chamar('TECNICO', 'POST', `/orders/${os.id}/services`, { servicoId, quantidade: 1 });
    for (const [pecaId, quantidade] of pecas) await chamar('TECNICO', 'POST', `/orders/${os.id}/parts`, { pecaId, quantidade });
    const publicada = await chamar('TECNICO', 'POST', `/orders/${os.id}/quotes`, { versao: (await detalhe(os.id)).versao });
    expect(publicada.statusCode, publicada.body).toBe(201);
    return { osId: os.id as string, orcamentoId: publicada.json().orcamentos[0].id as string };
  };

  beforeAll(async () => {
    banco = await subirBanco();
    app = await criarApp({ config: configTeste(banco.url), db: banco.db, logger: false });
    await app.ready();
    for (const perfil of ['ADMIN', 'ATENDENTE', 'TECNICO']) {
      const email = `${perfil.toLowerCase()}@teste.local`;
      const id = await criarUsuario(banco.db, { email, senha: 'senha-certa', perfil });
      if (perfil === 'TECNICO') ids.tecnicoId = id;
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
    ids.alinhamento = await criar('ADMIN', '/services', { nome: 'Alinhamento', precoCentavos: 9000 });
    ids.filtro = await criar('ADMIN', '/parts', { sku: 'FLT-01', nome: 'Filtro', tipo: 'PECA', unidade: 'UN', precoCentavos: 3500 });
    ids.oleo = await criar('ADMIN', '/parts', { sku: 'OLEO-01', nome: 'Óleo', tipo: 'INSUMO', unidade: 'L', precoCentavos: 4500 });
    for (const peca of [ids.filtro, ids.oleo]) {
      await chamar('ADMIN', 'POST', `/parts/${peca}/movements`, { tipo: 'ENTRADA', quantidade: 10 });
    }
  });

  afterAll(async () => {
    await app?.close();
    await banco?.parar();
  });

  describe('início da execução', () => {
    it('bloqueia orçamento pendente ou rejeitado', async () => {
      const pendente = await osPublicada('beto', [ids.revisao], []);
      const versao = (await detalhe(pendente.osId)).versao;
      const res = await chamar('TECNICO', 'POST', `/orders/${pendente.osId}/start`, { versao });
      expect(res.json()).toMatchObject({ code: 'ORCAMENTO_NAO_APROVADO', message: expect.stringContaining('ainda não') });

      await chamar('beto', 'POST', `/quotes/${pendente.orcamentoId}/decision`, { decisao: 'REJEITADO' });
      const rejeitado = await chamar('TECNICO', 'POST', `/orders/${pendente.osId}/start`, {
        versao: (await detalhe(pendente.osId)).versao,
      });
      expect(rejeitado.json().message).toContain('rejeitado');
    });

    it('inicia com orçamento aprovado e registra a data', async () => {
      const { osId, orcamentoId } = await osPublicada(
        'ana',
        [ids.revisao, ids.alinhamento],
        [
          [ids.filtro, 2],
          [ids.oleo, 1.5],
        ],
      );
      ids.os = osId;
      await chamar('ana', 'POST', `/quotes/${orcamentoId}/decision`, { decisao: 'APROVADO' });
      const versao = (await detalhe(osId)).versao;
      expect((await chamar('ATENDENTE', 'POST', `/orders/${osId}/start`, { versao })).statusCode).toBe(403);
      const res = await chamar('TECNICO', 'POST', `/orders/${osId}/start`, { versao });
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().status).toBe('EM_EXECUCAO');
      expect(res.json().execucaoIniciadaEm).toBeTruthy();
    });
  });

  describe('consumo e serviços', () => {
    it('baixa a peça reservada uma única vez', async () => {
      const os = await detalhe(ids.os);
      const linhaFiltro = os.orcamentos[0].itens.find((i: { descricao: string }) => i.descricao === 'Filtro');
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/consumptions`, { itemOrcamentoId: linhaFiltro.id });
      expect(res.statusCode, res.body).toBe(200);
      expect(await saldo(ids.filtro)).toEqual({ fisico: 8, reservado: 0 });
      const consumida = res.json().orcamentos[0].itens.find((i: { id: string }) => i.id === linhaFiltro.id);
      expect(consumida.consumidoEm).toBeTruthy();

      const repetida = await chamar('TECNICO', 'POST', `/orders/${ids.os}/consumptions`, { itemOrcamentoId: linhaFiltro.id });
      expect(repetida.headers['idempotent-replayed']).toBe('true');
      expect(await saldo(ids.filtro)).toEqual({ fisico: 8, reservado: 0 });
    });

    it('recusa consumir linha de serviço ou de outra OS', async () => {
      const os = await detalhe(ids.os);
      const servico = os.orcamentos[0].itens.find((i: { tipo: string }) => i.tipo === 'SERVICO');
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/consumptions`, { itemOrcamentoId: servico.id });
      expect(res.json().code).toBe('ITEM_NAO_ENCONTRADO');
    });

    it('não finaliza com serviço pendente', async () => {
      const os = await detalhe(ids.os);
      await chamar('TECNICO', 'POST', `/orders/${ids.os}/services/${os.servicos[0].id}/complete`);
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/finish`, { versao: (await detalhe(ids.os)).versao });
      expect(res.json()).toMatchObject({ code: 'SERVICOS_PENDENTES', message: expect.stringContaining('Revisão') });
    });

    it('finaliza e devolve ao estoque a peça reservada e não usada', async () => {
      const os = await detalhe(ids.os);
      const pendente = os.servicos.find((s: { concluidoEm: string | null }) => !s.concluidoEm);
      const concluida = await chamar('TECNICO', 'POST', `/orders/${ids.os}/services/${pendente.id}/complete`);
      expect(concluida.json().servicos.every((s: { concluidoEm: string | null }) => s.concluidoEm)).toBe(true);

      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/finish`, { versao: concluida.json().versao });
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json()).toMatchObject({ status: 'FINALIZADA', finalizadaEm: expect.any(String) });
      expect(await saldo(ids.oleo)).toEqual({ fisico: 10, reservado: 0 });
      const extrato = (await chamar('ADMIN', 'GET', `/parts/${ids.oleo}/movements`)).json();
      expect(extrato.itens[0]).toMatchObject({ tipo: 'LIBERACAO', observacao: expect.stringContaining('Não utilizada') });
    });

    it('consumo depois da finalização dá 409', async () => {
      const os = await detalhe(ids.os);
      const linha = os.orcamentos[0].itens.find((i: { descricao: string }) => i.descricao === 'Óleo');
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/consumptions`, { itemOrcamentoId: linha.id });
      expect(res.json().code).toBe('OS_FORA_DA_EXECUCAO');
    });
  });

  describe('entrega', () => {
    it('só o atendente entrega, e o histórico tem os seis status', async () => {
      const versao = (await detalhe(ids.os)).versao;
      expect((await chamar('TECNICO', 'POST', `/orders/${ids.os}/deliver`, { versao })).statusCode).toBe(403);
      const res = await chamar('ATENDENTE', 'POST', `/orders/${ids.os}/deliver`, { versao });
      expect(res.json()).toMatchObject({ status: 'ENTREGUE', entregueEm: expect.any(String) });
      expect(res.json().historico.map((h: { para: string }) => h.para)).toEqual([
        'RECEBIDA',
        'EM_DIAGNOSTICO',
        'AGUARDANDO_APROVACAO',
        'EM_EXECUCAO',
        'FINALIZADA',
        'ENTREGUE',
      ]);
      const depois = await chamar('ATENDENTE', 'POST', `/orders/${ids.os}/deliver`, { versao: res.json().versao });
      expect(depois.json().code).toBe('TRANSICAO_INVALIDA');
    });
  });

  describe('consulta do cliente', () => {
    it('lista só as próprias OS, sem dados internos', async () => {
      const lista = (await chamar('ana', 'GET', '/me/orders')).json();
      expect(lista.total).toBe(1);
      expect(lista.itens[0]).toMatchObject({ id: ids.os, status: 'ENTREGUE' });
      expect(lista.itens[0]).not.toHaveProperty('clienteId');

      const os = (await chamar('ana', 'GET', `/me/orders/${ids.os}`)).json();
      expect(os.orcamentos[0]).toMatchObject({ status: 'APROVADO', totalCentavos: 20000 + 9000 + 7000 + 6750 });
      expect(os).not.toHaveProperty('criadaPor');
      expect(os).not.toHaveProperty('estimativaCentavos');
      expect(os.historico[0]).not.toHaveProperty('autorId');
      expect(os.orcamentos[0].decisao).not.toHaveProperty('decididoPor');
    });

    it('cliente B recebe 404 na OS do cliente A, e a equipe não usa as rotas do cliente', async () => {
      const res = await chamar('beto', 'GET', `/me/orders/${ids.os}`);
      expect(res.statusCode).toBe(404);
      expect(res.json().code).toBe('OS_NAO_ENCONTRADA');
      expect((await chamar('beto', 'GET', '/me/orders')).json().itens.every((o: { id: string }) => o.id !== ids.os)).toBe(true);
      expect((await chamar('ATENDENTE', 'GET', '/me/orders')).statusCode).toBe(403);
      expect((await chamar('ana', 'GET', `/orders/${ids.os}`)).statusCode).toBe(403);
    });
  });

  describe('estorno', () => {
    it('estorna o consumo uma vez e recusa movimento do fluxo', async () => {
      const extrato = (await chamar('ADMIN', 'GET', `/parts/${ids.filtro}/movements`)).json();
      const consumo = extrato.itens.find((m: { tipo: string }) => m.tipo === 'CONSUMO');
      const reserva = extrato.itens.find((m: { tipo: string }) => m.tipo === 'RESERVA');
      const url = (m: { id: string }, peca = ids.filtro) => `/parts/${peca}/movements/${m.id}/reversal`;

      const semMotivo = await chamar('ADMIN', 'POST', url(consumo), { observacao: '   ' });
      expect(semMotivo.json().code).toBe('OBSERVACAO_OBRIGATORIA');
      const res = await chamar('ADMIN', 'POST', url(consumo), { observacao: 'Peça devolvida sem uso' });
      expect(res.statusCode, res.body).toBe(201);
      expect(res.json().movimento).toMatchObject({ tipo: 'ESTORNO', referenteA: consumo.id });
      expect(res.json().saldo).toEqual({ fisico: 10, reservado: 0, disponivel: 10 });

      expect((await chamar('ADMIN', 'POST', url(consumo), { observacao: 'de novo' })).json().code).toBe('MOVIMENTO_JA_ESTORNADO');
      expect((await chamar('ADMIN', 'POST', url(reserva), { observacao: 'x' })).json().code).toBe('MOVIMENTO_NAO_ESTORNAVEL');
      expect((await chamar('ADMIN', 'POST', url(consumo, ids.oleo), { observacao: 'x' })).statusCode).toBe(404);
      expect((await chamar('TECNICO', 'POST', url(consumo), { observacao: 'x' })).statusCode).toBe(403);
    });
  });

  describe('tempo médio de execução', () => {
    it('considera só OS finalizadas no período e informa a amostra', async () => {
      // datas fixas para a conta ser conferível: 2 h e 4 h dão média de 3 h
      await banco.db.query(
        `UPDATE service_orders SET execution_started_at = '2026-03-10T10:00:00Z', finalized_at = '2026-03-10T12:00:00Z'
          WHERE id = $1`,
        [ids.os],
      );
      await banco.db.query(
        `INSERT INTO service_orders
           (number, customer_id, vehicle_id, status, complaint, created_by, execution_started_at, finalized_at)
         VALUES ('OS-2026-900001', $1, $2, 'FINALIZADA', 'x', $3, '2026-03-11T08:00:00Z', '2026-03-11T12:00:00Z'),
                ('OS-2026-900002', $1, $2, 'EM_EXECUCAO', 'x', $3, '2026-03-12T08:00:00Z', NULL),
                ('OS-2026-900003', $1, $2, 'FINALIZADA', 'x', $3, '2026-04-01T08:00:00Z', '2026-04-01T09:00:00Z')`,
        [ids.ana, ids.carro_ana, ids.tecnicoId],
      );
      const res = await chamar('ATENDENTE', 'GET', '/metrics/execution-time?de=2026-03-01T00:00:00Z&ate=2026-04-01T00:00:00Z');
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json()).toMatchObject({ amostra: 2, mediaSegundos: 10800, mediaHoras: 3 });
    });

    it('sem amostra a média é null, e período inválido dá 400', async () => {
      const vazio = (await chamar('ADMIN', 'GET', '/metrics/execution-time?de=2025-01-01T00:00:00Z&ate=2025-02-01T00:00:00Z')).json();
      expect(vazio).toMatchObject({ amostra: 0, mediaSegundos: null, mediaHoras: null });
      const invertido = await chamar('ADMIN', 'GET', '/metrics/execution-time?de=2026-02-01T00:00:00Z&ate=2026-01-01T00:00:00Z');
      expect(invertido.json().code).toBe('PERIODO_INVALIDO');
      expect((await chamar('ADMIN', 'GET', '/metrics/execution-time?de=ontem&ate=hoje')).statusCode).toBe(400);
      expect((await chamar('TECNICO', 'GET', '/metrics/execution-time?de=2026-01-01T00:00:00Z&ate=2026-02-01T00:00:00Z')).statusCode).toBe(403);
    });
  });
});
