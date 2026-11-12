import type { ComponentPropsWithRef, ReactNode } from 'react';
import { IconSearch } from '../../icons';
import styles from './EmptyState.module.css';

export type EmptyStateSize = 'sm' | 'md' | 'lg';
export type EmptyStateTone = 'neutral' | 'danger';

export interface EmptyStateProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Uma ou duas acoes: a secundaria antes da principal. */
  actions?: ReactNode;
  description?: ReactNode;
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
  icon = <IconSearch />,
  size = 'md',
  title,
  tone = 'neutral',
  ...props
}: EmptyStateProps) {
  // Os cartoes contam que o conteudo ainda nao chegou: nao cabem no tamanho pequeno nem na falha.
  const withCards = size !== 'sm' && tone === 'neutral';

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
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
