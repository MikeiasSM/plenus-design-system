import { useEffect, useState, type HTMLAttributes, type SyntheticEvent } from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps extends HTMLAttributes<HTMLElement> {
  name: string;
  size?: AvatarSize;
  src?: string;
}

function getInitials(name: string) {
  const names = name.trim().split(/\s+/).filter(Boolean);
  return names.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

export function Avatar({ className, name, onError, size = 'md', src, ...props }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const classes = [styles.avatar, styles[size], className].filter(Boolean).join(' ');
  const showImage = Boolean(src) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  function handleError(event: SyntheticEvent<HTMLElement, Event>) {
    setImageFailed(true);
    onError?.(event);
  }

  if (!showImage) {
    return (
      <span {...props} className={classes} role="img" aria-label={name}>
        {getInitials(name)}
      </span>
    );
  }

  return <img {...props} className={classes} src={src} alt={name} onError={handleError} />;
}
