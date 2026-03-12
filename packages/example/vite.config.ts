import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const reactTypeDocSrc = path.resolve(__dirname, '../react-type-doc/src');

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-type-doc/runtime': path.join(reactTypeDocSrc, 'runtime-entry.ts'),
      'react-type-doc/ui': path.join(reactTypeDocSrc, 'ui-entry.ts'),
      'react-type-doc': path.join(reactTypeDocSrc, 'index.ts'),
    },
  },
});
