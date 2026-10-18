import { useCallback, useState } from 'react';

export interface UseSeriesToggleOptions {
  defaultHiddenSeries?: readonly string[];
  hiddenSeries?: readonly string[];
  /** Todos os rotulos; com eles, desligar a ultima serie mantem a escala de antes. */
  labels?: readonly string[];
  onHiddenSeriesChange?: (hidden: readonly string[]) => void;
}

export interface SeriesToggle {
  isHidden: (label: string) => boolean;
  /**
   * Se a serie fica fora da escala de valores. E o `isHidden` enquanto alguma esta ligada; com todas desligadas
   * pela legenda, vale o que estava ligado antes da ultima sair, e a escala nao se mexe enquanto ela some.
   */
  isOutOfScale: (label: string) => boolean;
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
  labels,
  onHiddenSeriesChange,
}: UseSeriesToggleOptions): SeriesToggle {
  const [internas, setInternas] = useState<readonly string[]>(defaultHiddenSeries);
  const [ocultasAntesDaUltima, setOcultasAntesDaUltima] = useState<readonly string[] | null>(null);
  const ocultas = hiddenSeries ?? internas;
  const todasOcultas = labels !== undefined && labels.length > 0 && labels.every((label) => ocultas.includes(label));
  const ocultasDaEscala = todasOcultas && ocultasAntesDaUltima ? ocultasAntesDaUltima : ocultas;

  const toggle = useCallback(
    (label: string) => {
      const proximas = ocultas.includes(label)
        ? ocultas.filter((oculta) => oculta !== label)
        : [...ocultas, label];

      if (hiddenSeries === undefined) {
        setInternas(proximas);
      }

      setOcultasAntesDaUltima(labels?.every((rotulo) => proximas.includes(rotulo)) ? ocultas : null);

      onHiddenSeriesChange?.(proximas);
    },
    [hiddenSeries, labels, ocultas, onHiddenSeriesChange],
  );

  return {
    isHidden: useCallback((label: string) => ocultas.includes(label), [ocultas]),
    isOutOfScale: useCallback((label: string) => ocultasDaEscala.includes(label), [ocultasDaEscala]),
    toggle,
  };
}

/**
 * Series que entram na escala de valores, ou todas quando nenhuma entra. Sem isso a escala desabava ao
 * desligar a ultima, e ela saia esticada para fora do grafico em vez de encolher no lugar.
 */
export function seriesInScale<T extends { label: string }>(series: readonly T[], isHidden: (label: string) => boolean) {
  const visiveis = series.filter((serie) => !isHidden(serie.label));

  return visiveis.length > 0 ? visiveis : series;
}
