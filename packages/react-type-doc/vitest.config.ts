import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'jsdom',

    // 全局测试设置
    globals: true,

    // 测试文件匹配模式
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // 排除的文件
    exclude: ['node_modules', 'dist', '**/*.d.ts'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      // 覆盖率阈值（初始阶段设置为较低值，逐步提升）
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 45,
        statements: 50,
      },
    },

    // 测试超时时间
    testTimeout: 10000,

    // 钩子超时时间
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
