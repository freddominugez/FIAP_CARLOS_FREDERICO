// Regra de dependência das camadas (ADR 0001). Quebra o CI se for violada.
module.exports = {
  forbidden: [
    {
      name: 'dominio-isolado',
      comment: 'domain não depende de nenhuma outra camada nem de biblioteca externa',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { pathNot: '^src/domain', dependencyTypesNot: ['core'] },
    },
    {
      name: 'aplicacao-sem-infra',
      comment: 'application conhece domain e portas, nunca infraestrutura ou HTTP',
      severity: 'error',
      from: { path: '^src/application' },
      to: { path: '^src/(infrastructure|interfaces|main)' },
    },
    {
      name: 'infra-sem-http',
      severity: 'error',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/(interfaces|main)' },
    },
    {
      name: 'sem-ciclos',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    doNotFollow: { path: 'node_modules' },
  },
};
