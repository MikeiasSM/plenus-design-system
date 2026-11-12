import styles from './Field.module.css';

export interface FormValueProps {
  disabled: boolean;
  name?: string;
  /** O navegador foca o campo invalido no envio; o foco segue para o controle que a pessoa enxerga. */
  onFocus: () => void;
  required: boolean;
  value: string;
}

/**
 * Leva ao formulario o valor de um campo sem controle nativo por baixo. Oculto quando basta enviar; obrigatorio, vai
 * num campo que o navegador valida, porque o oculto fica fora da validacao e o envio vazio passava.
 */
export function FormValue({ disabled, name, onFocus, required, value }: FormValueProps) {
  if (required) {
    return (
      <input
        aria-hidden
        autoComplete="off"
        className={styles.formValue}
        disabled={disabled}
        name={name}
        onChange={() => undefined}
        onFocus={onFocus}
        required
        tabIndex={-1}
        value={value}
      />
    );
  }

  return name === undefined ? null : <input disabled={disabled} name={name} type="hidden" value={value} />;
}
