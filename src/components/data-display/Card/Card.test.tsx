import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { regrasDaFolha } from '../../../test/folha';
import { Card } from './Card';

describe('Card.Header: estilo', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Card/Card.module.css'), 'utf8');
  const bloco = (seletor: string) => {
    const inicio = css.indexOf(`${seletor} {`);

    expect(inicio).toBeGreaterThanOrEqual(0);
    return css.slice(inicio, css.indexOf('}', inicio));
  };

  it('o selo segue o fim do titulo, numa caixa da altura de uma linha dele', () => {
    expect(bloco('.header:not(.headerSm) .titleRow')).toContain('display: block;');
    expect(bloco('.header:not(.headerSm) .titleRow')).toContain('line-height: var(--pl-type-title-line-height);');
    expect(bloco('.header:not(.headerSm) .title')).toContain('display: inline;');
    expect(bloco('.badge')).toContain('min-height: var(--pl-type-title-line-height);');
    expect(bloco('.badge')).toContain('vertical-align: top;');
  });

  it('o respiro fica no fim do titulo, e o selo que desce de linha comeca rente a ele', () => {
    expect(bloco('.header:not(.headerSm) .title:has(+ .badge)')).toContain('margin-inline-end: var(--pl-space-2);');
    expect(bloco('.badge')).not.toContain('margin');
  });

  it('no sm, o selo continua ao lado do titulo cortado', () => {
    expect(bloco('.headerSm .badge')).toContain('display: contents;');
  });

  it('na grade, o centro do trailing fica no centro da primeira linha do titulo, sem mudar a altura do cabecalho', () => {
    const regra = bloco('.header:not(.flowing) > .trailing');

    expect(regra).toContain('translate: 0');
    expect(regra).toContain('calc(var(--pl-type-title-line-height) / 2 - 50%)');
  });

  it('o trailing mais alto que o maior controle nao sobe para fora do cabecalho', () => {
    expect(bloco('.header:not(.flowing) > .trailing')).toContain(
      'calc((var(--pl-type-title-line-height) - var(--pl-control-height-lg)) / 2)',
    );
  });
});

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

  it('poe o selo logo depois do titulo, fora do nome dele', () => {
    render(
      <Card>
        <Card.Header badge={<span>12</span>} title="Membros" />
      </Card>,
    );

    const titulo = screen.getByRole('heading', { name: 'Membros' });

    expect(titulo.nextElementSibling).toContainElement(screen.getByText('12'));
    expect(screen.getByRole('region', { name: 'Membros' })).toBeInTheDocument();
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

  it('em fluxo, titulo e descricao formam uma coluna sem o trailing', () => {
    render(
      <Card size="sm">
        <Card.Header description="Apoio" title="Resumo" trailing={<button type="button">Agir</button>} />
      </Card>,
    );

    const coluna = screen.getByRole('heading', { name: 'Resumo' }).parentElement?.parentElement;

    expect(coluna).toContainElement(screen.getByText('Apoio'));
    expect(coluna).not.toContainElement(screen.getByRole('button', { name: 'Agir' }));
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

  describe('Card.Footer com start', () => {
    it('poe o start a esquerda e os filhos num bloco a direita', () => {
      render(
        <Card>
          <Card.Footer data-testid="rodape" start={<span>Salvo agora</span>}>
            <button type="button">Voltar</button>
            <button type="button">Proximo</button>
          </Card.Footer>
        </Card>,
      );

      const rodape = screen.getByTestId('rodape');
      const [esquerda, direita] = Array.from(rodape.children);
      expect(rodape.children).toHaveLength(2);
      expect(esquerda).toHaveTextContent('Salvo agora');
      expect(direita).toContainElement(screen.getByRole('button', { name: 'Voltar' }));
      expect(direita).toContainElement(screen.getByRole('button', { name: 'Proximo' }));
    });

    it('sem start, os filhos continuam diretos no rodape', () => {
      render(
        <Card>
          <Card.Footer data-testid="rodape">
            <span>Atualizado</span>
            <button type="button">Ver todos</button>
          </Card.Footer>
        </Card>,
      );

      const rodape = screen.getByTestId('rodape');
      expect(rodape.children).toHaveLength(2);
      expect(rodape.children[0].tagName).toBe('SPAN');
      expect(rodape.children[1].tagName).toBe('BUTTON');
    });

    it('com so o start, dispensa os filhos e nao cria o bloco da direita', () => {
      const { rerender } = render(
        <Card>
          <Card.Footer data-testid="rodape" start={<span>Situacao</span>} />
        </Card>,
      );

      expect(screen.getByTestId('rodape').children).toHaveLength(1);
      expect(screen.getByTestId('rodape')).toHaveTextContent('Situacao');

      rerender(
        <Card>
          <Card.Footer data-testid="rodape" start={<span>Situacao</span>}>
            {null}
            {false}
          </Card.Footer>
        </Card>,
      );

      expect(screen.getByTestId('rodape').children).toHaveLength(1);
    });
  });

  describe('na folha de estilo do rodape', () => {
    const regras = regrasDaFolha('src/components/data-display/Card/Card.module.css');

    it('mantem o filho unico no fim da linha, sem especificidade', () => {
      expect(regras.get(':where(.footer > :only-child)')).toEqual({ 'margin-inline-start': 'auto' });
    });

    it('o start cresce e fica no comeco, mesmo sendo filho unico', () => {
      expect(regras.get('.footerStart')).toMatchObject({ flex: '1', 'margin-inline-start': '0' });
    });

    it('os filhos, com o start, ficam juntos no fim da linha', () => {
      expect(regras.get('.footerEnd')).toMatchObject({ flex: 'none', 'margin-inline-start': 'auto' });
    });
  });
});

describe('palavra longa sem espaco no Card.Header', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Card/Card.module.css'), 'utf8');

  const bloco = (seletor: RegExp) => {
    const inicio = css.search(seletor);

    expect(inicio).toBeGreaterThanOrEqual(0);
    return css.slice(inicio, css.indexOf('}', inicio));
  };

  it('a descricao quebra a palavra longa sem passar do cartao nem cobrir o trailing', () => {
    const regra = bloco(/^\.description \{/m);

    expect(regra).toContain('min-width: 0;');
    expect(regra).toContain('overflow-wrap: break-word;');
  });

  it('no sm, o titulo continua cortado na terceira linha e a descricao na segunda', () => {
    expect(bloco(/^\.headerSm \.title \{/m)).toContain('-webkit-line-clamp: 3;');
    expect(bloco(/^\.headerSm \.description \{/m)).toContain('-webkit-line-clamp: 2;');
  });
});
