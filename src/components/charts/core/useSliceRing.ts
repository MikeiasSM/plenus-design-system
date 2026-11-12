import { useMemo, useRef, useState } from 'react';
import { resolveSeriesColors, type ChartPalette } from '../palette';
import { sliceAngles, type ArcAngles } from './arcs';
import { groupSmallSlices, type ChartSlice } from './slices';
import { useMarkNavigation, type ChartAnchorPoint, type ChartHoverDetails } from './useMarkNavigation';
import { useSeriesToggle } from './useSeriesToggle';
import { useTweenedNumbers } from './useTweenedNumbers';

export interface UseSliceRingOptions {
  accent?: string;
  palette?: ChartPalette;
  defaultHidden?: readonly string[];
  hidden?: readonly string[];
  onHiddenChange?: (hidden: readonly string[]) => void;
  /** Torna as fatias botões. Recebe a fatia já agrupada, como `onHover`. */
  onMarkClick?: (slice: ChartSlice) => void;
  /** Fatia sob o ponteiro, o foco ou a entrada da legenda, já agrupada, ou `null` ao sair. Da legenda vem o detalhe. */
  onHover?: (slice: ChartSlice | null, details?: ChartHoverDetails) => void;
  otherLabel?: string;
  slices: readonly ChartSlice[];
  smallSliceThreshold?: number;
}

export interface SliceRing {
  angles: readonly ArcAngles[];
  colors: readonly string[];
  focus: (index: number | null) => void;
  focused: number | null;
  /** Entrada da legenda sob o ponteiro ou o foco: faz o que o ponteiro na fatia faz. */
  highlight: (label: string | null, anchor?: ChartAnchorPoint) => void;
  isHidden: (label: string) => boolean;
  marks: ReturnType<typeof useMarkNavigation>;
  ratioOf: (index: number) => number;
  /** Ponteiro saindo da fatia: solta o realce se ainda for dela. */
  release: (index: number) => void;
  slices: readonly ChartSlice[];
  toggle: (label: string) => void;
  total: number;
  values: readonly number[];
}

/**
 * O anel repartido: fatias pequenas já reunidas, cores resolvidas, valores das
 * fatias ligadas e os angulos em movimento. E o que `ChartPie` e `ChartDonut`
 * compartilham — o anel, não o componente.
 */
export function useSliceRing({
  accent,
  palette,
  defaultHidden,
  hidden,
  onHiddenChange,
  onHover,
  onMarkClick,
  otherLabel,
  slices,
  smallSliceThreshold,
}: UseSliceRingOptions): SliceRing {
  const { isHidden, toggle } = useSeriesToggle({
    defaultHidden,
    hidden,
    onHiddenChange,
  });
  const [focused, setFocused] = useState<number | null>(null);

  const reunidas = useMemo(
    () => groupSmallSlices(slices, { label: otherLabel, threshold: smallSliceThreshold }),
    [otherLabel, slices, smallSliceThreshold],
  );

  // A cor sai da lista inteira, e não das visíveis: desligar uma fatia não pode
  // repintar as demais.
  const colors = useMemo(() => resolveSeriesColors(reunidas, { accent, palette }), [accent, palette, reunidas]);

  const values = reunidas.map((fatia) =>
    isHidden(fatia.label) || !Number.isFinite(fatia.value) ? 0 : Math.max(fatia.value, 0),
  );
  const total = values.reduce((soma, valor) => soma + valor, 0);

  // Os angulos caminham até o alvo, então desligar uma fatia reparte o anel em
  // movimento. Partindo de zero, o anel também varre ao aparecer.
  const alvo = useMemo(
    () => sliceAngles(values).flatMap((angulo) => [angulo.startAngle, angulo.endAngle]),
    // A chave resume os valores: o alvo muda com o numero, não com a identidade
    // do array, que e outra a cada render.
    [values.join()],
  );
  const animados = useTweenedNumbers(alvo, { from: alvo.map(() => 0) });

  const angles = reunidas.map((_, indice) => ({
    startAngle: animados[indice * 2] ?? 0,
    endAngle: animados[indice * 2 + 1] ?? 0,
  }));

  // O ponteiro que salta da fatia para a legenda entra nela antes de sair da
  // fatia, e a saida chega antes do novo render: quem decide e a ultima realcada.
  const realcada = useRef<number | null>(null);

  // A fatia entregue e a **agrupada**: as pequenas já viraram uma só, então o
  // indice do anel não corresponde ao que o consumidor informou.
  const focus = (indice: number | null, details?: ChartHoverDetails) => {
    const fatia = indice === null ? null : reunidas[indice] ?? null;
    realcada.current = indice;
    setFocused(indice);

    if (fatia && details) {
      onHover?.(fatia, details);
    } else {
      onHover?.(fatia);
    }
  };

  const release = (indice: number) => {
    if (realcada.current === indice) {
      focus(null);
    }
  };

  const marks = useMarkNavigation({
    onActivate: onMarkClick && (({ column }) => onMarkClick(reunidas[column])),
    onFocusMark: (posicao) => focus(posicao?.column ?? null),
    present: values.flatMap((valor, column) => (valor > 0 ? [{ column, row: 0 }] : [])),
  });

  // Só a legenda traz o detalhe: no ponteiro e no teclado o aviso segue com um
  // argumento, que o teste do consumidor compara. Série desligada não se realca.
  const highlight = (label: string | null, anchor?: ChartAnchorPoint) => {
    const indice = label === null ? -1 : reunidas.findIndex((fatia) => fatia.label === label);

    if (indice < 0 || !(values[indice] > 0) || !anchor) {
      marks.anchorTooltip(undefined);

      if (realcada.current !== null) {
        focus(null);
      }
      return;
    }

    marks.anchorTooltip(anchor);
    focus(indice, { anchor, color: colors[indice] });
  };

  // Desligar a fatia realcada pela legenda a solta: ela deixa de existir no anel.
  const toggleSlice = (label: string) => {
    if (focused !== null && reunidas[focused]?.label === label && !isHidden(label)) {
      highlight(null);
    }

    toggle(label);
  };

  return {
    angles,
    colors,
    focus,
    focused,
    highlight,
    isHidden,
    marks,
    ratioOf: (indice) => (total > 0 ? (values[indice] ?? 0) / total : 0),
    release,
    slices: reunidas,
    toggle: toggleSlice,
    total,
    values,
  };
}
