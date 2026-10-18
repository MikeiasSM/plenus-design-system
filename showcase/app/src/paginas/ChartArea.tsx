import { useState } from 'react';
import {
  ChartArea,
  ChartTooltip,
  formatarMoeda,
  resolveSeriesColors,
  type AxisVisibility,
  type ChartCurve,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type MarkVisibility,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { COMPOSICAO, FATURAMENTO, MESES, OPCOES_DE_ACCENT, accentDa, formatarCompacto, VISIBILIDADES, FORMATOS } from '../dadosDosGraficos';

const SALDO_DO_CAIXA = [12000, -8000, 5000, -3000, 9000, 14000];

const playground = definirPlayground({
  inicial: {
    title: 'Composição do faturamento',
    series: 2,
    stacked: true,
    curve: 'smooth',
    showDots: 'onHover',
    showDataLabels: 'hidden',
    includeZero: true,
    legend: 'bottom',
    legendAlign: 'center',
    xAxis: 'visible',
    yAxis: 'visible',
    accent: 'nenhuma',
    formatValue: 'compacto',
    formatTooltipValue: 'igual',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'numero', nome: 'series', min: 0, max: 3 },
    { tipo: 'booleano', nome: 'stacked' },
    { tipo: 'opcoes', nome: 'curve', opcoes: ['smooth', 'straight'] },
    { tipo: 'opcoes', nome: 'showDots', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'showDataLabels', opcoes: VISIBILIDADES },
    { tipo: 'booleano', nome: 'includeZero' },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'xAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'yAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
    { tipo: 'opcoes', nome: 'formatValue', opcoes: Object.keys(FORMATOS) },
    { tipo: 'opcoes', nome: 'formatTooltipValue', opcoes: ['igual', ...Object.keys(FORMATOS)] },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartArea
        accent={accentDa(valores.accent)}
        categories={MESES}
        curve={valores.curve as ChartCurve}
        formatTooltipValue={FORMATOS[valores.formatTooltipValue]?.formatar}
        formatValue={FORMATOS[valores.formatValue].formatar}
        includeZero={valores.includeZero}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        onHiddenSeriesChange={(ocultas) => registrar(`onHiddenSeriesChange: [${ocultas.join(', ')}]`)}
        onHoverCategory={(indice) => registrar(`onHoverCategory: ${indice}`)}
        series={COMPOSICAO.slice(0, valores.series)}
        showDataLabels={valores.showDataLabels as MarkVisibility}
        showDots={valores.showDots as MarkVisibility}
        stacked={valores.stacked}
        title={valores.title}
        xAxis={valores.xAxis as AxisVisibility}
        yAxis={valores.yAxis as AxisVisibility}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartArea', [
      ['title', valores.title],
      ['categories', expr('meses')],
      ['series', expr('series')],
      ['stacked', valores.stacked, false],
      ['curve', valores.curve, 'smooth'],
      ['showDots', valores.showDots, 'onHover'],
      ['showDataLabels', valores.showDataLabels, 'hidden'],
      ['includeZero', valores.includeZero, true],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['xAxis', valores.xAxis, 'visible'],
      ['yAxis', valores.yAxis, 'visible'],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr(FORMATOS[valores.formatValue].codigo)],
      ['formatTooltipValue', FORMATOS[valores.formatTooltipValue] && expr(FORMATOS[valores.formatTooltipValue].codigo)],
      ['onHoverCategory', expr('setPonto')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
      valores.stacked
        ? { nivel: 'ok', titulo: 'Cor sólida', detalhe: 'Empilhadas, as faixas não usam gradiente, que somaria opacidade.' }
        : { nivel: 'ok', titulo: 'Gradiente', detalhe: 'Sem empilhar, o preenchimento vai do tom ao quase transparente rumo ao zero.' },
    ];

    if (!valores.stacked && valores.series > 2) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Áreas sobrepostas',
        detalhe: 'Sem empilhar, as áreas se sobrepõem. Com muitas séries, prefira stacked ou ChartLine.',
      });
    }

    if (!valores.includeZero) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Eixo sem o zero',
        detalhe: 'A área desce até o limite do eixo, e o volume deixa de ser proporcional ao valor.',
      });
    }

    return verificacoes;
  },
});

function LeituraEmpilhada() {
  const [ponto, setPonto] = useState<number | null>(null);
  const series = COMPOSICAO.slice(0, 2);
  const cores = resolveSeriesColors(series);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatarMoeda }]}
        rows={ponto === null ? [] : series.map((serie, indice) => ({ color: cores[indice], label: serie.label, values: [serie.values[ponto]] }))}
        showTotal
        title={ponto === null ? '' : MESES[ponto]}
      >
        <ChartArea
          showTooltip={false}
          categories={MESES}
          formatValue={formatarCompacto}
          onHoverCategory={setPonto}
          series={series}
          stacked
          title="Composição do faturamento"
        />
      </ChartTooltip>
    </div>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      {[false, true].map((stacked) =>
        (['smooth', 'straight'] as const).map((curve) => (
          <div className="demo-box" key={`${stacked}-${curve}`}>
            <ChartArea
              categories={MESES}
              curve={curve}
              formatValue={formatarCompacto}
              height={200}
              series={COMPOSICAO.slice(0, 2)}
              stacked={stacked}
              title={`${curve}${stacked ? ', stacked' : ''}`}
            />
          </div>
        )),
      )}
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Sem <code>stacked</code></dt>
        <dd>
          Gradiente vertical do tom ao quase transparente, e linha de contorno em cor cheia. O topo não fecha em opacidade
          total porque áreas não empilhadas se sobrepõem.
        </dd>
        <dt><code>stacked</code></dt>
        <dd>
          Cor sólida: gradientes sobrepostos somariam opacidade e a faixa de cima escureceria a de baixo. O contorno separa
          uma faixa da vizinha.
        </dd>
        <dt>Valor <code>null</code></dt>
        <dd>A faixa se interrompe onde o valor não existe, como a curva do ChartLine.</dd>
        <dt><code>onHoverCategory</code></dt>
        <dd>
          Divide a área de desenho em faixas invisíveis e marca o ponto mais próximo com uma guia vertical. Com ela, o{' '}
          <code>&lt;title&gt;</code> dos pontos sai.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartArea categories={[]} series={[]} title="Volume faturado" />
        <p className="note">Sem dados, o gráfico anuncia a ausência em vez de desenhar eixos vazios.</p>
      </div>
    </div>
  );
}

const VISIBILIDADE = "'visible' | 'hidden' | 'onHover'";

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Volume de uma série',
      descricao: 'O gradiente enfatiza o volume, e o contorno marca o limite superior.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartArea
            categories={MESES}
            formatValue={formatarCompacto}
            series={[{ label: 'Faturamento', values: FATURAMENTO }]}
            title="Volume faturado"
          />
        </div>
      ),
      codigo: `<ChartArea
  title="Volume faturado"
  categories={meses}
  series={[{ label: 'Faturamento', values: faturamento }]}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Saldo com negativo',
      descricao: 'Com valor abaixo de zero, o gradiente clareia rumo ao zero, e não rumo à base.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartArea
            categories={MESES}
            formatValue={formatarCompacto}
            series={[{ label: 'Saldo', values: SALDO_DO_CAIXA }]}
            title="Saldo do caixa"
          />
        </div>
      ),
      codigo: `<ChartArea
  title="Saldo do caixa"
  categories={meses}
  series={[{ label: 'Saldo', values: [12000, -8000, 5000, -3000, 9000, 14000] }]}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Composição com total no ponteiro',
      descricao: 'Empilhada, a leitura no ponteiro soma as faixas no totalizador do ChartTooltip.',
      Previa: LeituraEmpilhada,
      codigo: `const [ponto, setPonto] = useState<number | null>(null);
const cores = resolveSeriesColors(series);

<ChartTooltip
  title={ponto === null ? '' : meses[ponto]}
  columns={[{ format: formatarMoeda }]}
  rows={ponto === null ? [] : series.map((serie, indice) => ({
    color: cores[indice],
    label: serie.label,
    values: [serie.values[ponto]],
  }))}
  showTotal
>
  <ChartArea
    showTooltip={false}
    title="Composição do faturamento"
    categories={meses}
    series={series}
    stacked
    onHoverCategory={setPonto}
  />
</ChartTooltip>`,
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões a partir de duas séries. O desenho não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga a série da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartArea.test.tsx' },
    {
      garantia: 'Descrição do ponto',
      como: <><code>aria-label</code> com série, categoria e valor; sem costura, também no <code>&lt;title&gt;</code>.</>,
      teste: 'ChartArea.test.tsx',
    },
    { garantia: 'Empilhamento', como: 'A segunda série empilha sobre a primeira, em vez de se sobrepor.', teste: 'ChartArea.test.tsx' },
    { garantia: 'Lacuna honesta', como: 'A faixa se interrompe no valor ausente; um inválido embaixo não apaga a de cima.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Zero no eixo', como: 'Sem o zero, a área desce até o limite do eixo, e não até um zero fora do desenho.', teste: 'eixo-zero.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem séries ou categorias, um EmptyState no lugar do desenho.', teste: 'ChartArea.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'categories', tipo: 'readonly string[]', descricao: 'Categorias do eixo de baixo.' },
    { nome: 'series', tipo: 'readonly ChartAreaSeries[]', descricao: <><code>{'{ label, values, color?, intent? }'}</code>; <code>null</code> marca valor ausente.</> },
    { nome: 'stacked', tipo: 'boolean', padrao: 'false', descricao: 'Empilha as faixas, em cor sólida.' },
    { nome: 'curve', tipo: "'smooth' | 'straight'", padrao: "'smooth'", descricao: 'Contorno suave ou em segmentos retos.' },
    { nome: 'showDots', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'onHover'", descricao: 'Pontos: sempre, só os da série mais próxima do ponteiro, ou nunca.' },
    { nome: 'showDataLabels', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'hidden'", descricao: 'Valor acima de cada ponto; em onHover, os da série mais próxima do ponteiro.' },
    { nome: 'includeZero', tipo: 'boolean', padrao: 'true', descricao: 'Inclui o zero no domínio do eixo de valor.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do eixo, dos rótulos e das descrições.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato dos valores no balão: o eixo pode sair compacto e o balão, exato.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '260', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda, que aparece a partir de duas séries.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'xAxis', tipo: VISIBILIDADE, padrao: "'visible'", descricao: 'Eixo de baixo.' },
    { nome: 'yAxis', tipo: VISIBILIDADE, padrao: "'visible'", descricao: 'Eixo da esquerda.' },
    { nome: 'yAxisRight', tipo: VISIBILIDADE, padrao: "'hidden'", descricao: 'Eixo da direita, espelho da esquerda.' },
    { nome: 'labelAngle', tipo: "0 | 45 | 90 | 'auto'", padrao: "'auto'", descricao: 'Ângulo dos rótulos do eixo de baixo.' },
    { nome: 'hiddenSeries', tipo: 'readonly string[]', descricao: 'Séries ocultas, pelo rótulo, no modo controlado.' },
    { nome: 'defaultHiddenSeries', tipo: 'readonly string[]', descricao: 'Séries ocultas de início, no modo não controlado.' },
    { nome: 'onHiddenSeriesChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'onHoverCategory', tipo: '(index: number | null) => void', descricao: 'Categoria do ponto mais próximo; costura para o ChartTooltip.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
  ],
};
