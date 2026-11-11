import type { ComponentPropsWithRef, CSSProperties, ElementType } from 'react';
import styles from './PageHeader.module.css';
import { IconChevronLeft } from '../../icons';

const join = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

export interface PageHeaderProps extends ComponentPropsWithRef<'header'> {
  /** Largura da coluna do cabeçalho, para acompanhar a do conteúdo: `760px`, `1120px`. Sem ela, usa a largura toda. */
  maxWidth?: CSSProperties['maxWidth'];
}

/** Cabeçalho da página, separado do conteúdo por uma linha na largura do elemento que o contém. */
export function PageHeader({ children, className, maxWidth, ...props }: PageHeaderProps) {
  return (
    <header {...props} className={join(styles.header, className)}>
      <div className={styles.grid} style={{ maxWidth }}>
        {children}
      </div>
    </header>
  );
}

export interface PageHeaderBackProps extends ComponentPropsWithRef<'a'> {
  /** Componente de link da aplicação, para não acoplar o sistema a um roteador. */
  as?: ElementType;
  /**
   * Nome acessível do link (`aria-label`). Deve conter o texto visível (WCAG 2.5.3): com `children` "Pedidos",
   * `label` "Voltar para Pedidos".
   */
  label: string;
  /** Propriedades entregues inteiras ao componente de link, para o roteador que não usa `href`. */
  linkProps?: Record<string, unknown>;
}

/** Link de retorno acima do título, com a seta e o texto visível: `children`, ou o `label` quando não houver. */
function PageHeaderBack({ as: Link = 'a', children, className, label, linkProps, ...props }: PageHeaderBackProps) {
  return (
    <Link {...props} {...linkProps} aria-label={label} className={join(styles.back, className)}>
      <IconChevronLeft className={styles.backIcon} size={16} />
      {children ?? label}
    </Link>
  );
}

export type PageHeaderTitleProps = ComponentPropsWithRef<'h1'>;

function PageHeaderTitle({ className, ...props }: PageHeaderTitleProps) {
  return <h1 {...props} className={join(styles.title, className)} />;
}

export type PageHeaderBadgesProps = ComponentPropsWithRef<'div'>;

/** Selos de situação ao lado do título. */
function PageHeaderBadges({ className, ...props }: PageHeaderBadgesProps) {
  return <div {...props} className={join(styles.badges, className)} />;
}

export type PageHeaderDescriptionProps = ComponentPropsWithRef<'p'>;

function PageHeaderDescription({ className, ...props }: PageHeaderDescriptionProps) {
  return <p {...props} className={join(styles.description, className)} />;
}

export type PageHeaderContextProps = ComponentPropsWithRef<'div'>;

/** Linha de contexto sob a descrição: quem criou, quando mudou, a que pertence. */
function PageHeaderContext({ className, ...props }: PageHeaderContextProps) {
  return <div {...props} className={join(styles.context, className)} />;
}

export type PageHeaderActionsProps = ComponentPropsWithRef<'div'>;

/** Ações da página, à direita. A principal vai por último; o excedente cabe num `Menu`. */
function PageHeaderActions({ className, ...props }: PageHeaderActionsProps) {
  return <div {...props} className={join(styles.actions, className)} />;
}

export type PageHeaderSearchProps = ComponentPropsWithRef<'div'>;

/** Espaço da busca, no lado direito. O campo é do produto e leva o próprio nome acessível. */
function PageHeaderSearch({ className, ...props }: PageHeaderSearchProps) {
  return <div {...props} className={join(styles.search, className)} />;
}

PageHeader.Back = PageHeaderBack;
PageHeader.Title = PageHeaderTitle;
PageHeader.Badges = PageHeaderBadges;
PageHeader.Description = PageHeaderDescription;
PageHeader.Context = PageHeaderContext;
PageHeader.Actions = PageHeaderActions;
PageHeader.Search = PageHeaderSearch;
