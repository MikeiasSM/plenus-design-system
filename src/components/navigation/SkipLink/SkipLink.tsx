import type { ComponentPropsWithRef } from 'react';
import styles from './SkipLink.module.css';

export interface SkipLinkProps extends ComponentPropsWithRef<'a'> {
  /** Ancora do conteudo principal, como `#conteudo`. */
  href: string;
}

/** Primeiro item da pagina para quem navega por teclado: some ate receber foco e leva direto ao conteudo. */
export function SkipLink({ children = 'Pular para o conteúdo', className, ...props }: SkipLinkProps) {
  return (
    <a {...props} className={[styles.skipLink, className].filter(Boolean).join(' ')}>
      {children}
    </a>
  );
}
