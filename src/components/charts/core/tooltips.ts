import type { ChartFrameProps } from './ChartFrame';
import type { ChartHoveredNode } from './hoverPath';

export type ChartFrameTooltip = NonNullable<ChartFrameProps['tooltip']>;

export interface CategoryTooltipSeries {
  /** Formato desta serie, quando difere do grafico, como a do eixo da direita. */
  format?: (value: number) => string;
  label: string;
  values: readonly (number | null)[];
}

export interface CategoryTooltipOptions {
  categories: readonly string[];
  colors: readonly string[];
  format: (value: number) => string;
  /** Categoria sob o ponteiro; `null` deixa o balao sem linhas, e ele nao aparece. */
  index: number | null;
  isHidden: (label: string) => boolean;
  series: readonly CategoryTooltipSeries[];
  /** Soma das series na ultima linha, para a pilha. */
  showTotal?: boolean;
}

/** Balao dos graficos de categoria: uma linha por serie visivel, com a cor dela e o valor naquela categoria. */
export function categoryTooltip({
  categories,
  colors,
  format,
  index,
  isHidden,
  series,
  showTotal = false,
}: CategoryTooltipOptions): ChartFrameTooltip {
  const rows =
    index === null
      ? []
      : series.flatMap((serie, ordem) => {
          const valor = serie.values[index];

          if (isHidden(serie.label) || valor === null || valor === undefined || !Number.isFinite(valor)) {
            return [];
          }

          return [{ color: colors[ordem], format: serie.format, label: serie.label, values: [valor] }];
        });

  return {
    columns: [{ format }],
    computed: 'none',
    rows,
    showTotal: showTotal && rows.length > 1,
    title: index === null ? undefined : categories[index],
  };
}

export interface SliceTooltipOptions {
  colors: readonly string[];
  formatPercent: (ratio: number) => string;
  formatValue: (value: number) => string;
  /** Fatia sob o ponteiro; `null` deixa o balao sem linhas. */
  index: number | null;
  slices: readonly { label: string; value: number }[];
  /** Soma das fatias ligadas, base da porcentagem. */
  total: number;
}

/** Balao do anel: a fatia sob o ponteiro, com o valor e a parte do total. */
export function sliceTooltip({ colors, formatPercent, formatValue, index, slices, total }: SliceTooltipOptions): ChartFrameTooltip {
  const fatia = index === null ? undefined : slices[index];

  return {
    columns: [{ format: formatValue }],
    computed: { compute: (valor) => (total > 0 ? valor / total : 0), format: formatPercent },
    rows: fatia && index !== null ? [{ color: colors[index], label: fatia.label, values: [Math.max(fatia.value, 0)] }] : [],
  };
}

export interface PathTooltipOptions {
  /** Cor do no sob o ponteiro. */
  color?: string;
  format: (value: number) => string;
  /** Com ele, cada nivel mostra tambem a parte do total. */
  formatPercent?: (ratio: number) => string;
  /** Caminho do grupo ate o no; `null` deixa o balao sem linhas. */
  path: readonly ChartHoveredNode[] | null;
  total?: number;
}

/** Balao dos hierarquicos: uma linha por nivel do caminho, com o no sob o ponteiro em destaque. */
export function pathTooltip({ color, format, formatPercent, path, total = 0 }: PathTooltipOptions): ChartFrameTooltip {
  const niveis = path ?? [];

  return {
    columns: [{ format }],
    computed: formatPercent ? { compute: (valor) => (total > 0 ? valor / total : 0), format: formatPercent } : 'none',
    rows: niveis.map((nivel, indice) => {
      const ultimo = indice === niveis.length - 1;
      return { color: ultimo ? color : undefined, emphasis: ultimo, label: nivel.label, values: [nivel.value] };
    }),
    title: niveis.at(-1)?.label,
  };
}
