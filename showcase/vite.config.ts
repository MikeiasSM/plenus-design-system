import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, 'app'),
  plugins: [react()],
  resolve: {
    alias: {
      '@plenus': resolve(__dirname, '../src'),
    },
  },
  build: {
    outDir: resolve(__dirname, '../dist-showcase'),
    emptyOutDir: true,
  },
});
