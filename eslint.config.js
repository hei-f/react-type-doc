import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 全局忽略
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.husky/**',
      '**/bun.lock',
      '**/*.config.ts',
      '**/*.config.js',
      'packages/react-type-doc/test-*',
    ],
  },
  // JavaScript 文件配置
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // TypeScript 文件配置
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: [
          './packages/react-type-doc/tsconfig.json',
          './packages/example/tsconfig.app.json',
          './packages/example/tsconfig.node.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // benchmark 和 CLI 文件允许 console
  {
    files: ['**/benchmark/**/*.{ts,tsx}', '**/cli/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  // 测试类型文件允许 namespace
  {
    files: ['**/types/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
);
