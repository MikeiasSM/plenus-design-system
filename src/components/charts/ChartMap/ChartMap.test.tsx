import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ChartMap, type ChartMapProps } from './ChartMap';
import type { ChartMapFeature } from './mapGeometry';
import legendStyles from '../core/ColorLegend.module.css';
import styles from './ChartMap.module.css';

type Ring = number[][];

/** Anel no sentido que o d3-geo le: horário, com a latitude para cima. */
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

  it('com onMarkClick vira grupo, com as regioes como botoes e um ponto de tabulacao so', () => {
    const onMarkClick = vi.fn();
    render(map({ onMarkClick, selectedRegion: 'BB' }));

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

    expect(onMarkClick).toHaveBeenCalledTimes(3);
    expect(onMarkClick).toHaveBeenLastCalledWith({
      category: null,
      feature: geometry.features[0],
      id: 'AA',
      kind: 'region',
      name: 'Alfa',
      value: 100,
    });
  });

  it('sem controle, comeca pelo defaultSelectedRegion e o clique alterna a escolha', () => {
    const onSelectedRegionChange = vi.fn();
    render(map({ defaultSelectedRegion: 'BB', onSelectedRegionChange }));

    expect(regionNamed('Beta')).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(regionNamed('Alfa'));
    expect(onSelectedRegionChange).toHaveBeenLastCalledWith('AA');
    expect(regionNamed('Alfa')).toHaveAttribute('aria-pressed', 'true');
    expect(regionNamed('Beta')).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(regionNamed('Alfa'));
    expect(onSelectedRegionChange).toHaveBeenLastCalledWith(null);
    expect(regionNamed('Alfa')).toHaveAttribute('aria-pressed', 'false');
  });

  it('controlada, avisa a escolha mas so muda quando o produto muda selectedRegion', () => {
    const onSelectedRegionChange = vi.fn();
    render(map({ onSelectedRegionChange, selectedRegion: 'BB' }));

    fireEvent.click(regionNamed('Alfa'));

    expect(onSelectedRegionChange).toHaveBeenCalledWith('AA');
    expect(regionNamed('Beta')).toHaveAttribute('aria-pressed', 'true');
  });

  it('percorre as regioes pelas setas, na direcao de cada uma, e marca o foco', () => {
    render(map({ onMarkClick: () => undefined }));
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

  it('nas classes, comeca com as faixas do defaultHiddenClasses desligadas', () => {
    render(map({ colorScale: { thresholds: [50], type: 'classes' }, defaultHiddenClasses: [1] }));

    expect(screen.getByRole('button', { name: /50 ou mais/ })).toHaveAttribute('aria-pressed', 'false');
    expect(regionNamed('Alfa')).toHaveAttribute('fill', 'var(--pl-color-surface-subtle)');
  });

  it('na categorica, a cor nomeia a categoria e a legenda desliga pelo id', () => {
    const onHiddenChange = vi.fn();
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
        onHiddenChange,
      }),
    );

    expect(regionNamed('Alfa')).toHaveAttribute('aria-label', 'Alfa, Regional Norte');
    expect(regionNamed('Alfa')).toHaveAttribute('fill', 'var(--pl-chart-series-1)');

    fireEvent.click(screen.getByRole('button', { name: /Regional Sul/ }));
    expect(onHiddenChange).toHaveBeenLastCalledWith(['sul']);
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
    const { rerender } = render(map({ focus: ['AA', 'BB'], onMarkClick: () => undefined }));

    expect(within(screen.getByRole('group')).getAllByRole('button').map((button) => button.getAttribute('aria-label'))).toEqual([
      'Alfa, 100, 1º de 2',
      'Beta, 45, 2º de 2',
    ]);
    expect(document.querySelectorAll(`.${styles.context}`)).toHaveLength(3);

    // Sem o teto, o quadrado de 0,4 grau ocuparia a largura inteira.
    rerender(map({ data: [...data, { id: 'DD', value: 5 }], focus: ['DD'] }));
    expect(drawnWidth(regionPaths()[0])).toBeLessThan(120);
  });

  describe('focusMarkers', () => {
    const bairros = [
      {
        id: 'bairros',
        label: 'Bairros',
        points: [
          { id: 'a', label: 'Bairro A', latitude: 4, longitude: 4, value: 100 },
          { id: 'b', label: 'Bairro B', latitude: 5, longitude: 6, value: 25 },
          { id: 'AA', label: 'Mesmo id da regiao', latitude: 15, longitude: 25, value: 25 },
        ],
      },
    ];
    const markerCircles = () => [...document.querySelectorAll<SVGCircleElement>(`circle.${styles.marker}`)];
    const spread = () => {
      const xs = markerCircles().map((circle) => Number(circle.getAttribute('cx')));
      return Math.max(...xs) - Math.min(...xs);
    };
    const framed = (props: Partial<ChartMapProps> = {}) =>
      map({ markers: bairros, onMarkClick: () => undefined, ...props });

    it('aproxima o desenho dos marcadores indicados, sem apagar as regioes nem a interacao', () => {
      const { rerender } = render(framed());
      const whole = spread();

      rerender(framed({ focusMarkers: ['a', 'b'] }));

      expect(spread()).toBeGreaterThan(whole * 3);
      expect(document.querySelectorAll(`.${styles.context}`)).toHaveLength(0);
      expect(regionPaths().filter((path) => path.getAttribute('role') === 'button')).toHaveLength(5);
    });

    it('guarda os marcadores dentro da area com a margem do maior raio', () => {
      render(framed({ focusMarkers: ['a', 'b'] }));
      const [bairroA] = markerCircles();

      expect(Number(bairroA.getAttribute('cx')) - Number(bairroA.getAttribute('r'))).toBeGreaterThanOrEqual(12);
      expect(Number(bairroA.getAttribute('cy')) - Number(bairroA.getAttribute('r'))).toBeGreaterThanOrEqual(12);
    });

    it('para de aproximar num ponto so, sem passar do teto', () => {
      const { rerender } = render(framed());
      const wholeWidth = drawnWidth(regionPaths()[0]);

      rerender(framed({ focusMarkers: ['a'] }));

      expect(drawnWidth(regionPaths()[0])).toBeGreaterThan(wholeWidth * 90);
      expect(drawnWidth(regionPaths()[0])).toBeLessThanOrEqual(wholeWidth * 100 + 1);
    });

    it('com focus, abraca as regioes e os marcadores, e o resto segue como contexto', () => {
      render(framed({ focus: ['BB'], focusMarkers: ['a'] }));

      expect(document.querySelectorAll(`.${styles.context}`)).toHaveLength(4);
      expect(drawnWidth(regionNamed('Beta'))).toBeGreaterThan(0);
    });

    it('ignora ids que nao sao de marcador, mesmo se forem de regiao', () => {
      const { rerender } = render(framed());
      const before = regionPaths().map((path) => path.getAttribute('d'));

      rerender(framed({ focusMarkers: ['BB', 'inexistente'] }));

      expect(regionPaths().map((path) => path.getAttribute('d'))).toEqual(before);
    });
  });

  describe('subdivisions', () => {
    const divisas = { features: [polygon('a', 'Alfa Norte', box(0, 0, 5, 10)), polygon('b', 'Alfa Sul', box(5, 0, 5, 10))] };
    const outline = () => document.querySelector<SVGPathElement>(`path.${styles.subdivision}`);

    it('desenha a malha como linha, sem interacao, fora da arvore de acessibilidade, da tabela e da legenda', () => {
      render(map({ onMarkClick: () => undefined, subdivisions: divisas }));

      expect(outline()?.getAttribute('d')).toMatch(/^M/);
      expect(outline()?.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(outline()?.closest(`.${styles.passThrough}`)).not.toBeNull();
      expect(within(screen.getByRole('group')).getAllByRole('button')).toHaveLength(5);
      expect(screen.queryByText('Alfa Norte')).toBeNull();
      expect(screen.getByRole('group').getAttribute('aria-describedby')).not.toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Ver como tabela' }));
      expect(within(screen.getAllByRole('table')[0]).getAllByRole('rowheader')).toHaveLength(5);
    });

    it('repete a borda das regioes por cima da malha', () => {
      render(map({ subdivisions: divisas }));

      expect(document.querySelectorAll(`path.${styles.border}`)).toHaveLength(5);
    });

    it('nao muda o desenho sem a propriedade', () => {
      render(map());

      expect(outline()).toBeNull();
      expect(document.querySelectorAll(`path.${styles.border}`)).toHaveLength(0);
    });

    it('acompanha o enquadramento do focus, com o contexto tambem contornado', () => {
      const { rerender } = render(map({ subdivisions: divisas }));
      const whole = outline()?.getAttribute('d');

      rerender(map({ focus: ['AA'], subdivisions: divisas }));

      expect(outline()?.getAttribute('d')).not.toEqual(whole);
      expect(document.querySelectorAll(`path.${styles.border}`)).toHaveLength(5);
    });
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

  it('posiciona os marcadores, que viram botoes com onMarkClick e saem pela legenda', () => {
    const onMarkClick = vi.fn();
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
    render(map({ markers, markerValueLabel: 'Clientes', onMarkClick }));

    const cityA = screen.getByRole('button', { name: 'Cidade A, Capitais, 100' });
    const cityB = screen.getByRole('button', { name: 'Cidade B, Capitais, 25' });
    expect(Number(cityA.getAttribute('r'))).toBeCloseTo(20);
    expect(Number(cityB.getAttribute('r'))).toBeCloseTo(10);
    expect(screen.queryByRole('button', { name: /Invalida/ })).toBeNull();

    fireEvent.keyDown(cityA, { key: 'Enter' });
    expect(onMarkClick).toHaveBeenCalledWith({ id: 'a', kind: 'marker', series: 'capitais', value: 100 });

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

  describe('clickableMarks', () => {
    const cidades = [
      {
        id: 'capitais',
        label: 'Capitais',
        points: [
          { id: 'a', label: 'Cidade A', latitude: 5, longitude: 5, value: 100 },
          { id: 'b', label: 'Cidade B', latitude: 5, longitude: 15, value: 25 },
        ],
      },
    ];
    const tabStops = () => document.querySelectorAll('[tabindex="0"]');

    it('por padrao, regioes e marcadores viram botoes', () => {
      render(map({ markers: cidades, onMarkClick: () => undefined }));

      expect(screen.getAllByRole('button').filter((button) => button.hasAttribute('data-mark'))).toHaveLength(5 + 2);
    });

    it('so os marcadores: as regioes seguem como desenho, fora do Tab e sem chamar onMarkClick', () => {
      const onMarkClick = vi.fn();
      render(map({ clickableMarks: ['marker'], markers: cidades, onMarkClick }));

      expect(regionPaths().every((path) => path.getAttribute('role') === 'graphics-symbol')).toBe(true);
      expect(screen.getAllByRole('button').filter((button) => button.hasAttribute('data-mark'))).toHaveLength(2);
      expect(tabStops()).toHaveLength(1);
      expect(tabStops()[0]).toHaveAccessibleName('Cidade A, Capitais, 100');

      fireEvent.click(regionNamed('Alfa'));
      expect(onMarkClick).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Cidade B, Capitais, 25' }));
      expect(onMarkClick).toHaveBeenCalledWith({ id: 'b', kind: 'marker', series: 'capitais', value: 25 });
    });

    it('so as regioes: os marcadores deixam de ser botoes', () => {
      const onMarkClick = vi.fn();
      render(map({ clickableMarks: ['region'], markers: cidades, onMarkClick }));

      expect(screen.queryByRole('button', { name: /Cidade A/ })).toBeNull();
      expect(screen.getByRole('img', { name: 'Cidade A, Capitais, 100' })).toBeInTheDocument();
      expect(tabStops()).toHaveLength(1);

      fireEvent.click(regionNamed('Alfa'));
      expect(onMarkClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('zoomable', () => {
    const status = () => screen.getByRole('status');
    const canvas = () => screen.getByRole('img', { name: 'Vendas por região' });
    const view = { center: [15, 8] as [number, number], scale: 3 };

    it('desligado, nao traz controles, status nem touch-action proprio', () => {
      render(map());

      expect(screen.queryByRole('button', { name: 'Aproximar' })).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
      expect(document.querySelector(`.${styles.plotZoomable}`)).toBeNull();
      expect(canvas()).not.toHaveAttribute('tabindex');
    });

    it('ligado, a area do mapa libera so o pan do navegador: um dedo rola a pagina', () => {
      render(map({ zoomable: true }));

      expect(document.querySelector(`.${styles.plotZoomable}`)).toBeInTheDocument();
    });

    it('aproxima, afasta e volta pelos botoes, anunciando a escala e travando os que nao se aplicam', () => {
      const onViewChange = vi.fn();
      render(map({ onViewChange, zoomable: true }));
      const zoomIn = screen.getByRole('button', { name: 'Aproximar' });
      const zoomOut = screen.getByRole('button', { name: 'Afastar' });
      const reset = screen.getByRole('button', { name: 'Voltar ao enquadramento' });

      expect(zoomOut).toBeDisabled();
      expect(reset).toBeDisabled();
      expect(status()).toBeEmptyDOMElement();

      fireEvent.click(zoomIn);
      fireEvent.click(zoomIn);
      expect(status()).toHaveTextContent('Aproximação de 4 vezes');
      expect(onViewChange).toHaveBeenLastCalledWith(expect.objectContaining({ scale: expect.closeTo(4) }));
      expect(zoomOut).toBeEnabled();
      expect(reset).toBeEnabled();

      fireEvent.click(zoomOut);
      expect(status()).toHaveTextContent('Aproximação de 2 vezes');

      fireEvent.click(reset);
      expect(status()).toHaveTextContent('Enquadramento inicial');
      expect(onViewChange).toHaveBeenLastCalledWith(expect.objectContaining({ scale: 1 }));
      expect(reset).toBeDisabled();
    });

    it('aproximado, afasta os marcadores uns dos outros mas mantem o raio deles em pixels', () => {
      const points = [
        { id: 'p', label: 'Ponto', latitude: 5, longitude: 5, value: 10 },
        { id: 'q', label: 'Outro', latitude: 5, longitude: 15, value: 10 },
      ];
      render(map({ markers: [{ id: 's', label: 'Série', points }], zoomable: true }));
      const circles = () => [...document.querySelectorAll<SVGCircleElement>(`circle.${styles.marker}`)];
      const gap = () => Math.abs(Number(circles()[0].getAttribute('cx')) - Number(circles()[1].getAttribute('cx')));
      const [before, radius] = [gap(), circles()[0].getAttribute('r')];

      fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));

      expect(gap()).toBeCloseTo(before * 2, 3);
      expect(circles()[0].getAttribute('r')).toBe(radius);
    });

    it('controlada, mostra a vista recebida e so avisa o pedido do usuario', () => {
      const onViewChange = vi.fn();
      render(map({ onViewChange, view, zoomable: true }));

      expect(status()).toHaveTextContent('Aproximação de 3 vezes');

      fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));

      expect(onViewChange).toHaveBeenCalledWith(expect.objectContaining({ scale: expect.closeTo(6) }));
      expect(status()).toHaveTextContent('Aproximação de 3 vezes');
    });

    it('comeca pelo defaultView e limita a escala ao teto', () => {
      render(map({ defaultView: { center: [15, 8], scale: 1e6 }, zoomable: true }));

      expect(screen.getByRole('button', { name: 'Aproximar' })).toBeDisabled();
      expect(status()).toHaveTextContent(/Aproximação de \d+/);
    });

    it('so a rolagem com Ctrl ou ⌘ aproxima; sem a tecla, a pagina rola e aparece a dica', () => {
      vi.useFakeTimers();
      render(map({ zoomable: true }));

      expect(fireEvent.wheel(canvas(), { deltaY: -100 })).toBe(true);
      expect(screen.getByText('Use Ctrl + rolagem para aproximar')).toBeInTheDocument();
      expect(status()).toBeEmptyDOMElement();

      act(() => {
        vi.advanceTimersByTime(1600);
      });
      expect(screen.queryByText('Use Ctrl + rolagem para aproximar')).toBeNull();

      expect(fireEvent.wheel(canvas(), { ctrlKey: true, deltaY: -100 })).toBe(false);
      expect(status()).toHaveTextContent(/Aproximação de/);

      fireEvent.click(screen.getByRole('button', { name: 'Voltar ao enquadramento' }));
      expect(fireEvent.wheel(canvas(), { deltaY: -100, metaKey: true })).toBe(false);
      expect(status()).toHaveTextContent(/Aproximação de/);
      vi.useRealTimers();
    });

    it('atende ao teclado: + aproxima, - afasta, 0 volta e Shift com a seta arrasta', () => {
      const onViewChange = vi.fn();
      render(map({ onViewChange, zoomable: true }));

      expect(canvas()).toHaveAttribute('tabindex', '0');
      expect(canvas()).toHaveAccessibleDescription(/Use \+ e -/);

      fireEvent.keyDown(canvas(), { key: '+' });
      fireEvent.keyDown(canvas(), { key: '=' });
      expect(status()).toHaveTextContent('Aproximação de 4 vezes');

      fireEvent.keyDown(canvas(), { key: '-' });
      expect(status()).toHaveTextContent('Aproximação de 2 vezes');

      const before = onViewChange.mock.lastCall![0].center[0];
      fireEvent.keyDown(canvas(), { key: 'ArrowRight', shiftKey: true });
      expect(onViewChange.mock.lastCall![0].center[0]).toBeGreaterThan(before);

      fireEvent.keyDown(canvas(), { key: '0' });
      expect(status()).toHaveTextContent('Enquadramento inicial');
    });

    it('as setas sem Shift seguem percorrendo as marcas, e o Shift nao as percorre', () => {
      render(map({ onMarkClick: () => undefined, zoomable: true }));
      regionNamed('Alfa').focus();

      fireEvent.keyDown(regionNamed('Alfa'), { key: 'ArrowRight', shiftKey: true });
      expect(document.activeElement).toBe(regionNamed('Alfa'));

      fireEvent.keyDown(regionNamed('Alfa'), { key: 'ArrowRight' });
      expect(document.activeElement).not.toBe(regionNamed('Alfa'));
    });

    describe('arraste', () => {
      /** O jsdom não tem PointerEvent: sem ele, `pointerId` e `pointerType` não chegam ao gesto. */
      class PointerEventDoJsdom extends MouseEvent {
        readonly pointerId: number;
        readonly pointerType: string;

        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init);
          this.pointerId = init.pointerId ?? 0;
          this.pointerType = init.pointerType ?? '';
        }
      }

      beforeAll(() => {
        vi.stubGlobal('PointerEvent', PointerEventDoJsdom);
      });
      afterAll(() => {
        vi.unstubAllGlobals();
      });

      const press = (target: Element, x: number, y: number) =>
        fireEvent.pointerDown(target, { button: 0, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse' });
      const move = (x: number, y: number) =>
        fireEvent.pointerMove(regionNamed('Alfa'), {
          buttons: 1,
          clientX: x,
          clientY: y,
          pointerId: 1,
          pointerType: 'mouse',
        });
      const release = () =>
        fireEvent.pointerUp(regionNamed('Alfa'), { pointerId: 1, pointerType: 'mouse' });

      function setup() {
        const onMarkClick = vi.fn();
        const onViewChange = vi.fn();
        render(map({ defaultView: view, onMarkClick, onViewChange, zoomable: true }));
        return { onMarkClick, onViewChange };
      }

      it('move o mapa com o botao pressionado e nao dispara o clique depois', () => {
        const { onMarkClick, onViewChange } = setup();
        const alfa = regionNamed('Alfa');

        press(alfa, 100, 100);
        move(160, 100);
        expect(onViewChange).toHaveBeenCalledTimes(1);
        expect(onViewChange.mock.lastCall![0].center[0]).toBeLessThan(view.center[0]);

        release();
        fireEvent.click(alfa);
        expect(onMarkClick).not.toHaveBeenCalled();
      });

      it('o arraste curto, dentro da folga, nao move o mapa nem cancela o clique', () => {
        const { onMarkClick, onViewChange } = setup();
        const alfa = regionNamed('Alfa');

        press(alfa, 100, 100);
        move(102, 101);
        release();
        fireEvent.click(alfa);

        expect(onViewChange).not.toHaveBeenCalled();
        expect(onMarkClick).toHaveBeenCalledTimes(1);
      });

      it('o botao solto fora do mapa encerra o arraste: o ponteiro de volta, sem botao, nao move o mapa', () => {
        const { onViewChange } = setup();

        press(regionNamed('Alfa'), 100, 100);
        fireEvent.pointerMove(regionNamed('Alfa'), { buttons: 0, clientX: 160, clientY: 100, pointerId: 1, pointerType: 'mouse' });

        expect(onViewChange).not.toHaveBeenCalled();
      });
    });

    it('abaixo de 200 px de largura os controles saem, e o status continua', () => {
      setSize(180);
      render(map({ zoomable: true }));

      expect(screen.queryByRole('button', { name: 'Aproximar' })).toBeNull();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
