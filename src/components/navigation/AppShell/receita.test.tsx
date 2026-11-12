import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppShell, Breadcrumb, Button, IconFile, IconStructure, Sidebar, SidePanel } from '../../../index';

function Moldura({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Sidebar>
        <Sidebar.Rail brand={<Sidebar.Brand logo={<IconStructure size={20} />} name="Gestor" />}>
          <Sidebar.RailItem current href="/vendas" icon={<IconFile size={20} />} label="Vendas" />
        </Sidebar.Rail>
        <Sidebar.Panel brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />} label="Vendas">
          <Sidebar.Group label="Pedidos">
            <Sidebar.Item current href="/vendas/pedidos" icon={<IconFile size={18} />} label="Todos os pedidos" />
            <Sidebar.Item href="/vendas/devolucoes" icon={<IconFile size={18} />} label="Devoluções" />
          </Sidebar.Group>
        </Sidebar.Panel>
      </Sidebar>
      {children}
    </AppShell>
  );
}

function PaginaDePedidos() {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  return (
    <Moldura>
      <AppShell.Page>
        <AppShell.PageBar>
          <Breadcrumb items={[{ label: 'Vendas' }, { label: 'Pedidos' }]} />
        </AppShell.PageBar>
        <AppShell.PageBody>
          <Button onClick={() => setFiltrosAbertos(true)} variant="secondary">
            Filtros
          </Button>
        </AppShell.PageBody>
        <AppShell.PageFooter status="Rascunho salvo">
          <Button>Concluir</Button>
        </AppShell.PageFooter>
      </AppShell.Page>
      <SidePanel onOpenChange={setFiltrosAbertos} open={filtrosAbertos} title="Filtros">
        Campos dos filtros
      </SidePanel>
    </Moldura>
  );
}

describe('receita da moldura', () => {
  it('monta a moldura com a página como filha e o SidePanel como irmão dela', () => {
    render(<PaginaDePedidos />);

    expect(screen.getByRole('navigation', { name: 'Módulos' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Vendas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Todos os pedidos' })).toHaveAttribute('aria-current', 'page');

    const pagina = screen.getByRole('main');
    expect(pagina).toHaveTextContent('Rascunho salvo');

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));

    const painel = screen.getByRole('complementary', { name: 'Filtros' });
    expect(painel.parentElement).toBe(pagina.parentElement);
    expect(pagina).not.toContainElement(painel);
  });
});
