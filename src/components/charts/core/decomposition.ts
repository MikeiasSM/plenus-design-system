import { useLayoutEffect, useRef } from 'react';
import type { ChartLegendEntry, ChartLegendPosition } from './ChartLegend';
import { measureLabel, type LabelFont } from './measureText';
import type { ChartPlot } from './cartesianLayout';

/** Menor area de marcas em que o desenho ainda se le; abaixo dela, o grafico retira partes na ordem da familia. */
export const CHART_MIN_PLOT: ChartPlot = { height: 96, width: 120 };

/** Menor diametro da forma radial. */
export const CHART_MIN_RING = 96;

const SWATCH = 10;
const ITEM_GAP = 8;
const LEGEND_COLUMN_GAP = 16;
const LEGEND_BODY_GAP = 12;
const LEGEND_SIDE_SHARE = 0.45;
/** O botao "Ver como tabela" so cabe ao lado do titulo a partir desta largura; abaixo dela sai, e a leitura segue pelo `aria-label`. */
export const TABLE_TOGGLE_MIN_WIDTH = 200;

const COLOR_LEGEND_HEIGHT = 56;
const COLOR_LEGEND_WIDTH = 140;

/**
 * Retira as partes, na ordem, ate a area medida caber no minimo. A parte so sai quando a area nao cabe e a saida
 * ganha espaco na dimensao que falta: tirar a legenda de baixo nao devolve largura, e tirar o rotulo do eixo de valor
 * nao devolve altura. `lastResort` sai por ultimo se, esgotadas as demais, a area ainda nao cabe — e a parte que
 * acompanha o traco sem ocupar espaco, como a grade.
 */
export function removedParts<Part extends string>(
  order: readonly Part[],
  measure: (removed: ReadonlySet<Part>) => ChartPlot,
  minimum: ChartPlot,
  lastResort?: Part,
): ReadonlySet<Part> {
  const removed = new Set<Part>();
  const fits = (room: ChartPlot) => room.width >= minimum.width && room.height >= minimum.height;

  for (const part of order) {
    const room = measure(removed);

    if (fits(room)) {
      return removed;
    }

    const next = measure(new Set([...removed, part]));

    if ((room.width < minimum.width && next.width > room.width) || (room.height < minimum.height && next.height > room.height)) {
      removed.add(part);
    }
  }

  if (lastResort && !fits(measure(removed))) {
    removed.add(lastResort);
  }

  return removed;
}

/** O que a legenda de escala de cor tira da area: a altura do degrade com os valores, ou a coluna ao lado. */
export function colorLegendRoom(position: ChartLegendPosition, fillHeight: boolean): ChartPlot {
  if (position === 'none') {
    return { height: 0, width: 0 };
  }

  const lateral = position === 'left' || position === 'right';

  return { height: !lateral && fillHeight ? COLOR_LEGEND_HEIGHT : 0, width: lateral ? COLOR_LEGEND_WIDTH : 0 };
}

/** O que a legenda tira da area de desenho: a largura, ao lado, ou a altura, em cima e embaixo. */
export function legendRoom(
  entries: readonly ChartLegendEntry[] | undefined,
  position: ChartLegendPosition,
  font: LabelFont,
  availableWidth: number,
  fillHeight: boolean,
  minEntries = 1,
): ChartPlot {
  if (!entries || entries.length < minEntries || position === 'none') {
    return { height: 0, width: 0 };
  }

  const itemWidths = entries.map(
    (entry) =>
      SWATCH + ITEM_GAP + measureLabel(entry.label, font) + (entry.value === undefined ? 0 : LEGEND_COLUMN_GAP + measureLabel(entry.value, font)),
  );

  if (position === 'left' || position === 'right') {
    return { height: 0, width: Math.min(Math.max(...itemWidths), availableWidth * LEGEND_SIDE_SHARE) + LEGEND_BODY_GAP };
  }

  if (!fillHeight) {
    return { height: 0, width: 0 };
  }

  let rows = 1;
  let used = 0;

  for (const width of itemWidths) {
    if (used > 0 && used + LEGEND_COLUMN_GAP + width > availableWidth) {
      rows += 1;
      used = width;
    } else {
      used += (used > 0 ? LEGEND_COLUMN_GAP : 0) + width;
    }
  }

  return { height: rows * font.lineHeight + (rows - 1) * ITEM_GAP + LEGEND_BODY_GAP, width: 0 };
}

/** A area que sobra ao desenho: a medida do que esta na tela, com a legenda de volta e, se ela fica, descontada de novo. */
export function plotRoom(measured: ChartPlot, legend: ChartPlot, legendWasShown: boolean, legendKept: boolean): ChartPlot {
  const own = legendWasShown ? 1 : 0;
  const kept = legendKept ? 1 : 0;

  return {
    height: measured.height + legend.height * (own - kept),
    width: measured.width + legend.width * (own - kept),
  };
}

/**
 * As partes retiradas pela medida, na ordem da familia. `measure` recebe o que ja saiu e se a legenda estava na tela na
 * ultima pintura, porque a medida do desenho ja descontou a que estava la, e devolve a area que sobra as marcas.
 */
export function useFit<Part extends string>(
  order: readonly Part[],
  measure: (removed: ReadonlySet<Part>, legendWasShown: boolean) => ChartPlot,
  minimum: ChartPlot,
  lastResort?: Part,
) {
  const legendShown = useRef(true);
  const removed = removedParts(order, (parts) => measure(parts, legendShown.current), minimum, lastResort);

  useLayoutEffect(() => {
    legendShown.current = !removed.has('legend' as Part);
  });

  return removed;
}
