import type { ComponentPropsWithRef, ReactNode } from 'react';
import { useInsideLiveRegion } from '../../../hooks/useInsideLiveRegion';
import { IconCheck, IconExclamationCircle } from '../../icons';
import { Spinner } from '../../feedback/Spinner';
import styles from './SaveStatus.module.css';

/**
 * A situação do salvamento: `idle`, sem nada a dizer; `dirty`, com alteração pendente; `saving`, em curso;
 * `saved`, concluído; `error`, que falhou.
 */
export type SaveStatusValue = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface SaveStatusProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** O texto da situação, escrito pelo produto, como "Rascunho salvo às 10:42". */
  children?: ReactNode;
  /** A situação, que escolhe o indicador ao lado do texto. Padrão: `idle`. */
  status?: SaveStatusValue;
}

// Só o que está em curso, concluído ou falhou ganha indicador, como no InlineLoading do Carbon. `dirty` e `idle` ficam
// só com o texto: a alteração pendente não é um erro nem um aviso, e o texto já a diz sem depender de cor.
function Indicador({ status }: { status: SaveStatusValue }) {
  if (status === 'saving') {
    return <Spinner size="sm" />;
  }

  if (status === 'saved') {
    return <IconCheck className={styles.saved} size={14} />;
  }

  if (status === 'error') {
    return <IconExclamationCircle className={styles.error} size={14} />;
  }

  return null;
}

/**
 * Texto curto da situação do salvamento, com o indicador do estado. A região é um `role="status"` sempre montada, para
 * a mudança do texto ser lida sem tirar o foco de onde a pessoa está. Dentro de uma região que já anuncia, como a
 * situação do `AppShell.PageFooter`, ela não cria outra: o texto é lido pela de fora.
 */
export function SaveStatus({ children, className, status = 'idle', ...props }: SaveStatusProps) {
  const dentroDeRegiao = useInsideLiveRegion();

  return (
    <div
      aria-live={dentroDeRegiao ? undefined : 'polite'}
      {...props}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-status={status}
      role={dentroDeRegiao ? undefined : 'status'}
    >
      <Indicador status={status} />
      {children}
    </div>
  );
}
