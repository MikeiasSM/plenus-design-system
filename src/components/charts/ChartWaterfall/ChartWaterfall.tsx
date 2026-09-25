import { useMemo } from 'react';
import {
  CartesianFrame,
  plotBox,
  useChartSize,
  type AxisLabelRotation,
  type AxisTick,
  type ChartMargins,
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
  height?: number;
  labelRotation?: AxisLabelRotation;
  showValues?: boolean;
  steps: readonly ChartWaterfallStep[];
  title: string;
}

interface Trecho {
  fim: number;
  inicio: number;
}

const MARGENS: ChartMargins = { top: 20, right: 16, bottom: 34, left: 52 };

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
  labelRotation = 0,
  showValues = true,
  steps,
  title,
}: ChartWaterfallProps) {
  const { ref, width } = useChartSize({ height });
  const plot = plotBox(width, height, MARGENS);

  const trechos = useMemo(() => trechosDe(steps), [steps]);

  const cores = useMemo(
    () => resolveSeriesColors(steps.map((passo) => ({ color: passo.color, intent: intencaoDe(passo) }))),
    [steps],
  );

  const dominio = useMemo(
    () => domainOf(trechos.flatMap((trecho) => [trecho.inicio, trecho.fim])),
    [trechos],
  );

  // A faixa e indexada pela posicao, nao pelo rotulo: numa sequencia de passos o
  // mesmo rotulo pode repetir, e a escala categorica funde dominios iguais.
  const escalaPassos = useMemo(
    () => bandScale({ domain: steps.map((_, indice) => String(indice)), range: [0, plot.width] }),
    [plot.width, steps],
  );

  const faixaDe = (indice: number) => escalaPassos(String(indice)) ?? 0;

  const escalaValores = useMemo(
    () => linearScale({ domain: dominio, range: [plot.height, 0] }),
    [dominio, plot.height],
  );

  const marcasDeValor = ticksFor(escalaValores, plot.height);

  const marcasPassos: AxisTick[] = steps.map((passo, indice) => ({
    label: passo.label,
    position: faixaDe(indice) + escalaPassos.bandwidth() / 2,
  }));

  const marcasValor: AxisTick[] = marcasDeValor.map((valor) => ({
    label: formatValue(valor),
    position: escalaValores(valor),
  }));

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
      height={height}
      margins={MARGENS}
      plot={plot}
      title={title}
      width={width}
      xAxis={{ labelRotation, ticks: marcasPassos }}
      yAxis={{ hideLine: true, ticks: marcasValor }}
    >
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
          <rect
            className={styles.bar}
            fill={cores[indice]}
            height={altura}
            key={indice}
            rx={2}
            width={escalaPassos.bandwidth()}
            x={faixaDe(indice)}
            y={topo}
          >
            <title>{`${passo.label}: ${passo.total ? formatValue(passo.value) : comSinal(passo.value, formatValue)}`}</title>
          </rect>
        );
      })}

      {showValues &&
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
              {passo.total ? formatValue(passo.value) : comSinal(passo.value, formatValue)}
            </text>
          );
        })}
    </CartesianFrame>
  );
}
