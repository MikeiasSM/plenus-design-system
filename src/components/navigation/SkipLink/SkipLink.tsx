import type { ComponentPropsWithRef } from 'react';
import styles from './SkipLink.module.css';

export interface SkipLinkProps extends ComponentPropsWithRef<'a'> {
  /** Âncora do conteúdo principal, como `#conteudo`. */
  href: string;
}

/** Primeiro item da página para quem navega por teclado: some até receber foco e leva direto ao conteúdo. */
export function SkipLink({ children = 'Pular para o conteúdo', className, ...props }: SkipLinkProps) {
  return (
    <a {...props} className={[styles.skipLink, className].filter(Boolean).join(' ')}>
      {children}
    </a>
  );
}
