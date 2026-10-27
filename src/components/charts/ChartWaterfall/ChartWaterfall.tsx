import { useMemo } from 'react';
import {
  BandCursor,
  markShown,
  CartesianFrame,
  useCartesianLayout,
  chartHeight,
  roundedBarPath,
  useChartMetrics,
  useHoveredBand,
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
import { resolveSeriesColors, type SeriesIntent } from '../palette';
import { bandScale, domainOf, linearScale, ticksFor } from '../scales';
import { formatarNumero } from '../../../utils/formatters';
import styles from './ChartWaterfall.module.css';

export interface ChartWaterfallStep {
  color?: string;
  intent?: SeriesIntent;
  label: string;
  total?: boolean;
  value: number;
}

export interface ChartWaterfallProps extends ChartRootProps {
  emptyMessage?: string;
  /** Formato dos valores no balao. Sem ele, vale o `formatValue`: o eixo pode sair compacto e o balao, exato. */
  formatTooltipValue?: (value: number) => string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  labelAngle?: AxisLabelAngle;
  /** Indice do passo sob o ponteiro, ou `null` ao sair dele. */
  onHoverStep?: (index: number | null) => void;
  /** Variacao acima de cada passo. Em `onHover`, so a do passo sob o ponteiro. */
  showDataLabels?: MarkVisibility;
  /** Balao com a variacao do passo sob o ponteiro e o acumulado ate ele. Desligue para montar o proprio `ChartTooltip`. */
  showTooltip?: boolean;
  steps: readonly ChartWaterfallStep[];
  title: string;
  xAxis?: AxisVisibility;
  yAxis?: AxisVisibility;
  yAxisRight?: AxisVisibility;
}

interface Trecho {
  fim: number;
  inicio: number;
}

/**
 * Cada passo ocupa a faixa entre o acumulado anterior e o novo acumulado; o total parte do zero, porque
 * fecha a conta. Passo invalido e ausente: nao se desenha nem move o acumulado.
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

/** Passo sem intencao declarada recebe a do seu sinal. Total e fechamento, nao aporte. */
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
 * O sinal e do grafico, nao do formatador: ele formata a magnitude. Delegar o
 * sinal perderia a variacao com qualquer formatador que exiba apenas o valor.
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
  formatValue = formatarNumero,
  height = 280,
  labelAngle = 'auto',
  onHoverStep,
  showDataLabels = 'visible',
  showTooltip = true,
  steps,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
  ...root
}: ChartWaterfallProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const { hover: focarPasso, hovered: passoEmFoco } = useHoveredBand(onHoverStep);

  const trechos = useMemo(() => trechosDe(steps), [steps]);

  const cores = useMemo(
    () => resolveSeriesColors(steps.map((passo) => ({ color: passo.color, intent: intencaoDe(passo) }))),
    [steps],
  );

  const dominio = useMemo(
    () => domainOf(trechos.flatMap((trecho) => (trecho ? [trecho.inicio, trecho.fim] : []))),
    [trechos],
  );

  const rotulosDeValor = valueLabelsFor(dominio, alturaDoDesenho, formatValue);

  const { axisReveal, margins, plot, rotation } = useCartesianLayout({
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

  // A faixa e indexada pela posicao, nao pelo rotulo: numa sequencia de passos o
  // mesmo rotulo pode repetir, e a escala categorica funde dominios iguais.
  const escalaPassos = useMemo(
    () => bandScale({ domain: steps.map((_, indice) => String(indice)), range: [0, plot.width] }),
    [plot.width, steps],
  );

  const faixaDe = (indice: number) => escalaPassos(String(indice)) ?? 0;

  // A escala alvo fixa as marcas; a animada posiciona o desenho. Sem separar as
  // duas, as marcas exibiriam valores quebrados durante a transicao.
  const escalaAlvo = useMemo(
    () => linearScale({ domain: dominio, range: [plot.height, 0] }),
    [dominio, plot.height],
  );

  const [minimo, maximo] = useTweenedNumbers(escalaAlvo.domain());

  const escalaValores = useMemo(
    () => linearScale({ domain: { min: minimo, max: maximo }, nice: false, range: [plot.height, 0] }),
    [maximo, minimo, plot.height],
  );

  const marcasDeValor = ticksFor(escalaAlvo, plot.height);

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

  /** O passo diz quanto mudou; o acumulado, onde a conta ficou. O total ja e o proprio acumulado. */
  function linhasDoBalao(indice: number | null) {
    if (indice === null || !trechos[indice]) {
      return [];
    }

    const passo = steps[indice];

    if (passo.total) {
      return [{ color: cores[indice], label: 'Total', values: [passo.value] }];
    }

    return [
      { color: cores[indice], format: (valor: number) => comSinal(valor, formatTooltipValue ?? formatValue), label: 'Variação', values: [passo.value] },
      { label: 'Acumulado', values: [trechos[indice].fim] },
    ];
  }

  return (
    <CartesianFrame
      axisReveal={axisReveal}
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
      height={alturaDoDesenho}
      legendPosition="none"
      margins={margins}
      plot={plot}
      root={root}
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
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasPassos, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasValor, visibility: yAxis }}
      yAxisRight={{ hideLine: true, ticks: marcasValor, visibility: yAxisRight }}
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
            className={styles.bar}
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

      {showDataLabels !== 'hidden' &&
        steps.map((passo, indice) => {
          const trecho = trechos[indice];

          if (!trecho) {
            return null;
          }

          const topo = Math.min(escalaValores(trecho.inicio), escalaValores(trecho.fim));

          return (
            <text
              className={`${styles.valueLabel} ${markShown(showDataLabels, indice === passoEmFoco) ? '' : styles.valueLabelHidden}`}
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
