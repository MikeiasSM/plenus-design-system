import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { SidebarProvider } from './SidebarProvider';
import type { SidebarBrandProps } from './SidebarBrand';
import { readSidebarBrandTheme } from './SidebarBrand.theme';

// O jsdom não resolve `light-dark()`: a leitura do tema vira o `data-theme` mais próximo, como a sonda faria.
// O aviso de troca é o de verdade.
vi.mock('./SidebarBrand.theme', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./SidebarBrand.theme')>()),
  readSidebarBrandTheme: vi.fn((probe: HTMLElement) =>
    probe.closest('[data-theme]')?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
  ),
}));

const logo = <svg data-testid="logo" />;
const wordmark = { dark: <img alt="" data-testid="wordmark-escuro" src="escuro.svg" />, light: <img alt="" data-testid="wordmark-claro" src="claro.svg" /> };

function noTrilho(brand: ReactNode) {
  return render(
    <SidebarProvider>
      <Sidebar>
        <Sidebar.Rail brand={brand} />
      </Sidebar>
    </SidebarProvider>,
  );
}

function noSubmenu(brand: ReactNode, wrapper?: (children: ReactNode) => ReactNode) {
  const painel = (
    <Sidebar.Panel brand={brand} label="Vendas">
      <Sidebar.Item label="Pedidos" />
    </Sidebar.Panel>
  );

  return render(
    <SidebarProvider>
      <Sidebar>{wrapper ? wrapper(painel) : painel}</Sidebar>
    </SidebarProvider>,
  );
}

function marca(props: Partial<SidebarBrandProps> = {}) {
  return <Sidebar.Brand description="by Plenustech" logo={logo} name="Gestor" {...props} />;
}

describe('Sidebar.Brand', () => {
  describe('no trilho', () => {
    it('mostra só o símbolo, como imagem nomeada pelo nome', () => {
      noTrilho(marca());

      expect(screen.getByRole('img', { name: 'Gestor' })).toBeInTheDocument();
      expect(screen.getByTestId('logo')).toBeInTheDocument();
      expect(screen.queryByText('by Plenustech')).not.toBeInTheDocument();
    });

    it('com href, é um link nomeado pelo nome, com a dica do nome', () => {
      vi.useFakeTimers();
      noTrilho(marca({ href: '/inicio' }));
      const link = screen.getByRole('link', { name: 'Gestor' });

      expect(link).toHaveAttribute('href', '/inicio');
      expect(screen.queryByRole('img', { name: 'Gestor' })).not.toBeInTheDocument();

      fireEvent.mouseEnter(link);
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByRole('tooltip')).toHaveTextContent('Gestor');
      vi.useRealTimers();
    });

    it('entrega o link ao componente da aplicação', () => {
      const Link = ({ to, ...props }: { to?: string }) => <a {...props} data-to={to} href={to} />;
      noTrilho(marca({ as: Link, linkProps: { to: '/inicio' } }));

      expect(screen.getByRole('link', { name: 'Gestor' })).toHaveAttribute('data-to', '/inicio');
    });

    it.each([undefined, null])('sem logo (%s), não renderiza nada', (semLogo) => {
      noTrilho(marca({ logo: semLogo }));

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: 'Módulos' }).firstElementChild).toBeEmptyDOMElement();
    });

    it('com as, mas sem href nem linkProps, não é link e não leva o as ao DOM', () => {
      const erro = vi.spyOn(console, 'error').mockImplementation(() => {});
      const Link = (props: object) => <a {...props} />;
      noTrilho(marca({ as: Link }));

      expect(screen.getByRole('img', { name: 'Gestor' })).toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(erro).not.toHaveBeenCalled();
      erro.mockRestore();
    });

    it('com logoFrame, o símbolo fica no quadro; sem ele, puro', () => {
      const { rerender } = noTrilho(marca());
      expect(screen.getByTestId('logo').parentElement?.className).toMatch(/framed/);

      rerender(
        <SidebarProvider>
          <Sidebar>
            <Sidebar.Rail brand={marca({ logoFrame: false })} />
          </Sidebar>
        </SidebarProvider>,
      );
      expect(screen.getByTestId('logo').parentElement?.className).not.toMatch(/framed/);
    });
  });

  describe('no submenu', () => {
    it('mostra o nome e a descrição, sem o símbolo', () => {
      noSubmenu(marca());

      expect(screen.getByText('Gestor')).toBeVisible();
      expect(screen.getByText('by Plenustech')).toBeVisible();
      expect(screen.queryByTestId('logo')).not.toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'Gestor' })).not.toBeInTheDocument();
    });

    it('com href, o texto é um link para o início da aplicação', () => {
      noSubmenu(marca({ href: '/inicio' }));

      expect(screen.getByRole('link', { name: /Gestor/ })).toHaveAttribute('href', '/inicio');
    });

    it('com wordmark, mostra o logotipo e deixa o nome só para o leitor de tela', () => {
      noSubmenu(marca({ wordmark }));

      expect(screen.getByTestId('wordmark-claro').closest('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.getByText('Gestor')).toBeInTheDocument();
      expect(screen.getByText('Gestor').closest('[aria-hidden="true"]')).toBeNull();
      expect(screen.queryByText('by Plenustech')).not.toBeInTheDocument();
    });

    it('fora do trilho e do submenu, vale a forma do submenu', () => {
      render(marca());

      expect(screen.getByText('Gestor')).toBeInTheDocument();
      expect(screen.queryByTestId('logo')).not.toBeInTheDocument();
    });
  });

  describe('wordmark por tema', () => {
    it('mostra a versão clara por padrão', () => {
      noSubmenu(marca({ wordmark }));

      expect(screen.getByTestId('wordmark-claro')).toBeInTheDocument();
      expect(screen.queryByTestId('wordmark-escuro')).not.toBeInTheDocument();
    });

    it('mostra a versão escura sob um ancestral com data-theme="dark"', () => {
      noSubmenu(marca({ wordmark }), (painel) => <div data-theme="dark">{painel}</div>);

      expect(screen.getByTestId('wordmark-escuro')).toBeInTheDocument();
      expect(screen.queryByTestId('wordmark-claro')).not.toBeInTheDocument();
    });

    it('troca o logotipo quando o tema muda em tempo de execução', async () => {
      noSubmenu(marca({ wordmark }), (painel) => (
        <div data-testid="tema" data-theme="light">
          {painel}
        </div>
      ));
      expect(screen.getByTestId('wordmark-claro')).toBeInTheDocument();

      act(() => {
        screen.getByTestId('tema').setAttribute('data-theme', 'dark');
      });

      expect(await screen.findByTestId('wordmark-escuro')).toBeInTheDocument();
      expect(screen.queryByTestId('wordmark-claro')).not.toBeInTheDocument();
    });

    it('sem a versão escura, a clara vale nos dois temas e a leitura do tema não é feita', () => {
      vi.mocked(readSidebarBrandTheme).mockClear();
      noSubmenu(marca({ wordmark: { light: wordmark.light } }), (painel) => <div data-theme="dark">{painel}</div>);

      expect(screen.getByTestId('wordmark-claro')).toBeInTheDocument();
      expect(readSidebarBrandTheme).not.toHaveBeenCalled();
    });
  });

  describe('propriedades repassadas', () => {
    it('leva className e propriedades nativas ao elemento raiz, no trilho e no submenu', () => {
      const { unmount } = noTrilho(marca({ className: 'minha-marca', 'data-teste': 'raiz' } as Partial<SidebarBrandProps>));
      expect(screen.getByRole('img', { name: 'Gestor' })).toHaveClass('minha-marca');
      expect(screen.getByRole('img', { name: 'Gestor' })).toHaveAttribute('data-teste', 'raiz');
      unmount();

      noSubmenu(marca({ className: 'minha-marca', 'data-teste': 'raiz' } as Partial<SidebarBrandProps>));
      expect(screen.getByText('Gestor').closest('[data-teste="raiz"]')).toHaveClass('minha-marca');
    });
  });
});
