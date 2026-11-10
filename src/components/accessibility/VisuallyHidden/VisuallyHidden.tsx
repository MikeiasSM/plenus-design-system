import type { ComponentPropsWithRef, ElementType } from 'react';
import styles from './VisuallyHidden.module.css';

export interface VisuallyHiddenProps extends ComponentPropsWithRef<'span'> {
  /** Elemento ou componente que renderiza o conteúdo. O padrão é `span`. */
  as?: ElementType;
}

export function VisuallyHidden({ as: Elemento = 'span', className, ...props }: VisuallyHiddenProps) {
  return <Elemento {...props} className={[styles.root, className].filter(Boolean).join(' ')} />;
}
