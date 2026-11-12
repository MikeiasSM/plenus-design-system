import { useMemo } from 'react';
import {
  ChartTable,
  BandCursor,
  markShown,
  CartesianFrame,
  useCartesianLayout,
  chartHeight,
  roundedBarPath,
  useChartMetrics,
  useHoveredBand,
  useMarkNavigation,
  useTweenedNumbers,
  valueLabelRoom,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type MarkVisibility,
  type ChartHeight,
  type ChartRootProps,
} from '../core';
import { resolveSeriesColors, type SeriesAppearance, type SeriesIntent } from '../palette';
import { bandScale, domainOf, linearScale, ticksFor } from '../scales';
import { formatNumber } from '../../../utils/formatters';
import chartStyles from '../core/Chart.module.css';
import styles from './ChartWaterfall.module.css';

export interface ChartWaterfallStep extends SeriesAppearance {
  label: string;
  total?: boolean;
  value: number;
}

/** Passo sob o ponteiro ou clicado: a posicao dele em `steps` e o próprio passo. */
export interface ChartWaterfallMark {
  index: number;
  step: ChartWaterfallStep;
}

export interface ChartWaterfallProps extends ChartRootProps {
  emptyMessage?: string;
  /** Formato dos valores no balão. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balão, exato. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  /** Altura do desenho, em px ou `'fill'`; o cabeçalho e a legenda ficam fora dela. */
  height?: ChartHeight;
  labelAngle?: AxisLabelAngle;
  /** Passo minimo entre as marcas do eixo de valor, na unidade do dado: 1 impede marcas fracionarias em contagens. */
  minTickStep?: number;
  /** Passo sob o ponteiro ou em foco pelo teclado, ou `null` ao sair dele. */
  onHover?: (mark: ChartWaterfallMark | null) => void;
  /** @deprecated Use `onHover`, que traz o passo e o indice. Aceito até a 0.7.0. */
  onHoverStep?: (index: number | null) => void;
  /** Clique no passo. Com ele, as barras viram botões percorridos pelas setas. */
  onMarkClick?: (mark: ChartWaterfallMark) => void;
  /** @deprecated Use `onMarkClick`. Aceito até a 0.7.0. */
  onStepClick?: (step: ChartWaterfallStep, index: number) => void;
  /** Variação acima de cada passo. Em `onHover`, só a do passo sob o ponteiro. */
  showDataLabels?: MarkVisibility;
  /** Botão "Ver como tabela". Ligado por padrão. */
  showTableToggle?: boolean;
  /** Balão com a variação do passo sob o ponteiro e o acumulado até ele. Desligue para montar o próprio `ChartTooltip`. */
  showTooltip?: boolean;
  steps: readonly ChartWaterfallStep[];
  title: string;
  xAxis?: AxisVisibility;
  /** Título do eixo das categorias, embaixo do desenho. */
  xAxisTitle?: string;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
  /** Título do eixo de valor da direita. */
  yAxisRightTitle?: string;
  /** Título do eixo de valor, a esquerda do desenho. */
  yAxisTitle?: string;
}

interface Trecho {
  fim: number;
  inicio: number;
}

/**
 * Cada passo ocupa a faixa entre o acumulado anterior e o novo acumulado; o total parte do zero, porque
 * fecha a conta. Passo inválido e ausente: não se desenha nem move o acumulado.
 */
function trechosDe(steps: readonly ChartWaterfallStep[]): (Trecho | null)[] {
  let acumulado = 0;

  return steps.map((passo) => {
    if (!Number.isFinite(passo.value)) {
      return null;
    }

    const inicio = passo.total ? 0 : acumulado;
    const fim = inicio + passo.value;
    acumulado = fim;

    return { inicio, fim };
  });
}

/** Passo sem intenção declarada recebe a do seu sinal. Total e fechamento, não aporte. */
function intencaoDe(step: ChartWaterfallStep): SeriesIntent {
  if (step.intent) {
    return step.intent;
  }

  if (step.total) {
    return 'neutral';
  }

  return step.value < 0 ? 'negative' : 'positive';
}

/**
 * O sinal e do gráfico, não do formatador: ele formata a magnitude. Delegar o
 * sinal perderia a variação com qualquer formatador que exiba apenas o valor.
 */
function comSinal(value: number, formatValue: (value: number) => string) {
  if (value === 0) {
    return formatValue(0);
  }

  return `${value < 0 ? '-' : '+'}${formatValue(Math.abs(value))}`;
}

export function ChartWaterfall({
  emptyMessage = 'Sem dados no período',
  formatTooltipValue,
  formatValue = formatNumber,
  height = 280,
  labelAngle = 'auto',
  minTickStep,
  onHover,
  onHoverStep,
  onMarkClick,
  onStepClick,
  showDataLabels = 'visible',
  showTableToggle = true,
  showTooltip = true,
  steps,
  title,
  xAxis = 'visible',
  xAxisTitle,
  yAxis = 'visible',
  yAxisRight = 'hidden',
  yAxisRightTitle,
  yAxisTitle,
  ...root
}: ChartWaterfallProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const hoverDoPasso =
    onHover || onHoverStep
      ? (index: number | null) => {
          onHover?.(index === null ? null : { index, step: steps[index] });
          onHoverStep?.(index);
        }
      : undefined;
  const { hover: focarPasso, hovered: passoEmFoco } = useHoveredBand(hoverDoPasso);

  const trechos = useMemo(() => trechosDe(steps), [steps]);
  const marcas = useMarkNavigation({
    onActivate:
      onMarkClick || onStepClick
        ? ({ column }) => {
            onMarkClick?.({ index: column, step: steps[column] });
            onStepClick?.(steps[column], column);
          }
        : undefined,
    onFocusMark: (posicao) => focarPasso(posicao?.column ?? null),
    present: trechos.flatMap((trecho, column) => (trecho ? [{ column, row: 0 }] : [])),
  });

  const cores = useMemo(
    () => resolveSeriesColors(steps.map((passo) => ({ color: passo.color, intent: intencaoDe(passo) }))),
    [steps],
  );

  const dominio = useMemo(
    () => domainOf(trechos.flatMap((trecho) => (trecho ? [trecho.inicio, trecho.fim] : []))),
    [trechos],
  );

  const rotulosDeValor = valueLabelsFor(dominio, alturaDoDesenho, formatValue, minTickStep);

  const { axisReveal, margins, plot, removed, rotation } = useCartesianLayout({
    decomposition: { fillHeight, legendPosition: 'none', valueAxes: ['yRight', 'y'] },
    axisTitles: { x: xAxisTitle, y: yAxisTitle, yRight: yAxisRightTitle },
    bottomLabels: steps.map((passo) => passo.label),
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: rotulosDeValor,
    rightLabels: rotulosDeValor,
    topRoom: showDataLabels === 'hidden' ? 0 : valueLabelRoom(font),
    width,
    xAxis,
    yAxis,
    yAxisRight,
  });

  const rotulosDeDado = removed.has('detail') ? 'hidden' : showDataLabels;

  // A faixa e indexada pela posicao, não pelo rótulo: numa sequência de passos o
  // mesmo rótulo pode repetir, e a escala categorica funde dominios iguais.
  const escalaPassos = useMemo(
    () => bandScale({ domain: steps.map((_, indice) => String(indice)), range: [0, plot.width] }),
    [plot.width, steps],
  );

  const faixaDe = (indice: number) => escalaPassos(String(indice)) ?? 0;

  // A escala alvo fixa as marcas; a animada posiciona o desenho. Sem separar as
  // duas, as marcas exibiriam valores quebrados durante a transição.
  const escalaAlvo = useMemo(
    () => linearScale({ domain: dominio, range: [plot.height, 0] }),
    [dominio, plot.height],
  );

  const [minimo, maximo] = useTweenedNumbers(escalaAlvo.domain());

  const escalaValores = useMemo(
    () => linearScale({ domain: { min: minimo, max: maximo }, nice: false, range: [plot.height, 0] }),
    [maximo, minimo, plot.height],
  );

  const marcasDeValor = ticksFor(escalaAlvo, plot.height, undefined, minTickStep);

  const marcasPassos: AxisTick[] = steps.map((passo, indice) => ({
    label: passo.label,
    position: faixaDe(indice) + escalaPassos.bandwidth() / 2,
  }));

  const marcasValor: AxisTick[] = marcasDeValor.map((valor) => ({
    label: formatValue(valor),
    position: escalaValores(valor),
  }));

  function rotuloDe(passo: ChartWaterfallStep) {
    return passo.total ? formatValue(passo.value) : comSinal(passo.value, formatValue);
  }

  /** O passo diz quanto mudou; o acumulado, onde a conta ficou. O total já e o próprio acumulado. */
  function linhasDoBalao(indice: number | null) {
    if (indice === null || !trechos[indice]) {
      return [];
    }

    const passo = steps[indice];

    if (passo.total) {
      return [{ color: cores[indice], label: passo.label, values: [passo.value] }];
    }

    return [
      { color: cores[indice], format: (valor: number) => comSinal(valor, formatTooltipValue ?? formatValue), label: 'Variação', values: [passo.value] },
      { label: 'Acumulado', values: [trechos[indice].fim] },
    ];
  }

  return (
    <CartesianFrame
      axisReveal={axisReveal}
      canvasRole={marcas.interactive ? 'group' : 'img'}
      containerRef={ref}
      empty={steps.length === 0}
      emptyMessage={emptyMessage}
      grid={[
        {
          baseline: escalaValores(0),
          lines: marcasDeValor.map((valor) => escalaValores(valor)),
          orientation: 'horizontal',
        },
      ]}
      fillHeight={fillHeight}
      font={font}
      height={alturaDoDesenho}
      legendPosition="none"
      margins={margins}
      plot={plot}
      removed={removed}
      root={root}
      showTableToggle={showTableToggle}
      table={
        <ChartTable
          columns={['Variação', 'Acumulado']}
          rows={steps.map((passo, indice) => ({
            cells: trechos[indice] ? [passo.total ? '' : comSinal(passo.value, formatValue), formatValue(trechos[indice].fim)] : ['', ''],
            header: passo.label,
            key: `${indice}:${passo.label}`,
          }))}
          title={title}
        />
      }
      title={title}
      tooltip={
        showTooltip
          ? {
              columns: [{ format: formatTooltipValue ?? formatValue }],
              computed: 'none',
              rows: linhasDoBalao(passoEmFoco),
              title: passoEmFoco === null ? undefined : steps[passoEmFoco]?.label,
            }
          : undefined
      }
      tooltipAnchor={marcas.tooltipAnchor}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasPassos, title: xAxisTitle, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasValor, title: yAxisTitle, visibility: yAxis }}
      yAxisRight={{ hideLine: true, ticks: marcasValor, title: yAxisRightTitle, visibility: yAxisRight }}
    >
      {passoEmFoco !== null && (
        <BandCursor offset={faixaDe(passoEmFoco)} plot={plot} size={escalaPassos.bandwidth()} />
      )}

      <g aria-hidden="true">
        {trechos.slice(0, -1).map((trecho, indice) => {
          if (!trecho || !trechos[indice + 1]) {
            return null;
          }

          const nivel = escalaValores(trecho.fim);

          return (
            <line
              className={styles.connector}
              key={indice}
              x1={faixaDe(indice) + escalaPassos.bandwidth()}
              x2={faixaDe(indice + 1)}
              y1={nivel}
              y2={nivel}
            />
          );
        })}
      </g>

      <g {...marcas.groupProps}>
        {steps.map((passo, indice) => {
          const trecho = trechos[indice];

          if (!trecho) {
            return null;
          }

          const topo = Math.min(escalaValores(trecho.inicio), escalaValores(trecho.fim));
          const altura = Math.abs(escalaValores(trecho.fim) - escalaValores(trecho.inicio));

          return (
            <path
              aria-label={`${passo.label}: ${rotuloDe(passo)}`}
              {...marcas.markProps({ column: indice, row: 0 }, styles.bar)}
              d={roundedBarPath(faixaDe(indice), topo, escalaPassos.bandwidth(), altura, [
                raioDoCanto,
                raioDoCanto,
                raioDoCanto,
                raioDoCanto,
              ])}
              fill={cores[indice]}
              key={indice}
              onMouseEnter={() => focarPasso(indice)}
              onMouseLeave={() => focarPasso(null)}
            />
          );
        })}
      </g>

      {rotulosDeDado !== 'hidden' &&
        steps.map((passo, indice) => {
          const trecho = trechos[indice];

          if (!trecho) {
            return null;
          }

          const topo = Math.min(escalaValores(trecho.inicio), escalaValores(trecho.fim));

          return (
            <text
              className={`${chartStyles.valueLabel} ${markShown(rotulosDeDado, indice === passoEmFoco) ? '' : chartStyles.valueLabelHidden}`}
              key={indice}
              textAnchor="middle"
              x={faixaDe(indice) + escalaPassos.bandwidth() / 2}
              y={topo - 6}
            >
              {rotuloDe(passo)}
            </text>
          );
        })}
    </CartesianFrame>
  );
}
