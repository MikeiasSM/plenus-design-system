import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useOverlayPosition } from '@react-aria/overlays';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import type { PopoverPlacement } from '../../overlays/Popover';
import styles from './Toolbar.module.css';

export type ToolbarOrientation = 'horizontal' | 'vertical';
export type ToolbarAppearance = 'floating' | 'flat';
export type ToolbarPlacement = PopoverPlacement;

export interface ToolbarProps extends Omit<ComponentPropsWithRef<'div'>, 'aria-label' | 'role'> {
  /** A barra flutua ancorada a este elemento, num portal, sem tirar o foco de quem o tem. */
  anchorRef?: RefObject<HTMLElement | null>;
  appearance?: ToolbarAppearance;
  children: ReactNode;
  label: string;
  orientation?: ToolbarOrientation;
  placement?: ToolbarPlacement;
  /** Gruda a barra no topo da área que rola. Vale para a barra no fluxo, sem `anchorRef`. */
  sticky?: boolean;
}

const ITENS = 'button, a[href], input, select, textarea, [tabindex]';
// Campos que usam as setas para si mesmos: nelas, a barra não toma a tecla.
const CAMPOS = 'input:not([type="checkbox"]), textarea, select, [contenteditable="true"]';
const DISTANCIA_DA_ANCORA = 8;

function itensDe(barra: HTMLElement) {
  return [...barra.querySelectorAll<HTMLElement>(ITENS)].filter((item) => !item.matches(':disabled'));
}

function marcarParada(itens: readonly HTMLElement[], ativo: HTMLElement | null) {
  const parada = itens.find((item) => item === ativo) ?? itens[0];
  itens.forEach((item) => {
    item.tabIndex = item === parada ? 0 : -1;
  });
}

function destinoDaTecla(tecla: string, atual: number, total: number, orientation: ToolbarOrientation) {
  const avancar = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
  const voltar = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

  if (tecla === avancar) {
    return (atual + 1) % total;
  }

  if (tecla === voltar) {
    return (atual - 1 + total) % total;
  }

  if (tecla === 'Home') {
    return 0;
  }

  return tecla === 'End' ? total - 1 : undefined;
}

export function Toolbar({ anchorRef, placement = 'top start', ...props }: ToolbarProps) {
  if (!anchorRef) {
    return <ToolbarBar {...props} />;
  }

  // No servidor não há `document` para o portal; a barra ancorada nasce na hidratação.
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(<AnchoredToolbar {...props} anchorRef={anchorRef} placement={placement} />, document.body);
}

function AnchoredToolbar({
  anchorRef,
  placement,
  ref: refDoConsumidor,
  style,
  ...props
}: Omit<ToolbarProps, 'anchorRef' | 'placement'> & { anchorRef: RefObject<HTMLElement | null>; placement: ToolbarPlacement }) {
  const ref = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, refDoConsumidor);
  const { overlayProps, updatePosition } = useOverlayPosition({
    targetRef: anchorRef,
    overlayRef: ref,
    placement,
    offset: DISTANCIA_DA_ANCORA,
    isOpen: true,
  });

  // O posicionamento não refaz a conta quando rola um contêiner da âncora e só observa o tamanho da âncora da montagem.
  // Aqui, a barra acompanha as duas coisas, também na âncora trocada depois, como o bloco selecionado de um editor.
  useEffect(() => {
    const anchor = anchorRef.current;

    if (!anchor) {
      return;
    }

    function followScroll(event: Event) {
      if (event.target instanceof Node && event.target.contains(anchor)) {
        updatePosition();
      }
    }

    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => updatePosition());
    resizeObserver?.observe(anchor);
    window.addEventListener('scroll', followScroll, { capture: true, passive: true });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', followScroll, { capture: true });
    };
  }, [anchorRef, anchorRef.current, updatePosition]);

  // Sem FocusScope: a barra aparece sobre o bloco e o cursor continua no texto.
  return (
    <ToolbarBar
      {...props}
      ref={mergedRef}
      anchored
      data-react-aria-top-layer="true"
      style={{ ...style, ...overlayProps.style }}
    />
  );
}

function ToolbarBar({
  anchored = false,
  appearance = 'floating',
  children,
  className,
  label,
  onFocus,
  onKeyDown,
  orientation = 'horizontal',
  ref: refDoConsumidor,
  sticky = false,
  ...props
}: Omit<ToolbarProps, 'anchorRef' | 'placement'> & { anchored?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, refDoConsumidor);
  const ativo = useRef<HTMLElement | null>(null);

  // Uma só parada de Tab: o item ativo. Itens que entram, saem ou se desabilitam refazem a marcação.
  useLayoutEffect(() => {
    const barra = ref.current!;
    const remarcar = () => marcarParada(itensDe(barra), ativo.current);

    remarcar();
    const observador = new MutationObserver(remarcar);
    observador.observe(barra, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] });

    return () => observador.disconnect();
  }, []);

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    onFocus?.(event);
    const itens = itensDe(event.currentTarget);

    // Focar a própria barra, como num atalho do produto, leva ao item ativo.
    if (event.target === event.currentTarget) {
      (itens.find((item) => item.tabIndex === 0) ?? itens[0])?.focus();
      return;
    }

    const item = itens.find((candidato) => candidato === event.target);
    if (item) {
      ativo.current = item;
      marcarParada(itens, item);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    const alvo = event.target as HTMLElement;

    if (event.defaultPrevented || alvo.matches(CAMPOS)) {
      return;
    }

    const itens = itensDe(event.currentTarget);
    const atual = itens.indexOf(alvo);
    const destino = atual === -1 ? undefined : destinoDaTecla(event.key, atual, itens.length, orientation);

    if (destino === undefined) {
      return;
    }

    event.preventDefault();
    itens[destino]!.focus();
  }

  return (
    <div
      {...props}
      ref={mergedRef}
      aria-label={label}
      aria-orientation={orientation}
      className={[
        styles.toolbar,
        styles[orientation],
        styles[appearance],
        sticky && !anchored && styles.sticky,
        anchored && styles.anchored,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      role="toolbar"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

export interface ToolbarGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'aria-label' | 'role'> {
  children: ReactNode;
  /** Nome do grupo, quando os botões dele formam um conjunto, como os alinhamentos. */
  label?: string;
}

function ToolbarGroup({ className, label, ...props }: ToolbarGroupProps) {
  return <div {...props} aria-label={label} className={[styles.group, className].filter(Boolean).join(' ')} role="group" />;
}

Toolbar.Group = ToolbarGroup;
