import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { AppShell } from '../AppShell';
import { Sidebar } from './Sidebar';
import type { SidebarAccountMode } from './SidebarPanel.context';

interface PilhaProps {
  accountMode?: SidebarAccountMode;
  paineisAbertos?: boolean;
  regioesAbertas?: boolean;
}

/** Três níveis na pilha: o módulo, Painéis e, dentro dele, Regiões. A conta também tem um ramo. */
function Pilha({ accountMode, paineisAbertos, regioesAbertas }: PilhaProps) {
  return (
    <AppShell>
      <Sidebar>
        <Sidebar.Panel
          account={
            <Sidebar.Account avatar="MD" name="Suporte">
              <Sidebar.Item href="/favoritos" label="Favoritos" />
              <Sidebar.Item label="Empresas">
                <Sidebar.Item href="/empresas/norte" label="Empresa Norte" />
                <Sidebar.Item href="/empresas/sul" label="Empresa Sul" />
              </Sidebar.Item>
            </Sidebar.Account>
          }
          accountMode={accountMode}
          label="Vendas"
          nestedMode="stack"
        >
          <Sidebar.Group label="Operação">
            <Sidebar.Item current href="/pedidos" label="Pedidos" />
            <Sidebar.Item defaultExpanded={paineisAbertos} label="Painéis">
              <Sidebar.Item href="/paineis/geral" label="Geral" />
              <Sidebar.Item defaultExpanded={regioesAbertas} label="Regiões">
                <Sidebar.Item href="/paineis/regioes/norte" label="Norte" />
                <Sidebar.Item href="/paineis/regioes/sul" label="Sul" />
              </Sidebar.Item>
            </Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Panel>
      </Sidebar>
    </AppShell>
  );
}

const submenu = () => screen.getByRole('navigation', { name: 'Vendas' });

describe('Sidebar: pilha com vários níveis', () => {
  it('entrar num ramo dentro de outro mostra os filhos dele, com o voltar no rótulo do pai', () => {
    render(<Pilha />);

    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Regiões' }));

    expect(within(submenu()).getByRole('link', { name: 'Norte' })).toBeVisible();
    expect(within(submenu()).getByRole('link', { name: 'Sul' })).toBeVisible();
    expect(within(submenu()).getByRole('button', { name: 'Painéis' })).toHaveFocus();
    expect(within(submenu()).queryByRole('link', { name: 'Geral' })).not.toBeInTheDocument();
    expect(within(submenu()).queryByRole('link', { name: 'Pedidos' })).not.toBeInTheDocument();
    expect(within(submenu()).queryByRole('button', { name: 'Vendas' })).not.toBeInTheDocument();
  });

  it('o voltar sobe um nível e devolve o foco ao item de origem', () => {
    render(<Pilha />);
    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Regiões' }));

    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));

    expect(screen.getByRole('link', { name: 'Geral' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Regiões' })).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Vendas' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Norte' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vendas' }));

    expect(screen.getByRole('link', { name: 'Pedidos' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Painéis' })).toHaveFocus();
    expect(screen.getByText('Operação')).toBeVisible();
  });

  it('defaultExpanded num item de segundo nível abre a cadeia inteira na montagem', () => {
    render(<Pilha regioesAbertas />);

    expect(screen.getByRole('link', { name: 'Norte' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Painéis' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pedidos' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });

  it('defaultExpanded nos dois níveis também empilha os dois', () => {
    render(<Pilha paineisAbertos regioesAbertas />);

    expect(screen.getByRole('link', { name: 'Norte' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));
    expect(screen.getByRole('link', { name: 'Geral' })).toBeVisible();
  });

  it.each<SidebarAccountMode>(['inline', 'cover'])('conta em %s: entrar num ramo dela e fechá-la mantém a lista do módulo', (accountMode) => {
    render(<Pilha accountMode={accountMode} />);
    const trigger = screen.getByRole('button', { name: /Suporte/ });
    fireEvent.click(trigger);
    const conta = screen.getByRole('navigation', { name: 'Conta' });

    fireEvent.click(within(conta).getByRole('button', { name: 'Empresas' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(within(conta).getByRole('link', { name: 'Empresa Norte' })).toBeInTheDocument();
    expect(within(conta).getByRole('button', { name: 'Conta' })).toHaveFocus();
    expect(within(conta).queryByRole('link', { name: 'Favoritos' })).not.toBeInTheDocument();

    fireEvent.keyDown(within(conta).getByRole('link', { name: 'Empresa Norte' }), { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(within(submenu()).getByRole('link', { name: 'Pedidos' })).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(within(conta).getByRole('link', { name: 'Favoritos' })).toBeInTheDocument();
    expect(within(conta).getByRole('button', { name: 'Empresas' })).toBeInTheDocument();
  });

  it('o voltar da conta mostra o rótulo da conta e volta às opções', () => {
    render(<Pilha />);
    fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));
    const conta = screen.getByRole('navigation', { name: 'Conta' });
    fireEvent.click(within(conta).getByRole('button', { name: 'Empresas' }));

    fireEvent.click(within(conta).getByRole('button', { name: 'Conta' }));

    expect(within(conta).getByRole('link', { name: 'Favoritos' })).toBeInTheDocument();
    expect(within(conta).getByRole('button', { name: 'Empresas' })).toHaveFocus();
  });
});

describe('Sidebar: aria-current do consumidor', () => {
  it('a folha e o módulo do trilho respeitam o aria-current passado, e current vence com page', () => {
    render(
      <AppShell>
        <Sidebar>
          <Sidebar.Rail>
            <Sidebar.RailItem aria-current="location" href="/vendas" icon="V" label="Vendas" />
            <Sidebar.RailItem aria-current="location" current href="/clientes" icon="C" label="Clientes" />
          </Sidebar.Rail>
          <Sidebar.Panel label="Vendas">
            <Sidebar.Item aria-current="step" href="/pedidos" label="Pedidos" />
            <Sidebar.Item aria-current="step" current href="/notas" label="Notas" />
          </Sidebar.Panel>
        </Sidebar>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: 'Vendas' })).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('link', { name: 'Notas' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('Sidebar: conta cobrindo a lista e troca de módulo', () => {
  it('em cover, a conta fecha quando o módulo muda', () => {
    function Modulos() {
      const [modulo, setModulo] = useState('Vendas');
      return (
        <AppShell>
          <Sidebar>
            <Sidebar.Rail>
              <Sidebar.RailItem current={modulo === 'Vendas'} icon="V" label="Vendas" onClick={() => setModulo('Vendas')} />
              <Sidebar.RailItem current={modulo === 'Clientes'} icon="C" label="Clientes" onClick={() => setModulo('Clientes')} />
            </Sidebar.Rail>
            <Sidebar.Panel
              account={
                <Sidebar.Account avatar="MD" name="Suporte">
                  <Sidebar.Item href="/favoritos" label="Favoritos" />
                </Sidebar.Account>
              }
              accountMode="cover"
              label={modulo}
            >
              <Sidebar.Item href={`/${modulo}`} label={`Início de ${modulo}`} />
            </Sidebar.Panel>
          </Sidebar>
        </AppShell>
      );
    }
    render(<Modulos />);
    const trigger = screen.getByRole('button', { name: /Suporte/ });
    fireEvent.click(trigger);
    expect(screen.getByRole('navigation', { name: 'Vendas' })).toHaveAttribute('data-covered', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Clientes' }));

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('navigation', { name: 'Clientes' })).toHaveAttribute('data-covered', 'false');
  });

  it('em inline, a conta continua aberta ao trocar de módulo, como antes', () => {
    const { rerender } = render(<SoPainel label="Vendas" />);
    fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

    rerender(<SoPainel label="Clientes" />);

    expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
  });
});

function SoPainel({ label }: { label: string }) {
  return (
    <AppShell>
      <Sidebar>
        <Sidebar.Panel
          account={
            <Sidebar.Account avatar="MD" name="Suporte">
              <Sidebar.Item href="/favoritos" label="Favoritos" />
            </Sidebar.Account>
          }
          label={label}
        >
          <Sidebar.Item href="/inicio" label="Início" />
        </Sidebar.Panel>
      </Sidebar>
    </AppShell>
  );
}

describe('Sidebar.RailItem: alternar o submenu', () => {
  function Trilho({ toggleSubmenu }: { toggleSubmenu?: boolean }) {
    return (
      <AppShell>
        <Sidebar>
          <Sidebar.Rail>
            <Sidebar.RailItem current icon="V" label="Vendas" toggleSubmenu={toggleSubmenu} />
            <Sidebar.RailItem icon="C" label="Clientes" />
          </Sidebar.Rail>
          <Sidebar.Panel label="Vendas">
            <Sidebar.Item href="/pedidos" label="Pedidos" />
          </Sidebar.Panel>
        </Sidebar>
      </AppShell>
    );
  }

  it('o módulo atual que alterna o submenu expõe aria-expanded e aria-controls', () => {
    render(<Trilho />);
    const vendas = screen.getByRole('button', { name: 'Vendas' });
    const painel = screen.getByRole('navigation', { name: 'Vendas' }).closest('[data-visible]')!;

    expect(vendas).toHaveAttribute('aria-expanded', 'true');
    expect(vendas).toHaveAttribute('aria-controls', painel.id);
    expect(screen.getByRole('button', { name: 'Clientes' })).not.toHaveAttribute('aria-expanded');

    fireEvent.click(vendas);

    expect(vendas).toHaveAttribute('aria-expanded', 'false');
  });

  it('com toggleSubmenu false, o módulo atual navega e não alterna', () => {
    render(<Trilho toggleSubmenu={false} />);
    const vendas = screen.getByRole('button', { name: 'Vendas' });

    expect(vendas).not.toHaveAttribute('aria-expanded');
    expect(vendas).not.toHaveAttribute('aria-controls');
    expect(fireEvent.click(vendas)).toBe(true);
    expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });
});

describe('Drawer: respiro da gaveta da Sidebar', () => {
  it('o padding da borda esquerda da gaveta pesa como uma classe, e o da gaveta da Sidebar vence em qualquer ordem das folhas', () => {
    const drawer = regrasDaFolha('src/components/overlays/Drawer/Drawer.module.css');

    expect(drawer.get(':where(.left) .drawer')).toEqual({ 'padding-left': 'env(safe-area-inset-left, 0px)' });
    expect(drawer.get('.left .drawer')).not.toHaveProperty('padding-left');
    expect(drawer.get('.left .drawer')).not.toHaveProperty('padding');
  });
});
