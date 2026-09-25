import { useCallback, useState } from 'react';

export interface UseSeriesToggleOptions {
  defaultHiddenSeries?: readonly string[];
  hiddenSeries?: readonly string[];
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
}

export interface SeriesToggle {
  isHidden: (label: string) => boolean;
  toggle: (label: string) => void;
}

/**
 * Quais series estao ocultas. Controlado quando o produto informa
 * `hiddenSeries`, nao controlado em caso contrario, conforme `COMPONENTS.md`
 * secao 6. Trabalha com rotulos porque e o rotulo que a legenda exibe e o que
 * o produto reconhece; indices mudariam de significado ao reordenar as series.
 */
export function useSeriesToggle({
  defaultHiddenSeries = [],
  hiddenSeries,
  onHiddenSeriesChange,
}: UseSeriesToggleOptions): SeriesToggle {
  const [internas, setInternas] = useState<readonly string[]>(defaultHiddenSeries);
  const ocultas = hiddenSeries ?? internas;

  const toggle = useCallback(
    (label: string) => {
      const proximas = ocultas.includes(label)
        ? ocultas.filter((oculta) => oculta !== label)
        : [...ocultas, label];

      if (hiddenSeries === undefined) {
        setInternas(proximas);
      }

      onHiddenSeriesChange?.(proximas);
    },
    [hiddenSeries, ocultas, onHiddenSeriesChange],
  );

  return {
    isHidden: useCallback((label: string) => ocultas.includes(label), [ocultas]),
    toggle,
  };
}
