import type { ElementType } from 'react';
import styles from './Breadcrumb.module.css';
import { IconChevronRight } from '../../icons';

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
                <IconChevronRight className={styles.separator} size={12} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
