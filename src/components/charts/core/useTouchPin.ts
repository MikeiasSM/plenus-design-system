import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent } from 'react';

/** Quanto o dedo pode andar entre tocar e soltar para ainda valer como toque, e nao como rolagem. */
const TAP_SLOP = 10;

/** O navegador repete o toque como eventos de mouse logo depois do ponteiro; passada esta janela, o mouse e o mouse. */
const COMPAT_MOUSE_WINDOW = 700;

interface Touch {
  moved: boolean;
  x: number;
  y: number;
}

function markOf(target: Element) {
  return target.closest('[data-mark]') ?? target;
}

function dispatchMouse(type: 'mousemove' | 'mouseout' | 'mouseover', target: Element, related: Element | null, x: number, y: number) {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, relatedTarget: related }),
  );
}

/**
 * Toque nas marcas. O realce e o balao dos graficos nascem do ponteiro entrando e saindo da marca; o dedo nao paira,
 * entao o toque faz o que o ponteiro faria e o mantem ate outro toque:
 *
 * - tocar numa marca a fixa, com o realce e o balao;
 * - tocar em outra troca a fixada;
 * - tocar fora do desenho, ou rolar, solta;
 * - tocar na marca ja fixada deixa o clique seguir, e e ele que ativa `onMarkClick`. O primeiro toque so fixa.
 *
 * A rolagem fica intacta: nada aqui cancela o gesto nem muda o `touch-action`. Se o navegador toma o gesto para
 * rolar, o toque e cancelado e nada se fixa. Mouse e caneta nao passam por aqui.
 */
export function useTouchPin() {
  const [pinned, setPinned] = useState<Element | null>(null);
  const pinnedRef = useRef<Element | null>(null);
  const touch = useRef<Touch | null>(null);
  const holdClick = useRef(false);
  const area = useRef<HTMLElement | null>(null);
  const lastTap = useRef(0);

  // O toque ja fez o que o ponteiro faria; os eventos de mouse que o navegador gera dele avisariam a marca de novo.
  useEffect(() => {
    const swallowCompatMouse = (event: Event) => {
      const { relatedTarget, target } = event as MouseEvent;
      const inArea = (node: EventTarget | null) => area.current?.contains(node as Node) ?? false;

      if (event.isTrusted && Date.now() - lastTap.current < COMPAT_MOUSE_WINDOW && (inArea(target) || inArea(relatedTarget))) {
        event.stopPropagation();
      }
    };
    const types = ['mouseover', 'mouseout', 'mousemove'] as const;

    types.forEach((type) => document.addEventListener(type, swallowCompatMouse, true));

    return () => types.forEach((type) => document.removeEventListener(type, swallowCompatMouse, true));
  }, []);

  function pin(target: Element | null, x: number, y: number) {
    const previous = pinnedRef.current;

    if (previous === target) {
      return;
    }

    pinnedRef.current = target;
    setPinned(target);

    // Sair de uma marca para outra e um evento so, o `mouseout` com destino; entrar sem marca anterior e o `mouseover`.
    if (previous) {
      dispatchMouse('mouseout', previous, target, x, y);
    } else if (target) {
      dispatchMouse('mouseover', target, null, x, y);
    }

    if (target) {
      dispatchMouse('mousemove', target, null, x, y);
    }
  }

  useEffect(() => {
    if (!pinned) {
      return;
    }

    const releaseOutside = (event: Event) => {
      if (!area.current?.contains(event.target as Node)) {
        pin(null, 0, 0);
      }
    };
    const release = () => pin(null, 0, 0);

    document.addEventListener('pointerdown', releaseOutside, true);
    window.addEventListener('scroll', release, true);

    return () => {
      document.removeEventListener('pointerdown', releaseOutside, true);
      window.removeEventListener('scroll', release, true);
    };
  }, [pinned]);

  return {
    /** Propriedades do elemento que contem o desenho. */
    props: {
      onClickCapture: (event: ReactMouseEvent) => {
        if (holdClick.current) {
          holdClick.current = false;
          event.stopPropagation();
        }
      },
      onPointerCancel: () => {
        touch.current = null;
      },
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        area.current = event.currentTarget;
        holdClick.current = false;

        touch.current =
          event.pointerType === 'touch' && event.isPrimary ? { moved: false, x: event.clientX, y: event.clientY } : null;
      },
      onPointerMove: (event: PointerEvent) => {
        if (touch.current && Math.hypot(event.clientX - touch.current.x, event.clientY - touch.current.y) > TAP_SLOP) {
          touch.current.moved = true;
        }
      },
      onPointerUp: (event: PointerEvent) => {
        const tap = touch.current;
        touch.current = null;

        if (!tap || tap.moved) {
          return;
        }

        const target = event.target as Element;
        const alreadyPinned = pinnedRef.current !== null && markOf(pinnedRef.current) === markOf(target);

        lastTap.current = Date.now();
        holdClick.current = !alreadyPinned && target.closest('[data-mark]') !== null;
        pin(alreadyPinned ? pinnedRef.current : target, event.clientX, event.clientY);
      },
    },
  };
}
