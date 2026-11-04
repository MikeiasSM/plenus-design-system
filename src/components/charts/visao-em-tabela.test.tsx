import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ChartArea } from './ChartArea';
import { ChartBar } from './ChartBar';
import { ChartCombo } from './ChartCombo';
import { ChartDonut } from './ChartDonut';
import { ChartLine } from './ChartLine';
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
  { label: 'Receita', values: [1000, 2000] },
  { label: 'Custo', values: [500, 250] },
];
const itens = [
  { label: 'Alfa', value: 30 },
  { label: 'Beta', value: 70 },
];
const arvore = [
  { children: [{ label: 'Filho A', value: 10 }, { label: 'Filho B', value: 30 }], label: 'Grupo' },
  { label: 'Solto', value: 60 },
];

const graficos: [string, Montar][] = [
  ['ChartBar', (props) => <ChartBar categories={categorias} series={serie} title="Gráfico" {...props} />],
  ['ChartLine', (props) => <ChartLine categories={categorias} series={serie} title="Gráfico" {...props} />],
  ['ChartArea', (props) => <ChartArea categories={categorias} series={serie} title="Gráfico" {...props} />],
  ['ChartCombo', (props) => <ChartCombo categories={categorias} series={serie.map((item) => ({ ...item, kind: 'bar' as const }))} title="Gráfico" {...props} />],
  ['ChartWaterfall', (props) => <ChartWaterfall steps={[{ label: 'Início', total: true, value: 100 }, { label: 'Custos', value: -40 }]} title="Gráfico" {...props} />],
  ['ChartScatter', (props) => <ChartScatter series={[{ label: 'A', points: [{ x: 1, y: 2 }] }]} title="Gráfico" {...props} />],
  ['ChartPie', (props) => <ChartPie slices={itens} title="Gráfico" {...props} />],
  ['ChartDonut', (props) => <ChartDonut slices={itens} title="Gráfico" {...props} />],
  ['ChartRadial', (props) => <ChartRadial title="Gráfico" tracks={[{ label: 'Meta', max: 100, value: 40 }]} {...props} />],
  ['ChartTreemap', (props) => <ChartTreemap nodes={arvore} title="Gráfico" {...props} />],
  ['ChartSunburst', (props) => <ChartSunburst nodes={arvore} title="Gráfico" {...props} />],
  ['ChartSankey', (props) => <ChartSankey flows={[{ source: 'A', target: 'B', value: 5 }]} title="Gráfico" {...props} />],
  [
    'ChartTimeline',
    (props) => (
      <ChartTimeline
        rows={[{ key: 'a', label: 'Linha' }]}
        segments={[{ end: 2, row: 'a', series: 'Receita', start: 1 }]}
        series={[{ label: 'Receita' }]}
        title="Gráfico"
        {...props}
      />
    ),
  ],
];

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
});

describe.each(graficos)('%s: visão em tabela', (_, montar) => {
  it('troca o desenho pela tabela, nomeada pelo título, e volta', () => {
    render(montar({}));
    const botao = screen.getByRole('button', { name: 'Ver como tabela' });

    fireEvent.click(botao);

    expect(botao).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table', { name: 'Gráfico' })).toBeInTheDocument();

    fireEvent.click(botao);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('showTableToggle={false} tira o botão', () => {
    render(montar({ showTableToggle: false }));

    expect(screen.queryByRole('button', { name: 'Ver como tabela' })).not.toBeInTheDocument();
  });
});

describe('o conteúdo da tabela', () => {
  const abrir = () => fireEvent.click(screen.getByRole('button', { name: 'Ver como tabela' }));
  const linhas = () => within(screen.getByRole('table')).getAllByRole('row').map((linha) => linha.textContent);

  it('cartesiano: uma linha por categoria, uma coluna por série, no formato do gráfico', () => {
    render(<ChartBar categories={categorias} formatValue={(valor) => `R$ ${valor}`} series={serie} title="Gráfico" />);
    abrir();

    expect(within(screen.getByRole('table')).getAllByRole('columnheader').map((cabecalho) => cabecalho.textContent)).toEqual(['Receita', 'Custo']);
    expect(linhas()).toEqual(['ReceitaCusto', 'janR$ 1000R$ 500', 'fevR$ 2000R$ 250']);
  });

  it('cartesiano: o valor ausente fica em branco, e a série desligada na legenda continua na tabela', () => {
    render(
      <ChartLine
        categories={categorias}
        defaultHidden={['Custo']}
        series={[{ label: 'Receita', values: [1, null] }, { label: 'Custo', values: [3, 4] }]}
        title="Gráfico"
      />,
    );
    abrir();

    expect(linhas()).toEqual(['ReceitaCusto', 'jan13', 'fev4']);
  });

  it('combo: cada série no formato do eixo dela', () => {
    render(
      <ChartCombo
        categories={['jan']}
        formatRightValue={(valor) => `${valor}%`}
        formatValue={(valor) => `R$ ${valor}`}
        series={[{ kind: 'bar', label: 'Receita', values: [10] }, { axis: 'right', kind: 'line', label: 'Taxa', values: [5] }]}
        title="Gráfico"
      />,
    );
    abrir();

    expect(linhas()[1]).toBe('janR$ 105%');
  });

  it('anel: o valor e a parte do total, calculada sobre todas as fatias', () => {
    render(<ChartPie defaultHidden={['Alfa']} slices={itens} title="Gráfico" />);
    abrir();

    expect(linhas()).toEqual(['Valor% do total', 'Alfa3030%', 'Beta7070%']);
  });

  it('cascata: a variação com sinal e o acumulado; o total só fecha a conta', () => {
    render(<ChartWaterfall steps={[{ label: 'Início', total: true, value: 100 }, { label: 'Custos', value: -40 }]} title="Gráfico" />);
    abrir();

    expect(linhas()).toEqual(['VariaçãoAcumulado', 'Início100', 'Custos-4060']);
  });

  it('hierarquia: o caminho do grupo até o nó e a parte do total da raiz', () => {
    render(<ChartTreemap nodes={arvore} title="Gráfico" />);
    abrir();

    expect(linhas()).toEqual(['Valor% do total', 'Grupo4040%', 'Grupo › Filho A1010%', 'Grupo › Filho B3030%', 'Solto6060%']);
  });

  it('fluxo: origem e destino no cabeçalho, o valor e a parte da saída da origem', () => {
    render(
      <ChartSankey
        flows={[{ source: 'A', target: 'B', value: 30 }, { source: 'A', target: 'C', value: 70 }]}
        title="Gráfico"
      />,
    );
    abrir();

    expect(linhas()).toEqual(['ValorDa saída da origem', 'A → B3030%', 'A → C7070%']);
  });

  it('anéis de meta: valor, meta e quanto foi atingido', () => {
    render(<ChartRadial title="Gráfico" tracks={[{ label: 'Vendas', max: 200, value: 50 }]} />);
    abrir();

    expect(linhas()).toEqual(['ValorMetaAtingido', 'Vendas5020025%']);
  });

  it('dispersão: os pontos com as medidas nomeadas', () => {
    render(<ChartScatter series={[{ label: 'A', points: [{ label: 'p1', x: 1, y: 2 }] }]} title="Gráfico" xLabel="Preço" yLabel="Vendas" />);
    abrir();

    expect(linhas()).toEqual(['PreçoVendas', 'A, p112']);
  });
});
