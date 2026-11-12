import type { ComponentPropsWithRef, ReactNode } from 'react';
import { DialogFrame } from './DialogFrame';
import styles from './Dialog.module.css';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';
export type DialogRole = 'dialog' | 'alertdialog';

/** O que o `Dialog` e o `Drawer` compartilham. As propriedades nativas vão ao elemento do diálogo. */
export interface DialogBaseProps extends Omit<ComponentPropsWithRef<'div'>, 'aria-label' | 'children' | 'role' | 'title'> {
  children?: ReactNode;
  /** Aberto no inicio, no modo não controlado. */
  defaultOpen?: boolean;
  dismissable?: boolean;
  footer?: ReactNode;
  /**
   * Consultado antes de fechar por Esc, pelo clique no véu ou pelo botão Fechar. Devolver `false`, ou uma
   * promessa que resolve `false`, mantém aberto, como numa confirmação de alterações não salvas. Não vale para
   * quando o produto muda `open`, que é decisão dele.
   */
  onBeforeClose?: () => boolean | Promise<boolean>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  /** Elemento que recebe o overlay. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
}

export interface DialogTitledProps {
  'aria-label'?: never;
  description?: string;
  /** Opcional. Desenhado ao lado do título, fora da leitura: quem fala e o título. */
  icon?: ReactNode;
  title: string;
}

/** Sem título, sem cabeçalho: o nome vem do `aria-label`, como na paleta de busca. Esc continua fechando. */
export interface DialogUntitledProps {
  'aria-label': string;
  description?: never;
  icon?: never;
  title?: never;
}

export type DialogProps = DialogBaseProps &
  (DialogTitledProps | DialogUntitledProps) & {
    /** `alertdialog` para a confirmação que interrompe e exige resposta, como a de uma ação destrutiva. */
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
