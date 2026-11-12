import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

function folhas(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);

    return statSync(caminho).isDirectory() ? folhas(caminho) : caminho.endsWith('.css') ? [caminho] : [];
  });
}

const raiz = resolve(process.cwd(), 'src');
const todas = folhas(raiz).map((caminho) => [relative(raiz, caminho).split(sep).join('/'), readFileSync(caminho, 'utf8')] as const);
const ler = (caminho: string) => readFileSync(resolve(raiz, caminho), 'utf8');

describe('altura da janela', () => {
  it.each(todas)('%s não usa vh', (_nome, css) => {
    expect(css.match(/\d(?<![ds]vh)vh\b/g) ?? []).toEqual([]);
  });

  it('o Dialog e o filtro do DataGrid medem em dvh', () => {
    expect(ler('components/overlays/Dialog/Dialog.module.css')).toContain('max-height: calc(100dvh - 2 * var(--pl-space-4))');
    expect(ler('components/data-display/DataGrid/DataGrid.module.css')).toContain('max-height: 70dvh');
  });
});

describe('safe area', () => {
  it.each(todas)('%s: todo env() de safe area cai em 0px, e sem o inset nada muda', (_nome, css) => {
    const usos = css.match(/env\(safe-area-inset-\w+[^)]*\)/g) ?? [];

    expect(usos.filter((uso) => !uso.endsWith(', 0px)'))).toEqual([]);
  });

  it.each([
    ['components/navigation/AppShell/AppShell.module.css', 'safe-area-inset-top'],
    ['components/feedback/Toast/Toast.module.css', 'safe-area-inset-bottom'],
    ['components/overlays/Drawer/Drawer.module.css', 'safe-area-inset-bottom'],
  ])('%s respeita %s', (arquivo, inset) => {
    expect(ler(arquivo)).toContain(inset);
  });

  it('o Drawer pesa a safe area do lado em que se prende', () => {
    const css = ler('components/overlays/Drawer/Drawer.module.css');

    expect(css).toMatch(/\.right \.drawer \{\s*padding-right: env\(safe-area-inset-right, 0px\)/);
    expect(css).toMatch(/\.left \.drawer \{\s*padding-left: env\(safe-area-inset-left, 0px\)/);
  });

  it('a SaveBar usa os tokens, que o AppShell zera para o que está dentro dele', () => {
    const barra = ler('components/forms/SaveBar/SaveBar.module.css');
    const moldura = ler('components/navigation/AppShell/AppShell.module.css');

    expect(barra).toContain('top: var(--pl-safe-top, 0px)');
    expect(barra).toContain('bottom: var(--pl-safe-bottom, 0px)');
    expect(moldura).toMatch(/--pl-safe-top: 0px;[\s\S]*--pl-safe-bottom: 0px;/);
    expect(ler('tokens/semantic/shell.css')).toContain('--pl-safe-top: env(safe-area-inset-top, 0px)');
  });
});
