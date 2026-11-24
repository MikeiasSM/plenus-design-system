import { useState, type ChangeEvent, type ComponentPropsWithRef, type CSSProperties } from 'react';
import { Field } from '../Field';
import styles from './InputCode.module.css';

export interface InputCodeProps
  extends Omit<ComponentPropsWithRef<'input'>, 'defaultValue' | 'maxLength' | 'onChange' | 'size' | 'type' | 'value'> {
  defaultValue?: string;
  error?: string;
  hint?: string;
  /** Nome do campo. Padrao: "Código de 6 dígitos", com o `length`. */
  label?: string;
  /** Quantas casas. Padrao 6. */
  length?: number;
  /** Chamado quando todas as casas estao preenchidas, por digitacao, colagem ou preenchimento automatico. */
  onComplete?: (code: string) => void;
  /** So os digitos, a cada mudanca. */
  onValueChange?: (code: string) => void;
  value?: string;
}

/**
 * Codigo de uso unico: um campo so, desenhado como casas. O leitor de tela ouve um campo, e nao seis. Teclado numerico,
 * preenchimento automatico do codigo que chega por SMS ou e-mail (`one-time-code`) e colagem do codigo inteiro, com
 * espacos e tracos tirados.
 */
export function InputCode({
  'aria-describedby': ariaDescribedBy,
  className,
  defaultValue,
  disabled,
  error,
  hint,
  id,
  label,
  length = 6,
  onBlur,
  onComplete,
  onFocus,
  onValueChange,
  required,
  value,
  ...props
}: InputCodeProps) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => (defaultValue ?? '').replace(/\D/g, '').slice(0, length));
  const [focused, setFocused] = useState(false);
  const code = controlled ? value.replace(/\D/g, '').slice(0, length) : inner;
  const name = label ?? `Código de ${length} dígitos`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value.replace(/\D/g, '').slice(0, length);

    if (!controlled) {
      setInner(next);
    }

    onValueChange?.(next);

    if (next.length === length && next !== code) {
      onComplete?.(next);
    }
  }

  // A casa ativa e a proxima a preencher; com tudo preenchido, a ultima.
  const active = Math.min(code.length, length - 1);

  return (
    <Field aria-describedby={ariaDescribedBy} className={className} error={error} hint={hint} id={id} label={name} required={required}>
      {(wiring) => (
        <div className={[styles.code, disabled && styles.disabled].filter(Boolean).join(' ')} style={{ '--input-code-length': length } as CSSProperties}>
          <input
            {...props}
            aria-describedby={wiring.describedBy}
            aria-invalid={wiring.invalid || undefined}
            autoComplete="one-time-code"
            className={styles.input}
            disabled={disabled}
            id={wiring.id}
            inputMode="numeric"
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onChange={handleChange}
            onFocus={(event) => {
              setFocused(true);
              // O cursor vai sempre ao fim: as casas se preenchem em ordem.
              const end = event.target.value.length;
              event.target.setSelectionRange(end, end);
              onFocus?.(event);
            }}
            pattern="[0-9]*"
            required={required}
            spellCheck={false}
            type="text"
            value={code}
          />
          <div aria-hidden="true" className={styles.boxes}>
            {Array.from({ length }, (_, index) => (
              <span
                className={[
                  styles.box,
                  wiring.invalid && styles.invalid,
                  focused && index === active && styles.active,
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={index}
              >
                {code[index] ?? ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </Field>
  );
}
