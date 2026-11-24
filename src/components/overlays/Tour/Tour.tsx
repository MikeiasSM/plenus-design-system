import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { ariaHideOutside } from '@react-aria/overlays';
import { Button } from '../../actions/Button';
import { IconClose } from '../../icons';
import { usePortalContainer } from '../Portal/PortalContext';
import { blockRepeatedPress } from '../../../utils/press/press';
import { isDevelopment } from '../../../utils/isDevelopment';
import { useActiveTour, useTourCoordinator, type TourEndReason } from './TourProvider';
import styles from './Tour.module.css';

/** O elemento que o passo aponta: um `ref`, o próprio elemento, um seletor CSS ou uma função que o devolve. */
export type TourTarget = RefObject<HTMLElement | null> | HTMLElement | string | (() => HTMLElement | null);

/** Lado preferido do painel em relação ao alvo; sem espaço, o painel vai ao outro lado. */
export type TourPlacement = 'top' | 'bottom';

export interface TourStep {
  /** Identifica o passo nos eventos e no `onEnd`. */
  id: string;
  /** Obrigatório. É o nome do diálogo do passo. */
  title: ReactNode;
  /** Diz o que é o elemento apontado: o recorte no fundo não chega ao leitor de tela. */
  content: ReactNode;
  /** Sem `target`, o passo fica no centro da tela. */
  target?: TourTarget;
  placement?: TourPlacement;
  /** Imagem ou vídeo antes do título, sem reprodução automática. */
  media?: ReactNode;
  /** Com `'click'`, o passo espera a pessoa usar o alvo: não modal, sem Avançar, e o foco vai ao próprio alvo. */
  advanceOn?: 'click';
}

export interface TourLabels {
  back: string;
  close: string;
  done: string;
  next: string;
  progress: (current: number, total: number) => string;
}

export interface TourEndDetail {
  reason: TourEndReason;
  stepId: string;
}

export interface TourProps {
  /** Identifica o tour no `useTour`, nos eventos e no `storage`. */
  id: string;
  /** Sobe quando a tela muda e o tour precisa ser visto de novo. */
  version?: number;
  steps: readonly TourStep[];
  /** Aberto, no modo controlado. Sem `open` nem `defaultOpen`, o tour abre por `useTour().start(id)`. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Índice do passo em `steps`, no modo controlado. */
  step?: number;
  onStepChange?: (index: number) => void;
  onEnd?: (detail: TourEndDetail) => void;
  /** Com `false`, a página continua usável durante o tour; o painel não cobre o alvo. */
  modal?: boolean;
  /** O que fazer quando o alvo não aparece em `targetTimeout`: saltar o passo ou encerrar o tour. */
  targetMissing?: 'skip' | 'end';
  targetTimeout?: number;
  labels?: Partial<TourLabels>;
  /** Elemento que recebe o tour. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
}

const DEFAULT_LABELS: TourLabels = {
  back: 'Voltar',
  close: 'Fechar tour',
  done: 'Concluir',
  next: 'Avançar',
  progress: (current, total) => `Passo ${current} de ${total}`,
};

const MAX_STEPS = 5;
const warned = new Set<string>();

function warnOnce(key: string, message: string) {
  if (isDevelopment() && !warned.has(key)) {
    warned.add(key);
    console.warn(message);
  }
}

function hasContent(node: ReactNode) {
  return node !== undefined && node !== null && node !== false && node !== '';
}

function resolveTarget(target: TourTarget): HTMLElement | null {
  if (typeof target === 'string') {
    return typeof document === 'undefined' ? null : document.querySelector<HTMLElement>(target);
  }
  if (typeof target === 'function') {
    return target();
  }
  if (target instanceof HTMLElement) {
    return target;
  }
  return target.current;
}

function isVisible(element: HTMLElement) {
  if (!element.isConnected) {
    return false;
  }
  return typeof element.checkVisibility === 'function' ? element.checkVisibility() : !element.closest('[hidden]');
}

export function Tour({
  id,
  version = 1,
  steps,
  open,
  defaultOpen = false,
  onOpenChange,
  step,
  onStepChange,
  onEnd,
  modal = true,
  targetMissing = 'skip',
  targetTimeout = 1500,
  labels,
  portalContainer,
}: TourProps) {
  const coordinator = useTourCoordinator();
  const activeId = useActiveTour(coordinator);
  const container = usePortalContainer(portalContainer);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalIndex, setInternalIndex] = useState(0);
  const [skipped, setSkipped] = useState<ReadonlySet<number>>(() => new Set());
  const wanted = open ?? (internalOpen || activeId === id);
  const shown = wanted && activeId === id;
  const index = step ?? internalIndex;
  const wasWanted = useRef(false);
  const wasShown = useRef(false);
  const ending = useRef(false);
  const latest = useRef({ index, onEnd, onOpenChange, open, steps, version });

  useEffect(() => {
    latest.current = { index, onEnd, onOpenChange, open, steps, version };
  });

  useEffect(() => coordinator.register(id, version), [coordinator, id, version]);

  function finish(reason: TourEndReason, notifyOpenChange = true) {
    const current = latest.current;
    const stepId = current.steps[current.index]?.id ?? '';
    ending.current = true;
    coordinator.emit({ type: 'end', tourId: id, version: current.version, stepId, reason });
    coordinator.markSeen(id, current.version, reason);
    current.onEnd?.({ reason, stepId });
    if (current.open === undefined) {
      setInternalOpen(false);
    }
    coordinator.release(id);
    if (notifyOpenChange) {
      current.onOpenChange?.(false);
    }
  }

  // Ao ser pedido (`open` ou `defaultOpen`), o tour pede a vez. Com outro aberto, não abre e avisa o fechamento.
  useEffect(() => {
    const rising = wanted && !wasWanted.current;
    wasWanted.current = wanted;
    if (!rising || activeId === id) {
      return;
    }
    if (coordinator.claim(id)) {
      return;
    }
    warnOnce(`ocupado:${id}`, `Tour: "${id}" não abriu, porque outro tour está aberto. Só um tour abre por vez.`);
    if (open === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
  }, [activeId, coordinator, id, onOpenChange, open, wanted]);

  useEffect(() => {
    if (shown && !wasShown.current) {
      ending.current = false;
      setSkipped(new Set());
      if (step === undefined) {
        setInternalIndex(0);
      } else if (step !== 0) {
        onStepChange?.(0);
      }
      coordinator.emit({ type: 'start', tourId: id, version });
      if (steps.length > MAX_STEPS) {
        warnOnce(`passos:${id}`, `Tour: "${id}" tem ${steps.length} passos. Acima de ${MAX_STEPS}, poucas pessoas chegam ao fim; prefira tours curtos.`);
      }
      if (steps.some((item) => !hasContent(item.title))) {
        warnOnce(`titulo:${id}`, `Tour: "${id}" tem passo sem title. O título é o nome do diálogo do passo e é obrigatório.`);
      }
    }
    // Fechado por fora: `stop()`, ou `open` que o produto passou a `false`.
    if (!shown && wasShown.current && !ending.current) {
      finish('dismissed', latest.current.open === undefined || latest.current.open);
    }
    wasShown.current = shown;
  });

  useEffect(
    () => () => {
      coordinator.release(id);
    },
    [coordinator, id],
  );

  function go(next: number) {
    if (step === undefined) {
      setInternalIndex(next);
    }
    onStepChange?.(next);
  }

  function nextIndex(from: number, ignored: ReadonlySet<number>) {
    for (let candidate = from + 1; candidate < steps.length; candidate += 1) {
      if (!ignored.has(candidate)) {
        return candidate;
      }
    }
    return -1;
  }

  function previousIndex(from: number) {
    for (let candidate = from - 1; candidate >= 0; candidate -= 1) {
      if (!skipped.has(candidate)) {
        return candidate;
      }
    }
    return -1;
  }

  function next() {
    const target = nextIndex(index, skipped);
    if (target === -1) {
      finish('completed');
    } else {
      go(target);
    }
  }

  function back() {
    const target = previousIndex(index);
    if (target !== -1) {
      go(target);
    }
  }

  function skipMissing() {
    coordinator.emit({ type: 'skip', tourId: id, version, stepId: steps[index].id, reason: 'target-missing' });
    if (targetMissing === 'end') {
      finish('target-missing');
      return;
    }
    const ignored = new Set(skipped).add(index);
    setSkipped(ignored);
    const target = nextIndex(index, ignored);
    if (target !== -1) {
      go(target);
      return;
    }
    // Sem passo adiante: concluído se algum passo chegou a aparecer.
    finish(previousIndex(index) === -1 ? 'target-missing' : 'completed');
  }

  const current = steps[index];

  // No servidor não há `document` para o portal; o tour nasce na hidratação.
  if (!shown || !container || !current || skipped.has(index)) {
    return null;
  }

  const total = steps.length - skipped.size;
  const position = index - [...skipped].filter((item) => item < index).length + 1;

  return createPortal(
    <TourLayer
      isFirst={previousIndex(index) === -1}
      isLast={nextIndex(index, skipped) === -1}
      labels={{ ...DEFAULT_LABELS, ...labels }}
      modal={modal}
      onBack={back}
      onDismiss={() => finish('dismissed')}
      onMissing={skipMissing}
      onNext={next}
      onShown={() => coordinator.emit({ type: 'step', tourId: id, version, stepId: current.id, index, total })}
      position={position}
      step={current}
      stepIndex={index}
      targetTimeout={targetTimeout}
      total={total}
    />,
    container,
  );
}

interface TourLayerProps {
  isFirst: boolean;
  isLast: boolean;
  labels: TourLabels;
  modal: boolean;
  onBack: () => void;
  onDismiss: () => void;
  onMissing: () => void;
  onNext: () => void;
  onShown: () => void;
  position: number;
  step: TourStep;
  stepIndex: number;
  targetTimeout: number;
  total: number;
}

const SPOTLIGHT_PADDING = 6;
const SPOTLIGHT_RADIUS = 10;
const GAP = 14;
const EDGE = 8;
const NARROW = 480;

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  return (
    `M${x + k} ${y}H${x + w - k}Q${x + w} ${y} ${x + w} ${y + k}V${y + h - k}Q${x + w} ${y + h} ${x + w - k} ${y + h}` +
    `H${x + k}Q${x} ${y + h} ${x} ${y + h - k}V${y + k}Q${x} ${y} ${x + k} ${y}Z`
  );
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function TourLayer({
  isFirst,
  isLast,
  labels,
  modal,
  onBack,
  onDismiss,
  onMissing,
  onNext,
  onShown,
  position,
  step,
  stepIndex,
  targetTimeout,
  total,
}: TourLayerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const returnTo = useRef<Element | null>(null);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const bodyId = `${generatedId}-body`;
  const progressId = `${generatedId}-progress`;
  // O alvo vale só para o passo em que foi achado. `undefined` enquanto é procurado; `null` no passo sem alvo.
  const [resolved, setResolved] = useState<{ element: HTMLElement | null; index: number } | null>(null);
  const target = resolved?.index === stepIndex ? resolved.element : undefined;
  const isAction = step.advanceOn === 'click' && step.target !== undefined;
  const modalNow = modal && !isAction;
  const ready = target !== undefined;
  const callbacks = useRef({ onDismiss, onMissing, onNext, onShown, step });

  // No layout, antes da busca do alvo, que lê o passo atual daqui.
  useLayoutEffect(() => {
    callbacks.current = { onDismiss, onMissing, onNext, onShown, step };
  });

  // Quem tinha o foco antes do tour, para devolvê-lo no fim.
  useLayoutEffect(() => {
    returnTo.current = document.activeElement;
  }, []);

  useLayoutEffect(() => {
    const wanted = callbacks.current.step.target;
    if (wanted === undefined) {
      setResolved({ element: null, index: stepIndex });
      return;
    }

    const found = resolveTarget(wanted);
    if (found && isVisible(found)) {
      setResolved({ element: found, index: stepIndex });
      return;
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      const element = resolveTarget(wanted);
      if (element && isVisible(element)) {
        clearInterval(timer);
        setResolved({ element, index: stepIndex });
      } else if (Date.now() - startedAt >= targetTimeout) {
        clearInterval(timer);
        callbacks.current.onMissing();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [stepIndex, step.id, targetTimeout]);

  // Posição em coordenadas da janela: recorte, contorno, painel e seta. Escrita direto no DOM, a cada rolagem.
  useLayoutEffect(() => {
    if (!ready) {
      return;
    }

    function place() {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }
      const width = document.documentElement.clientWidth || window.innerWidth;
      const height = window.innerHeight;
      const narrow = width < NARROW;
      let path = `M0 0H${width}V${height}H0Z`;

      panel.dataset.layout = narrow ? 'sheet' : target ? 'anchored' : 'centered';

      if (target) {
        const rect = target.getBoundingClientRect();
        const x = rect.left - SPOTLIGHT_PADDING;
        const y = rect.top - SPOTLIGHT_PADDING;
        const w = rect.width + SPOTLIGHT_PADDING * 2;
        const h = rect.height + SPOTLIGHT_PADDING * 2;
        path += roundedRect(x, y, w, h, SPOTLIGHT_RADIUS);

        if (ringRef.current) {
          Object.assign(ringRef.current.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
        }

        if (!narrow) {
          const panelWidth = panel.offsetWidth;
          const panelHeight = panel.offsetHeight;
          const below = y + h + GAP;
          const above = y - GAP - panelHeight;
          const fitsBelow = below + panelHeight <= height - EDGE;
          const fitsAbove = above >= EDGE;
          const placeBelow = step.placement === 'top' ? !fitsAbove && fitsBelow : fitsBelow || !fitsAbove;
          const top = placeBelow ? below : above;
          const center = x + w / 2;
          const left = Math.max(EDGE, Math.min(width - panelWidth - EDGE, center - panelWidth / 2));
          panel.style.left = `${left}px`;
          panel.style.top = `${Math.max(EDGE, Math.min(height - panelHeight - EDGE, top))}px`;
          panel.dataset.side = placeBelow ? 'bottom' : 'top';
          if (arrowRef.current) {
            arrowRef.current.style.left = `${Math.max(12, Math.min(panelWidth - 24, center - left - 6))}px`;
          }
        }
      } else if (!narrow) {
        panel.style.left = `${Math.max(EDGE, (width - panel.offsetWidth) / 2)}px`;
        panel.style.top = `${Math.max(EDGE, (height - panel.offsetHeight) / 2)}px`;
      }

      if (narrow) {
        panel.style.left = '';
        panel.style.top = '';
      }

      pathRef.current?.setAttribute('d', path);
    }

    target?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    place();

    let frame = 0;
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    }

    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    if (target) {
      observer?.observe(target);
    }
    if (panelRef.current) {
      observer?.observe(panelRef.current);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [ready, target, stepIndex, step.placement]);

  // A cada passo mostrado: o evento, o foco e, no passo de ação, a descrição e o clique no próprio alvo.
  useEffect(() => {
    if (!ready) {
      return;
    }
    callbacks.current.onShown();

    if (!isAction || !target) {
      panelRef.current?.focus({ preventScroll: true });
      return;
    }

    const previous = target.getAttribute('aria-describedby');
    target.setAttribute('aria-describedby', [previous, bodyId, progressId].filter(Boolean).join(' '));
    target.focus({ preventScroll: true });

    function advance() {
      callbacks.current.onNext();
    }

    target.addEventListener('click', advance);
    return () => {
      target.removeEventListener('click', advance);
      if (previous === null) {
        target.removeAttribute('aria-describedby');
      } else {
        target.setAttribute('aria-describedby', previous);
      }
    };
  }, [ready, target, stepIndex, isAction, bodyId, progressId]);

  // Modal: o resto da página some para a tecnologia assistiva.
  useEffect(() => (modalNow && ready && panelRef.current ? ariaHideOutside([panelRef.current]) : undefined), [modalNow, ready, stepIndex]);

  // O Esc encerra o tour também com o foco fora do painel, como no passo de ação.
  useEffect(() => {
    const doc = panelRef.current?.ownerDocument ?? document;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        callbacks.current.onDismiss();
      }
    }

    doc.addEventListener('keydown', closeOnEscape);
    return () => doc.removeEventListener('keydown', closeOnEscape);
  }, []);

  // No fim, o foco volta a quem o tinha, a menos que a pessoa o tenha levado à página, como no passo de ação.
  useEffect(
    () => () => {
      const active = document.activeElement;
      const back = returnTo.current;
      if ((!active || active === document.body) && back instanceof HTMLElement && back.isConnected) {
        back.focus({ preventScroll: true });
      }
    },
    [],
  );

  const showScrim = modalNow || isAction;

  return (
    <>
      {showScrim && (
        <svg aria-hidden="true" className={styles.scrim} data-interactive={isAction || undefined}>
          <path fillRule="evenodd" ref={pathRef} />
        </svg>
      )}
      {modalNow && <div aria-hidden="true" className={styles.blocker} />}
      {target && <div aria-hidden="true" className={styles.ring} ref={ringRef} />}
      <FocusScope contain={modalNow}>
        <div
          aria-describedby={`${bodyId} ${progressId}`}
          aria-labelledby={titleId}
          aria-modal={modalNow || undefined}
          className={styles.panel}
          data-ready={ready || undefined}
          // Camada de cima: o `ariaHideOutside` de um `Dialog` aberto atrás não esconde o passo.
          data-react-aria-top-layer="true"
          ref={panelRef}
          role="dialog"
          tabIndex={-1}
        >
          <span aria-hidden="true" className={styles.arrow} ref={arrowRef} />
          {hasContent(step.media) && <div className={styles.media}>{step.media}</div>}
          <div className={styles.header}>
            <h2 className={styles.title} id={titleId}>{step.title}</h2>
            <button aria-label={labels.close} className={styles.close} onClick={onDismiss} onKeyDown={blockRepeatedPress} type="button">
              <IconClose size={16} />
            </button>
          </div>
          <div className={styles.body} id={bodyId}>{step.content}</div>
          <div className={styles.footer}>
            <div className={styles.progress}>
              <span id={progressId}>{labels.progress(position, total)}</span>
              <span aria-hidden="true" className={styles.dots}>
                {Array.from({ length: total }, (_, item) => (
                  <span className={[styles.dot, item === position - 1 && styles.dotCurrent].filter(Boolean).join(' ')} key={item} />
                ))}
              </span>
            </div>
            <div className={styles.actions}>
              {!isFirst && (
                <Button onClick={onBack} size="sm" variant="ghost">{labels.back}</Button>
              )}
              {!isAction && (
                <Button onClick={onNext} size="sm">{isLast ? labels.done : labels.next}</Button>
              )}
            </div>
          </div>
        </div>
      </FocusScope>
    </>
  );
}
