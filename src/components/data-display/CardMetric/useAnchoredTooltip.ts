import { useState, type FocusEventHandler, type KeyboardEventHandler, type MouseEventHandler } from 'react';

/** Desconta o afastamento que o ChartTooltip soma ao ponto, para o balao abrir rente ao gatilho. */
const AFASTAMENTO = 16;

interface TriggerHandlers<T extends Element> {
  onBlur?: FocusEventHandler<T>;
  onClick?: MouseEventHandler<T>;
  onFocus?: FocusEventHandler<T>;
  onKeyDown?: KeyboardEventHandler<T>;
}

/**
 * Ponto fixo do balao para o foco e o toque. O ponteiro o `ChartTooltip` ja acompanha sozinho; o teclado e o dedo
 * precisam de um lugar, e esse lugar e logo abaixo do gatilho. Os manipuladores do consumidor continuam valendo.
 */
export function useAnchoredTooltip() {
  const [anchor, setAnchor] = useState<{ x: number; y: number }>();

  const anchorBelow = (trigger: Element) => {
    const { bottom, left } = trigger.getBoundingClientRect();
    setAnchor({ x: left - AFASTAMENTO, y: bottom + 8 - AFASTAMENTO });
  };

  const triggerProps = <T extends Element>(own: TriggerHandlers<T> = {}): TriggerHandlers<T> => ({
    onBlur: (event) => {
      own.onBlur?.(event);
      setAnchor(undefined);
    },
    onClick: (event) => {
      own.onClick?.(event);
      anchorBelow(event.currentTarget);
    },
    onFocus: (event) => {
      own.onFocus?.(event);
      anchorBelow(event.currentTarget);
    },
    onKeyDown: (event) => {
      own.onKeyDown?.(event);

      if (event.key === 'Escape') {
        setAnchor(undefined);
      }
    },
  });

  return { anchor, triggerProps };
}
