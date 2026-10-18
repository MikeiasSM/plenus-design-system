import { useId, useRef, useState, type ChangeEvent, type ComponentPropsWithRef, type DragEvent } from 'react';
import { Button } from '../../actions/Button';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { Progress } from '../../feedback/Progress';
import { IconCheckCircle, IconClose, IconExclamationCircle, IconFile, IconTrash, IconUpload } from '../../icons';
import { formatarTamanhoDeArquivo } from '../../../utils/formatters/formatarTamanhoDeArquivo';
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
  /** De 0 a 100. Sem ele, o progresso e indeterminado. */
  progress?: number;
  size: number;
  status: FileUploadStatus;
}

export interface FileUploadProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onDrop'> {
  /** Os tipos aceitos, como no `<input type="file">`: `.pdf,image/*`. */
  accept?: string;
  disabled?: boolean;
  /** Vence a mensagem de recusa do proprio campo. */
  error?: string;
  hint?: string;
  items?: readonly FileUploadItem[];
  label: string;
  /** Limite por arquivo, em bytes. */
  maxSize?: number;
  multiple?: boolean;
  onCancel?: (id: string) => void;
  /** Recebe so os arquivos aceitos. */
  onFilesSelected: (files: File[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
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
  className,
  disabled = false,
  error,
  hint,
  id,
  items = [],
  label,
  maxSize,
  multiple = false,
  onCancel,
  onFilesRejected,
  onFilesSelected,
  onRemove,
  onRetry,
  ...props
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const restrictionsId = useId();
  const [dragging, setDragging] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string>();

  const tipos = tiposAceitos(accept);
  const descricaoDosTipos = listarComOu([...new Set(tipos.map(nomeDoTipo))]);
  const limite = maxSize === undefined ? undefined : formatarTamanhoDeArquivo(maxSize);
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

  function choose() {
    inputRef.current?.focus();
    inputRef.current?.click();
  }

  const fieldError = error ?? rejectionMessage;

  return (
    <div {...props} className={[styles.fileUpload, className].filter(Boolean).join(' ')}>
      <Field aria-describedby={restricoes ? restrictionsId : undefined} error={fieldError} hint={hint} id={id} label={label}>
        {({ describedBy, id: inputId, invalid }) => (
          <div
            className={[styles.zone, dragging && styles.dragging, invalid && styles.invalid, disabled && styles.disabled]
              .filter(Boolean)
              .join(' ')}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <span aria-hidden="true" className={styles.iconBox}>
              <IconUpload />
            </span>
            <p className={styles.instruction}>
              {multiple ? 'Arraste os arquivos aqui ou' : 'Arraste o arquivo aqui ou'}
              {/* Fora da tabulacao e da arvore: o controle acessivel e o seletor nativo, que recebe o foco. */}
              <Button aria-hidden disabled={disabled} onClick={choose} size="sm" tabIndex={-1} variant="secondary">
                escolha do computador
              </Button>
            </p>
            {restricoes && (
              <p className={styles.restrictions} id={restrictionsId}>
                {restricoes.charAt(0).toUpperCase() + restricoes.slice(1)}
              </p>
            )}
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
        )}
      </Field>
      {items.length > 0 && (
        <ul className={styles.items}>
          {items.map((item) => (
            <FileUploadRow item={item} key={item.id} onCancel={onCancel} onRemove={onRemove} onRetry={onRetry} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface FileUploadRowProps extends Pick<FileUploadProps, 'onCancel' | 'onRemove' | 'onRetry'> {
  item: FileUploadItem;
}

function FileUploadRow({ item, onCancel, onRemove, onRetry }: FileUploadRowProps) {
  const { id, name, progress, size, status } = item;

  return (
    <li className={[styles.item, status === 'error' && styles.failed].filter(Boolean).join(' ')}>
      <span aria-hidden="true" className={styles.fileIcon}>
        <IconFile />
      </span>
      <div className={styles.body}>
        <span className={styles.name} title={name}>
          {name}
        </span>
        <span className={styles.meta}>
          {formatarTamanhoDeArquivo(size)}
          <span aria-hidden="true">·</span>
          <span className={status === 'error' ? styles.failedMessage : styles.status} role="status">
            {status === 'done' && <IconCheckCircle className={styles.doneIcon} />}
            {status === 'error' && <IconExclamationCircle />}
            {status === 'uploading' && 'Enviando'}
            {status === 'done' && 'Enviado'}
            {status === 'error' && (item.error ?? 'Falha no envio.')}
          </span>
        </span>
        {status === 'uploading' && <Progress label={`Enviando ${name}`} showValue size="sm" value={progress} />}
      </div>
      <div className={styles.actions}>
        {status === 'error' && onRetry && (
          <Button aria-label={`Tentar de novo: ${name}`} onClick={() => onRetry(id)} size="sm" variant="ghost">
            Tentar de novo
          </Button>
        )}
        {status === 'uploading' && onCancel && (
          <ButtonIcon icon={<IconClose />} label={`Cancelar envio de ${name}`} onClick={() => onCancel(id)} size="sm" variant="ghost" />
        )}
        {status !== 'uploading' && onRemove && (
          <ButtonIcon icon={<IconTrash />} label={`Remover ${name}`} onClick={() => onRemove(id)} size="sm" variant="ghost" />
        )}
      </div>
    </li>
  );
}
