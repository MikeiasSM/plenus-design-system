import type { ComponentPropsWithRef, ReactNode } from 'react';
import { DialogFrame } from './DialogFrame';
import styles from './Dialog.module.css';

export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogRole = 'dialog' | 'alertdialog';

/** O que o `Dialog` e o `Drawer` compartilham. As propriedades nativas vao ao elemento do dialogo. */
export interface DialogBaseProps extends Omit<ComponentPropsWithRef<'div'>, 'aria-label' | 'children' | 'role' | 'title'> {
  children?: ReactNode;
  dismissable?: boolean;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
}

export interface DialogTitledProps {
  'aria-label'?: never;
  description?: string;
  /** Opcional. Desenhado ao lado do titulo, fora da leitura: quem fala e o titulo. */
  icon?: ReactNode;
  title: string;
}

/** Sem titulo, sem cabecalho: o nome vem do `aria-label`, como na paleta de busca. Esc continua fechando. */
export interface DialogUntitledProps {
  'aria-label': string;
  description?: never;
  icon?: never;
  title?: never;
}

export type DialogProps = DialogBaseProps &
  (DialogTitledProps | DialogUntitledProps) & {
    /** `alertdialog` para a confirmacao que interrompe e exige resposta, como a de uma acao destrutiva. */
    role?: DialogRole;
    size?: DialogSize;
  };

export function Dialog({ size = 'md', ...props }: DialogProps) {
  return (
    <DialogFrame
      {...props}
      surfaceClassName={[styles.dialog, styles[size]].join(' ')}
      underlayClassName={styles.underlay}
    />
  );
}
