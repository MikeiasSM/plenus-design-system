import { fireEvent, render, screen } from '@testing-library/react';
import { Card } from './Card';
import styles from './Card.module.css';

describe('Card.Media', () => {
  it('desenha a imagem com o texto alternativo, sem distorcer e sem atrasar a pagina', () => {
    render(
      <Card>
        <Card.Media alt="Pizza de calabresa" src="/calabresa.jpg" />
        <Card.Header title="Pizza Calabresa Grande" />
      </Card>,
    );

    const imagem = screen.getByRole('img', { name: 'Pizza de calabresa' });
    expect(imagem).toHaveAttribute('loading', 'lazy');
    expect(imagem).toHaveClass(styles.media, styles.mediaTop, styles.ratio16x9);
  });

  it('sem endereco, nao ocupa espaco', () => {
    const { container } = render(
      <Card>
        <Card.Media alt="" src={null} />
        <Card.Body>Guaraná lata 350 ml</Card.Body>
      </Card>,
    );

    expect(container.querySelector('img')).toBeNull();
  });

  it('se a imagem nao carregar, some e avisa quem pediu', () => {
    const onError = vi.fn();
    const { container } = render(
      <Card>
        <Card.Media alt="" onError={onError} src="/quebrada.jpg" />
        <Card.Body>Item</Card.Body>
      </Card>,
    );

    fireEvent.error(container.querySelector('img')!);

    expect(onError).toHaveBeenCalledOnce();
    expect(container.querySelector('img')).toBeNull();
  });

  it('no fim da linha, e quadrada por padrao', () => {
    render(
      <Card>
        <Card.Body>Item</Card.Body>
        <Card.Media alt="" placement="end" src="/item.jpg" />
      </Card>,
    );

    expect(screen.getByRole('presentation')).toHaveClass(styles.mediaEnd, styles.ratio1x1);
  });

  it('no fim da linha, fica ao lado de cabecalho, corpo e rodape, que continuam empilhados numa coluna', () => {
    const { container } = render(
      <Card>
        <Card.Header title="Produto A" />
        <Card.Body>Descricao do produto A</Card.Body>
        <Card.Footer>Rodape</Card.Footer>
        <Card.Media alt="" placement="end" src="/produto-a.jpg" />
      </Card>,
    );

    const cartao = container.querySelector('section')!;
    const [coluna, imagem] = Array.from(cartao.children);

    expect(cartao).toHaveClass(styles.withMediaEnd);
    expect(cartao.children).toHaveLength(2);
    expect(coluna).toHaveClass(styles.content);
    expect(Array.from(coluna.children).map((parte) => parte.tagName)).toEqual(['HEADER', 'DIV', 'FOOTER']);
    expect(imagem).toHaveClass(styles.mediaEnd);
  });

  it('no topo, e sem imagem ao fim, o cartao continua sem a coluna', () => {
    const { container } = render(
      <Card>
        <Card.Media alt="" src="/produto-a.jpg" />
        <Card.Body>Descricao do produto A</Card.Body>
      </Card>,
    );

    const cartao = container.querySelector('section')!;

    expect(cartao).not.toHaveClass(styles.withMediaEnd);
    expect(cartao.querySelector('.' + styles.content)).toBeNull();
  });

  it('fora do Card, avisa o erro de composicao', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Card.Media alt="" src="/item.jpg" />)).toThrow('Card.Media deve ser usado dentro de Card.');
  });
});
