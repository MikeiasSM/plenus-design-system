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

  it('respeita o nome que o consumidor da ao cartao', () => {
    render(
      <>
        <h2 id="de-fora">Resumo do mes</h2>
        <Card aria-labelledby="de-fora">
          <Card.Header title="Membros da equipe" />
        </Card>
      </>,
    );

    expect(screen.getByRole('region', { name: 'Resumo do mes' })).toBeInTheDocument();
  });

  it('perde o nome quando o cabecalho sai, em vez de apontar para um id que nao existe', () => {
    const { rerender } = render(
      <Card>
        <Card.Header title="Membros da equipe" />
      </Card>,
    );

    rerender(
      <Card>
        <Card.Body>Somente conteudo</Card.Body>
      </Card>,
    );

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('as partes aceitam className e propriedades nativas', () => {
    render(
      <Card size="sm">
        <Card.Header className="meu-cabecalho" data-testid="cabecalho" title="Resumo" />
        <Card.Body className="meu-corpo" data-testid="corpo">Conteudo</Card.Body>
        <Card.Footer data-testid="rodape">Rodape</Card.Footer>
      </Card>,
    );

    expect(screen.getByTestId('cabecalho')).toHaveClass('meu-cabecalho');
    expect(screen.getByTestId('corpo')).toHaveClass('meu-corpo');
    expect(screen.getByTestId('rodape')).toBeInTheDocument();
  });

  describe('trailingWhenNarrow', () => {
    afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'offsetTop'));

    /** O jsdom nao tem layout: a linha de cada elemento vem de fora. */
    function trailingDesceDeLinha() {
      Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
        configurable: true,
        get(this: HTMLElement) {
          return this.className.includes('trailing') ? 40 : 0;
        },
      });
    }

    it('em hide, esconde o trailing que desceu de linha', () => {
      trailingDesceDeLinha();
      render(
        <Card>
          <Card.Header title="Valor Total de Compras" trailing={<button type="button">+14,6%</button>} trailingWhenNarrow="hide" />
        </Card>,
      );

      expect(screen.getByRole('button', { hidden: true }).parentElement?.className).toMatch(/trailingHidden/);
    });

    it('em keep, o padrao, o trailing continua visivel', () => {
      trailingDesceDeLinha();
      render(
        <Card>
          <Card.Header title="Valor Total de Compras" trailing={<button type="button">+14,6%</button>} />
        </Card>,
      );

      expect(screen.getByRole('button', { name: '+14,6%' }).parentElement?.className).not.toMatch(/trailingHidden/);
    });
  });
});
