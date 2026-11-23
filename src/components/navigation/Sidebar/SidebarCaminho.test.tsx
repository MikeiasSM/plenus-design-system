import { createRef, useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { AppShell } from '../AppShell';
import { Sidebar } from './Sidebar';
import { useSidebarContext } from './Sidebar.context';
import { SidebarProvider } from './SidebarProvider';
import type { SidebarPanelProps } from './SidebarPanel';

function stubViewport(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: narrow, addEventListener: () => {}, removeEventListener: () => {} }));
}

afterEach(() => vi.unstubAllGlobals());

type Atual = 'pedidos' | 'geral' | 'norte';

interface ArvoreProps extends Partial<Omit<SidebarPanelProps, 'children'>> {
  atual?: Atual;
}

/** O módulo com dois níveis de ramos, cada um com `value`. */
function Arvore({ atual = 'pedidos', label = 'Vendas', nestedMode = 'stack', ...props }: ArvoreProps) {
  return (
    <AppShell>
      <Sidebar>
        <Sidebar.Panel label={label} nestedMode={nestedMode} {...props}>
          <Sidebar.Group label="Operação">
            <Sidebar.Item current={atual === 'pedidos'} href="/pedidos" label="Pedidos" />
            <Sidebar.Item label="Painéis" value="paineis">
              <Sidebar.Item current={atual === 'geral'} href="/paineis/geral" label="Geral" />
              <Sidebar.Item label="Regiões" value="regioes">
                <Sidebar.Item current={atual === 'norte'} href="/paineis/regioes/norte" label="Norte" />
              </Sidebar.Item>
            </Sidebar.Item>
          </Sidebar.Group>
        </Sidebar.Panel>
      </Sidebar>
    </AppShell>
  );
}

describe('Sidebar.Panel: caminho da pilha', () => {
  it('defaultEnteredPath começa no nível pedido, sem mover o foco', () => {
    render(<Arvore defaultEnteredPath={['paineis', 'regioes']} />);

    expect(screen.getByRole('link', { name: 'Norte' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Painéis' })).toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });

  it('não controlado, avisa cada mudança do caminho', () => {
    const onEnteredPathChange = vi.fn();
    render(<Arvore onEnteredPathChange={onEnteredPathChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Regiões' }));
    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));

    expect(onEnteredPathChange.mock.calls).toEqual([[['paineis']], [['paineis', 'regioes']], [['paineis']]]);
  });

  it('controlado, só muda quando o pai muda', () => {
    const onEnteredPathChange = vi.fn();
    render(<Arvore enteredPath={['paineis']} onEnteredPathChange={onEnteredPathChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Regiões' }));

    expect(onEnteredPathChange).toHaveBeenCalledWith(['paineis', 'regioes']);
    expect(screen.getByRole('link', { name: 'Geral' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Norte' })).not.toBeInTheDocument();
  });

  it('controlado por um pai que segue os avisos, entra e volta com o foco no lugar', () => {
    function Controlado() {
      const [caminho, setCaminho] = useState<string[]>([]);
      return (
        <>
          <output data-testid="caminho">{caminho.join(' › ')}</output>
          <Arvore enteredPath={caminho} onEnteredPathChange={setCaminho} />
        </>
      );
    }
    render(<Controlado />);

    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Regiões' }));

    expect(screen.getByTestId('caminho')).toHaveTextContent('paineis › regioes');
    expect(screen.getByRole('link', { name: 'Norte' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Painéis' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));

    expect(screen.getByRole('button', { name: 'Regiões' })).toHaveFocus();
  });

  it('o pai pode levar a pilha a outro nível pelo código, sem mover o foco', () => {
    const { rerender } = render(<Arvore enteredPath={[]} />);
    screen.getByRole('link', { name: 'Pedidos' }).focus();

    rerender(<Arvore enteredPath={['paineis', 'regioes']} />);

    expect(screen.getByRole('link', { name: 'Norte' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Painéis' })).not.toHaveFocus();
  });

  it('sem nestedMode stack, o caminho não esconde nada', () => {
    render(<Arvore defaultEnteredPath={['paineis']} nestedMode="expand" />);

    expect(screen.getByRole('link', { name: 'Pedidos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Painéis' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('o value do item segue ao elemento, como antes', () => {
    render(<Arvore />);

    expect(screen.getByRole('button', { name: 'Painéis' })).toHaveAttribute('value', 'paineis');
  });
});

describe('Sidebar.Panel: followCurrent', () => {
  function Seguindo({ followCurrent = true }: { followCurrent?: boolean }) {
    const [atual, setAtual] = useState<Atual>('pedidos');
    return (
      <>
        <button onClick={() => setAtual('norte')} type="button">
          Ir para Norte
        </button>
        <button onClick={() => setAtual('pedidos')} type="button">
          Ir para Pedidos
        </button>
        <Arvore atual={atual} followCurrent={followCurrent} />
      </>
    );
  }

  it('ao mudar o item atual, o caminho vai ao pai dele, mesmo de fora da pilha', () => {
    render(<Seguindo />);

    fireEvent.click(screen.getByRole('button', { name: 'Ir para Norte' }));

    expect(screen.getByRole('link', { name: 'Norte' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Norte' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Ir para Pedidos' }));

    expect(screen.getByRole('link', { name: 'Pedidos' })).toBeVisible();
  });

  it('na montagem, abre no pai do item atual', () => {
    render(<Arvore atual="geral" followCurrent />);

    expect(screen.getByRole('link', { name: 'Geral' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Pedidos' })).not.toBeInTheDocument();
  });

  it('desligado por padrão: o caminho fica onde está', () => {
    render(<Seguindo followCurrent={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ir para Norte' }));

    expect(screen.getByRole('link', { name: 'Pedidos' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Norte' })).toBeNull();
  });
});

describe('Sidebar: header no trilho e no submenu', () => {
  it('o header do submenu fica entre a marca e a lista, fora da rolagem, e some com a conta cobrindo', () => {
    render(
      <Arvore
        account={
          <Sidebar.Account avatar="MD" name="Suporte">
            <Sidebar.Item href="/favoritos" label="Favoritos" />
          </Sidebar.Account>
        }
        accountMode="cover"
        brand="Gestor"
        header={<input aria-label="Buscar no módulo" />}
      />,
    );
    const busca = screen.getByRole('textbox', { name: 'Buscar no módulo' });
    const submenu = screen.getByRole('navigation', { name: 'Vendas' });
    const lista = submenu.querySelector('[data-part="list"]')!;

    expect(submenu).toContainElement(busca);
    expect(lista).not.toContainElement(busca);
    expect(screen.getByText('Gestor').compareDocumentPosition(busca) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(busca.compareDocumentPosition(lista) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css').get(".navigation[data-covered='true'] .header")).toEqual({
      display: 'none',
    });
  });

  it('o header do trilho é um grupo antes dos módulos, e sem ele o trilho fica como antes', () => {
    const { unmount } = render(
      <AppShell>
        <Sidebar>
          <Sidebar.Rail header={<Sidebar.RailItem icon="B" label="Buscar" />}>
            <Sidebar.RailItem icon="V" label="Vendas" />
          </Sidebar.Rail>
        </Sidebar>
      </AppShell>,
    );
    const trilho = screen.getByRole('navigation', { name: 'Módulos' });
    const [cabeca, modulos] = within(trilho).getAllByRole('list');

    expect(within(cabeca!).getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    expect(within(modulos!).getByRole('button', { name: 'Vendas' })).toBeInTheDocument();
    unmount();

    render(
      <AppShell>
        <Sidebar>
          <Sidebar.Rail>
            <Sidebar.RailItem icon="V" label="Vendas" />
          </Sidebar.Rail>
        </Sidebar>
      </AppShell>,
    );
    expect(within(screen.getByRole('navigation', { name: 'Módulos' })).getAllByRole('list')).toHaveLength(2);
  });
});

describe('Sidebar: data-part', () => {
  it('marca a lista, o grupo, o título, o ramo, o item e o voltar', () => {
    render(<Arvore />);
    const submenu = screen.getByRole('navigation', { name: 'Vendas' });

    expect(submenu.querySelector('[data-part="list"]')?.tagName).toBe('UL');
    expect(submenu.querySelector('[data-part="group"]')).toHaveTextContent('Operação');
    expect(submenu.querySelector('[data-part="group-title"]')).toHaveTextContent('Operação');
    expect(screen.getByRole('link', { name: 'Pedidos' })).toHaveAttribute('data-part', 'item');
    expect(screen.getByRole('button', { name: 'Painéis' })).toHaveAttribute('data-part', 'item');
    expect(screen.getByRole('button', { name: 'Painéis' }).parentElement).toHaveAttribute('data-part', 'branch');

    fireEvent.click(screen.getByRole('button', { name: 'Painéis' }));

    expect(screen.getByRole('button', { name: 'Vendas' })).toHaveAttribute('data-part', 'back');
  });

  it('o ramo expandido no lugar também leva branch e item', () => {
    render(<Arvore nestedMode="expand" />);

    expect(screen.getByRole('button', { name: 'Painéis' })).toHaveAttribute('data-part', 'item');
    expect(screen.getByRole('button', { name: 'Painéis' }).parentElement).toHaveAttribute('data-part', 'branch');
  });
});

describe('Sidebar: propriedades da raiz', () => {
  function Raiz() {
    const ref = createRef<HTMLDivElement>();
    const resultado = render(
      <AppShell>
        <Sidebar className="minha" data-palette="custom" ref={ref} style={{ color: 'red' }}>
          <Sidebar.Rail>
            <Sidebar.RailItem icon="V" label="Vendas" />
          </Sidebar.Rail>
          <Sidebar.Panel label="Vendas">
            <Sidebar.Item href="/pedidos" label="Pedidos" />
          </Sidebar.Panel>
        </Sidebar>
        <AppShell.Page>
          <AppShell.PageBar />
        </AppShell.Page>
      </AppShell>,
    );
    return { ...resultado, ref };
  }

  it('na largura larga, vão ao elemento que reúne trilho e submenu', () => {
    const { ref } = Raiz();
    const raiz = screen.getByRole('navigation', { name: 'Módulos' }).parentElement!;

    expect(raiz).toHaveClass('minha');
    expect(raiz.className).toMatch(/navigation/);
    expect(raiz).toHaveAttribute('data-palette', 'custom');
    expect(raiz.style.color).toBe('red');
    expect(ref.current).toBe(raiz);
  });

  it('na largura estreita, vão à superfície da gaveta', () => {
    stubViewport(true);
    const { ref } = Raiz();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const gaveta = screen.getByRole('dialog', { name: 'Menu' });

    expect(gaveta).toHaveClass('minha');
    expect(gaveta.className).toMatch(/menuSurface/);
    expect(gaveta).toHaveAttribute('data-palette', 'custom');
    expect(gaveta.style.color).toBe('red');
    expect(ref.current).toBe(gaveta);
  });
});

describe('Sidebar: variáveis de aparência', () => {
  const painel = () => regrasDaFolha('src/components/navigation/Sidebar/SidebarPanel.module.css');

  it('lê as variáveis com os valores de antes como reserva, sem declará-las na raiz', () => {
    expect(painel().get('.icon')?.color).toBe('var(--sidebar-icon-color, currentColor)');
    expect(painel().get('.item')?.['font-weight']).toBe('var(--sidebar-item-weight, var(--pl-type-label-weight))');
    expect(painel().get('.branch > .item')?.['font-weight']).toBe(
      'var(--sidebar-branch-weight, var(--sidebar-item-weight, var(--pl-type-label-weight)))',
    );
    expect(painel().get('.nested .branch > .item')?.['font-weight']).toBe('var(--sidebar-branch-weight, var(--pl-type-body-weight))');
    expect(painel().get('.panel')).not.toHaveProperty('--sidebar-icon-color');
    expect(painel().get('.panel')).not.toHaveProperty('--sidebar-stack-offset');
  });

  it('a conta cobrindo a lista entra com o mesmo movimento da pilha, espelhado à direita e parado com movimento reduzido', () => {
    const folha = painel();

    expect(folha.get(".account[data-mode='cover'][data-open='true'] .accountCard")).toMatchObject({
      animation: 'stack-in var(--pl-speed-2) var(--pl-ease)',
    });
    expect(folha.get(".panel[data-side='right'] .account[data-mode='cover'][data-open='true'] .accountCard")).toEqual({
      'animation-name': 'stack-in-end',
    });
    expect(
      folha.get(
        ".account[data-mode='cover'][data-open='true'] .accountCard, .panel[data-side='right'] .account[data-mode='cover'][data-open='true'] .accountCard, .stacked",
      ),
    ).toEqual({ animation: 'none' });
  });
});

describe('SidebarProvider: narrowBelow no contexto', () => {
  function Leitor() {
    const { narrowBelow } = useSidebarContext();
    return <output>{narrowBelow === undefined ? 'padrão' : narrowBelow}</output>;
  }

  it('expõe o valor passado, e indefinido sem ele', () => {
    const { unmount } = render(
      <SidebarProvider narrowBelow={1024}>
        <Leitor />
      </SidebarProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('1024');
    unmount();

    render(
      <SidebarProvider>
        <Leitor />
      </SidebarProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('padrão');
  });
});
