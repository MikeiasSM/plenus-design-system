import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

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

// A suite de icones e gerada: o mapa dela nao leva a fonte alguma que se depure, e somaria uns 3 MB ao pacote.
for (const formato of ['js', 'cjs']) {
  const suite = resolve(raiz, `dist/components/icons/suite.${formato}`);

  rmSync(`${suite}.map`, { force: true });
  writeFileSync(suite, readFileSync(suite, 'utf8').replace(/\r?\n\/\/# sourceMappingURL=[^\n]*\s*$/, '\n'));
}

// Os modulos por icone (`dist/icons/<Nome>`) tambem nao levam mapa, e ganham a declaracao que o `tsc` nao emite,
// porque eles nao existem no disco: cada uma repete a assinatura do icone na declaracao da suite.
const nomesDosIcones = [
  ...readFileSync(resolve(raiz, 'dist/types/components/icons/suite.d.ts'), 'utf8').matchAll(/^export declare function (Icon\w+)/gm),
].map(([, nome]) => nome);

mkdirSync(resolve(raiz, 'dist/types/icons'), { recursive: true });

for (const nome of nomesDosIcones) {
  for (const formato of ['js', 'cjs']) {
    const modulo = resolve(raiz, `dist/icons/${nome}.${formato}`);

    rmSync(`${modulo}.map`, { force: true });
    writeFileSync(modulo, readFileSync(modulo, 'utf8').replace(/\r?\n\/\/# sourceMappingURL=[^\n]*\s*$/, '\n'));
  }

  writeFileSync(
    resolve(raiz, `dist/types/icons/${nome}.d.ts`),
    `import { type IconProps } from '../components/icons/Icon.js';\nexport declare function ${nome}(props: IconProps): import("react").JSX.Element;\n`,
  );
}

/**
 * O build deixa um `.css` por modulo (`cssCodeSplit`), na pasta do componente. Aqui eles viram as folhas do pacote:
 * `styles/base.css` (tokens e base de pagina), uma `styles/<Nome>.css` por modulo e a `design-system.css` inteira,
 * que e a base seguida dos modulos na ordem de execucao do ponto de entrada, a mesma que o empacotador usaria.
 * Cada folha de componente importa antes as folhas de que ele depende, para que `Select.css` traga o `Popover.css`.
 */
const saida = resolve(raiz, 'dist');
const pastaDasFolhas = resolve(saida, 'styles');

function arquivosJs(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);

    if (entrada.isDirectory()) {
      return arquivosJs(caminho);
    }

    return entrada.name.endsWith('.js') ? [caminho] : [];
  });
}

function importsRelativos(arquivo) {
  return [...readFileSync(arquivo, 'utf8').matchAll(/^import[^'"]*['"](\.[^'"]+\.js)['"]/gm)].map(([, destino]) =>
    resolve(dirname(arquivo), destino),
  );
}

/** Modulos de CSS alcancados a partir de um modulo JS, dependencias primeiro. */
function modulosDeCssAlcancados(inicio, visitados = new Set(), ordem = []) {
  if (visitados.has(inicio)) {
    return ordem;
  }

  visitados.add(inicio);

  for (const destino of importsRelativos(inicio)) {
    if (destino.endsWith('.module.css.js')) {
      if (!ordem.includes(destino)) {
        ordem.push(destino);
      }
    } else {
      modulosDeCssAlcancados(destino, visitados, ordem);
    }
  }

  return ordem;
}

const nomeDaFolha = (moduloCss) => basename(moduloCss, '.module.css.js');
const lerCss = (moduloCss) => readFileSync(moduloCss.replace(/\.js$/, ''), 'utf8').trim();

const modulosJs = arquivosJs(resolve(saida, 'components'));

// Um componente pode usar o CSS de outro (o DatePicker usa o do Select): as dependencias de uma folha sao as do
// modulo que leva o nome dela, e so na falta dele as de quem a importa.
function donosDe(moduloCss) {
  const proprio = moduloCss.replace(/\.module\.css\.js$/, '.js');

  if (existsSync(proprio)) {
    return [proprio];
  }

  return modulosJs.filter((modulo) => importsRelativos(modulo).includes(moduloCss));
}

const modulosEmOrdem = modulosDeCssAlcancados(resolve(saida, 'index.js'));
const base = ['tokens', 'base'].map((nome) => readFileSync(resolve(pastaDasFolhas, `${nome}.css`), 'utf8').trim()).join('');

mkdirSync(pastaDasFolhas, { recursive: true });
writeFileSync(resolve(pastaDasFolhas, 'base.css'), base);
rmSync(resolve(pastaDasFolhas, 'tokens.css'));

for (const modulo of modulosEmOrdem) {
  const donos = donosDe(modulo);
  const dependencias = new Set(donos.flatMap((dono) => modulosDeCssAlcancados(dono)));
  const imports = [...dependencias].filter((outro) => outro !== modulo).map((outro) => `@import './${nomeDaFolha(outro)}.css';\n`);

  writeFileSync(resolve(pastaDasFolhas, `${nomeDaFolha(modulo)}.css`), imports.join('') + lerCss(modulo));
}

writeFileSync(resolve(saida, 'design-system.css'), base + modulosEmOrdem.map(lerCss).join(''));

for (const modulo of modulosEmOrdem) {
  rmSync(modulo.replace(/\.js$/, ''));
}

console.log(
  `Pacote finalizado: reset copiado, folhas declaradas, ${modulosEmOrdem.length} folhas de componente, ${ajustados} declaracoes com extensao explicita, suite de icones sem mapa, ${nomesDosIcones.length} modulos por icone.`,
);
