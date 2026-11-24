import { useId, useRef, useState, type ChangeEvent, type ClipboardEvent, type ComponentPropsWithRef, type DragEvent } from 'react';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import { Button } from '../../actions/Button';
import { useFocusNeighborOnRemove } from '../../../hooks/useFocusNeighborOnRemove';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { FilePreview, type FilePreviewKind } from '../../data-display/FilePreview';
import { Progress } from '../../feedback/Progress';
import { IconCheckCircle, IconClose, IconExclamationCircle, IconFile, IconTrash, IconUpload } from '../../icons';
import { formatFileSize } from '../../../utils/formatters/formatFileSize';
import { isRepeatedClick } from '../../../utils/press/press';
import { Field } from '../Field';
import styles from './FileUpload.module.css';

export type FileRejectionReason = 'type' | 'size';

export interface FileRejection {
  file: File;
  reason: FileRejectionReason;
}

export type FileUploadStatus = 'uploading' | 'done' | 'error';

/** Um arquivo em envio. Quem envia e o produto: ele monta a lista e informa o progresso. */
export interface FileUploadItem {
  error?: string;
  id: string;
  name: string;
  /**
   * Previa do arquivo no lugar do icone, no tamanho `sm`, para a linha nao crescer: a imagem, ou o poster do video.
   * `file` recebe o proprio `File` escolhido, e a previa cria e revoga a URL de objeto; `src` recebe um endereco, como
   * uma miniatura feita pelo produto. Decorativa, porque o nome esta ao lado; o estado e o progresso aparecem nela tambem.
   */
  preview?: { file?: Blob | null; kind?: FilePreviewKind; src?: string | null };
  /** De 0 a 100. Sem ele, o progresso e indeterminado. */
  progress?: number;
  size: number;
  status: FileUploadStatus;
  /**
   * Vence "Enviando" e "Enviado" no texto do estado, como "Processando". Enviando, tambem nomeia a barra de progresso,
   * que fica indeterminada sem `progress`.
   */
  statusLabel?: string;
}

/** Os textos da zona. `instruction` vence "Arraste o arquivo aqui"; `button`, "Escolher do computador". */
export interface FileUploadLabels {
  button: string;
  instruction: string;
}

export interface FileUploadProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onDrop'> {
  /** Os tipos aceitos, como no `<input type="file">`: `.pdf,image/*`. */
  accept?: string;
  /**
   * Aceita o arquivo colado (Ctrl+V) com o foco dentro do componente, pela mesma conferencia de tipo e tamanho da
   * escolha e do arrasto.
   */
  acceptPaste?: boolean;
  disabled?: boolean;
  /** Vence a mensagem de recusa do proprio campo. */
  error?: string;
  hint?: string;
  /** Tira o rotulo da vista; ele continua nomeando o seletor nativo. */
  hideLabel?: boolean;
  items?: readonly FileUploadItem[];
  label: string;
  labels?: Partial<FileUploadLabels>;
  /** Limite por arquivo, em bytes. */
  maxSize?: number;
  multiple?: boolean;
  onCancel?: (id: string) => void;
  /** Recebe so os arquivos aceitos. */
  onFilesSelected: (files: File[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Com `false`, a linha dos tipos e do limite sai da vista; o texto continua descrevendo o seletor. */
  showRestrictions?: boolean;
}

const NOMES_DE_FAMILIA: Record<string, string> = { audio: 'áudio', image: 'imagem', text: 'texto', video: 'vídeo' };

function tiposAceitos(accept?: string) {
  return (accept ?? '')
    .split(',')
    .map((tipo) => tipo.trim().toLowerCase())
    .filter(Boolean);
}

function nomeDoTipo(tipo: string) {
  if (tipo.startsWith('.')) {
    return tipo.slice(1).toUpperCase();
  }

  const [familia = '', subtipo = ''] = tipo.split('/');
  return subtipo === '*' ? (NOMES_DE_FAMILIA[familia] ?? familia) : subtipo.split('+')[0]!.toUpperCase();
}

function listarComOu(itens: string[]) {
  return itens.length < 2 ? itens.join('') : `${itens.slice(0, -1).join(', ')} ou ${itens.at(-1)}`;
}

function aceitaOTipo(file: File, tipos: string[]) {
  if (tipos.length === 0) {
    return true;
  }

  const nome = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  return tipos.some((tipo) => {
    if (tipo.startsWith('.')) return nome.endsWith(tipo);
    if (tipo.endsWith('/*')) return mime.startsWith(tipo.slice(0, -1));
    return mime === tipo;
  });
}

export function FileUpload({
  accept,
  acceptPaste = false,
  className,
  disabled = false,
  error,
  hideLabel = false,
  hint,
  id,
  items = [],
  label,
  labels,
  maxSize,
  multiple = false,
  onCancel,
  onFilesRejected,
  onFilesSelected,
  onPaste,
  onRemove,
  onRetry,
  showRestrictions = true,
  ...props
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const restrictionsId = useId();
  const [dragging, setDragging] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string>();

  const tipos = tiposAceitos(accept);
  const descricaoDosTipos = listarComOu([...new Set(tipos.map(nomeDoTipo))]);
  const limite = maxSize === undefined ? undefined : formatFileSize(maxSize);
  const restricoes = [descricaoDosTipos, limite && `até ${limite}`].filter(Boolean).join(', ');

  function motivoDaRecusa({ file, reason }: FileRejection, sujeito: string) {
    return reason === 'type' ? `${sujeito} não é ${descricaoDosTipos}.` : `${sujeito} passa de ${limite}.`;
  }

  function receber(oferecidos: File[]) {
    const files = multiple ? oferecidos : oferecidos.slice(0, 1);
    const aceitos: File[] = [];
    const recusas: FileRejection[] = [];

    for (const file of files) {
      if (!aceitaOTipo(file, tipos)) recusas.push({ file, reason: 'type' });
      else if (maxSize !== undefined && file.size > maxSize) recusas.push({ file, reason: 'size' });
      else aceitos.push(file);
    }

    setRejectionMessage(
      recusas.length === 0
        ? undefined
        : recusas.map((recusa) => motivoDaRecusa(recusa, files.length === 1 ? 'O arquivo' : recusa.file.name)).join(' '),
    );

    if (aceitos.length > 0) onFilesSelected(aceitos);
    if (recusas.length > 0) onFilesRejected?.(recusas);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    receber(Array.from(event.target.files ?? []));
    // Limpo, o seletor aceita de novo o mesmo arquivo, como no tentar outra vez.
    event.target.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
    if (!disabled) setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) receber(Array.from(event.dataTransfer.files));
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    onPaste?.(event);

    // O colar chega a raiz pelo elemento em foco: so com o foco dentro do componente ele passa por aqui.
    const colados = Array.from(event.clipboardData?.files ?? []);

    if (!acceptPaste || disabled || event.defaultPrevented || colados.length === 0) {
      return;
    }

    event.preventDefault();
    receber(colados);
  }

  function choose() {
    inputRef.current?.focus();
    inputRef.current?.click();
  }

  const fieldError = error ?? rejectionMessage;
  const textoDasRestricoes = restricoes && restricoes.charAt(0).toUpperCase() + restricoes.slice(1);

  return (
    <div {...props} className={[styles.fileUpload, className].filter(Boolean).join(' ')} onPaste={handlePaste}>
      <Field
        aria-describedby={restricoes ? restrictionsId : undefined}
        error={fieldError}
        hint={hint}
        id={id}
        label={hideLabel ? undefined : label}
      >
        {({ describedBy, id: inputId, invalid }) => (
          <>
            {hideLabel && (
              <VisuallyHidden>
                <label htmlFor={inputId}>{label}</label>
              </VisuallyHidden>
            )}
            <div
              className={[styles.zone, dragging && styles.dragging, invalid && styles.invalid, disabled && styles.disabled]
                .filter(Boolean)
                .join(' ')}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <IconUpload className={styles.icon} />
              <div className={styles.text}>
                <p className={styles.instruction}>
                  {labels?.instruction ?? (multiple ? 'Arraste os arquivos aqui' : 'Arraste o arquivo aqui')}
                </p>
                {restricoes && showRestrictions && (
                  <p className={styles.restrictions} id={restrictionsId}>
                    {textoDasRestricoes}
                  </p>
                )}
                {/* Fora da vista, as restricoes seguem descrevendo o seletor. */}
                {restricoes && !showRestrictions && <VisuallyHidden id={restrictionsId}>{textoDasRestricoes}</VisuallyHidden>}
              </div>
              {/* Fora da tabulacao e da arvore: o controle acessivel e o seletor nativo, que recebe o foco. */}
              <Button aria-hidden disabled={disabled} onClick={choose} size="sm" tabIndex={-1} variant="secondary">
                {labels?.button ?? 'Escolher do computador'}
              </Button>
              <input
                accept={accept}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                className={styles.input}
                disabled={disabled}
                id={inputId}
                multiple={multiple}
                onChange={handleChange}
                ref={inputRef}
                type="file"
              />
            </div>
          </>
        )}
      </Field>
      {items.length > 0 && (
        <ul className={styles.items}>
          {items.map((item) => (
            <FileUploadRow
              focusField={() => inputRef.current}
              item={item}
              key={item.id}
              onCancel={onCancel}
              onRemove={onRemove}
              onRetry={onRetry}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface FileUploadRowProps extends Pick<FileUploadProps, 'onCancel' | 'onRemove' | 'onRetry'> {
  focusField: () => HTMLElement | null;
  item: FileUploadItem;
}

function FileUploadRow({ focusField, item, onCancel, onRemove, onRetry }: FileUploadRowProps) {
  const { id, name, progress, size, status, statusLabel } = item;
  const ref = useRef<HTMLLIElement>(null);

  useFocusNeighborOnRemove(ref, focusField);

  return (
    <li className={[styles.item, status === 'error' && styles.failed].filter(Boolean).join(' ')} ref={ref}>
      {item.preview ? (
        <FilePreview
          file={item.preview.file}
          kind={item.preview.kind}
          progress={progress}
          size="sm"
          src={item.preview.src}
          status={status}
        />
      ) : (
        <span aria-hidden="true" className={styles.fileIcon}>
          <IconFile />
        </span>
      )}
      <div className={styles.body}>
        <span className={styles.name} title={name}>
          {name}
        </span>
        <span className={styles.meta}>
          {formatFileSize(size)}
          <span aria-hidden="true">·</span>
          <span className={status === 'error' ? styles.failedMessage : styles.status} role="status">
            {status === 'done' && <IconCheckCircle className={styles.doneIcon} />}
            {status === 'error' && <IconExclamationCircle />}
            {status === 'uploading' && (statusLabel ?? 'Enviando')}
            {status === 'done' && (statusLabel ?? 'Enviado')}
            {status === 'error' && (item.error ?? 'Falha no envio.')}
          </span>
        </span>
        {status === 'uploading' && <Progress label={`${statusLabel ?? 'Enviando'} ${name}`} showValue size="sm" value={progress} />}
      </div>
      <div className={styles.actions}>
        {status === 'error' && onRetry && (
          <Button aria-label={`Tentar de novo: ${name}`} onClick={(event) => !isRepeatedClick(event) && onRetry(id)} size="sm" variant="ghost">
            Tentar de novo
          </Button>
        )}
        {status === 'uploading' && onCancel && (
          <ButtonIcon data-removes="" icon={<IconClose />} label={`Cancelar envio de ${name}`} onClick={(event) => !isRepeatedClick(event) && onCancel(id)} size="sm" variant="ghost" />
        )}
        {status !== 'uploading' && onRemove && (
          <ButtonIcon data-removes="" icon={<IconTrash />} label={`Remover ${name}`} onClick={(event) => !isRepeatedClick(event) && onRemove(id)} size="sm" variant="ghost" />
        )}
      </div>
    </li>
  );
}
