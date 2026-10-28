import type { ComponentPropsWithRef } from 'react';
import { IconCheck } from '../../icons';
import stepsStyles from '../../navigation/Steps/Steps.module.css';
import styles from './Timeline.module.css';

export type TimelineSize = 'sm' | 'md';

export interface TimelineItem {
  date?: string;
  description?: string;
  key: string;
  label: string;
}

export interface TimelineProps extends Omit<ComponentPropsWithRef<'ol'>, 'children'> {
  /** Chave do estado atual. Os anteriores contam como concluídos, os seguintes como por vir. */
  current: string;
  items: readonly TimelineItem[];
  /** Nome da lista, para o leitor de tela. */
  label: string;
  /** `sm` para painéis estreitos: marcador de 16px e rótulo em caption. */
  size?: TimelineSize;
}

export function Timeline({ className, current, items, label, size = 'md', ...props }: TimelineProps) {
  const currentIndex = items.findIndex((item) => item.key === current);

  return (
    <ol {...props} aria-label={label} className={[styles.timeline, styles[size], className].filter(Boolean).join(' ')}>
      {items.map((item, index) => {
        const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';

        return (
          <li
            aria-current={state === 'current' ? 'step' : undefined}
            className={[styles.item, styles[state], stepsStyles[state]].filter(Boolean).join(' ')}
            key={item.key}
          >
            <span aria-hidden="true" className={`${styles.marker} ${stepsStyles.marker}`}>
              {state === 'complete' ? <IconCheck /> : <span className={styles.dot} />}
            </span>
            <span className={styles.text}>
              <span className={`${styles.label} ${stepsStyles.label}`}>{item.label}</span>
              {state === 'complete' && <span className={stepsStyles.hiddenText}>, concluído</span>}
              {state === 'current' && <span className={stepsStyles.hiddenText}>, atual</span>}
              {item.description && <span className={stepsStyles.description}>{item.description}</span>}
              {item.date && <span className={styles.date}>{item.date}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
