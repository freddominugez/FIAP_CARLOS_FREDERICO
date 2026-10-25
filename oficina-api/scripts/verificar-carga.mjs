// Carrega o app compilado com require(esm) desligado, como faz o carregador da Vercel.
// Pega dependência CommonJS que passou a exigir um pacote só ESM antes de chegar ao deploy.
// Uso: npm run build && node --no-experimental-require-module scripts/verificar-carga.mjs
const { criarApp } = await import('../dist/main/app.js');

const app = await criarApp({
  config: {
    port: 0,
    host: '127.0.0.1',
    databaseUrl: 'postgres://nao-usado@127.0.0.1:1/x',
    databasePoolMax: 1,
    jwt: { secret: 'x'.repeat(40), expiresIn: '1h', issuer: 'oficina-api', audience: 'oficina-clientes' },
    logLevel: 'silent',
  },
  db: { query: async () => ({ rows: [] }) },
  logger: false,
});
await app.ready();
await app.close();
console.log('carga sem require(esm): ok');
