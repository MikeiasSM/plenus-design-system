import { useEffect, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react';
import { IconCheckCircle, IconExclamationCircle, IconFile } from '../../icons';
import { Icon } from '../../icons/Icon';
import styles from './FilePreview.module.css';

/** `image` mostra a imagem; `video` mostra o poster com a marca de play; `file` mostra so o icone. */
export type FilePreviewKind = 'image' | 'video' | 'file';
/** O estado aparece na borda e num icone no canto. O progresso so em `uploading`. */
export type FilePreviewStatus = 'idle' | 'uploading' | 'done' | 'error';
/** 40, 56 e 96px de lado. */
export type FilePreviewSize = 'sm' | 'md' | 'lg';

export interface FilePreviewProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Nome da previa. Vazio, o padrao, a previa e decorativa, porque o nome do arquivo esta ao lado. */
  alt?: string;
  /** Selo curto no canto de cima, como "PDF" ou "512 × 512". */
  badge?: ReactNode;
  /** Icone de reserva, sem imagem ou quando ela nao carrega. Padrao: o icone de arquivo. */
  icon?: ReactNode;
  kind?: FilePreviewKind;
  /** De 0 a 100, em `uploading`. Sem ele, o progresso e indeterminado. E desenho: o numero acessivel fica com quem usa. */
  progress?: number;
  size?: FilePreviewSize;
  /** Imagem, ou poster do video. Sem ele, ou se nao carregar, aparece o icone de reserva. */
  src?: string | null;
  status?: FilePreviewStatus;
}

/** Play do poster, o mesmo desenho de `IconPlayCircleFill`, sem trazer a suite inteira para a entrada principal. */
function IconPlay() {
  return (
    <Icon>
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814z" />
    </Icon>
  );
}

/** Quadro de previa de arquivo: imagem ou poster, icone de reserva, play no video, estado na borda e no icone, progresso e selo. */
export function FilePreview({
  alt = '',
  badge,
  className,
  icon,
  kind = 'image',
  progress,
  size = 'md',
  src,
  status = 'idle',
  style,
  ...props
}: FilePreviewProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const showImage = Boolean(src) && !failed && kind !== 'file';
  const decorative = alt === '';
  const determinate = status === 'uploading' && progress !== undefined;

  return (
    <div
      {...props}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : alt}
      className={[styles.preview, styles[size], styles[status], className].filter(Boolean).join(' ')}
      role={decorative ? undefined : 'img'}
      style={determinate ? ({ ...style, '--file-preview-progress': `${Math.min(100, Math.max(0, progress))}%` } as CSSProperties) : style}
    >
      {showImage ? (
        <img alt="" className={styles.image} decoding="async" loading="lazy" onError={() => setFailed(true)} src={src ?? undefined} />
      ) : (
        <span className={styles.fallback}>{icon ?? <IconFile />}</span>
      )}
      {kind === 'video' && showImage && (
        <span className={styles.play}>
          <IconPlay />
        </span>
      )}
      {status === 'uploading' && (
        <span className={styles.track}>
          <span className={determinate ? styles.bar : styles.indeterminate} />
        </span>
      )}
      {status === 'done' && (
        <span className={[styles.state, styles.stateDone].join(' ')}>
          <IconCheckCircle />
        </span>
      )}
      {status === 'error' && (
        <span className={[styles.state, styles.stateError].join(' ')}>
          <IconExclamationCircle />
        </span>
      )}
      {badge && <span className={styles.badge}>{badge}</span>}
    </div>
  );
}
