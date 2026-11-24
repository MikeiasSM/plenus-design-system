import { useId, useRef, useState, type ComponentPropsWithRef } from 'react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { selectContents } from '../../../utils/clipboard/clipboard';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import { Button } from '../../actions/Button';
import styles from './CopyField.module.css';

const COPY_FEEDBACK_MS = 2000;

// Quantidade fixa: os pontos nao dizem quantos caracteres o valor oculto tem.
const MASK = '•'.repeat(8);

export interface CopyFieldLabels {
  /** Texto do botao de copiar. O nome dele acrescenta o rotulo do campo: "Copiar client_id". */
  copy: string;
  /** Texto do botao depois de copiar, por alguns segundos. */
  copied: string;
  /** Aviso quando o navegador recusa a copia e o valor esta oculto. */
  copyFailed: string;
  /** Aviso quando o navegador recusa a copia e o valor a vista fica selecionado para o Ctrl+C. */
  copyFailedSelected: string;
  /** Nome do valor oculto para o leitor de tela. */
  hiddenValue: string;
  /** Botao que oculta o valor revelado. */
  hide: string;
  /** Botao que revela o valor oculto. */
  show: string;
}

const DEFAULT_COPY_FIELD_LABELS: CopyFieldLabels = {
  copy: 'Copiar',
  copied: 'Copiado',
  copyFailed: 'Não foi possível copiar.',
  copyFailedSelected: 'Não foi possível copiar. O valor ficou selecionado para copiar pelo teclado.',
  hiddenValue: 'Valor oculto',
  hide: 'Ocultar',
  show: 'Mostrar',
};

export interface CopyFieldProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** O que o botao copiar anuncia depois de copiar. Padrao: o rotulo seguido de "copiado". */
  copiedAnnouncement?: string;
  hint?: string;
  label: string;
  /** Troca os textos dos botoes, do valor oculto e do aviso de falha. */
  labels?: Partial<CopyFieldLabels>;
  /**
   * Oculta o valor na tela, com o botao "Mostrar". O botao "Copiar" copia o valor inteiro mesmo oculto. O valor nunca
   * vai ao DOM enquanto oculto.
   */
  masked?: boolean;
  /** Chamado depois de copiar, como para registrar que a credencial foi copiada. Nao e chamado se a copia falhar. */
  onCopy?: () => void;
  value: string;
}

/** Valor copiavel: rotulo, valor em fonte mono e o botao "Copiar", que diz "Copiado" por alguns segundos. */
export function CopyField({
  className,
  copiedAnnouncement,
  hint,
  label,
  labels: customLabels,
  masked = false,
  onCopy,
  value,
  ...props
}: CopyFieldProps) {
  const labels = { ...DEFAULT_COPY_FIELD_LABELS, ...customLabels };
  const id = useId();
  const labelId = `copy-field-${id}-label`;
  const hintId = `copy-field-${id}-hint`;
  const valueRef = useRef<HTMLElement>(null);
  const { copy, count, status } = useCopyToClipboard(COPY_FEEDBACK_MS);
  // Guarda qual valor a pessoa revelou. Um valor novo ja nasce oculto no primeiro render, sem esperar um efeito, que
  // so roda depois da pintura e deixaria o valor novo a vista por um quadro.
  const [revealedValue, setRevealedValue] = useState<string | null>(null);

  if (revealedValue !== null && revealedValue !== value) {
    setRevealedValue(null);
  }

  const revealed = masked && revealedValue === value;
  const hidden = masked && !revealed;
  const copied = status === 'copied';
  const failed = status === 'failed';
  // So da para selecionar o que esta na tela: oculto, o valor nao esta no DOM.
  const failedMessage = hidden ? labels.copyFailed : labels.copyFailedSelected;

  async function copyValue() {
    if (await copy(value)) {
      onCopy?.();
    } else if (!hidden) {
      selectContents(valueRef.current);
    }
  }

  return (
    <div {...props} className={[styles.copyField, className].filter(Boolean).join(' ')}>
      <span className={styles.label} id={labelId}>
        {label}
      </span>
      <div aria-describedby={hint ? hintId : undefined} aria-labelledby={labelId} className={styles.row} role="group">
        {hidden ? (
          <span className={[styles.value, styles.masked].join(' ')}>
            <span aria-hidden="true">{MASK}</span>
            <VisuallyHidden>{labels.hiddenValue}</VisuallyHidden>
          </span>
        ) : (
          <code className={styles.value} ref={valueRef}>
            {value}
          </code>
        )}
        <div className={styles.actions}>
          {masked && (
            <Button onClick={() => setRevealedValue(revealed ? null : value)} size="md" variant="ghost">
              {revealed ? labels.hide : labels.show}
            </Button>
          )}
          {/* O rotulo do campo entra no nome: com varios campos na tela, cada botao diz o que copia. */}
          <Button onClick={() => void copyValue()} size="md" variant="secondary">
            {copied ? labels.copied : labels.copy}
            <VisuallyHidden> {label}</VisuallyHidden>
          </Button>
        </div>
      </div>
      {hint && (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      )}
      {/* Quem ve le a falha aqui; o leitor de tela a ouve pela regiao de status, por isso o texto visivel fica oculto a ele. */}
      {failed && (
        <span aria-hidden="true" className={styles.error}>
          {failedMessage}
        </span>
      )}
      {/* A chave troca o texto a cada copia, para a regiao anunciar de novo mesmo quando o texto se repete. */}
      <VisuallyHidden role="status">
        {status !== 'idle' && <span key={count}>{copied ? (copiedAnnouncement ?? `${label} copiado`) : failedMessage}</span>}
      </VisuallyHidden>
    </div>
  );
}
