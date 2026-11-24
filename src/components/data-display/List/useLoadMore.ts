import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface UseLoadMoreOptions {
  /** Quantas opções já chegaram. A contagem que muda encerra o pedido em curso. */
  count: number;
  hasMore?: boolean;
  /** Chamado quando a página pedida chega, com a contagem nova. */
  onArrive?: (count: number) => void;
  onLoadMore?: () => void;
}

export interface LoadMore {
  /** Esquece o pedido em curso, como numa busca nova ou ao fechar a lista: a próxima chegada ao fim pede de novo. */
  cancel: () => void;
  /** Liga a busca da próxima página. Sem `onLoadMore` ou sem `hasMore`, não há o que pedir. */
  enabled: boolean;
  /** Uma página foi pedida e ainda não chegou. */
  pending: boolean;
  /** Pede a próxima página uma vez: os pedidos seguintes esperam a contagem mudar. */
  request: () => void;
}

/**
 * A paginação das listas de escolha. O pedido vale pela contagem do momento em que foi feito: enquanto as opções
 * não mudam de tamanho, a página está a caminho e chegar ao fim de novo não pede outra.
 */
export function useLoadMore({ count, hasMore = false, onArrive, onLoadMore }: UseLoadMoreOptions): LoadMore {
  const enabled = Boolean(onLoadMore) && hasMore;
  const [pedidoEm, setPedidoEm] = useState<number | null>(null);
  // O estado desenha a linha de espera; a referência barra o segundo pedido feito antes da renderização seguinte.
  const pedidoRef = useRef<number | null>(null);
  const atual = useRef({ count, enabled, onArrive, onLoadMore });

  useLayoutEffect(() => {
    atual.current = { count, enabled, onArrive, onLoadMore };
  });

  useEffect(() => {
    if (pedidoEm === null || pedidoEm === count) {
      return;
    }

    // A lista pode ter pedido a página seguinte no mesmo ciclo em que esta chegou: esse pedido fica.
    if (pedidoRef.current === pedidoEm) {
      pedidoRef.current = null;
    }
    setPedidoEm((anterior) => (anterior === pedidoEm ? null : anterior));

    if (count > pedidoEm) {
      atual.current.onArrive?.(count);
    }
  }, [count, pedidoEm]);

  const request = useCallback(() => {
    const { count: contagem, enabled: ligado, onLoadMore: pedir } = atual.current;

    if (!ligado || pedidoRef.current === contagem) {
      return;
    }

    pedidoRef.current = contagem;
    setPedidoEm(contagem);
    pedir?.();
  }, []);

  const cancel = useCallback(() => {
    pedidoRef.current = null;
    setPedidoEm(null);
  }, []);

  return { cancel, enabled, pending: enabled && pedidoEm === count, request };
}
