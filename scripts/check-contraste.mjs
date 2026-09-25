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
  'src/tokens/semantic/color.css',
  'src/tokens/semantic/chart.css',
  'src/styles/tokens.css',
];

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
  ['--pl-color-primary', '--pl-color-background', CONTROLE_MINIMO, 'contorno do botao'],
  ['--pl-color-border-strong', '--pl-color-surface', CONTROLE_MINIMO, 'contorno do campo'],
  ['--pl-chart-series-1', '--pl-color-surface', CONTROLE_MINIMO, 'serie 1 no desenho'],
  ['--pl-chart-series-2', '--pl-color-surface', CONTROLE_MINIMO, 'serie 2 no desenho'],
  ['--pl-chart-series-3', '--pl-color-surface', CONTROLE_MINIMO, 'serie 3 no desenho'],
  ['--pl-chart-series-4', '--pl-color-surface', CONTROLE_MINIMO, 'serie 4 no desenho'],
  ['--pl-chart-series-5', '--pl-color-surface', CONTROLE_MINIMO, 'serie 5 no desenho'],
  ['--pl-chart-series-6', '--pl-color-surface', CONTROLE_MINIMO, 'serie 6 no desenho'],
];

/**
 * Reprovacoes aceitas por decisao visual do mantenedor, registradas em
 * `PROGRESS.md`. Uma reprovacao fora desta lista derruba o script.
 *
 * O halo de foco em `primary-container` nao entra aqui: ele e decorativo, e o
 * sinal acessivel do foco e a troca da borda, nao o halo.
 */
const ACEITAS = new Set([
  'claro|--pl-color-on-primary|--pl-color-primary',
  'escuro|--pl-color-on-primary|--pl-color-primary',
  'claro|--pl-color-primary|--pl-color-background',
  'claro|--pl-color-border-strong|--pl-color-surface',
  'escuro|--pl-color-border-strong|--pl-color-surface',
]);

function declaracoesPorTema() {
  const claro = new Map();
  const escuro = new Map();

  for (const arquivo of ARQUIVOS) {
    const css = readFileSync(resolve(raiz, arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

    for (const bloco of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const seletor = bloco[1].trim();

      if (seletor.startsWith('@')) {
        continue;
      }

      const alvos = seletor.includes('data-theme') ? [escuro] : [claro, escuro];

      for (const declaracao of bloco[2].matchAll(/(--pl-[\w-]+)\s*:\s*([^;]+);/g)) {
        for (const alvo of alvos) {
          alvo.set(declaracao[1], declaracao[2].trim());
        }
      }
    }
  }

  return { claro, escuro };
}

/** Segue a cadeia de `var()` ate chegar a uma cor literal. */
function resolver(tokens, nome, visitados = new Set()) {
  const valor = tokens.get(nome);

  if (valor === undefined || visitados.has(nome)) {
    return undefined;
  }

  visitados.add(nome);

  const referencia = valor.match(/var\(\s*(--[\w-]+)/);

  return referencia ? resolver(tokens, referencia[1], visitados) : valor;
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

const temas = declaracoesPorTema();
const naoMedidos = [];
const reprovados = [];
const linhas = [];

for (const [nomeDoTema, tokens] of [
  ['claro', temas.claro],
  ['escuro', temas.escuro],
]) {
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
      `  ${nomeDoTema.padEnd(7)} ${papel.padEnd(22)} ${medida.toFixed(2).padStart(6)}:1  ` +
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
