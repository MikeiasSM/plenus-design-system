import type { HierarchyNode } from 'd3-hierarchy';

/**
 * Valor de cada no: o maior entre o próprio e a soma dos filhos. O pai maior que a soma
 * deixa a parte não detalhada; o menor cede ao que os filhos somam.
 */
export function assignNodeValues<Data>(root: HierarchyNode<Data>, ownValue: (data: Data) => number) {
  return root.eachAfter((node) => {
    const proprio = ownValue(node.data);
    const dosFilhos = node.children?.reduce((soma, filho) => soma + (filho.value ?? 0), 0) ?? 0;

    Object.assign(node, { value: node.children ? Math.max(proprio, dosFilhos) : proprio });
  });
}
