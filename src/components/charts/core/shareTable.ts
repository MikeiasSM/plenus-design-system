import type { HierarchyNode } from 'd3-hierarchy';
import type { ChartTableProps } from './ChartTable';

export interface ShareTableItem {
  label: string;
  value: number;
}

/** Cada parte com o valor e a fatia dela no total. O total sai das partes validas, e não das que a legenda mantem ligadas. */
export function shareTable(
  items: readonly ShareTableItem[],
  formatValue: (value: number) => string,
  formatPercent: (ratio: number) => string,
  total = items.reduce((sum, item) => sum + (item.value > 0 ? item.value : 0), 0),
): Pick<ChartTableProps, 'columns' | 'rows'> {
  return {
    columns: ['Valor', '% do total'],
    rows: items.map((item, index) => ({
      cells: Number.isFinite(item.value)
        ? [formatValue(item.value), total > 0 ? formatPercent(Math.max(item.value, 0) / total) : '']
        : ['', ''],
      header: item.label,
      key: `${index}:${item.label}`,
    })),
  };
}

/** A hierarquia inteira, um no por linha com o caminho do grupo até ele, e a fatia de cada um no total da raiz. */
export function treeTable(
  root: HierarchyNode<{ label: string }>,
  formatValue: (value: number) => string,
  formatPercent: (ratio: number) => string,
) {
  const nodes: HierarchyNode<{ label: string }>[] = [];

  root.eachBefore((node) => nodes.push(node));

  const items = nodes.slice(1).map((node) => ({
    label: node.ancestors().reverse().slice(1).map((ancestor) => ancestor.data.label).join(' › '),
    value: node.value ?? 0,
  }));

  return shareTable(items, formatValue, formatPercent, root.value ?? 0);
}
