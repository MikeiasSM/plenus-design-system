import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const lerTokens = (arquivo: string) => readFileSync(resolve(process.cwd(), 'src/tokens/semantic', arquivo), 'utf8');
const corCss = lerTokens('color.css');
const graficoCss = lerTokens('chart.css');
const codigoCss = lerTokens('code.css');

function declaracoes(css: string, seletor: string): Map<string, string> {
  const inicio = css.indexOf(`${seletor} {`);
  const fim = css.indexOf('}', inicio);
  const bloco = css.slice(inicio + seletor.length + 2, fim);

  return new Map([...bloco.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().replace(/\s+/g, ' ')]));
}

describe.each([
  ['color.css', corCss],
  ['chart.css', graficoCss],
  ['code.css', codigoCss],
])('tema escuro em %s', (_nome, css) => {
  const claro = declaracoes(css, '[data-theme="light"]');
  const escuro = declaracoes(css, '[data-theme="dark"]');
  const doSistema = declaracoes(css, ':root:not([data-theme])');

  it('so redeclara no escuro tokens que o claro declara', () => {
    expect(claro.size).toBeGreaterThan(0);
    expect(escuro.size).toBeGreaterThan(0);
    expect([...escuro.keys()].filter((token) => !claro.has(token))).toEqual([]);
  });

  it('muda o valor de ao menos um token de superficie ou texto', () => {
    const mudados = [...claro.keys()].filter((token) => claro.get(token) !== escuro.get(token));

    expect(mudados.length).toBeGreaterThan(0);
  });

  it('segue o sistema com os mesmos valores do escuro quando nao ha data-theme', () => {
    expect(doSistema).toEqual(escuro);
  });
});

describe('escopo do tema', () => {
  it('troca superficie e texto no escuro', () => {
    const claro = declaracoes(corCss, '[data-theme="light"]');
    const escuro = declaracoes(corCss, '[data-theme="dark"]');

    for (const token of ['--pl-color-background', '--pl-color-surface', '--pl-color-text', '--pl-color-border']) {
      expect(escuro.get(token)).toBeDefined();
      expect(escuro.get(token)).not.toBe(claro.get(token));
    }
  });

  it('acompanha o color-scheme em cada escopo', () => {
    expect(declaracoes(corCss, '[data-theme="light"]').size).toBeGreaterThan(0);
    expect(corCss).toMatch(/\[data-theme="light"\]\s*\{\s*color-scheme:\s*light;\s*\}/);
    expect(corCss).toMatch(/\[data-theme="dark"\]\s*\{\s*color-scheme:\s*dark;\s*\}/);
    expect(corCss).toMatch(/:root\s*\{\s*color-scheme:\s*light dark;\s*\}/);
  });

  it('escolhe a cor primaria por light-dark(), que segue o color-scheme do escopo', () => {
    expect(corCss).toMatch(/--pl-color-primary:\s*light-dark\(/);
  });
});
