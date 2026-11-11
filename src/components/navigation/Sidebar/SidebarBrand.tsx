import { useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ElementType, type ReactNode } from 'react';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import { Tooltip } from '../../overlays/Tooltip';
import { Text } from '../../typography/Text';
import { SidebarAction, type SidebarActionProps } from './SidebarAction';
import { useSidebarBrandPlace } from './SidebarBrand.context';
import { readSidebarBrandTheme, watchSidebarBrandTheme, type SidebarBrandTheme } from './SidebarBrand.theme';
import styles from './SidebarBrand.module.css';

export interface SidebarBrandProps extends Omit<SidebarActionProps, 'aria-label' | 'children' | 'type'> {
  /** Componente de link da aplicação, como no `Sidebar.Item`. */
  as?: ElementType;
  /** Linha de apoio abaixo do nome, no submenu. */
  description?: ReactNode;
  /** O símbolo do produto, mostrado no trilho. */
  logo?: ReactNode;
  /** Com `true`, o logo fica num quadrado na cor principal; com `false`, aparece puro, contido nos mesmos 36 × 36 px. */
  logoFrame?: boolean;
  /** Nome do produto: visível no submenu e nome acessível no trilho. */
  name: string;
  /** O logotipo-imagem, que toma o lugar do nome e da descrição no submenu. Sem `dark`, o `light` vale nos dois temas. */
  wordmark?: { dark?: ReactNode; light: ReactNode };
}

/** O logotipo do tema em vigor naquele ponto. A sonda só existe com a versão escura. */
function Wordmark({ wordmark }: { wordmark: NonNullable<SidebarBrandProps['wordmark']> }) {
  const probeRef = useRef<HTMLSpanElement>(null);
  const [theme, setTheme] = useState<SidebarBrandTheme>('light');
  const hasDark = wordmark.dark != null;

  useLayoutEffect(() => {
    const probe = probeRef.current;

    if (!hasDark || !probe) {
      return;
    }

    const update = () => setTheme(readSidebarBrandTheme(probe));
    update();
    return watchSidebarBrandTheme(update);
  }, [hasDark]);

  return (
    <span aria-hidden="true" className={styles.wordmark}>
      {hasDark && <span className={styles.probe} ref={probeRef} />}
      {hasDark && theme === 'dark' ? wordmark.dark : wordmark.light}
    </span>
  );
}

/** A marca do produto, no `brand` do `Sidebar.Rail` e do `Sidebar.Panel`: no trilho, o símbolo; no submenu, o nome e a descrição ou o logotipo. */
export function SidebarBrand({
  as,
  className,
  description,
  href,
  linkProps,
  logo,
  logoFrame = true,
  name,
  wordmark,
  ...props
}: SidebarBrandProps) {
  const place = useSidebarBrandPlace();
  const isRail = place === 'rail';
  const isLink = href !== undefined || linkProps !== undefined;

  if (isRail && !logo) {
    return null;
  }

  const content = isRail ? (
    <span aria-hidden="true" className={[styles.logo, logoFrame && styles.framed].filter(Boolean).join(' ')}>
      {logo}
    </span>
  ) : wordmark ? (
    <>
      <Wordmark wordmark={wordmark} />
      <VisuallyHidden>{name}</VisuallyHidden>
    </>
  ) : (
    <>
      <Text truncate variant="title">
        {name}
      </Text>
      {description && (
        <Text tone="tertiary" truncate variant="micro">
          {description}
        </Text>
      )}
    </>
  );

  const classes = [isRail ? styles.railBrand : styles.panelBrand, isLink && styles.link, className].filter(Boolean).join(' ');

  if (!isLink) {
    return (
      <span
        {...(props as ComponentPropsWithRef<'span'>)}
        aria-label={isRail ? name : undefined}
        className={classes}
        role={isRail ? 'img' : undefined}
      >
        {content}
      </span>
    );
  }

  const link = (
    <SidebarAction {...props} aria-label={isRail ? name : undefined} as={as} className={classes} href={href} linkProps={linkProps}>
      {content}
    </SidebarAction>
  );

  return isRail ? (
    <Tooltip content={name} delay={150} placement="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}
