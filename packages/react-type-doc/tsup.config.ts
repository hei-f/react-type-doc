import { defineConfig } from 'tsup';

export default defineConfig([
  // 主入口和运行时入口
  {
    entry: {
      index: 'src/index.ts',
      'runtime-entry': 'src/runtime-entry.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    shims: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
  },
  // CLI 入口（单独配置，需要 shebang）
  {
    entry: {
      cli: 'src/cli/index.ts',
    },
    format: ['esm'],
    dts: false,
    clean: false,
    shims: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    banner: {
      js: '#!/usr/bin/env node',
    },
    outExtension() {
      return {
        js: '.js',
      };
    },
  },
]);
