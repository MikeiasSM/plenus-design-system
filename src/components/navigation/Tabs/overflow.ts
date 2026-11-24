export interface OverflowInput {
  /** As chaves das abas, na ordem de `items`. */
  keys: readonly string[];
  /** A largura de cada aba, alinhada a `keys`. */
  widths: readonly number[];
  /** A aba escolhida, que nunca vai para o menu. */
  selected?: string;
  /** O espaço da faixa para as abas e o botão "Mais". */
  available: number;
  /** A largura do botão "Mais". */
  moreWidth: number;
  /** O espaço entre duas abas, e entre a última aba e o botão "Mais". */
  gap: number;
}

function soma(widths: readonly number[], gap: number) {
  return widths.reduce((total, width) => total + width, 0) + Math.max(widths.length - 1, 0) * gap;
}

/**
 * As abas que vão para o menu. Cabendo todas, nenhuma; senão, ficam as primeiras que cabem ao lado do botão "Mais",
 * e as outras vão para o menu. A escolhida fica sempre na faixa: se cairia no menu, toma o lugar da última visível.
 */
export function hiddenTabs({ available, gap, keys, moreWidth, selected, widths }: OverflowInput): string[] {
  if (soma(widths, gap) <= available) {
    return [];
  }

  const room = available - moreWidth - gap;
  const visible: number[] = [];

  for (let index = 0; index < keys.length; index += 1) {
    if (soma([...visible.map((i) => widths[i]), widths[index]], gap) > room) {
      break;
    }
    visible.push(index);
  }

  const escolhida = selected === undefined ? -1 : keys.indexOf(selected);

  if (escolhida >= 0 && !visible.includes(escolhida)) {
    // Sai a última visível até a escolhida caber; sozinha, ela fica mesmo sem caber.
    while (visible.length > 0 && soma([...visible.map((i) => widths[i]), widths[escolhida]], gap) > room) {
      visible.pop();
    }
    visible.push(escolhida);
  }

  return keys.filter((_, index) => !visible.includes(index));
}
