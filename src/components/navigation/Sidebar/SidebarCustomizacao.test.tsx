import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState, type ReactNode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { AppShell } from '../AppShell';
import drawerStyles from '../../overlays/Drawer/Drawer.module.css';
import { Sidebar } from './Sidebar';
import panelStyles from './SidebarPanel.module.css';
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
          <Sidebar.Account avatar="MD" name="Suporte">
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

  it('o nome da gaveta, do trilho e da conta vêm do labels, com os padrões de antes', () => {
    stubViewport(true);
    const { unmount } = render(<Frame defaultAccountOpen defaultMenuOpen />);

    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Módulos' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Conta' })).toBeInTheDocument();
    unmount();

    render(<Frame defaultAccountOpen defaultMenuOpen labels={{ account: 'Account', menu: 'Navigation', modules: 'Modules' }} />);

    expect(screen.getByRole('dialog', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Modules' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Account' })).toBeInTheDocument();
  });

  it('a propriedade de cada peça ganha do labels', () => {
    stubViewport(true);
    render(
      <SidebarProvider defaultAccountOpen defaultMenuOpen labels={{ account: 'Account', menu: 'Navigation', modules: 'Modules' }}>
        <Sidebar menuLabel="Principal">
          <Sidebar.Rail label="Áreas">
            <Sidebar.RailItem current href="/vendas" icon="V" label="Vendas" />
          </Sidebar.Rail>
          <Sidebar.Panel
            account={
              <Sidebar.Account avatar="MD" label="Minha conta" name="Suporte">
                <Sidebar.Item href="/favoritos" label="Favoritos" />
              </Sidebar.Account>
            }
            label="Vendas"
          >
            <Sidebar.Item current href="/pedidos" label="Pedidos" />
          </Sidebar.Panel>
        </Sidebar>
      </SidebarProvider>,
    );

    expect(screen.getByRole('dialog', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Áreas' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Minha conta' })).toBeInTheDocument();
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
  const submenu = () => screen.getByRole('navigation', { name: 'Vendas' }).closest('[data-visible]');

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

  it('defaultAccountOpen com o submenu recolhido abre o submenu já na conta', () => {
    const onOpenChange = vi.fn();
    render(<Frame defaultAccountOpen defaultOpen={false} onOpenChange={onOpenChange} />);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(submenu()).toHaveAttribute('data-visible', 'true');
    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Conta' }).closest('[inert]')).toBeNull();
  });

  it('abrir a conta controlada com o submenu recolhido abre o submenu e leva o foco ao cartão', () => {
    const { rerender } = render(<Frame accountOpen={false} defaultOpen={false} />);
    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();

    rerender(<Frame accountOpen defaultOpen={false} />);

    expect(submenu()).toHaveAttribute('data-visible', 'true');
    expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Favoritos' })).toHaveFocus();
  });

  it('com os dois controlados, pede o submenu uma vez só, sem laço, mesmo se o pai não o abrir', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Frame accountOpen={false} onOpenChange={onOpenChange} open={false} />);

    rerender(<Frame accountOpen onOpenChange={onOpenChange} open={false} />);
    rerender(<Frame accountOpen onOpenChange={onOpenChange} open={false} />);

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('com os dois controlados por um pai que segue os avisos, abrir a conta abre o submenu, e recolher fecha os dois', () => {
    const renders = vi.fn();

    function Pai() {
      const [open, setOpen] = useState(false);
      const [accountOpen, setAccountOpen] = useState(false);
      renders();

      return (
        <Frame accountOpen={accountOpen} onAccountOpenChange={setAccountOpen} onOpenChange={setOpen} open={open}>
          <button onClick={() => setAccountOpen(true)} type="button">
            Abrir conta
          </button>
        </Frame>
      );
    }

    render(<Pai />);
    renders.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir conta' }));

    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
    expect(submenu()).toHaveAttribute('data-visible', 'true');
    expect(renders.mock.calls.length).toBeLessThanOrEqual(3);

    fireEvent.click(screen.getByRole('button', { name: 'Recolher submenu' }));
    expect(submenu()).toHaveAttribute('data-visible', 'false');
    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('o useSidebar vê o submenu aberto quando a conta abre', () => {
    function Estado() {
      return <output>{useSidebar().open ? 'aberto' : 'recolhido'}</output>;
    }

    const { rerender } = render(
      <Frame accountOpen={false} defaultOpen={false}>
        <Estado />
      </Frame>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('recolhido');

    rerender(
      <Frame accountOpen defaultOpen={false}>
        <Estado />
      </Frame>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('aberto');
  });

  it('na largura estreita, abrir a conta abre a gaveta já na conta', () => {
    stubViewport(true);
    const onMenuOpenChange = vi.fn();
    const { rerender } = render(<Frame accountOpen={false} onMenuOpenChange={onMenuOpenChange} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<Frame accountOpen onMenuOpenChange={onMenuOpenChange} />);

    expect(onMenuOpenChange).toHaveBeenCalledTimes(1);
    expect(onMenuOpenChange).toHaveBeenCalledWith(true);
    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(drawer).getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
    expect(within(drawer).getByRole('link', { name: 'Favoritos' })).toHaveFocus();
  });

  it('na largura estreita, defaultAccountOpen abre a gaveta já na conta', () => {
    stubViewport(true);
    render(<Frame defaultAccountOpen />);

    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(drawer).getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
    expect(within(drawer).getByRole('link', { name: 'Favoritos' })).toHaveFocus();
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

function AccountReader() {
  const { accountOpen, setAccountOpen } = useSidebar();

  return (
    <div>
      <output data-testid="conta">{String(accountOpen)}</output>
      <button onClick={() => setAccountOpen(true)} type="button">abrir conta</button>
      <button onClick={() => setAccountOpen(false)} type="button">fechar conta</button>
    </div>
  );
}

describe('useSidebar: conta', () => {
  const conta = () => screen.getByTestId('conta');

  it('expõe o estado da conta e o muda pelo setAccountOpen, abrindo o submenu', () => {
    render(
      <Frame defaultOpen={false}>
        <AccountReader />
      </Frame>,
    );
    expect(conta()).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'abrir conta' }));

    expect(conta()).toHaveTextContent('true');
    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Vendas' }).closest('[data-visible]')).toHaveAttribute('data-visible', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'fechar conta' }));
    expect(conta()).toHaveTextContent('false');
    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('acompanha o clique no bloco da conta', () => {
    render(
      <Frame>
        <AccountReader />
      </Frame>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));
    expect(conta()).toHaveTextContent('true');
  });

  it('abrir pelo código leva o foco à primeira opção, como o clique no bloco', () => {
    render(
      <Frame>
        <AccountReader />
      </Frame>,
    );
    const botao = screen.getByRole('button', { name: 'abrir conta' });
    botao.focus();

    fireEvent.click(botao);

    expect(conta()).toHaveTextContent('true');
    expect(screen.getByRole('link', { name: 'Favoritos' })).toHaveFocus();
  });

  it('abrir pelo código com o foco num campo editável não o rouba', () => {
    render(
      <Frame>
        <AccountReader />
        <input aria-label="Busca" />
      </Frame>,
    );
    const campo = screen.getByLabelText('Busca');
    campo.focus();

    act(() => {
      screen.getByRole('button', { name: 'abrir conta' }).click();
    });

    expect(conta()).toHaveTextContent('true');
    expect(campo).toHaveFocus();
  });

  it('abrir pelo clique no bloco leva o foco à primeira opção', () => {
    render(<Frame />);

    fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

    expect(screen.getByRole('link', { name: 'Favoritos' })).toHaveFocus();
  });

  it('no modo controlado, o setAccountOpen só pede a mudança e o pai decide', () => {
    const onAccountOpenChange = vi.fn();
    const { rerender } = render(
      <Frame accountOpen={false} onAccountOpenChange={onAccountOpenChange}>
        <AccountReader />
      </Frame>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'abrir conta' }));
    expect(onAccountOpenChange).toHaveBeenCalledWith(true);
    expect(conta()).toHaveTextContent('false');

    rerender(
      <Frame accountOpen onAccountOpenChange={onAccountOpenChange}>
        <AccountReader />
      </Frame>,
    );
    expect(conta()).toHaveTextContent('true');
  });

  it('na largura estreita, abrir pelo código abre a gaveta', () => {
    stubViewport(true);
    render(
      <Frame>
        <AccountReader />
      </Frame>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'abrir conta' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(conta()).toHaveTextContent('true');
  });
});

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

  it('a folha espelha trilho, submenu e barra do item, e mantém o recuo e a guia do subnível no início do texto', () => {
    const frame = regrasDaFolha('src/components/navigation/Sidebar/Sidebar.module.css');
    const panel = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

    expect(frame.get(".navigation[data-side='right']")).toMatchObject({ 'flex-direction': 'row-reverse' });
    expect(frame.get(".menu[data-side='right']")).toMatchObject({ 'flex-direction': 'row-reverse' });
    expect(panel.get(".panel[data-side='right'] .item[aria-current='page']::before")).toMatchObject({ left: 'auto', right: '-8px' });
    expect(panel.get('.nested')).toMatchObject({
      'border-inline-start': '1px solid var(--pl-color-border-strong)',
      'margin-inline': '16px -8px',
      'padding-inline': '9px 8px',
    });
    expect(panel.get(".item[aria-current='page']::before")).toMatchObject({ left: '-8px' });
  });

  it('com a escrita da direita para a esquerda, o lado segue físico: a ordem das peças inverte e a barra do item fica junto do trilho', () => {
    const frame = regrasDaFolha('src/components/navigation/Sidebar/Sidebar.module.css');
    const panel = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');
    const shell = regrasDaFolha('src/components/navigation/AppShell/AppShell.module.css');

    expect(frame.get('.navigation:dir(rtl)')).toMatchObject({ 'flex-direction': 'row-reverse' });
    expect(frame.get(".navigation[data-side='right']:dir(rtl)")).toMatchObject({ 'flex-direction': 'row' });
    expect(frame.get('.menu:dir(rtl)')).toMatchObject({ 'flex-direction': 'row-reverse' });
    expect(frame.get(".menu[data-side='right']:dir(rtl)")).toMatchObject({ 'flex-direction': 'row' });
    expect(shell.get('.appShell:dir(rtl)')).toMatchObject({ 'flex-direction': 'row-reverse' });
    expect(shell.get(".appShell[data-side='right']:dir(rtl)")).toMatchObject({ 'flex-direction': 'row' });
    expect(panel.get(".panel[data-side='left'] .nested:dir(rtl) .item[aria-current='page']::before")).toMatchObject({ left: '-8px' });
    expect(panel.get(".panel[data-side='right'] .nested:dir(rtl) .item[aria-current='page']::before")).toMatchObject({ right: '-6px' });
  });

  it('com a escrita da direita para a esquerda, o chevron, o link externo e a seta de voltar espelham', () => {
    const panel = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

    expect(panel.get('.chevron:dir(rtl)')).toEqual({ transform: 'rotate(180deg)' });
    expect(panel.get('.external:dir(rtl)')).toEqual({ transform: 'scaleX(-1)' });
    expect(panel.get('.backIcon:dir(rtl)')).toEqual({ transform: 'scaleX(-1)' });
  });

  it('a gaveta também mantém o lado físico com a escrita da direita para a esquerda', () => {
    const drawer = regrasDaFolha('src/components/overlays/Drawer/Drawer.module.css');

    expect(drawer.get('.right:dir(rtl)')).toEqual({ 'justify-content': 'flex-start' });
    expect(drawer.get('.left:dir(rtl)')).toEqual({ 'justify-content': 'flex-end' });
  });

  it('o terceiro nível em pilha entra pelo lado oposto com side right, e sem animação com movimento reduzido', () => {
    const panel = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');
    const folha = readFileSync(resolve(process.cwd(), 'src/components/navigation/Sidebar/SidebarPanel.module.css'), 'utf8');

    expect(panel.get(".panel[data-side='right'] .stacked")).toEqual({ 'animation-name': 'stack-in-end' });
    expect(folha).toMatch(/@keyframes stack-in-end \{\s*from \{\s*transform: translateX\(-16px\)/);
    expect(folha).toMatch(/@keyframes stack-in \{\s*from \{\s*transform: translateX\(16px\)/);
    expect(folha).toMatch(/prefers-reduced-motion: reduce\) \{[\s\S]*\.stacked \{\s*animation: none;/);
  });

  it('o painel em pilha leva o lado que a folha usa para escolher a entrada', () => {
    render(<Frame nestedMode="stack" side="right" />);
    fireEvent.click(screen.getByRole('button', { name: /Painéis/ }));

    expect(painel()).toHaveAttribute('data-side', 'right');
    expect(painel()!.querySelector(`.${panelStyles.stacked}`)).not.toBeNull();
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

describe('SidebarProvider: atalho de teclado (shortcut)', () => {
  const ctrlB = { ctrlKey: true, key: 'b' };

  afterEach(() => vi.restoreAllMocks());

  it('vem desligado: Ctrl+B não faz nada', () => {
    render(<Frame />);

    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });

  it('shortcut false também fica desligado', () => {
    render(<Frame shortcut={false} />);

    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });

  it('com mod+b, Ctrl+B alterna o submenu e chama preventDefault', () => {
    render(<Frame shortcut="mod+b" />);

    expect(fireEvent.keyDown(document.body, ctrlB)).toBe(false);
    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });

  it('segurar a tecla alterna uma vez só: a repetição não alterna, mas segue sem a ação do navegador', () => {
    render(<Frame shortcut="mod+b" />);

    fireEvent.keyDown(document.body, ctrlB);
    expect(fireEvent.keyDown(document.body, { ...ctrlB, repeat: true })).toBe(false);
    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
  });

  it('na largura estreita, a repetição também não alterna a gaveta', () => {
    stubViewport(true);
    render(<Frame shortcut="mod+b" />);

    fireEvent.keyDown(document.body, ctrlB);
    fireEvent.keyDown(document.body, { ...ctrlB, repeat: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('no Mac, o mod é o Cmd, e o Ctrl não vale', () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    render(<Frame shortcut="mod+b" />);

    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'b', metaKey: true });
    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
  });

  it('aceita outra letra, em maiúscula ou minúscula', () => {
    render(<Frame shortcut="mod+k" />);

    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
    fireEvent.keyDown(document.body, { ctrlKey: true, key: 'K' });
    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
  });

  it('sem o modificador, ou com outro a mais, não alterna', () => {
    render(<Frame shortcut="mod+b" />);

    fireEvent.keyDown(document.body, { key: 'b' });
    fireEvent.keyDown(document.body, { ctrlKey: true, key: 'b', shiftKey: true });
    fireEvent.keyDown(document.body, { altKey: true, ctrlKey: true, key: 'b' });
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });

  it('é ignorado num campo editável e deixa o evento seguir', () => {
    render(
      <Frame shortcut="mod+b">
        <input aria-label="nome" />
        <textarea aria-label="texto" />
        <div aria-label="editor" contentEditable role="textbox" suppressContentEditableWarning>
          <span>negrito</span>
        </div>
      </Frame>,
    );

    for (const alvo of [screen.getByLabelText('nome'), screen.getByLabelText('texto'), screen.getByText('negrito')]) {
      expect(fireEvent.keyDown(alvo, ctrlB)).toBe(true);
    }
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });

  it('na largura estreita, alterna a gaveta', () => {
    stubViewport(true);
    render(<Frame shortcut="mod+b" />);

    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('para de ouvir ao desmontar ou ao desligar o atalho', () => {
    const { rerender, unmount } = render(<Frame shortcut="mod+b" />);

    rerender(<Frame shortcut={undefined} />);
    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
    unmount();
    expect(fireEvent.keyDown(document.body, ctrlB)).toBe(true);
  });

  it('o AppShell repassa o atalho', () => {
    render(
      <AppShell shortcut="mod+b">
        <Navigation />
        <AppShell.Page>
          <AppShell.PageBar />
        </AppShell.Page>
      </AppShell>,
    );

    fireEvent.keyDown(document.body, ctrlB);
    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
  });
});
