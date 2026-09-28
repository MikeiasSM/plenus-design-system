import type { SeriesAppearance } from '../palette';

export interface ChartSlice extends SeriesAppearance {
  label: string;
  value: number;
}

export interface GroupSmallSlicesOptions {
  label: string;
  threshold: number;
}

/**
 * Reune as fatias pequenas numa so. Abaixo de um limiar a fatia deixa de ser
 * legivel no anel e ainda ocupa uma linha da legenda; o agrupamento e a regra
 * de percentual minimo da referencia.
 *
 * A fatia reunida entra no lugar da primeira pequena, para que a ordem das
 * demais, que a legenda repete, permaneca a mesma.
 */
/** Valor que a fatia ocupa no anel. Invalido tem o destino do ausente; um so desligava o agrupamento. */
function ocupacao(fatia: ChartSlice) {
  return Number.isFinite(fatia.value) ? Math.max(fatia.value, 0) : 0;
}

export function groupSmallSlices(
  slices: readonly ChartSlice[],
  { label, threshold }: GroupSmallSlicesOptions,
): readonly ChartSlice[] {
  const total = slices.reduce((soma, fatia) => soma + ocupacao(fatia), 0);

  if (threshold <= 0 || total <= 0) {
    return slices;
  }

  const pequena = (fatia: ChartSlice) => Number.isFinite(fatia.value) && ocupacao(fatia) / total < threshold;
  const pequenas = slices.filter(pequena);

  if (pequenas.length < 2) {
    return slices;
  }

  const reunida: ChartSlice = {
    intent: 'neutral',
    label,
    value: pequenas.reduce((soma, fatia) => soma + ocupacao(fatia), 0),
  };

  let inserida = false;

  return slices.flatMap((fatia) => {
    if (!pequena(fatia)) {
      return [fatia];
    }

    if (inserida) {
      return [];
    }

    inserida = true;

    return [reunida];
  });
}
