import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ChartHeatmap, type ChartHeatmapCell, type ChartHeatmapProps } from './ChartHeatmap';

const celulas: ChartHeatmapCell[] = [
  { value: 10, x: 'Seg', y: 'Manhã' },
  { value: 70, x: 'Qua', y: 'Manhã' },
  { value: 20, x: 'Seg', y: 'Tarde' },
  { value: null, x: 'Ter', y: 'Tarde' },
  { value: 100, x: 'Qua', y: 'Tarde' },
];

function heatmap(props: Partial<ChartHeatmapProps> = {}) {
  return <ChartHeatmap cells={celulas} title="Atendimentos por turno" valueLabel="Atendimentos" {...props} />;
}

const celula = (nome: string) => document.querySelector<SVGRectElement>(`rect[aria-label^="${nome}"]`);
const rotulo = (texto: string) => [...document.querySelectorAll('svg text')].find((node) => node.textContent === texto);
const celulasDaGrade = () => screen.getAllByRole('button').filter((botao) => botao.hasAttribute('data-cell'));

function apontar(nome: string) {
  const alvo = celula(nome)!;
  const x = Number(alvo.getAttribute('x')) + Number(alvo.getAttribute('width')) / 2;
  const y = Number(alvo.getAttribute('y')) + Number(alvo.getAttribute('height')) / 2;
  fireEvent.mouseMove(alvo, { clientX: x, clientY: y });
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  vi.restoreAllMocks();
});

describe('ChartHeatmap', () => {
  it('desenha as celulas recebidas, nomeadas pelas duas categorias e pelo valor, e deixa em branco o cruzamento sem celula', () => {
    render(heatmap());

    expect(screen.getByRole('img', { name: 'Atendimentos por turno' })).toBeInTheDocument();
    expect(document.querySelectorAll('rect[data-cell]')).toHaveLength(5);
    expect(celula('Ter, Manhã')).toBeNull();
    expect(celula('Ter, Tarde')).toHaveAttribute('aria-label', 'Ter, Tarde: Sem dado');
  });

  it('parte a escala sequencial do zero e hachura a celula sem valor, contando so ela na legenda', () => {
    const { rerender } = render(heatmap());

    expect(celula('Qua, Tarde')).toHaveAttribute('fill', 'var(--pl-chart-sequential-7)');
    expect(celula('Seg, Manhã')).not.toHaveAttribute('fill', 'var(--pl-chart-sequential-1)');
    expect(celula('Ter, Tarde')?.getAttribute('fill')).toMatch(/^url\(#.+-hatch\)$/);
    expect(screen.getByText('Sem dado').closest('li')).toHaveTextContent('1');

    rerender(heatmap({ colorScale: { domain: [10, 100], type: 'sequential' }, noDataStyle: 'neutral' }));

    expect(celula('Seg, Manhã')).toHaveAttribute('fill', 'var(--pl-chart-sequential-1)');
    expect(celula('Ter, Tarde')).toHaveAttribute('fill', 'var(--pl-chart-no-data)');
  });

  it('escreve o valor com a cor medida nas faixas, e com halo onde nenhuma cor fixa garante o contraste', () => {
    const { rerender } = render(heatmap({ colorScale: { thresholds: [50], type: 'classes' } }));

    expect(rotulo('10')).toHaveAttribute('fill', 'var(--pl-chart-on-light)');
    expect(rotulo('100')).toHaveAttribute('fill', 'var(--pl-chart-on-dark)');

    rerender(heatmap());

    expect(rotulo('100')).not.toHaveAttribute('fill');
    expect(rotulo('100')?.getAttribute('class')).toMatch(/valueLabelHalo/);

    rerender(heatmap({ showValues: 'hidden' }));

    expect(rotulo('100')).toBeUndefined();
  });

  it('segue a ordem declarada e avisa, em desenvolvimento, o que ficou de fora e o que se repetiu', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(heatmap({ cells: [...celulas, { value: 30, x: 'Qua', y: 'Tarde' }], xCategories: ['Qua', 'Seg'], yCategories: ['Tarde'] }));

    const nomes = [...document.querySelectorAll('rect[data-cell]')].map((rect) => rect.getAttribute('aria-label'));
    expect(nomes).toEqual(['Qua, Tarde: 30', 'Seg, Tarde: 20']);
    expect(aviso).toHaveBeenCalledWith(expect.stringMatching(/3 célula\(s\) fora de xCategories ou yCategories.*Seg × Manhã/));
    expect(aviso).toHaveBeenCalledWith(expect.stringMatching(/1 célula\(s\) repetida\(s\), valendo a última: Qua × Tarde/));
  });

  it('com onCellClick, as celulas viram botoes de uma parada so, e as setas saltam o que esta em branco', () => {
    const clicou = vi.fn();
    render(heatmap({ onCellClick: clicou }));

    expect(screen.getByRole('group', { name: 'Atendimentos por turno' })).toBeInTheDocument();
    expect(celulasDaGrade().filter((botao) => botao.getAttribute('tabindex') === '0')).toHaveLength(1);

    act(() => celula('Seg, Manhã')!.focus());
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(celula('Qua, Manhã'));

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(celula('Qua, Manhã'));

    fireEvent.keyDown(document.activeElement!, { ctrlKey: true, key: 'End' });
    expect(document.activeElement).toBe(celula('Ter, Tarde'));

    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(celula('Seg, Tarde'));

    fireEvent.keyDown(document.activeElement!, { ctrlKey: true, key: 'Home' });
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(clicou).toHaveBeenLastCalledWith({ value: 10, x: 'Seg', y: 'Manhã' });

    fireEvent.click(celula('Qua, Tarde')!);
    expect(clicou).toHaveBeenLastCalledWith({ value: 100, x: 'Qua', y: 'Tarde' });
  });

  it('sem onCellClick, nenhuma celula entra na ordem do Tab', () => {
    render(heatmap());

    expect(document.querySelector('rect[tabindex]')).toBeNull();
    expect(document.querySelector('rect[role="button"]')).toBeNull();
  });

  it('avisa a celula sob o ponteiro, e nao larga a celula entre uma seta e outra', () => {
    const passou = vi.fn();
    render(heatmap({ onCellClick: () => {}, onHoverCell: passou }));

    apontar('Ter, Tarde');
    expect(passou).toHaveBeenLastCalledWith({ value: null, x: 'Ter', y: 'Tarde' });

    fireEvent.mouseLeave(celula('Ter, Tarde')!.closest('g')!.parentElement!);
    expect(passou).toHaveBeenLastCalledWith(null);

    passou.mockClear();
    act(() => celula('Seg, Manhã')!.focus());
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });

    expect(passou.mock.calls).toEqual([[{ value: 10, x: 'Seg', y: 'Manhã' }], [{ value: 70, x: 'Qua', y: 'Manhã' }]]);
  });

  it('abre o balao no foco do teclado, tambem na celula sem dado', () => {
    render(heatmap({ onCellClick: () => {} }));

    act(() => celula('Ter, Tarde')!.focus());

    const balao = document.body.querySelector<HTMLElement>(':scope > [aria-hidden="true"]')!;
    expect(within(balao).getByText('Ter')).toBeInTheDocument();
    expect(within(balao).getByText('Tarde')).toBeInTheDocument();
    expect(within(balao).getByText('Sem dado')).toBeInTheDocument();
  });

  it('contorna a linha e a coluna da celula sob o ponteiro, quando pedido', () => {
    const { rerender } = render(heatmap());

    apontar('Qua, Tarde');
    expect(document.querySelector('[class*="crosshair"]')).toBeNull();

    rerender(heatmap({ highlight: 'rowColumn' }));
    apontar('Qua, Tarde');

    expect(document.querySelectorAll('[class*="crosshair"] rect')).toHaveLength(2);
  });

  it('desenha celulas quadradas e as colunas em cima, quando pedido', () => {
    render(heatmap({ squareCells: true, xAxisPosition: 'top' }));

    const alvo = celula('Seg, Manhã')!;
    expect(alvo.getAttribute('width')).toBe(alvo.getAttribute('height'));
    expect(Number(screen.getByText('Seg').getAttribute('y'))).toBeLessThan(0);
  });

  it('nas faixas, a legenda liga e desliga as celulas de cada uma', () => {
    render(heatmap({ colorScale: { thresholds: [50], type: 'classes' } }));

    expect(celula('Qua, Tarde')).toHaveAttribute('fill', 'var(--pl-chart-sequential-7)');

    fireEvent.click(screen.getByRole('button', { name: /50 ou mais/ }));

    expect(celula('Qua, Tarde')).toHaveAttribute('fill', 'var(--pl-color-surface-subtle)');
    expect(celula('Seg, Manhã')).toHaveAttribute('fill', 'var(--pl-chart-sequential-1)');
  });

  it('troca o desenho pela tabela de linhas por colunas', () => {
    render(heatmap());

    fireEvent.click(screen.getByRole('button', { name: 'Ver como tabela' }));

    const tabela = screen.getByRole('table', { name: 'Atendimentos por turno' });
    expect(within(tabela).getAllByRole('columnheader').map((cabecalho) => cabecalho.textContent)).toEqual(['Seg', 'Qua', 'Ter']);
    expect(within(tabela).getAllByRole('row')[2]).toHaveTextContent('Tarde20100Sem dado');
    expect(within(tabela).getAllByRole('row')[1].querySelectorAll('td')[2]).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'Ver como tabela' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sem celulas, mostra o vazio', () => {
    render(heatmap({ cells: [] }));

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });
});
