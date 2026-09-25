import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    {
      // O reset e opcional, entao nao entra pelo ponto de entrada e nao vai
      // parar no bundle dos componentes. Ele viaja como arquivo proprio.
      name: 'copia-o-reset',
      closeBundle() {
        copyFileSync(resolve(__dirname, 'src/styles/reset.css'), resolve(__dirname, 'dist/reset.css'));
      },
    },
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      // A extensao decide o formato: com `type: module` no pacote, um `.js`
      // e lido como ESM, e o bundle CommonJS nao exportaria nada.
      fileName: (format) => (format === 'es' ? 'plenus-design-system.es.js' : 'plenus-design-system.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', /^@react-aria\//, /^@internationalized\//, /^d3-/],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
