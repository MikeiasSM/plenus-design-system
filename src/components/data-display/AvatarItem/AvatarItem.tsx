import { cloneElement, isValidElement, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Avatar, type AvatarProps } from '../Avatar';
import styles from './AvatarItem.module.css';

export interface AvatarItemProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'children'> {
  /**
   * O avatar, normalmente um `Avatar`, à esquerda do texto. O `Avatar` entra decorativo, porque o título já mostra o
   * nome; com `decorative={false}` nele, continua nomeado, para quando o título não é o nome.
   */
  avatar: ReactNode;
  /** Texto secundário abaixo do título. */
  description?: ReactNode;
  /** Texto principal. */
  title: ReactNode;
}

/* Sem isso, o leitor de tela lia o nome duas vezes: no avatar e no título ao lado. */
function decorativeAvatar(avatar: ReactNode) {
  if (isValidElement<AvatarProps>(avatar) && avatar.type === Avatar && avatar.props.decorative === undefined) {
    return cloneElement(avatar, { decorative: true });
  }

  return avatar;
}

export function AvatarItem({ avatar, className, description, title, ...props }: AvatarItemProps) {
  return (
    <div {...props} className={[styles.root, className].filter(Boolean).join(' ')}>
      <span className={styles.avatar}>{decorativeAvatar(avatar)}</span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
    </div>
  );
}
