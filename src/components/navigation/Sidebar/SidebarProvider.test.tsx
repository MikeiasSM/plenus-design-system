import { useRef, useState, type MouseEvent } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { AppShell } from '../AppShell';
import { Sidebar } from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarProvider';

function stubViewport(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: narrow, addEventListener: () => {}, removeEventListener: () => {} }));
}

function Navigation() {
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
      >
        <Sidebar.Group label="Operação">
          <Sidebar.Item current href="/pedidos" label="Pedidos" />
        </Sidebar.Group>
      </Sidebar.Panel>
    </Sidebar>
  );
}

function OwnFrame(props: { defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; open?: boolean }) {
  return (
    <SidebarProvider {...props}>
      <div style={{ display: 'flex' }}>
        <Navigation />
        <div>
          <Sidebar.Trigger />
          Conteúdo
        </div>
      </div>
    </SidebarProvider>
  );
}

function StateReader() {
  const { isMobile, open, openMobile, setOpen, setOpenMobile, toggleSidebar } = useSidebar();

  return (
    <div>
      <output data-testid="estado">{`${open}|${openMobile}|${isMobile}`}</output>
      <button onClick={() => setOpen(true)} type="button">abrir</button>
      <button onClick={() => setOpen(false)} type="button">fechar</button>
      <button onClick={() => setOpenMobile(true)} type="button">abrir gaveta</button>
      <button onClick={toggleSidebar} type="button">alternar</button>
    </div>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('SidebarProvider', () => {
  it('monta uma moldura própria: recolhe, expande e devolve o foco', () => {
    render(<OwnFrame />);

    expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Recolher submenu' }));

    const expand = screen.getByRole('button', { name: 'Abrir submenu' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    expect(expand).toHaveFocus();
    fireEvent.click(expand);
    expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
  });

  it('abre a gaveta pelo Trigger na largura estreita', () => {
    stubViewport(true);
    render(<OwnFrame />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

    const drawer = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(drawer).getByRole('link', { name: 'Pedidos' })).toBeInTheDocument();
  });

  it('o Trigger não renderiza nada sem o que abrir', () => {
    render(
      <SidebarProvider>
        <Sidebar.Trigger />
      </SidebarProvider>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lança erro claro sem provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const message = 'A Sidebar e o useSidebar só funcionam dentro de <SidebarProvider> ou de <AppShell>.';

    expect(() => render(<Navigation />)).toThrow(message);
    expect(() => render(<StateReader />)).toThrow(message);
    error.mockRestore();
  });

  describe('useSidebar', () => {
    it('lê e muda o estado no modo não controlado, avisando onOpenChange', () => {
      const onOpenChange = vi.fn();
      render(
        <SidebarProvider defaultOpen={false} onOpenChange={onOpenChange}>
          <StateReader />
        </SidebarProvider>,
      );

      expect(screen.getByTestId('estado')).toHaveTextContent('false|false|false');
      fireEvent.click(screen.getByRole('button', { name: 'abrir' }));
      expect(screen.getByTestId('estado')).toHaveTextContent('true|false|false');
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      fireEvent.click(screen.getByRole('button', { name: 'alternar' }));
      expect(screen.getByTestId('estado')).toHaveTextContent('false|false|false');
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });

    it('no modo controlado só avisa; quem manda é o pai', () => {
      const onOpenChange = vi.fn();
      render(
        <SidebarProvider onOpenChange={onOpenChange} open>
          <StateReader />
        </SidebarProvider>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'fechar' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByTestId('estado')).toHaveTextContent('true|false|false');
    });

    it('na largura estreita alterna a gaveta', () => {
      stubViewport(true);
      render(
        <SidebarProvider>
          <StateReader />
        </SidebarProvider>,
      );

      expect(screen.getByTestId('estado')).toHaveTextContent('true|false|true');
      fireEvent.click(screen.getByRole('button', { name: 'alternar' }));
      expect(screen.getByTestId('estado')).toHaveTextContent('true|true|true');
      fireEvent.click(screen.getByRole('button', { name: 'abrir gaveta' }));
      expect(screen.getByTestId('estado')).toHaveTextContent('true|true|true');
    });

    it('recolher por fora não rouba o foco e fecha a conta', () => {
      render(
        <SidebarProvider>
          <StateReader />
          <Navigation />
          <Sidebar.Trigger />
        </SidebarProvider>,
      );

      fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));
      expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');

      const close = screen.getByRole('button', { name: 'fechar' });
      close.focus();
      fireEvent.click(close);
      expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
      expect(close).toHaveFocus();
      expect(screen.getByRole('button', { name: /Suporte/, hidden: true })).toHaveAttribute('aria-expanded', 'false');
    });

    it('setOpen descarta o foco pendente de um recolher que o pai controlado não aplicou', () => {
      function Guarded() {
        const [open, setOpen] = useState(true);
        const accepts = useRef(false);

        return (
          <SidebarProvider onOpenChange={(next) => accepts.current && setOpen(next)} open={open}>
            <StateReader />
            <Navigation />
            <Sidebar.Trigger />
            <button onClick={() => (accepts.current = true)} type="button">liberar</button>
          </SidebarProvider>
        );
      }

      render(<Guarded />);
      fireEvent.click(screen.getByRole('button', { name: 'Recolher submenu' }));
      expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'liberar' }));

      const close = screen.getByRole('button', { name: 'fechar' });
      close.focus();
      fireEvent.click(close);
      expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
      expect(close).toHaveFocus();
    });
  });

  describe('AppShell dentro de um SidebarProvider', () => {
    function Outside() {
      const [open, setOpen] = useState(false);

      return (
        <SidebarProvider onOpenChange={setOpen} open={open}>
          <StateReader />
          <AppShell open>
            <Navigation />
            <AppShell.Page>
              <AppShell.PageBar>Pedidos</AppShell.PageBar>
            </AppShell.Page>
          </AppShell>
        </SidebarProvider>
      );
    }

    it('usa o estado de fora e ignora as props de estado, avisando em desenvolvimento', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(<Outside />);

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('AppShell'));
      expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'abrir' }));
      expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
      warn.mockRestore();
    });

    it('não avisa sem props de estado, e o Trigger de fora abre o submenu de dentro', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar.Trigger className="fora" />
          <AppShell>
            <Navigation />
            <AppShell.Page>
              <AppShell.PageBar>Pedidos</AppShell.PageBar>
            </AppShell.Page>
          </AppShell>
        </SidebarProvider>,
      );

      expect(warn).not.toHaveBeenCalled();
      const triggers = screen.getAllByRole('button', { name: 'Abrir submenu' });
      expect(triggers).toHaveLength(2);
      fireEvent.click(triggers.find((trigger) => trigger.classList.contains('fora'))!);
      expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Vendas' })).not.toHaveAttribute('inert');
      warn.mockRestore();
    });
  });
});

describe('Sidebar.Trigger', () => {
  function CollapsedFrame({ onClick }: { onClick?: (event: MouseEvent<HTMLButtonElement>) => void }) {
    const ref = useRef<HTMLButtonElement>(null);
    const [refName, setRefName] = useState('');

    return (
      <SidebarProvider defaultOpen={false}>
        <Navigation />
        <Sidebar.Trigger className="minha-classe" data-origem="barra" onClick={onClick} ref={ref} />
        <button onClick={() => setRefName(ref.current?.getAttribute('aria-label') ?? '')} type="button">
          ler ref
        </button>
        <output data-testid="ref">{refName}</output>
      </SidebarProvider>
    );
  }

  it('leva o ref e as propriedades nativas ao botão, sem perder o manejo de foco', () => {
    render(<CollapsedFrame />);

    const trigger = screen.getByRole('button', { name: 'Abrir submenu' });
    expect(trigger).toHaveAttribute('data-origem', 'barra');
    expect(trigger).toHaveClass('minha-classe');
    fireEvent.click(screen.getByRole('button', { name: 'ler ref' }));
    expect(screen.getByTestId('ref')).toHaveTextContent('Abrir submenu');

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Recolher submenu' }));
    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toHaveFocus();
  });

  it('chama o onClick do consumidor, e preventDefault cancela a abertura', () => {
    const onClick = vi.fn((event: MouseEvent<HTMLButtonElement>) => event.preventDefault());
    render(<CollapsedFrame onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir submenu' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();
  });

  it('na largura estreita, também leva o ref e chama o onClick antes de abrir a gaveta', () => {
    stubViewport(true);
    const onClick = vi.fn();
    render(<CollapsedFrame onClick={onClick} />);

    const trigger = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(screen.getByRole('button', { name: 'ler ref' }));
    expect(screen.getByTestId('ref')).toHaveTextContent('Abrir menu');
    fireEvent.click(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
