export interface Config {
  port: number;
  host: string;
  databaseUrl: string;
  databasePoolMax: number;
  /** CA em PEM para validar o certificado do banco (Supabase). Sem ela, conexão sem TLS, como no Compose. */
  databaseSslCa?: string;
  jwt: {
    secret: string;
    expiresIn: string;
    issuer: string;
    audience: string;
  };
  logLevel: string;
}

const MIN_SEGREDO = 32;

/** Lê e valida as variáveis de ambiente. Falha cedo, na subida, se faltar algo. */
export function carregarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const faltando: string[] = [];
  const obrigatoria = (nome: string): string => {
    const valor = env[nome];
    if (!valor) faltando.push(nome);
    return valor ?? '';
  };

  const config: Config = {
    port: Number(env.PORT ?? 3000),
    // Vercel encaminha para localhost, que pode ser ::1. No container, escuta em todas as interfaces IPv4
    host: env.HOST ?? (env.VERCEL ? 'localhost' : '0.0.0.0'),
    databaseUrl: obrigatoria('DATABASE_URL'),
    databasePoolMax: Number(env.DATABASE_POOL_MAX ?? 5),
    // painéis de variáveis às vezes gravam a quebra de linha como \n literal
    databaseSslCa: env.DATABASE_SSL_CA?.replace(/\\n/g, '\n') || undefined,
    jwt: {
      secret: obrigatoria('JWT_SECRET'),
      expiresIn: env.JWT_EXPIRES_IN ?? '1h',
      issuer: env.JWT_ISSUER ?? 'oficina-api',
      audience: env.JWT_AUDIENCE ?? 'oficina-clientes',
    },
    logLevel: env.LOG_LEVEL ?? 'info',
  };

  if (faltando.length) {
    throw new Error(`Variáveis de ambiente ausentes: ${faltando.join(', ')}`);
  }
  if (config.jwt.secret.length < MIN_SEGREDO) {
    throw new Error(`JWT_SECRET precisa de pelo menos ${MIN_SEGREDO} caracteres`);
  }
  if (config.databaseSslCa && !config.databaseSslCa.includes('BEGIN CERTIFICATE')) {
    throw new Error('DATABASE_SSL_CA precisa ser um certificado PEM');
  }
  if (/[?&]sslmode=/.test(config.databaseUrl) && config.databaseSslCa) {
    throw new Error('Com DATABASE_SSL_CA, tire o sslmode da DATABASE_URL: ele substituiria a verificação');
  }
  if (!Number.isInteger(config.port) || !Number.isInteger(config.databasePoolMax)) {
    throw new Error('PORT e DATABASE_POOL_MAX precisam ser inteiros');
  }
  return config;
}
