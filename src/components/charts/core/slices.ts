import type { SeriesAppearance } from '../palette';

export interface ChartSlice extends SeriesAppearance {
  /** Só na fatia que reúne as pequenas: as fatias reunidas, para o clique saber o que ela contem. */
  grouped?: readonly ChartSlice[];
  label: string;
  value: number;
}

export interface GroupSmallSlicesOptions {
  /** Rótulo da fatia que reúne as pequenas. `Outros` por padrão, como no `ChartPie` e no `ChartDonut`. */
  label?: string;
  /** Fração do total abaixo da qual a fatia entra no agrupamento. 0,02 por padrão. */
  threshold?: number;
}

/** Valor que a fatia ocupa no anel. Inválido tem o destino do ausente; um só desligava o agrupamento. */
function ocupacao(fatia: ChartSlice) {
  return Number.isFinite(fatia.value) ? Math.max(fatia.value, 0) : 0;
}

/**
 * Reúne as fatias pequenas numa só. Abaixo de um limiar a fatia deixa de ser
 * legível no anel e ainda ocupa uma linha da legenda; o agrupamento e a regra
 * de percentual mínimo da referência. E a regra que o `ChartPie` e o `ChartDonut`
 * desenham, exportada para o balão próprio listar as mesmas fatias.
 *
 * A fatia reunida entra no lugar da primeira pequena, para que a ordem das
 * demais, que a legenda repete, permaneca a mesma.
 */
export function groupSmallSlices(
  slices: readonly ChartSlice[],
  { label = 'Outros', threshold = 0.02 }: GroupSmallSlicesOptions = {},
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
    grouped: pequenas,
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
