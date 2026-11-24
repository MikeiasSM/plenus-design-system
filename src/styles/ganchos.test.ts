import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { regrasDaFolha } from '../test/folha';

const BORDA_DA_FOLHA = 'var(--pl-sheet-border, 1px solid var(--pl-color-border))';
const BORDA_DA_FOLHA_DA_CASCA = 'var(--pl-sheet-border, 1px solid var(--pl-shell-border, var(--pl-color-border)))';
const RAIO = 'var(--pl-sheet-radius, var(--pl-radius-md))';
const LINHA_DA_CASCA = '1px solid var(--pl-shell-border, var(--pl-color-border))';

/** Folha, seletor e o que cada uma lê dos ganchos, com o valor de antes como padrão. */
const FOLHAS = [
  ['src/components/data-display/Card/Card.module.css', '.card', BORDA_DA_FOLHA, 'var(--pl-sheet-shadow, var(--pl-sh-1))'],
  ['src/components/data-display/DataGrid/DataGrid.module.css', '.dataGrid', BORDA_DA_FOLHA, 'var(--pl-sheet-shadow, none)'],
  ['src/components/navigation/AppShell/AppShell.module.css', '.page', BORDA_DA_FOLHA_DA_CASCA, 'var(--pl-sheet-shadow, var(--pl-sh-1))'],
  ['src/components/navigation/Sidebar/Sidebar.module.css', '.rail', BORDA_DA_FOLHA_DA_CASCA, 'var(--pl-sheet-shadow, var(--pl-sh-1))'],
] as const;

describe('ganchos de aparência das folhas e da casca', () => {
  it.each(FOLHAS)('%s lê borda, raio e sombra da folha com o valor padrão', (folha, seletor, borda, sombra) => {
    const regra = regrasDaFolha(folha).get(seletor);

    expect(regra?.border).toBe(borda);
    expect(regra?.['border-radius']).toBe(RAIO);
    expect(regra?.['box-shadow']).toBe(sombra);
  });

  it('a linha da barra da página e a do PageHeader leem a borda da casca', () => {
    expect(regrasDaFolha('src/components/navigation/AppShell/AppShell.module.css').get('.pageBar')?.['border-bottom']).toBe(LINHA_DA_CASCA);
    expect(regrasDaFolha('src/components/navigation/PageHeader/PageHeader.module.css').get('.header')?.['border-bottom']).toBe(LINHA_DA_CASCA);
  });

  it('nenhuma folha declara os ganchos: o produto os define em qualquer ancestral', () => {
    const arquivos = [...FOLHAS.map(([folha]) => folha), 'src/components/navigation/PageHeader/PageHeader.module.css', 'src/styles/tokens.css'];

    for (const arquivo of arquivos) {
      expect(readFileSync(resolve(process.cwd(), arquivo), 'utf8')).not.toMatch(/--pl-(sheet-[a-z]+|shell-border)\s*:/);
    }
  });
});
