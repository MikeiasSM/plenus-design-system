import type { ComponentPropsWithRef } from 'react';
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

/** Barra de alterações não salvas do formulário inteiro. Prende-se ao topo ou ao pé da área de rolagem em que for montada. */
export function SaveBar({
  className,
  discardLabel = 'Descartar',
  message = 'Alterações não salvas',
  onDiscard,
  onSave,
  open,
  placement = 'top',
  saveLabel = 'Salvar',
  saving = false,
  ...props
}: SaveBarProps) {
  return (
    <div
      {...props}
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
