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

/** O meio do nome antigo do trio: `onHidden<Series>Change`, `hidden<Series>`. */
const ocultaveis: [string, Montar, string, string, string][] = [
  ['ChartBar', montarBar, 'Series', 'Receita', 'Receita'],
  ['ChartLine', montarLine, 'Series', 'Receita', 'Receita'],
  ['ChartArea', montarArea, 'Series', 'Receita', 'Receita'],
  ['ChartCombo', montarCombo, 'Series', 'Receita', 'Receita'],
  ['ChartScatter', montarScatter, 'Series', 'Receita', 'Receita'],
  ['ChartPie', montarPie, 'Slices', 'Alfa', 'Alfa'],
  ['ChartDonut', montarDonut, 'Slices', 'Alfa', 'Alfa'],
  ['ChartRadial', montarRadial, 'Tracks', 'Alfa', 'Alfa'],
  ['ChartTreemap', montarTreemap, 'Groups', 'Alfa', 'Alfa'],
  ['ChartSunburst', montarSunburst, 'Groups', 'Alfa', 'Alfa'],
  ['ChartTimeline', montarTimeline, 'Series', 'Receita', 'Receita'],
  ['ChartMap', montarMap, 'Series', 'Regional Norte', 'norte'],
];

describe.each(ocultaveis)('%s: hidden, defaultHidden e onHiddenChange', (_, montar, antigo, entrada, id) => {
  const legenda = () => screen.getByRole('button', { name: new RegExp(`^${entrada}`) });

  it('avisa os rotulos ocultos pelo nome novo', () => {
    const onHiddenChange = vi.fn();
    render(montar({ onHiddenChange }));

    fireEvent.click(legenda());

    expect(onHiddenChange).toHaveBeenCalledWith([id]);
  });

  it('o nome antigo continua avisando, e com os dois os dois avisam', () => {
    const avisoAntigo = vi.fn();
    const { unmount } = render(montar({ [`onHidden${antigo}Change`]: avisoAntigo }));

    fireEvent.click(legenda());
    expect(avisoAntigo).toHaveBeenCalledWith([id]);
    unmount();

    avisoAntigo.mockClear();
    const avisoNovo = vi.fn();
    render(montar({ [`onHidden${antigo}Change`]: avisoAntigo, onHiddenChange: avisoNovo }));
    fireEvent.click(legenda());

    expect(avisoNovo).toHaveBeenCalledWith([id]);
    expect(avisoAntigo).toHaveBeenCalledWith([id]);
  });

  it('obedece hidden e defaultHidden, e os antigos quando os novos nao vem', () => {
    const desligada = (props: Props) => {
      const { unmount } = render(montar(props));
      const pressionado = legenda().getAttribute('aria-pressed');
      unmount();
      return pressionado === 'false';
    };

    expect(desligada({ hidden: [id] })).toBe(true);
    expect(desligada({ [`hidden${antigo}`]: [id] })).toBe(true);
    expect(desligada({ defaultHidden: [id] })).toBe(true);
    expect(desligada({ [`defaultHidden${antigo}`]: [id] })).toBe(true);
    expect(desligada({ hidden: [], [`hidden${antigo}`]: [id] })).toBe(false);
  });
});

interface CasoDeMarca {
  /** Nome antigo do clique; o `onMarkClick` do ChartCombo ja era o final. */
  antigoClique?: string;
  antigoHover?: string;
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
  { antigoClique: 'onBarClick', antigoHover: 'onHoverCategory', esperadoClique: pontoCartesiano, esperadoHover: categoriaJan, montar: montarBar, nome: 'ChartBar' },
  { antigoClique: 'onPointClick', antigoHover: 'onHoverCategory', esperadoClique: pontoCartesiano, esperadoHover: categoriaJan, montar: montarLine, nome: 'ChartLine' },
  { antigoClique: 'onPointClick', antigoHover: 'onHoverCategory', esperadoClique: pontoCartesiano, esperadoHover: categoriaJan, montar: montarArea, nome: 'ChartArea' },
  { antigoHover: 'onHoverCategory', esperadoClique: pontoCartesiano, esperadoHover: categoriaJan, montar: montarCombo, nome: 'ChartCombo' },
  {
    antigoClique: 'onPointClick',
    esperadoClique: { index: 0, point: { x: 1, y: 2 }, series: 'Receita' },
    esperadoHover: { index: 0, point: { x: 1, y: 2 }, series: 'Receita' },
    montar: montarScatter,
    nome: 'ChartScatter',
  },
  { antigoClique: 'onSliceClick', antigoHover: 'onHoverSlice', esperadoClique: itens[0], esperadoHover: itens[0], montar: montarPie, nome: 'ChartPie' },
  { antigoClique: 'onSliceClick', antigoHover: 'onHoverSlice', esperadoClique: itens[0], esperadoHover: itens[0], montar: montarDonut, nome: 'ChartDonut' },
  { antigoClique: 'onTrackClick', esperadoClique: itens[0], esperadoHover: itens[0], montar: montarRadial, nome: 'ChartRadial' },
  {
    antigoClique: 'onStepClick',
    antigoHover: 'onHoverStep',
    esperadoClique: { index: 0, step: itens[0] },
    esperadoHover: { index: 0, step: itens[0] },
    montar: montarWaterfall,
    nome: 'ChartWaterfall',
  },
  { antigoClique: 'onNodeClick', antigoHover: 'onHoverNode', esperadoClique: caminho('Beta'), esperadoHover: caminho('Beta'), montar: montarTreemap, nome: 'ChartTreemap' },
  { antigoClique: 'onNodeClick', antigoHover: 'onHoverNode', esperadoClique: caminho('Beta'), esperadoHover: caminho('Beta'), montar: montarSunburst, nome: 'ChartSunburst' },
  { antigoClique: 'onFlowClick', esperadoClique: ligacao, esperadoHover: ligacao, montar: montarSankey, nome: 'ChartSankey' },
  {
    antigoClique: 'onRegionClick',
    antigoHover: 'onHoverRegion',
    esperadoClique: expect.objectContaining({ id: 'AA', kind: 'region', name: 'Região' }),
    esperadoHover: expect.objectContaining({ id: 'AA', kind: 'region' }),
    montar: montarMap,
    nome: 'ChartMap',
  },
  { antigoClique: 'onCellClick', antigoHover: 'onHoverCell', esperadoClique: celula, esperadoHover: celula, montar: montarHeatmap, nome: 'ChartHeatmap' },
  {
    antigoClique: 'onSegmentClick',
    esperadoClique: { row: expect.objectContaining({ key: 'a' }), segment: expect.objectContaining({ series: 'Receita' }) },
    montar: montarTimeline,
    nome: 'ChartTimeline',
  },
];

/** A primeira marca do grafico, dentro do grupo: a legenda fica de fora. */
const primeiraMarca = () => within(screen.getByRole('group')).getAllByRole('button')[0];

describe.each(marcas)('$nome: onMarkClick', ({ antigoClique, esperadoClique, montar }) => {
  it('avisa a marca clicada pelo nome novo', () => {
    const onMarkClick = vi.fn();
    render(montar({ onMarkClick }));

    fireEvent.click(primeiraMarca());

    expect(onMarkClick).toHaveBeenCalledTimes(1);
    expect(onMarkClick).toHaveBeenCalledWith(esperadoClique);
  });

  it.runIf(antigoClique)('o nome antigo continua avisando, e com os dois os dois avisam', () => {
    const antigo = vi.fn();
    const { unmount } = render(montar({ [antigoClique!]: antigo }));

    fireEvent.click(primeiraMarca());
    expect(antigo).toHaveBeenCalledTimes(1);
    unmount();

    antigo.mockClear();
    const novo = vi.fn();
    render(montar({ [antigoClique!]: antigo, onMarkClick: novo }));
    fireEvent.click(primeiraMarca());

    expect(novo).toHaveBeenCalledTimes(1);
    expect(antigo).toHaveBeenCalledTimes(1);
  });
});

describe.each(marcas.filter(({ esperadoHover }) => esperadoHover !== undefined))(
  '$nome: onHover',
  ({ antigoHover, esperadoHover, montar }) => {
    const focarPrimeiraMarca = () => act(() => primeiraMarca().focus());

    it('avisa a marca sob o foco pelo nome novo', () => {
      const onHover = vi.fn();
      render(montar({ onHover, onMarkClick: vi.fn() }));

      focarPrimeiraMarca();

      expect(onHover).toHaveBeenCalledWith(esperadoHover);
    });

    it.runIf(antigoHover)('o nome antigo continua avisando, e com os dois os dois avisam', () => {
      const antigo = vi.fn();
      const { unmount } = render(montar({ [antigoHover!]: antigo, onMarkClick: vi.fn() }));

      focarPrimeiraMarca();
      expect(antigo).toHaveBeenCalled();
      unmount();

      antigo.mockClear();
      const novo = vi.fn();
      render(montar({ [antigoHover!]: antigo, onHover: novo, onMarkClick: vi.fn() }));
      focarPrimeiraMarca();

      expect(novo).toHaveBeenCalledWith(esperadoHover);
      expect(antigo).toHaveBeenCalled();
    });
  },
);
