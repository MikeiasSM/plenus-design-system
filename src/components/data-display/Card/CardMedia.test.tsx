import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Profiler } from 'react';
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

  it('soma a className do consumidor as classes da imagem', () => {
    render(
      <Card>
        <Card.Media alt="Produto A" className="minha-imagem" src="/produto-a.jpg" />
      </Card>,
    );

    expect(screen.getByRole('img', { name: 'Produto A' })).toHaveClass('minha-imagem', styles.media, styles.mediaTop);
  });

  it('entrega o ref ao elemento img', () => {
    const ref = { current: null as HTMLImageElement | null };
    render(
      <Card>
        <Card.Media alt="Produto A" ref={ref} src="/produto-a.jpg" />
      </Card>,
    );

    expect(ref.current).toBe(screen.getByRole('img', { name: 'Produto A' }));
  });

  it.each([
    ['top', '1:1', 'ratio1x1'],
    ['top', '4:3', 'ratio4x3'],
    ['end', '16:9', 'ratio16x9'],
    ['end', '4:3', 'ratio4x3'],
  ] as const)('em %s, o ratio %s explicito vence o padrao', (placement, ratio, classe) => {
    render(
      <Card>
        <Card.Body>Produto A</Card.Body>
        <Card.Media alt="Produto A" placement={placement} ratio={ratio} src="/produto-a.jpg" />
      </Card>,
    );

    const imagem = screen.getByRole('img', { name: 'Produto A' });
    expect(imagem).toHaveClass(styles[classe]);
    expect(imagem).not.toHaveClass(placement === 'end' ? styles.ratio1x1 : styles.ratio16x9);
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

  it('trocado o endereco depois de uma falha, desenha a imagem nova ja no render da troca, sem um quadro vazio', () => {
    const commits: number[] = [];
    const cartao = (src: string) => (
      <Profiler id="cartao" onRender={() => commits.push(document.querySelectorAll('img').length)}>
        <Card>
          <Card.Media alt="Produto A" src={src} />
        </Card>
      </Profiler>
    );
    const { container, rerender } = render(cartao('/quebrada.jpg'));

    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();

    commits.length = 0;
    rerender(cartao('/produto-a.jpg'));

    expect(screen.getByRole('img', { name: 'Produto A' })).toHaveAttribute('src', '/produto-a.jpg');
    expect(commits).toEqual([1]);
  });

  describe('imagem que falhou antes da hidratacao', () => {
    const prototipo = HTMLImageElement.prototype as HTMLImageElement & { decode?: () => Promise<void> };
    const decodeOriginal = prototipo.decode;

    beforeEach(() => {
      vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      prototipo.decode = decodeOriginal;
    });

    it('completa e sem largura ao montar, some como se o erro tivesse chegado', () => {
      const { container } = render(
        <Card>
          <Card.Media alt="" src="/quebrada.jpg" />
        </Card>,
      );

      expect(container.querySelector('img')).toBeNull();
    });

    it('some quando o decode recusa a imagem', async () => {
      prototipo.decode = () => Promise.reject(new Error('quebrada'));
      const { container } = render(
        <Card>
          <Card.Media alt="" src="/quebrada.jpg" />
        </Card>,
      );

      await waitFor(() => expect(container.querySelector('img')).toBeNull());
    });

    it('fica quando o decode aceita a imagem sem medida propria, como um SVG', async () => {
      const decode = vi.fn(() => Promise.resolve());
      prototipo.decode = decode;
      render(
        <Card>
          <Card.Media alt="Produto A" src="/produto-a.svg" />
        </Card>,
      );

      await act(async () => {});
      expect(decode).toHaveBeenCalledOnce();
      expect(screen.getByRole('img', { name: 'Produto A' })).toBeInTheDocument();
    });
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

describe('Card.Media: estilo', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Card/Card.module.css'), 'utf8');
  const bloco = (seletor: string) => {
    const inicio = css.indexOf(`${seletor} {`);

    expect(inicio).toBeGreaterThanOrEqual(0);
    return css.slice(inicio, css.indexOf('}', inicio));
  };

  it('a largura da imagem ao fim vem do gancho publico com o prefixo do sistema', () => {
    expect(bloco('.mediaEnd')).toContain('width: var(--pl-card-media-size, 88px);');
  });

  it('no fim da linha, o respiro segue a direcao do texto, e em rtl a imagem fica rente a borda da esquerda', () => {
    expect(bloco('.mediaEnd')).toContain('margin-block: var(--card-gap);');
    expect(bloco('.mediaEnd')).toContain('margin-inline: 0 var(--card-gap);');
    expect(bloco('.mediaEnd')).not.toMatch(/margin(-left|-right)?:\s*var\(--card-gap\) var/);
  });
});
