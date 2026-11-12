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
    const dialogo = ler('components/overlays/Dialog/Dialog.module.css');
    expect(dialogo).toContain('max-height: calc(100dvh - max(var(--pl-space-4), var(--pl-safe-top)) - max(var(--pl-space-4), var(--pl-safe-bottom)))');
    expect(dialogo).toContain('max(var(--pl-space-4), var(--pl-safe-left))');
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
    ['components/navigation/Sidebar/Sidebar.module.css', 'safe-area-inset-left'],
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


function blocoDaMidia(css: string, consulta: string): string {
  const inicio = css.indexOf(`@media (${consulta}) {`);
  let nivel = 0;

  for (let i = css.indexOf('{', inicio); i < css.length; i++) {
    nivel += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0;

    if (nivel === 0) {
      return css.slice(inicio, i + 1);
    }
  }

  return '';
}

describe('toque: densidade e fonte dos campos', () => {
  const controle = ler('tokens/semantic/control.css');
  const toque = blocoDaMidia(controle, 'pointer: coarse');

  it('com o dedo, o pequeno e o medio sobem a 44px, e o grande segue em 56px', () => {
    expect(toque).toContain('--pl-control-height-sm: 44px');
    expect(toque).toContain('--pl-control-height-md: 44px');
    expect(toque).not.toContain('--pl-control-height-lg');
    expect(controle).toContain('--pl-control-height-lg: 56px');
    expect(controle).toMatch(/:root \{\s*--pl-control-height-sm: 32px;\s*--pl-control-height-md: 36px;/);
  });

  it('a fonte de campo no toque e de 16px, o minimo que evita o zoom de foco do iOS', () => {
    expect(controle).toContain('--pl-control-font-size-touch: 16px');
  });

  it.each([
    'components/forms/Field/Field.module.css',
    'components/forms/Textarea/Textarea.module.css',
    'components/forms/ComboBox/ComboBox.module.css',
    'components/forms/DatePicker/DatePicker.module.css',
    'components/forms/TimePicker/TimePicker.module.css',
    'components/forms/InputPassword/InputPassword.module.css',
    'components/data-display/List/List.module.css',
    'components/data-display/DataGrid/DataGrid.module.css',
  ])('%s: o campo de texto passa a 16px no toque', (arquivo) => {
    expect(blocoDaMidia(ler(arquivo), 'pointer: coarse')).toContain('font-size: var(--pl-control-font-size-touch)');
  });

  it('o computador não muda: a fonte de toque só é usada dentro da consulta', () => {
    for (const [, css] of todas) {
      const fora = css.replace(blocoDaMidia(css, 'pointer: coarse'), '');

      expect(fora).not.toContain('var(--pl-control-font-size-touch)');
    }
  });

  it('o botao grande e o botao so de icone acompanham a altura de toque', () => {
    expect(blocoDaMidia(ler('components/actions/Button/Button.module.css'), 'pointer: coarse')).toContain('48px');
    expect(blocoDaMidia(ler('components/actions/ButtonIcon/ButtonIcon.module.css'), 'pointer: coarse')).toContain('var(--pl-control-height-md)');
  });
});

describe('toque: area de 44px em rádio, caixa, chave e cor', () => {
  it.each([
    'components/forms/Checkbox/Checkbox.module.css',
    'components/forms/RadioGroup/RadioGroup.module.css',
  ])('%s estende a area da caixa por um pseudo-elemento de 44px', (arquivo) => {
    const toque = blocoDaMidia(ler(arquivo), 'pointer: coarse');

    expect(toque).toMatch(/\.input::after \{[^}]*width: 44px;[^}]*height: 44px;/);
    expect(toque).toContain('padding-block: calc((44px - var(--pl-type-body-line-height)) / 2)');
  });

  it('a chave leva o rótulo a 44px', () => {
    expect(blocoDaMidia(ler('components/forms/Switch/Switch.module.css'), 'pointer: coarse')).toContain('padding-block: calc((44px - var(--pl-type-body-line-height)) / 2)');
  });

  it('a amostra de cor estende a area a 44px e afasta as amostras para as areas não se sobreporem', () => {
    const toque = blocoDaMidia(ler('components/forms/ColorPicker/ColorPicker.module.css'), 'pointer: coarse');

    expect(toque).toMatch(/\.swatch::after \{[^}]*width: 44px;[^}]*height: 44px;/);
    expect(toque).toContain('calc(44px - var(--color-picker-size))');
  });

  it.each(['components/forms/RadioGroup/RadioGroup.module.css', 'components/forms/CheckboxGroup/CheckboxGroup.module.css'])('%s cola as linhas, que já medem 44px, e mantém o espaço entre as opções lado a lado', (arquivo) => {
    expect(blocoDaMidia(ler(arquivo), 'pointer: coarse')).toMatch(/\.options \{\s*row-gap: 0;/);
    expect(ler(arquivo)).toMatch(/\.horizontal \{[^}]*column-gap: var\(--pl-space-5\);/);
  });
});

function soAMidia(css: string, consulta: string): string {
  let resto = css;
  let dentro = '';

  for (let bloco = blocoDaMidia(resto, consulta); bloco; bloco = blocoDaMidia(resto, consulta)) {
    dentro += bloco;
    resto = resto.replace(bloco, '');
  }

  return dentro;
}

function semAMidia(css: string, consulta: string): string {
  let resto = css;

  for (let bloco = blocoDaMidia(resto, consulta); bloco; bloco = blocoDaMidia(resto, consulta)) {
    resto = resto.replace(bloco, '');
  }

  return resto;
}

describe('hover e pressão', () => {
  it.each(todas)('%s: todo :hover vale só dentro de @media (hover: hover)', (_nome, css) => {
    expect(semAMidia(css, 'hover: hover')).not.toContain(':hover');
  });

  it('o hover de ao menos uma folha segue valendo no computador, dentro da consulta', () => {
    expect(soAMidia(ler('components/actions/Button/Button.module.css'), 'hover: hover')).toContain(':hover');
  });

  it.each([
    'components/actions/Button/Button.module.css',
    'components/actions/ButtonTile/ButtonTile.module.css',
    'components/overlays/Menu/Menu.module.css',
    'components/data-display/List/List.module.css',
    'components/navigation/Tabs/Tabs.module.css',
    'components/navigation/Pagination/Pagination.module.css',
    'components/forms/SegmentedControl/SegmentedControl.module.css',
    'components/data-display/CardMetric/CardMetric.module.css',
    'components/data-display/DataGrid/DataGrid.module.css',
    'components/data-display/SortableList/SortableList.module.css',
    'components/navigation/Sidebar/Sidebar.module.css',
    'components/navigation/Sidebar/SidebarPanel.module.css',
  ])('%s: tem :active, que não depende de hover: hover', (arquivo) => {
    const css = ler(arquivo);

    expect(semAMidia(css, 'hover: hover')).toContain(':active');
    expect(soAMidia(css, 'hover: hover')).not.toContain(':active');
  });

  it('o botão primário pressionado usa --pl-color-primary-active, um passo além do hover', () => {
    const css = ler('components/actions/Button/Button.module.css');

    expect(css).toMatch(/\.primary:not\(:disabled\):not\(\[aria-disabled='true'\]\):active \{\s*background: var\(--pl-color-primary-active\);/);
    expect(soAMidia(css, 'hover: hover')).toContain('--pl-color-primary-hover');
  });

  it('o que só aparece no hover aparece sempre onde não há hover', () => {
    expect(blocoDaMidia(ler('components/data-display/DataGrid/DataGrid.module.css'), 'hover: none')).toContain('.headerActions');
    expect(blocoDaMidia(ler('components/charts/ChartTimeline/ChartTimeline.module.css'), 'hover: none')).toContain('.axisOnHover');
    expect(blocoDaMidia(ler('components/charts/ChartGauge/ChartGauge.module.css'), 'hover: none')).toContain('.segmentLabelOnHover');
  });

  it('o laudo de contraste mede o texto sobre o fundo pressionado', () => {
    const laudo = readFileSync(resolve(process.cwd(), 'scripts/check-contraste.mjs'), 'utf8');

    expect(laudo).toContain("'--pl-color-on-primary', '--pl-color-primary-active', TEXTO_MINIMO");
    expect(laudo).toContain("'--pl-color-text', '--pl-color-border-strong', TEXTO_MINIMO");
    expect(laudo).toContain("'--pl-color-primary-active', '--pl-color-surface-muted', TEXTO_MINIMO");
  });

  it('o texto terciário não fica sobre o fundo pressionado nem sobre o container', () => {
    const lista = ler('components/data-display/SortableList/SortableList.module.css');
    const conta = ler('components/navigation/Sidebar/SidebarPanel.module.css');
    const regra = (css: string, seletor: string) => {
      const inicio = css.indexOf(`${seletor} {`);

      expect(inicio).toBeGreaterThanOrEqual(0);
      return css.slice(inicio, css.indexOf('}', inicio));
    };

    expect(regra(lista, '.row:active .excerpt')).toContain('color: var(--pl-color-text-secondary);');
    expect(regra(lista, '.selected .excerpt')).toContain('color: var(--pl-color-text-secondary);');
    expect(regra(lista, '.selected:active .excerpt')).toContain('color: inherit;');
    expect(lista.indexOf('.selected:active .excerpt {')).toBeGreaterThan(lista.indexOf('.row:active .excerpt {'));
    expect(regra(conta, ".accountTrigger[aria-expanded='true'] .identity span")).toContain('color: var(--pl-color-text-secondary);');
    expect(regra(soAMidia(conta, 'hover: hover'), '.accountTrigger:hover .identity span')).toContain('color: var(--pl-color-text-secondary);');
    expect(regra(conta, '.accountTrigger:active .identity span')).toContain('color: inherit;');
    expect(conta.indexOf('.accountTrigger:active .identity span {')).toBeGreaterThan(conta.indexOf('.accountTrigger:hover .identity span {'));
  });

  it('o laudo de contraste mede o texto de apoio pressionado e sobre o container', () => {
    const laudo = readFileSync(resolve(process.cwd(), 'scripts/check-contraste.mjs'), 'utf8');

    expect(laudo).toContain("['--pl-color-text-secondary', '--pl-color-surface-muted', TEXTO_MINIMO, 'resumo da linha pressionada']");
    expect(laudo).toContain("['--pl-color-on-primary-container', '--pl-color-primary-selected', TEXTO_MINIMO, 'resumo da linha selecionada pressionada']");
    expect(laudo).toContain("['--pl-color-text-secondary', '--pl-color-primary-container', TEXTO_MINIMO, 'texto de apoio no container']");
    expect(laudo).toContain("['--pl-color-text', '--pl-color-primary-selected', TEXTO_MINIMO, 'identidade da conta pressionada']");
  });
});
