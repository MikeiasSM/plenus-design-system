import { render, screen } from '@testing-library/react';
import type { ComponentPropsWithoutRef } from 'react';
import { TabsNav, type TabsNavItem } from './TabsNav';

const abas: TabsNavItem[] = [
  { key: 'usuarios', label: 'Usuários', href: '/sistema/usuarios' },
  { key: 'papeis', label: 'Papéis', href: '/sistema/papeis' },
  { key: 'tokens', label: 'Tokens', href: '/sistema/tokens' },
];

describe('TabsNav', () => {
  it('é navegação nomeada, com um link por aba', () => {
    render(<TabsNav current="papeis" items={abas} label="Sistema" />);

    const navegacao = screen.getByRole('navigation', { name: 'Sistema' });
    expect(navegacao.querySelectorAll('a')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Tokens' })).toHaveAttribute('href', '/sistema/tokens');
  });

  it('marca só a aba atual com aria-current="page", sem papel de aba', () => {
    render(<TabsNav current="papeis" items={abas} label="Sistema" />);

    expect(screen.getByRole('link', { name: 'Papéis' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Usuários' })).not.toHaveAttribute('aria-current');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('usa o link do roteador e entrega a ele as propriedades do item', () => {
    function LinkDoRoteador({ to, ...props }: ComponentPropsWithoutRef<'a'> & { to?: string }) {
      return <a {...props} data-to={to} href={to} />;
    }

    render(
      <TabsNav
        as={LinkDoRoteador}
        current="usuarios"
        items={[{ key: 'usuarios', label: 'Usuários', linkProps: { to: '/sistema/usuarios' } }]}
        label="Sistema"
      />,
    );

    const link = screen.getByRole('link', { name: 'Usuários' });
    expect(link).toHaveAttribute('data-to', '/sistema/usuarios');
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});
