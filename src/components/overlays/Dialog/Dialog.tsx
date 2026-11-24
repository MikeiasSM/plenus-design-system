import type { ComponentPropsWithRef, ReactNode } from 'react';
import { DialogFrame } from './DialogFrame';
import styles from './Dialog.module.css';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';
export type DialogRole = 'dialog' | 'alertdialog';
export type DialogPlacement = 'center' | 'top';

/** O que o `Dialog` e o `Drawer` compartilham. As propriedades nativas vao ao elemento do dialogo. */
export interface DialogBaseProps extends Omit<ComponentPropsWithRef<'div'>, 'aria-label' | 'children' | 'role' | 'title'> {
  children?: ReactNode;
  /** Aberto no inicio, no modo nao controlado. */
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
  /** Texto, com ênfase ou link se preciso: vai num parágrafo e é a descrição acessível do diálogo. */
  description?: ReactNode;
  /**
   * Dica curta sobre o diálogo, num ícone de ajuda ao lado do título, fora dele: não entra no nome do diálogo, e o
   * ícone, focável, abre a dica no ponteiro e no foco.
   */
  help?: string;
  /** Opcional. Desenhado ao lado do titulo, fora da leitura: quem fala e o titulo. */
  icon?: ReactNode;
  /** Nome do diálogo. Pode ter ênfase, mas nada interativo: é o conteúdo do `h2`. */
  title: ReactNode;
}

/** Sem titulo, sem cabecalho: o nome vem do `aria-label`, como na paleta de busca. Esc continua fechando. */
export interface DialogUntitledProps {
  'aria-label': string;
  description?: never;
  help?: never;
  icon?: never;
  title?: never;
}

export type DialogProps = DialogBaseProps &
  (DialogTitledProps | DialogUntitledProps) & {
    /** Corpo sem o respiro interno, para o conteúdo que desenha a própria margem, como uma lista ou uma tabela. */
    flush?: boolean;
    /**
     * `center`, o padrão, centraliza o cartão na altura. `top` o prende perto do topo, a 12% da altura da janela,
     * para o diálogo cuja altura muda com o conteúdo, como uma busca, não pular a cada resultado.
     */
    placement?: DialogPlacement;
    /** `alertdialog` para a confirmacao que interrompe e exige resposta, como a de uma acao destrutiva. */
    role?: DialogRole;
    size?: DialogSize;
  };

export function Dialog({ placement = 'center', size = 'md', ...props }: DialogProps) {
  return (
    <DialogFrame
      {...props}
      surfaceClassName={[styles.dialog, styles[size], placement === 'top' && styles.top].filter(Boolean).join(' ')}
      underlayClassName={styles.underlay}
    />
  );
}
