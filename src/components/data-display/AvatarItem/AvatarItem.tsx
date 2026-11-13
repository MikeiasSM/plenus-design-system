import type { ComponentPropsWithRef, ReactNode } from 'react';
import styles from './AvatarItem.module.css';

export interface AvatarItemProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'children'> {
  /** O avatar, normalmente um `Avatar`, à esquerda do texto. */
  avatar: ReactNode;
  /** Texto secundário abaixo do título. */
  description?: ReactNode;
  /** Texto principal. */
  title: ReactNode;
}

export function AvatarItem({ avatar, className, description, title, ...props }: AvatarItemProps) {
  return (
    <div {...props} className={[styles.root, className].filter(Boolean).join(' ')}>
      <span className={styles.avatar}>{avatar}</span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
    </div>
  );
}
