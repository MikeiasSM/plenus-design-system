import { useState, type CSSProperties } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { AppShell, type AppShellProps } from '../AppShell';
import { regrasDaFolha } from '../../../test/folha';
import { Sidebar } from './Sidebar';
import panelStyles from './SidebarPanel.module.css';
import type { SidebarAccountMode, SidebarNestedMode } from './SidebarPanel.context';

function stubViewport(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: narrow, addEventListener: () => {}, removeEventListener: () => {} }));
}

interface ExampleProps extends AppShellProps {
  accountMode?: SidebarAccountMode;
  nestedMode?: SidebarNestedMode;
  panelStyle?: CSSProperties;
  panelWidth?: number | string;
  withItems?: boolean;
}

function Example({ accountMode, nestedMode, panelStyle, panelWidth, withItems = true, ...props }: ExampleProps) {
  return (
    <AppShell {...props}>
      <Sidebar>
        <Sidebar.Rail
          footer={<Sidebar.RailAccount label="Conta: Suporte">RM</Sidebar.RailAccount>}
        >
          <Sidebar.RailItem current href="/vendas" icon="V" label="Vendas" />
          <Sidebar.RailItem href="/clientes" icon="C" label="Clientes" />
        </Sidebar.Rail>
        <Sidebar.Panel
          account={
            <Sidebar.Account avatar="MD" description="Mecânica Irmãos Duarte" name="Suporte">
              <Sidebar.Item href="/favoritos" label="Favoritos" />
            </Sidebar.Account>
          }
          accountMode={accountMode}
          brand="Gestor"
          label="Vendas"
          nestedMode={nestedMode}
          style={panelStyle}
          width={panelWidth}
        >
          {withItems && (
            <Sidebar.Group label="Operação">
              <Sidebar.Item current href="/pedidos" label="Pedidos" />
              <Sidebar.Item label="Painéis">
                <Sidebar.Item href="/paineis/geral" label="Geral" />
                <Sidebar.Item current href="/paineis/vendas" label="Vendas" />
              </Sidebar.Item>
              <Sidebar.Item external href="https://exemplo.com" label="Ajuda" />
            </Sidebar.Group>
          )}
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

describe('Sidebar', () => {
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
        <Sidebar>
          <Sidebar.Rail>
            <Sidebar.RailItem as={LinkDaApp} href="/inicio" icon="I" label="Início" />
          </Sidebar.Rail>
        </Sidebar>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('data-roteador', 'app');
  });

  describe('submenu', () => {
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
          <Sidebar>
            <Sidebar.Panel label="Vendas">
              <Sidebar.Item expanded={false} label="Painéis" onExpandedChange={onExpandedChange}>
                <Sidebar.Item href="/geral" label="Geral" />
              </Sidebar.Item>
            </Sidebar.Panel>
          </Sidebar>
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

    it('cobrindo a lista, esconde a lista do módulo e mostra as opções como itens, sem cabeçalho de identidade', () => {
      render(<Example accountMode="cover" />);
      fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

      const conta = screen.getByRole('navigation', { name: 'Conta' });
      expect(screen.getByRole('navigation', { name: 'Vendas' })).toHaveAttribute('data-covered', 'true');
      expect(within(conta).getByRole('link', { name: 'Favoritos' })).toBeVisible();
      expect(within(conta).queryByText('Mecânica Irmãos Duarte')).not.toBeInTheDocument();
    });

    it('cobrindo a lista, as opções não levam cartão: sem borda, fundo nem sombra', () => {
      const regras = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

      expect(regras.get(".account[data-mode='cover'] .accountNav")).toMatchObject({
        border: '0',
        background: 'none',
        'box-shadow': 'none',
      });
    });

    it('na altura das opções, o cartão fica por cima da lista, sem empurrá-la nem encolhê-la', () => {
      const regras = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

      expect(regras.get('.accountCard')).toMatchObject({ position: 'absolute', bottom: '100%', left: '0', right: '0' });
      expect(regras.get('.account')).toMatchObject({ position: 'relative', flex: 'none' });
      expect(regras.get('.accountNav')).toMatchObject({ 'box-shadow': 'var(--pl-sh-up)', background: 'var(--pl-color-surface)' });
      expect(regras.get('.list')?.flex).toBe('1');
    });

    it('o cartão fechado some só pela opacidade e pelo inert, para o foco entrar nele ao abrir', () => {
      const regras = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

      expect(regras.get('.accountNav')).not.toHaveProperty('visibility');
      expect(regras.get(".account[data-open='true'] .accountNav")).not.toHaveProperty('visibility');
    });

    it('clicar fora do cartão, dentro do submenu, fecha a conta, sem prender o foco', () => {
      render(<Example />);
      const trigger = screen.getByRole('button', { name: /Suporte/ });
      fireEvent.click(trigger);
      const conta = screen.getByRole('navigation', { name: 'Conta' });

      fireEvent.click(within(conta).getByRole('link', { name: 'Favoritos' }).closest('ul')!);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(screen.getByText('Operação'));

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(conta.parentElement).toHaveAttribute('inert');
    });

    it('com o cartão aberto, uma camada transparente cobre o submenu por baixo do cartão: o clique fora só fecha a conta', () => {
      const { container } = render(<Example />);
      expect(container.querySelector(`.${panelStyles.accountShield}`)).toBeNull();

      const trigger = screen.getByRole('button', { name: /Suporte/ });
      fireEvent.click(trigger);
      const camada = container.querySelector(`.${panelStyles.accountShield}`)!;
      const submenu = screen.getByRole('navigation', { name: 'Vendas' });
      const conta = trigger.parentElement!;

      expect(camada).toHaveAttribute('aria-hidden', 'true');
      expect(camada.parentElement).toBe(submenu.parentElement);
      expect(submenu.compareDocumentPosition(camada) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(camada.compareDocumentPosition(conta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      fireEvent.click(camada);

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(container.querySelector(`.${panelStyles.accountShield}`)).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('a camada do clique fora não aparece com a conta cobrindo a lista', () => {
      const { container } = render(<Example accountMode="cover" />);
      fireEvent.click(screen.getByRole('button', { name: /Suporte/ }));

      expect(container.querySelector(`.${panelStyles.accountShield}`)).toBeNull();
    });

    it('a camada do clique fora ocupa o submenu inteiro, sem cor, e fica por baixo do cartão', () => {
      const regras = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

      expect(regras.get('.inner')?.position).toBe('relative');
      expect(regras.get('.accountShield')).toMatchObject({ position: 'absolute', inset: '0' });
      expect(regras.get('.accountShield')).not.toHaveProperty('background');
      expect(regras.get('.accountCard')?.['z-index']).toBe('1');
    });

    it('com a conta cobrindo, o clique fora do bloco não a fecha', () => {
      render(<Example accountMode="cover" />);
      const trigger = screen.getByRole('button', { name: /Suporte/ });
      fireEvent.click(trigger);

      fireEvent.click(screen.getByText('Gestor'));

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
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
            <Sidebar>
              <Sidebar.Rail>
                <Sidebar.RailItem current={module === 'vendas'} icon="V" label="Vendas" onClick={() => setModule('vendas')} />
                <Sidebar.RailItem current={module === 'inicio'} icon="I" label="Início" onClick={() => setModule('inicio')} />
              </Sidebar.Rail>
              {module === 'vendas' && (
                <Sidebar.Panel label="Vendas">
                  <Sidebar.Item href="/pedidos" label="Pedidos" />
                </Sidebar.Panel>
              )}
            </Sidebar>
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

  describe('estilo dos itens', () => {
    const painel = () => regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');
    const moldura = () => regrasDaFolha('src/components/navigation/Sidebar/Sidebar.module.css');

    it('trilho e submenu andam na grade de 34px mais 2px', () => {
      expect(moldura().get('.railItem, .railAccount')).toMatchObject({ width: 'var(--sidebar-row, var(--_sidebar-row))', height: 'var(--sidebar-row, var(--_sidebar-row))' });
      expect(painel().get('.item')?.height).toBe('var(--sidebar-row, var(--_sidebar-row))');
      expect(painel().get('.nested .item')?.height).toBeUndefined();
      expect(painel().get('.items')?.gap).toBe('2px');
      expect(painel().get('.back')?.height).toBe('var(--sidebar-row, var(--_sidebar-row))');
    });

    it('a marca do trilho e o cabeçalho começam na mesma altura, com 24px até o conteúdo', () => {
      expect(moldura().get('.rail')?.padding).toBe('9px 0 8px');
      expect(painel().get('.inner')).toMatchObject({ 'padding-block': '10px 4px', 'padding-left': '12px', 'padding-right': '8px' });
      expect(moldura().get('.brand')?.['margin-bottom']).toBe('24px');
      expect(painel().get('.head')?.['margin-bottom']).toBe('24px');
    });

    it('as medidas vêm de variáveis, com os padrões do modelo', () => {
      expect(moldura().get('.rail')?.width).toBe('var(--sidebar-rail-width, 56px)');
      expect(moldura().get('.railItem, .railAccount')?.['font-size']).toBe('var(--sidebar-rail-icon-size, 20px)');
      expect(moldura().get('.menuSurface.menuSurface')?.width).toBe('var(--sidebar-drawer-width, auto)');
      expect(painel().get('.icon')?.['font-size']).toBe('var(--sidebar-icon-size, 18px)');
      expect(painel().get('.head')?.height).toBe('var(--sidebar-brand-size, var(--_sidebar-head))');
      expect(painel().get('.accountAvatar.accountAvatar > *')?.width).toBe('var(--sidebar-avatar-size, 40px)');
      expect(regrasDaFolha('src/components/navigation/Sidebar/SidebarBrand.module.css').get('.railBrand')?.width).toBe(
        'var(--sidebar-brand-size, 36px)',
      );
    });

    it('o título de grupo ocupa uma linha de 34px, em negrito, na cor do texto e sem caixa alta', () => {
      const titulo = painel().get('.groupTitle')!;

      expect(titulo).toMatchObject({
        height: 'var(--sidebar-row, var(--_sidebar-row))',
        'padding-bottom': '6px',
        'font-size': '13px',
        'font-weight': '700',
        color: 'var(--pl-color-text)',
      });
      expect(titulo['text-transform']).toBeUndefined();
      expect(titulo['letter-spacing']).toBeUndefined();
    });

    it('o ativo do submenu leva fundo leve e barra solta, sem borda nem sombra', () => {
      const ativo = painel().get(".item[aria-current='page']")!;

      expect(ativo).toMatchObject({ background: 'var(--pl-color-primary-tint)', color: 'var(--pl-color-on-primary-container)' });
      expect(ativo['box-shadow']).toBeUndefined();
      expect(painel().get(".item[aria-current='page']::before")).toMatchObject({
        left: '-8px',
        top: 'calc((var(--sidebar-row, var(--_sidebar-row)) - 20px) / 2)',
        bottom: 'calc((var(--sidebar-row, var(--_sidebar-row)) - 20px) / 2)',
        width: '3px',
        background: 'var(--pl-color-primary-strong)',
      });
      expect(painel().get(".nested .item[aria-current='page']::before")?.left).toBe('-6px');
    });

    it('o hover do submenu e do trilho tinge de leve e mantém o texto na cor normal', () => {
      expect(painel().get('.item:hover')).toMatchObject({ background: 'var(--pl-color-primary-tint-hover)', color: 'var(--pl-color-text)' });
      expect(moldura().get('.railItem:hover')).toMatchObject({ background: 'var(--pl-color-primary-tint-hover)', color: 'var(--pl-color-text)' });
    });

    it('pressionar o item do submenu e do trilho usa o fundo do ativo, sem valer no atual nem no desabilitado', () => {
      const pressionado = { background: 'var(--pl-color-primary-tint)', color: 'var(--pl-color-text)' };

      expect(painel().get(".item:not([aria-current='page']):not(:disabled):not([aria-disabled='true']):active")).toEqual(pressionado);
      expect(moldura().get(".railItem:not([aria-current='page']):not(:disabled):not([aria-disabled='true']):active")).toEqual(pressionado);
    });

    it('o ativo do trilho usa o fundo leve do submenu, sem barra', () => {
      const ativo = moldura().get(".railItem[aria-current='page']")!;

      expect(ativo).toMatchObject({ background: 'var(--pl-color-primary-tint)', color: 'var(--pl-color-on-primary-container)' });
      expect(moldura().get(".railItem[aria-current='page']::before")).toBeUndefined();
    });

    it('o pai recolhido com filho ativo marca o caminho só pelo texto e pelo ícone, sem fundo', () => {
      const pai = painel().get(".branch:not([data-expanded='true']):has([aria-current='page']) > .item")!;

      expect(pai).toEqual({ color: 'var(--pl-color-on-primary-container)' });
    });
  });

  describe('largura do submenu', () => {
    const painel = () => screen.getByRole('navigation', { name: 'Vendas' }).closest<HTMLElement>('[data-visible]')!;

    it('tem 256px por padrão, no painel aberto e no conteúdo, lidos da mesma variável', () => {
      const regras = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

      expect(regras.get(".panel[data-visible='true']")?.width).toBe('var(--sidebar-panel-width, 256px)');
      expect(regras.get('.inner')?.width).toBe('var(--sidebar-panel-width, 256px)');
    });

    it('na gaveta, o painel cede para caber ao lado do trilho, e o conteúdo acompanha', () => {
      const regras = regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

      expect(regras.get('.panel.narrow')).toMatchObject({ 'flex-shrink': '1', 'min-width': '0' });
      expect(regras.get('.narrow .inner')?.['max-width']).toBe('100%');
      expect(regras.get('.panel')?.['max-width']).toBeUndefined();
      expect(regras.get('.inner')?.['max-width']).toBeUndefined();
    });

    it('aceita número em pixels e medida em texto', () => {
      const { unmount } = render(<Example />);
      expect(painel().style.getPropertyValue('--sidebar-panel-width')).toBe('');
      unmount();

      const numerico = render(<Example panelWidth={280} />);
      expect(painel().style.getPropertyValue('--sidebar-panel-width')).toBe('280px');
      numerico.unmount();

      render(<Example panelWidth="18rem" />);
      expect(painel().style.getPropertyValue('--sidebar-panel-width')).toBe('18rem');
    });

    it('preserva o style do consumidor, e o width prevalece sobre a variável passada nele', () => {
      render(<Example panelStyle={{ color: 'red', '--sidebar-panel-width': '200px' } as CSSProperties} panelWidth={300} />);

      expect(painel().style.color).toBe('red');
      expect(painel().style.getPropertyValue('--sidebar-panel-width')).toBe('300px');
    });

    it('vale também na gaveta do celular', () => {
      stubViewport(true);
      render(<Example panelWidth={280} />);
      fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

      expect(within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('navigation', { name: 'Vendas' })).toBeInTheDocument();
      expect(painel().style.getPropertyValue('--sidebar-panel-width')).toBe('280px');
      expect(painel()).toHaveClass(panelStyles.narrow!);
    });
  });
});
