import type { ComponentPropsWithRef, MouseEvent } from 'react';
import styles from './SkipLink.module.css';

export interface SkipLinkProps extends ComponentPropsWithRef<'a'> {
  /** Ancora do conteudo principal, como `#conteudo`. */
  href: string;
}

/** Primeiro item da pagina para quem navega por teclado: some ate receber foco e leva direto ao conteudo. */
export function SkipLink({ children = 'Pular para o conteúdo', className, onClick, ...props }: SkipLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    const href = event.currentTarget.getAttribute('href') ?? '';
    const id = href.startsWith('#') ? decodeURIComponent(href.slice(1)) : '';
    const target = id ? document.getElementById(id) : null;

    // Sem alvo na página, o link segue o comportamento nativo.
    if (!target) {
      return;
    }

    event.preventDefault();

    // O conteúdo principal costuma não ser focável: o tabindex -1 deixa o script focá-lo sem pô-lo na ordem do Tab.
    if (target.tabIndex < 0 && !target.hasAttribute('tabindex')) {
      target.tabIndex = -1;
    }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  }

  return (
    <a {...props} className={[styles.skipLink, className].filter(Boolean).join(' ')} onClick={handleClick}>
      {children}
    </a>
  );
}
