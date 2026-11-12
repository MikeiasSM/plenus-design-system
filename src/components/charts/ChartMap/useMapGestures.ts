import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { initialView, panView, transformView, ZOOM_STEP, zoomView, type ChartMapView, type ViewFrame } from './mapView';

/** Quanto o ponteiro pode andar com o botão pressionado e ainda valer como clique, e não como arraste. */
const DRAG_SLOP = 4;
const KEY_PAN = 64;
const HINT_DURATION = 1500;
const WHEEL_SENSITIVITY = 0.0025;
const WHEEL_LINE = 16;

type Position = readonly [number, number];

interface Drag {
  active: boolean;
  id: number;
  start: ChartMapView;
  x: number;
  y: number;
}

interface Pinch {
  distance: number;
  middle: Position;
  view: ChartMapView;
}

interface GesturesOptions {
  frame?: ViewFrame;
  onChange: (view: ChartMapView) => void;
  svgRef: RefObject<SVGSVGElement | null>;
  view?: ChartMapView;
  /** O desenho esta na tela: na visao em tabela, não ha o que aproximar. */
  visible: boolean;
}

const KEY_PANS: Record<string, Position> = {
  ArrowDown: [0, -KEY_PAN],
  ArrowLeft: [KEY_PAN, 0],
  ArrowRight: [-KEY_PAN, 0],
  ArrowUp: [0, KEY_PAN],
};

function middleAndDistance([a, b]: Position[]) {
  return { distance: Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, middle: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Position };
}

/**
 * Arraste com o mouse, pinca e arraste com dois dedos, Ctrl ou ⌘ com a rolagem e as teclas da vista. Um dedo só não entra:
 * continua rolando a página e valendo como toque nas marcas. Devolve as propriedades do SVG.
 */
export function useMapGestures({ frame, onChange, svgRef, view, visible }: GesturesOptions) {
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(false);
  const latest = useRef({ frame, onChange, view });
  const drag = useRef<Drag | null>(null);
  const fingers = useRef(new Map<number, Position>());
  const pinch = useRef<Pinch | null>(null);
  const suppressClick = useRef(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    latest.current = { frame, onChange, view };
  });
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const enabled = frame !== undefined && visible;

  // O `wheel` e o `touchmove` precisam de `preventDefault`, que o React registra como passivo.
  useEffect(() => {
    const svg = svgRef.current;

    if (!enabled || !svg) {
      return;
    }

    const showHint = () => {
      setHint(true);
      clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(false), HINT_DURATION);
    };
    const onWheel = (event: WheelEvent) => {
      const { frame: current, view: currentView } = latest.current;

      if (!current || !currentView) {
        return;
      }

      if (!event.ctrlKey && !event.metaKey) {
        showHint();
        return;
      }

      event.preventDefault();
      const box = svg.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? WHEEL_LINE : 1);
      const next = zoomView(current, currentView, Math.exp(-delta * WHEEL_SENSITIVITY), [event.clientX - box.left, event.clientY - box.top]);

      latest.current.view = next;
      latest.current.onChange(next);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1 && event.cancelable) {
        event.preventDefault();
      }
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    svg.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      svg.removeEventListener('wheel', onWheel);
      svg.removeEventListener('touchmove', onTouchMove);
    };
  }, [enabled, svgRef]);

  function positionOf(event: PointerEvent<SVGSVGElement>): Position {
    const box = event.currentTarget.getBoundingClientRect();
    return [event.clientX - box.left, event.clientY - box.top];
  }

  function updatePinch() {
    const touching = [...fingers.current.values()];

    if (touching.length === 2) {
      pinch.current = { ...middleAndDistance(touching), view: view! };
    } else if (touching.length === 0) {
      pinch.current = null;
    }
  }

  function releasePointer(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerType === 'touch') {
      fingers.current.delete(event.pointerId);

      // O dedo que sobra de uma pinca não e toque nas marcas: o evento não chega a regra de toque do gráfico.
      if (pinch.current) {
        event.stopPropagation();
      }
      updatePinch();
      return;
    }

    const current = drag.current;
    drag.current = null;

    if (current?.active) {
      suppressClick.current = true;
      setDragging(false);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  }

  const props = {
    onClickCapture: (event: MouseEvent) => {
      if (suppressClick.current) {
        suppressClick.current = false;
        event.stopPropagation();
      }
    },
    onKeyDown: (event: KeyboardEvent<SVGSVGElement>) => {
      if (!frame || !view || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const center: Position = [frame.width / 2, frame.height / 2];
      const pan = event.shiftKey ? KEY_PANS[event.key] : undefined;
      const next =
        event.key === '+' || event.key === '='
          ? zoomView(frame, view, ZOOM_STEP, center)
          : event.key === '-' || event.key === '_'
            ? zoomView(frame, view, 1 / ZOOM_STEP, center)
            : event.key === '0'
              ? initialView(frame)
              : pan && panView(frame, view, pan[0], pan[1]);

      if (next) {
        event.preventDefault();
        onChange(next);
      }
    },
    onPointerCancel: releasePointer,
    onPointerDown: (event: PointerEvent<SVGSVGElement>) => {
      suppressClick.current = false;

      if (!frame || !view) {
        return;
      }

      if (event.pointerType === 'touch') {
        fingers.current.set(event.pointerId, positionOf(event));
        updatePinch();
      } else if (event.button === 0) {
        drag.current = { active: false, id: event.pointerId, start: view, x: event.clientX, y: event.clientY };
      }
    },
    onPointerMove: (event: PointerEvent<SVGSVGElement>) => {
      if (!frame) {
        return;
      }

      if (event.pointerType === 'touch') {
        if (!fingers.current.has(event.pointerId)) {
          return;
        }

        fingers.current.set(event.pointerId, positionOf(event));
        const touching = [...fingers.current.values()];

        if (pinch.current && touching.length === 2) {
          event.stopPropagation();
          const { distance, middle } = middleAndDistance(touching);
          onChange(transformView(frame, pinch.current.view, distance / pinch.current.distance, pinch.current.middle, middle));
        }
        return;
      }

      const current = drag.current;

      if (!current || current.id !== event.pointerId) {
        return;
      }

      // O botão solto fora do mapa não chega como `pointerup`: sem esta saida, o arraste seguiria o ponteiro solto.
      if ((event.buttons & 1) === 0) {
        releasePointer(event);
        return;
      }

      const [dx, dy] = [event.clientX - current.x, event.clientY - current.y];

      if (!current.active) {
        if (Math.hypot(dx, dy) <= DRAG_SLOP) {
          return;
        }

        current.active = true;
        setDragging(true);
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }

      onChange(panView(frame, current.start, dx, dy));
    },
    onPointerUp: releasePointer,
  };

  return { dragging, hint, props };
}
