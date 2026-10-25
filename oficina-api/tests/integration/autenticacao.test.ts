import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarApp, type App } from '../../src/main/app.js';
import { configTeste, criarUsuario, subirBanco, type BancoTeste } from '../support/banco.js';

// T06 (parcial): login, JWT ausente, adulterado, de outro emissor, perfil sem permissão.
describe('autenticação JWT', () => {
  let banco: BancoTeste;
  let app: App;

  beforeAll(async () => {
    banco = await subirBanco();
    app = await criarApp({ config: configTeste(banco.url), db: banco.db, logger: false });
    // rota de teste para provar o preHandler de perfil
    app.get('/teste/so-admin', { preHandler: app.exigirPerfil('ADMIN') }, async () => ({ ok: true }));
    await app.ready();
    await criarUsuario(banco.db, { email: 'admin@teste.local', senha: 'senha-certa', perfil: 'ADMIN' });
    await criarUsuario(banco.db, { email: 'tecnico@teste.local', senha: 'senha-certa', perfil: 'TECNICO' });
    await criarUsuario(banco.db, { email: 'inativo@teste.local', senha: 'senha-certa', perfil: 'ADMIN', ativo: false });
  });

  afterAll(async () => {
    await app?.close();
    await banco?.parar();
  });

  const login = (email: string, senha: string) =>
    app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email, senha } });

  it('devolve token com credenciais válidas, ignorando maiúsculas no e-mail', async () => {
    const res = await login('Admin@Teste.local', 'senha-certa');
    expect(res.statusCode).toBe(200);
    const corpo = res.json();
    expect(corpo.tipo).toBe('Bearer');
    expect(corpo.usuario.perfil).toBe('ADMIN');
    expect(corpo.token.split('.')).toHaveLength(3);
  });

  it('recusa senha errada, e-mail inexistente e usuário inativo com a mesma resposta', async () => {
    for (const [email, senha] of [
      ['admin@teste.local', 'errada'],
      ['ninguem@teste.local', 'senha-certa'],
      ['inativo@teste.local', 'senha-certa'],
    ] as const) {
      const res = await login(email, senha);
      expect(res.statusCode).toBe(401);
      expect(res.json()).toMatchObject({ code: 'CREDENCIAIS_INVALIDAS', message: 'E-mail ou senha inválidos' });
    }
  });

  it('valida o corpo do login', async () => {
    const res = await login('nao-e-email', '');
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe('ENTRADA_INVALIDA');
    expect(res.json().request_id).toBeTruthy();
  });

  it('trata JSON vazio como corpo ausente e barra prototype pollution', async () => {
    const vazio = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '',
    });
    expect(vazio.statusCode).toBe(400);
    expect(vazio.json().code).toBe('ENTRADA_INVALIDA');
    const veneno = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{"email":"a@b.c","senha":"x","__proto__":{"admin":true}}',
    });
    expect(veneno.statusCode).toBe(400);
  });

  it('recusa caractere nulo no corpo e na URL com 400, sem chegar ao banco', async () => {
    const corpo = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{"email":"a\\u0000@b.c","senha":"x"}',
    });
    expect(corpo.statusCode).toBe(400);
    expect(corpo.json()).toMatchObject({ code: 'ENTRADA_INVALIDA', message: expect.stringContaining('nulo') });
    const url = await app.inject({ method: 'GET', url: '/api/v1/health?x=%00' });
    expect(url.statusCode).toBe(400);
  });

  it('envia cabeçalhos de segurança e proíbe cache na API', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.headers).toMatchObject({
      'x-content-type-options': 'nosniff',
      'cross-origin-resource-policy': 'same-origin',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
      'cache-control': 'no-store',
    });
    const docs = await app.inject({ method: 'GET', url: '/api/docs/json' });
    expect(docs.headers['x-content-type-options']).toBe('nosniff');
    expect(docs.headers['cache-control']).not.toBe('no-store');
  });

  it('exige token em rota protegida', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json().code).toBe('TOKEN_INVALIDO');
  });

  it('aceita o token emitido no login', async () => {
    const { token } = (await login('tecnico@teste.local', 'senha-certa')).json();
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${token}` } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ perfil: 'TECNICO', clienteId: null });
  });

  it('recusa token adulterado', async () => {
    const { token } = (await login('tecnico@teste.local', 'senha-certa')).json();
    const [cab, , ass] = token.split('.');
    const payloadFalso = Buffer.from(JSON.stringify({ sub: 'x', perfil: 'ADMIN' })).toString('base64url');
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${cab}.${payloadFalso}.${ass}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('recusa token assinado com o mesmo segredo mas outro emissor', async () => {
    const token = app.jwt.sign(
      { sub: 'x', nome: 'x', perfil: 'ADMIN', clienteId: null },
      { iss: 'outro-emissor' },
    );
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${token}` } });
    expect(res.statusCode).toBe(401);
  });

  it('recusa token expirado', async () => {
    const token = app.jwt.sign({ sub: 'x', nome: 'x', perfil: 'ADMIN', clienteId: null }, { expiresIn: -10 });
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { authorization: `Bearer ${token}` } });
    expect(res.statusCode).toBe(401);
  });

  it('bloqueia perfil sem permissão com 403', async () => {
    const tecnico = (await login('tecnico@teste.local', 'senha-certa')).json().token;
    const admin = (await login('admin@teste.local', 'senha-certa')).json().token;
    const negado = await app.inject({ method: 'GET', url: '/teste/so-admin', headers: { authorization: `Bearer ${tecnico}` } });
    expect(negado.statusCode).toBe(403);
    expect(negado.json().code).toBe('PERFIL_SEM_PERMISSAO');
    const liberado = await app.inject({ method: 'GET', url: '/teste/so-admin', headers: { authorization: `Bearer ${admin}` } });
    expect(liberado.statusCode).toBe(200);
  });

  it('responde health com banco ok e publica o OpenAPI', async () => {
    const saude = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(saude.json()).toEqual({ status: 'ok', banco: 'ok' });
    expect(saude.headers['x-request-id']).toBeTruthy();
    const docs = await app.inject({ method: 'GET', url: '/api/docs/json' });
    expect(docs.statusCode).toBe(200);
    expect(Object.keys(docs.json().paths)).toContain('/api/v1/auth/login');
  });
});
