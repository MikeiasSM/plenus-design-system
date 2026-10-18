import type { ComponentPropsWithRef, ReactNode } from 'react';
import { DialogFrame } from './DialogFrame';
import styles from './Dialog.module.css';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogRole = 'dialog' | 'alertdialog';

/** As propriedades nativas vao ao elemento do dialogo; o `className` soma ao do sistema. */
export interface DialogProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'role' | 'title'> {
  children?: ReactNode;
  description?: string;
  dismissable?: boolean;
  footer?: ReactNode;
  /** Opcional. Desenhado ao lado do titulo, fora da leitura: quem fala e o titulo. */
  icon?: ReactNode;
  onClose: () => void;
  open: boolean;
  /** `alertdialog` para a confirmacao que interrompe e exige resposta, como a de uma acao destrutiva. */
  role?: DialogRole;
  size?: DialogSize;
  title: string;
}

export function Dialog({ size = 'md', ...props }: DialogProps) {
  return (
    <DialogFrame
      {...props}
      surfaceClassName={[styles.dialog, styles[size]].join(' ')}
      underlayClassName={styles.underlay}
    />
  );
}
