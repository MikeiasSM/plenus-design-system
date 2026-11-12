import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { AppShell } from '../AppShell';
import { Sidebar } from './Sidebar';
import { SidebarProvider } from './SidebarProvider';

vi.mock('../../overlays/Tooltip', () => ({
  Tooltip: ({ children, content, delay, placement }: { children: ReactElement; content: string; delay: number; placement: string }) => (
    <span data-content={content} data-delay={delay} data-placement={placement} data-testid="dica">
      {children}
    </span>
  ),
}));

function Navigation() {
  return (
    <Sidebar>
      <Sidebar.Rail
        brand={<Sidebar.Brand href="/" logo={<svg />} name="Gestor" />}
        footer={<Sidebar.RailAccount label="Conta: Suporte">RM</Sidebar.RailAccount>}
      >
        <Sidebar.RailItem current href="/vendas" icon="V" label="Vendas" />
      </Sidebar.Rail>
      <Sidebar.Panel brand="Gestor" label="Vendas">
        <Sidebar.Item current href="/pedidos" label="Pedidos" />
      </Sidebar.Panel>
    </Sidebar>
  );
}

function renderIn(props: Parameters<typeof SidebarProvider>[0] extends infer P ? Omit<P, 'children'> : never) {
  return render(
    <SidebarProvider {...props} defaultOpen={false}>
      <Navigation />
    </SidebarProvider>,
  );
}

function railTips() {
  return screen.getAllByTestId('dica').filter((dica) => ['Gestor', 'Vendas', 'Conta: Suporte'].includes(dica.getAttribute('data-content') ?? ''));
}

describe('Sidebar: dicas do trilho', () => {
  it('abrem à direita e esperam 150 ms por padrão', () => {
    renderIn({});

    const dicas = railTips();
    expect(dicas).toHaveLength(3);
    for (const dica of dicas) {
      expect(dica).toHaveAttribute('data-placement', 'right');
      expect(dica).toHaveAttribute('data-delay', '150');
    }
  });

  it('com side right, abrem à esquerda', () => {
    renderIn({ side: 'right' });

    for (const dica of railTips()) {
      expect(dica).toHaveAttribute('data-placement', 'left');
    }
  });

  it('o AppShell repassa o lado', () => {
    render(
      <AppShell side="right">
        <Navigation />
      </AppShell>,
    );

    for (const dica of railTips()) {
      expect(dica).toHaveAttribute('data-placement', 'left');
    }
  });
});
