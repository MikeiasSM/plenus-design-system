import { useEffect, useState, type HTMLAttributes, type Ref, type SyntheticEvent } from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps extends HTMLAttributes<HTMLElement> {
  /**
   * Some da árvore de acessibilidade: a foto sai com `alt=""` e as iniciais com `aria-hidden`. Para quando o nome já
   * está escrito ao lado, como no `AvatarItem`, e o leitor de tela o leria duas vezes.
   */
  decorative?: boolean;
  /** Iniciais no lugar das que saem do `name`, como a sigla de uma entidade. */
  initials?: string;
  name: string;
  /** A raiz e o `img` com a foto, ou o `span` com as iniciais. */
  ref?: Ref<HTMLElement>;
  size?: AvatarSize;
  src?: string;
}

function getInitials(name: string) {
  const names = name.trim().split(/\s+/).filter(Boolean);
  return names.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

export function Avatar({
  className,
  decorative = false,
  initials,
  name,
  onError,
  ref,
  size = 'md',
  src,
  ...props
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src) && !imageFailed;
  /* O fundo é só das iniciais: na foto, ele aparecia nas bordas transparentes e no recorte do círculo. */
  const classes = [styles.avatar, styles[size], showImage ? styles.photo : styles.initials, className]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  function handleError(event: SyntheticEvent<HTMLElement, Event>) {
    setImageFailed(true);
    onError?.(event);
  }

  if (!showImage) {
    const text = initials?.trim() || getInitials(name);

    return decorative ? (
      <span {...props} ref={ref as Ref<HTMLSpanElement>} className={classes} aria-hidden="true">
        {text}
      </span>
    ) : (
      <span {...props} ref={ref as Ref<HTMLSpanElement>} className={classes} role="img" aria-label={name}>
        {text}
      </span>
    );
  }

  return (
    <img
      {...props}
      ref={ref as Ref<HTMLImageElement>}
      className={classes}
      src={src}
      alt={decorative ? '' : name}
      onError={handleError}
    />
  );
}
