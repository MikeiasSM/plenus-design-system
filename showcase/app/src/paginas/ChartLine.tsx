import { useState } from 'react';
import {
  ChartLine,
  ChartTooltip,
  formatarMoeda,
  formatarNumero,
  resolveSeriesColors,
  type AxisVisibility,
  type ChartCurve,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type MarkVisibility,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { COMPOSICAO, MESES, OPCOES_DE_ACCENT, PRODUTOS, SERVICOS, accentDa, formatarCompacto, VISIBILIDADES, FORMATOS } from '../dadosDosGraficos';

const TICKET_MEDIO = [1240, 1310, 1180, 1520, 1460, 1590];
const TEMPERATURA = [24.1, 25.3, 23.8, 22.6, 23.4, 26.2];

const formatarTemperatura = (valor: number) => `${formatarNumero(valor, { casasDecimais: 1 })} °C`;

/** Tira o valor de dois meses, como uma coleta interrompida. */
function comLacuna(valores: readonly number[]) {
  return valores.map((valor, indice) => (indice === 2 || indice === 3 ? null : valor));
}

const playground = definirPlayground({
  inicial: {
    title: 'Evolução do faturamento',
    series: 2,
    curve: 'smooth',
    showDots: 'onHover',
    showDataLabels: 'hidden',
    includeZero: true,
    lacuna: false,
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
    { tipo: 'opcoes', nome: 'curve', opcoes: ['smooth', 'straight'] },
    { tipo: 'opcoes', nome: 'showDots', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'showDataLabels', opcoes: VISIBILIDADES },
    { tipo: 'booleano', nome: 'includeZero' },
    { tipo: 'booleano', nome: 'lacuna' },
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
      <ChartLine
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
        series={COMPOSICAO.slice(0, valores.series).map((serie) => ({
          label: serie.label,
          values: valores.lacuna ? comLacuna(serie.values) : serie.values,
        }))}
        showDataLabels={valores.showDataLabels as MarkVisibility}
        showDots={valores.showDots as MarkVisibility}
        title={valores.title}
        xAxis={valores.xAxis as AxisVisibility}
        yAxis={valores.yAxis as AxisVisibility}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartLine', [
      ['title', valores.title],
      ['categories', expr('meses')],
      ['series', expr('series')],
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
    ];

    if (!valores.includeZero) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Eixo sem o zero',
        detalhe: 'A diferença entre os pontos parece maior. Reserve para medidas que não se comparam ao zero, como ano ou temperatura.',
      });
    }

    if (valores.lacuna) {
      verificacoes.push({ nivel: 'ok', titulo: 'Valor ausente', detalhe: 'A curva se interrompe no buraco, em vez de emendar um trecho que o dado não afirma.' });
    }

    if (valores.series === 1) {
      verificacoes.push({ nivel: 'ok', titulo: 'Legenda dispensada', detalhe: 'Uma série só: o título já a nomeia, e a legenda aparece a partir de duas.' });
    }

    if (valores.yAxis === 'hidden' && valores.showDataLabels === 'hidden') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Valor sem leitura', detalhe: 'Sem eixo de valor e sem showDataLabels, a altura do ponto não se traduz em número na tela.' });
    }

    return verificacoes;
  },
});

function PontoMaisProximo() {
  const [ponto, setPonto] = useState<number | null>(null);
  const cores = resolveSeriesColors([{}, {}]);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatarMoeda }]}
        computed="none"
        rows={
          ponto === null
            ? []
            : [
                { color: cores[0], label: 'Serviços', values: [SERVICOS[ponto]] },
                { color: cores[1], label: 'Produtos', values: [PRODUTOS[ponto]] },
              ]
        }
        showTotal
        title={ponto === null ? '' : MESES[ponto]}
      >
        <ChartLine
          showTooltip={false}
          categories={MESES}
          formatValue={formatarCompacto}
          onHoverCategory={setPonto}
          series={COMPOSICAO.slice(0, 2)}
          title="Evolução do faturamento"
        />
      </ChartTooltip>
    </div>
  );
}

function Variantes() {
  const combinacoes = [
    { curve: 'smooth', showDots: 'onHover' },
    { curve: 'smooth', showDots: 'visible' },
    { curve: 'straight', showDots: 'onHover' },
    { curve: 'straight', showDots: 'visible' },
  ] as const;

  return (
    <div className="demo-grid">
      {combinacoes.map(({ curve, showDots }) => (
        <div className="demo-box" key={`${curve}-${showDots}`}>
          <ChartLine
            categories={MESES}
            curve={curve}
            formatValue={formatarCompacto}
            height={200}
            series={COMPOSICAO.slice(0, 2)}
            showDots={showDots}
            title={`${curve}${showDots === 'visible' ? ', showDots visible' : ''}`}
          />
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt><code>showDots</code></dt>
        <dd>
          Em <code>onHover</code>, o padrão, os pontos ficam ocultos em repouso e aparecem só os da série mais próxima do
          ponteiro. Na impressão aparecem sempre. O ponto sem vizinho aparece sempre, porque ali a curva não desenha nada.
        </dd>
        <dt>Valor <code>null</code></dt>
        <dd>A curva se interrompe onde o valor não existe, em vez de emendar sobre o buraco.</dd>
        <dt><code>includeZero</code></dt>
        <dd>
          Ligado por padrão, porque marca que não parte do zero exagera a diferença. Um ano em eixo de valor pede também
          um formato sem separador de milhar em <code>formatValue</code>.
        </dd>
        <dt><code>onHoverCategory</code></dt>
        <dd>
          Com ele, a área de desenho se divide em faixas invisíveis, cada uma do ponto até o meio do caminho para o
          vizinho, e uma guia vertical marca o ponto mais próximo. O <code>&lt;title&gt;</code> dos pontos sai, para não
          abrir um segundo balão sobre o ChartTooltip.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartLine categories={[]} series={[]} title="Evolução do faturamento" />
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
      titulo: 'Linha reta, marcadores visíveis',
      descricao: 'Uma série só dispensa a legenda: o título já a nomeia.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartLine
            categories={MESES}
            curve="straight"
            formatValue={formatarCompacto}
            height={220}
            series={[{ label: 'Ticket médio', values: TICKET_MEDIO }]}
            showDots="visible"
            title="Ticket médio"
          />
        </div>
      ),
      codigo: `<ChartLine
  title="Ticket médio"
  categories={meses}
  series={[{ label: 'Ticket médio', values: [1240, 1310, 1180, 1520, 1460, 1590] }]}
  curve="straight"
  showDots="visible"
  height={220}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Período sem medida',
      descricao: 'Onde o valor é null a curva se interrompe: emendar desenharia um trecho que o dado não afirma.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartLine
            categories={MESES}
            formatValue={formatarCompacto}
            height={220}
            series={[{ label: 'Serviços', values: comLacuna(SERVICOS) }]}
            title="Faturamento com coleta interrompida"
          />
        </div>
      ),
      codigo: `<ChartLine
  title="Faturamento com coleta interrompida"
  categories={meses}
  series={[{ label: 'Serviços', values: [42000, 58000, null, null, 54000, 63000] }]}
  height={220}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Medida que não parte do zero',
      descricao: 'Temperatura não se compara ao zero: includeZero={false} aproxima o eixo dos dados.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartLine
            categories={MESES}
            formatValue={formatarTemperatura}
            height={220}
            includeZero={false}
            series={[{ label: 'Temperatura média', values: TEMPERATURA }]}
            title="Temperatura média da sala de servidores"
          />
        </div>
      ),
      codigo: `<ChartLine
  title="Temperatura média da sala de servidores"
  categories={meses}
  series={[{ label: 'Temperatura média', values: temperaturas }]}
  includeZero={false}
  formatValue={(valor) => \`\${formatarNumero(valor, { casasDecimais: 1 })} °C\`}
/>`,
    },
    {
      titulo: 'Ponto mais próximo',
      descricao: 'Sem barra para apontar, vale o ponto mais próximo do ponteiro, e o ChartTooltip lê as duas séries.',
      Previa: PontoMaisProximo,
      codigo: `const [ponto, setPonto] = useState<number | null>(null);
const cores = resolveSeriesColors([{}, {}]);

<ChartTooltip
  title={ponto === null ? '' : meses[ponto]}
  columns={[{ format: formatarMoeda }]}
  computed="none"
  rows={ponto === null ? [] : [
    { color: cores[0], label: 'Serviços', values: [servicos[ponto]] },
    { color: cores[1], label: 'Produtos', values: [produtos[ponto]] },
  ]}
  showTotal
>
  <ChartLine
    showTooltip={false}
    title="Evolução do faturamento"
    categories={meses}
    series={series}
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
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartLine.test.tsx' },
    {
      garantia: 'Descrição do ponto',
      como: <><code>aria-label</code> com série, categoria e valor; sem costura, também no <code>&lt;title&gt;</code>.</>,
      teste: 'ChartLine.test.tsx',
    },
    { garantia: 'Lacuna honesta', como: 'A curva se interrompe no valor ausente ou inválido.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Ponto isolado', como: 'O ponto sem vizinho aparece sempre, mesmo com os pontos ocultos.', teste: 'ponto-isolado.test.tsx' },
    { garantia: 'Zero no eixo', como: 'Incluído por padrão; dispensado só com includeZero={false}.', teste: 'eixo-zero.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem séries ou categorias, um EmptyState no lugar do desenho.', teste: 'ChartLine.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'categories', tipo: 'readonly string[]', descricao: 'Categorias do eixo de baixo.' },
    { nome: 'series', tipo: 'readonly ChartLineSeries[]', descricao: <><code>{'{ label, values, color?, intent? }'}</code>; <code>null</code> marca valor ausente.</> },
    { nome: 'curve', tipo: "'smooth' | 'straight'", padrao: "'smooth'", descricao: 'Curva suave ou segmentos retos.' },
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
