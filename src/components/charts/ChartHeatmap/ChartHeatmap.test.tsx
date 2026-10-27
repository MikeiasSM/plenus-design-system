import { fireEvent, render, screen } from '@testing-library/react';
import { ChartHeatmap, type ChartHeatmapCell, type ChartHeatmapProps } from './ChartHeatmap';

const celulas: ChartHeatmapCell[] = [
  { value: 10, x: 'Seg', y: 'Manhã' },
  { value: 40, x: 'Ter', y: 'Manhã' },
  { value: 70, x: 'Qua', y: 'Manhã' },
  { value: 20, x: 'Seg', y: 'Tarde' },
  { value: null, x: 'Ter', y: 'Tarde' },
  { value: 100, x: 'Qua', y: 'Tarde' },
];

function heatmap(props: Partial<ChartHeatmapProps> = {}) {
  return <ChartHeatmap cells={celulas} title="Atendimentos por turno" valueLabel="Atendimentos" {...props} />;
}

const celula = (nome: string) => document.querySelector(`rect[aria-label^="${nome}"]`);

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
});

describe('ChartHeatmap', () => {
  it('desenha uma celula por cruzamento, nomeada pelas duas categorias e pelo valor', () => {
    render(heatmap());

    expect(screen.getByRole('img', { name: 'Atendimentos por turno' })).toBeInTheDocument();
    expect(document.querySelectorAll('rect[data-cell]')).toHaveLength(6);
    expect(celula('Qua, Tarde')).toHaveAttribute('aria-label', 'Qua, Tarde: 100');
    expect(celula('Ter, Tarde')).toHaveAttribute('aria-label', 'Ter, Tarde: Sem dado');
  });

  it('pinta pela escala sequencial, mais escuro e maior, e a celula sem valor como sem dado', () => {
    render(heatmap());

    expect(celula('Seg, Manhã')).toHaveAttribute('fill', 'var(--pl-chart-sequential-1)');
    expect(celula('Qua, Tarde')).toHaveAttribute('fill', 'var(--pl-chart-sequential-7)');
    expect(celula('Ter, Tarde')).toHaveAttribute('fill', 'var(--pl-chart-no-data)');
    expect(screen.getByText('Sem dado')).toBeInTheDocument();
  });

  it('escreve o valor na celula com o texto que contrasta com o tom', () => {
    const rotulo = (texto: string) => [...document.querySelectorAll('svg text')].find((node) => node.textContent === texto);
    const { rerender } = render(heatmap());

    expect(rotulo('10')).toHaveAttribute('fill', 'var(--pl-chart-on-light)');
    expect(rotulo('100')).toHaveAttribute('fill', 'var(--pl-chart-on-dark)');

    rerender(heatmap({ showValues: 'hidden' }));

    expect(rotulo('100')).toBeUndefined();
  });

  it('segue a ordem declarada das categorias e ignora o que esta fora dela', () => {
    render(heatmap({ xCategories: ['Qua', 'Seg'], yCategories: ['Tarde'] }));

    const nomes = [...document.querySelectorAll('rect[data-cell]')].map((rect) => rect.getAttribute('aria-label'));
    expect(nomes).toEqual(['Qua, Tarde: 100', 'Seg, Tarde: 20']);
  });

  it('com onCellClick, as celulas viram botoes de uma parada so, percorridos pelas setas', () => {
    const clicou = vi.fn();
    render(heatmap({ onCellClick: clicou }));

    expect(screen.getByRole('group', { name: 'Atendimentos por turno' })).toBeInTheDocument();
    const botoes = screen.getAllByRole('button');
    expect(botoes.filter((botao) => botao.getAttribute('tabindex') === '0')).toHaveLength(1);

    botoes[0].focus();
    fireEvent.keyDown(botoes[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(celula('Ter, Manhã'));

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(celula('Ter, Tarde'));

    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(clicou).toHaveBeenLastCalledWith({ value: 100, x: 'Qua', y: 'Tarde' });

    fireEvent.click(celula('Seg, Manhã')!);
    expect(clicou).toHaveBeenLastCalledWith({ value: 10, x: 'Seg', y: 'Manhã' });
  });

  it('sem onCellClick, nenhuma celula entra na ordem do Tab', () => {
    render(heatmap());

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(document.querySelector('rect[tabindex]')).toBeNull();
  });

  it('avisa a celula sob o ponteiro e a saida dela', () => {
    const passou = vi.fn();
    render(heatmap({ onHoverCell: passou }));

    fireEvent.mouseOver(celula('Ter, Tarde')!);
    expect(passou).toHaveBeenLastCalledWith({ value: null, x: 'Ter', y: 'Tarde' });

    fireEvent.mouseLeave(celula('Ter, Tarde')!.parentElement!.parentElement!);
    expect(passou).toHaveBeenLastCalledWith(null);
  });

  it('nas faixas, a legenda liga e desliga as celulas de cada uma', () => {
    render(heatmap({ colorScale: { thresholds: [50], type: 'classes' } }));

    expect(celula('Qua, Tarde')).toHaveAttribute('fill', 'var(--pl-chart-sequential-7)');

    fireEvent.click(screen.getByRole('button', { name: /50 ou mais/ }));

    expect(celula('Qua, Tarde')).toHaveAttribute('fill', 'var(--pl-color-surface-subtle)');
    expect(celula('Seg, Manhã')).toHaveAttribute('fill', 'var(--pl-chart-sequential-1)');
  });

  it('sem celulas, mostra o vazio', () => {
    render(heatmap({ cells: [] }));

    expect(screen.getByText('Sem dados no período')).toBeInTheDocument();
  });
});
