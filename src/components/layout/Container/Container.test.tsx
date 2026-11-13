import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { Container } from './Container';

const CONTAINER = regrasDaFolha('src/components/layout/Container/Container.module.css');
const PAGE_HEADER = regrasDaFolha('src/components/navigation/PageHeader/PageHeader.module.css');

describe('Container', () => {
  it('mostra o conteudo e usa a largura toda sem maxWidth', () => {
    render(<Container data-testid="coluna">Conteudo</Container>);

    expect(screen.getByTestId('coluna')).toHaveTextContent('Conteudo');
    expect(screen.getByTestId('coluna').style.maxWidth).toBe('');
  });

  it('soma os dois respiros ao maxWidth, em px quando for numero', () => {
    const { rerender } = render(<Container data-testid="coluna" maxWidth={760} />);
    expect(screen.getByTestId('coluna').style.maxWidth).toBe('calc(760px + 2 * var(--pl-space-5))');

    rerender(<Container data-testid="coluna" maxWidth="70rem" />);
    expect(screen.getByTestId('coluna').style.maxWidth).toBe('calc(70rem + 2 * var(--pl-space-5))');

    rerender(<Container data-testid="coluna" maxWidth="none" />);
    expect(screen.getByTestId('coluna').style.maxWidth).toBe('none');
  });

  // Sem o width, as margens auto encolhem a caixa ao conteúdo num pai flex em coluna, como o Stack.
  it('ocupa a largura do pai, tambem num flex em coluna, com o respiro dentro da caixa', () => {
    expect(CONTAINER.get('.root')).toEqual({
      'box-sizing': 'border-box',
      'margin-inline': 'auto',
      'padding-inline': 'var(--pl-space-5)',
      width: '100%',
    });
  });

  // O PageHeader põe o respiro no cabeçalho e o maxWidth na grade de dentro, centrada. Com o mesmo valor M e o
  // respiro R nos dois, a borda do conteúdo fica em (largura - M) / 2 no largo e em R no estreito, nos dois.
  it('alinha a borda do conteudo com a do PageHeader de mesmo maxWidth', () => {
    const cabecalho = PAGE_HEADER.get('.header')!;
    const grade = PAGE_HEADER.get('.grid')!;
    const coluna = CONTAINER.get('.root')!;

    expect(cabecalho.padding.split(/\s+/)[1]).toBe('var(--pl-space-5)');
    expect(grade['margin-inline']).toBe('auto');
    expect(coluna['padding-inline']).toBe('var(--pl-space-5)');

    const respiro = 20;
    const bordaDoPageHeader = (largura: number, maximo: number) => respiro + (largura - 2 * respiro - Math.min(maximo, largura - 2 * respiro)) / 2;
    const bordaDoContainer = (largura: number, maximo: number) => (largura - Math.min(largura, maximo + 2 * respiro)) / 2 + respiro;

    [
      [1440, 760],
      [800, 760],
      [790, 760],
      [375, 760],
    ].forEach(([largura, maximo]) => expect(bordaDoContainer(largura, maximo)).toBe(bordaDoPageHeader(largura, maximo)));
  });

  it('entrega propriedades nativas, className, style e ref a raiz', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Container className="extra" data-testid="coluna" maxWidth={600} ref={ref} style={{ color: 'red' }} />);

    const coluna = screen.getByTestId('coluna');
    expect(coluna).toHaveClass('extra');
    expect(coluna.style.color).toBe('red');
    expect(coluna.style.maxWidth).toBe('calc(600px + 2 * var(--pl-space-5))');
    expect(ref.current).toBe(coluna);
  });
});
