import { render, screen } from '@testing-library/react';
import { Breadcrumb } from './Breadcrumb';

const trilha = [
  { label: 'Inicio', href: '/' },
  { label: 'Modulos', href: '/modulos' },
  { label: 'Faturamento' },
];

describe('Breadcrumb', () => {
  it('nomeia a navegacao e lista a trilha em ordem', () => {
    render(<Breadcrumb items={trilha} />);

    const nav = screen.getByRole('navigation', { name: 'Trilha de navegacao' });
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
});
