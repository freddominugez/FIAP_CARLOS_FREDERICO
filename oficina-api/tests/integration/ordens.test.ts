import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp, type App } from '../../src/main/app.js';
import { configTeste, criarUsuario, subirBanco, type BancoTeste } from '../support/banco.js';

// T02 e T03 na borda HTTP, T10 (fluxo da OS até o orçamento) e RN09 (versão e idempotência).
describe('ordens de serviço até a publicação do orçamento', () => {
  let banco: BancoTeste;
  let app: App;
  const token: Record<string, string> = {};
  const ids: Record<string, string> = {};

  const chamar = (
    perfil: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    payload?: object,
    headers: Record<string, string> = {},
  ) =>
    app.inject({
      method,
      url: `/api/v1${url}`,
      payload,
      headers: { authorization: `Bearer ${token[perfil]}`, ...headers },
    });

  const criar = async (perfil: string, url: string, payload: object) => {
    const res = await chamar(perfil, 'POST', url, payload);
    expect(res.statusCode, res.body).toBe(201);
    return res.json().id as string;
  };

  beforeAll(async () => {
    banco = await subirBanco();
    app = await criarApp({ config: configTeste(banco.url), db: banco.db, logger: false });
    await app.ready();
    for (const perfil of ['ADMIN', 'ATENDENTE', 'TECNICO']) {
      const email = `${perfil.toLowerCase()}@teste.local`;
      await criarUsuario(banco.db, { email, senha: 'senha-certa', perfil });
      token[perfil] = (
        await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, senha: 'senha-certa' } })
      ).json().token;
    }
    ids.ana = await criar('ATENDENTE', '/customers', { documento: '529.982.247-25', nome: 'Ana' });
    ids.beto = await criar('ATENDENTE', '/customers', { documento: '111.444.777-35', nome: 'Beto' });
    ids.carroAna = await criar('ATENDENTE', '/vehicles', {
      clienteId: ids.ana,
      placa: 'ABC1D23',
      marca: 'Fiat',
      modelo: 'Argo',
      ano: 2021,
    });
    ids.carroBeto = await criar('ATENDENTE', '/vehicles', {
      clienteId: ids.beto,
      placa: 'XYZ9876',
      marca: 'VW',
      modelo: 'Gol',
      ano: 2015,
    });
    ids.oleo = await criar('ADMIN', '/services', { nome: 'Troca de óleo', precoCentavos: 8000 });
    ids.alinhamento = await criar('ADMIN', '/services', { nome: 'Alinhamento', precoCentavos: 12000 });
    ids.filtro = await criar('ADMIN', '/parts', {
      sku: 'FLT-01',
      nome: 'Filtro de óleo',
      tipo: 'PECA',
      unidade: 'UN',
      precoCentavos: 3500,
    });
    ids.lubrificante = await criar('ADMIN', '/parts', {
      sku: 'OLEO-5W30',
      nome: 'Óleo 5W30',
      tipo: 'INSUMO',
      unidade: 'L',
      precoCentavos: 4599,
    });
  });

  afterAll(async () => {
    await app?.close();
    await banco?.parar();
  });

  const abertura = () => ({ clienteId: ids.ana, veiculoId: ids.carroAna, solicitacao: 'Revisão dos 30 mil km' });

  describe('abertura', () => {
    it('abre em RECEBIDA com número público, versão 1 e histórico', async () => {
      const res = await chamar('ATENDENTE', 'POST', '/orders', abertura());
      expect(res.statusCode).toBe(201);
      const os = res.json();
      expect(os.numero).toMatch(/^OS-\d{4}-\d{6}$/);
      expect(os).toMatchObject({ status: 'RECEBIDA', versao: 1, servicos: [], pecas: [], orcamentos: [] });
      expect(os.historico).toEqual([expect.objectContaining({ de: null, para: 'RECEBIDA' })]);
      ids.os = os.id;
    });

    it('repete a mesma OS com a mesma Idempotency-Key e recusa corpo diferente', async () => {
      const chave = { 'idempotency-key': 'abrir-os-teste-0001' };
      const primeira = await chamar('ATENDENTE', 'POST', '/orders', abertura(), chave);
      const segunda = await chamar('ATENDENTE', 'POST', '/orders', abertura(), chave);
      expect(segunda.statusCode).toBe(201);
      expect(segunda.json().id).toBe(primeira.json().id);
      expect(segunda.headers['idempotent-replayed']).toBe('true');

      const outra = await chamar('ATENDENTE', 'POST', '/orders', { ...abertura(), solicitacao: 'outra' }, chave);
      expect(outra.statusCode).toBe(409);
      expect(outra.json().code).toBe('IDEMPOTENCIA_CONFLITO');
    });

    it('trata chamadas simultâneas com a mesma chave como uma só', async () => {
      const chave = { 'idempotency-key': 'abrir-os-simultanea-01' };
      const respostas = await Promise.all(
        Array.from({ length: 5 }, () => chamar('ATENDENTE', 'POST', '/orders', abertura(), chave)),
      );
      expect(new Set(respostas.map((r) => r.statusCode))).toEqual(new Set([201]));
      expect(new Set(respostas.map((r) => r.json().id)).size).toBe(1);
    });

    it('recusa veículo de outro cliente, solicitação em branco e perfil técnico', async () => {
      const outro = await chamar('ATENDENTE', 'POST', '/orders', { ...abertura(), veiculoId: ids.carroBeto });
      expect(outro.json().code).toBe('VEICULO_DE_OUTRO_CLIENTE');
      const branco = await chamar('ATENDENTE', 'POST', '/orders', { ...abertura(), solicitacao: '   ' });
      expect(branco.json().code).toBe('CAMPO_OBRIGATORIO');
      expect((await chamar('TECNICO', 'POST', '/orders', abertura())).statusCode).toBe(403);
      const semCliente = await chamar('ATENDENTE', 'POST', '/orders', {
        ...abertura(),
        clienteId: '00000000-0000-4000-8000-000000000000',
      });
      expect(semCliente.statusCode).toBe(404);
    });
  });

  describe('diagnóstico', () => {
    it('não aceita itens antes do diagnóstico', async () => {
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/services`, { servicoId: ids.oleo, quantidade: 1 });
      expect(res.json().code).toBe('OS_FORA_DO_DIAGNOSTICO');
    });

    it('exige perfil técnico e a versão atual', async () => {
      expect((await chamar('ATENDENTE', 'POST', `/orders/${ids.os}/diagnosis`, { versao: 1 })).statusCode).toBe(403);
      const velha = await chamar('TECNICO', 'POST', `/orders/${ids.os}/diagnosis`, { versao: 7 });
      expect(velha.json().code).toBe('VERSAO_DESATUALIZADA');
      const ok = await chamar('TECNICO', 'POST', `/orders/${ids.os}/diagnosis`, { versao: 1 });
      expect(ok.json()).toMatchObject({ status: 'EM_DIAGNOSTICO', versao: 2 });
      const repetida = await chamar('TECNICO', 'POST', `/orders/${ids.os}/diagnosis`, { versao: 2 });
      expect(repetida.json().code).toBe('TRANSICAO_INVALIDA');
    });

    it('não publica orçamento sem itens', async () => {
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/quotes`, { versao: 2 });
      expect(res.json().code).toBe('ORCAMENTO_SEM_ITENS');
    });

    it('inclui serviços, peças e insumos e calcula a estimativa em centavos', async () => {
      await chamar('TECNICO', 'POST', `/orders/${ids.os}/services`, { servicoId: ids.oleo, quantidade: 2 });
      const fracionada = await chamar('TECNICO', 'POST', `/orders/${ids.os}/parts`, { pecaId: ids.filtro, quantidade: 1.5 });
      expect(fracionada.json().code).toBe('QUANTIDADE_INVALIDA');
      await chamar('TECNICO', 'POST', `/orders/${ids.os}/parts`, { pecaId: ids.filtro, quantidade: 4 });
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/parts`, { pecaId: ids.lubrificante, quantidade: 4.5 });
      expect(res.statusCode).toBe(201);
      const os = res.json();
      expect(os.servicos).toHaveLength(1);
      expect(os.pecas.map((p: { totalCentavos: number }) => p.totalCentavos).sort()).toEqual([14000, 20696]);
      expect(os.estimativaCentavos).toBe(16000 + 14000 + 20696);
      expect(os.versao).toBe(5);
    });

    it('remove item e devolve 404 para item de outra OS', async () => {
      const os = (await chamar('TECNICO', 'POST', `/orders/${ids.os}/services`, { servicoId: ids.alinhamento, quantidade: 1 })).json();
      const alinhamento = os.servicos.find((s: { servicoId: string }) => s.servicoId === ids.alinhamento);
      const removido = await chamar('TECNICO', 'DELETE', `/orders/${ids.os}/services/${alinhamento.id}`);
      expect(removido.json().servicos).toHaveLength(1);
      const deNovo = await chamar('TECNICO', 'DELETE', `/orders/${ids.os}/services/${alinhamento.id}`);
      expect(deNovo.json().code).toBe('ITEM_NAO_ENCONTRADO');
    });

    it('recusa item inativo no catálogo', async () => {
      const inativo = await criar('ADMIN', '/services', { nome: 'Lavagem', precoCentavos: 3000 });
      await chamar('ADMIN', 'PATCH', `/services/${inativo}`, { ativo: false });
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/services`, { servicoId: inativo, quantidade: 1 });
      expect(res.json().code).toBe('ITEM_INATIVO');
    });
  });

  describe('publicação do orçamento', () => {
    it('recusa versão anterior à última mudança de item', async () => {
      const res = await chamar('TECNICO', 'POST', `/orders/${ids.os}/quotes`, { versao: 5 });
      expect(res.json().code).toBe('VERSAO_DESATUALIZADA');
    });

    it('publica a versão 1 com preços congelados e leva a OS para AGUARDANDO_APROVACAO', async () => {
      const atual = (await chamar('ATENDENTE', 'GET', `/orders/${ids.os}`)).json();
      const res = await chamar('ATENDENTE', 'POST', `/orders/${ids.os}/quotes`, { versao: atual.versao });
      expect(res.statusCode).toBe(201);
      const os = res.json();
      expect(os.status).toBe('AGUARDANDO_APROVACAO');
      expect(os.orcamentos).toHaveLength(1);
      expect(os.orcamentos[0]).toMatchObject({ versao: 1, status: 'PENDENTE', totalCentavos: 50696 });
      expect(os.orcamentos[0].itens).toHaveLength(3);
      expect(os.historico.map((h: { para: string }) => h.para)).toEqual([
        'RECEBIDA',
        'EM_DIAGNOSTICO',
        'AGUARDANDO_APROVACAO',
      ]);
    });

    it('mantém o preço publicado quando o catálogo muda', async () => {
      await chamar('ADMIN', 'PATCH', `/services/${ids.oleo}`, { precoCentavos: 9999, nome: 'Troca de óleo sintético' });
      const os = (await chamar('TECNICO', 'GET', `/orders/${ids.os}`)).json();
      const congelado = os.orcamentos[0].itens.find((i: { tipo: string }) => i.tipo === 'SERVICO');
      expect(congelado).toMatchObject({ descricao: 'Troca de óleo', precoUnitarioCentavos: 8000, totalCentavos: 16000 });
      expect(os.servicos[0].precoUnitarioCentavos).toBe(9999);
      expect(os.orcamentos[0].totalCentavos).toBe(50696);
    });

    it('bloqueia itens e nova publicação depois de publicado', async () => {
      const item = await chamar('TECNICO', 'POST', `/orders/${ids.os}/services`, { servicoId: ids.oleo, quantidade: 1 });
      expect(item.json().code).toBe('OS_FORA_DO_DIAGNOSTICO');
      const versao = (await chamar('TECNICO', 'GET', `/orders/${ids.os}`)).json().versao;
      const publicar = await chamar('TECNICO', 'POST', `/orders/${ids.os}/quotes`, { versao });
      expect(publicar.json().code).toBe('TRANSICAO_INVALIDA');
    });

    it('recusa publicar com item que ficou inativo depois de incluído', async () => {
      const os = (
        await chamar('ATENDENTE', 'POST', '/orders', { clienteId: ids.beto, veiculoId: ids.carroBeto, solicitacao: 'Freio' })
      ).json();
      await chamar('TECNICO', 'POST', `/orders/${os.id}/diagnosis`, { versao: 1 });
      const temp = await criar('ADMIN', '/services', { nome: 'Sangria de freio', precoCentavos: 6000 });
      const comItem = (await chamar('TECNICO', 'POST', `/orders/${os.id}/services`, { servicoId: temp, quantidade: 1 })).json();
      await chamar('ADMIN', 'PATCH', `/services/${temp}`, { ativo: false });
      const res = await chamar('TECNICO', 'POST', `/orders/${os.id}/quotes`, { versao: comItem.versao });
      expect(res.json()).toMatchObject({ code: 'ITEM_INATIVO', message: expect.stringContaining('Sangria') });
      ids.osBeto = os.id;
    });

    it('publicações simultâneas na mesma versão: só uma passa', async () => {
      const os = (
        await chamar('ATENDENTE', 'POST', '/orders', { clienteId: ids.beto, veiculoId: ids.carroBeto, solicitacao: 'Revisão' })
      ).json();
      await chamar('TECNICO', 'POST', `/orders/${os.id}/diagnosis`, { versao: 1 });
      const pronta = (await chamar('TECNICO', 'POST', `/orders/${os.id}/parts`, { pecaId: ids.filtro, quantidade: 1 })).json();
      const respostas = await Promise.all([
        chamar('TECNICO', 'POST', `/orders/${os.id}/quotes`, { versao: pronta.versao }),
        chamar('ATENDENTE', 'POST', `/orders/${os.id}/quotes`, { versao: pronta.versao }),
      ]);
      expect(respostas.map((r) => r.statusCode).sort()).toEqual([201, 409]);
      const final = (await chamar('ATENDENTE', 'GET', `/orders/${os.id}`)).json();
      expect(final.orcamentos).toHaveLength(1);
    });
  });

  describe('cadastros inativos e itens inexistentes', () => {
    it('não abre OS para veículo ou cliente inativo nem aceita item fora do catálogo', async () => {
      const inexistente = '00000000-0000-4000-8000-000000000000';
      const clienteId = await criar('ATENDENTE', '/customers', { documento: '11.222.333/0001-81', nome: 'Frota' });
      const veiculoId = await criar('ATENDENTE', '/vehicles', { clienteId, placa: 'FRT1A23', marca: 'Ford', modelo: 'Ka', ano: 2019 });
      const dados = { clienteId, veiculoId, solicitacao: 'Revisão' };

      const os = (await chamar('ATENDENTE', 'POST', '/orders', dados)).json();
      await chamar('TECNICO', 'POST', `/orders/${os.id}/diagnosis`, { versao: 1 });
      const semServico = await chamar('TECNICO', 'POST', `/orders/${os.id}/services`, { servicoId: inexistente, quantidade: 1 });
      expect(semServico.json().code).toBe('SERVICO_NAO_ENCONTRADO');
      const semPeca = await chamar('TECNICO', 'POST', `/orders/${os.id}/parts`, { pecaId: inexistente, quantidade: 1 });
      expect(semPeca.json().code).toBe('PECA_NAO_ENCONTRADA');
      const pecaInativa = await criar('ADMIN', '/parts', { sku: 'INAT-01', nome: 'Velha', tipo: 'PECA', unidade: 'UN', precoCentavos: 1 });
      await chamar('ADMIN', 'PATCH', `/parts/${pecaInativa}`, { ativo: false });
      const inativa = await chamar('TECNICO', 'POST', `/orders/${os.id}/parts`, { pecaId: pecaInativa, quantidade: 1 });
      expect(inativa.json().code).toBe('ITEM_INATIVO');

      const semVeiculo = await chamar('ATENDENTE', 'POST', '/orders', { ...dados, veiculoId: inexistente });
      expect(semVeiculo.json().code).toBe('VEICULO_NAO_ENCONTRADO');
      await chamar('ATENDENTE', 'PATCH', `/vehicles/${veiculoId}`, { ativo: false });
      expect((await chamar('ATENDENTE', 'POST', '/orders', dados)).json().code).toBe('VEICULO_INATIVO');
      await chamar('ATENDENTE', 'PATCH', `/customers/${clienteId}`, { ativo: false });
      expect((await chamar('ATENDENTE', 'POST', '/orders', dados)).json().code).toBe('CLIENTE_INATIVO');
    });
  });

  describe('consulta', () => {
    it('lista por status e cliente e bloqueia CLIENTE', async () => {
      const aguardando = (await chamar('TECNICO', 'GET', '/orders?status=AGUARDANDO_APROVACAO')).json();
      expect(aguardando.total).toBe(2);
      const doBeto = (await chamar('ATENDENTE', 'GET', `/orders?clienteId=${ids.beto}`)).json();
      expect(doBeto.itens.every((o: { clienteId: string }) => o.clienteId === ids.beto)).toBe(true);
      const alem = (await chamar('ATENDENTE', 'GET', '/orders?deslocamento=500')).json();
      expect(alem).toMatchObject({ itens: [], total: 6 });
      expect((await chamar('ATENDENTE', 'GET', '/orders?status=CANCELADA')).statusCode).toBe(400);
      expect((await chamar('ATENDENTE', 'GET', '/orders/00000000-0000-4000-8000-000000000000')).statusCode).toBe(404);
    });
  });
});
