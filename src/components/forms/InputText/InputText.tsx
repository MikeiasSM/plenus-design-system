import { type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useCharacterCount } from '../../../hooks/useCharacterCount';
import { Field } from '../Field';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import styles from './InputText.module.css';

export type InputTextSize = 'sm' | 'md';

export interface InputTextProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  error?: string;
  hint?: string;
  /** Icone decorativo a frente do texto, como a lupa de uma busca. O nome do campo continua no `label`. */
  icon?: ReactNode;
  label?: string;
  size?: InputTextSize;
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
  maxLength,
  required = false,
  size = 'md',
  showCharacterCount = false,
  defaultValue,
  onChange,
  value,
  ref,
  ...props
}: InputTextProps) {
  const { ref: inputRef, count, updateCount } = useCharacterCount<HTMLInputElement>(value, defaultValue);
  const mergedRef = useMergedRefs(inputRef, ref);
  const classes = [styles.input, styles[size], icon && styles.withIcon, error && styles.error, className]
    .filter(Boolean)
    .join(' ');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    updateCount(event.target.value);
    onChange?.(event);
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
    >
      {({ id, describedBy, invalid }) => {
        const input = (
          <input
            {...props}
            defaultValue={defaultValue}
            id={id}
            ref={mergedRef}
            aria-describedby={describedBy}
            aria-invalid={invalid || ariaInvalid}
            className={classes}
            maxLength={maxLength}
            onChange={handleChange}
            required={required}
            value={value}
          />
        );

        if (!icon) {
          return input;
        }

        return (
          <div className={styles.control}>
            <span aria-hidden="true" className={styles.icon}>
              {icon}
            </span>
            {input}
          </div>
        );
      }}
    </Field>
  );
}
