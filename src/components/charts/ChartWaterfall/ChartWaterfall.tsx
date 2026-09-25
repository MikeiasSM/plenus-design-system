import { useMemo, useState } from 'react';
import {
  CartesianFrame,
  cartesianLayout,
  chartHeight,
  roundedBarPath,
  useChartMetrics,
  useTweenedNumbers,
  valueLabelRoom,
  valueLabelsFor,
  type AxisLabelAngle,
  type AxisTick,
  type AxisVisibility,
  type ChartHeight,
} from '../core';
import { resolveSeriesColors, type SeriesIntent } from '../palette';
import { bandScale, domainOf, linearScale, ticksFor } from '../scales';
import styles from './ChartWaterfall.module.css';

export interface ChartWaterfallStep {
  color?: string;
  intent?: SeriesIntent;
  label: string;
  total?: boolean;
  value: number;
}

export interface ChartWaterfallProps {
  emptyMessage?: string;
  formatValue?: (value: number) => string;
  height?: ChartHeight;
  labelAngle?: AxisLabelAngle;
  showDataLabels?: boolean;
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
 * Cada passo ocupa a faixa entre o acumulado anterior e o novo acumulado. Um
 * passo marcado como total parte do zero: ele nao acrescenta, ele fecha a conta.
 */
function trechosDe(steps: readonly ChartWaterfallStep[]): Trecho[] {
  let acumulado = 0;

  return steps.map((passo) => {
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
  return `${value < 0 ? '-' : '+'}${formatValue(Math.abs(value))}`;
}

export function ChartWaterfall({
  emptyMessage = 'Sem dados no período',
  formatValue = (valor) => String(valor),
  height = 280,
  labelAngle = 'auto',
  showDataLabels = true,
  steps,
  title,
  xAxis = 'visible',
  yAxis = 'visible',
  yAxisRight = 'hidden',
}: ChartWaterfallProps) {
  const { font, height: alturaMedida, radius: raioDoCanto, ref, width } = useChartMetrics();
  const { fillHeight, value: alturaDoDesenho } = chartHeight(height, alturaMedida);
  const [passoEmFoco, setPassoEmFoco] = useState<number | null>(null);

  const trechos = useMemo(() => trechosDe(steps), [steps]);

  const cores = useMemo(
    () => resolveSeriesColors(steps.map((passo) => ({ color: passo.color, intent: intencaoDe(passo) }))),
    [steps],
  );

  const dominio = useMemo(
    () => domainOf(trechos.flatMap((trecho) => [trecho.inicio, trecho.fim])),
    [trechos],
  );

  const rotulosDeValor = valueLabelsFor(dominio, alturaDoDesenho, formatValue);

  const { margins, plot, rotation } = cartesianLayout({
    bottomLabels: steps.map((passo) => passo.label),
    font,
    height: alturaDoDesenho,
    labelAngle,
    leftLabels: rotulosDeValor,
    rightLabels: rotulosDeValor,
    topRoom: showDataLabels ? valueLabelRoom(font) : 0,
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

  return (
    <CartesianFrame
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
      title={title}
      width={width}
      xAxis={{ labelRotation: rotation, ticks: marcasPassos, visibility: xAxis }}
      yAxis={{ hideLine: true, ticks: marcasValor, visibility: yAxis }}
      yAxisRight={{ hideLine: true, ticks: marcasValor, visibility: yAxisRight }}
    >
      {passoEmFoco !== null && (
        <rect
          className={styles.cursor}
          height={plot.height}
          width={escalaPassos.bandwidth()}
          x={faixaDe(passoEmFoco)}
          y={0}
        />
      )}

      <g aria-hidden="true">
        {trechos.slice(0, -1).map((trecho, indice) => {
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
        const { fim, inicio } = trechos[indice];
        const topo = Math.min(escalaValores(inicio), escalaValores(fim));
        const altura = Math.abs(escalaValores(fim) - escalaValores(inicio));

        return (
          <path
            className={styles.bar}
            d={roundedBarPath(faixaDe(indice), topo, escalaPassos.bandwidth(), altura, [
              raioDoCanto,
              raioDoCanto,
              raioDoCanto,
              raioDoCanto,
            ])}
            fill={cores[indice]}
            key={indice}
            onMouseEnter={() => setPassoEmFoco(indice)}
            onMouseLeave={() => setPassoEmFoco(null)}
          >
            <title>{`${passo.label}: ${rotuloDe(passo)}`}</title>
          </path>
        );
      })}

      {showDataLabels &&
        steps.map((passo, indice) => {
          const { fim, inicio } = trechos[indice];
          const topo = Math.min(escalaValores(inicio), escalaValores(fim));

          return (
            <text
              className={styles.valueLabel}
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
