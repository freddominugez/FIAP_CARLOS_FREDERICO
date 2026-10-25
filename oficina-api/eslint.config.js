import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', '.dependency-cruiser.cjs'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  { files: ['src/main/seed.ts'], rules: { 'no-console': 'off' } },
  // scripts de verificação rodam direto no Node e escrevem o resultado no terminal
  { files: ['scripts/**/*.mjs'], languageOptions: { globals: { console: 'readonly' } }, rules: { 'no-console': 'off' } },
);
