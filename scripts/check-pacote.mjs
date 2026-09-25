import { createRequire } from 'node:module';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

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

exigir(arquivoComConteudo('dist/types/index.d.ts', 100), 'dist/types/index.d.ts ausente ou vazio');
exigir(arquivoComConteudo('dist/design-system.css', 1000), 'dist/design-system.css ausente ou pequeno demais');

const esm = await import('../dist/plenus-design-system.es.js').catch((erro) => {
  falhas.push(`a entrada ESM nao carregou: ${erro.message}`);

  return {};
});

let cjs = {};

try {
  cjs = require('../dist/plenus-design-system.cjs');
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

if (falhas.length > 0) {
  console.error('Pacote reprovado:\n' + falhas.map((falha) => `  - ${falha}`).join('\n'));
  process.exit(1);
}

console.log(
  `Pacote aprovado: ${naFonte.size} exportacoes da fonte presentes nas duas entradas ` +
    `(ESM ${noEsm.size}, CommonJS ${noCjs.size}).`,
);
