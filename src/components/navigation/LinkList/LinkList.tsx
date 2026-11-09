import { createContext, useContext, type ComponentPropsWithRef, type ElementType, type ReactNode } from 'react';
import { IconChevronRight } from '../../icons';
import styles from './LinkList.module.css';

export type LinkListLayout = 'list' | 'grid';
export type LinkListTone = 'neutral' | 'danger';

export interface LinkListProps extends ComponentPropsWithRef<'ul'> {
  /** Componente de link da aplicação, como no Breadcrumb. */
  as?: ElementType;
  /** `list`, o padrão: linhas com divisória e seta. `grid`: células numa grade que se ajusta à largura. */
  layout?: LinkListLayout;
}

export interface LinkListItemProps extends Omit<ComponentPropsWithRef<'a'>, 'title' | 'children'> {
  /** Explicação abaixo do título. */
  description?: ReactNode;
  href?: string;
  icon?: ReactNode;
  /** Propriedades entregues ao componente de link, para o roteador que não usa `href`. */
  linkProps?: Record<string, unknown>;
  title: string;
  /** `danger` marca o item que pede atenção. */
  tone?: LinkListTone;
  /** Complemento ao fim da linha, como uma contagem. */
  trailing?: ReactNode;
}

interface LinkListContextValue {
  as: ElementType;
  layout: LinkListLayout;
}

const LinkListContext = createContext<LinkListContextValue>({ as: 'a', layout: 'list' });

function LinkListRoot({ as = 'a', className, layout = 'list', ...props }: LinkListProps) {
  return (
    <LinkListContext value={{ as, layout }}>
      <ul {...props} className={[styles.root, className].filter(Boolean).join(' ')} data-layout={layout} />
    </LinkListContext>
  );
}

function LinkListItem({
  className,
  description,
  href,
  icon,
  linkProps,
  title,
  tone = 'neutral',
  trailing,
  ...props
}: LinkListItemProps) {
  const { as: Link, layout } = useContext(LinkListContext);

  return (
    <li className={styles.item}>
      <Link {...props} {...linkProps} className={[styles.link, className].filter(Boolean).join(' ')} data-tone={tone} href={href}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={styles.text}>
          <span className={styles.title}>{title}</span>
          {description && <span className={styles.description}>{description}</span>}
        </span>
        {trailing != null && <span className={styles.trailing}>{trailing}</span>}
        {layout === 'list' && <IconChevronRight aria-hidden="true" className={styles.chevron} size={16} />}
      </Link>
    </li>
  );
}

export const LinkList = Object.assign(LinkListRoot, { Item: LinkListItem });
