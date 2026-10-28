import {
  ChartHeatmap,
  type AxisPosition,
  formatarNumero,
  formatarPercentual,
  type AxisVisibility,
  type ChartHeatmapCell,
  type ChartHeatmapColorScale,
  type ChartHeatmapHighlight,
  type ChartHeatmapLegendPosition,
  type ChartLegendAlign,
  type MarkVisibility,
  type NoDataStyle,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HORARIOS = ['08h', '10h', '12h', '14h', '16h', '18h'];
const PICO_POR_HORARIO = [22, 48, 31, 54, 61, 27];
const PESO_DO_DIA = [1.15, 1, 0.95, 1, 1.2, 0.45];

const ATENDIMENTOS: ChartHeatmapCell[] = HORARIOS.flatMap((y, linha) =>
  DIAS.map((x, coluna) => ({
    value: x === 'Sáb' && linha > 3 ? null : Math.round(PICO_POR_HORARIO[linha] * PESO_DO_DIA[coluna] + ((linha * 7 + coluna * 5) % 9)),
    x,
    y,
  })),
);

const REGIONAIS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const VARIACAO: ChartHeatmapCell[] = REGIONAIS.flatMap((y, linha) =>
  MESES.map((x, coluna) => ({ value: (((linha * 11 + coluna * 17) % 41) - 18) / 100, x, y })),
);

const formatarVariacao = (valor: number) => `${valor > 0 ? '+' : ''}${formatarPercentual(valor)}`;

const INDICADORES = ['Ticket médio', 'Visitas', 'Conversão', 'Descontos', 'Devoluções', 'NPS'];
const CORRELACOES = [
  [1, 0.18, 0.42, -0.36, -0.22, 0.31],
  [0.18, 1, 0.64, 0.12, 0.08, 0.05],
  [0.42, 0.64, 1, 0.27, -0.48, 0.52],
  [-0.36, 0.12, 0.27, 1, 0.33, -0.15],
  [-0.22, 0.08, -0.48, 0.33, 1, -0.71],
  [0.31, 0.05, 0.52, -0.15, -0.71, 1],
];
const CORRELACAO: ChartHeatmapCell[] = INDICADORES.flatMap((y, linha) =>
  INDICADORES.map((x, coluna) => ({ value: CORRELACOES[linha][coluna], x, y })),
);
const formatarCorrelacao = (valor: number) => `${valor > 0 ? '+' : ''}${formatarNumero(valor, { casasDecimais: 2 })}`;

const COORTES = ['Mai/26', 'Jun/26', 'Jul/26', 'Ago/26', 'Set/26', 'Out/26'];
const MESES_DA_COORTE = ['Mês 0', 'Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5'];
const RETENCAO: ChartHeatmapCell[] = COORTES.flatMap((y, linha) =>
  MESES_DA_COORTE.slice(0, COORTES.length - linha).map((x, coluna) => ({
    value: y === 'Ago/26' && coluna === 1 ? null : coluna === 0 ? 1 : Math.round(100 * Math.exp(-0.45 * coluna ** 0.8) - linha) / 100,
    x,
    y,
  })),
);

function escalaDe(tipo: string): ChartHeatmapColorScale {
  if (tipo === 'classes') {
    return { count: 4, method: 'quantile', type: 'classes' };
  }

  return tipo === 'diverging' ? { center: 0, type: 'diverging' } : { type: 'sequential' };
}

const playground = definirPlayground({
  inicial: {
    title: 'Atendimentos por horário',
    colorScale: 'sequential',
    showValues: 'visible',
    legend: 'bottom',
    legendAlign: 'center',
    xAxis: 'visible',
    xAxisPosition: 'bottom',
    yAxis: 'visible',
    highlight: 'cell',
    noDataStyle: 'hatch',
    squareCells: false,
    clicavel: false,
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'opcoes', nome: 'colorScale', opcoes: ['sequential', 'diverging', 'classes'] },
    { tipo: 'opcoes', nome: 'showValues', opcoes: ['visible', 'onHover', 'hidden'] },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'bottom', 'right', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'xAxis', opcoes: ['visible', 'onHover', 'hidden'] },
    { tipo: 'opcoes', nome: 'xAxisPosition', opcoes: ['bottom', 'top'] },
    { tipo: 'opcoes', nome: 'yAxis', opcoes: ['visible', 'onHover', 'hidden'] },
    { tipo: 'opcoes', nome: 'highlight', opcoes: ['cell', 'rowColumn'] },
    { tipo: 'opcoes', nome: 'noDataStyle', opcoes: ['hatch', 'neutral'] },
    { tipo: 'booleano', nome: 'squareCells' },
    { tipo: 'booleano', nome: 'clicavel' },
  ],
  renderizar: (valores, registrar) => {
    const divergente = valores.colorScale === 'diverging';

    return (
      <div style={{ width: '100%' }}>
        <ChartHeatmap
          cells={divergente ? VARIACAO : ATENDIMENTOS}
          colorScale={escalaDe(valores.colorScale)}
          formatValue={divergente ? formatarVariacao : undefined}
          highlight={valores.highlight as ChartHeatmapHighlight}
          legend={valores.legend as ChartHeatmapLegendPosition}
          legendAlign={valores.legendAlign as ChartLegendAlign}
          noDataStyle={valores.noDataStyle as NoDataStyle}
          onCellClick={valores.clicavel ? (celula) => registrar(`onCellClick: ${celula.x}, ${celula.y}`) : undefined}
          showValues={valores.showValues as MarkVisibility}
          squareCells={valores.squareCells}
          title={valores.title}
          valueLabel={divergente ? 'Variação' : 'Atendimentos'}
          xAxis={valores.xAxis as AxisVisibility}
          xAxisPosition={valores.xAxisPosition as AxisPosition}
          yAxis={valores.yAxis as AxisVisibility}
        />
      </div>
    );
  },
  codigo: (valores) => {
    const divergente = valores.colorScale === 'diverging';
    const escala = valores.colorScale === 'sequential' ? undefined : escalaDe(valores.colorScale);

    return gerarJsx('ChartHeatmap', [
      ['title', valores.title],
      ['cells', expr(divergente ? 'variacao' : 'atendimentos')],
      ['colorScale', escala && expr(JSON.stringify(escala).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'"))],
      ['valueLabel', divergente ? 'Variação' : 'Atendimentos'],
      ['formatValue', divergente ? expr("(valor) => `${valor > 0 ? '+' : ''}${formatarPercentual(valor)}`") : undefined],
      ['showValues', valores.showValues, 'visible'],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['xAxis', valores.xAxis, 'visible'],
      ['xAxisPosition', valores.xAxisPosition, 'bottom'],
      ['yAxis', valores.yAxis, 'visible'],
      ['highlight', valores.highlight, 'cell'],
      ['noDataStyle', valores.noDataStyle, 'hatch'],
      ['squareCells', valores.squareCells || undefined],
      ['onCellClick', valores.clicavel ? expr('(celula) => abrirDetalhe(celula)') : undefined],
    ]);
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, o desenho fica sem nome.' },
    ];

    if (valores.clicavel) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Células navegáveis',
        detalhe: 'Com onCellClick, as células são botões numa parada só de Tab, percorridos pelas setas, e o balão abre no foco.',
      });
    }

    if (valores.noDataStyle === 'neutral') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Sem dado em cinza liso',
        detalhe: 'O cinza liso fica perto do tom mais claro da escala. A hachura separa a ausência do menor valor sem depender da cor.',
      });
    }

    if (valores.legend === 'none') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Sem legenda', detalhe: 'Sem a legenda, a cor não tem escala de leitura; o valor fica só no balão e na célula.' });
    }

    if (valores.showValues === 'hidden' && valores.legend === 'none') {
      verificacoes.push({ nivel: 'falha', titulo: 'Leitura só pelo ponteiro', detalhe: 'Sem valores e sem legenda, a medida só aparece no balão.' });
    }

    return verificacoes;
  },
});

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt><code>sequential</code></dt>
        <dd>Do mais claro ao mais escuro, que é o maior, nos dois temas. Com valores não negativos e sem <code>domain</code>, parte do zero, para a intensidade acompanhar o valor. A legenda é a barra contínua, com o valor sob o ponteiro marcado.</dd>
        <dt><code>diverging</code></dt>
        <dd>Para medidas com sentido, como variação: o centro em cinza, o negativo em vermelho e o positivo em verde, à mesma distância do centro.</dd>
        <dt><code>classes</code></dt>
        <dd>Faixas por quantil, intervalo igual ou limites declarados. A legenda liga e desliga as células de cada faixa.</dd>
        <dt>Valor na célula</dt>
        <dd>Aparece quando cabe. Nas faixas da rampa padrão, em branco nos tons escuros e em preto nos claros, medidos nos dois temas. Na escala contínua e na cor própria nenhuma cor fixa passa em todos os tons, e o texto leva a cor do tema com halo da superfície.</dd>
        <dt>Sem dado e em branco</dt>
        <dd>A célula com <code>value: null</code> é hachurada e contada na legenda. O cruzamento que não está em <code>cells</code> fica em branco, como os meses que a coorte ainda não viveu.</dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartHeatmap cells={[]} title="Atendimentos por horário" />
        <p className="note">Sem células, o gráfico anuncia a ausência em vez de desenhar uma grade vazia.</p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Volume por dia e horário',
      descricao: 'A escala sequencial mostra onde a demanda se concentra; o sábado à tarde não tem atendimento.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartHeatmap cells={ATENDIMENTOS} title="Atendimentos por horário" valueLabel="Atendimentos" />
        </div>
      ),
      codigo: `<ChartHeatmap
  title="Atendimentos por horário"
  cells={[
    { x: 'Seg', y: '08h', value: 31 },
    { x: 'Ter', y: '08h', value: 27 },
    // um por cruzamento de dia e horário
  ]}
  valueLabel="Atendimentos"
/>`,
    },
    {
      titulo: 'Variação contra o mês anterior',
      descricao: 'A escala divergente separa queda e alta pelo matiz, com o zero no centro.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartHeatmap
            cells={VARIACAO}
            colorScale={{ center: 0, type: 'diverging' }}
            formatValue={formatarVariacao}
            height={260}
            title="Variação de vendas por regional"
            valueLabel="Variação"
          />
        </div>
      ),
      codigo: `<ChartHeatmap
  title="Variação de vendas por regional"
  cells={variacao}
  colorScale={{ type: 'diverging', center: 0 }}
  formatValue={(valor) => \`\${valor > 0 ? '+' : ''}\${formatarPercentual(valor)}\`}
  valueLabel="Variação"
  height={260}
/>`,
    },
    {
      titulo: 'Matriz de correlação',
      descricao: 'Divergente de -1 a 1, células quadradas e colunas em cima, como uma tabela; o contorno marca a linha e a coluna da célula sob o ponteiro.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartHeatmap
            cells={CORRELACAO}
            colorScale={{ domain: [-1, 1], type: 'diverging' }}
            formatValue={formatarCorrelacao}
            height={420}
            highlight="rowColumn"
            squareCells
            title="Correlação entre indicadores"
            valueLabel="Correlação"
            xAxisPosition="top"
          />
        </div>
      ),
      codigo: `<ChartHeatmap
  title="Correlação entre indicadores"
  cells={correlacao}
  colorScale={{ type: 'diverging', domain: [-1, 1] }}
  formatValue={formatarCorrelacao}
  valueLabel="Correlação"
  squareCells
  xAxisPosition="top"
  highlight="rowColumn"
  height={420}
/>`,
    },
    {
      titulo: 'Retenção por coorte',
      descricao: 'Os meses que a coorte ainda não viveu não vêm nos dados e ficam em branco; a célula nula de Ago/26 é sem dado de verdade.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartHeatmap
            cells={RETENCAO}
            colorScale={{ domain: [0, 1], type: 'sequential' }}
            formatValue={(valor) => formatarPercentual(valor, { casasDecimais: 0 })}
            height={280}
            title="Clientes que voltaram a comprar"
            valueLabel="Retenção"
            xAxisPosition="top"
          />
        </div>
      ),
      codigo: `<ChartHeatmap
  title="Clientes que voltaram a comprar"
  cells={retencao}
  colorScale={{ type: 'sequential', domain: [0, 1] }}
  formatValue={(valor) => formatarPercentual(valor, { casasDecimais: 0 })}
  valueLabel="Retenção"
  xAxisPosition="top"
/>`,
    },
    {
      titulo: 'Faixas e ordem declarada',
      descricao: 'Limites fixos dão faixas com nome; xCategories e yCategories fixam a ordem que o produto quer.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartHeatmap
            cells={ATENDIMENTOS}
            colorScale={{ labels: ['Baixo', 'Médio', 'Alto'], thresholds: [30, 55], type: 'classes' }}
            title="Carga por horário"
            valueLabel="Carga"
            xCategories={['Sex', 'Qui', 'Qua', 'Ter', 'Seg']}
            yCategories={['16h', '14h', '10h']}
          />
        </div>
      ),
      codigo: `<ChartHeatmap
  title="Carga por horário"
  cells={atendimentos}
  colorScale={{ type: 'classes', thresholds: [30, 55], labels: ['Baixo', 'Médio', 'Alto'] }}
  xCategories={['Sex', 'Qui', 'Qua', 'Ter', 'Seg']}
  yCategories={['16h', '14h', '10h']}
  valueLabel="Carga"
/>`,
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Com onCellClick, entra na grade numa parada só, na última célula visitada. Sem ele, o desenho não recebe foco.' },
    { teclas: ['Setas'], acao: 'Move entre as células, saltando os cruzamentos em branco e presas às bordas da grade.' },
    { teclas: ['Home', 'End'], acao: 'Vai à primeira ou à última célula da linha.' },
    { teclas: ['Ctrl+Home', 'Ctrl+End'], acao: 'Vai à primeira ou à última célula da grade.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona a célula focada, como o clique.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é nomeado pelo <code>title</code>: <code>img</code>, ou <code>group</code> com células clicáveis.</>, teste: 'ChartHeatmap.test.tsx' },
    { garantia: 'Descrição da célula', como: <><code>aria-label</code> com as duas categorias e o valor, ou o texto de sem dado.</>, teste: 'ChartHeatmap.test.tsx' },
    { garantia: 'Uma parada de Tab', como: 'Com onCellClick, só uma célula tem tabindex 0; as setas levam o foco.', teste: 'ChartHeatmap.test.tsx' },
    { garantia: 'Texto legível', como: 'Nas faixas, o token medido contra cada tom nos dois temas; na escala contínua e na cor própria, a cor do tema com halo.', teste: 'colorScale.test.ts' },
    { garantia: 'Leitura sem o ponteiro', como: 'Ver como tabela troca o desenho por uma tabela de linhas por colunas; com onCellClick, o balão abre no foco.', teste: 'ChartHeatmap.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem células, um EmptyState no lugar do desenho.', teste: 'ChartHeatmap.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'cells', tipo: 'readonly ChartHeatmapCell[]', descricao: <><code>{'{ x, y, value }'}</code>, uma por cruzamento; <code>value: null</code> é sem dado e o cruzamento sem célula fica em branco.</> },
    { nome: 'xCategories', tipo: 'readonly string[]', descricao: 'Ordem das colunas. Sem ela, a ordem em que aparecem nas células.' },
    { nome: 'yCategories', tipo: 'readonly string[]', descricao: 'Ordem das linhas, de cima para baixo.' },
    { nome: 'colorScale', tipo: 'ChartHeatmapColorScale', padrao: "{ type: 'sequential' }", descricao: <><code>sequential</code>, <code>diverging</code> ou <code>classes</code>, como no <code>ChartMap</code>.</> },
    { nome: 'valueLabel', tipo: 'string', padrao: "'Valor'", descricao: 'Nome da medida, na legenda e no balão.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato da célula, da legenda e das descrições.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', descricao: 'Formato do balão. Sem ele, vale o formatValue.' },
    { nome: 'showValues', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'visible'", descricao: 'Valor escrito na célula, quando cabe nela.' },
    { nome: 'onCellClick', tipo: '(cell: ChartHeatmapCell) => void', descricao: 'Torna as células botões, percorridos pelas setas.' },
    { nome: 'onHoverCell', tipo: '(cell: ChartHeatmapCell | null) => void', descricao: 'Célula sob o ponteiro ou o foco, ou null ao sair.' },
    { nome: 'showTooltip', tipo: 'boolean', padrao: 'true', descricao: 'Balão com as duas categorias e o valor.' },
    { nome: 'noDataLabel', tipo: 'string', padrao: "'Sem dado'", descricao: 'Texto da célula sem valor, na legenda e na descrição.' },
    { nome: 'noDataStyle', tipo: "'hatch' | 'neutral'", padrao: "'hatch'", descricao: 'Hachura ou cinza liso na célula sem valor, como no ChartMap.' },
    { nome: 'highlight', tipo: "'cell' | 'rowColumn'", padrao: "'cell'", descricao: 'Sob o ponteiro ou o foco, a célula, ou também o contorno da linha e da coluna dela.' },
    { nome: 'squareCells', tipo: 'boolean', padrao: 'false', descricao: 'Células quadradas, como na matriz de correlação.' },
    { nome: 'xAxis', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'visible'", descricao: 'Rótulos das colunas.' },
    { nome: 'xAxisPosition', tipo: "'bottom' | 'top'", padrao: "'bottom'", descricao: 'Rótulos das colunas embaixo, como no gráfico, ou em cima, como na tabela.' },
    { nome: 'yAxis', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'visible'", descricao: 'Rótulos das linhas.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda da escala.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '320', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'hideTitle', tipo: 'boolean', descricao: 'Título só para o leitor de tela, quando o contêiner já o mostra.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
  ],
};
