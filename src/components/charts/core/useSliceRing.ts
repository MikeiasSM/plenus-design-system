import { useMemo, useState } from 'react';
import { resolveSeriesColors } from '../palette';
import { sliceAngles, type ArcAngles } from './arcs';
import { groupSmallSlices, type ChartSlice } from './slices';
import { useSeriesToggle } from './useSeriesToggle';
import { useTweenedNumbers } from './useTweenedNumbers';

export interface UseSliceRingOptions {
  accent?: string;
  defaultHiddenSlices?: readonly string[];
  hiddenSlices?: readonly string[];
  onHiddenSlicesChange?: (hidden: readonly string[]) => void;
  otherLabel: string;
  slices: readonly ChartSlice[];
  smallSliceThreshold: number;
}

export interface SliceRing {
  angles: readonly ArcAngles[];
  colors: readonly string[];
  focused: number | null;
  isHidden: (label: string) => boolean;
  ratioOf: (index: number) => number;
  setFocused: (index: number | null) => void;
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
  defaultHiddenSlices,
  hiddenSlices,
  onHiddenSlicesChange,
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
  const colors = useMemo(() => resolveSeriesColors(reunidas, { accent }), [accent, reunidas]);

  const values = reunidas.map((fatia) => (isHidden(fatia.label) ? 0 : Math.max(fatia.value, 0)));
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

  return {
    angles,
    colors,
    focused,
    isHidden,
    ratioOf: (indice) => (total > 0 ? (values[indice] ?? 0) / total : 0),
    setFocused,
    slices: reunidas,
    toggle,
    total,
    values,
  };
}
