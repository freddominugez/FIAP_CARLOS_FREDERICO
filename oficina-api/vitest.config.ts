import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // integração sobe PostgreSQL em container: o primeiro pull da imagem pode demorar
    testTimeout: 30_000,
    hookTimeout: 180_000,
    coverage: {
      provider: 'v8',
      // domínios críticos medidos para o corte de 80% do enunciado
      include: ['src/domain/**', 'src/application/**'],
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
