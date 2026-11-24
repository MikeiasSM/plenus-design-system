import type { ComponentPropsWithRef, ReactNode } from 'react';
import { IconSearch } from '../../icons';
import styles from './EmptyState.module.css';

export type EmptyStateSize = 'sm' | 'md' | 'lg';
export type EmptyStateTone = 'neutral' | 'danger';

export interface EmptyStateProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Uma ou duas acoes: a secundaria antes da principal. */
  actions?: ReactNode;
  description?: ReactNode;
  /**
   * Nivel de titulo do `title`, quando o vazio ocupa uma secao da pagina e o titulo entra no indice dela. Sem ele, o
   * titulo e um paragrafo, com o mesmo desenho.
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Sem icone proprio, a lupa. */
  icon?: ReactNode;
  size?: EmptyStateSize;
  title: ReactNode;
  tone?: EmptyStateTone;
}

export function EmptyState({
  actions,
  className,
  description,
  headingLevel,
  icon = <IconSearch />,
  size = 'md',
  title,
  tone = 'neutral',
  ...props
}: EmptyStateProps) {
  // Os cartoes contam que o conteudo ainda nao chegou: nao cabem no tamanho pequeno nem na falha.
  const withCards = size !== 'sm' && tone === 'neutral';
  const Title = headingLevel ? (`h${headingLevel}` as const) : 'p';

  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      {...props}
      className={[styles.emptyState, styles[size], styles[tone], className].filter(Boolean).join(' ')}
    >
      <div className={styles.visual}>
        {withCards && (
          <>
            <span aria-hidden="true" className={[styles.card, styles.cardBehind].join(' ')}>
              <span />
              <span />
              <span />
            </span>
            <span aria-hidden="true" className={[styles.card, styles.cardFront].join(' ')}>
              <span />
              <span />
              <span />
            </span>
          </>
        )}
        <span aria-hidden="true" className={styles.icon}>
          {icon}
        </span>
      </div>
      <div className={styles.text}>
        <Title className={styles.title}>{title}</Title>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
