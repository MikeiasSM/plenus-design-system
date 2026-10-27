import {
  ChartHeatmap,
  formatarPercentual,
  type AxisVisibility,
  type ChartHeatmapCell,
  type ChartHeatmapColorScale,
  type ChartHeatmapLegendPosition,
  type ChartLegendAlign,
  type MarkVisibility,
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
    yAxis: 'visible',
    clicavel: false,
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'opcoes', nome: 'colorScale', opcoes: ['sequential', 'diverging', 'classes'] },
    { tipo: 'opcoes', nome: 'showValues', opcoes: ['visible', 'onHover', 'hidden'] },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'bottom', 'right', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'xAxis', opcoes: ['visible', 'onHover', 'hidden'] },
    { tipo: 'opcoes', nome: 'yAxis', opcoes: ['visible', 'onHover', 'hidden'] },
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
          legend={valores.legend as ChartHeatmapLegendPosition}
          legendAlign={valores.legendAlign as ChartLegendAlign}
          onCellClick={valores.clicavel ? (celula) => registrar(`onCellClick: ${celula.x}, ${celula.y}`) : undefined}
          showValues={valores.showValues as MarkVisibility}
          title={valores.title}
          valueLabel={divergente ? 'Variação' : 'Atendimentos'}
          xAxis={valores.xAxis as AxisVisibility}
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
      ['yAxis', valores.yAxis, 'visible'],
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
        detalhe: 'Com onCellClick, as células são botões numa parada só de Tab, percorridos pelas setas.',
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
        <dd>Do mais claro ao mais escuro, que é o maior, nos dois temas. A legenda é a barra contínua, com o valor sob o ponteiro marcado.</dd>
        <dt><code>diverging</code></dt>
        <dd>Para medidas com sentido, como variação: o centro em cinza, o negativo em vermelho e o positivo em verde, à mesma distância do centro.</dd>
        <dt><code>classes</code></dt>
        <dd>Faixas por quantil, intervalo igual ou limites declarados. A legenda liga e desliga as células de cada faixa.</dd>
        <dt>Valor na célula</dt>
        <dd>Aparece quando cabe, em branco nos tons escuros e em preto nos claros, medidos nos dois temas.</dd>
        <dt>Sem dado</dt>
        <dd>A célula sem valor, ou o cruzamento sem célula, fica no tom de sem dado, com a contagem na legenda.</dd>
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
    { teclas: ['Setas'], acao: 'Move entre as células, presas às bordas da grade.' },
    { teclas: ['Home', 'End'], acao: 'Vai à primeira ou à última célula da linha.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona a célula focada, como o clique.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é nomeado pelo <code>title</code>: <code>img</code>, ou <code>group</code> com células clicáveis.</>, teste: 'ChartHeatmap.test.tsx' },
    { garantia: 'Descrição da célula', como: <><code>aria-label</code> com as duas categorias e o valor, ou o texto de sem dado.</>, teste: 'ChartHeatmap.test.tsx' },
    { garantia: 'Uma parada de Tab', como: 'Com onCellClick, só uma célula tem tabindex 0; as setas levam o foco.', teste: 'ChartHeatmap.test.tsx' },
    { garantia: 'Texto legível', como: 'O valor na célula usa o token de texto que contrasta com o tom, medido nos dois temas.', teste: 'colorScale.test.ts' },
    { garantia: 'Ausência anunciada', como: 'Sem células, um EmptyState no lugar do desenho.', teste: 'ChartHeatmap.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'cells', tipo: 'readonly ChartHeatmapCell[]', descricao: <><code>{'{ x, y, value }'}</code>, uma por cruzamento; <code>value: null</code> é sem dado.</> },
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
    { nome: 'xAxis', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'visible'", descricao: 'Rótulos das colunas.' },
    { nome: 'yAxis', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'visible'", descricao: 'Rótulos das linhas.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda da escala.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '320', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'hideTitle', tipo: 'boolean', descricao: 'Título só para o leitor de tela, quando o contêiner já o mostra.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
  ],
};
