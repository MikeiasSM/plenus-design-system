import { type ChangeEvent, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useCharacterCount } from '../../../hooks/useCharacterCount';
import { Field } from '../Field';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import styles from './Textarea.module.css';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends Omit<ComponentPropsWithRef<'textarea'>, 'size'> {
  /** Ao lado do campo, na mesma linha, como o botao que o completa. Fica fora da descricao do campo. */
  aside?: ReactNode;
  error?: string;
  hint?: string;
  label?: string;
  /** Ao lado do rotulo e fora dele, como um selo ou um link. Nao entra no nome do campo. */
  labelAddon?: ReactNode;
  /** O texto a cada mudanca, ao lado do `onChange` nativo. */
  onValueChange?: (value: string) => void;
  size?: TextareaSize;
  showCharacterCount?: boolean;
}

export function Textarea({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  aside,
  className,
  error,
  hint,
  id: providedId,
  label,
  labelAddon,
  maxLength,
  required = false,
  rows = 4,
  size = 'md',
  showCharacterCount = false,
  defaultValue,
  onChange,
  onValueChange,
  value,
  ref,
  ...props
}: TextareaProps) {
  const { ref: textareaRef, count, updateCount } = useCharacterCount<HTMLTextAreaElement>(value, defaultValue);
  const mergedRef = useMergedRefs(textareaRef, ref);
  const classes = [styles.textarea, styles[size], error && styles.error, className]
    .filter(Boolean)
    .join(' ');

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    updateCount(event.target.value);
    onChange?.(event);
    onValueChange?.(event.target.value);
  }

  return (
    <Field
      aria-describedby={ariaDescribedBy}
      aside={aside}
      characterCount={count}
      error={error}
      hint={hint}
      id={providedId}
      label={label}
      labelAddon={labelAddon}
      maxLength={maxLength}
      required={required}
      showCharacterCount={showCharacterCount}
    >
      {({ id, describedBy, invalid }) => (
        <textarea
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
          rows={rows}
          value={value}
        />
      )}
    </Field>
  );
}
