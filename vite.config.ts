import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Depurar a biblioteca dentro do consumidor, em vez de ler o minificado.
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      // A extensao decide o formato: com `type: module` no pacote, um `.js`
      // e lido como ESM, e o bundle CommonJS nao exportaria nada.
      fileName: (format, modulo) => `${modulo}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', /^@react-aria\//, /^@internationalized\//, /^d3-/],
      // Um modulo por arquivo: num arquivo so, o empacotador do consumidor poe na primeira visita tudo o que
      // qualquer tela carregada sob demanda usa da biblioteca.
      output: { preserveModules: true, preserveModulesRoot: 'src', exports: 'named' },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
