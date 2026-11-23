import type { ReactNode } from 'react';
import styles from './RadioGroup.module.css';

interface GroupLegendProps {
  addon?: ReactNode;
  label: string;
  labelId: string;
  required: boolean;
}

/**
 * A legenda do `RadioGroup` e do `CheckboxGroup`. Sem complemento, e a de sempre. Com ele, o texto ganha um id, que o
 * grupo usa no `aria-labelledby`, e o complemento vai ao lado, fora do nome.
 */
export function GroupLegend({ addon, label, labelId, required }: GroupLegendProps) {
  const asterisco = required && <span className={styles.required} aria-hidden="true">*</span>;

  if (addon == null) {
    return (
      <legend className={styles.legend}>
        {label}
        {asterisco}
      </legend>
    );
  }

  return (
    <legend className={[styles.legend, styles.legendWithAddon].join(' ')}>
      <span id={labelId}>
        {label}
        {asterisco}
      </span>
      <span className={styles.legendAddon}>{addon}</span>
    </legend>
  );
}
