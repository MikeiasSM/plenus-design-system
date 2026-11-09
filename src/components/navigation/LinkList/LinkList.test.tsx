import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { LinkList } from './LinkList';

describe('LinkList', () => {
  it('rende cada item como link com nome e endereco', () => {
    render(
      <LinkList>
        <LinkList.Item description="Na fila" href="/pedidos" title="Pedidos" />
        <LinkList.Item href="/estoque" title="Estoque" />
      </LinkList>,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Pedidos Na fila' })).toHaveAttribute('href', '/pedidos');
    expect(screen.getByRole('link', { name: 'Estoque' })).toHaveAttribute('href', '/estoque');
  });

  it('entrega href e linkProps ao componente de link da aplicacao', () => {
    function LinkDaApp({ children, href, to, ...props }: { children: React.ReactNode; href?: string; to?: string }) {
      return <a data-roteador="app" href={href ?? to} {...props}>{children}</a>;
    }

    render(
      <LinkList as={LinkDaApp}>
        <LinkList.Item href="/a" title="A" />
        <LinkList.Item linkProps={{ to: '/b' }} title="B" />
      </LinkList>,
    );

    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('data-roteador', 'app');
    expect(screen.getByRole('link', { name: 'B' })).toHaveAttribute('href', '/b');
  });

  it('mostra a seta so em linhas e a esconde da acessibilidade', () => {
    const { container, rerender } = render(
      <LinkList>
        <LinkList.Item href="/a" title="A" />
      </LinkList>,
    );
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    rerender(
      <LinkList layout="grid">
        <LinkList.Item href="/a" title="A" />
      </LinkList>,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it('nao muda o nome acessivel pelo tom', () => {
    render(
      <LinkList>
        <LinkList.Item href="/a" icon={<svg />} title="Atrasados" tone="danger" trailing="3" />
      </LinkList>,
    );

    expect(screen.getByRole('link', { name: 'Atrasados 3' })).toHaveAttribute('data-tone', 'danger');
  });

  it('encaminha ref, className e propriedades nativas', () => {
    const listRef = createRef<HTMLUListElement>();
    const linkRef = createRef<HTMLAnchorElement>();

    render(
      <LinkList aria-label="Destinos" className="minha-lista" ref={listRef}>
        <LinkList.Item className="meu-link" data-teste="x" href="/a" ref={linkRef} title="A" />
      </LinkList>,
    );

    expect(listRef.current).toBe(screen.getByRole('list', { name: 'Destinos' }));
    expect(listRef.current).toHaveClass('minha-lista');
    expect(linkRef.current).toBe(screen.getByRole('link', { name: 'A' }));
    expect(linkRef.current).toHaveClass('meu-link');
    expect(linkRef.current).toHaveAttribute('data-teste', 'x');
  });
});
