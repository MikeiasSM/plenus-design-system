import { useLayoutEffect, useRef, type ComponentPropsWithRef, type FocusEvent } from 'react';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { Button } from '../../actions/Button';
import { IconExclamationCircle } from '../../icons';
import styles from './SaveBar.module.css';

export interface SaveBarProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  discardLabel?: string;
  /** Aparece e some com transição. Quem decide é o produto, que sabe se há alteração pendente. */
  open: boolean;
  message?: string;
  onDiscard: () => void;
  onSave: () => void;
  /** Lado da área de rolagem a que a barra se prende: no topo ou no pé. No pé, monte-a depois do conteúdo. */
  placement?: 'top' | 'bottom';
  /** O salvamento em curso: o botão de salvar fica ocupado e o de descartar, desabilitado. */
  saving?: boolean;
  saveLabel?: string;
}

function scrollContainer(element: HTMLElement) {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(node).overflowY)) {
      return node;
    }
  }

  return element.parentElement;
}

/** Barra de alterações não salvas do formulário inteiro. Prende-se ao topo ou ao pé da área de rolagem em que for montada. */
export function SaveBar({
  className,
  discardLabel = 'Descartar',
  message = 'Alterações não salvas',
  onDiscard,
  onFocus,
  onSave,
  open,
  ref,
  placement = 'top',
  saveLabel = 'Salvar',
  saving = false,
  ...props
}: SaveBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, barRef);
  const returnTo = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const bar = barRef.current;

    if (open || !bar || !bar.contains(document.activeElement)) {
      return;
    }

    const target = returnTo.current;

    if (target?.isConnected && target !== document.body && !target.matches(':disabled') && !bar.contains(target)) {
      target.focus({ preventScroll: true });
      return;
    }

    const scroller = scrollContainer(bar);

    if (scroller) {
      scroller.tabIndex = scroller.hasAttribute('tabindex') ? scroller.tabIndex : -1;
      scroller.focus({ preventScroll: true });
    }
  }, [open]);

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    onFocus?.(event);

    if (!event.currentTarget.contains(event.relatedTarget)) {
      returnTo.current = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
    }
  }

  return (
    <div
      {...props}
      onFocus={handleFocus}
      ref={mergedRef}
      className={[styles.bar, placement === 'bottom' && styles.bottom, open && styles.open, className].filter(Boolean).join(' ')}
      data-placement={placement}
    >
      <div aria-live="polite" className={styles.announcement} role="status">
        {open ? message : ''}
      </div>
      <div className={styles.clip}>
        <div aria-label={message} className={styles.content} inert={!open} role="region">
          <span className={styles.message}>
            <IconExclamationCircle className={styles.icon} size={16} />
            {message}
          </span>
          <Button disabled={saving} onClick={onDiscard} size="sm" variant="secondary">
            {discardLabel}
          </Button>
          <Button loading={saving} onClick={onSave} size="sm">
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
