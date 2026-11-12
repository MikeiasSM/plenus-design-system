import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AppShell } from '../AppShell';
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

export { Frame, Navigation, stubViewport, useSidebar, useState };
