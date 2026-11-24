import { useId, type ComponentPropsWithRef } from 'react';
import { formatPercent } from '../../../utils/formatters';
import styles from './Meter.module.css';

/** `brand` quando nao ha `low`, `high` nem `optimum`: a medida nao diz se o valor e bom ou ruim. */
export type MeterTone = 'success' | 'warning' | 'danger' | 'brand';

export interface MeterProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** Nome da medida, escrito acima do trilho e levado ao nome acessivel. */
  label: string;
  /** Limitado a faixa de `min` a `max`. */
  value: number;
  min?: number;
  max?: number;
  /** Fim da faixa baixa. */
  low?: number;
  /** Inicio da faixa alta. */
  high?: number;
  /** O ponto ideal. A faixa em que ele cai e a de sucesso; a vizinha, de atencao; a oposta, de perigo. */
  optimum?: number;
  /** Texto do valor, abaixo do trilho e no `aria-valuetext`. Sem ele, a porcentagem do intervalo. */
  valueLabel?: string | ((value: number) => string);
  /** Localidade da porcentagem padrao. */
  locale?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * A regra do `<meter>` do HTML: `low`, `high` e `optimum` sao trazidos para dentro da faixa, `high` nunca abaixo
 * de `low`, e o `optimum` ausente fica no meio. O limite entre as faixas pertence a do ideal.
 */
function toneOf(value: number, min: number, max: number, low?: number, high?: number, optimum?: number): MeterTone {
  if (low === undefined && high === undefined && optimum === undefined) {
    return 'brand';
  }

  const lowBound = clamp(low ?? min, min, max);
  const highBound = clamp(high ?? max, lowBound, max);
  const ideal = clamp(optimum ?? (min + max) / 2, min, max);

  if (ideal < lowBound) {
    return value <= lowBound ? 'success' : value <= highBound ? 'warning' : 'danger';
  }

  if (ideal > highBound) {
    return value >= highBound ? 'success' : value >= lowBound ? 'warning' : 'danger';
  }

  return value >= lowBound && value <= highBound ? 'success' : 'warning';
}

/**
 * Medida dentro de uma faixa conhecida, como armazenamento ou nota. Nao e progresso: para algo que avanca ate
 * terminar, `Progress`. O valor sai sempre escrito; o tom nunca e o unico sinal.
 */
export function Meter({
  className,
  high,
  label,
  locale,
  low,
  max = 100,
  min = 0,
  optimum,
  value,
  valueLabel,
  ...props
}: MeterProps) {
  const labelId = `meter-label-${useId()}`;
  const top = Math.max(max, min);
  const current = clamp(value, min, top);
  const fraction = top > min ? (current - min) / (top - min) : 0;
  const tone = toneOf(current, min, top, low, high, optimum);
  const text =
    typeof valueLabel === 'function'
      ? valueLabel(current)
      : (valueLabel ?? formatPercent(fraction, locale === undefined ? {} : { locale }));

  return (
    <div
      {...props}
      className={[styles.meter, className].filter(Boolean).join(' ')}
      role="meter"
      aria-labelledby={labelId}
      aria-valuemin={min}
      aria-valuemax={top}
      aria-valuenow={current}
      aria-valuetext={text}
      data-tone={tone}
    >
      <span className={styles.label} id={labelId}>
        {label}
      </span>
      <div className={styles.track}>
        <div className={`${styles.fill} ${styles[tone]}`} style={{ width: `${fraction * 100}%` }} />
      </div>
      <span className={styles.value}>{text}</span>
    </div>
  );
}
