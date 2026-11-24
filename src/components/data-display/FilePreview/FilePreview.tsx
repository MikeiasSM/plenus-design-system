import { useEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react';
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
  /** Selo curto no canto de cima, como "PDF" ou "512 × 512". Fica fora da vista no `sm`. */
  badge?: ReactNode;
  /**
   * O proprio arquivo, como o `File` recebido em `onFilesSelected`. A previa cria a URL de objeto e a revoga quando o
   * arquivo troca ou o quadro sai da tela. Passe sempre o mesmo objeto: um `Blob` novo a cada render cria uma URL nova.
   * Vale sobre `src`.
   */
  file?: Blob | null;
  /** Icone de reserva, sem imagem ou quando ela nao carrega. Padrao: o icone de arquivo. */
  icon?: ReactNode;
  kind?: FilePreviewKind;
  /** De 0 a 100, em `uploading`. Sem ele, ou fora de numero, o progresso e indeterminado. E desenho: o numero acessivel fica com quem usa. */
  progress?: number;
  size?: FilePreviewSize;
  /**
   * Imagem, ou poster do video, por endereco. Sem ele, ou se nao carregar, aparece o icone de reserva. A imagem inteira e
   * decodificada para o quadro: para arquivo grande, prefira uma miniatura feita pelo produto.
   */
  src?: string | null;
  status?: FilePreviewStatus;
}

/** O triangulo do play, o mesmo desenho de `IconPlayFill`, sem trazer a suite inteira para a entrada principal. */
function IconPlay() {
  return (
    <Icon>
      <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
    </Icon>
  );
}

/**
 * A URL de objeto do arquivo: criada depois de montar, revogada quando o arquivo troca e quando o quadro desmonta. A URL
 * fica guardada com o arquivo que a gerou, para que o render do arquivo novo nunca use a do anterior, ja revogada.
 */
function useObjectUrl(file: Blob | null | undefined) {
  const [entry, setEntry] = useState<{ file: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!file) {
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setEntry({ file, url });

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return file && entry?.file === file ? entry.url : null;
}

/** Quadro de previa de arquivo: imagem ou poster, icone de reserva, play no video, estado na borda e no icone, progresso e selo. */
export function FilePreview({
  alt = '',
  badge,
  className,
  file,
  icon,
  kind = 'image',
  progress,
  size = 'md',
  src,
  status = 'idle',
  style,
  ...props
}: FilePreviewProps) {
  const objectUrl = useObjectUrl(file);
  const resolved = (file ? objectUrl : src) || null;
  // Guarda qual endereco falhou, e nao um sim ou nao. Trocado o endereco, a falha e zerada no proprio render, sem
  // efeito: a imagem nova nunca pisca no icone, e voltar a um endereco que falhou tenta de novo.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [lastSrc, setLastSrc] = useState(resolved);

  if (lastSrc !== resolved) {
    setLastSrc(resolved);
    setFailedSrc(null);
  }

  const imageRef = useRef<HTMLImageElement>(null);

  const showImage = resolved !== null && failedSrc !== resolved && kind !== 'file';

  // A imagem que falhou antes da hidratacao nao dispara mais `onError`: ao montar, o quadro confere se ela ja terminou
  // sem tamanho. SVG sem medida propria tambem termina com largura 0, entao `decode` confirma antes de cair no icone.
  useEffect(() => {
    const image = imageRef.current;

    if (!image || !resolved || !image.complete || image.naturalWidth > 0) {
      return undefined;
    }

    let ativo = true;
    const falhar = () => {
      if (ativo) {
        setFailedSrc(resolved);
      }
    };

    if (typeof image.decode === 'function') {
      image.decode().catch(falhar);
    } else {
      falhar();
    }

    return () => {
      ativo = false;
    };
  }, [resolved, showImage]);

  const decorative = alt === '';
  // NaN ou infinito nao vira largura: o progresso fica indeterminado.
  const percent = status === 'uploading' && typeof progress === 'number' && Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : null;
  const determinate = percent !== null;
  const hasBadge = badge !== undefined && badge !== null && badge !== false && badge !== '';

  return (
    <div
      {...props}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : alt}
      className={[styles.preview, styles[size], styles[status], className].filter(Boolean).join(' ')}
      role={decorative ? undefined : 'img'}
      style={determinate ? ({ ...style, '--file-preview-progress': `${percent}%` } as CSSProperties) : style}
    >
      {showImage ? (
        <img
          alt=""
          className={styles.image}
          decoding="async"
          key={resolved}
          loading="lazy"
          onError={() => setFailedSrc(resolved)}
          ref={imageRef}
          src={resolved}
        />
      ) : (
        <span className={styles.fallback}>{icon ?? <IconFile />}</span>
      )}
      {kind === 'video' && showImage && (
        <span className={styles.play}>
          <span className={styles.playDisc}>
            <IconPlay />
          </span>
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
      {hasBadge && <span className={styles.badge}>{badge}</span>}
    </div>
  );
}
