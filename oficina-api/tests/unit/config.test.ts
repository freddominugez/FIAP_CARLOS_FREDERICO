import { describe, expect, it } from 'vitest';
import { carregarConfig } from '../../src/main/config.js';

const base = {
  DATABASE_URL: 'postgres://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
};

describe('carregarConfig', () => {
  it('aplica valores padrão', () => {
    const c = carregarConfig(base);
    expect(c).toMatchObject({ port: 3000, databasePoolMax: 5, jwt: { expiresIn: '1h', issuer: 'oficina-api' } });
  });

  it('escuta em localhost na Vercel e em 0.0.0.0 no container', () => {
    expect(carregarConfig(base).host).toBe('0.0.0.0');
    expect(carregarConfig({ ...base, VERCEL: '1' }).host).toBe('localhost');
    expect(carregarConfig({ ...base, VERCEL: '1', HOST: '::' }).host).toBe('::');
  });

  it('lista todas as variáveis ausentes de uma vez', () => {
    expect(() => carregarConfig({})).toThrow('DATABASE_URL, JWT_SECRET');
  });

  it('recusa segredo curto', () => {
    expect(() => carregarConfig({ ...base, JWT_SECRET: 'curto' })).toThrow(/32 caracteres/);
  });

  it('recusa porta não numérica', () => {
    expect(() => carregarConfig({ ...base, PORT: 'abc' })).toThrow(/inteiros/);
  });

  it('aceita CA em PEM com quebra de linha escapada e recusa valor que não é certificado', () => {
    const pem = '-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----';
    expect(carregarConfig({ ...base, DATABASE_SSL_CA: pem }).databaseSslCa).toBe(
      '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----',
    );
    expect(() => carregarConfig({ ...base, DATABASE_SSL_CA: 'qualquer' })).toThrow(/PEM/);
  });

  it('recusa sslmode na URL junto com a CA', () => {
    const pem = '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----';
    expect(() =>
      carregarConfig({ ...base, DATABASE_URL: `${base.DATABASE_URL}?sslmode=require`, DATABASE_SSL_CA: pem }),
    ).toThrow(/sslmode/);
  });
});
