import { useRef, type ChangeEvent, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react';
import { useCharacterCount } from '../../../hooks/useCharacterCount';
import { Field } from '../Field';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { formatInputMask, type InputMask } from '../../../utils/formatters/formatInputMask';
import { maskTypedText } from './maskTypedText';
import styles from './InputText.module.css';

export type { InputMask };

export type InputTextSize = 'sm' | 'md' | 'lg';

export interface InputTextProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  error?: string;
  hint?: string;
  /** Icone decorativo a frente do texto, como a lupa de uma busca. O nome do campo continua no `label`. */
  icon?: ReactNode;
  label?: string;
  /**
   * Formata o que a pessoa digita ou cola: um padrao como `'000.000.000-00'` (`0` digito, `a` letra, `*` letra ou
   * digito, o resto e literal) ou uma funcao `(texto) => texto formatado`. O `value` e o `defaultValue` tambem
   * passam pela mascara, e podem chegar crus.
   */
  mask?: InputMask;
  /** O texto a cada mudanca, ao lado do `onChange` nativo. Com `mask`, e o texto formatado. */
  onValueChange?: (value: string) => void;
  /**
   * O texto sem a formatacao, a cada mudanca, quando ha `mask`. No padrao, so o que preencheu posicoes; na funcao,
   * as letras e os digitos do texto.
   */
  onRawValueChange?: (raw: string) => void;
  size?: InputTextSize;
  /**
   * Unidade ou sufixo ao fim do campo, como `%`, `kg` ou `dias`. E so visual: o leitor de tela a ouve depois do
   * nome e do valor, como descricao do campo, e ela nao entra no `value`.
   */
  unit?: string;
  showCharacterCount?: boolean;
}

export function InputText({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  className,
  error,
  hint,
  icon,
  id: providedId,
  label,
  mask,
  maxLength,
  required = false,
  size = 'md',
  showCharacterCount = false,
  unit,
  defaultValue,
  onChange,
  onRawValueChange,
  onValueChange,
  value,
  ref,
  ...props
}: InputTextProps) {
  const shownValue = mask && value !== undefined ? formatInputMask(String(value), mask).text : value;
  const shownDefaultValue =
    mask && defaultValue !== undefined ? formatInputMask(String(defaultValue), mask).text : defaultValue;
  const previousText = useRef(String(shownValue ?? shownDefaultValue ?? ''));
  const { ref: inputRef, count, updateCount } = useCharacterCount<HTMLInputElement>(shownValue, shownDefaultValue);
  const mergedRef = useMergedRefs(inputRef, ref);

  if (shownValue !== undefined) {
    previousText.current = String(shownValue);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = mask && maskTypedText(event, mask, previousText.current);

    previousText.current = event.target.value;
    updateCount(event.target.value);
    onChange?.(event);
    onValueChange?.(event.target.value);

    if (raw !== undefined) {
      onRawValueChange?.(raw);
    }
  }

  return (
    <Field
      aria-describedby={ariaDescribedBy}
      characterCount={count}
      error={error}
      hint={hint}
      id={providedId}
      label={label}
      maxLength={maxLength}
      required={required}
      showCharacterCount={showCharacterCount}
      size={size}
    >
      {({ className: controlClassName, id, describedBy, invalid }) => {
        const unitId = unit ? `${id}-unit` : undefined;
        const input = (
          <input
            {...props}
            defaultValue={shownDefaultValue}
            id={id}
            ref={mergedRef}
            aria-describedby={[describedBy, unitId].filter(Boolean).join(' ') || undefined}
            aria-invalid={invalid || ariaInvalid}
            className={[controlClassName, icon && styles.withIcon, unit && styles.withUnit, className].filter(Boolean).join(' ')}
            maxLength={maxLength}
            onChange={handleChange}
            required={required}
            style={unit ? { ...props.style, '--unit-chars': unit.length } as CSSProperties : props.style}
            value={shownValue}
          />
        );

        if (!icon && !unit) {
          return input;
        }

        return (
          <div className={[styles.control, size === 'sm' && styles.sm, size === 'lg' && styles.lg].filter(Boolean).join(' ')}>
            {icon && (
              <span aria-hidden="true" className={styles.icon}>
                {icon}
              </span>
            )}
            {input}
            {unit && (
              <span aria-hidden="true" className={styles.unit} id={unitId}>
                {unit}
              </span>
            )}
          </div>
        );
      }}
    </Field>
  );
}
