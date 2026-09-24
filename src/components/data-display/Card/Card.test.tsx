import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('nomeia a regiao pelo titulo do cabecalho', () => {
    render(
      <Card>
        <Card.Header title="Membros da equipe" />
        <Card.Body>Conteudo</Card.Body>
      </Card>,
    );

    const regiao = screen.getByRole('region', { name: 'Membros da equipe' });
    expect(regiao).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Membros da equipe' })).toBeInTheDocument();
  });

  it('fica sem nome acessivel quando nao ha cabecalho', () => {
    render(
      <Card>
        <Card.Body>Somente conteudo</Card.Body>
      </Card>,
    );

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('respeita o nivel de titulo informado', () => {
    render(
      <Card>
        <Card.Header headingLevel={2} title="Resumo" />
      </Card>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Resumo' })).toBeInTheDocument();
  });

  it('acomoda descricao, badge e acao no cabecalho', () => {
    render(
      <Card>
        <Card.Header
          badge={<span>12</span>}
          description="Gerencie quem tem acesso."
          title="Membros"
          trailing={<button type="button">Convidar</button>}
        />
      </Card>,
    );

    expect(screen.getByText('Gerencie quem tem acesso.')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convidar' })).toBeInTheDocument();
  });

  it('encosta o conteudo nas bordas quando pedido', () => {
    const { container } = render(
      <Card>
        <Card.Body flush>Tabela</Card.Body>
      </Card>,
    );

    expect(container.querySelector('[class*="bodyFlush"]')).toBeInTheDocument();
  });
});
