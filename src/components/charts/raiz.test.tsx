import { createRef, type ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { ChartArea } from './ChartArea';
import { ChartBar } from './ChartBar';
import { ChartCombo } from './ChartCombo';
import { ChartDonut } from './ChartDonut';
import { ChartGauge } from './ChartGauge';
import { ChartHeatmap } from './ChartHeatmap';
import { ChartLine } from './ChartLine';
import { ChartMap } from './ChartMap';
import { ChartPie } from './ChartPie';
import { ChartRadial } from './ChartRadial';
import { ChartSankey } from './ChartSankey';
import { ChartScatter } from './ChartScatter';
import { ChartSunburst } from './ChartSunburst';
import { ChartTimeline } from './ChartTimeline';
import { ChartTreemap } from './ChartTreemap';
import { ChartWaterfall } from './ChartWaterfall';
import type { ChartRootProps } from './core';

const categorias = ['jan', 'fev'];
const serie = [{ label: 'Receita', values: [1, 2] }];
const fatias = [
  { label: 'A', value: 1 },
  { label: 'B', value: 2 },
];
const quadrado = {
  features: [
    {
      geometry: { coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]], type: 'Polygon' as const },
      id: 'AA',
      properties: { name: 'Região' },
      type: 'Feature' as const,
    },
  ],
  type: 'FeatureCollection' as const,
};

const graficos: [string, (raiz: ChartRootProps) => ReactElement][] = [
  ['ChartArea', (raiz) => <ChartArea categories={categorias} series={serie} title="Gráfico" {...raiz} />],
  ['ChartBar', (raiz) => <ChartBar categories={categorias} series={serie} title="Gráfico" {...raiz} />],
  [
    'ChartCombo',
    (raiz) => <ChartCombo categories={categorias} series={[{ ...serie[0], kind: 'bar' }]} title="Gráfico" {...raiz} />,
  ],
  ['ChartDonut', (raiz) => <ChartDonut slices={fatias} title="Gráfico" {...raiz} />],
  ['ChartGauge', (raiz) => <ChartGauge title="Gráfico" value={40} {...raiz} />],
  ['ChartHeatmap', (raiz) => <ChartHeatmap cells={[{ value: 1, x: 'a', y: 'b' }]} title="Gráfico" {...raiz} />],
  ['ChartLine', (raiz) => <ChartLine categories={categorias} series={serie} title="Gráfico" {...raiz} />],
  ['ChartMap', (raiz) => <ChartMap data={[{ id: 'AA', value: 1 }]} geometry={quadrado} title="Gráfico" {...raiz} />],
  ['ChartPie', (raiz) => <ChartPie slices={fatias} title="Gráfico" {...raiz} />],
  ['ChartRadial', (raiz) => <ChartRadial title="Gráfico" tracks={fatias} {...raiz} />],
  ['ChartSankey', (raiz) => <ChartSankey flows={[{ source: 'A', target: 'B', value: 1 }]} title="Gráfico" {...raiz} />],
  [
    'ChartScatter',
    (raiz) => <ChartScatter series={[{ label: 'Pontos', points: [{ x: 1, y: 2 }] }]} title="Gráfico" {...raiz} />,
  ],
  ['ChartSunburst', (raiz) => <ChartSunburst nodes={fatias} title="Gráfico" {...raiz} />],
  [
    'ChartTimeline',
    (raiz) => (
      <ChartTimeline rows={[{ key: 'a', label: 'Linha' }]} series={[{ label: 'Etapa' }]} title="Gráfico" {...raiz} />
    ),
  ],
  ['ChartTreemap', (raiz) => <ChartTreemap nodes={fatias} title="Gráfico" {...raiz} />],
  ['ChartWaterfall', (raiz) => <ChartWaterfall steps={fatias} title="Gráfico" {...raiz} />],
];

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
});

describe.each(graficos)('%s', (_, montar) => {
  it('leva as propriedades nativas e o ref a figura, somando a className', () => {
    const ref = createRef<HTMLElement>();
    render(montar({ 'aria-describedby': 'nota', className: 'painel', id: 'grafico', ref, style: { gridColumn: '1' } }));

    const figura = document.getElementById('grafico');
    expect(figura?.tagName).toBe('FIGURE');
    expect(ref.current).toBe(figura);
    expect(figura).toHaveAttribute('aria-describedby', 'nota');
    expect(figura).toHaveStyle({ gridColumn: '1' });
    expect(figura?.classList).toContain('painel');
    expect(figura?.classList.length).toBeGreaterThan(1);
  });

  it('com hideTitle, tira o titulo da tela e continua com ele no documento', () => {
    const { rerender } = render(montar({}));
    const classeVisivel = screen.getByText('Gráfico').className;

    rerender(montar({ hideTitle: true }));

    expect(screen.getByText('Gráfico').className).not.toBe(classeVisivel);
    expect(document.querySelector('figure')).not.toHaveAttribute('hidetitle');
  });
});
