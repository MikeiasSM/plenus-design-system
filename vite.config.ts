import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';

// So o modulo com hook, contexto ou portal e do cliente; o resto segue utilizavel num Server Component.
const usaApiDoCliente = /\b(use[A-Z]\w*|createContext|createPortal|flushSync)\b/;

const marcaModulosDoCliente: Plugin = {
  name: 'marca-modulos-do-cliente',
  renderChunk: (code) => (usaApiDoCliente.test(code) ? { code: `'use client';\n${code}`, map: null } : null),
};

export default defineConfig({
  plugins: [react(), marcaModulosDoCliente],
  build: {
    // Depurar a biblioteca dentro do consumidor, em vez de ler o minificado.
    sourcemap: true,
    lib: {
      // A suite de icones e uma entrada propria, publicada em `@plenustech/design-system/icons`.
      entry: { index: 'src/index.ts', icons: 'src/icons.ts' },
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
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/components/icons/suite.tsx', 'src/**/*.d.ts'],
    },
  },
});
