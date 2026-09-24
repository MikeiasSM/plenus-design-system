import { useCallback, useRef, useState } from 'react';

const OVERSCAN = 6;

export function useVirtualWindow(total: number, height?: number) {
  const scrollElement = useRef<HTMLElement | null>(null);
  const [itemHeight, setItemHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const measureItem = useCallback((node: HTMLElement | null) => {
    const measured = node?.offsetHeight ?? 0;

    if (measured > 0) {
      setItemHeight((current) => (current === measured ? current : measured));
    }
  }, []);

  const attachScroll = useCallback((node: HTMLElement | null) => {
    scrollElement.current = node;
  }, []);

  const onScroll = useCallback(() => {
    setScrollTop(scrollElement.current?.scrollTop ?? 0);
  }, []);

  const active = height !== undefined && itemHeight > 0 && total * itemHeight > height;

  const scrollToIndex = useCallback(
    (index: number) => {
      const element = scrollElement.current;

      if (!element || index < 0) {
        return;
      }

      const top = index * itemHeight;
      const bottom = top + itemHeight;

      if (top < element.scrollTop) {
        element.scrollTop = top;
      } else if (bottom > element.scrollTop + element.clientHeight) {
        element.scrollTop = bottom - element.clientHeight;
      }
    },
    [itemHeight],
  );

  if (!active) {
    return {
      active,
      attachScroll,
      measureItem,
      onScroll,
      padding: { before: 0, after: 0 },
      scrollToIndex,
      start: 0,
      end: total,
    };
  }

  const perScreen = Math.ceil(height / itemHeight);
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const end = Math.min(total, start + perScreen + OVERSCAN * 2);

  return {
    active,
    attachScroll,
    measureItem,
    onScroll,
    padding: { before: start * itemHeight, after: (total - end) * itemHeight },
    scrollToIndex,
    start,
    end,
  };
}
