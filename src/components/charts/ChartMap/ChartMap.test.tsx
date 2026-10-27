import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ChartMap, type ChartMapProps } from './ChartMap';
import type { ChartMapFeature } from './mapGeometry';
import legendStyles from '../core/ColorLegend.module.css';
import styles from './ChartMap.module.css';

type Ring = number[][];

/** Anel no sentido que o d3-geo le: horario, com a latitude para cima. */
const box = (x: number, y: number, width: number, height = width): Ring => [
  [x, y],
  [x, y + height],
  [x + width, y + height],
  [x + width, y],
  [x, y],
];

const polygon = (id: string, name: string, ...rings: Ring[]): ChartMapFeature => ({
  geometry: { coordinates: rings, type: 'Polygon' },
  id,
  properties: { name },
});

const ell: Ring = [
  [20, 0],
  [20, 10],
  [23, 10],
  [23, 3],
  [30, 3],
  [30, 0],
  [20, 0],
];

const geometry = {
  features: [
    polygon('AA', 'Alfa', box(0, 0, 10)),
    polygon('BB', 'Beta', box(10, 0, 10)),
    polygon('CC', 'Ômega', ell),
    polygon('DD', 'Delta', box(31, 5, 0.4)),
    {
      geometry: { coordinates: [[box(0, 11, 10)], [box(-3, 15, 0.3)]], type: 'MultiPolygon' },
      id: 'EE',
      properties: { name: 'Eco' },
    },
  ],
};

const data = [
  { id: 'AA', value: 100 },
  { id: 'BB', value: 45 },
  { id: 'CC', value: 10 },
  { id: 'EE', value: 70 },
];

function map(props: Partial<ChartMapProps> = {}) {
  return <ChartMap data={data} geometry={geometry} title="Vendas por região" {...props} />;
}

function setSize(width = 640, height = 440) {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: height });
}

const regionPaths = () => [...document.querySelectorAll<SVGPathElement>(`path.${styles.region}`)];
const regionNamed = (name: string) => regionPaths().find((path) => path.getAttribute('aria-label')?.startsWith(name))!;
const tooltip = () => document.querySelector('[class*="tooltip"]');

/** Largura do desenho de uma regiao, pelas coordenadas do caminho. */
function drawnWidth(path: Element) {
  const xs = [...(path.getAttribute('d') ?? '').matchAll(/[ML](-?[\d.]+),/g)].map((match) => Number(match[1]));
  return Math.max(...xs) - Math.min(...xs);
}

function hover(element: Element) {
  fireEvent.pointerMove(element, { clientX: 10, clientY: 10 });
  fireEvent.mouseOver(element);
}

describe('ChartMap', () => {
  beforeEach(() => setSize());
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
  });

  it('e imagem nomeada pelo titulo, com cada regiao descrita por nome, valor e posicao', () => {
    render(map());

    const image = screen.getByRole('img', { name: 'Vendas por região' });
    expect(image).toHaveAccessibleDescription(/Mapa de 5 regiões\. Maior valor: Alfa, 100\. Menor: Ômega, 10\. 1 sem dado\./);
    expect(regionPaths().map((path) => path.getAttribute('aria-label'))).toEqual([
      'Alfa, 100, 1º de 4',
      'Beta, 45, 3º de 4',
      'Ômega, 10, 4º de 4',
      'Delta, Sem dado',
      'Eco, 70, 2º de 4',
    ]);
    expect(regionPaths().some((path) => path.hasAttribute('tabindex'))).toBe(false);
  });

  it('com onRegionClick vira grupo, com as regioes como botoes e um ponto de tabulacao so', () => {
    const onRegionClick = vi.fn();
    render(map({ onRegionClick, selectedRegion: 'BB' }));

    const group = screen.getByRole('group', { name: 'Vendas por região' });
    const buttons = within(group).getAllByRole('button');

    expect(buttons).toHaveLength(5);
    expect(buttons.filter((button) => button.getAttribute('tabindex') === '0')).toEqual([regionNamed('Beta')]);
    expect(regionNamed('Beta')).toHaveAttribute('aria-pressed', 'true');
    expect(regionNamed('Alfa')).toHaveAttribute('aria-pressed', 'false');
    expect(group).toHaveAccessibleDescription(/Use as setas para percorrer as marcas\./);

    fireEvent.click(regionNamed('Alfa'));
    fireEvent.keyDown(regionNamed('Alfa'), { key: 'Enter' });
    fireEvent.keyDown(regionNamed('Alfa'), { key: ' ' });

    expect(onRegionClick).toHaveBeenCalledTimes(3);
    expect(onRegionClick).toHaveBeenLastCalledWith({
      category: null,
      feature: geometry.features[0],
      id: 'AA',
      name: 'Alfa',
      value: 100,
    });
  });

  it('percorre as regioes pelas setas, na direcao de cada uma, e marca o foco', () => {
    render(map({ onRegionClick: () => undefined }));
    const alfa = regionNamed('Alfa');

    act(() => alfa.focus());
    expect(document.querySelector(`.${styles.focusOutline}`)).toBeInTheDocument();

    fireEvent.keyDown(alfa, { key: 'ArrowRight' });
    expect(regionNamed('Beta')).toHaveFocus();
    expect(regionNamed('Beta')).toHaveAttribute('tabindex', '0');
    expect(alfa).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(regionNamed('Beta'), { key: 'ArrowRight' });
    expect(regionNamed('Ômega')).toHaveFocus();

    fireEvent.keyDown(regionNamed('Ômega'), { key: 'ArrowLeft' });
    expect(regionNamed('Beta')).toHaveFocus();

    act(() => regionNamed('Alfa').focus());
    fireEvent.keyDown(regionNamed('Alfa'), { key: 'ArrowUp' });
    expect(regionNamed('Eco')).toHaveFocus();

    act(() => regionNamed('Ômega').focus());
    fireEvent.keyDown(regionNamed('Ômega'), { key: 'ArrowRight' });
    expect(regionNamed('Delta')).toHaveFocus();

    act(() => regionNamed('Delta').blur());
    expect(document.querySelector(`.${styles.focusOutline}`)).toBeNull();
  });

  it('desenha a regiao sem dado com hachura e a conta na legenda, ou em cinza liso', () => {
    const { rerender } = render(map());

    expect(regionNamed('Delta').getAttribute('fill')).toMatch(/^url\(#.+-hatch\)$/);
    expect(screen.getByText('Sem dado').closest('li')).toHaveTextContent('Sem dado1');

    rerender(map({ noDataStyle: 'neutral' }));
    expect(regionNamed('Delta')).toHaveAttribute('fill', 'var(--pl-chart-no-data)');
  });

  it('avisa em desenvolvimento o dado sem regiao, em vez de descartar calado', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(map({ data: [...data, { id: 'ZZ', value: 5 }, { id: 'YY', value: 1 }] }));

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('2 dado(s) sem região');
    expect(warn.mock.calls[0][0]).toContain('ZZ, YY');
    warn.mockRestore();
  });

  it('trata numero invalido como sem dado, sem geometria invalida', () => {
    render(
      map({
        data: [
          { id: 'AA', value: Number.NaN },
          { id: 'BB', value: Number.POSITIVE_INFINITY },
          { id: 'CC', value: 10 },
          { id: 'EE', value: 20 },
        ],
        showDataLabels: 'visible',
      }),
    );

    expect(regionNamed('Alfa')).toHaveAttribute('aria-label', 'Alfa, Sem dado');
    expect(regionNamed('Beta')).toHaveAttribute('aria-label', 'Beta, Sem dado');
    expect(document.querySelector('svg')?.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it('pinta a sequencial pelos tokens e mostra os extremos na legenda', () => {
    render(map());

    expect(regionNamed('Alfa')).toHaveAttribute('fill', 'var(--pl-chart-sequential-7)');
    expect(regionNamed('Ômega')).toHaveAttribute('fill', 'var(--pl-chart-sequential-1)');
    expect(regionNamed('Beta').getAttribute('fill')).toMatch(/^color-mix\(in oklab, var\(--pl-chart-sequential-/);
    expect(document.querySelector(`.${legendStyles.gradientTicks}`)).toHaveTextContent('10100');
  });

  it('nas classes, a legenda conta, destaca e desliga cada faixa', () => {
    const onHiddenClassesChange = vi.fn();
    render(map({ colorScale: { thresholds: [50], type: 'classes' }, onHiddenClassesChange }));
    const high = screen.getByRole('button', { name: /50 ou mais/ });

    expect(high).toHaveTextContent('2');

    fireEvent.pointerEnter(high.closest('li')!);
    expect(regionNamed('Beta')).toHaveClass(styles.dimmed!);
    expect(regionNamed('Alfa')).not.toHaveClass(styles.dimmed!);
    fireEvent.pointerLeave(high.closest('li')!);
    expect(regionNamed('Beta')).not.toHaveClass(styles.dimmed!);

    fireEvent.click(high);
    expect(onHiddenClassesChange).toHaveBeenLastCalledWith([1]);
    expect(high).toHaveAttribute('aria-pressed', 'false');
    expect(regionNamed('Alfa')).toHaveAttribute('fill', 'var(--pl-color-surface-subtle)');
  });

  it('na categorica, a cor nomeia a categoria e a legenda desliga pelo id', () => {
    const onHiddenSeriesChange = vi.fn();
    render(
      map({
        colorScale: {
          categories: [
            { id: 'norte', label: 'Regional Norte' },
            { id: 'sul', label: 'Regional Sul' },
          ],
          type: 'categorical',
        },
        data: [
          { category: 'norte', id: 'AA' },
          { category: 'sul', id: 'BB' },
        ],
        onHiddenSeriesChange,
      }),
    );

    expect(regionNamed('Alfa')).toHaveAttribute('aria-label', 'Alfa, Regional Norte');
    expect(regionNamed('Alfa')).toHaveAttribute('fill', 'var(--pl-chart-series-1)');

    fireEvent.click(screen.getByRole('button', { name: /Regional Sul/ }));
    expect(onHiddenSeriesChange).toHaveBeenLastCalledWith(['sul']);
  });

  it('rotula dentro quando cabe, so a sigla quando o valor nao cabe e leva a regiao minuscula para a coluna', () => {
    const { rerender } = render(map({ showDataLabels: 'visible' }));
    const insideLabels = () => [...document.querySelectorAll(`text.${styles.label}`)].map((label) => label.textContent);

    expect(insideLabels()).toContain('AA100');
    expect(insideLabels()).toContain('CC10');
    expect(document.querySelector(`.${styles.callout}`)).toHaveTextContent('DD');
    expect(document.querySelector(`.${styles.leader}`)).toBeInTheDocument();

    rerender(map({ showDataLabels: 'visible', smallRegionLabels: 'hidden' }));
    expect(document.querySelector(`.${styles.callout}`)).toBeNull();

    rerender(map({ regionLabels: 'hidden' }));
    expect(insideLabels()).toEqual([]);
  });

  it('enquadra o recorte com teto de aproximacao e deixa o resto como contexto, sem interacao', () => {
    const { rerender } = render(map({ focus: ['AA', 'BB'], onRegionClick: () => undefined }));

    expect(within(screen.getByRole('group')).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Alfa, 100, 1º de 2',
      'Beta, 45, 2º de 2',
    ]);
    expect(document.querySelectorAll(`.${styles.context}`)).toHaveLength(3);

    // Sem o teto, o quadrado de 0,4 grau ocuparia a largura inteira.
    rerender(map({ data: [...data, { id: 'DD', value: 5 }], focus: ['DD'] }));
    expect(drawnWidth(regionPaths()[0])).toBeLessThan(120);
  });

  it('troca o desenho pela tabela, ordenada pelo valor, com busca sem acento e cabecalhos que ordenam', () => {
    render(map({ showShare: true }));
    const toggle = screen.getByRole('button', { name: 'Ver como tabela' });

    fireEvent.click(toggle);

    const table = screen.getAllByRole('table')[0];
    const names = () => within(table).getAllByRole('rowheader').map((cell) => cell.textContent);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('img')).toBeNull();
    expect(names()).toEqual(['Alfa', 'Eco', 'Beta', 'Ômega', 'Delta']);
    expect(table).toHaveTextContent('Alfa10044,4%1º');
    expect(within(table).getByRole('columnheader', { name: /Valor/ })).toHaveAttribute('aria-sort', 'descending');

    fireEvent.click(within(table).getByRole('button', { name: /Nome/ }));
    fireEvent.click(within(table).getByRole('button', { name: /Nome/ }));
    expect(names()).toEqual(['Alfa', 'Beta', 'Delta', 'Eco', 'Ômega']);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar pelo nome' }), { target: { value: 'omega' } });
    expect(names()).toEqual(['Ômega']);

    fireEvent.click(toggle);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('mostra no balao o valor, a parte do total e a posicao da regiao sob o ponteiro', () => {
    const { rerender } = render(map({ showShare: true }));

    hover(regionNamed('Alfa'));
    expect(tooltip()).toHaveTextContent('Alfa');
    expect(tooltip()).toHaveTextContent('Valor100');
    expect(tooltip()).toHaveTextContent('% do total44,4%');
    expect(tooltip()).toHaveTextContent('Posição1º de 4');
    expect(document.querySelector(`.${styles.hoverOutline}`)).toBeInTheDocument();
    expect(document.querySelector(`.${legendStyles.gradientIndicator}`)).toBeInTheDocument();

    fireEvent.mouseOut(regionNamed('Alfa'));
    hover(regionNamed('Delta'));
    expect(tooltip()).toHaveTextContent('Sem dado');

    rerender(map({ showTooltip: false }));
    hover(regionNamed('Alfa'));
    expect(tooltip()).toBeNull();
  });

  it('posiciona os marcadores, que viram botoes com onMarkerClick e saem pela legenda', () => {
    const onMarkerClick = vi.fn();
    const markers = [
      {
        id: 'capitais',
        label: 'Capitais',
        points: [
          { id: 'a', label: 'Cidade A', latitude: 5, longitude: 5, value: 100 },
          { id: 'b', label: 'Cidade B', latitude: 5, longitude: 15, value: 25 },
          { id: 'x', label: 'Invalida', latitude: Number.NaN, longitude: 15, value: 25 },
        ],
      },
    ];
    render(map({ markers, markerValueLabel: 'Clientes', onMarkerClick }));

    const cityA = screen.getByRole('button', { name: 'Cidade A, Capitais, 100' });
    const cityB = screen.getByRole('button', { name: 'Cidade B, Capitais, 25' });
    expect(Number(cityA.getAttribute('r'))).toBeCloseTo(20);
    expect(Number(cityB.getAttribute('r'))).toBeCloseTo(10);
    expect(screen.queryByRole('button', { name: /Invalida/ })).toBeNull();

    fireEvent.keyDown(cityA, { key: 'Enter' });
    expect(onMarkerClick).toHaveBeenCalledWith({ id: 'a', series: 'capitais', value: 100 });

    fireEvent.click(screen.getByRole('button', { name: 'Capitais' }));
    expect(screen.queryByRole('button', { name: /Cidade A/ })).toBeNull();
  });

  it('anuncia o vazio quando nenhuma regiao tem valor', () => {
    render(map({ data: [] }));

    expect(screen.getByText('Sem dados')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ver como tabela' })).toBeNull();
  });

  it('desenha igual a feicao no sentido da RFC 7946 e descarta o anel com menos de quatro posicoes', () => {
    const reversed = { ...geometry.features[0], geometry: { coordinates: [[...box(0, 0, 10)].reverse()], type: 'Polygon' } };
    const broken = polygon('XX', 'Quebrada', [
      [0, 0],
      [1, 1],
      [0, 0],
    ]);
    const { rerender } = render(map());
    const original = regionNamed('Alfa').getAttribute('d');

    rerender(map({ geometry: { features: [reversed, ...geometry.features.slice(1), broken] } }));

    expect(regionNamed('Alfa').getAttribute('d')).toBe(original);
    expect(regionPaths()).toHaveLength(5);
  });

  it('le identificador, nome e rotulo pelos caminhos informados', () => {
    const features = [
      { geometry: { coordinates: [box(0, 0, 10)], type: 'Polygon' }, properties: { codigo: 31, nome: 'Minas', sigla: 'MG' } },
    ];
    render(
      <ChartMap
        data={[{ id: '31', value: 5 }]}
        featureIdKey="properties.codigo"
        featureLabelKey="properties.sigla"
        featureNameKey="properties.nome"
        geometry={{ features }}
        title="Estados"
      />,
    );

    expect(regionPaths()[0]).toHaveAttribute('aria-label', 'Minas, 5, 1º de 1');
    expect(document.querySelector(`text.${styles.label}`)).toHaveTextContent('MG');
  });
});
