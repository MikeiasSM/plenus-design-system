import { useState } from 'react';
import {
  ChartTooltip,
  ChartWaterfall,
  formatCurrency,
  type AxisVisibility,
  type ChartWaterfallStep,
  type MarkVisibility,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { formatarCompacto, VISIBILIDADES, FORMATOS } from '../dadosDosGraficos';
import { DecomposicaoDoWaterfall } from '../estrutura/decomposicao';


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
        onHover={(marca) => registrar(`onHover: ${marca ? marca.step.label : null}`)}
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
      ['onHover', expr('(marca) => setPasso(marca?.index ?? null)')],
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
        columns={[{ format: formatCurrency }]}
        computed="none"
        rows={
          passo === null
            ? []
            : [
                { label: passos[passo].total ? passos[passo].label : 'Variação', values: [passos[passo].value] },
                { emphasis: true, label: 'Acumulado', values: [acumulado[passo]] },
              ]
        }
        title={passo === null ? '' : passos[passo].label}
      >
        <ChartWaterfall showTooltip={false} formatValue={formatarCompacto} onHover={(marca) => setPasso(marca?.index ?? null)} steps={passos} title="Formação do resultado" />
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
      titulo: 'Decomposição por encaixe',
      descricao: 'Arraste o canto da caixa. Sem espaço, o gráfico retira o título dos eixos, os rótulos do eixo de valor, os eixos e, por fim, a grade e os rótulos de dado, em vez de encolher tudo. A leitura continua pelo aria-label de cada marca e pela visão em tabela; o que se perde é o controle da legenda.',
      largo: true,
      Previa: DecomposicaoDoWaterfall,
      codigo: `<div style={{ height: 240, overflow: 'hidden', resize: 'both' }}>
  <ChartWaterfall height="fill" title="..." /* dados */ />
</div>`,
    },
    {
      titulo: 'Total nomeado e eixos com título',
      descricao: 'O balão do passo de total usa o rótulo do próprio passo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartWaterfall
            height={240}
            steps={[
              { label: 'Receita', value: 300000 },
              { label: 'Custos', value: -120000 },
              { label: 'Margem bruta', value: 180000, total: true },
            ]}
            title="Da receita à margem"
            xAxisTitle="Etapa"
            yAxisTitle="Valor (R$)"
            formatValue={formatarCompacto}
          />
        </div>
      ),
      codigo: `<ChartWaterfall
  title="Da receita à margem"
  steps={[
    { label: 'Receita', value: 300000 },
    { label: 'Custos', value: -120000 },
    { label: 'Margem bruta', value: 180000, total: true },
  ]}
  xAxisTitle="Etapa"
  yAxisTitle="Valor (R$)"
  formatValue={formatarCompacto}
/>`,
    },
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
      descricao: 'onHover avisa o passo, e o ChartTooltip mostra a variação e o acumulado até ali.',
      Previa: PassoNoPonteiro,
      codigo: `const [passo, setPasso] = useState<number | null>(null);

<ChartTooltip
  title={passo === null ? '' : passos[passo].label}
  columns={[{ format: formatCurrency }]}
  computed="none"
  rows={passo === null ? [] : [
    { label: passos[passo].total ? passos[passo].label : 'Variação', values: [passos[passo].value] },
    { label: 'Acumulado', values: [acumulado[passo]], emphasis: true },
  ]}
>
  <ChartWaterfall showTooltip={false} title="Formação do resultado" steps={passos} onHover={(marca) => setPasso(marca?.index ?? null)} />
</ChartTooltip>`,
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Visão em tabela', como: <>O botão <code>Ver como tabela</code> troca o desenho pela leitura completa; <code>showTableToggle={'{false}'}</code> o tira.</>, teste: 'visao-em-tabela.test.tsx' },
    { garantia: 'Toque', como: 'O primeiro toque fixa o realce e o balão; tocar na marca fixada ativa onMarkClick; tocar fora ou rolar solta. A rolagem da página não é afetada.', teste: 'toque.test.tsx' },
    { garantia: 'Decomposição por encaixe', como: 'Sem espaço, as partes saem na ordem da família e a leitura segue pelo aria-label das marcas.', teste: 'decomposicao.test.tsx' },
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartWaterfall.test.tsx' },
    { garantia: 'Barra flutuante', como: 'Cada passo parte de onde o anterior parou; o total parte do zero.', teste: 'ChartWaterfall.test.tsx' },
    { garantia: 'Cor com significado', como: 'Pelo sinal, ou pela intent declarada, que vence a deduzida.', teste: 'ChartWaterfall.test.tsx' },
    { garantia: 'Sinal da variação', como: 'Rótulo com sinal na variação, sem sinal no total e no zero.', teste: 'ChartWaterfall.test.tsx' },
    { garantia: 'Número inválido', como: 'O passo inválido não é desenhado nem move o acumulado.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem passos, um EmptyState no lugar do desenho.', teste: 'ChartWaterfall.test.tsx' },
  ],
  api: [
    { nome: 'showTableToggle', tipo: 'boolean', padrao: 'true', descricao: 'Botão "Ver como tabela". Sem a prop, vale o do ChartsProvider. Desligado, fica só o desenho.' },
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    {
      nome: 'steps',
      tipo: 'readonly ChartWaterfallStep[]',
      descricao: <><code>{'{ label, value, total?, intent?, color? }'}</code>, um por passo, na ordem da conta.</>,
    },
    { nome: 'showDataLabels', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'visible'", descricao: 'Rótulo de variação sobre cada passo; em onHover, só o do passo sob o ponteiro.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatNumber', descricao: 'Formato da magnitude; o sinal é do gráfico.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato dos valores no balão: o eixo pode sair compacto e o balão, exato.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '280', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'xAxis', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'visible'", descricao: 'Eixo de baixo.' },
    { nome: 'yAxis', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'visible'", descricao: 'Eixo da esquerda.' },
    { nome: 'yAxisRight', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'hidden'", descricao: 'Eixo da direita, espelho da esquerda.' },
    { nome: 'labelAngle', tipo: "0 | 45 | 90 | 'auto'", padrao: "'auto'", descricao: 'Ângulo dos rótulos do eixo de baixo.' },
    { nome: 'onHover', tipo: '(mark: ChartWaterfallMark | null) => void', descricao: 'Passo sob o ponteiro; costura para o ChartTooltip.' },
    { nome: 'onHoverStep', tipo: '(index: number | null) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onHover</code>. Com os dois, os dois avisam.</> },
    { nome: 'xAxisTitle', tipo: "string", descricao: 'Título do eixo das categorias, embaixo do desenho. O espaço sai da área de desenho; com o eixo em onHover, o título aparece e some com ele.' },
    { nome: 'yAxisTitle', tipo: "string", descricao: 'Título do eixo de valor, à esquerda do desenho.' },
    { nome: 'yAxisRightTitle', tipo: "string", descricao: 'Título do eixo de valor da direita; aparece mesmo que o eixo esteja oculto.' },
    { nome: 'minTickStep', tipo: "number", descricao: 'Passo mínimo entre as marcas do eixo de valor, na unidade do dado. Com 1, uma contagem de 0 a 2 marca 0, 1 e 2, e não 0, 0,2 … 1,8.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
    { nome: 'onMarkClick', tipo: '(mark: ChartWaterfallMark) => void', descricao: 'Torna as barras botões, percorridos pelas setas; o balão abre no foco.' },
    { nome: 'onStepClick', tipo: '(step: ChartWaterfallStep, index: number) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onMarkClick</code>. Com os dois, os dois avisam.</> },
  ],
};
