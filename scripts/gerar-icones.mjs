import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Gera a suite completa do Bootstrap Icons como componentes, em `src/components/icons/suite.tsx`. O arquivo gerado
 * entra no repositorio; rode de novo so ao subir a versao do `bootstrap-icons`, que e dependencia de desenvolvimento.
 */

const raiz = resolve(import.meta.dirname, '..');
const pasta = resolve(raiz, 'node_modules/bootstrap-icons/icons');
const versao = JSON.parse(readFileSync(resolve(raiz, 'node_modules/bootstrap-icons/package.json'), 'utf8')).version;

const ATRIBUTOS = { 'fill-rule': 'fillRule', 'fill-opacity': 'fillOpacity', 'clip-rule': 'clipRule' };
const ELEMENTOS = new Set(['path', 'rect', 'circle']);

function nomeDoComponente(arquivo) {
  return `Icon${arquivo
    .replace(/\.svg$/, '')
    .split('-')
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join('')}`;
}

function desenho(svg, arquivo) {
  const interior = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const elementos = [...interior.matchAll(/<(\w+)([^>]*?)\/?>/g)];

  return elementos.map(([, elemento, atributos]) => {
    if (!ELEMENTOS.has(elemento)) {
      throw new Error(`${arquivo}: elemento <${elemento}> sem conversao`);
    }

    const props = [...atributos.matchAll(/([\w-]+)="([^"]*)"/g)]
      .map(([, nome, valor]) => `${ATRIBUTOS[nome] ?? nome}="${valor}"`)
      .join(' ');

    return `<${elemento} ${props} />`;
  });
}

const arquivos = readdirSync(pasta).filter((arquivo) => arquivo.endsWith('.svg')).sort();
const componentes = arquivos.map((arquivo) => {
  const nome = nomeDoComponente(arquivo);
  const filhos = desenho(readFileSync(resolve(pasta, arquivo), 'utf8'), arquivo).join('');

  return `export function ${nome}(props: IconProps) {\n  return <Icon {...props}>${filhos}</Icon>;\n}\n`;
});

const cabecalho = `// Gerado por scripts/gerar-icones.mjs a partir do bootstrap-icons ${versao}. Nao edite a mao.
// Bootstrap Icons, sob licenca MIT — Copyright (c) 2019-2024 The Bootstrap Authors.
import { Icon, type IconProps } from './Icon';

`;

writeFileSync(resolve(raiz, 'src/components/icons/suite.tsx'), cabecalho + componentes.join('\n'));
console.log(`Suite gerada: ${componentes.length} icones do bootstrap-icons ${versao}.`);
