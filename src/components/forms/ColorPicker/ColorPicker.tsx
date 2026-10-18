import { useId, type ComponentPropsWithRef } from 'react';
import { IconCheck } from '../../icons';
import { Tooltip } from '../../overlays/Tooltip';
import styles from './ColorPicker.module.css';

export interface ColorPickerOption {
  /** Qualquer cor do CSS; é só o desenho da amostra. */
  color: string;
  /** Nome da cor: é o que o leitor de tela anuncia e o que aparece como dica. */
  label: string;
  value: string;
}

export type ColorPickerSize = 'sm' | 'md';

export interface ColorPickerProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange'> {
  /** Primeira amostra, que significa sem cor: escolhida, o valor é `null`. */
  defaultOption?: { label?: string };
  defaultValue?: string | null;
  disabled?: boolean;
  /** Nome do grupo, para o leitor de tela. */
  label: string;
  name?: string;
  onValueChange?: (value: string | null) => void;
  options: readonly ColorPickerOption[];
  size?: ColorPickerSize;
  value?: string | null;
}

interface Swatch {
  color?: string;
  label: string;
  value: string | null;
}

/** Escolha de cor por amostras. Por baixo são rádios nativos: setas, Tab e formulário vêm do navegador. */
export function ColorPicker({
  className,
  defaultOption,
  defaultValue,
  disabled = false,
  label,
  name: providedName,
  onValueChange,
  options,
  size = 'md',
  value,
  ...props
}: ColorPickerProps) {
  const generatedName = `color-picker-${useId()}`;
  const name = providedName ?? generatedName;
  const controlled = value !== undefined;
  const swatches: Swatch[] = defaultOption
    ? [{ label: defaultOption.label ?? 'Padrão', value: null }, ...options]
    : [...options];

  return (
    <div
      {...props}
      aria-label={label}
      className={[styles.picker, styles[size], className].filter(Boolean).join(' ')}
      role="radiogroup"
    >
      {swatches.map((swatch) => (
        <Tooltip content={swatch.label} key={swatch.value ?? ''}>
          <label
            className={[styles.swatch, swatch.value === null && styles.none].filter(Boolean).join(' ')}
            style={{ backgroundColor: swatch.color }}
          >
            <input
              checked={controlled ? value === swatch.value : undefined}
              className={styles.input}
              defaultChecked={controlled ? undefined : defaultValue === swatch.value}
              disabled={disabled}
              name={name}
              onChange={() => onValueChange?.(swatch.value)}
              type="radio"
              value={swatch.value ?? ''}
            />
            <IconCheck className={styles.check} />
            <span className={styles.hiddenText}>{swatch.label}</span>
          </label>
        </Tooltip>
      ))}
    </div>
  );
}
