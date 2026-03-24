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
  // UI 组件入口（peerDependencies 需要 external）
  {
    entry: {
      'ui-entry': 'src/ui-entry.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: false,
    shims: true,
    sourcemap: true,
    splitting: false,
    treeshake: true,
    external: [
      'react',
      'react-dom',
      'styled-components',
      '@uiw/react-codemirror',
      '@codemirror/view',
      '@codemirror/state',
      '@codemirror/lang-javascript',
      '@codemirror/language',
      '@codemirror/theme-one-dark',
      '@replit/codemirror-indentation-markers',
    ],
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
