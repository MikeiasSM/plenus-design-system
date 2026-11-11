import { render, screen } from '@testing-library/react';
import type { ComponentPropsWithoutRef } from 'react';
import { PageHeader } from './PageHeader';

function LinkDoRoteador({ to, ...props }: ComponentPropsWithoutRef<'a'> & { to?: string }) {
  return <a {...props} href={to} />;
}

function cabecalho() {
  return render(
    <PageHeader>
      <PageHeader.Back href="/pedidos" label="Voltar para Pedidos" />
      <PageHeader.Title>Pedido 1042</PageHeader.Title>
      <PageHeader.Badges>
        <span>Pago</span>
      </PageHeader.Badges>
      <PageHeader.Description>Itens, entrega e pagamento do pedido.</PageHeader.Description>
      <PageHeader.Context>Criado por Ana</PageHeader.Context>
      <PageHeader.Actions>
        <button type="button">Imprimir</button>
      </PageHeader.Actions>
      <PageHeader.Search>
        <input aria-label="Buscar itens" type="search" />
      </PageHeader.Search>
    </PageHeader>,
  );
}

describe('PageHeader', () => {
  it('tem o titulo da pagina como titulo de nivel 1', () => {
    cabecalho();

    expect(screen.getByRole('heading', { level: 1, name: 'Pedido 1042' })).toBeInTheDocument();
  });

  it('volta por um link nomeado, e nao por um botao', () => {
    cabecalho();

    expect(screen.getByRole('link', { name: 'Voltar para Pedidos' })).toHaveAttribute('href', '/pedidos');
  });

  it('mostra o texto visivel dos children e mantem o label como nome acessivel', () => {
    render(
      <PageHeader>
        <PageHeader.Back href="/pedidos" label="Voltar para Pedidos">
          Pedidos
        </PageHeader.Back>
        <PageHeader.Title>Pedido 1042</PageHeader.Title>
      </PageHeader>,
    );

    const link = screen.getByRole('link', { name: 'Voltar para Pedidos' });

    expect(link).toHaveTextContent('Pedidos');
    expect(link).toHaveAttribute('aria-label', 'Voltar para Pedidos');
  });

  it('sem children, mostra o label como texto visivel', () => {
    cabecalho();

    expect(screen.getByRole('link', { name: 'Voltar para Pedidos' })).toHaveTextContent('Voltar para Pedidos');
  });

  it('usa o link da aplicacao, com as propriedades que o roteador pede', () => {
    render(
      <PageHeader>
        <PageHeader.Back as={LinkDoRoteador} label="Voltar" linkProps={{ to: '/clientes' }} />
        <PageHeader.Title>Cliente</PageHeader.Title>
      </PageHeader>,
    );

    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/clientes');
  });

  it('segue a largura da coluna do conteudo quando pedido', () => {
    render(
      <PageHeader data-testid="cabecalho" maxWidth="760px">
        <PageHeader.Title>Ajustes</PageHeader.Title>
      </PageHeader>,
    );

    expect(screen.getByTestId('cabecalho').firstElementChild).toHaveStyle({ maxWidth: '760px' });
  });

  it('soma a classe do consumidor e repassa as propriedades nativas', () => {
    render(
      <PageHeader aria-label="Cabecalho do pedido" className="meu">
        <PageHeader.Title>Pedido</PageHeader.Title>
      </PageHeader>,
    );

    expect(screen.getByLabelText('Cabecalho do pedido')).toHaveClass('meu');
  });
});
