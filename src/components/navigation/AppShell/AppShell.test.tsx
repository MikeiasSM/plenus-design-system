import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
