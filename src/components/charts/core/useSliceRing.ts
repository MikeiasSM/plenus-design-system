import { useMemo, useState } from 'react';
import { resolveSeriesColors, type ChartPalette } from '../palette';
import { sliceAngles, type ArcAngles } from './arcs';
import { groupSmallSlices, type ChartSlice } from './slices';
import { useMarkNavigation } from './useMarkNavigation';
import { useSeriesToggle } from './useSeriesToggle';
import { useTweenedNumbers } from './useTweenedNumbers';

export interface UseSliceRingOptions {
  accent?: string;
  palette?: ChartPalette;
  defaultHiddenSlices?: readonly string[];
  hiddenSlices?: readonly string[];
  onHiddenSlicesChange?: (hidden: readonly string[]) => void;
  /** Torna as fatias botoes. Recebe a fatia ja agrupada, como `onHoverSlice`. */
  onSliceClick?: (slice: ChartSlice) => void;
  /** Fatia sob o ponteiro, ja agrupada, ou `null` ao sair dela. */
  onHoverSlice?: (slice: ChartSlice | null) => void;
  otherLabel: string;
  slices: readonly ChartSlice[];
  smallSliceThreshold: number;
}

export interface SliceRing {
  angles: readonly ArcAngles[];
  colors: readonly string[];
  focus: (index: number | null) => void;
  focused: number | null;
  isHidden: (label: string) => boolean;
  marks: ReturnType<typeof useMarkNavigation>;
  ratioOf: (index: number) => number;
  slices: readonly ChartSlice[];
  toggle: (label: string) => void;
  total: number;
  values: readonly number[];
}

/**
 * O anel repartido: fatias pequenas ja reunidas, cores resolvidas, valores das
 * fatias ligadas e os angulos em movimento. E o que `ChartPie` e `ChartDonut`
 * compartilham — o anel, nao o componente.
 */
export function useSliceRing({
  accent,
  palette,
  defaultHiddenSlices,
  hiddenSlices,
  onHiddenSlicesChange,
  onHoverSlice,
  onSliceClick,
  otherLabel,
  slices,
  smallSliceThreshold,
}: UseSliceRingOptions): SliceRing {
  const { isHidden, toggle } = useSeriesToggle({
    defaultHiddenSeries: defaultHiddenSlices,
    hiddenSeries: hiddenSlices,
    onHiddenSeriesChange: onHiddenSlicesChange,
  });
  const [focused, setFocused] = useState<number | null>(null);

  const reunidas = useMemo(
    () => groupSmallSlices(slices, { label: otherLabel, threshold: smallSliceThreshold }),
    [otherLabel, slices, smallSliceThreshold],
  );

  // A cor sai da lista inteira, e nao das visiveis: desligar uma fatia nao pode
  // repintar as demais.
  const colors = useMemo(() => resolveSeriesColors(reunidas, { accent, palette }), [accent, palette, reunidas]);

  const values = reunidas.map((fatia) =>
    isHidden(fatia.label) || !Number.isFinite(fatia.value) ? 0 : Math.max(fatia.value, 0),
  );
  const total = values.reduce((soma, valor) => soma + valor, 0);

  // Os angulos caminham ate o alvo, entao desligar uma fatia reparte o anel em
  // movimento. Partindo de zero, o anel tambem varre ao aparecer.
  const alvo = useMemo(
    () => sliceAngles(values).flatMap((angulo) => [angulo.startAngle, angulo.endAngle]),
    // A chave resume os valores: o alvo muda com o numero, nao com a identidade
    // do array, que e outra a cada render.
    [values.join()],
  );
  const animados = useTweenedNumbers(alvo, { from: alvo.map(() => 0) });

  const angles = reunidas.map((_, indice) => ({
    startAngle: animados[indice * 2] ?? 0,
    endAngle: animados[indice * 2 + 1] ?? 0,
  }));

  // A fatia entregue e a **agrupada**: as pequenas ja viraram uma so, entao o
  // indice do anel nao corresponde ao que o consumidor informou.
  const focus = (indice: number | null) => {
    setFocused(indice);
    onHoverSlice?.(indice === null ? null : reunidas[indice] ?? null);
  };

  const marks = useMarkNavigation({
    onActivate: onSliceClick && (({ column }) => onSliceClick(reunidas[column])),
    onFocusMark: (posicao) => focus(posicao?.column ?? null),
    present: values.flatMap((valor, column) => (valor > 0 ? [{ column, row: 0 }] : [])),
  });

  return {
    angles,
    colors,
    focus,
    focused,
    isHidden,
    marks,
    ratioOf: (indice) => (total > 0 ? (values[indice] ?? 0) / total : 0),
    slices: reunidas,
    toggle,
    total,
    values,
  };
}
