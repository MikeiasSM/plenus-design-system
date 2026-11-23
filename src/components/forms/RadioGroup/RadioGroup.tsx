import { createContext, useContext, useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useAvisoDeGrupoSemNome } from '../../../hooks/useAvisoDeGrupoSemNome';
import fieldStyles from '../Field/Field.module.css';
import { GroupLegend } from './GroupLegend';
import styles from './RadioGroup.module.css';

interface RadioGroupContexto {
  defaultValue?: string;
  disabled: boolean;
  invalid: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  required: boolean;
  value?: string;
  variant: RadioGroupVariant;
}

const RadioGroupContexto = createContext<RadioGroupContexto | null>(null);

export function useRadioGroupContexto() {
  const contexto = useContext(RadioGroupContexto);

  if (!contexto) {
    throw new Error('Radio precisa ser renderizado dentro de RadioGroup.');
  }

  return contexto;
}

export type RadioGroupOrientation = 'vertical' | 'horizontal';

/** `default`: o rádio e o rótulo soltos. `card`: cada opção num cartão, inteiro clicável. */
export type RadioGroupVariant = 'default' | 'card';

export interface RadioGroupProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'onChange'> {
  children: ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  /** Opcional quando o grupo já é nomeado por `aria-labelledby` ou `aria-label`; sem ele, a legenda não aparece. */
  label?: string;
  /**
   * Conteúdo ao lado do texto da legenda, como um botão de ajuda. Fica fora do nome do grupo, que passa a vir só do
   * texto do `label`; o que for interativo entra na tabulação antes das opções.
   */
  labelAddon?: ReactNode;
  name?: string;
  onValueChange?: (value: string) => void;
  /** `vertical`, o padrão: uma opção por linha. `horizontal`: lado a lado, com quebra de linha quando não couber. */
  orientation?: RadioGroupOrientation;
  required?: boolean;
  value?: string;
  /** `card` põe cada opção num cartão, inteiro clicável; os rádios continuam nativos. */
  variant?: RadioGroupVariant;
}

export function RadioGroup({
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  children,
  className,
  defaultValue,
  disabled = false,
  error,
  hint,
  label,
  labelAddon,
  name: providedName,
  onValueChange,
  orientation = 'vertical',
  required = false,
  value,
  variant = 'default',
  ...props
}: RadioGroupProps) {
  useAvisoDeGrupoSemNome('RadioGroup', { ariaLabel, ariaLabelledby, label });
  const generatedId = useId();
  const name = providedName ?? `radio-group-${generatedId}`;
  // Do `useId`, e nao do nome: dois grupos com o mesmo nome dividiam o id da mensagem.
  const messageId = `radio-group-${generatedId}-message`;
  const labelId = `radio-group-${generatedId}-label`;
  // Com o complemento na legenda, o grupo se nomeia só pelo texto dela, e o complemento fica de fora.
  const nomeadoPeloTexto = Boolean(label) && labelAddon != null && !ariaLabelledby && !ariaLabel;
  const describedBy = [ariaDescribedBy, error || hint ? messageId : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <RadioGroupContexto.Provider
      value={{ defaultValue, disabled, invalid: Boolean(error), name, onValueChange, required, value, variant }}
    >
      <fieldset
        {...props}
        className={[styles.group, className].filter(Boolean).join(' ')}
        role="radiogroup"
        aria-label={ariaLabelledby ? undefined : ariaLabel}
        aria-labelledby={nomeadoPeloTexto ? labelId : ariaLabelledby}
        aria-describedby={describedBy}
        aria-invalid={error ? true : ariaInvalid}
        aria-required={required || undefined}
      >
        {label && <GroupLegend addon={labelAddon} label={label} labelId={labelId} required={required} />}
        <div className={[styles.options, styles[orientation], variant === 'card' && styles.cardOptions].filter(Boolean).join(' ')}>
          {children}
        </div>
        {(error || hint) && (
          <span className={error ? fieldStyles.errorMessage : fieldStyles.hint} id={messageId} role={error ? 'alert' : undefined}>
            {error || hint}
          </span>
        )}
      </fieldset>
    </RadioGroupContexto.Provider>
  );
}
