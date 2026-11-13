import { act, fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ChartArea } from './ChartArea';
import { ChartBar } from './ChartBar';
import { ChartCombo } from './ChartCombo';
import { ChartDonut } from './ChartDonut';
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

type Props = Record<string, unknown>;
type Montar = (props: Props) => ReactElement;

const categorias = ['jan', 'fev'];
const serie = [
  { label: 'Receita', values: [1, 2] },
  { label: 'Custo', values: [2, 1] },
];
const itens = [
  { label: 'Alfa', value: 1 },
  { label: 'Beta', value: 2 },
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

const montarBar: Montar = (props) => <ChartBar categories={categorias} series={serie} title="Gráfico" {...props} />;
const montarLine: Montar = (props) => <ChartLine categories={categorias} series={serie} title="Gráfico" {...props} />;
const montarArea: Montar = (props) => <ChartArea categories={categorias} series={serie} title="Gráfico" {...props} />;
const montarCombo: Montar = (props) => (
  <ChartCombo categories={categorias} series={serie.map((item) => ({ ...item, kind: 'bar' as const }))} title="Gráfico" {...props} />
);
const montarScatter: Montar = (props) => (
  <ChartScatter
    series={[
      { label: 'Receita', points: [{ x: 1, y: 2 }] },
      { label: 'Custo', points: [{ x: 2, y: 1 }] },
    ]}
    title="Gráfico"
    {...props}
  />
);
const montarPie: Montar = (props) => <ChartPie slices={itens} title="Gráfico" {...props} />;
const montarDonut: Montar = (props) => <ChartDonut slices={itens} title="Gráfico" {...props} />;
const montarRadial: Montar = (props) => <ChartRadial title="Gráfico" tracks={itens} {...props} />;
const montarTreemap: Montar = (props) => <ChartTreemap nodes={itens} title="Gráfico" {...props} />;
const montarSunburst: Montar = (props) => <ChartSunburst nodes={itens} title="Gráfico" {...props} />;
const montarWaterfall: Montar = (props) => <ChartWaterfall steps={itens} title="Gráfico" {...props} />;
const montarSankey: Montar = (props) => (
  <ChartSankey flows={[{ source: 'A', target: 'B', value: 1 }]} title="Gráfico" {...props} />
);
const montarHeatmap: Montar = (props) => (
  <ChartHeatmap cells={[{ value: 1, x: 'a', y: 'b' }]} title="Gráfico" {...props} />
);
const montarTimeline: Montar = (props) => (
  <ChartTimeline
    rows={[{ key: 'a', label: 'Linha' }]}
    segments={[{ end: 2, row: 'a', series: 'Receita', start: 1 }]}
    series={[{ label: 'Receita' }, { label: 'Custo' }]}
    title="Gráfico"
    {...props}
  />
);
const montarMap: Montar = (props) => (
  <ChartMap
    colorScale={{ categories: [{ id: 'norte', label: 'Regional Norte' }], type: 'categorical' }}
    data={[{ category: 'norte', id: 'AA' }]}
    geometry={quadrado}
    title="Gráfico"
    {...props}
  />
);

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
});

const ocultaveis: [string, Montar, string, string][] = [
  ['ChartBar', montarBar, 'Receita', 'Receita'],
  ['ChartLine', montarLine, 'Receita', 'Receita'],
  ['ChartArea', montarArea, 'Receita', 'Receita'],
  ['ChartCombo', montarCombo, 'Receita', 'Receita'],
  ['ChartScatter', montarScatter, 'Receita', 'Receita'],
  ['ChartPie', montarPie, 'Alfa', 'Alfa'],
  ['ChartDonut', montarDonut, 'Alfa', 'Alfa'],
  ['ChartRadial', montarRadial, 'Alfa', 'Alfa'],
  ['ChartTreemap', montarTreemap, 'Alfa', 'Alfa'],
  ['ChartSunburst', montarSunburst, 'Alfa', 'Alfa'],
  ['ChartTimeline', montarTimeline, 'Receita', 'Receita'],
  ['ChartMap', montarMap, 'Regional Norte', 'norte'],
];

describe.each(ocultaveis)('%s: hidden, defaultHidden e onHiddenChange', (_, montar, entrada, id) => {
  const legenda = () => screen.getByRole('button', { name: new RegExp(`^${entrada}`) });

  it('avisa os rotulos ocultos pelo nome novo', () => {
    const onHiddenChange = vi.fn();
    render(montar({ onHiddenChange }));

    fireEvent.click(legenda());

    expect(onHiddenChange).toHaveBeenCalledWith([id]);
  });

  it('obedece hidden e defaultHidden', () => {
    const desligada = (props: Props) => {
      const { unmount } = render(montar(props));
      const pressionado = legenda().getAttribute('aria-pressed');
      unmount();
      return pressionado === 'false';
    };

    expect(desligada({ hidden: [id] })).toBe(true);
    expect(desligada({ defaultHidden: [id] })).toBe(true);
  });
});

interface CasoDeMarca {
  esperadoClique: unknown;
  /** Sem hover, o gráfico fica de fora dos testes de `onHover`. */
  esperadoHover?: unknown;
  montar: Montar;
  nome: string;
}

const caminho = (label: string) => expect.arrayContaining([expect.objectContaining({ label })]);
const pontoCartesiano = { category: 'jan', index: 0, series: 'Receita', value: 1 };
const categoriaJan = { category: 'jan', index: 0 };
const ligacao = { kind: 'flow', source: 'A', target: 'B', value: 1 };
const celula = { value: 1, x: 'a', y: 'b' };

const marcas: CasoDeMarca[] = [
  { esperadoClique: pontoCartesiano, esperadoHover: categoriaJan, montar: montarBar, nome: 'ChartBar' },
  { esperadoClique: pontoCartesiano, esperadoHover: categoriaJan, montar: montarLine, nome: 'ChartLine' },
  { esperadoClique: pontoCartesiano, esperadoHover: categoriaJan, montar: montarArea, nome: 'ChartArea' },
  { esperadoClique: pontoCartesiano, esperadoHover: categoriaJan, montar: montarCombo, nome: 'ChartCombo' },
  {
    esperadoClique: { index: 0, point: { x: 1, y: 2 }, series: 'Receita' },
    esperadoHover: { index: 0, point: { x: 1, y: 2 }, series: 'Receita' },
    montar: montarScatter,
    nome: 'ChartScatter',
  },
  { esperadoClique: itens[0], esperadoHover: itens[0], montar: montarPie, nome: 'ChartPie' },
  { esperadoClique: itens[0], esperadoHover: itens[0], montar: montarDonut, nome: 'ChartDonut' },
  { esperadoClique: itens[0], esperadoHover: itens[0], montar: montarRadial, nome: 'ChartRadial' },
  {
    esperadoClique: { index: 0, step: itens[0] },
    esperadoHover: { index: 0, step: itens[0] },
    montar: montarWaterfall,
    nome: 'ChartWaterfall',
  },
  { esperadoClique: caminho('Beta'), esperadoHover: caminho('Beta'), montar: montarTreemap, nome: 'ChartTreemap' },
  { esperadoClique: caminho('Beta'), esperadoHover: caminho('Beta'), montar: montarSunburst, nome: 'ChartSunburst' },
  { esperadoClique: ligacao, esperadoHover: ligacao, montar: montarSankey, nome: 'ChartSankey' },
  {
    esperadoClique: expect.objectContaining({ id: 'AA', kind: 'region', name: 'Região' }),
    esperadoHover: expect.objectContaining({ id: 'AA', kind: 'region' }),
    montar: montarMap,
    nome: 'ChartMap',
  },
  { esperadoClique: celula, esperadoHover: celula, montar: montarHeatmap, nome: 'ChartHeatmap' },
  {
    esperadoClique: { row: expect.objectContaining({ key: 'a' }), segment: expect.objectContaining({ series: 'Receita' }) },
    montar: montarTimeline,
    nome: 'ChartTimeline',
  },
];

/** A primeira marca do grafico, dentro do grupo: a legenda fica de fora. */
const primeiraMarca = () => within(screen.getByRole('group')).getAllByRole('button')[0];

describe.each(marcas)('$nome: onMarkClick', ({ esperadoClique, montar }) => {
  it('avisa a marca clicada pelo nome novo', () => {
    const onMarkClick = vi.fn();
    render(montar({ onMarkClick }));

    fireEvent.click(primeiraMarca());

    expect(onMarkClick).toHaveBeenCalledTimes(1);
    expect(onMarkClick).toHaveBeenCalledWith(esperadoClique);
  });
});

describe.each(marcas.filter(({ esperadoHover }) => esperadoHover !== undefined))(
  '$nome: onHover',
  ({ esperadoHover, montar }) => {
    const focarPrimeiraMarca = () => act(() => primeiraMarca().focus());

    it('avisa a marca sob o foco pelo nome novo', () => {
      const onHover = vi.fn();
      render(montar({ onHover, onMarkClick: vi.fn() }));

      focarPrimeiraMarca();

      expect(onHover).toHaveBeenCalledWith(esperadoHover);
    });
  },
);
