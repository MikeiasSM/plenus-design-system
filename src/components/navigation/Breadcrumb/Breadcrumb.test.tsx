import { fireEvent, render, screen } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

const trilha = [
  { label: 'Inicio', href: '/' },
  { label: 'Modulos', href: '/modulos' },
  { label: 'Faturamento' },
];

describe('Breadcrumb', () => {
  it('nomeia a navegacao e lista a trilha em ordem', () => {
    render(<Breadcrumb items={trilha} />);

    const nav = screen.getByRole('navigation', { name: 'Trilha de navegação' });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('marca o ultimo item como pagina atual e nao o transforma em link', () => {
    render(<Breadcrumb items={trilha} />);

    expect(screen.getByText('Faturamento')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Faturamento' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Modulos' })).toHaveAttribute('href', '/modulos');
  });

  it('aceita o componente de link da aplicacao, sem acoplar a um roteador', () => {
    function LinkDaApp({ href, children, ...props }: { href: string; children: React.ReactNode }) {
      return <a data-roteador="app" href={href} {...props}>{children}</a>;
    }

    render(<Breadcrumb as={LinkDaApp} items={trilha} />);

    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('data-roteador', 'app');
  });

  it('gera o link so com linkProps, para o roteador que pede to em vez de href', () => {
    function LinkComTo({ to, children, ...props }: { to: string; children: React.ReactNode }) {
      return <a {...props} href={to}>{children}</a>;
    }

    render(
      <Breadcrumb
        as={LinkComTo}
        items={[{ label: 'Inicio', linkProps: { to: '/' } }, { label: 'Clientes' }]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
  });
});

describe('Breadcrumb, nivel sem destino', () => {
  it('o intermediario sem href nao recebe o estilo de atual, so o ultimo', () => {
    render(<Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Cadastros' }, { label: 'Clientes' }]} />);

    expect(screen.getByText('Cadastros')).not.toHaveAttribute('aria-current');
    expect(screen.getByText('Cadastros').className).not.toBe(screen.getByText('Clientes').className);
    expect(screen.getByText('Clientes')).toHaveAttribute('aria-current', 'page');
  });
});

describe('Breadcrumb compact', () => {
  const longa = [
    { label: 'Inicio', href: '/' },
    { label: 'Modulos', href: '/modulos' },
    { label: 'Cadastros' },
    { label: 'Faturamento', href: '/faturamento' },
    { label: 'Nota fiscal 1042 de um cliente com nome comprido' },
  ];

  it('mostra o primeiro, o botao dos intermediarios e o ultimo, mantendo nav e lista', () => {
    render(<Breadcrumb compact items={longa} />);

    expect(screen.getByRole('navigation', { name: 'Trilha de navegação' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Modulos' })).not.toBeInTheDocument();
    expect(screen.getByText('Nota fiscal 1042 de um cliente com nome comprido')).toHaveAttribute('aria-current', 'page');
  });

  it('o botao diz os niveis recolhidos e abre um menu com eles', () => {
    render(<Breadcrumb compact items={longa} />);

    const botao = screen.getByRole('button', { name: 'Níveis intermediários: Modulos, Cadastros, Faturamento' });
    expect(botao).toHaveAttribute('aria-haspopup', 'menu');

    fireEvent.click(botao);

    const menu = screen.getByRole('menu', { name: 'Níveis intermediários' });
    expect(menu).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Modulos', 'Cadastros', 'Faturamento']);
    expect(screen.getByRole('menuitem', { name: 'Cadastros' })).toBeDisabled();
  });

  it('escolher um nivel aciona o link da aplicacao dele', () => {
    const navegar = vi.fn();
    function LinkDaApp({ href, children, ...props }: { href: string; children: React.ReactNode }) {
      return (
        <a
          {...props}
          href={href}
          onClick={(event) => {
            event.preventDefault();
            navegar(href);
          }}
        >
          {children}
        </a>
      );
    }

    render(<Breadcrumb as={LinkDaApp} compact items={longa} />);
    fireEvent.click(screen.getByRole('button', { name: /Níveis intermediários/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Faturamento' }));

    expect(navegar).toHaveBeenCalledWith('/faturamento');
  });

  it('aceita outro comeco para o nome do botao', () => {
    render(<Breadcrumb compact compactLabel="Mais níveis" items={longa} />);

    expect(screen.getByRole('button', { name: 'Mais níveis: Modulos, Cadastros, Faturamento' })).toBeInTheDocument();
  });

  it('com dois niveis, nao ha o que recolher', () => {
    render(<Breadcrumb compact items={[{ label: 'Inicio', href: '/' }, { label: 'Clientes' }]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
