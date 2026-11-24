import {
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { Field } from '../Field';
import styles from './PinInput.module.css';

export type PinInputSize = 'sm' | 'md' | 'lg';

export type PinInputType = 'numeric' | 'alphanumeric';

export interface PinInputProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'children' | 'defaultValue' | 'maxLength' | 'minLength' | 'onChange' | 'size' | 'type' | 'value'
  > {
  /** Valor inicial do campo nao controlado. Passa pelo mesmo filtro do que se digita. */
  defaultValue?: string;
  error?: string;
  /**
   * Tamanho de cada grupo de caixas, como `[3, 3]`. Entre um grupo e outro aparece um traco, so visual: o valor
   * continua sem separador.
   */
  groups?: readonly number[];
  hint?: string;
  /** Rotulo visivel. Sem ele e sem `aria-label`, o nome vira "Código de N dígitos" (ou "caracteres"). */
  label?: string;
  /** Ao lado do rotulo e fora dele, como um link de reenviar o codigo. Nao entra no nome do campo. */
  labelAddon?: ReactNode;
  /** Quantidade de caracteres do codigo. */
  length?: number;
  /** Mostra um ponto no lugar de cada caractere, para o codigo que nao deve aparecer na tela. */
  mask?: boolean;
  /** O codigo a cada mudanca, ja filtrado e sem separador. */
  onChange?: (value: string) => void;
  /** Chamado uma vez quando o codigo enche. Nao envia nada: quem decide se verifica na hora e o produto. */
  onComplete?: (value: string) => void;
  size?: PinInputSize;
  /** `numeric` aceita so digitos, com o teclado numerico no celular; `alphanumeric` aceita letras e digitos, em maiusculas. */
  type?: PinInputType;
  /** Valor do campo controlado. Passa pelo mesmo filtro do que se digita. */
  value?: string;
}

const NUMERIC = /[0-9]/;
const ALPHANUMERIC = /[A-Z0-9]/;

/** Deixa so o que vale para o tipo, em maiusculas, e corta o excesso: "482-913" vira "482913". */
function cleanCode(text: string, type: PinInputType, length: number) {
  const valid = type === 'alphanumeric' ? ALPHANUMERIC : NUMERIC;

  return Array.from(text.toUpperCase())
    .filter((character) => valid.test(character))
    .join('')
    .slice(0, length);
}

/** As posicoes depois das quais entra o traco de grupo. O grupo que passa do fim e ignorado. */
function groupBreaks(groups: readonly number[] | undefined, length: number) {
  const breaks = new Set<number>();
  let total = 0;

  for (const size of groups ?? []) {
    total += Math.max(0, Math.floor(size));

    if (total > 0 && total < length) {
      breaks.add(total);
    }
  }

  return breaks;
}

/** O cursor fica sempre no fim: as caixas sao preenchidas em ordem, e clicar numa delas nao abre o meio do codigo. */
function moveCaretToEnd(input: HTMLInputElement) {
  const end = input.value.length;

  if (input.selectionStart !== end || input.selectionEnd !== end) {
    input.setSelectionRange(end, end);
  }
}

export function PinInput({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  autoComplete,
  className,
  defaultValue,
  disabled,
  error,
  groups,
  hint,
  id: providedId,
  inputMode,
  label,
  labelAddon,
  length: requestedLength = 6,
  mask = false,
  onChange,
  onClick,
  onComplete,
  onFocus,
  onSelect,
  ref,
  required = false,
  size = 'md',
  style,
  type = 'numeric',
  value,
  ...props
}: PinInputProps) {
  const length = Math.max(1, Math.floor(requestedLength));
  const [uncontrolledValue, setUncontrolledValue] = useState(() => cleanCode(defaultValue ?? '', type, length));
  const controlled = value !== undefined;
  const code = controlled ? cleanCode(value, type, length) : cleanCode(uncontrolledValue, type, length);
  const breaks = groupBreaks(groups, length);
  const current = Math.min(code.length, length - 1);
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : undefined;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = cleanCode(event.target.value, type, length);

    // O que nao vale para o tipo nao muda nada: o campo volta ao codigo de antes, sem avisar ninguem.
    if (next === code) {
      event.target.value = code;
      return;
    }

    if (!controlled) {
      setUncontrolledValue(next);
    }

    onChange?.(next);

    if (next.length === length) {
      onComplete?.(next);
    }
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus?.(event);
    moveCaretToEnd(event.currentTarget);
  }

  function handleSelect(event: SyntheticEvent<HTMLInputElement>) {
    onSelect?.(event);
    moveCaretToEnd(event.currentTarget);
  }

  function handleClick(event: MouseEvent<HTMLInputElement>) {
    onClick?.(event);
    moveCaretToEnd(event.currentTarget);
  }

  const boxes: ReactNode[] = [];

  for (let index = 0; index < length; index += 1) {
    if (breaks.has(index)) {
      boxes.push(<span aria-hidden="true" className={styles.separator} key={`separador-${index}`} />);
    }

    const character = code[index];

    boxes.push(
      <span
        aria-hidden="true"
        className={[styles.box, index === current && styles.current].filter(Boolean).join(' ')}
        key={index}
      >
        {character ? (mask ? '•' : character) : null}
      </span>,
    );
  }

  return (
    <Field
      aria-describedby={ariaDescribedBy}
      error={error}
      hint={hint}
      id={providedId}
      label={label}
      labelAddon={labelAddon}
      required={required}
      size={size}
    >
      {({ id, describedBy, invalid }) => (
        <div
          className={[styles.root, sizeClass, invalid && styles.invalid, disabled && styles.disabled, className]
            .filter(Boolean)
            .join(' ')}
          style={style}
        >
          {boxes}
          <input
            {...props}
            aria-describedby={describedBy}
            aria-invalid={invalid || ariaInvalid}
            // Sem rotulo, o campo nao fica sem nome: o padrao diz o tamanho e o tipo do codigo.
            aria-label={
              props['aria-label'] ??
              (label || props['aria-labelledby'] ? undefined : `Código de ${length} ${type === 'numeric' ? 'dígitos' : 'caracteres'}`)
            }
            autoCapitalize={type === 'alphanumeric' ? 'characters' : 'off'}
            autoComplete={autoComplete ?? (type === 'numeric' ? 'one-time-code' : 'off')}
            autoCorrect="off"
            className={styles.input}
            disabled={disabled}
            id={id}
            inputMode={inputMode ?? (type === 'numeric' ? 'numeric' : 'text')}
            onChange={handleChange}
            onClick={handleClick}
            onFocus={handleFocus}
            onSelect={handleSelect}
            ref={ref}
            required={required}
            spellCheck={false}
            type="text"
            value={code}
          />
        </div>
      )}
    </Field>
  );
}
