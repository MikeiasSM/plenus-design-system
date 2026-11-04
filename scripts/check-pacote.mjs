import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';

/**
 * Confere o pacote construido, e nao o codigo-fonte. A suite do Vitest nunca
 * toca `dist/`: foi assim que um bundle CommonJS com extensao errada passou
 * carregando sem erro e exportando zero simbolos.
 */

const raiz = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const falhas = [];

function exigir(condicao, mensagem) {
  if (!condicao) {
    falhas.push(mensagem);
  }
}

function arquivoComConteudo(caminho, minimo) {
  const completo = resolve(raiz, caminho);

  return existsSync(completo) && statSync(completo).size >= minimo;
}

/** Nomes exportados em tempo de execucao. `export type` nao conta. */
function exportsDaFonte() {
  const fonte = readFileSync(resolve(raiz, 'src/index.ts'), 'utf8');
  const nomes = new Set();

  for (const bloco of fonte.matchAll(/(?<!type\s)export\s*\{([^}]*)\}/g)) {
    for (const nome of bloco[1].split(',')) {
      const limpo = nome.trim().split(/\s+as\s+/).pop();

      if (limpo && !limpo.startsWith('type ')) {
        nomes.add(limpo);
      }
    }
  }

  return nomes;
}

/** Palavras-chave de `animation`, que nao sao nome de keyframe. CSS nao distingue caixa nelas. */
const PALAVRAS_DE_ANIMACAO = new Set([
  'alternate', 'alternate-reverse', 'backwards', 'both', 'ease', 'ease-in', 'ease-in-out', 'ease-out',
  'forwards', 'infinite', 'inherit', 'initial', 'linear', 'none', 'normal', 'paused', 'revert',
  'revert-layer', 'reverse', 'running', 'step-end', 'step-start', 'unset',
]);

/**
 * Seletores sem classe que o CSS dos componentes pode ter: tokens no documento, tokens nos escopos de
 * `data-theme` e `data-palette`, que so valem onde o produto pos o atributo, e o `box-sizing`.
 */
const SELETORES_GLOBAIS = new Set([
  ':root',
  ':root:not([data-theme])',
  '[data-theme]',
  '[data-theme=light]',
  '[data-theme=dark]',
  '[data-palette]',
  '[data-palette=orange]',
  '[data-palette=blue]',
  '[data-palette=purple]',
  '*',
  '*:before',
  '*:after',
]);

/**
 * Keyframe referenciado precisa existir no mesmo arquivo. O CSS Modules
 * renomeia o nome na declaracao `animation` mesmo quando ele foi definido num
 * arquivo global, e a referencia deixa de casar — em silencio, porque CSS nao
 * reclama de animacao inexistente. Nome por `var()` escapa a conferencia.
 */
function keyframesOrfaos(css) {
  const definidos = new Set([...css.matchAll(/@keyframes\s+["']?([\w-]+)/g)].map((m) => m[1]));
  const orfaos = new Set();

  for (const declaracao of css.matchAll(/animation(?:-name)?:([^;}]+)/g)) {
    for (const parte of declaracao[1].split(/[\s,]+/)) {
      const nome = parte.replace(/^["']|["']$/g, '');

      if (/^[_a-zA-Z][\w-]*$/.test(nome) && !PALAVRAS_DE_ANIMACAO.has(nome.toLowerCase()) && !definidos.has(nome)) {
        orfaos.add(nome);
      }
    }
  }

  return [...orfaos];
}

/**
 * Variavel usada sem ser declarada em lugar algum do CSS publicado: a regra cai no valor inicial, em silencio.
 * A que traz valor reserva, como `--pl-palette-solid`, e opcional por desenho.
 */
function variaveisSemDefinicao(css) {
  const definidas = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

  return [...new Set([...css.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)].map((m) => m[1]))].filter((nome) => !definidas.has(nome));
}

/** Seletor sem classe no CSS dos componentes reescreve a pagina do hospedeiro; o lugar dele e o `reset.css`. */
function seletoresDePagina(css) {
  const semKeyframes = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const seletores = new Set();

  for (const regra of semKeyframes.matchAll(/([^{}@;]+)\{[^{}]*\}/g)) {
    // Vírgula dentro de `:is()` ou `:not()` não separa seletores.
    for (const parte of regra[1].split(/,(?![^(]*\))/)) {
      const seletor = parte.trim();

      if (seletor && !seletor.includes('.') && !SELETORES_GLOBAIS.has(seletor)) {
        seletores.add(seletor);
      }
    }
  }

  return [...seletores];
}

exigir(arquivoComConteudo('dist/types/index.d.ts', 100), 'dist/types/index.d.ts ausente ou vazio');
exigir(arquivoComConteudo('dist/reset.css', 500), 'dist/reset.css ausente ou pequeno demais');
exigir(arquivoComConteudo('dist/design-system.css', 1000), 'dist/design-system.css ausente ou pequeno demais');

if (arquivoComConteudo('dist/design-system.css', 1)) {
  const css = readFileSync(resolve(raiz, 'dist/design-system.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  for (const nome of keyframesOrfaos(css)) {
    falhas.push(`a animacao \`${nome}\` nao tem @keyframes no CSS publicado`);
  }

  for (const nome of variaveisSemDefinicao(css)) {
    falhas.push(`a variavel \`${nome}\` e usada no CSS publicado e nao e declarada nele`);
  }

  for (const seletor of seletoresDePagina(css)) {
    falhas.push(`o seletor \`${seletor}\` no CSS dos componentes alcanca a pagina do hospedeiro`);
  }
}

/** Cada `.module.css` do fonte, se nao vazio, vira `dist/styles/<Nome>.css`, e a base mais as folhas, sem os `@import`, somam a folha inteira. */
function folhasPorComponente() {
  const pasta = resolve(raiz, 'dist/styles');

  if (!existsSync(pasta)) {
    falhas.push('dist/styles ausente');

    return;
  }

  exigir(arquivoComConteudo('dist/styles/base.css', 1000), 'dist/styles/base.css ausente ou pequeno demais');

  const doFonte = [];
  const procurar = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const caminho = resolve(dir, entrada.name);

      if (entrada.isDirectory()) {
        procurar(caminho);
      } else if (entrada.name.endsWith('.module.css') && statSync(caminho).size > 0) {
        doFonte.push(basename(entrada.name, '.module.css'));
      }
    }
  };

  procurar(resolve(raiz, 'src'));

  const soma = [readFileSync(resolve(pasta, 'base.css'), 'utf8')];

  for (const nome of doFonte) {
    const caminho = resolve(pasta, `${nome}.css`);

    if (!existsSync(caminho)) {
      falhas.push(`dist/styles/${nome}.css ausente`);
      continue;
    }

    const css = readFileSync(caminho, 'utf8');

    for (const [, dependencia] of css.matchAll(/^@import '\.\/([\w-]+\.css)';/gm)) {
      exigir(existsSync(resolve(pasta, dependencia)), `dist/styles/${nome}.css importa ${dependencia}, que nao existe`);
    }

    soma.push(css.replace(/^@import [^\n]*\n/gm, ''));
  }

  const inteira = readFileSync(resolve(raiz, 'dist/design-system.css'), 'utf8');

  exigir(soma.join('').length === inteira.length, 'a base mais as folhas por componente nao somam a folha inteira (design-system.css)');
  exigir(readdirSync(pasta).length === doFonte.length + 1, 'dist/styles tem arquivo alem da base e de um por modulo de CSS do fonte');
}

folhasPorComponente();

const esm = await import('../dist/index.js').catch((erro) => {
  falhas.push(`a entrada ESM nao carregou: ${erro.message}`);

  return {};
});

let cjs = {};

try {
  cjs = require('../dist/index.cjs');
} catch (erro) {
  falhas.push(`a entrada CommonJS nao carregou: ${erro.message}`);
}

const naFonte = exportsDaFonte();
const noEsm = new Set(Object.keys(esm).filter((nome) => nome !== 'default'));
const noCjs = new Set(Object.keys(cjs).filter((nome) => nome !== 'default'));

exigir(noEsm.size > 0, 'a entrada ESM nao exportou nada');
exigir(noCjs.size > 0, 'a entrada CommonJS nao exportou nada');

for (const nome of naFonte) {
  exigir(noEsm.has(nome), `${nome} esta em src/index.ts e falta na entrada ESM`);
  exigir(noCjs.has(nome), `${nome} esta em src/index.ts e falta na entrada CommonJS`);
}

// A suite de icones e o subcaminho `./icons`: um componente por arquivo do bootstrap-icons, nas duas entradas.
const naSuite = new Set(
  [...readFileSync(resolve(raiz, 'src/components/icons/suite.tsx'), 'utf8').matchAll(/^export function (Icon\w+)/gm)].map(
    ([, nome]) => nome,
  ),
);
exigir(arquivoComConteudo('dist/types/icons.d.ts', 50), 'dist/types/icons.d.ts ausente ou vazio');

const iconesEsm = await import('../dist/icons.js').catch((erro) => {
  falhas.push(`a entrada ESM dos icones nao carregou: ${erro.message}`);

  return {};
});
let iconesCjs = {};

try {
  iconesCjs = require('../dist/icons.cjs');
} catch (erro) {
  falhas.push(`a entrada CommonJS dos icones nao carregou: ${erro.message}`);
}

exigir(naSuite.size > 0, 'a suite de icones esta vazia');

for (const nome of naSuite) {
  exigir(nome in iconesEsm, `${nome} esta na suite e falta na entrada ESM dos icones`);
  exigir(nome in iconesCjs, `${nome} esta na suite e falta na entrada CommonJS dos icones`);
}

// Cada icone da suite tem tambem o proprio modulo em `./icons/<Nome>`, com tipos, e ele traz o mesmo desenho.
const modulosEsm = await Promise.all(
  [...naSuite].map((nome) =>
    import(`../dist/icons/${nome}.js`).then(
      (modulo) => modulo[nome],
      (erro) => falhas.push(`o modulo ESM de ${nome} nao carregou: ${erro.message}`),
    ),
  ),
);

[...naSuite].forEach((nome, posicao) => {
  exigir(typeof modulosEsm[posicao] === 'function', `${nome} nao e exportado pelo proprio modulo ESM em dist/icons`);
  exigir(arquivoComConteudo(`dist/icons/${nome}.cjs`, 50), `dist/icons/${nome}.cjs ausente`);
  exigir(arquivoComConteudo(`dist/types/icons/${nome}.d.ts`, 50), `dist/types/icons/${nome}.d.ts ausente`);
});

try {
  const amostra = [...naSuite][0];

  exigir(typeof require(`../dist/icons/${amostra}.cjs`)[amostra] === 'function', `${amostra} nao e exportado pelo modulo CommonJS`);
} catch (erro) {
  falhas.push(`o modulo CommonJS de um icone nao carregou: ${erro.message}`);
}

if (falhas.length > 0) {
  console.error('Pacote reprovado:\n' + falhas.map((falha) => `  - ${falha}`).join('\n'));
  process.exit(1);
}

console.log(
  `Pacote aprovado: ${naFonte.size} exportacoes da fonte presentes nas duas entradas ` +
    `(ESM ${noEsm.size}, CommonJS ${noCjs.size}); ${naSuite.size} icones da suite nas duas entradas de ./icons e cada um em ./icons/<Nome>; ` +
    'no CSS, nenhuma animacao orfa, variavel sem declaracao ou seletor de pagina; folhas por componente somam a folha inteira.',
);
