import type { ChartLegendEntry, ChartLegendPosition } from './ChartLegend';
import { centerTextRadius } from './centerText';
import { CHART_MIN_RING, legendRoom, plotRoom, useFit } from './decomposition';
import type { LabelFont } from './measureText';
import { ringDiameter } from './spacing';

/** Partes da forma radial que saem quando o diametro nao chega ao minimo: a legenda, depois o texto do centro. */
export type RingPart = 'legend' | 'centerText';

export interface RingFitOptions {
  /** Valor escrito no centro, e que fatia do raio o furo ocupa. Sem texto, a forma so perde a legenda. */
  center?: { innerShare: number; value: string };
  font: LabelFont;
  fillHeight: boolean;
  height: number;
  legend: readonly ChartLegendEntry[];
  legendPosition: ChartLegendPosition;
  width: number;
}

/** O que sai de `ChartPie`, `ChartDonut` e `ChartRadial` abaixo do espaco que a forma pede: a legenda e o texto do centro. */
export function useRingFit({ center, fillHeight, font, height, legend, legendPosition, width }: RingFitOptions) {
  const measured = width > 0 && height > 0;
  const room = legendRoom(legend, legendPosition, font, width, fillHeight);
  const order: readonly RingPart[] = measured ? (center ? ['legend', 'centerText'] : ['legend']) : [];

  return useFit(
    order,
    (parts, legendWasShown) => {
      const area = plotRoom({ height, width }, room, legendWasShown, !parts.has('legend'));
      const diameter = ringDiameter(area.width, area.height);
      const textFits = !center || parts.has('centerText') || centerTextRadius(center.value, font) <= (diameter / 2) * center.innerShare;

      // O texto que nao cabe zera a altura: tirar o texto e o que devolve a area, sem mexer no diametro.
      return { height: textFits ? diameter : 0, width: diameter };
    },
    { height: CHART_MIN_RING, width: CHART_MIN_RING },
  );
}
