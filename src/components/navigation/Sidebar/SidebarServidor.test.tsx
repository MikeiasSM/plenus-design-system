import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { Sidebar } from './Sidebar';
import { SidebarProvider, type SidebarProviderProps } from './SidebarProvider';

function Navigation({ side }: Pick<SidebarProviderProps, 'side'>) {
  return (
    <SidebarProvider defaultAccountOpen defaultMenuOpen defaultOpen={false} side={side}>
      <Sidebar>
        <Sidebar.Rail footer={<Sidebar.RailAccount label="Conta">RM</Sidebar.RailAccount>}>
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
          <Sidebar.Item current href="/pedidos" label="Pedidos" />
          <Sidebar.Item label="Painéis">
            <Sidebar.Item href="/paineis/geral" label="Geral" />
          </Sidebar.Item>
        </Sidebar.Panel>
      </Sidebar>
      <Sidebar.Trigger />
    </SidebarProvider>
  );
}

function stubViewport(narrow: boolean) {
  vi.stubGlobal('matchMedia', () => ({ matches: narrow, addEventListener: () => {}, removeEventListener: () => {} }));
}

async function hydrate(side?: SidebarProviderProps['side']) {
  const container = document.createElement('div');
  container.innerHTML = renderToString(<Navigation side={side} />);
  document.body.append(container);

  let raiz!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    raiz = hydrateRoot(container, <Navigation side={side} />);
  });

  return {
    container,
    descartar: async () => {
      await act(async () => raiz.unmount());
      container.remove();
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('Sidebar: renderização no servidor', () => {
  it('com a conta e a gaveta abertas no início, o servidor renderiza o bloco da conta aberto', () => {
    const html = renderToString(<Navigation />);

    expect(html).toContain('Suporte');
    expect(html).toContain('aria-expanded="true"');
  });

  it.each([false, true])('a hidratação não diverge nem avisa (largura estreita: %s)', async (narrow) => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubViewport(narrow);

    const { container, descartar } = await hydrate();

    expect(erro).not.toHaveBeenCalled();
    expect(document.body.querySelector(narrow ? '[role="dialog"]' : '[aria-expanded="true"]')).not.toBeNull();

    await descartar();
    erro.mockRestore();
  });

  it('com a conta aberta no início e a gaveta fechada, a hidratação na largura estreita abre a gaveta, como no cliente', async () => {
    stubViewport(true);
    const container = document.createElement('div');
    const conta = (
      <SidebarProvider defaultAccountOpen defaultOpen={false}>
        <Sidebar>
          <Sidebar.Panel
            account={
              <Sidebar.Account avatar="MD" name="Suporte">
                <Sidebar.Item href="/favoritos" label="Favoritos" />
              </Sidebar.Account>
            }
            label="Vendas"
          >
            <Sidebar.Item current href="/pedidos" label="Pedidos" />
          </Sidebar.Panel>
        </Sidebar>
      </SidebarProvider>
    );
    container.innerHTML = renderToString(conta);
    document.body.append(container);

    let raiz!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      raiz = hydrateRoot(container, conta);
    });

    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();

    await act(async () => raiz.unmount());
    container.remove();
  });

  it('com side right, a hidratação também não diverge', async () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container, descartar } = await hydrate('right');

    expect(erro).not.toHaveBeenCalled();
    expect(container.querySelector('[data-side="right"]')).not.toBeNull();

    await descartar();
    erro.mockRestore();
  });
});
