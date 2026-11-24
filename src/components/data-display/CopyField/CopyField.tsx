import { useEffect, useId, useState, type ComponentPropsWithRef } from 'react';
import { Button } from '../../actions/Button';
import styles from './CopyField.module.css';

const COPY_FEEDBACK_MS = 2000;

export interface CopyFieldProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** O que o botao copiar anuncia depois de copiar. Padrao: o rotulo seguido de "copiado". */
  copiedAnnouncement?: string;
  hint?: string;
  label: string;
  /**
   * Oculta o valor na tela, com o botao "Mostrar". O botao "Copiar" copia o valor inteiro mesmo oculto. O valor nunca
   * vai ao DOM enquanto oculto.
   */
  masked?: boolean;
  /** Chamado depois de copiar, como para registrar que a credencial foi copiada. */
  onCopy?: () => void;
  value: string;
}

/** Valor copiavel: rotulo, valor em fonte mono e o botao "Copiar", que diz "Copiado" por alguns segundos. */
export function CopyField({ className, copiedAnnouncement, hint, label, masked = false, onCopy, value, ...props }: CopyFieldProps) {
  const id = useId();
  const labelId = `copy-field-${id}-label`;
  const hintId = `copy-field-${id}-hint`;
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hidden = masked && !revealed;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);

    return () => clearTimeout(timer);
  }, [copied]);

  // Ocultar de novo quando o valor muda: uma credencial nova nao nasce visivel.
  useEffect(() => setRevealed(false), [value]);

  function copy() {
    void navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      onCopy?.();
    });
  }

  return (
    <div {...props} className={[styles.copyField, className].filter(Boolean).join(' ')}>
      <span className={styles.label} id={labelId}>
        {label}
      </span>
      <div aria-describedby={hint ? hintId : undefined} aria-labelledby={labelId} className={styles.row} role="group">
        {hidden ? (
          <span className={[styles.value, styles.masked].join(' ')}>
            <span aria-hidden="true">{'•'.repeat(Math.min(Math.max(value.length, 8), 16))}</span>
            <span className={styles.visuallyHidden}>Valor oculto</span>
          </span>
        ) : (
          <code className={styles.value}>{value}</code>
        )}
        <div className={styles.actions}>
          {masked && (
            <Button onClick={() => setRevealed((shown) => !shown)} size="md" variant="ghost">
              {revealed ? 'Ocultar' : 'Mostrar'}
            </Button>
          )}
          <Button onClick={copy} size="md" variant="secondary">
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
      </div>
      {hint && (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      )}
      <span className={styles.visuallyHidden} role="status">
        {copied ? (copiedAnnouncement ?? `${label} copiado`) : ''}
      </span>
    </div>
  );
}
