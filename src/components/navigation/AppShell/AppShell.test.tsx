import { useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { AppShell, type AppShellProps } from './AppShell';
import type { AppShellAccountMode, AppShellNestedMode } from './AppShellPanel.context';

function stubViewport(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: narrow, addEventListener: () => {}, removeEventListener: () => {} }));
}

interface ExampleProps extends AppShellProps {
  accountMode?: AppShellAccountMode;
  nestedMode?: AppShellNestedMode;
  withItems?: boolean;
}

function Example({ accountMode, nestedMode, withItems = true, ...props }: ExampleProps) {
  return (
    <AppShell {...props}>
      <AppShell.Navigation>
        <AppShell.Rail
          footer={<AppShell.RailAccount label="Conta: Suporte">RM</AppShell.RailAccount>}
        >
          <AppShell.RailItem current href="/vendas" icon="V" label="Vendas" />
          <AppShell.RailItem href="/clientes" icon="C" label="Clientes" />
        </AppShell.Rail>
        <AppShell.Panel
          account={
            <AppShell.Account avatar="RM" description="Roman Mecânica" name="Suporte">
              <AppShell.PanelItem href="/favoritos" label="Favoritos" />
            </AppShell.Account>
          }
          accountMode={accountMode}
          brand="Gestor"
          label="Vendas"
          nestedMode={nestedMode}
        >
          {withItems && (
            <AppShell.PanelGroup label="Operação">
              <AppShell.PanelItem current href="/pedidos" label="Pedidos" />
              <AppShell.PanelItem label="Painéis">
                <AppShell.PanelItem href="/paineis/geral" label="Geral" />
                <AppShell.PanelItem current href="/paineis/vendas" label="Vendas" />
              </AppShell.PanelItem>
              <AppShell.PanelItem external href="https://exemplo.com" label="Ajuda" />
            </AppShell.PanelGroup>
          )}
        </AppShell.Panel>
      </AppShell.Navigation>
      <AppShell.Page>
        <AppShell.PageBar>Pedidos</AppShell.PageBar>
        <AppShell.PageBody>Conteúdo</AppShell.PageBody>
      </AppShell.Page>
    </AppShell>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('AppShell', () => {
  it('nomeia o trilho e o submenu e marca a página atual', () => {
    render(<Example />);

    const rail = screen.getByRole('navigation', { name: 'Módulos' });
    expect(within(rail).getByRole('link', { name: 'Vendas' })).toHaveAttribute('aria-current', 'page');
    expect(within(rail).getByRole('link', { name: 'Clientes' })).not.toHaveAttribute('aria-current');

    const submenu = screen.getByRole('navigation', { name: 'Vendas' });
    expect(within(submenu).getByRole('link', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'page');
    expect(within(submenu).getByText('Operação')).toBeInTheDocument();
  });

  it('deixa a marca e o recolher do submenu dentro da navegação do módulo', () => {
    render(<Example />);

    const submenu = screen.getByRole('navigation', { name: 'Vendas' });
    expect(within(submenu).getByText('Gestor')).toBeInTheDocument();
    expect(within(submenu).getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
  });

  it('abre o link externo em outra aba, sem entregar a janela de origem', () => {
    render(<Example />);

    const link = screen.getByRole('link', { name: 'Ajuda' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('entrega o link ao componente da aplicação', () => {
    function LinkDaApp({ href, ...props }: { href?: string }) {
      return <a data-roteador="app" href={href} {...props} />;
    }
    render(
      <AppShell>
        <AppShell.Navigation>
          <AppShell.Rail>
            <AppShell.RailItem as={LinkDaApp} href="/inicio" icon="I" label="Início" />
          </AppShell.Rail>
        </AppShell.Navigation>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('data-roteador', 'app');
  });

  describe('submenu', () => {
    it('recolhe e reabre, devolvendo o foco ao botão que ocupa o lugar do que sumiu', () => {
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

    it('alterna ao clicar no módulo atual, sem navegar, e navega nos outros', () => {
      render(<Example />);
      const rail = screen.getByRole('navigation', { name: 'Módulos' });

      expect(fireEvent.click(within(rail).getByRole('link', { name: 'Vendas' }))).toBe(false);
      expect(screen.getByRole('button', { name: 'Abrir submenu' })).toBeInTheDocument();

      expect(fireEvent.click(within(rail).getByRole('link', { name: 'Clientes' }))).toBe(true);
    });

    it('módulo sem submenu: não há lista nem botão de abrir, e o avatar do trilho abre a conta', () => {
      render(<Example withItems={false} />);

      expect(screen.queryByRole('navigation', { name: 'Vendas' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Conta: Suporte' }));

      expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('link', { name: 'Favoritos' })).toHaveFocus();
    });
  });

  describe('terceiro nível', () => {
    it('expande no lugar, com aria-expanded e aria-controls', () => {
      render(<Example />);
      const parent = screen.getByRole('button', { name: 'Painéis' });
      const children = document.getElementById(parent.getAttribute('aria-controls')!)!;

      expect(parent).toHaveAttribute('aria-expanded', 'false');
      expect(children.parentElement).toHaveAttribute('inert');

      fireEvent.click(parent);

      expect(parent).toHaveAttribute('aria-expanded', 'true');
      expect(children.parentElement).not.toHaveAttribute('inert');
      expect(within(children).getByRole('link', { name: 'Vendas' })).toHaveAttribute('aria-current', 'page');
    });

    it('avisa a mudança e respeita o estado controlado', () => {
      const onExpandedChange = vi.fn();
      render(
        <AppShell>
          <AppShell.Navigation>
            <AppShell.Panel label="Vendas">
              <AppShell.PanelItem expanded={false} label="Painéis" onExpandedChange={onExpandedChange}>
                <AppShell.PanelItem href="/geral" label="Geral" />
              </AppShell.PanelItem>
            </AppShell.Panel>
          </AppShell.Navigation>
        </AppShell>,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));

      expect(onExpandedChange).toHaveBeenCalledWith(true);
      expect(screen.getByRole('button', { name: 'Painéis' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('na pilha, troca a lista pelo nível de baixo e devolve o foco ao item ao voltar', () => {
      render(<Example nestedMode="stack" />);

      fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));

      expect(screen.getByRole('button', { name: 'Vendas' })).toHaveFocus();
      expect(screen.getByRole('link', { name: 'Geral' })).toBeVisible();
      expect(screen.queryByRole('link', { name: 'Pedidos' })).not.toBeInTheDocument();
      expect(screen.getByText('Operação')).not.toBeVisible();

      fireEvent.click(screen.getByRole('button', { name: 'Vendas' }));

      expect(screen.getByRole('link', { name: 'Pedidos' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Painéis' })).toHaveFocus();
    });
  });

  describe('conta', () => {
    it('abre acima do rodapé e fecha pelo Escape, devolvendo o foco ao bloco', () => {
      render(<Example />);
      const trigger = screen.getByRole('button', { name: /Suporte/ });
      const card = document.getElementById(trigger.getAttribute('aria-controls')!)!;

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(card.parentElement).toHaveAttribute('inert');

      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(card).toHaveAccessibleName('Conta');
      expect(within(card).getByRole('link', { name: 'Favoritos' })).toHaveFocus();

      fireEvent.keyDown(within(card).getByRole('link', { name: 'Favoritos' }), { key: 'Escape' });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(trigger).toHaveFocus();
    });

    it('fecha ao escolher uma opção', () => {
      render(<Example />);
      fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

      fireEvent.click(screen.getByRole('link', { name: 'Favoritos' }));

      expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'false');
    });

    it('cobrindo a lista, esconde a lista do módulo e traz o cabeçalho da conta', () => {
      render(<Example accountMode="cover" />);
      fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

      expect(screen.getByRole('navigation', { name: 'Vendas' })).toHaveAttribute('data-covered', 'true');
      expect(within(screen.getByRole('navigation', { name: 'Conta' })).getByText('Roman Mecânica')).toBeInTheDocument();
    });

    it('o avatar do trilho só aparece com o submenu recolhido e o abre já na conta', () => {
      render(<Example />);
      expect(screen.queryByRole('button', { name: 'Conta: Suporte' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Recolher submenu' }));
      fireEvent.click(screen.getByRole('button', { name: 'Conta: Suporte' }));

      expect(screen.queryByRole('button', { name: 'Conta: Suporte' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Suporte/ })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('button', { name: 'Recolher submenu' })).toBeInTheDocument();
    });
  });

  describe('celular', () => {
    beforeEach(() => stubViewport(true));

    it('não mostra o trilho nem o submenu até a gaveta abrir', () => {
      render(<Example />);

      expect(screen.queryByRole('navigation', { name: 'Módulos' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Abrir submenu' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

      const drawer = screen.getByRole('dialog', { name: 'Menu' });
      expect(drawer).toHaveAttribute('aria-modal', 'true');
      expect(within(drawer).getByRole('navigation', { name: 'Módulos' })).toBeInTheDocument();
      expect(within(drawer).getByRole('navigation', { name: 'Vendas' })).toBeInTheDocument();
      expect(within(drawer).getByRole('link', { name: 'Pedidos' })).toHaveFocus();
    });

    it('fecha pelo Escape e ao escolher um item', () => {
      render(<Example />);
      fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
      fireEvent.click(screen.getByRole('link', { name: 'Pedidos' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('tocar no módulo atual não navega nem fecha a gaveta: o submenu fica', () => {
      render(<Example />);
      fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

      expect(fireEvent.click(within(screen.getByRole('navigation', { name: 'Módulos' })).getByRole('link', { name: 'Vendas' }))).toBe(false);

      expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    });

    it('fecha a gaveta quando o módulo escolhido não tem submenu', () => {
      function Rota() {
        const [module, setModule] = useState('vendas');
        return (
          <AppShell>
            <AppShell.Navigation>
              <AppShell.Rail>
                <AppShell.RailItem current={module === 'vendas'} icon="V" label="Vendas" onClick={() => setModule('vendas')} />
                <AppShell.RailItem current={module === 'inicio'} icon="I" label="Início" onClick={() => setModule('inicio')} />
              </AppShell.Rail>
              {module === 'vendas' && (
                <AppShell.Panel label="Vendas">
                  <AppShell.PanelItem href="/pedidos" label="Pedidos" />
                </AppShell.Panel>
              )}
            </AppShell.Navigation>
            <AppShell.Page>
              <AppShell.PageBar />
            </AppShell.Page>
          </AppShell>
        );
      }
      render(<Rota />);
      fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Início' }));
      });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
