import type { ElementType } from 'react';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
  href?: string;
  label: string;
}

export interface BreadcrumbProps {
  /** Componente de link da aplicacao, para nao acoplar o sistema a um roteador. */
  as?: ElementType;
  items: readonly BreadcrumbItem[];
  label?: string;
}

export function Breadcrumb({ as: Link = 'a', items, label = 'Trilha de navegacao' }: BreadcrumbProps) {
  return (
    <nav aria-label={label}>
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
                <Link className={styles.link} href={item.href}>
                  {item.label}
                </Link>
              )}
              {!atual && (
                <svg className={styles.separator} viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
