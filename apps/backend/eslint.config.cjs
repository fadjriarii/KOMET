const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['**/dist', '**/node_modules', '**/coverage', '**/prisma', '**/logs', '**/tests'],
  },
  {
    files: ['**/*.{js,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'no-control-regex': 'warn',
      'no-useless-assignment': 'warn',
    },
  },
];
