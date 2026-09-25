import { render } from '@testing-library/react';
import { ChartLegend } from './ChartLegend';

const series = [
  { color: 'var(--pl-chart-series-1)', label: 'Serviços' },
  { color: 'var(--pl-chart-series-2)', label: 'Produtos' },
];

function classeDaLista() {
  return document.querySelector('ul')?.className ?? '';
}

describe('ChartLegend', () => {
  it('centraliza a legenda horizontal quando ninguem escolhe', () => {
    render(<ChartLegend entries={series} position="bottom" />);

    expect(classeDaLista()).toMatch(/legendCenter/);
  });

  it('encosta a legenda no lado pedido', () => {
    const { rerender } = render(<ChartLegend align="left" entries={series} position="bottom" />);
    expect(classeDaLista()).toMatch(/legendLeft/);

    rerender(<ChartLegend align="right" entries={series} position="bottom" />);
    expect(classeDaLista()).toMatch(/legendRight/);
  });

  it('recusa o alinhamento na legenda lateral, que alinha a coluna de medidas', () => {
    render(<ChartLegend align="right" entries={series} position="right" />);

    expect(classeDaLista()).toMatch(/legendSide/);
    expect(classeDaLista()).not.toMatch(/legendRight/);
  });
});
