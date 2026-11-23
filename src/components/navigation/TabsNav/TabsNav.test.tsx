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

  it('soma a className do linkProps as classes da aba, sem apaga-las', () => {
    render(
      <TabsNav
        current="usuarios"
        items={[{ key: 'usuarios', label: 'Usuários', href: '/u', linkProps: { className: 'minha-classe' } }]}
        label="Sistema"
      />,
    );

    const link = screen.getByRole('link', { name: 'Usuários' });
    expect(link).toHaveClass('minha-classe');
    expect(link.className).toMatch(/tab/);
    expect(link.className).toMatch(/active/);
  });

  it('o aria-current do linkProps nao apaga o da aba atual, e vale nas outras', () => {
    render(
      <TabsNav
        current="usuarios"
        items={[
          { key: 'usuarios', label: 'Usuários', href: '/u', linkProps: { 'aria-current': 'false' } },
          { key: 'papeis', label: 'Papéis', href: '/p', linkProps: { 'aria-current': 'location' } },
        ]}
        label="Sistema"
      />,
    );

    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Papéis' })).toHaveAttribute('aria-current', 'location');
  });

  it('o icone fica antes do rotulo, fora do nome, e a contagem entra no nome', () => {
    render(
      <TabsNav
        current="usuarios"
        items={[
          { key: 'usuarios', label: 'Usuários', href: '/u', icon: <svg data-testid="icone" />, count: 12 },
          { key: 'papeis', label: 'Papéis', href: '/p', icon: <svg /> },
        ]}
        label="Sistema"
      />,
    );

    const link = screen.getByRole('link', { name: 'Usuários, 12' });
    const icone = screen.getByTestId('icone').parentElement;
    expect(icone).toHaveAttribute('aria-hidden', 'true');
    expect(link.firstElementChild?.firstElementChild).toBe(icone);
    expect(screen.getByRole('link', { name: 'Papéis' })).toBeInTheDocument();
  });

  it('as actions ficam fora da lista de links, dentro da navegacao', () => {
    render(<TabsNav actions={<button type="button">Convidar</button>} current="papeis" items={abas} label="Sistema" />);

    const lista = screen.getByRole('list');
    const acao = screen.getByRole('button', { name: 'Convidar' });
    expect(lista).not.toContainElement(acao);
    expect(screen.getByRole('navigation', { name: 'Sistema' })).toContainElement(acao);
  });

  it('sem actions, a lista fica direto na navegacao, como antes', () => {
    render(<TabsNav current="papeis" items={abas} label="Sistema" />);

    expect(screen.getByRole('list').parentElement).toBe(screen.getByRole('navigation'));
  });

  it('segmentado continua navegacao, com aria-current="page" e sem papel de aba', () => {
    render(<TabsNav appearance="segmented" current="papeis" items={abas} label="Sistema" />);

    expect(screen.getByRole('navigation').className).toMatch(/segmented/);
    expect(screen.getByRole('link', { name: 'Papéis' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});

