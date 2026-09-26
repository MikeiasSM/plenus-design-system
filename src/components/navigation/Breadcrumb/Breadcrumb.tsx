import type { ComponentPropsWithRef, ElementType } from 'react';
import styles from './Breadcrumb.module.css';
import { IconChevronRight } from '../../icons';

export interface BreadcrumbItem {
  href?: string;
  label: string;
  /**
   * Propriedades entregues inteiras ao componente de link. Serve ao roteador
   * que nao usa `href` — o do React Router pede `to`.
   */
  linkProps?: Record<string, unknown>;
}

export interface BreadcrumbProps extends ComponentPropsWithRef<'nav'> {
  /** Componente de link da aplicacao, para nao acoplar o sistema a um roteador. */
  as?: ElementType;
  items: readonly BreadcrumbItem[];
  label?: string;
}

export function Breadcrumb({
  as: Link = 'a',
  className,
  items,
  label = 'Trilha de navegacao',
  ...props
}: BreadcrumbProps) {
  return (
    <nav {...props} aria-label={label} className={className}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const atual = index === items.length - 1;

          return (
            <li className={styles.item} key={`${item.label}-${index}`}>
              {atual || !item.href ? (
                <span className={styles.current} aria-current={atual ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link className={styles.link} href={item.href} {...item.linkProps}>
                  {item.label}
                </Link>
              )}
              {!atual && (
                <IconChevronRight className={styles.separator} size={12} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
