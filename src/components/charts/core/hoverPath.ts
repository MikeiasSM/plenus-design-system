import type { HierarchyNode } from 'd3-hierarchy';

/** Um nível do caminho até o no sob o ponteiro, com o valor somado daquele nível. */
export interface ChartHoveredNode {
  label: string;
  value: number;
}

/** Caminho do grupo de topo até o no, sem a raiz que o layout cria por fora. */
export function hoverPath(node: HierarchyNode<{ label: string }>): ChartHoveredNode[] {
  return node
    .ancestors()
    .reverse()
    .slice(1)
    .map((ancestor) => ({ label: ancestor.data.label, value: ancestor.value ?? 0 }));
}
