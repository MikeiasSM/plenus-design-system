import { useState } from 'react';
import {
  ChartCombo,
  ChartTooltip,
  formatarMoeda,
  formatarPercentual,
  resolveSeriesColors,
  type AxisVisibility,
  type ChartComboAxis,
  type ChartCurve,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type MarkVisibility,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { CONVERSAO, FATURAMENTO, MESES, OPCOES_DE_ACCENT, PRODUTOS, accentDa, formatarCompacto, VISIBILIDADES } from '../dadosDosGraficos';

const META = [50000, 50000, 50000, 70000, 70000, 70000];

const formatarConversao = (valor: number) => formatarPercentual(valor / 100, { casasDecimais: 1 });

const playground = definirPlayground({
  inicial: {
    title: 'Faturamento e conversão',
    eixoDaLinha: 'right',
    curve: 'smooth',
    showDots: 'onHover',
    showDataLabels: 'hidden',
    legend: 'bottom',
    legendAlign: 'center',
    yAxis: 'visible',
    yAxisRight: 'automático',
    accent: 'nenhuma',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'opcoes', nome: 'eixoDaLinha', opcoes: ['left', 'right'] },
    { tipo: 'opcoes', nome: 'curve', opcoes: ['smooth', 'straight'] },
    { tipo: 'opcoes', nome: 'showDots', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'showDataLabels', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'yAxis', opcoes: ['visible', 'onHover', 'hidden'] },
    { tipo: 'opcoes', nome: 'yAxisRight', opcoes: ['automático', 'visible', 'onHover', 'hidden'] },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartCombo
        accent={accentDa(valores.accent)}
        categories={MESES}
        curve={valores.curve as ChartCurve}
        formatRightValue={formatarConversao}
        formatValue={formatarCompacto}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        onHiddenSeriesChange={(ocultas) => registrar(`onHiddenSeriesChange: [${ocultas.join(', ')}]`)}
        onHoverCategory={(indice) => registrar(`onHoverCategory: ${indice}`)}
        series={[
          { kind: 'bar', label: 'Faturamento', values: FATURAMENTO },
          { axis: valores.eixoDaLinha as ChartComboAxis, kind: 'line', label: 'Conversão', values: CONVERSAO },
        ]}
        showDataLabels={valores.showDataLabels as MarkVisibility}
        showDots={valores.showDots as MarkVisibility}
        title={valores.title}
        yAxis={valores.yAxis as AxisVisibility}
        yAxisRight={valores.yAxisRight === 'automático' ? undefined : (valores.yAxisRight as AxisVisibility)}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartCombo', [
      ['title', valores.title],
      ['categories', expr('meses')],
      [
        'series',
        expr(
          `[\n  { kind: 'bar', label: 'Faturamento', values: faturamento },\n  { kind: 'line', label: 'Conversão', values: conversao${valores.eixoDaLinha === 'right' ? ", axis: 'right'" : ''} },\n]`,
        ),
      ],
      ['curve', valores.curve, 'smooth'],
      ['showDots', valores.showDots, 'onHover'],
      ['showDataLabels', valores.showDataLabels, 'hidden'],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['yAxis', valores.yAxis, 'visible'],
      ['yAxisRight', valores.yAxisRight, 'automático'],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr('formatarCompacto')],
      ['formatRightValue', expr('formatarConversao')],
      ['onHoverCategory', expr('setFaixa')],
    ]),
  verificar: (valores) => {
    const direita = valores.eixoDaLinha === 'right';
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
      direita
        ? { nivel: 'ok', titulo: 'Eixo declarado', detalhe: "A conversão declara axis: 'right' e ganha escala própria, com o zero alinhado ao da esquerda." }
        : {
            nivel: 'atencao',
            titulo: 'Grandezas na mesma escala',
            detalhe: 'Percentual na escala de reais: a linha se achata contra a base. Declare axis: \'right\' na série.',
          },
    ];

    if (direita && valores.yAxisRight === 'hidden') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Escala sem eixo',
        detalhe: 'Uma segunda escala sem eixo para lê-la é o duplo eixo que engana. Mantenha o eixo direito visível.',
      });
    }

    return verificacoes;
  },
});

function LeituraPorSerie() {
  const [faixa, setFaixa] = useState<number | null>(null);
  const cores = resolveSeriesColors([{}, {}]);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: (valor) => (valor < 100 ? formatarConversao(valor) : formatarMoeda(valor)) }]}
        computed="none"
        rows={
          faixa === null
            ? []
            : [
                { color: cores[0], label: 'Faturamento', values: [FATURAMENTO[faixa]] },
                { color: cores[1], label: 'Conversão', values: [CONVERSAO[faixa]] },
              ]
        }
        subtitle="Faturamento na escala da esquerda, conversão na da direita."
        title={faixa === null ? '' : MESES[faixa]}
      >
        <ChartCombo
          showTooltip={false}
          categories={MESES}
          formatRightValue={formatarConversao}
          formatValue={formatarCompacto}
          onHoverCategory={setFaixa}
          series={[
            { kind: 'bar', label: 'Faturamento', values: FATURAMENTO },
            { axis: 'right', kind: 'line', label: 'Conversão', values: CONVERSAO },
          ]}
          title="Faturamento e conversão"
        />
      </ChartTooltip>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>axis</code> da série</dt>
      <dd>
        É a declaração que faz nascer o eixo direito. O gráfico nunca parte a escala sozinho: um segundo eixo que aparece
        por conta própria torna o cruzamento entre linha e barra um artefato da escala, e não um fato do dado.
      </dd>
      <dt>Dois eixos</dt>
      <dd>
        O zero fica na mesma altura nos dois, e as barras de cada eixo crescem da mesma base. Os dois domínios caminham
        numa animação só, para as barras e as linhas chegarem juntas.
      </dd>
      <dt>Um eixo</dt>
      <dd>
        Sem série à direita, o domínio é único e o eixo direito, quando pedido, espelha o esquerdo. É o caso em que o
        cruzamento significa alguma coisa.
      </dd>
      <dt><code>yAxisRight</code></dt>
      <dd>Sem valor, aparece assim que uma série pertence à direita. Informado, impõe um dos três estados.</dd>
      <dt>Valor <code>null</code></dt>
      <dd>Interrompe a curva e dispensa a barra daquela categoria.</dd>
    </dl>
  );
}

const VISIBILIDADE = "'visible' | 'hidden' | 'onHover'";

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Eixo próprio para a segunda grandeza',
      descricao: 'O volume em barra, a taxa em linha, cada um na sua escala.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartCombo
            categories={MESES}
            formatRightValue={formatarConversao}
            formatValue={formatarCompacto}
            series={[
              { kind: 'bar', label: 'Faturamento', values: FATURAMENTO },
              { axis: 'right', kind: 'line', label: 'Conversão', values: CONVERSAO },
            ]}
            title="Faturamento e conversão"
          />
        </div>
      ),
      codigo: `<ChartCombo
  title="Faturamento e conversão"
  categories={meses}
  series={[
    { kind: 'bar', label: 'Faturamento', values: faturamento },
    { kind: 'line', label: 'Conversão', values: conversao, axis: 'right' },
  ]}
  formatValue={formatarCompacto}
  formatRightValue={(valor) => formatarPercentual(valor / 100, { casasDecimais: 1 })}
/>`,
    },
    {
      titulo: 'Realizado contra a meta',
      descricao: 'Medidas comparáveis num eixo só: aqui o cruzamento da linha com a barra significa alguma coisa.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartCombo
            categories={MESES}
            formatValue={formatarCompacto}
            height={220}
            series={[
              { kind: 'bar', label: 'Realizado', values: FATURAMENTO },
              { kind: 'line', label: 'Meta', values: META },
            ]}
            title="Realizado contra a meta"
          />
        </div>
      ),
      codigo: `<ChartCombo
  title="Realizado contra a meta"
  categories={meses}
  series={[
    { kind: 'bar', label: 'Realizado', values: realizado },
    { kind: 'line', label: 'Meta', values: [50000, 50000, 50000, 70000, 70000, 70000] },
  ]}
  height={220}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Uma medida por série no ponteiro',
      descricao: 'O subtítulo do ChartTooltip lembra qual escala lê cada linha.',
      Previa: LeituraPorSerie,
      codigo: `const [faixa, setFaixa] = useState<number | null>(null);
const cores = resolveSeriesColors([{}, {}]);

<ChartTooltip
  title={faixa === null ? '' : meses[faixa]}
  subtitle="Faturamento na escala da esquerda, conversão na da direita."
  columns={[{ format: (valor) => (valor < 100 ? formatarConversao(valor) : formatarMoeda(valor)) }]}
  computed="none"
  rows={faixa === null ? [] : [
    { color: cores[0], label: 'Faturamento', values: [faturamento[faixa]] },
    { color: cores[1], label: 'Conversão', values: [conversao[faixa]] },
  ]}
>
  <ChartCombo showTooltip={false} ... onHoverCategory={setFaixa} />
</ChartTooltip>`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartCombo
          categories={MESES}
          formatRightValue={formatarConversao}
          formatValue={formatarCompacto}
          height={180}
          series={[
            { kind: 'bar', label: 'Faturamento', values: FATURAMENTO },
            { axis: 'right', kind: 'line', label: 'Conversão', values: CONVERSAO },
          ]}
          title="Faturamento e conversão"
        />
      </div>
    ),
    texto: 'Uma categoria com duas leituras de naturezas diferentes: o volume em barra, a taxa em linha, com o eixo declarado.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartCombo
          categories={MESES}
          formatValue={formatarCompacto}
          height={180}
          series={[
            { kind: 'bar', label: 'Faturamento', values: FATURAMENTO },
            { kind: 'bar', label: 'Produtos', values: PRODUTOS },
          ]}
          title="Faturamento e produtos"
        />
      </div>
    ),
    texto: 'Um único tipo de marca: com só barras ou só linhas, ChartBar e ChartLine são os componentes certos.',
  },
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões a partir de duas séries. O desenho não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga a série da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartCombo.test.tsx' },
    { garantia: 'Descrição da marca', como: <><code>aria-label</code> no formato do eixo a que a série pertence.</>, teste: 'ChartCombo.test.tsx' },
    { garantia: 'Eixo declarado', como: 'O eixo direito nasce só quando uma série pertence a ele, com o zero alinhado.', teste: 'ChartCombo.test.tsx' },
    { garantia: 'Legenda como controle', como: <>Botão com <code>aria-pressed</code>; desligar não repinta as demais séries.</>, teste: 'ChartCombo.test.tsx' },
    { garantia: 'Ponto isolado', como: 'O ponto da linha sem vizinho aparece sempre.', teste: 'ponto-isolado.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem séries ou categorias, um EmptyState no lugar do desenho.', teste: 'ChartCombo.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'categories', tipo: 'readonly string[]', descricao: 'Categorias do eixo de baixo, comuns a barras e linhas.' },
    {
      nome: 'series',
      tipo: 'readonly ChartComboSeries[]',
      descricao: <><code>{"{ kind: 'bar' | 'line', label, values, axis?, color?, intent? }"}</code>; <code>axis</code> padrão <code>'left'</code>.</>,
    },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do eixo esquerdo e das séries dele.' },
    { nome: 'formatRightValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato do eixo direito e das séries dele.' },
    { nome: 'curve', tipo: "'smooth' | 'straight'", padrao: "'smooth'", descricao: 'Traço das linhas.' },
    { nome: 'showDots', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'onHover'", descricao: 'Pontos das linhas; em onHover, os da categoria sob o ponteiro.' },
    { nome: 'showDataLabels', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'hidden'", descricao: 'Valor de cada marca; em onHover, os da barra sob o ponteiro e os das linhas na categoria dela.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '260', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda, que aparece a partir de duas séries.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'xAxis', tipo: VISIBILIDADE, padrao: "'visible'", descricao: 'Eixo de baixo.' },
    { nome: 'yAxis', tipo: VISIBILIDADE, padrao: "'visible'", descricao: 'Eixo da esquerda.' },
    { nome: 'yAxisRight', tipo: VISIBILIDADE, descricao: 'Eixo da direita. Sem valor, visível quando uma série pertence a ele.' },
    { nome: 'labelAngle', tipo: "0 | 45 | 90 | 'auto'", padrao: "'auto'", descricao: 'Ângulo dos rótulos do eixo de baixo.' },
    { nome: 'hiddenSeries', tipo: 'readonly string[]', descricao: 'Séries ocultas, pelo rótulo, no modo controlado.' },
    { nome: 'defaultHiddenSeries', tipo: 'readonly string[]', descricao: 'Séries ocultas de início, no modo não controlado.' },
    { nome: 'onHiddenSeriesChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'onHoverCategory', tipo: '(index: number | null) => void', descricao: 'Categoria sob o ponteiro; costura para o ChartTooltip.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
  ],
};
