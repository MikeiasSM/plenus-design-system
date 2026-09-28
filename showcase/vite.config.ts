import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const raiz = resolve(__dirname, '..');

/**
 * O Showcase importa pelo nome do pacote, como qualquer aplicacao. No desenvolvimento o nome aponta para o fonte, pela
 * recarga imediata; no build, para o `dist` publicado, que assim e exercitado como o consumidor o recebe.
 */
export default defineConfig(({ command }) => {
  const pacote =
    command === 'build'
      ? {
          entrada: resolve(raiz, 'dist/plenus-design-system.es.js'),
          estilos: resolve(raiz, 'dist/design-system.css'),
          reset: resolve(raiz, 'dist/reset.css'),
        }
      : {
          entrada: resolve(raiz, 'src/index.ts'),
          // No fonte, o CSS dos componentes chega com os proprios modulos e o `index.ts` ja importa a base.
          estilos: resolve(raiz, 'src/styles/base.css'),
          reset: resolve(raiz, 'src/styles/reset.css'),
        };

  return {
    root: resolve(__dirname, 'app'),
    plugins: [react()],
    resolve: {
      alias: [
        { find: /^@plenustech\/design-system$/, replacement: pacote.entrada },
        { find: /^@plenustech\/design-system\/styles\.css$/, replacement: pacote.estilos },
        { find: /^@plenustech\/design-system\/reset\.css$/, replacement: pacote.reset },
      ],
    },
    build: {
      outDir: resolve(__dirname, '../dist-showcase'),
      emptyOutDir: true,
    },
  };
});
