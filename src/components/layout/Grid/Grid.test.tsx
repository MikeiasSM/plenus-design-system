import { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { regrasDaFolha } from '../../../test/folha';
import { Grid } from './Grid';

type Medida = () => void;

const observadores: Medida[] = [];
let trilhas = '';
const getComputedStyleOriginal = window.getComputedStyle;

beforeEach(() => {
  observadores.length = 0;
  trilhas = '';
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly medir: Medida) {}
      observe() {
        observadores.push(this.medir);
      }
      disconnect() {}
      unobserve() {}
    },
  );
  vi.spyOn(window, 'getComputedStyle').mockImplementation((elemento, pseudo) => {
    const estilo = getComputedStyleOriginal(elemento, pseudo);
    return new Proxy(estilo, { get: (alvo, chave) => (chave === 'gridTemplateColumns' ? trilhas : Reflect.get(alvo, chave)) });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function redimensionar(novasTrilhas: string) {
  trilhas = novasTrilhas;
  act(() => observadores.forEach((medir) => medir()));
}

describe('Grid', () => {
  it('mostra os filhos e expoe o espaco padrao e a largura minima padrao', () => {
    render(
      <Grid data-testid="grade">
        <Grid.Item>Um</Grid.Item>
        <Grid.Item>Dois</Grid.Item>
      </Grid>,
    );

    const grade = screen.getByTestId('grade');
    expect(grade).toHaveAttribute('data-gap', '4');
    expect(grade).not.toHaveAttribute('data-limited');
    expect(grade.style.getPropertyValue('--grid-min')).toBe('240px');
    expect(screen.getByText('Um')).toBeInTheDocument();
    expect(screen.getByText('Dois')).toBeInTheDocument();
  });

  it('leva columns, minColumnWidth, gap e align ao CSS', () => {
    const { rerender } = render(<Grid align="center" columns={3} data-testid="grade" gap={2} minColumnWidth={160} />);

    const grade = screen.getByTestId('grade');
    expect(grade).toHaveAttribute('data-limited');
    expect(grade).toHaveAttribute('data-gap', '2');
    expect(grade).toHaveAttribute('data-align', 'center');
    expect(grade.style.getPropertyValue('--grid-columns')).toBe('3');
    expect(grade.style.getPropertyValue('--grid-min')).toBe('160px');

    rerender(<Grid data-testid="grade" minColumnWidth="20rem" />);
    expect(grade.style.getPropertyValue('--grid-min')).toBe('20rem');
  });

  it('entrega propriedades nativas, className, style e ref a raiz', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Grid className="extra" data-testid="grade" ref={ref} style={{ color: 'red' }} />);

    const grade = screen.getByTestId('grade');
    expect(grade).toHaveClass('extra');
    expect(grade.style.color).toBe('red');
    expect(ref.current).toBe(grade);
  });

  it('ocupa span colunas quando a grade tem esse tanto, e a linha inteira com menos', () => {
    trilhas = '100px 100px 100px 100px';
    render(
      <Grid>
        <Grid.Item data-testid="metade" span={2}>
          Metade
        </Grid.Item>
        <Grid.Item data-testid="comum">Comum</Grid.Item>
      </Grid>,
    );

    expect(screen.getByTestId('metade').style.gridColumn).toBe('span 2');
    expect(screen.getByTestId('comum').style.gridColumn).toBe('');

    redimensionar('100px 100px');
    expect(screen.getByTestId('metade').style.gridColumn).toBe('span 2');

    redimensionar('200px');
    expect(screen.getByTestId('metade').style.gridColumn).toBe('1 / -1');
  });

  it('nao define a coluna enquanto o numero de colunas nao for conhecido', () => {
    render(
      <Grid>
        <Grid.Item data-testid="metade" span={2} />
      </Grid>,
    );

    expect(screen.getByTestId('metade').style.gridColumn).toBe('');
  });

  it('entrega propriedades nativas e ref ao item', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Grid>
        <Grid.Item className="extra" data-testid="item" ref={ref} />
      </Grid>,
    );

    expect(screen.getByTestId('item')).toHaveClass('extra');
    expect(ref.current).toBe(screen.getByTestId('item'));
  });

  describe('na folha de estilo', () => {
    const regras = regrasDaFolha('src/components/layout/Grid/Grid.module.css');

    it('entra quantas colunas couberem, cada uma com ao menos a largura minima, com espaco 4 e 240px por padrao', () => {
      const raiz = regras.get('.root')!;

      expect(raiz['grid-template-columns']).toBe('repeat(auto-fill, minmax(min(100%, var(--grid-min)), 1fr))');
      expect(raiz.gap).toBe('var(--grid-gap)');
      expect(raiz['--grid-gap']).toBe('var(--pl-space-4)');
      expect(raiz['--grid-min']).toBe('240px');
    });

    // Cada coluna tem ao menos a largura que teria numa grade de `columns` colunas: cabem no maximo `columns`.
    it('com columns, a coluna minima e a fracao da grade para esse numero de colunas', () => {
      expect(regras.get('.root[data-limited]')!['grid-template-columns'].replace(/\s+/g, '')).toBe(
        'repeat(auto-fill,minmax(min(100%,max(var(--grid-min),calc((100%-(var(--grid-columns)-1)*var(--grid-gap))/var(--grid-columns)))),1fr))',
      );
    });

    it('tem uma regra para cada espaco e alinhamento', () => {
      [1, 2, 3, 5, 6, 7].forEach((passo) => expect(regras.get(`.root[data-gap='${passo}']`)).toEqual({ '--grid-gap': `var(--pl-space-${passo})` }));
      ['start', 'center', 'end', 'stretch', 'baseline'].forEach((valor) =>
        expect(regras.get(`.root[data-align='${valor}']`)).toEqual({ 'align-items': valor }),
      );
    });

    // O min(100%, ...) nas duas formas de coluna impede a coluna de passar de uma grade mais estreita que a minima.
    it('nao estoura: a coluna cabe na grade e a celula encolhe', () => {
      ['.root', '.root[data-limited]'].forEach((seletor) =>
        expect(regras.get(seletor)!['grid-template-columns'].replace(/\s+/g, '')).toContain('minmax(min(100%,'),
      );
      expect(regras.get('.item')).toEqual({ 'min-width': '0' });
    });
  });
});
