import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Acertos que o `vite build` e o `tsc` nao fazem sozinhos. Roda depois dos dois.
 */

const raiz = resolve(import.meta.dirname, '..');

// O reset e opcional, entao nao entra pelo ponto de entrada e nao vai parar no
// bundle dos componentes. Ele viaja como arquivo proprio.
copyFileSync(resolve(raiz, 'src/styles/reset.css'), resolve(raiz, 'dist/reset.css'));

// O `tsc` copia para a declaracao os imports de efeito colateral do ponto de
// entrada, inclusive os de CSS. Esses caminhos nao existem no pacote, e um
// consumidor com `noUncheckedSideEffectImports` reprova por causa deles.
const tipos = resolve(raiz, 'dist/types/index.d.ts');
const semCss = readFileSync(tipos, 'utf8').replace(/^import '[^']+\.css';\r?\n/gm, '');

writeFileSync(tipos, semCss);

copyFileSync(resolve(raiz, 'src/styles/folha.d.ts'), resolve(raiz, 'dist/folha.d.ts'));

/**
 * O `tsc` emite o caminho relativo como esta no codigo, sem extensao, e um
 * consumidor com `moduleResolution: node16` ou `nodenext` recusa cada um deles.
 * Acrescentar a extensao aqui evita reescrever duzentos imports no fonte por
 * uma exigencia de empacotamento.
 */
function comExtensao(arquivo, especificador) {
  const base = dirname(arquivo);

  if (existsSync(join(base, `${especificador}.d.ts`))) {
    return `${especificador}.js`;
  }

  if (existsSync(join(base, especificador, 'index.d.ts'))) {
    return `${especificador}/index.js`;
  }

  return undefined;
}

function declaracoes(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);

    if (entrada.isDirectory()) {
      return declaracoes(caminho);
    }

    return entrada.name.endsWith('.d.ts') ? [caminho] : [];
  });
}

let ajustados = 0;

for (const arquivo of declaracoes(resolve(raiz, 'dist/types'))) {
  const original = readFileSync(arquivo, 'utf8');
  const corrigido = original.replace(/(from\s+|import\s+)'(\.[^']*)'/g, (inteiro, prefixo, especificador) => {
    const destino = comExtensao(arquivo, especificador);

    return destino ? `${prefixo}'${destino}'` : inteiro;
  });

  if (corrigido !== original) {
    writeFileSync(arquivo, corrigido);
    ajustados += 1;
  }
}

console.log(
  `Pacote finalizado: reset copiado, folhas declaradas, ${ajustados} declaracoes com extensao explicita.`,
);
