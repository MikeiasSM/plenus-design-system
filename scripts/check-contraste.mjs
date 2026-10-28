import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Laudo de contraste dos tokens, nos dois temas. `TOKENS-REFERENCE-COLORS.md`
 * exige a validacao antes de publicar um tema ou expor os tokens como API
 * publica, e ela nao pode ser feita a olho.
 *
 * O script le os arquivos na ordem da cascata, resolve as cadeias de `var()` e
 * mede. Falha em qualquer reprovacao que nao esteja declarada abaixo.
 */

const raiz = resolve(import.meta.dirname, '..');

// A ordem e a mesma de `src/styles/tokens.css`: os `@import` primeiro, o bloco
// legado do proprio arquivo por ultimo. E ele quem vence onde redeclara.
const ARQUIVOS = [
  'src/tokens/primitive/brand.css',
  'src/tokens/primitive/neutral.css',
  'src/tokens/primitive/status.css',
  'src/tokens/semantic/palette.css',
  'src/tokens/semantic/color.css',
  'src/tokens/semantic/chart.css',
  'src/tokens/semantic/code.css',
  'src/tokens/semantic/control.css',
  'src/styles/tokens.css',
];

// O laranja e a paleta padrao; as demais so valem no escopo de `data-palette`.
const PALETAS = ['orange', 'blue', 'purple'];

const TEXTO_MINIMO = 4.5;
const CONTROLE_MINIMO = 3;

/**
 * Pares medidos. Os papeis saem da lista de `TOKENS-REFERENCE-COLORS.md`:
 * texto, texto sobre primary, controles, bordas que identificam controle e
 * mensagens de estado.
 */
const PARES = [
  ['--pl-color-text', '--pl-color-background', TEXTO_MINIMO, 'texto na pagina'],
  ['--pl-color-text', '--pl-color-surface', TEXTO_MINIMO, 'texto no cartao'],
  ['--pl-color-text-secondary', '--pl-color-surface', TEXTO_MINIMO, 'texto secundario'],
  ['--pl-color-text-tertiary', '--pl-color-surface', TEXTO_MINIMO, 'texto terciario'],
  ['--pl-color-on-primary', '--pl-color-primary', TEXTO_MINIMO, 'texto sobre primary'],
  ['--pl-color-on-primary-container', '--pl-color-primary-container', TEXTO_MINIMO, 'texto no container'],
  ['--pl-color-on-ink', '--pl-color-ink', TEXTO_MINIMO, 'texto sobre tinta'],
  ['--pl-color-on-success-container', '--pl-color-success-container', TEXTO_MINIMO, 'mensagem de sucesso'],
  ['--pl-color-on-warning-container', '--pl-color-warning-container', TEXTO_MINIMO, 'mensagem de atencao'],
  ['--pl-color-on-danger-container', '--pl-color-danger-container', TEXTO_MINIMO, 'mensagem de perigo'],
  ['--pl-color-on-info-container', '--pl-color-info-container', TEXTO_MINIMO, 'mensagem informativa'],
  ['--pl-color-danger-text', '--pl-color-surface', TEXTO_MINIMO, 'erro sob o campo'],
  ['--pl-color-primary', '--pl-color-background', CONTROLE_MINIMO, 'contorno do botao'],
  ['--pl-color-primary-strong', '--pl-color-surface', TEXTO_MINIMO, 'traco primario'],
  ['--pl-color-primary-strong', '--pl-color-background', TEXTO_MINIMO, 'traco na pagina'],
  ['--pl-color-border-strong', '--pl-color-surface', CONTROLE_MINIMO, 'contorno do campo'],
  ['--pl-chart-series-1', '--pl-color-surface', CONTROLE_MINIMO, 'serie 1 no desenho'],
  ['--pl-chart-series-2', '--pl-color-surface', CONTROLE_MINIMO, 'serie 2 no desenho'],
  ['--pl-chart-series-3', '--pl-color-surface', CONTROLE_MINIMO, 'serie 3 no desenho'],
  ['--pl-chart-series-4', '--pl-color-surface', CONTROLE_MINIMO, 'serie 4 no desenho'],
  ['--pl-chart-series-5', '--pl-color-surface', CONTROLE_MINIMO, 'serie 5 no desenho'],
  ['--pl-chart-series-6', '--pl-color-surface', CONTROLE_MINIMO, 'serie 6 no desenho'],
  ...['series-1', 'series-2', 'series-3', 'series-4', 'series-5', 'series-6', 'positive', 'negative', 'warning', 'neutral'].map(
    (cor) => [`--pl-chart-on-${cor}`, `--pl-chart-${cor}`, TEXTO_MINIMO, `texto sobre ${cor}`],
  ),
  ...['keyword', 'string', 'number', 'comment', 'annotation', 'function', 'property', 'tag', 'attribute'].flatMap((papel) => [
    [`--pl-code-${papel}`, '--pl-color-surface-subtle', TEXTO_MINIMO, `codigo: ${papel}`],
    [`--pl-code-${papel}`, '--pl-color-warning-container', TEXTO_MINIMO, `codigo: ${papel} na linha destacada`],
  ]),
];

/**
 * Reprovacoes aceitas por decisao visual do mantenedor, registradas em
 * `PROGRESS.md`. Uma reprovacao fora desta lista derruba o script.
 *
 * O halo de foco em `primary-container` nao entra aqui: ele e decorativo, e o
 * sinal acessivel do foco e a troca da borda, nao o halo.
 */
const ACEITAS = new Set([
  'orange claro|--pl-color-on-primary|--pl-color-primary',
  'orange claro|--pl-color-primary|--pl-color-background',
  ...PALETAS.flatMap((paleta) => [
    `${paleta} claro|--pl-color-border-strong|--pl-color-surface`,
    `${paleta} escuro|--pl-color-border-strong|--pl-color-surface`,
  ]),
]);

function declaracoesPorTema(paleta) {
  const claro = new Map();
  const escuro = new Map();

  for (const arquivo of ARQUIVOS) {
    // Sem os `@import`: juntos do primeiro seletor, eles faziam o bloco inteiro ser descartado como regra `@`.
    const css = readFileSync(resolve(raiz, arquivo), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/@import[^;]+;/g, '');

    for (const bloco of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const seletor = bloco[1].trim();

      if (seletor.startsWith('@')) {
        continue;
      }

      const partes = seletor.split(',').map((parte) => parte.trim());
      const daPaleta = partes.some((parte) => parte === `[data-palette='${paleta}']`);
      const geral = partes.some((parte) => !/^\[data-palette='\w+'\]$/.test(parte));

      if (!geral && !daPaleta) {
        continue;
      }

      // Uma lista com `:root` puro vale nos dois temas; so a que e toda escura vale so no escuro.
      const alvos = partes.every((parte) => parte.includes('data-theme')) ? [escuro] : [claro, escuro];

      for (const declaracao of bloco[2].matchAll(/(--pl-[\w-]+)\s*:\s*([^;]+);/g)) {
        for (const alvo of alvos) {
          alvo.set(declaracao[1], declaracao[2].trim());
        }
      }
    }
  }

  return { claro, escuro };
}

/** Segue a cadeia de `var()`, com o valor reserva, ate chegar a uma cor literal; mistura `color-mix` em oklab. */
function resolver(tokens, nome, visitados = new Set()) {
  const valor = tokens.get(nome);

  if (valor === undefined || visitados.has(nome)) {
    return undefined;
  }

  return resolverValor(tokens, valor, new Set([...visitados, nome]));
}

function resolverValor(tokens, valor, visitados) {
  const mistura = valor.match(/^color-mix\(in oklab,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+)\)$/);

  if (mistura) {
    const a = resolverValor(tokens, mistura[1], visitados);
    const b = resolverValor(tokens, mistura[3], visitados);

    return a && b ? misturarOklab(a, b, Number(mistura[2]) / 100) : undefined;
  }

  const referencia = valor.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);

  if (!referencia) {
    return valor;
  }

  return resolver(tokens, referencia[1], visitados) ?? (referencia[2] ? resolverValor(tokens, referencia[2], visitados) : undefined);
}

function paraOklab(hex) {
  const [r, g, b] = [0, 2, 4].map((inicio) => canalLinear(parseInt(hex.replace('#', '').slice(inicio, inicio + 2), 16)));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function deOklab([L, A, B]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const canais = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));

  return `#${canais.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('')}`;
}

function misturarOklab(a, b, parte) {
  const [x, y] = [paraOklab(a), paraOklab(b)];

  return deOklab(x.map((valor, indice) => valor * parte + y[indice] * (1 - parte)));
}

function canalLinear(valor) {
  const normalizado = valor / 255;

  return normalizado <= 0.04045 ? normalizado / 12.92 : ((normalizado + 0.055) / 1.055) ** 2.4;
}

function luminancia(cor) {
  const hex = cor.trim().replace('#', '');

  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return undefined;
  }

  const [r, g, b] = [0, 2, 4].map((inicio) => canalLinear(parseInt(hex.slice(inicio, inicio + 2), 16)));

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(frente, fundo) {
  const a = luminancia(frente);
  const b = luminancia(fundo);

  if (a === undefined || b === undefined) {
    return undefined;
  }

  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const naoMedidos = [];
const reprovados = [];
const linhas = [];

for (const [nomeDoTema, tokens] of PALETAS.flatMap((paleta) => {
  const temas = declaracoesPorTema(paleta);

  return [
    [`${paleta} claro`, temas.claro],
    [`${paleta} escuro`, temas.escuro],
  ];
})) {
  for (const [frente, fundo, minimo, papel] of PARES) {
    const corFrente = resolver(tokens, frente);
    const corFundo = resolver(tokens, fundo);
    const medida = corFrente && corFundo ? contraste(corFrente, corFundo) : undefined;

    if (medida === undefined) {
      naoMedidos.push(`${nomeDoTema}: ${papel} (${frente} sobre ${fundo})`);
      continue;
    }

    const chave = `${nomeDoTema}|${frente}|${fundo}`;
    const passa = medida >= minimo;
    const aceita = ACEITAS.has(chave);

    linhas.push(
      `  ${nomeDoTema.padEnd(14)} ${papel.padEnd(22)} ${medida.toFixed(2).padStart(6)}:1  ` +
        `minimo ${minimo}  ${passa ? 'ok' : aceita ? 'excecao aceita' : 'REPROVADO'}`,
    );

    if (!passa && !aceita) {
      reprovados.push(`${papel} no tema ${nomeDoTema}: ${medida.toFixed(2)}:1, minimo ${minimo}`);
    }
  }
}

console.log('Laudo de contraste dos tokens\n');
console.log(linhas.join('\n'));

if (naoMedidos.length > 0) {
  console.log('\nNao medidos, por nao resolverem em cor literal:');
  console.log(naoMedidos.map((item) => `  - ${item}`).join('\n'));
}

if (reprovados.length > 0) {
  console.error('\nReprovacoes nao declaradas:');
  console.error(reprovados.map((item) => `  - ${item}`).join('\n'));
  console.error('\nCorrija o token ou registre a excecao em PROGRESS.md e neste script.');
  process.exit(1);
}

console.log('\nNenhuma reprovacao alem das declaradas.');
