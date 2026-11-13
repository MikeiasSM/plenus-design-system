import { Fragment, useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { useAvisoDeGrupoSemNome } from '../../../hooks/useAvisoDeGrupoSemNome';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlItem {
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  value: string;
}

export type SegmentedControlSize = 'sm' | 'md' | 'lg';

export interface SegmentedControlProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange'> {
  defaultValue?: string;
  disabled?: boolean;
  /** Mostra so os icones; o `label` de cada item continua sendo o nome e aparece como dica. */
  iconOnly?: boolean;
  items: readonly SegmentedControlItem[];
  /** Nome do grupo, para o leitor de tela. Opcional quando o grupo já é nomeado por `aria-labelledby` ou `aria-label`. */
  label?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  size?: SegmentedControlSize;
  value?: string;
}

/** Escolha unica em poucos segmentos lado a lado. Por baixo sao radios nativos: setas, Tab e formulario vem do navegador. */
export function SegmentedControl({
  className,
  defaultValue,
  disabled = false,
  iconOnly = false,
  items,
  label,
  name: providedName,
  onValueChange,
  size = 'md',
  value,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  ...props
}: SegmentedControlProps) {
  useAvisoDeGrupoSemNome('SegmentedControl', { ariaLabel, ariaLabelledby, label });
  const generatedName = `segmented-control-${useId()}`;
  const name = providedName ?? generatedName;
  const controlled = value !== undefined;

  return (
    <div
      {...props}
      aria-label={ariaLabelledby ? undefined : (label ?? ariaLabel)}
      aria-labelledby={ariaLabelledby}
      className={[styles.control, styles[size], className].filter(Boolean).join(' ')}
      role="radiogroup"
    >
      {items.map((item) => {
        const segment = (
          <label className={[styles.segment, iconOnly && styles.iconOnly].filter(Boolean).join(' ')}>
            <input
              checked={controlled ? value === item.value : undefined}
              className={styles.input}
              defaultChecked={controlled ? undefined : defaultValue === item.value}
              disabled={disabled || item.disabled}
              name={name}
              onChange={() => onValueChange?.(item.value)}
              type="radio"
              value={item.value}
            />
            {item.icon && (
              <span aria-hidden="true" className={styles.icon}>
                {item.icon}
              </span>
            )}
            <span className={iconOnly ? styles.hiddenText : undefined}>{item.label}</span>
          </label>
        );

        return iconOnly ? (
          <Tooltip content={item.label} key={item.value}>
            {segment}
          </Tooltip>
        ) : (
          <Fragment key={item.value}>{segment}</Fragment>
        );
      })}
    </div>
  );
}
