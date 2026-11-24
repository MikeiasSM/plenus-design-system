import { useRef, type ChangeEvent, type ComponentPropsWithRef, type CSSProperties, type ReactNode } from 'react';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { VisuallyHidden } from '../../accessibility/VisuallyHidden';
import { Spinner } from '../../feedback/Spinner';
import { IconClose } from '../../icons';
import { useCharacterCount } from '../../../hooks/useCharacterCount';
import { useInsideLiveRegion } from '../../../hooks/useInsideLiveRegion';
import { Field } from '../Field';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { formatInputMask, type InputMask } from '../../../utils/formatters/formatInputMask';
import { maskTypedText } from './maskTypedText';
import styles from './InputText.module.css';

export type { InputMask };

export type InputTextSize = 'sm' | 'md' | 'lg';

export interface InputTextProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  /** Ao lado do campo, na mesma linha, como o botao que o completa. Fica fora da descricao do campo. */
  aside?: ReactNode;
  /** Botao de limpar ao fim do campo, visivel so com texto. Limpa, chama `onValueChange('')` e devolve o foco ao campo. */
  clearable?: boolean;
  /** Nome do botao de limpar. */
  clearLabel?: string;
  /**
   * Fenda ao fim do campo, dentro da borda, como um botao de acao. Nao e decorativa: o que vier nela e lido e
   * alcancado pelo teclado, e precisa do proprio nome. Fica depois da `unit`.
   */
  end?: ReactNode;
  error?: string;
  hint?: string;
  /** Icone decorativo a frente do texto, como a lupa de uma busca. O nome do campo continua no `label`. */
  icon?: ReactNode;
  label?: string;
  /** Ao lado do rotulo e fora dele, como um selo ou um link. Nao entra no nome do campo. */
  labelAddon?: ReactNode;
  /**
   * Indicador de carregamento ao fim do campo, como numa busca que consulta o servidor. Ao ligar, o `loadingLabel` e
   * anunciado numa regiao de status oculta, montada desde que a propriedade exista: passe `false` desde o inicio.
   */
  loading?: boolean;
  /** Texto anunciado quando `loading` liga. */
  loadingLabel?: string;
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

/** Esvazia o campo como a pessoa faria: o evento `input` nativo leva o texto vazio ao `onChange`, controlado ou nao. */
function clearInput(input: HTMLInputElement) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

  setValue?.call(input, '');
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function InputText({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  aside,
  className,
  clearable = false,
  clearLabel = 'Limpar',
  end,
  error,
  hint,
  icon,
  id: providedId,
  label,
  labelAddon,
  loading,
  loadingLabel = 'Carregando',
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
  const insideLiveRegion = useInsideLiveRegion();
  // Com algo interativo ao fim, a borda passa do input ao involucro, que guarda os dois; sem isso, o campo fica como era.
  const framed = end !== undefined || clearable || loading !== undefined;
  const showClear = clearable && count > 0 && !props.disabled && !props.readOnly;
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : undefined;

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

  function handleClear() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    // O foco volta antes de o botao sumir, para nao cair no `body`.
    input.focus();
    clearInput(input);
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
      size={size}
    >
      {({ className: controlClassName, id, describedBy, invalid }) => {
        const unitId = unit ? `${id}-unit` : undefined;
        const inputProps = {
          ...props,
          defaultValue: shownDefaultValue,
          id,
          ref: mergedRef,
          'aria-describedby': [describedBy, unitId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': invalid || ariaInvalid,
          maxLength,
          onChange: handleChange,
          required,
          value: shownValue,
        };

        if (framed) {
          return (
            <>
              <div className={[styles.control, styles.frame, sizeClass, invalid && styles.invalid].filter(Boolean).join(' ')}>
                {icon && (
                  <span aria-hidden="true" className={styles.icon}>
                    {icon}
                  </span>
                )}
                <input {...inputProps} className={[styles.inner, icon && styles.withIcon, className].filter(Boolean).join(' ')} />
                {unit && (
                  <span aria-hidden="true" className={styles.frameUnit} id={unitId}>
                    {unit}
                  </span>
                )}
                {(loading || showClear || end !== undefined) && (
                  <div className={styles.end}>
                    {loading && (
                      <span className={styles.endSlot}>
                        <Spinner size="sm" />
                      </span>
                    )}
                    {showClear && (
                      <ButtonIcon
                        className={styles.clear}
                        icon={<IconClose />}
                        label={clearLabel}
                        onClick={handleClear}
                        size={size === 'lg' ? 'md' : 'sm'}
                        type="button"
                        variant="ghost"
                      />
                    )}
                    {end}
                  </div>
                )}
              </div>
              {loading !== undefined && (
                <VisuallyHidden role={insideLiveRegion ? undefined : 'status'}>{loading ? loadingLabel : ''}</VisuallyHidden>
              )}
            </>
          );
        }

        const input = (
          <input
            {...inputProps}
            className={[controlClassName, icon && styles.withIcon, unit && styles.withUnit, className].filter(Boolean).join(' ')}
            style={unit ? { ...props.style, '--unit-chars': unit.length } as CSSProperties : props.style}
          />
        );

        if (!icon && !unit) {
          return input;
        }

        return (
          <div className={[styles.control, sizeClass].filter(Boolean).join(' ')}>
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
