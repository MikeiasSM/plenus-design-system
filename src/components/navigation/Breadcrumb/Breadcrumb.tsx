import { useRef, type ComponentPropsWithRef, type ElementType } from 'react';
import styles from './Breadcrumb.module.css';
import { IconChevronRight } from '../../icons';
import { Menu, type MenuItem } from '../../overlays/Menu';

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
  /**
   * Trilha numa linha so: o primeiro nivel, os intermediarios recolhidos num botao "…" que abre um menu com eles,
   * e o ultimo, cortado com reticencias quando nao cabe. Vale com tres niveis ou mais.
   */
  compact?: boolean;
  /** Comeco do nome do botao "…", seguido dos niveis recolhidos. Padrao "Níveis intermediários". */
  compactLabel?: string;
  items: readonly BreadcrumbItem[];
  label?: string;
}

function hasLink(item: BreadcrumbItem) {
  return item.href !== undefined || item.linkProps !== undefined;
}

export function Breadcrumb({
  as: Link = 'a',
  className,
  compact = false,
  compactLabel = 'Níveis intermediários',
  items,
  label = 'Trilha de navegação',
  ...props
}: BreadcrumbProps) {
  // Os links dos niveis recolhidos ficam no DOM, fora da vista e da arvore de acessibilidade; o item do menu os aciona,
  // e assim o componente de link da aplicacao (e o roteador dele) cuida da navegacao, como nos niveis a vista.
  const hiddenLinks = useRef<(HTMLSpanElement | null)[]>([]);
  const collapsed = compact && items.length > 2;
  const separator = <IconChevronRight className={styles.separator} size={12} />;

  function renderLevel(item: BreadcrumbItem, atual: boolean) {
    if (atual) {
      return (
        <span className={styles.current} aria-current="page">
          {item.label}
        </span>
      );
    }

    // Nivel sem destino: texto da trilha, sem o peso da pagina atual.
    if (!hasLink(item)) {
      return <span className={styles.text}>{item.label}</span>;
    }

    return (
      <Link className={styles.link} href={item.href} {...item.linkProps}>
        {item.label}
      </Link>
    );
  }

  if (collapsed) {
    const first = items[0];
    const middle = items.slice(1, -1);
    const last = items[items.length - 1];
    const menuItems: MenuItem[] = middle.map((item, index) => ({
      disabled: !hasLink(item),
      key: `${item.label}-${index}`,
      label: item.label,
      onSelect: () => (hiddenLinks.current[index]?.firstElementChild as HTMLElement | null)?.click(),
    }));

    return (
      <nav {...props} aria-label={label} className={className}>
        <ol className={[styles.list, styles.compact].join(' ')}>
          <li className={styles.item}>
            {renderLevel(first, false)}
            {separator}
          </li>
          <li className={styles.item}>
            <Menu items={menuItems} label={compactLabel}>
              <button
                aria-label={`${compactLabel}: ${middle.map((item) => item.label).join(', ')}`}
                className={styles.more}
                type="button"
              >
                <span aria-hidden="true">…</span>
              </button>
            </Menu>
            {middle.map((item, index) =>
              hasLink(item) ? (
                <span
                  hidden
                  key={`${item.label}-${index}`}
                  ref={(node) => {
                    hiddenLinks.current[index] = node;
                  }}
                >
                  <Link href={item.href} tabIndex={-1} {...item.linkProps}>
                    {item.label}
                  </Link>
                </span>
              ) : null,
            )}
            {separator}
          </li>
          <li className={[styles.item, styles.last].join(' ')}>{renderLevel(last, true)}</li>
        </ol>
      </nav>
    );
  }

  return (
    <nav {...props} aria-label={label} className={className}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const atual = index === items.length - 1;

          return (
            <li className={styles.item} key={`${item.label}-${index}`}>
              {renderLevel(item, atual)}
              {!atual && separator}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
