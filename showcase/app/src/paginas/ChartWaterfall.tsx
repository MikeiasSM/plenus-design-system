import { useState } from 'react';
import {
  ChartTooltip,
  ChartWaterfall,
  formatarMoeda,
  type AxisVisibility,
  type ChartWaterfallStep,
  type MarkVisibility,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { formatarCompacto, VISIBILIDADES, FORMATOS } from '../dadosDosGraficos';


function resultadoDoExercicio(resultado: number, deducoesComoAlerta: boolean): ChartWaterfallStep[] {
  return [
    { label: 'Receita bruta', value: 300000 },
    { label: 'Deduções', value: -42000, intent: deducoesComoAlerta ? 'warning' : undefined },
    { label: 'Receita líquida', value: 258000, total: true },
    { label: 'CMV', value: -96000 },
    { label: 'Despesas', value: -50200 },
    { label: 'Resultado', value: resultado, total: true },
  ];
}

const CAIXA: ChartWaterfallStep[] = [
  { label: 'Saldo inicial', value: 80000, total: true },
  { label: 'Recebimentos', value: 142000 },
  { label: 'Pagamentos', value: -96000 },
  { label: 'Saldo final', value: 126000, total: true },
];

/** Acumulado ao fim de cada passo: o total recomeça do zero, os demais somam ao anterior. */
function acumulados(passos: readonly ChartWaterfallStep[]) {
  let acumulado = 0;

  return passos.map((passo) => {
    acumulado = passo.total ? passo.value : acumulado + passo.value;

    return acumulado;
  });
}

const playground = definirPlayground({
  inicial: {
    title: 'Formação do resultado',
    resultado: 111800,
    deducoesComoAlerta: true,
    showDataLabels: 'visible',
    xAxis: 'visible',
    yAxis: 'visible',
    yAxisRight: 'hidden',
    formatValue: 'compacto',
    formatTooltipValue: 'igual',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'numero', nome: 'resultado', passo: 1000 },
    { tipo: 'booleano', nome: 'deducoesComoAlerta' },
    { tipo: 'opcoes', nome: 'showDataLabels', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'xAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'yAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'yAxisRight', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'formatValue', opcoes: Object.keys(FORMATOS) },
    { tipo: 'opcoes', nome: 'formatTooltipValue', opcoes: ['igual', ...Object.keys(FORMATOS)] },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartWaterfall
        formatTooltipValue={FORMATOS[valores.formatTooltipValue]?.formatar}
        formatValue={FORMATOS[valores.formatValue].formatar}
        onHoverStep={(indice) => registrar(`onHoverStep: ${indice}`)}
        showDataLabels={valores.showDataLabels as MarkVisibility}
        steps={resultadoDoExercicio(valores.resultado, valores.deducoesComoAlerta)}
        title={valores.title}
        xAxis={valores.xAxis as AxisVisibility}
        yAxis={valores.yAxis as AxisVisibility}
        yAxisRight={valores.yAxisRight as AxisVisibility}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartWaterfall', [
      ['title', valores.title],
      [
        'steps',
        expr(`[
  { label: 'Receita bruta', value: 300000 },
  { label: 'Deduções', value: -42000${valores.deducoesComoAlerta ? ", intent: 'warning'" : ''} },
  { label: 'Receita líquida', value: 258000, total: true },
  { label: 'CMV', value: -96000 },
  { label: 'Despesas', value: -50200 },
  { label: 'Resultado', value: ${valores.resultado}, total: true },
]`),
      ],
      ['showDataLabels', valores.showDataLabels, 'visible'],
      ['xAxis', valores.xAxis, 'visible'],
      ['yAxis', valores.yAxis, 'visible'],
      ['yAxisRight', valores.yAxisRight, 'hidden'],
      ['formatValue', expr(FORMATOS[valores.formatValue].codigo)],
      ['formatTooltipValue', FORMATOS[valores.formatTooltipValue] && expr(FORMATOS[valores.formatTooltipValue].codigo)],
      ['onHoverStep', expr('setPasso')],
    ]),
  verificar: (valores) => {
    const passos = resultadoDoExercicio(valores.resultado, valores.deducoesComoAlerta);
    const esperado = acumulados(passos.slice(0, -1)).at(-1) ?? 0;
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
      valores.resultado === esperado
        ? { nivel: 'ok', titulo: 'O total fecha a conta', detalhe: `${formatarCompacto(esperado)} é o acumulado dos passos anteriores.` }
        : {
            nivel: 'atencao',
            titulo: 'Total que não fecha',
            detalhe: `O total parte do zero com o valor informado, sem conferir: os passos somam ${formatarCompacto(esperado)}.`,
          },
    ];

    if (valores.deducoesComoAlerta) {
      verificacoes.push({ nivel: 'ok', titulo: 'Intenção declarada', detalhe: 'A intent do passo vence a cor deduzida do sinal.' });
    }

    if (valores.yAxis === 'hidden' && valores.yAxisRight === 'hidden' && valores.showDataLabels === 'hidden') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Valor sem leitura', detalhe: 'Sem eixo de valor e sem rótulos, a variação não se traduz em número na tela.' });
    }

    return verificacoes;
  },
});

function PassoNoPonteiro() {
  const [passo, setPasso] = useState<number | null>(null);
  const passos = resultadoDoExercicio(111800, true);
  const acumulado = acumulados(passos);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatarMoeda }]}
        computed="none"
        rows={
          passo === null
            ? []
            : [
                { label: passos[passo].total ? 'Total' : 'Variação', values: [passos[passo].value] },
                { emphasis: true, label: 'Acumulado', values: [acumulado[passo]] },
              ]
        }
        title={passo === null ? '' : passos[passo].label}
      >
        <ChartWaterfall showTooltip={false} formatValue={formatarCompacto} onHoverStep={setPasso} steps={passos} title="Formação do resultado" />
      </ChartTooltip>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Cor do passo</dt>
      <dd>
        Sai do sinal: aporte em <code>positive</code>, dedução em <code>negative</code>. O passo pode declarar a própria{' '}
        <code>intent</code>, ou uma <code>color</code>, que vencem a do sinal. O total é fechamento, e fica neutro.
      </dd>
      <dt><code>total</code></dt>
      <dd>
        O passo parte do zero, porque fecha a conta em vez de acrescentar a ela, e o rótulo dispensa o sinal. O valor não é
        calculado pelo gráfico: é o informado.
      </dd>
      <dt><code>showDataLabels</code></dt>
      <dd>
        Visível por padrão; em <code>onHover</code>, só o do passo sob o ponteiro. O sinal da variação pertence ao gráfico, que formata só a magnitude com{' '}
        <code>formatValue</code>; o zero sai sem sinal.
      </dd>
      <dt>Conectores</dt>
      <dd>Linhas tracejadas ligam o acumulado de cada passo ao início do próximo, e a linha da base destaca o zero.</dd>
      <dt>Valor inválido</dt>
      <dd>O passo não é desenhado e não move o acumulado: o seguinte parte de onde o anterior parou.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Formação do resultado',
      descricao: 'Da receita bruta ao resultado, com as deduções em alerta e dois totais que fecham a conta.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartWaterfall formatValue={formatarCompacto} steps={resultadoDoExercicio(111800, true)} title="Formação do resultado" />
        </div>
      ),
      codigo: `<ChartWaterfall
  title="Formação do resultado"
  steps={[
    { label: 'Receita bruta', value: 300000 },
    { label: 'Deduções', value: -42000, intent: 'warning' },
    { label: 'Receita líquida', value: 258000, total: true },
    { label: 'CMV', value: -96000 },
    { label: 'Despesas', value: -50200 },
    { label: 'Resultado', value: 111800, total: true },
  ]}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Movimentação do caixa',
      descricao: 'Sem rótulo de variação, os conectores tracejados contam o caminho do saldo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartWaterfall formatValue={formatarCompacto} height={220} showDataLabels="hidden" steps={CAIXA} title="Movimentação do caixa" />
        </div>
      ),
      codigo: `<ChartWaterfall
  title="Movimentação do caixa"
  steps={[
    { label: 'Saldo inicial', value: 80000, total: true },
    { label: 'Recebimentos', value: 142000 },
    { label: 'Pagamentos', value: -96000 },
    { label: 'Saldo final', value: 126000, total: true },
  ]}
  showDataLabels="hidden"
  height={220}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Passo no ponteiro',
      descricao: 'onHoverStep avisa o passo, e o ChartTooltip mostra a variação e o acumulado até ali.',
      Previa: PassoNoPonteiro,
      codigo: `const [passo, setPasso] = useState<number | null>(null);

<ChartTooltip
  title={passo === null ? '' : passos[passo].label}
  columns={[{ format: formatarMoeda }]}
  computed="none"
  rows={passo === null ? [] : [
    { label: passos[passo].total ? 'Total' : 'Variação', values: [passos[passo].value] },
    { label: 'Acumulado', values: [acumulado[passo]], emphasis: true },
  ]}
>
  <ChartWaterfall showTooltip={false} title="Formação do resultado" steps={passos} onHoverStep={setPasso} />
</ChartTooltip>`,
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartWaterfall.test.tsx' },
    { garantia: 'Barra flutuante', como: 'Cada passo parte de onde o anterior parou; o total parte do zero.', teste: 'ChartWaterfall.test.tsx' },
    { garantia: 'Cor com significado', como: 'Pelo sinal, ou pela intent declarada, que vence a deduzida.', teste: 'ChartWaterfall.test.tsx' },
    { garantia: 'Sinal da variação', como: 'Rótulo com sinal na variação, sem sinal no total e no zero.', teste: 'ChartWaterfall.test.tsx' },
    { garantia: 'Número inválido', como: 'O passo inválido não é desenhado nem move o acumulado.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem passos, um EmptyState no lugar do desenho.', teste: 'ChartWaterfall.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    {
      nome: 'steps',
      tipo: 'readonly ChartWaterfallStep[]',
      descricao: <><code>{'{ label, value, total?, intent?, color? }'}</code>, um por passo, na ordem da conta.</>,
    },
    { nome: 'showDataLabels', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'visible'", descricao: 'Rótulo de variação sobre cada passo; em onHover, só o do passo sob o ponteiro.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato da magnitude; o sinal é do gráfico.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato dos valores no balão: o eixo pode sair compacto e o balão, exato.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '280', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'xAxis', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'visible'", descricao: 'Eixo de baixo.' },
    { nome: 'yAxis', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'visible'", descricao: 'Eixo da esquerda.' },
    { nome: 'yAxisRight', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'hidden'", descricao: 'Eixo da direita, espelho da esquerda.' },
    { nome: 'labelAngle', tipo: "0 | 45 | 90 | 'auto'", padrao: "'auto'", descricao: 'Ângulo dos rótulos do eixo de baixo.' },
    { nome: 'onHoverStep', tipo: '(index: number | null) => void', descricao: 'Passo sob o ponteiro; costura para o ChartTooltip.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
  ],
};
