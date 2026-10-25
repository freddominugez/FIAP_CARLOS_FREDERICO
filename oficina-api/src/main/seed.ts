// Usuários de demonstração. Dados fictícios. Idempotente: pode rodar várias vezes.
import { gerarHash } from '../infrastructure/auth/bcrypt-verificador.js';
import { criarPool, emTransacao } from '../infrastructure/db/pool.js';

const SENHA_DEMO = process.env.SEED_SENHA ?? 'Oficina@2026';

const usuarios = [
  { email: 'admin@oficina.local', nome: 'Administrador Demo', perfil: 'ADMIN' },
  { email: 'atendente@oficina.local', nome: 'Atendente Demo', perfil: 'ATENDENTE' },
  { email: 'tecnico@oficina.local', nome: 'Técnico Demo', perfil: 'TECNICO' },
];

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL ausente');
const db = criarPool(url, 1, process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n') || undefined);

try {
  const hash = await gerarHash(SENHA_DEMO);
  await emTransacao(db, async (tx) => {
    for (const u of usuarios) {
      await tx.query(
        `INSERT INTO users (email, name, role, password_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [u.email, u.nome, u.perfil, hash],
      );
    }
  });
  console.log(`seed: ${usuarios.length} usuários de demonstração garantidos`);
} finally {
  await db.end();
}
