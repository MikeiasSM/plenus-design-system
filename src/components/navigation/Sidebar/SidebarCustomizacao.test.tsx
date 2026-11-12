import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { AppShell } from '../AppShell';
import drawerStyles from '../../overlays/Drawer/Drawer.module.css';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar, type SidebarProviderProps } from './SidebarProvider';

function stubViewport(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: narrow, addEventListener: () => {}, removeEventListener: () => {} }));
}

function Navigation({ nestedMode }: { nestedMode?: 'expand' | 'stack' }) {
  return (
    <Sidebar>
      <Sidebar.Rail>
        <Sidebar.RailItem current href="/vendas" icon="V" label="Vendas" />
      </Sidebar.Rail>
      <Sidebar.Panel
        account={
          <Sidebar.Account avatar="RM" name="Suporte">
            <Sidebar.Item href="/favoritos" label="Favoritos" />
          </Sidebar.Account>
        }
        brand="Gestor"
        label="Vendas"
        nestedMode={nestedMode}
      >
        <Sidebar.Group label="Operação">
          <Sidebar.Item current href="/pedidos" label="Pedidos" />
          <Sidebar.Item label="Painéis">
            <Sidebar.Item href="/paineis/geral" label="Geral" />
          </Sidebar.Item>
          <Sidebar.Item external href="https://exemplo.com" label="Ajuda" />
        </Sidebar.Group>
      </Sidebar.Panel>
    </Sidebar>
  );
}

function Frame({ children, nestedMode, ...props }: Omit<SidebarProviderProps, 'children'> & { children?: ReactNode; nestedMode?: 'expand' | 'stack' }) {
  return (
    <SidebarProvider {...props}>
      <div style={{ display: 'flex' }}>
        <Navigation nestedMode={nestedMode} />
        <div>
          <Sidebar.Trigger />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('SidebarProvider: textos (labels)', () => {
  it('mantém os padrões em português sem labels', () => {
    render(<Frame defaultOpen={false} />);

    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });

  it('troca só os textos passados e mantém os outros', () => {
    render(<Frame defaultOpen={false} labels={{ openSubmenu: 'Show submenu' }} />);

    expect(screen.getByRole('button', { name: 'Show submenu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });

  it('troca o recolher do submenu', () => {
    render(<Frame labels={{ collapseSubmenu: 'Hide submenu' }} />);

    expect(screen.getByRole('button', { name: 'Hide submenu' })).toBeInTheDocument();
  });

  it('na largura estreita, troca abrir e fechar o menu', () => {
    stubViewport(true);
    render(<Frame labels={{ closeMenu: 'Close menu', openMenu: 'Open menu' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('na largura estreita, os padrões seguem os de antes', () => {
    stubViewport(true);
    render(<Frame labels={{ openSubmenu: 'x' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toBeInTheDocument();
  });

  it('ignora um texto indefinido, que não apaga o padrão', () => {
    render(<Frame defaultOpen={false} labels={{ openSubmenu: undefined }} />);

    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
  });

  it('o AppShell repassa os textos ao provider que monta', () => {
    render(
      <AppShell defaultOpen={false} labels={{ openSubmenu: 'Show submenu' }}>
        <Navigation />
        <AppShell.Page>
          <AppShell.PageBar>Pedidos</AppShell.PageBar>
        </AppShell.Page>
      </AppShell>,
    );

    expect(within(screen.getByRole('main')).getByRole('button', { name: 'Show submenu' })).toBeInTheDocument();
  });
});

describe('SidebarProvider: gaveta do celular controlável', () => {
  beforeEach(() => stubViewport(true));

  it('não controlada, começa fechada e avisa a mudança uma vez', () => {
    const onMenuOpenChange = vi.fn();
    render(<Frame onMenuOpenChange={onMenuOpenChange} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onMenuOpenChange).toHaveBeenCalledTimes(1);
    expect(onMenuOpenChange).toHaveBeenCalledWith(true);
  });

  it('defaultMenuOpen abre a gaveta no início', () => {
    render(<Frame defaultMenuOpen />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('controlada, só muda quando o pai muda', () => {
    const onMenuOpenChange = vi.fn();
    const { rerender } = render(<Frame menuOpen={false} onMenuOpenChange={onMenuOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(onMenuOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<Frame menuOpen onMenuOpenChange={onMenuOpenChange} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(onMenuOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('o useSidebar continua expondo o setter e o estado da gaveta', () => {
    function Reader() {
      const { openMobile, setOpenMobile } = useSidebar();

      return (
        <button onClick={() => setOpenMobile(!openMobile)} type="button">
          {`gaveta ${openMobile}`}
        </button>
      );
    }
    const onMenuOpenChange = vi.fn();
    render(
      <Frame onMenuOpenChange={onMenuOpenChange}>
        <Reader />
      </Frame>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'gaveta false' }));
    expect(screen.getByRole('button', { hidden: true, name: 'gaveta true' })).toBeInTheDocument();
    expect(onMenuOpenChange).toHaveBeenCalledWith(true);
  });

  it('o AppShell repassa a gaveta ao provider que monta', () => {
    render(
      <AppShell defaultMenuOpen>
        <Navigation />
      </AppShell>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('SidebarProvider: conta controlável', () => {
  it('não controlada, começa fechada e avisa a mudança', () => {
    const onAccountOpenChange = vi.fn();
    render(<Frame onAccountOpenChange={onAccountOpenChange} />);

    const trigger = screen.getByRole('button', { name: /Suporte/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(onAccountOpenChange).toHaveBeenCalledWith(true);
  });

  it('defaultAccountOpen abre a conta no início', () => {
    render(<Frame defaultAccountOpen />);

    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('controlada, só muda quando o pai muda', () => {
    const onAccountOpenChange = vi.fn();
    const { rerender } = render(<Frame accountOpen={false} onAccountOpenChange={onAccountOpenChange} />);

    const trigger = screen.getByRole('button', { name: /Suporte/ });
    fireEvent.click(trigger);
    expect(onAccountOpenChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    rerender(<Frame accountOpen onAccountOpenChange={onAccountOpenChange} />);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('recolher o submenu fecha a conta e avisa', () => {
    const onAccountOpenChange = vi.fn();
    render(<Frame defaultAccountOpen onAccountOpenChange={onAccountOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Recolher submenu' }));
    expect(onAccountOpenChange).toHaveBeenCalledWith(false);
  });
});

function stubWidth(width: number) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: width <= Number(/max-width:\s*([\d.]+)px/.exec(query)?.[1]),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('SidebarProvider: ponto de virada (narrowBelow)', () => {
  it('o padrão é 900: a 1000px a navegação fica larga e a 899px vira gaveta', () => {
    stubWidth(1000);
    const { unmount } = render(<Frame />);
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
    unmount();

    stubWidth(899);
    render(<Frame />);
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  });

  it('com narrowBelow 1024, a 1000px a Sidebar vira gaveta', () => {
    stubWidth(1000);
    render(<Frame narrowBelow={1024} />);

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recolher submenu' })).not.toBeInTheDocument();
  });

  it('com narrowBelow 1024, a 1000px o AppShell e a Sidebar estão os dois em gaveta', () => {
    stubWidth(1000);
    function Reader() {
      return <output data-testid="mobile">{String(useSidebar().isMobile)}</output>;
    }
    render(
      <AppShell narrowBelow={1024}>
        <Navigation />
        <AppShell.Page>
          <AppShell.PageBar>
            <Reader />
          </AppShell.PageBar>
        </AppShell.Page>
      </AppShell>,
    );

    expect(screen.getByTestId('mobile')).toHaveTextContent('true');
    expect(within(screen.getByRole('main')).getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('main')).getByRole('button', { name: 'Abrir menu' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('com narrowBelow menor, a 1000px segue larga', () => {
    stubWidth(1000);
    render(<Frame narrowBelow={600} />);

    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });
});

describe('SidebarProvider: lado (side)', () => {
  const painel = () => screen.getByRole('navigation', { name: 'Vendas' }).closest('[data-visible]');
  const trilho = () => screen.getByRole('navigation', { name: 'Módulos' });

  it('o padrão é a esquerda, em todas as partes', () => {
    const { container } = render(<AppShell><Navigation /></AppShell>);

    expect(trilho().parentElement).toHaveAttribute('data-side', 'left');
    expect(painel()).toHaveAttribute('data-side', 'left');
    expect(container.firstElementChild).toHaveAttribute('data-side', 'left');
  });

  it('à direita, o trilho, o submenu e a moldura do AppShell seguem o lado', () => {
    const { container } = render(<AppShell side="right"><Navigation /></AppShell>);

    expect(trilho().parentElement).toHaveAttribute('data-side', 'right');
    expect(painel()).toHaveAttribute('data-side', 'right');
    expect(container.firstElementChild).toHaveAttribute('data-side', 'right');
  });

  it('o SidebarProvider avulso também aceita o lado', () => {
    render(<Frame side="right" />);

    expect(trilho().parentElement).toHaveAttribute('data-side', 'right');
  });

  it('na largura estreita, a gaveta abre pela esquerda por padrão e pela direita com side right', () => {
    stubViewport(true);
    const { unmount } = render(<Frame defaultMenuOpen />);
    expect(screen.getByRole('dialog').parentElement).toHaveClass(drawerStyles.left);
    unmount();

    render(<Frame defaultMenuOpen side="right" />);
    expect(screen.getByRole('dialog').parentElement).toHaveClass(drawerStyles.right);
    expect(screen.getByRole('dialog').parentElement).not.toHaveClass(drawerStyles.left);
    expect(painel()).toHaveAttribute('data-side', 'right');
  });

  it('a folha espelha trilho, submenu, barra do item, recuo e guia do subnível com propriedades lógicas', () => {
    const frame = regrasDaFolha('src/components/navigation/Sidebar/Sidebar.module.css');
    const panel = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

    expect(frame.get(".navigation[data-side='right']")).toMatchObject({ 'flex-direction': 'row-reverse' });
    expect(frame.get(".menu[data-side='right']")).toMatchObject({ 'flex-direction': 'row-reverse' });
    expect(panel.get(".panel[data-side='right'] .item[aria-current='page']::before")).toMatchObject({
      'inset-inline-end': '-8px',
      'inset-inline-start': 'auto',
    });
    expect(panel.get(".panel[data-side='right'] .nested")).toMatchObject({
      'border-inline-end': '1px solid var(--pl-color-border-strong)',
      'border-inline-start': '0',
    });
    expect(panel.get('.nested')).toMatchObject({ 'border-inline-start': '1px solid var(--pl-color-border-strong)', 'margin-inline-start': '16px' });
    expect(panel.get(".item[aria-current='page']::before")).toMatchObject({ 'inset-inline-start': '-8px' });
  });
});

describe('SidebarProvider: ícones (icons)', () => {
  const marca = (nome: string) => <svg data-testid={nome} />;

  it('mantém os ícones atuais por padrão', () => {
    render(<Frame defaultOpen={false} />);

    expect(screen.getByRole('button', { name: 'Abrir submenu' }).querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByTestId('abrir')).not.toBeInTheDocument();
  });

  it('troca o ícone de abrir, no submenu recolhido e na gaveta', () => {
    const { unmount } = render(<Frame defaultOpen={false} icons={{ open: marca('abrir') }} />);
    expect(within(screen.getByRole('button', { name: 'Abrir submenu' })).getByTestId('abrir')).toBeInTheDocument();
    unmount();

    stubViewport(true);
    render(<Frame icons={{ open: marca('abrir') }} />);
    expect(within(screen.getByRole('button', { name: 'Abrir menu' })).getByTestId('abrir')).toBeInTheDocument();
  });

  it('troca o ícone de recolher', () => {
    render(<Frame icons={{ collapse: marca('recolher') }} />);

    expect(within(screen.getByRole('button', { name: 'Recolher submenu' })).getByTestId('recolher')).toBeInTheDocument();
  });

  it('troca o ícone de fechar a gaveta', () => {
    stubViewport(true);
    render(<Frame defaultMenuOpen icons={{ close: marca('fechar') }} />);

    expect(within(screen.getByRole('button', { name: 'Fechar menu' })).getByTestId('fechar')).toBeInTheDocument();
  });

  it('troca a seta de voltar do terceiro nível em pilha', () => {
    render(<Frame icons={{ back: marca('voltar') }} nestedMode="stack" />);

    expect(screen.queryByTestId('voltar')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));
    expect(within(screen.getByRole('button', { name: 'Vendas' })).getByTestId('voltar')).toBeInTheDocument();
  });

  it('troca o ícone do link externo', () => {
    render(<Frame icons={{ external: marca('externo') }} />);

    expect(within(screen.getByRole('link', { name: 'Ajuda' })).getByTestId('externo')).toBeInTheDocument();
  });

  it('troca a seta da conta', () => {
    render(<Frame icons={{ account: marca('conta') }} />);

    expect(within(screen.getByRole('button', { name: /Suporte/ })).getByTestId('conta')).toBeInTheDocument();
  });

  it('mescla: os ícones não passados ficam com o padrão', () => {
    render(<Frame icons={{ collapse: marca('recolher'), external: undefined }} />);

    expect(screen.getByTestId('recolher')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ajuda' }).querySelector('svg')).toBeInTheDocument();
  });

  it('o AppShell repassa os ícones', () => {
    render(
      <AppShell icons={{ collapse: marca('recolher') }}>
        <Navigation />
      </AppShell>,
    );

    expect(screen.getByTestId('recolher')).toBeInTheDocument();
  });
});

export { Frame, Navigation, stubViewport, useSidebar, useState };
