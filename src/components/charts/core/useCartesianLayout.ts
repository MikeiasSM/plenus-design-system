import { useEffect, useRef, useState } from 'react';
import {
  cartesianLayout,
  type AxisVisibility,
  type CartesianLayoutOptions,
  type ChartMargins,
  type ChartPlot,
} from './cartesianLayout';
import type { ChartLegendEntry, ChartLegendPosition } from './ChartLegend';
import { CHART_MIN_PLOT, legendRoom, plotRoom, useFit } from './decomposition';
import { useTweenedNumbers } from './useTweenedNumbers';

/** Ponteiro parado sobre o grafico ate os eixos `onHover` entrarem: so atravessar o grafico nao o faz encolher. */
const ATRASO_DA_REVELACAO = 600;
const DURACAO_DA_REVELACAO = 240;

/** O grafico com legenda mostra a partir de duas entradas. */
const MIN_LEGEND_ENTRIES = 2;

export interface AxisReveal {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  revealed: boolean;
}

export type CartesianAxisSide = 'x' | 'y' | 'yRight';

/**
 * Partes que o grafico cartesiano retira quando a area nao cabe, na ordem: a legenda, os titulos dos eixos, os
 * rotulos de cada eixo de valor, os eixos e, por ultimo, tudo o que acompanha o traco — grade, pontos e rotulos de dado.
 */
export type CartesianPart = 'legend' | 'titles' | `labels:${CartesianAxisSide}` | 'axes' | 'detail';

export interface CartesianDecomposition {
  fillHeight: boolean;
  legend?: readonly ChartLegendEntry[];
  /** O que a legenda tira da area, quando ela nao e a lista de series e o grafico ja sabe a medida dela. */
  legendRoom?: ChartPlot;
  /** Menor area de marcas que cabe, quando o dado pede menos que o padrao, como a matriz de poucas linhas. */
  minPlot?: ChartPlot;
  legendPosition: ChartLegendPosition;
  /** Os eixos de valor, na ordem em que perdem os rotulos. No `ChartCombo`, o direito primeiro. */
  valueAxes: readonly CartesianAxisSide[];
}

export type CartesianLayoutInput = Omit<CartesianLayoutOptions, 'revealed'> & { decomposition: CartesianDecomposition };

function interpolar(de: ChartMargins, ate: ChartMargins, fator: number): ChartMargins {
  return {
    bottom: de.bottom + (ate.bottom - de.bottom) * fator,
    left: de.left + (ate.left - de.left) * fator,
    right: de.right + (ate.right - de.right) * fator,
    top: de.top + (ate.top - de.top) * fator,
  };
}

function withoutParts(options: Omit<CartesianLayoutOptions, 'revealed'>, removed: ReadonlySet<CartesianPart>) {
  const visibility = (side: CartesianAxisSide, current: AxisVisibility): AxisVisibility =>
    removed.has('axes') || removed.has(`labels:${side}`) ? 'hidden' : current;

  return {
    ...options,
    axisTitles: removed.has('titles') ? {} : options.axisTitles,
    rightRoom: removed.has('detail') ? 0 : options.rightRoom,
    topRoom: removed.has('detail') ? 0 : options.topRoom,
    xAxis: visibility('x', options.xAxis),
    yAxis: visibility('y', options.yAxis),
    yAxisRight: visibility('yRight', options.yAxisRight),
  };
}

/**
 * Layout cartesiano com os eixos `onHover` e a decomposicao por encaixe. Sem eixos revelados, o desenho ocupa o
 * espaco todo; revelados, ele encolhe ate as calhas, numa transicao so. Dado ou tamanho que mudam reposicionam na
 * hora: o que anima e a revelacao. Quando a area dos tracos fica menor que o minimo, as partes saem na ordem de
 * `CartesianPart`, e o grafico recebe em `removed` o que ja saiu.
 */
export function useCartesianLayout({ decomposition, ...options }: CartesianLayoutInput) {
  const dinamico = [options.xAxis, options.yAxis, options.yAxisRight].includes('onHover');
  const [revelado, setRevelado] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);
  const revealed = dinamico && revelado;
  const [progresso = 0] = useTweenedNumbers([revealed ? 1 : 0], { duration: DURACAO_DA_REVELACAO });

  useEffect(() => () => clearTimeout(relogio.current), []);

  const measured = options.width > 0 && options.height > 0;
  const legend = decomposition.legendRoom ?? legendRoom(
    decomposition.legend,
    decomposition.legendPosition,
    options.font,
    options.width,
    decomposition.fillHeight,
    MIN_LEGEND_ENTRIES,
  );
  const order: readonly CartesianPart[] = measured
    ? ['legend', 'titles', ...decomposition.valueAxes.map((side) => `labels:${side}` as const), 'axes']
    : [];
  const removed = useFit(
    order,
    (parts, legendWasShown) => {
      const room = plotRoom(options, legend, legendWasShown, !parts.has('legend'));

      return cartesianLayout({ ...withoutParts(options, parts), ...room, revealed: false }).plot;
    },
    decomposition.minPlot ?? CHART_MIN_PLOT,
    measured ? 'detail' : undefined,
  );

  const effective = withoutParts(options, removed);
  const recolhido = cartesianLayout({ ...effective, revealed: false });
  const aberto = dinamico ? cartesianLayout({ ...effective, revealed: true }) : recolhido;
  const margins = interpolar(recolhido.margins, aberto.margins, progresso);

  const axisReveal: AxisReveal = {
    onPointerEnter: () => {
      if (dinamico) {
        clearTimeout(relogio.current);
        relogio.current = setTimeout(() => setRevelado(true), ATRASO_DA_REVELACAO);
      }
    },
    onPointerLeave: () => {
      clearTimeout(relogio.current);
      setRevelado(false);
    },
    revealed,
  };

  return {
    axisReveal,
    margins,
    plot: {
      height: Math.max(options.height - margins.top - margins.bottom, 0),
      width: Math.max(options.width - margins.left - margins.right, 0),
    },
    removed,
    rotation: (revealed ? aberto : recolhido).rotation,
  };
}
