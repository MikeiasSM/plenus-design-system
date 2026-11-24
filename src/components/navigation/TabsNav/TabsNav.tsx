import type { ComponentPropsWithRef, ElementType, ReactNode } from 'react';
import { TabLabel, temAcoes, type TabsAppearance } from '../Tabs/Tabs';
import tabsStyles from '../Tabs/Tabs.module.css';
import styles from './TabsNav.module.css';
import { thinScrollbar } from '../../../utils/scrollbar/scrollbar';

export interface TabsNavItem {
  /** Quantidade mostrada num selo depois do rótulo. Entra no nome do link: "Rótulo, N". */
  count?: number;
  href?: string;
  /** Ícone decorativo antes do rótulo, fora do nome acessível. */
  icon?: ReactNode;
  key: string;
  label: string;
  /** Propriedades entregues ao componente de link, para o roteador que não usa `href`. A `className` soma às da biblioteca. */
  linkProps?: Record<string, unknown>;
}

export interface TabsNavProps extends Omit<ComponentPropsWithRef<'nav'>, 'aria-label'> {
  /** Ações ao lado das abas, como um botão. Ficam fora da lista, num envoltório com a linha da faixa. */
  actions?: ReactNode;
  appearance?: TabsAppearance;
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
export function TabsNav({
  actions,
  appearance = 'underline',
  as: Link = 'a',
  className,
  current,
  fitted = false,
  items,
  label,
  ...props
}: TabsNavProps) {
  const segmentado = appearance === 'segmented';
  const lista = (
    <ul className={[styles.list, segmentado && tabsStyles.rail, thinScrollbar].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const atual = item.key === current;
        // A classe e o `aria-current` do item somam aos da biblioteca: o link continua com o desenho da aba, e a
        // aba atual continua anunciada como a página.
        const { 'aria-current': ariaCurrent, className: classeDoItem, ...linkProps } = item.linkProps ?? {};

        return (
          <li className={styles.item} key={item.key}>
            <Link
              href={item.href}
              {...linkProps}
              aria-current={atual ? 'page' : ariaCurrent}
              className={[
                `${styles.link} ${tabsStyles.tab}`,
                atual && `${styles.current} ${tabsStyles.active}`,
                typeof classeDoItem === 'string' && classeDoItem,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <TabLabel count={item.count} icon={item.icon} label={item.label} />
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav
      {...props}
      aria-label={label}
      className={[
        styles.tabsNav,
        segmentado && tabsStyles.segmented,
        fitted && styles.fitted,
        fitted && segmentado && tabsStyles.fitted,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {temAcoes(actions) ? (
        <div className={[tabsStyles.bar, styles.bar].join(' ')}>
          {lista}
          <div className={tabsStyles.actions}>{actions}</div>
        </div>
      ) : (
        lista
      )}
    </nav>
  );
}
