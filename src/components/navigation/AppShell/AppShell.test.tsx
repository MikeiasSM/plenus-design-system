import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { Sidebar } from '../Sidebar';
import { AppShell, type AppShellProps } from './AppShell';

function stubViewport(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: narrow, addEventListener: () => {}, removeEventListener: () => {} }));
}

function Example(props: AppShellProps) {
  return (
    <AppShell {...props}>
      <Sidebar>
        <Sidebar.Rail>
          <Sidebar.RailItem current href="/vendas" icon="V" label="Vendas" />
        </Sidebar.Rail>
        <Sidebar.Panel brand="Gestor" label="Vendas">
          <Sidebar.Item current href="/pedidos" label="Pedidos" />
        </Sidebar.Panel>
      </Sidebar>
      <AppShell.Page>
        <AppShell.PageBar>Pedidos</AppShell.PageBar>
        <AppShell.PageBody>Conteúdo</AppShell.PageBody>
      </AppShell.Page>
    </AppShell>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('AppShell', () => {
  it('monta a página com a barra e o corpo', () => {
    render(<Example />);

    const page = screen.getByRole('main');
    expect(within(page).getByText('Pedidos')).toBeInTheDocument();
    expect(within(page).getByText('Conteúdo')).toBeInTheDocument();
  });

  describe('barra da página', () => {
    it('recolhe e reabre o submenu, devolvendo o foco ao botão que ocupa o lugar do que sumiu', () => {
      const onOpenChange = vi.fn();
      render(<Example onOpenChange={onOpenChange} />);
      const submenu = document.getElementById(screen.getByRole('button', { name: 'Recolher submenu' }).getAttribute('aria-controls')!)!;
      expect(submenu).not.toHaveAttribute('inert');
      expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Recolher submenu' }));

      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(submenu).toHaveAttribute('inert');
      const open = screen.getByRole('button', { name: 'Abrir submenu' });
      expect(open).toHaveAttribute('aria-expanded', 'false');
      expect(open).toHaveFocus();

      fireEvent.click(open);

      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(submenu).not.toHaveAttribute('inert');
      expect(screen.getByRole('button', { name: 'Recolher submenu' })).toHaveFocus();
    });

    it('aceita o estado controlado', () => {
      const { rerender } = render(<Example open={false} />);
      expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Abrir submenu' }));
      expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();

      rerender(<Example open />);
      expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
    });

    it('no celular, traz o botão do menu e não o de abrir o submenu', () => {
      stubViewport(true);
      render(<Example />);

      expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
    });
  });

  it('aceita os nomes antigos da navegação, obsoletos, com o mesmo resultado', () => {
    render(
      <AppShell>
        <AppShell.Navigation>
          <AppShell.Rail>
            <AppShell.RailItem current href="/vendas" icon="V" label="Vendas" />
          </AppShell.Rail>
          <AppShell.Panel label="Vendas">
            <AppShell.PanelGroup label="Operação">
              <AppShell.PanelItem current href="/pedidos" label="Pedidos" />
            </AppShell.PanelGroup>
          </AppShell.Panel>
        </AppShell.Navigation>
      </AppShell>,
    );

    expect(within(screen.getByRole('navigation', { name: 'Módulos' })).getByRole('link', { name: 'Vendas' })).toHaveAttribute('aria-current', 'page');
    const submenu = screen.getByRole('navigation', { name: 'Vendas' });
    expect(within(submenu).getByText('Operação')).toBeInTheDocument();
    expect(within(submenu).getByRole('link', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'page');
  });

  describe('rodapé da página', () => {
    it('fica depois do corpo, fora dele', () => {
      render(
        <AppShell.Page>
          <AppShell.PageBody>Conteúdo</AppShell.PageBody>
          <AppShell.PageFooter>Ações</AppShell.PageFooter>
        </AppShell.Page>,
      );

      const footer = screen.getByText('Ações').closest('div')!.parentElement!;
      const body = screen.getByText('Conteúdo');
      expect(body.contains(footer)).toBe(false);
      expect(body.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('mantém a região de status mesmo sem situação e mostra a situação quando dada', () => {
      const { rerender } = render(<AppShell.PageFooter />);
      expect(screen.getByRole('status')).toBeEmptyDOMElement();

      rerender(<AppShell.PageFooter status="Rascunho salvo" />);
      expect(screen.getByRole('status')).toHaveTextContent('Rascunho salvo');
    });

    it('renderiza as ações e repassa props, className e ref ao rodapé', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <AppShell.PageFooter className="extra" data-testid="rodape" ref={ref}>
          <button type="button">Salvar</button>
        </AppShell.PageFooter>,
      );

      const footer = screen.getByTestId('rodape');
      expect(within(footer).getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
      expect(footer).toHaveClass('extra');
      expect(ref.current).toBe(footer);
    });
  });
});

describe('altura da moldura', () => {
  it('ocupa a janela por padrão e aceita a altura de uma caixa por --pl-shell-height', () => {
    const moldura = regrasDaFolha('src/components/navigation/AppShell/AppShell.module.css').get('.appShell');

    expect(moldura?.height).toBe('var(--pl-shell-height, 100dvh)');
  });
});

const FOLHA = 'src/components/navigation/AppShell/AppShell.module.css';

/** As regras de dentro do `@media print` da folha, por seletor. */
function regrasDeImpressao() {
  const folha = readFileSync(resolve(process.cwd(), FOLHA), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const inicio = folha.indexOf('@media print {');
  expect(inicio).toBeGreaterThan(-1);

  let fim = folha.indexOf('{', inicio) + 1;
  for (let nivel = 1; nivel > 0; fim += 1) {
    nivel += folha[fim] === '{' ? 1 : folha[fim] === '}' ? -1 : 0;
  }

  const regras = new Map<string, Record<string, string>>();
  for (const [, seletor, corpo] of folha.slice(folha.indexOf('{', inicio) + 1, fim - 1).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const declaracoes = Object.fromEntries(
      corpo
        .split(';')
        .map((declaracao) => declaracao.split(':').map((parte) => parte.trim()))
        .filter(([nome, valor]) => nome && valor),
    );
    for (const unico of seletor.split(',')) {
      const chave = unico.trim().replace(/\s+/g, ' ');
      regras.set(chave, { ...regras.get(chave), ...declaracoes });
    }
  }

  return regras;
}

describe('barra da página', () => {
  it('tem 46px de altura mínima e cresce com o conteúdo', () => {
    const barra = regrasDaFolha(FOLHA).get('.pageBar');

    expect(barra?.['min-height']).toBe('46px');
    expect(barra?.height).toBeUndefined();
  });
});

describe('ganchos de folha e de casca', () => {
  it('a folha da página lê as variáveis com o valor de hoje como padrão', () => {
    const folha = regrasDaFolha(FOLHA).get('.page');

    expect(folha?.border).toBe('var(--pl-sheet-border, 1px solid var(--pl-shell-border, var(--pl-color-border)))');
    expect(folha?.['border-radius']).toBe('var(--pl-sheet-radius, var(--pl-radius-md))');
    expect(folha?.['box-shadow']).toBe('var(--pl-sheet-shadow, var(--pl-sh-1))');
  });

  it('a linha da barra lê a borda da casca', () => {
    expect(regrasDaFolha(FOLHA).get('.pageBar')?.['border-bottom']).toBe('1px solid var(--pl-shell-border, var(--pl-color-border))');
  });

  it('nenhuma variável de gancho é declarada na folha', () => {
    const folha = readFileSync(resolve(process.cwd(), FOLHA), 'utf8');

    expect(folha).not.toMatch(/--pl-(sheet|shell-border)[a-z-]*\s*:/);
  });
});

describe('impressão', () => {
  it('a moldura sai no fluxo do documento, sem altura fixa, rolagem nem respiro', () => {
    const moldura = regrasDeImpressao().get('.appShell');

    expect(moldura).toEqual({ display: 'block', height: 'auto', padding: '0', overflow: 'visible' });
  });

  it('a folha e o corpo não cortam o conteúdo, e a folha perde borda e sombra', () => {
    const regras = regrasDeImpressao();

    expect(regras.get('.page')).toMatchObject({ overflow: 'visible', border: '0', 'box-shadow': 'none' });
    expect(regras.get('.pageBody')).toMatchObject({ overflow: 'visible' });
  });

  it('esconde a navegação, o painel lateral e o botão de abrir, e deixa na barra só a trilha', () => {
    const regras = regrasDeImpressao();

    expect(regras.get('.appShell > :not(.page):not(:has(.page))')).toEqual({ display: 'none' });
    expect(regras.get('.pageBarTrigger')).toEqual({ display: 'none' });
    expect(regras.get('.pageBar > :not(nav):not(:has(nav))')).toEqual({ display: 'none' });
  });

  it('o botão de abrir da barra leva a classe que a impressão esconde', () => {
    stubViewport(true);
    render(<Example />);

    expect(screen.getByRole('button', { name: 'Abrir menu' }).className).toMatch(/pageBarTrigger/);
  });

  it('as regras de tela da moldura ficam fora do @media print', () => {
    expect(regrasDaFolha(FOLHA).get('.appShell')?.display).toBe('flex');
  });
});
