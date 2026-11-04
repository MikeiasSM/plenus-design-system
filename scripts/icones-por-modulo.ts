import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Um modulo por icone da suite, publicado em `@plenustech/design-system/icons/<Nome>`: o consumidor sem
 * tree-shaking importa so o desenho que usa, e nao os 2.050 de `suite.tsx`. Os modulos nao existem no disco;
 * este plugin os monta a partir de `suite.tsx`, que continua a unica fonte dos desenhos.
 */

const pastaDosModulos = resolve(import.meta.dirname, '../src/icons').replaceAll('\\', '/');
const suite = readFileSync(resolve(import.meta.dirname, '../src/components/icons/suite.tsx'), 'utf8');
const componentes = [...suite.matchAll(/^export function (Icon\w+)\(props: IconProps\) \{\n[^\n]+\n\}$/gm)];
const fontePorNome = new Map(componentes.map(([fonte, nome]) => [nome, fonte]));

const moduloDoIcone = /(^|\/)src\/icons\/Icon\w+\.tsx$/;

export const entradasDosIcones = Object.fromEntries(
  [...fontePorNome.keys()].map((nome) => [`icons/${nome}`, `src/icons/${nome}.tsx`]),
);

export const iconesPorModulo: Plugin = {
  name: 'icones-por-modulo',
  enforce: 'pre',
  resolveId(id) {
    const caminho = id.replaceAll('\\', '/');

    return moduloDoIcone.test(caminho) ? `${pastaDosModulos}/${caminho.split('/').pop()}` : null;
  },
  load(id) {
    const nome = id.startsWith(`${pastaDosModulos}/`) ? id.slice(pastaDosModulos.length + 1).replace(/\.tsx$/, '') : '';
    const fonte = fontePorNome.get(nome);

    return fonte ? `import { Icon, type IconProps } from '../components/icons/Icon';\n\n${fonte}\n` : null;
  },
};
