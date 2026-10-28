import {
  ChartScatter,
  formatarPercentual,
  type AxisVisibility,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartScatterSeries,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { OPCOES_DE_ACCENT, accentDa, formatarCompacto, VISIBILIDADES } from '../dadosDosGraficos';

const ZEROS = { true: true, false: false, x: 'x', y: 'y' } as const;

const CLIENTES: ChartScatterSeries[] = [
  {
    label: 'Indústria',
    points: [
      { label: 'Plenus Tecnologia', x: 18, y: 32, z: 26500 },
      { label: 'Indústria Belo', x: 34, y: 21, z: 18900 },
      { label: 'Três D Comércio', x: 46, y: 12, z: 10500 },
    ],
  },
  {
    label: 'Serviços',
    points: [
      { label: 'CDCE da Escola', x: 22, y: 38, z: 16400 },
      { label: 'S M de Oliveira', x: 41, y: 27, z: 14200 },
      { label: 'S P Ind. Com.', x: 55, y: 18, z: 9200 },
    ],
  },
];

const FATURAMENTO_ANUAL: ChartScatterSeries[] = [
  {
    label: 'Faturamento',
    points: [
      { x: 2020, y: 410000 },
      { x: 2021, y: 520000 },
      { x: 2022, y: 480000 },
      { x: 2023, y: 610000 },
      { x: 2024, y: 700000 },
      { x: 2025, y: 760000 },
    ],
  },
];

const formatarDias = (valor: number) => `${valor} d`;
const formatarMargem = (valor: number) => formatarPercentual(valor / 100);

/** Os mesmos clientes, sem a medida do tamanho. */
function semZ(series: readonly ChartScatterSeries[]) {
  return series.map((serie) => ({ ...serie, points: serie.points.map(({ label, x, y }) => ({ label, x, y })) }));
}

const playground = definirPlayground({
  inicial: {
    title: 'Prazo médio por margem',
    tamanhoPorZ: true,
    includeZero: 'true',
    legend: 'bottom',
    legendAlign: 'center',
    xAxis: 'visible',
    yAxis: 'visible',
    accent: 'nenhuma',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'booleano', nome: 'tamanhoPorZ' },
    { tipo: 'opcoes', nome: 'includeZero', opcoes: Object.keys(ZEROS) },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'xAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'yAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartScatter
        accent={accentDa(valores.accent)}
        formatX={formatarDias}
        formatY={formatarMargem}
        formatZ={formatarCompacto}
        includeZero={ZEROS[valores.includeZero as keyof typeof ZEROS]}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        onHiddenSeriesChange={(ocultas) => registrar(`onHiddenSeriesChange: [${ocultas.join(', ')}]`)}
        series={valores.tamanhoPorZ ? CLIENTES : semZ(CLIENTES)}
        title={valores.title}
        xAxis={valores.xAxis as AxisVisibility}
        yAxis={valores.yAxis as AxisVisibility}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartScatter', [
      ['title', valores.title],
      ['series', expr('clientes')],
      ['includeZero', ZEROS[valores.includeZero as keyof typeof ZEROS], true],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['xAxis', valores.xAxis, 'visible'],
      ['yAxis', valores.yAxis, 'visible'],
      ['accent', accentDa(valores.accent)],
      ['formatX', expr('(valor) => `${valor} d`')],
      ['formatY', expr('(valor) => formatarPercentual(valor / 100)')],
      ['formatZ', valores.tamanhoPorZ ? expr('formatarCompacto') : undefined],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
      valores.tamanhoPorZ
        ? { nivel: 'ok', titulo: 'Área proporcional', detalhe: 'O raio cresce pela raiz de z, para a área da bolha acompanhar o dado.' }
        : { nivel: 'ok', titulo: 'Bolhas iguais', detalhe: 'Sem z, todas as bolhas têm o mesmo raio.' },
    ];

    if (valores.includeZero !== 'true') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Eixo sem o zero',
        detalhe: 'A distância entre os pontos parece maior. Reserve para a medida que não se compara ao zero, como um ano.',
      });
    }

    if (valores.xAxis === 'hidden' || valores.yAxis === 'hidden') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Eixo oculto', detalhe: 'Na dispersão os dois eixos são medidas: sem um deles, a posição perde leitura.' });
    }

    return verificacoes;
  },
});

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt><code>z</code></dt>
        <dd>
          O tamanho da bolha. O raio cresce pela raiz do valor, para a área acompanhar o dado; sem <code>z</code>, as bolhas
          têm o mesmo raio.
        </dd>
        <dt>Guias</dt>
        <dd>Com o ponteiro sobre uma bolha, guias tracejadas levam o ponto aos dois eixos.</dd>
        <dt><code>includeZero</code></dt>
        <dd>
          <code>true</code> nos dois eixos, <code>&apos;x&apos;</code> ou <code>&apos;y&apos;</code> só naquele,{' '}
          <code>false</code> em nenhum. Um ano pede também um formato sem separador de milhar.
        </dd>
        <dt>Rótulos</dt>
        <dd>
          Não há <code>showDots</code> nem <code>showDataLabels</code>: a bolha já é a marca, e rótulo por ponto se atropela
          assim que as bolhas se aproximam. A leitura vem do <code>&lt;title&gt;</code> de cada bolha.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartScatter series={[]} title="Prazo médio por margem" />
        <p className="note">Sem pontos, o gráfico anuncia a ausência em vez de desenhar eixos vazios.</p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Bolha dimensionada por z',
      descricao: 'Prazo no eixo X, margem no Y, faturamento no tamanho. Passe o ponteiro numa bolha para ver as guias.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartScatter
            formatX={formatarDias}
            formatY={formatarMargem}
            formatZ={formatarCompacto}
            series={CLIENTES}
            title="Prazo médio por margem"
          />
        </div>
      ),
      codigo: `<ChartScatter
  title="Prazo médio por margem"
  series={[
    {
      label: 'Indústria',
      points: [{ label: 'Plenus Tecnologia', x: 18, y: 32, z: 26500 }, ...],
    },
    {
      label: 'Serviços',
      points: [{ label: 'CDCE da Escola', x: 22, y: 38, z: 16400 }, ...],
    },
  ]}
  formatX={(valor) => \`\${valor} d\`}
  formatY={(valor) => formatarPercentual(valor / 100)}
  formatZ={formatarCompacto}
/>`,
    },
    {
      titulo: 'Ano no eixo X',
      descricao: 'O ano não se compara ao zero: includeZero="y" mantém o zero só no eixo do valor.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartScatter
            formatX={String}
            formatY={formatarCompacto}
            includeZero="y"
            series={FATURAMENTO_ANUAL}
            title="Faturamento por ano"
          />
        </div>
      ),
      codigo: `<ChartScatter
  title="Faturamento por ano"
  series={[{ label: 'Faturamento', points: [{ x: 2020, y: 410000 }, ...] }]}
  includeZero="y"
  formatX={String}
  formatY={formatarCompacto}
/>`,
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões a partir de duas séries. O desenho não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga a série da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartScatter.test.tsx' },
    {
      garantia: 'Descrição do ponto',
      como: <><code>aria-label</code> e <code>&lt;title&gt;</code> com as duas medidas e o z, no formato do consumidor.</>,
      teste: 'ChartScatter.test.tsx',
    },
    { garantia: 'Área proporcional', como: 'O raio cresce pela raiz de z, não pelo valor.', teste: 'ChartScatter.test.tsx' },
    { garantia: 'Zero por eixo', como: 'includeZero vale nos dois eixos ou em um só.', teste: 'eixo-zero.test.tsx' },
    { garantia: 'Número inválido', como: 'O ponto inválido não é desenhado em cima do eixo.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem pontos, um EmptyState no lugar do desenho.', teste: 'ChartScatter.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    {
      nome: 'series',
      tipo: 'readonly ChartScatterSeries[]',
      descricao: <><code>{'{ label, points, color?, intent? }'}</code>; cada ponto <code>{'{ x, y, z?, label? }'}</code>.</>,
    },
    { nome: 'formatX', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do eixo X e das descrições.' },
    { nome: 'formatY', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do eixo Y e das descrições.' },
    { nome: 'formatZ', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do tamanho nas descrições.' },
    { nome: 'includeZero', tipo: "boolean | 'x' | 'y'", padrao: 'true', descricao: 'Eixos cujo domínio inclui o zero.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '280', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda, que aparece a partir de duas séries.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'xAxis', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'visible'", descricao: 'Eixo de baixo.' },
    { nome: 'yAxis', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'visible'", descricao: 'Eixo da esquerda.' },
    { nome: 'yAxisRight', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'hidden'", descricao: 'Eixo da direita, espelho da esquerda.' },
    { nome: 'hiddenSeries', tipo: 'readonly string[]', descricao: 'Séries ocultas, pelo rótulo, no modo controlado.' },
    { nome: 'defaultHiddenSeries', tipo: 'readonly string[]', descricao: 'Séries ocultas de início, no modo não controlado.' },
    { nome: 'onHiddenSeriesChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
    { nome: 'palette', tipo: 'ChartPalette', descricao: <>Lista de cores em rotação, ou <code>{'{ base }'}</code>, que gera os tons. Vence o <code>accent</code>.</> },
    { nome: 'onPointClick', tipo: '(point: ChartScatterPointClick) => void', descricao: 'Torna os pontos botões, percorridos pelas setas na ordem da lista; o foco abre a guia e o balão.' },
  ],
};
