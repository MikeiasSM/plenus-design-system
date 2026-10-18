import { useState } from 'react';
import {
  ChartGauge,
  ChartRadial,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  SegmentedControl,
  Table,
  type ChartGaugeIndicator,
  type ChartGaugeProps,
  type ChartGaugeScaleLabels,
  type ChartGaugeSegment,
  type ChartGaugeSegmentStyle,
  type ChartGaugeSegmentUnit,
  type ChartGaugeSize,
  type ChartGaugeTicks,
  type ChartGaugeValueDisplay,
  type ChartLegendPosition,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { accentDa, OPCOES_DE_ACCENT, VISIBILIDADES } from '../dadosDosGraficos';

const moedaCompacta = (valor: number) => formatarMoeda(valor, { compacto: true });
const moedaExata = (valor: number) => formatarMoeda(valor, { casasDecimais: 0 });
const percentual = (valor: number) => `${formatarNumero(valor)}%`;
const comSinal = (valor: number) => (valor > 0 ? '+' : '') + formatarNumero(valor, { casasDecimais: 0 });
const milissegundos = (valor: number) => `${formatarNumero(valor, { casasDecimais: 0 })} ms`;
const pontosPercentuais = (variacao: number) => `${formatarNumero(variacao, { casasDecimais: 1 })} p.p.`;
const pontos = (variacao: number) => `${formatarNumero(variacao, { casasDecimais: 0 })} pts`;

/* ---- Cenários do artefato --------------------------------------------------------------------------------------- */

const FAIXAS_DO_SLA: ChartGaugeSegment[] = [
  { to: 80, intent: 'negative', label: 'Crítico' },
  { to: 90, intent: 'warning', label: 'Atenção' },
  { intent: 'positive', label: 'Bom' },
];

const FAIXAS_DO_NPS: ChartGaugeSegment[] = [
  { to: 0, intent: 'negative', label: 'Zona crítica' },
  { to: 50, intent: 'warning', label: 'Aperfeiçoamento' },
  { to: 75, color: 'var(--pl-chart-series-1)', label: 'Qualidade' },
  { intent: 'positive', label: 'Excelência' },
];

// Menor é melhor: as intenções invertem a ordem de sempre.
const FAIXAS_DA_API: ChartGaugeSegment[] = [
  { to: 200, intent: 'positive', label: 'Bom' },
  { to: 500, intent: 'warning', label: 'Atenção' },
  { intent: 'negative', label: 'Crítico' },
];

const FAIXAS_DA_META: ChartGaugeSegment[] = [
  { to: 0.7, intent: 'negative', label: 'Crítica' },
  { to: 1, intent: 'warning', label: 'Atenção' },
  { intent: 'positive', label: 'Atingida' },
];

const FAIXAS_DE_CPU: ChartGaugeSegment[] = [
  { to: 70, intent: 'positive', label: 'Normal' },
  { to: 90, intent: 'warning', label: 'Alto' },
  { intent: 'negative', label: 'Saturado' },
];

interface Cenario {
  codigo: { delta: string; formatTooltipValue?: string; formatValue: string };
  /** Escala que o componente vai usar, para levar a posição do controle ao valor. */
  escala: readonly [number, number];
  props: Omit<ChartGaugeProps, 'value'> & { target: { label?: string; value: number } };
}

/** As faixas de cada cenário em valor; o playground as converte quando a unidade é a meta. */
const CENARIOS: Record<string, Cenario> = {
  'Meta de faturamento': {
    escala: [0, 2_400_000],
    props: {
      title: 'Faturamento de outubro',
      formatValue: moedaCompacta,
      formatTooltipValue: moedaExata,
      segments: [
        { to: 1_400_000, intent: 'negative', label: 'Crítica' },
        { to: 2_000_000, intent: 'warning', label: 'Atenção' },
        { intent: 'positive', label: 'Atingida' },
      ],
      target: { value: 2_000_000 },
      delta: { value: 120_000, label: 'vs. setembro', format: moedaCompacta },
    },
    codigo: {
      formatValue: '(valor) => formatarMoeda(valor, { compacto: true })',
      formatTooltipValue: '(valor) => formatarMoeda(valor, { casasDecimais: 0 })',
      delta: "{ value: 120000, label: 'vs. setembro', format: (variacao) => formatarMoeda(variacao, { compacto: true }) }",
    },
  },
  'SLA de atendimento': {
    escala: [0, 100],
    props: {
      title: 'SLA de atendimento',
      max: 100,
      formatValue: percentual,
      segments: FAIXAS_DO_SLA,
      target: { value: 95 },
      centerLabel: 'chamados no prazo',
      delta: { value: 3.2, label: 'vs. setembro', format: pontosPercentuais },
    },
    codigo: {
      formatValue: '(valor) => `${formatarNumero(valor)}%`',
      delta: "{ value: 3.2, label: 'vs. setembro', format: (variacao) => `${formatarNumero(variacao, { casasDecimais: 1 })} p.p.` }",
    },
  },
  'NPS do trimestre': {
    escala: [-100, 100],
    props: {
      title: 'NPS do trimestre',
      min: -100,
      max: 100,
      formatValue: comSinal,
      segments: FAIXAS_DO_NPS,
      target: { value: 50 },
      centerLabel: '1.284 respostas',
      delta: { value: 6, label: 'vs. 2º tri', format: pontos },
    },
    codigo: {
      formatValue: "(valor) => (valor > 0 ? '+' : '') + formatarNumero(valor, { casasDecimais: 0 })",
      delta: "{ value: 6, label: 'vs. 2º tri', format: (variacao) => `${formatarNumero(variacao, { casasDecimais: 0 })} pts` }",
    },
  },
  'Tempo de resposta': {
    escala: [0, 1000],
    props: {
      title: 'Tempo de resposta da API (p95)',
      max: 1000,
      formatValue: milissegundos,
      segments: FAIXAS_DA_API,
      target: { label: 'SLO', value: 250 },
      centerLabel: 'últimos 15 min',
      delta: { value: -18, label: 'vs. hora anterior', intent: 'positive', format: milissegundos },
    },
    codigo: {
      formatValue: '(valor) => `${formatarNumero(valor, { casasDecimais: 0 })} ms`',
      delta: "{ value: -18, label: 'vs. hora anterior', intent: 'positive', format: (variacao) => `${formatarNumero(variacao, { casasDecimais: 0 })} ms` }",
    },
  },
};

function faixasNaUnidade(cenario: Cenario, unidade: ChartGaugeSegmentUnit) {
  const meta = cenario.props.target.value;
  const faixas = cenario.props.segments ?? [];

  return unidade === 'value' ? faixas : faixas.map((faixa) => (faixa.to === undefined ? faixa : { ...faixa, to: faixa.to / meta }));
}

function codigoDasFaixas(faixas: readonly ChartGaugeSegment[]) {
  const linhas = faixas.map((faixa) => {
    const partes = [
      faixa.to === undefined ? undefined : `to: ${Number(faixa.to.toFixed(4))}`,
      faixa.color ? `color: '${faixa.color}'` : `intent: '${faixa.intent}'`,
      `label: '${faixa.label}'`,
    ].filter(Boolean);

    return `  { ${partes.join(', ')} },`;
  });

  return `[\n${linhas.join('\n')}\n]`;
}

const ABERTURAS = ['180', '240', '270'];

const playground = definirPlayground({
  inicial: {
    cenario: 'Meta de faturamento',
    posicaoNaEscala: 77,
    valueDisplay: 'percentOfTarget',
    segmentUnit: 'percentOfTarget',
    indicator: 'fill',
    abertura: '240',
    thickness: 18,
    trackRadius: 6,
    segmentStyle: 'rim',
    colorBySegment: false,
    showSegmentLabels: 'hidden',
    ticks: 'major',
    tickCount: 4,
    scaleLabels: 'ticks',
    target: true,
    delta: true,
    showCenter: true,
    size: 'default',
    legend: 'bottom',
    showTooltip: true,
    semDado: false,
    loading: false,
    accent: 'nenhuma',
  },
  controles: [
    { tipo: 'opcoes', nome: 'cenario', opcoes: Object.keys(CENARIOS) },
    { tipo: 'numero', nome: 'posicaoNaEscala', min: -20, max: 140, passo: 1 },
    { tipo: 'opcoes', nome: 'valueDisplay', opcoes: ['value', 'percentOfTarget'] },
    { tipo: 'opcoes', nome: 'segmentUnit', opcoes: ['value', 'percentOfTarget'] },
    { tipo: 'opcoes', nome: 'indicator', opcoes: ['fill', 'needle', 'fillAndNeedle'] },
    { tipo: 'opcoes', nome: 'abertura', opcoes: ABERTURAS },
    { tipo: 'numero', nome: 'thickness', min: 4, max: 32, passo: 1 },
    { tipo: 'numero', nome: 'trackRadius', min: 0, max: 16, passo: 1 },
    { tipo: 'opcoes', nome: 'segmentStyle', opcoes: ['track', 'rim', 'hidden'] },
    { tipo: 'booleano', nome: 'colorBySegment' },
    { tipo: 'opcoes', nome: 'showSegmentLabels', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'ticks', opcoes: ['hidden', 'major', 'majorAndMinor'] },
    { tipo: 'numero', nome: 'tickCount', min: 2, max: 10 },
    { tipo: 'opcoes', nome: 'scaleLabels', opcoes: ['hidden', 'minMax', 'ticks'] },
    { tipo: 'booleano', nome: 'target' },
    { tipo: 'booleano', nome: 'delta' },
    { tipo: 'booleano', nome: 'showCenter' },
    { tipo: 'opcoes', nome: 'size', opcoes: ['default', 'compact'] },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'booleano', nome: 'showTooltip' },
    { tipo: 'booleano', nome: 'semDado' },
    { tipo: 'booleano', nome: 'loading' },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
  ],
  renderizar: (valores) => {
    const cenario = CENARIOS[valores.cenario];
    const [inicio, fim] = cenario.escala;
    const meia = Number(valores.abertura) / 2;

    return (
      <div style={{ width: '100%' }}>
        <ChartGauge
          {...cenario.props}
          accent={accentDa(valores.accent)}
          colorBySegment={valores.colorBySegment}
          delta={valores.delta ? cenario.props.delta : undefined}
          endAngle={meia}
          indicator={valores.indicator as ChartGaugeIndicator}
          legend={valores.legend as ChartLegendPosition}
          loading={valores.loading}
          scaleLabels={valores.scaleLabels as ChartGaugeScaleLabels}
          segmentStyle={valores.segmentStyle as ChartGaugeSegmentStyle}
          segmentUnit={valores.segmentUnit as ChartGaugeSegmentUnit}
          segments={faixasNaUnidade(cenario, valores.segmentUnit as ChartGaugeSegmentUnit)}
          showCenter={valores.showCenter}
          showSegmentLabels={valores.showSegmentLabels as (typeof VISIBILIDADES)[number]}
          showTooltip={valores.showTooltip}
          size={valores.size as ChartGaugeSize}
          startAngle={-meia}
          target={valores.target ? cenario.props.target : undefined}
          thickness={valores.thickness}
          tickCount={valores.tickCount}
          ticks={valores.ticks as ChartGaugeTicks}
          trackRadius={valores.trackRadius}
          value={valores.semDado ? null : inicio + ((fim - inicio) * valores.posicaoNaEscala) / 100}
          valueDisplay={valores.valueDisplay as ChartGaugeValueDisplay}
        />
      </div>
    );
  },
  codigo: (valores) => {
    const cenario = CENARIOS[valores.cenario];
    const [inicio, fim] = cenario.escala;
    const { props } = cenario;
    const meia = Number(valores.abertura) / 2;
    const valor = Number((inicio + ((fim - inicio) * valores.posicaoNaEscala) / 100).toFixed(2));

    return gerarJsx('ChartGauge', [
      ['title', props.title],
      ['accent', accentDa(valores.accent)],
      ['loading', valores.loading, false],
      ['value', valores.semDado ? expr('null') : valor],
      ['min', props.min],
      ['max', props.max],
      ['formatValue', expr(cenario.codigo.formatValue)],
      ['formatTooltipValue', cenario.codigo.formatTooltipValue && expr(cenario.codigo.formatTooltipValue)],
      ['valueDisplay', valores.valueDisplay, 'value'],
      ['startAngle', -meia, -90],
      ['endAngle', meia, 90],
      ['thickness', valores.thickness, 16],
      ['trackRadius', valores.trackRadius],
      ['indicator', valores.indicator, 'fill'],
      ['segments', expr(codigoDasFaixas(faixasNaUnidade(cenario, valores.segmentUnit as ChartGaugeSegmentUnit)))],
      ['segmentUnit', valores.segmentUnit, 'value'],
      ['segmentStyle', valores.segmentStyle, 'track'],
      ['colorBySegment', valores.colorBySegment, false],
      ['showSegmentLabels', valores.showSegmentLabels, 'hidden'],
      [
        'target',
        valores.target
          ? expr(`{ ${props.target.label ? `label: '${props.target.label}', ` : ''}value: ${props.target.value} }`)
          : undefined,
      ],
      ['ticks', valores.ticks, 'hidden'],
      ['tickCount', valores.ticks === 'hidden' || valores.valueDisplay === 'percentOfTarget' ? undefined : valores.tickCount, 5],
      ['scaleLabels', valores.scaleLabels, 'minMax'],
      ['showCenter', valores.showCenter, true],
      ['centerLabel', props.centerLabel],
      ['delta', valores.delta ? expr(cenario.codigo.delta) : undefined],
      ['size', valores.size, 'default'],
      ['legend', valores.legend, 'none'],
      ['showTooltip', valores.showTooltip, true],
    ]);
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [];

    if (valores.loading || valores.semDado) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Imagem sem valor',
        detalhe: valores.loading
          ? 'Carregando, o desenho é role="img" com aria-busy e o nome "…: carregando".'
          : 'Sem valor, não há medidor: role="img" com o nome "…: sem dados no período".',
      });
    } else {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Medidor',
        detalhe: 'role="meter" com aria-valuenow, aria-valuemin, aria-valuemax e o aria-valuetext com a faixa, a meta e a variação.',
      });
    }

    if (valores.posicaoNaEscala > 100 || valores.posicaoNaEscala < 0) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Fora da escala',
        detalhe: 'O arco satura no limite; o centro e o aria-valuetext dizem o valor real. O aria-valuenow fica preso ao limite.',
      });
    }

    if (!valores.target && (valores.valueDisplay === 'percentOfTarget' || valores.segmentUnit === 'percentOfTarget')) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Sem meta',
        detalhe: 'percentOfTarget precisa de uma meta positiva. Sem ela, exibição e faixas voltam à unidade do valor.',
      });
    }

    if (valores.showSegmentLabels === 'hidden' && valores.legend === 'none' && valores.segmentStyle !== 'hidden') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Faixa só pela cor no desenho',
        detalhe: 'Sem rótulos nem legenda, o nome da faixa fica no balão e no aria-valuetext.',
      });
    }

    if (valores.size === 'compact') {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Compacto',
        detalhe: 'Marcas, rótulos, a meta escrita e a variação saem do desenho e seguem no balão e no aria-valuetext.',
      });
    }

    return verificacoes;
  },
});

/* ---- Exemplos -------------------------------------------------------------------------------------------------- */

const SERVIDORES = [
  { id: 'api-01', cpu: 68, pico: '74% às 14h20' },
  { id: 'api-02', cpu: 93, pico: '97% às 09h05' },
  { id: 'worker-01', cpu: 34, pico: '51% às 03h40' },
];

function CpuPorServidor() {
  return (
    <div style={{ width: '100%' }}>
      <Table label="Uso de CPU por servidor" rows={SERVIDORES} size="sm">
        <Table.Header>
          <Table.Column id="servidor">Servidor</Table.Column>
          <Table.Column id="cpu">CPU</Table.Column>
          <Table.Column id="pico">Pico 24 h</Table.Column>
        </Table.Header>
        <Table.Body items={SERVIDORES}>
          {(servidor) => (
            <Table.Row id={servidor.id}>
              <Table.Cell>{servidor.id}</Table.Cell>
              <Table.Cell>
                <div style={{ width: 96 }}>
                  <ChartGauge
                    colorBySegment
                    formatValue={(valor) => formatarPercentual(valor / 100)}
                    height={52}
                    segments={FAIXAS_DE_CPU}
                    size="compact"
                    thickness={7}
                    title={`CPU de ${servidor.id}`}
                    trackRadius={3}
                    value={servidor.cpu}
                  />
                </div>
              </Table.Cell>
              <Table.Cell>{servidor.pico}</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  );
}

const SAUDE_COMUM = {
  colorBySegment: true,
  endAngle: 120,
  height: 104,
  segmentStyle: 'rim',
  size: 'compact',
  startAngle: -120,
  thickness: 8,
  trackRadius: 4,
} as const;

function SaudeDoServico() {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', width: '100%' }}>
      <ChartGauge
        {...SAUDE_COMUM}
        centerLabel="30 dias"
        formatValue={(valor) => formatarPercentual(valor / 100, { casasDecimais: 2 })}
        max={100}
        min={99}
        segments={[
          { to: 99.5, intent: 'negative', label: 'Fora do SLA' },
          { to: 99.9, intent: 'warning', label: 'Risco' },
          { intent: 'positive', label: 'No SLA' },
        ]}
        target={{ label: 'SLA', value: 99.9 }}
        title="Disponibilidade"
        value={99.95}
      />
      <ChartGauge
        {...SAUDE_COMUM}
        centerLabel="última hora"
        formatValue={(valor) => formatarPercentual(valor / 100, { casasDecimais: 1 })}
        max={5}
        segments={[
          { to: 1, intent: 'positive', label: 'Normal' },
          { to: 2.5, intent: 'warning', label: 'Atenção' },
          { intent: 'negative', label: 'Incidente' },
        ]}
        title="Taxa de erro"
        value={0.8}
      />
      <ChartGauge
        {...SAUDE_COMUM}
        centerLabel="abertos"
        segments={[
          { to: 30, intent: 'positive', label: 'Tranquila' },
          { to: 60, intent: 'warning', label: 'Cheia' },
          { intent: 'negative', label: 'Represada' },
        ]}
        title="Fila de chamados"
        value={42}
      />
    </div>
  );
}

const VENDEDORES = [
  { nome: 'Ana Ribeiro', valor: 381_000, meta: 300_000 },
  { nome: 'Bruno Tavares', valor: 276_000, meta: 260_000 },
  { nome: 'Carla Mendes', valor: 225_000, meta: 250_000 },
  { nome: 'Diego Farias', valor: 204_000, meta: 240_000 },
  { nome: 'Elisa Moura', valor: 213_000, meta: 260_000 },
  { nome: 'Fábio Nunes', valor: 117_000, meta: 220_000 },
  { nome: 'Gabriela Rocha', valor: 200_000, meta: 230_000 },
  { nome: 'Hugo Lima', valor: 224_000, meta: 240_000 },
];

const VENDEDORES_POR_ATINGIMENTO = [...VENDEDORES].sort((a, b) => b.valor / b.meta - a.valor / a.meta);
const TOTAL_VENDIDO = VENDEDORES.reduce((soma, vendedor) => soma + vendedor.valor, 0);
const META_GLOBAL = VENDEDORES.reduce((soma, vendedor) => soma + vendedor.meta, 0);

/** A grade, a ordem e a soma da meta global são do produto: um ChartGauge por vendedor. */
function MetaGlobalEPorVendedor() {
  const [exibicao, setExibicao] = useState<ChartGaugeValueDisplay>('percentOfTarget');
  const comum = {
    colorBySegment: true,
    endAngle: 120,
    formatTooltipValue: moedaExata,
    formatValue: moedaCompacta,
    segmentStyle: 'rim',
    segmentUnit: 'percentOfTarget',
    segments: FAIXAS_DA_META,
    startAngle: -120,
    valueDisplay: exibicao,
  } as const;

  return (
    <div className="stack" style={{ width: '100%' }}>
      <SegmentedControl
        items={[
          { label: 'Moeda', value: 'value' },
          { label: '% da meta', value: 'percentOfTarget' },
        ]}
        label="Exibir"
        onValueChange={(valor) => setExibicao(valor as ChartGaugeValueDisplay)}
        size="sm"
        value={exibicao}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <ChartGauge
            {...comum}
            height={230}
            target={{ value: META_GLOBAL }}
            thickness={18}
            title="Meta global · outubro"
            trackRadius={6}
            value={TOTAL_VENDIDO}
          />
        </div>
        <div
          style={{
            display: 'grid',
            flex: '2 1 440px',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            minWidth: 0,
          }}
        >
          {VENDEDORES_POR_ATINGIMENTO.map((vendedor) => (
            <ChartGauge
              {...comum}
              height={104}
              key={vendedor.nome}
              size="compact"
              target={{ value: vendedor.meta }}
              thickness={8}
              title={vendedor.nome}
              trackRadius={4}
              value={vendedor.valor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Variantes e modos ----------------------------------------------------------------------------------------- */

const DEMONSTRACAO = {
  formatValue: percentual,
  max: 100,
  segments: FAIXAS_DO_SLA,
  target: { value: 95 },
  value: 87.4,
} as const;

function Variantes() {
  return (
    <div className="demo-grid">
      {(['fill', 'needle', 'fillAndNeedle'] as const).map((indicator) => (
        <div className="demo-box" key={indicator}>
          <ChartGauge {...DEMONSTRACAO} height={180} indicator={indicator} title={`indicator="${indicator}"`} />
        </div>
      ))}
      {(['track', 'rim', 'hidden'] as const).map((segmentStyle) => (
        <div className="demo-box" key={segmentStyle}>
          <ChartGauge
            {...DEMONSTRACAO}
            colorBySegment={segmentStyle !== 'track'}
            height={180}
            segmentStyle={segmentStyle}
            title={`segmentStyle="${segmentStyle}"`}
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
        <dt>Escala e faixas</dt>
        <dd>
          <code>min</code> e <code>max</code> delimitam a escala; cada faixa vai do fim da anterior até o seu <code>to</code>,
          a primeira a partir de <code>min</code> e a última, sem <code>to</code>, até <code>max</code>. Faixa com limite
          inválido, ou menor que o anterior, é ignorada.
        </dd>
        <dt><code>origin</code></dt>
        <dd>Numa escala que cruza o zero, o arco parte do zero, com uma marca ali. Sem cruzar, parte de <code>min</code>.</dd>
        <dt>Fora da escala</dt>
        <dd>
          O arco e o ponteiro saturam no limite; o centro mostra o valor real com a seta e &quot;acima do máximo&quot;. A
          escala nunca se move sozinha: mover o máximo mudaria o tamanho de todas as faixas.
        </dd>
        <dt><code>valueDisplay</code> e <code>segmentUnit</code></dt>
        <dd>
          Com meta, o centro e a escala podem mostrar o atingimento, calculado pelo componente, e as faixas podem ser
          declaradas em fração da meta: <code>to: 0.7</code> é 70%. Qualquer uma das duas em <code>percentOfTarget</code>{' '}
          liga a outra leitura no centro, a linha Atingido no balão e as duas leituras no <code>aria-valuetext</code>. Sem{' '}
          <code>max</code> e com meta, a escala vai a 120% dela.
        </dd>
        <dt><code>size=&quot;compact&quot;</code></dt>
        <dd>Para linha de tabela e cartão pequeno: marcas, rótulos, a meta escrita e a variação saem do desenho.</dd>
      </dl>
      <div className="demo-grid">
        <div className="demo-box">
          <ChartGauge {...DEMONSTRACAO} height={180} title="Acima do máximo" value={112} />
        </div>
        <div className="demo-box">
          <ChartGauge {...DEMONSTRACAO} height={180} loading title="Carregando" />
        </div>
        <div className="demo-box">
          <ChartGauge {...DEMONSTRACAO} height={180} title="Sem dado" value={null} />
        </div>
      </div>
      <p className="note">
        Carregando, o trilho pulsa, sem pulsar com movimento reduzido. Sem dado, a escala continua legível e o desenho
        vira <code>role=&quot;img&quot;</code>: um medidor sem valor não existe.
      </p>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'SLA de atendimento',
      descricao: 'Meia-lua com régua de faixas, cor pelo valor e meta. A variação contra o mês anterior fica no centro.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartGauge
            centerLabel="chamados no prazo"
            colorBySegment
            delta={{ value: 3.2, label: 'vs. setembro', format: pontosPercentuais }}
            formatValue={percentual}
            height={200}
            legend="bottom"
            max={100}
            segmentStyle="rim"
            segments={FAIXAS_DO_SLA}
            target={{ value: 95 }}
            thickness={18}
            title="SLA de atendimento"
            trackRadius={5}
            value={87.4}
          />
        </div>
      ),
      codigo: `<ChartGauge
  title="SLA de atendimento"
  value={87.4}
  max={100}
  formatValue={(valor) => \`\${formatarNumero(valor)}%\`}
  thickness={18}
  trackRadius={5}
  segments={[
    { to: 80, intent: 'negative', label: 'Crítico' },
    { to: 90, intent: 'warning', label: 'Atenção' },
    { intent: 'positive', label: 'Bom' },
  ]}
  segmentStyle="rim"
  colorBySegment
  target={{ value: 95 }}
  centerLabel="chamados no prazo"
  delta={{ value: 3.2, label: 'vs. setembro', format: (variacao) => \`\${formatarNumero(variacao, { casasDecimais: 1 })} p.p.\` }}
  height={200}
  legend="bottom"
/>`,
    },
    {
      titulo: 'NPS de −100 a 100',
      descricao: 'Escala que cruza o zero, com as quatro zonas do NPS. O arco parte do zero, não do mínimo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartGauge
            centerLabel="1.284 respostas"
            colorBySegment
            delta={{ value: 6, label: 'vs. 2º tri', format: pontos }}
            endAngle={120}
            formatValue={comSinal}
            height={230}
            max={100}
            min={-100}
            scaleLabels="ticks"
            segmentStyle="rim"
            segments={FAIXAS_DO_NPS}
            startAngle={-120}
            target={{ value: 50 }}
            tickCount={4}
            ticks="major"
            title="NPS do trimestre"
            value={42}
          />
        </div>
      ),
      codigo: `<ChartGauge
  title="NPS do trimestre"
  value={42}
  min={-100}
  max={100}
  formatValue={(valor) => (valor > 0 ? '+' : '') + formatarNumero(valor, { casasDecimais: 0 })}
  startAngle={-120}
  endAngle={120}
  segments={[
    { to: 0, intent: 'negative', label: 'Zona crítica' },
    { to: 50, intent: 'warning', label: 'Aperfeiçoamento' },
    { to: 75, color: 'var(--pl-chart-series-1)', label: 'Qualidade' },
    { intent: 'positive', label: 'Excelência' },
  ]}
  segmentStyle="rim"
  colorBySegment
  target={{ value: 50 }}
  ticks="major"
  tickCount={4}
  scaleLabels="ticks"
  centerLabel="1.284 respostas"
  delta={{ value: 6, label: 'vs. 2º tri', format: (variacao) => \`\${formatarNumero(variacao, { casasDecimais: 0 })} pts\` }}
  height={230}
/>`,
    },
    {
      titulo: 'Tempo de resposta da API',
      descricao: 'Faixas invertidas: menor é melhor. Ponteiro sobre trilho colorido, com marcas e o SLO como meta.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartGauge
            centerLabel="últimos 15 min"
            delta={{ value: -18, label: 'vs. hora anterior', intent: 'positive', format: milissegundos }}
            endAngle={135}
            formatValue={milissegundos}
            height={250}
            indicator="needle"
            legend="bottom"
            max={1000}
            scaleLabels="ticks"
            segments={FAIXAS_DA_API}
            startAngle={-135}
            target={{ label: 'SLO', value: 250 }}
            thickness={14}
            ticks="majorAndMinor"
            title="Tempo de resposta da API (p95)"
            trackRadius={0}
            value={320}
          />
        </div>
      ),
      codigo: `<ChartGauge
  title="Tempo de resposta da API (p95)"
  value={320}
  max={1000}
  formatValue={(valor) => \`\${formatarNumero(valor, { casasDecimais: 0 })} ms\`}
  startAngle={-135}
  endAngle={135}
  thickness={14}
  trackRadius={0}
  indicator="needle"
  segments={[
    { to: 200, intent: 'positive', label: 'Bom' },
    { to: 500, intent: 'warning', label: 'Atenção' },
    { intent: 'negative', label: 'Crítico' },
  ]}
  target={{ label: 'SLO', value: 250 }}
  ticks="majorAndMinor"
  scaleLabels="ticks"
  centerLabel="últimos 15 min"
  delta={{ value: -18, label: 'vs. hora anterior', intent: 'positive', format: (variacao) => \`\${formatarNumero(variacao, { casasDecimais: 0 })} ms\` }}
  height={250}
  legend="bottom"
/>`,
    },
    {
      titulo: 'Meta de faturamento',
      descricao:
        'O consumidor passa moeda e escolhe a exibição; o componente calcula o atingimento. Faixas em fração da meta e escala até 120% dela, sem max.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartGauge
            colorBySegment
            delta={{ value: 120_000, label: 'vs. setembro', format: moedaCompacta }}
            endAngle={120}
            formatTooltipValue={moedaExata}
            formatValue={moedaCompacta}
            height={260}
            legend="bottom"
            scaleLabels="ticks"
            segmentStyle="rim"
            segmentUnit="percentOfTarget"
            segments={FAIXAS_DA_META}
            startAngle={-120}
            target={{ value: 2_000_000 }}
            thickness={18}
            ticks="major"
            title="Faturamento de outubro"
            trackRadius={6}
            value={1_840_000}
            valueDisplay="percentOfTarget"
          />
        </div>
      ),
      codigo: `<ChartGauge
  title="Faturamento de outubro"
  value={1840000}
  formatValue={(valor) => formatarMoeda(valor, { compacto: true })}
  formatTooltipValue={(valor) => formatarMoeda(valor, { casasDecimais: 0 })}
  valueDisplay="percentOfTarget"
  segmentUnit="percentOfTarget"
  segments={[
    { to: 0.7, intent: 'negative', label: 'Crítica' },
    { to: 1, intent: 'warning', label: 'Atenção' },
    { intent: 'positive', label: 'Atingida' },
  ]}
  target={{ value: 2000000 }}
  startAngle={-120}
  endAngle={120}
  thickness={18}
  trackRadius={6}
  segmentStyle="rim"
  colorBySegment
  ticks="major"
  scaleLabels="ticks"
  delta={{ value: 120000, label: 'vs. setembro', format: (variacao) => formatarMoeda(variacao, { compacto: true }) }}
  height={260}
  legend="bottom"
/>`,
    },
    {
      titulo: 'Uso de CPU numa tabela',
      descricao: 'Compacto dentro de uma linha. Sem marcas nem rótulos; a faixa vem pela cor e pelo balão.',
      Previa: CpuPorServidor,
      codigo: `<Table.Cell>
  <ChartGauge
    title={\`CPU de \${servidor.id}\`}
    value={servidor.cpu}
    formatValue={(valor) => formatarPercentual(valor / 100)}
    size="compact"
    thickness={7}
    trackRadius={3}
    height={52}
    segments={[
      { to: 70, intent: 'positive', label: 'Normal' },
      { to: 90, intent: 'warning', label: 'Alto' },
      { intent: 'negative', label: 'Saturado' },
    ]}
    colorBySegment
  />
</Table.Cell>`,
    },
    {
      titulo: 'Saúde do serviço',
      largo: true,
      descricao: 'Três compactos lado a lado, cada um com a sua escala.',
      Previa: SaudeDoServico,
      codigo: `const comum = { size: 'compact', startAngle: -120, endAngle: 120, thickness: 8, trackRadius: 4, height: 104, segmentStyle: 'rim', colorBySegment: true };

<ChartGauge {...comum} title="Disponibilidade" value={99.95} min={99} max={100}
  formatValue={(valor) => formatarPercentual(valor / 100, { casasDecimais: 2 })}
  target={{ label: 'SLA', value: 99.9 }} centerLabel="30 dias" segments={faixasDoSla} />
<ChartGauge {...comum} title="Taxa de erro" value={0.8} max={5}
  formatValue={(valor) => formatarPercentual(valor / 100, { casasDecimais: 1 })}
  centerLabel="última hora" segments={faixasDeErro} />
<ChartGauge {...comum} title="Fila de chamados" value={42} centerLabel="abertos" segments={faixasDaFila} />`,
    },
    {
      titulo: 'Meta global e por vendedor',
      largo: true,
      descricao:
        'A empresa vê o total contra a meta global; cada vendedor, o seu valor contra a própria meta, em ordem de atingimento. A grade e a escolha da exibição são composição do produto.',
      Previa: MetaGlobalEPorVendedor,
      codigo: `const [exibicao, setExibicao] = useState('percentOfTarget');
const comum = {
  formatValue: (valor) => formatarMoeda(valor, { compacto: true }),
  formatTooltipValue: (valor) => formatarMoeda(valor, { casasDecimais: 0 }),
  valueDisplay: exibicao,
  segmentUnit: 'percentOfTarget',
  segments: [
    { to: 0.7, intent: 'negative', label: 'Crítica' },
    { to: 1, intent: 'warning', label: 'Atenção' },
    { intent: 'positive', label: 'Atingida' },
  ],
  startAngle: -120,
  endAngle: 120,
  segmentStyle: 'rim',
  colorBySegment: true,
};

<SegmentedControl label="Exibir" value={exibicao} onValueChange={setExibicao}
  items={[{ label: 'Moeda', value: 'value' }, { label: '% da meta', value: 'percentOfTarget' }]} />
<ChartGauge {...comum} title="Meta global · outubro" value={totalVendido} target={{ value: metaGlobal }}
  thickness={18} trackRadius={6} height={230} />
{porAtingimento(vendedores).map((vendedor) => (
  <ChartGauge {...comum} key={vendedor.nome} title={vendedor.nome} value={vendedor.valor}
    target={{ value: vendedor.meta }} size="compact" thickness={8} trackRadius={4} height={104} />
))}`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartGauge {...DEMONSTRACAO} colorBySegment height={180} segmentStyle="rim" title="SLA de atendimento" />
      </div>
    ),
    texto:
      'Em que faixa um valor cai, numa escala com significado — crítico, atenção, bom — ou que começa abaixo de zero. Isso é ChartGauge.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartRadial
          endAngle={90}
          formatValue={(valor) => formatarPercentual(valor / 100)}
          height={180}
          startAngle={-90}
          title="Atingimento da meta"
          tracks={[{ label: 'Meta mensal', max: 100, value: 64 }]}
        />
      </div>
    ),
    texto:
      'Quanto da meta foi atingido, de zero até 100%, sem faixas: o anel de progresso é ChartRadial, mesmo em meia-lua. Várias medidas contra a meta, também.',
  },
  Variantes,
  Modos,
  teclado: [
    {
      teclas: ['Tab'],
      acao: 'O medidor não recebe foco: não é controle. O leitor de tela chega a ele pelo cursor virtual, como a um parágrafo.',
    },
  ],
  notaDaApi: (
    <>
      O ChartGauge é a exceção ao <code>role=&quot;img&quot;</code> da família: um valor só, entre limites conhecidos, é o
      que o papel <code>meter</code> descreve.
    </>
  ),
  garantias: [
    {
      garantia: 'Medidor',
      como: <><code>role=&quot;meter&quot;</code> nomeado pelo <code>title</code>, com <code>aria-valuenow</code>, <code>aria-valuemin</code> e <code>aria-valuemax</code>; sem parada de Tab.</>,
      teste: 'ChartGauge.test.tsx',
    },
    {
      garantia: 'Frase do valor',
      como: <><code>aria-valuetext</code> com o valor formatado, a faixa, a meta e a variação; <code>ariaValueText</code> a troca.</>,
      teste: 'ChartGauge.test.tsx, gaugeReading.test.ts',
    },
    {
      garantia: 'Fora da escala',
      como: <><code>aria-valuenow</code> preso ao limite; o centro e o <code>aria-valuetext</code> dizem o valor real.</>,
      teste: 'ChartGauge.test.tsx',
    },
    { garantia: 'Origem no zero', como: 'Na escala que cruza o zero, o arco parte do zero, com uma marca.', teste: 'ChartGauge.test.tsx' },
    {
      garantia: 'Leitura contra a meta',
      como: 'Atingimento calculado; faixas em fração da meta; a segunda leitura só quando percentOfTarget é pedido.',
      teste: 'ChartGauge.test.tsx, gaugeScale.test.ts',
    },
    { garantia: 'Raio das pontas', como: 'trackRadius limitado a metade da espessura.', teste: 'ChartGauge.test.tsx' },
    {
      garantia: 'Estados',
      como: <>Carregando e sem dado viram <code>role=&quot;img&quot;</code> com o estado no nome; carregando, com <code>aria-busy</code>.</>,
      teste: 'ChartGauge.test.tsx',
    },
    { garantia: 'Número inválido', como: 'Valor, limite, meta, faixa ou variação inválidos não viram geometria.', teste: 'ChartGauge.test.tsx' },
    { garantia: 'Movimento', como: 'O arco e o ponteiro vão da posição anterior à nova; com movimento reduzido, direto.', teste: 'ChartGauge.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do medidor.' },
    { nome: 'value', tipo: 'number | null', descricao: <>O valor medido. <code>null</code> é sem dado: o centro mostra <code>emptyMessage</code> e o papel vira img.</> },
    { nome: 'min', tipo: 'number', padrao: '0', descricao: 'Início da escala. Pode ser negativo.' },
    { nome: 'max', tipo: 'number', padrao: '100 · com meta, 120% dela', descricao: 'Fim da escala. O valor acima dele satura o arco e é avisado.' },
    { nome: 'valueDisplay', tipo: "'value' | 'percentOfTarget'", padrao: "'value'", descricao: 'O centro, a escala e os intervalos no formatValue ou no atingimento da meta. Sem meta, vale value.' },
    { nome: 'origin', tipo: 'number', padrao: 'automático', descricao: 'De onde o arco parte. Sem ele, o zero quando a escala o cruza; senão, min.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do centro, da escala e da meta.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato exato do balão e, na leitura contra a meta, do aria-valuetext.' },
    { nome: 'startAngle', tipo: 'number', padrao: '-90', descricao: 'Ângulo inicial, em graus a partir do topo.' },
    { nome: 'endAngle', tipo: 'number', padrao: '90', descricao: '-90 e 90 dão a meia-lua; -120 e 120, 240°; -135 e 135, 270°.' },
    { nome: 'thickness', tipo: 'number', padrao: '16', descricao: 'Espessura do arco, em px. No compacto, até 10.' },
    { nome: 'trackRadius', tipo: 'number', padrao: 'raio sm', descricao: 'Raio das pontas, limitado a metade da espessura.' },
    { nome: 'indicator', tipo: "'fill' | 'needle' | 'fillAndNeedle'", padrao: "'fill'", descricao: 'Arco preenchido, ponteiro com pino, ou os dois.' },
    { nome: 'size', tipo: "'default' | 'compact'", padrao: "'default'", descricao: 'compact esconde marcas, rótulos, a meta escrita e a variação.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '220 · compact 96', descricao: 'Altura do desenho; o arco se ajusta à largura.' },
    { nome: 'segments', tipo: 'readonly ChartGaugeSegment[]', padrao: '[]', descricao: <><code>{'{ to?, label?, color?, intent? }'}</code>, em ordem crescente; a primeira começa em min.</> },
    { nome: 'segmentUnit', tipo: "'value' | 'percentOfTarget'", padrao: "'value'", descricao: <>Unidade do <code>to</code>. Em percentOfTarget, fração da meta: 0.7 é 70%.</> },
    { nome: 'segmentStyle', tipo: "'track' | 'rim' | 'hidden'", padrao: "'track'", descricao: 'Faixas no trilho, atenuadas atrás do arco; numa régua fina por fora; ou só na cor e no balão.' },
    { nome: 'colorBySegment', tipo: 'boolean', padrao: 'false', descricao: 'O arco assume a cor da faixa onde o valor está.' },
    { nome: 'showSegmentLabels', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'hidden'", descricao: 'Nome de cada faixa por fora do arco.' },
    { nome: 'target', tipo: 'ChartGaugeTarget', descricao: <><code>{'{ value, label? }'}</code>: marca no arco, com rótulo.</> },
    { nome: 'ticks', tipo: "'hidden' | 'major' | 'majorAndMinor'", padrao: "'hidden'", descricao: 'Marcas principais e, entre elas, quatro secundárias. Em percentOfTarget, a cada 50% da meta.' },
    { nome: 'tickCount', tipo: 'number', padrao: '5', descricao: 'Divisões principais entre min e max.' },
    { nome: 'scaleLabels', tipo: "'hidden' | 'minMax' | 'ticks'", padrao: "'minMax'", descricao: 'Rótulos só nas pontas ou em cada marca principal.' },
    { nome: 'showCenter', tipo: 'boolean', padrao: 'true', descricao: 'Valor formatado no centro.' },
    { nome: 'centerLabel', tipo: 'string', descricao: 'Texto sob o valor. Sem ele, na leitura contra a meta, a outra leitura.' },
    { nome: 'delta', tipo: 'ChartGaugeDelta', descricao: <><code>{'{ value, label?, intent?, format? }'}</code>: variação com seta e sinal; o format recebe o módulo.</> },
    { nome: 'showTooltip', tipo: 'boolean', padrao: 'true', descricao: 'Balão: faixa, intervalo, valor, meta, variação e, na leitura contra a meta, o atingido.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'none'", descricao: 'Lista das faixas com o intervalo. Não desliga faixa.' },
    { nome: 'color', tipo: 'string', descricao: 'Cor do arco fora de colorBySegment. Vence intent.' },
    { nome: 'intent', tipo: "'positive' | 'negative' | 'warning' | 'neutral'", descricao: 'Intenção do arco fora de colorBySegment.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema do arco e das faixas sem cor nem intenção. Com colorBySegment, o arco assume a cor da faixa do valor, e a faixa com intenção mantém a sua.' },
    { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Trilho pulsando e "Carregando…" no centro; aria-busy.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do centro quando value é null.' },
    { nome: 'ariaValueText', tipo: 'string', padrao: 'montado', descricao: 'Troca a frase do aria-valuetext.' },
  ],
};
