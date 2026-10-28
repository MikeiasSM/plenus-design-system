import type { ComponentPropsWithRef, ElementType } from 'react';
import tabsStyles from '../Tabs/Tabs.module.css';
import styles from './TabsNav.module.css';

export interface TabsNavItem {
  href?: string;
  key: string;
  label: string;
  /** Propriedades entregues inteiras ao componente de link, para o roteador que não usa `href`. */
  linkProps?: Record<string, unknown>;
}

export interface TabsNavProps extends Omit<ComponentPropsWithRef<'nav'>, 'aria-label'> {
  /** Componente de link da aplicação, para não acoplar o sistema a um roteador. */
  as?: ElementType;
  /** Chave da aba do endereço atual. */
  current: string;
  /** As abas dividem a largura em partes iguais, em vez de ficar do tamanho do rótulo. */
  fitted?: boolean;
  items: readonly TabsNavItem[];
  label: string;
}

/** Abas que são endereços: cada uma é um link, e a da página atual leva `aria-current="page"`. */
export function TabsNav({ as: Link = 'a', className, current, fitted = false, items, label, ...props }: TabsNavProps) {
  return (
    <nav {...props} aria-label={label} className={[styles.tabsNav, fitted && styles.fitted, className].filter(Boolean).join(' ')}>
      <ul className={styles.list}>
        {items.map((item) => {
          const atual = item.key === current;

          return (
            <li className={styles.item} key={item.key}>
              <Link
                aria-current={atual ? 'page' : undefined}
                className={[`${styles.link} ${tabsStyles.tab}`, atual && `${styles.current} ${tabsStyles.active}`].filter(Boolean).join(' ')}
                href={item.href}
                {...item.linkProps}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
