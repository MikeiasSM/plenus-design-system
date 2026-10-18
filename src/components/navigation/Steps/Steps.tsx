import type { ComponentPropsWithRef } from 'react';
import { IconCheck } from '../../icons';
import styles from './Steps.module.css';

export interface StepItem {
  description?: string;
  key: string;
  label: string;
}

export interface StepsProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** Chave da etapa atual. As anteriores contam como concluidas, as seguintes como por vir. */
  current: string;
  items: readonly StepItem[];
  /** Nome da navegacao, para o leitor de tela. */
  label: string;
  /** Com ela, cada etapa vira um botao, para quem pode ir e voltar livremente. */
  onStepChange?: (key: string) => void;
}

export function Steps({ className, current, items, label, onStepChange, ...props }: StepsProps) {
  const currentIndex = items.findIndex((item) => item.key === current);

  return (
    <nav {...props} aria-label={label} className={[styles.steps, className].filter(Boolean).join(' ')}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const state = index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';
          const text = (
            <>
              <span className={styles.label}>{item.label}</span>
              {item.description && <span className={styles.description}>{item.description}</span>}
              {state === 'complete' && <span className={styles.hiddenText}>, concluída</span>}
            </>
          );

          return (
            <li className={[styles.step, styles[state]].join(' ')} key={item.key}>
              <span aria-hidden="true" className={styles.marker}>
                {state === 'complete' ? <IconCheck /> : index + 1}
              </span>
              {onStepChange ? (
                <button
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={styles.text}
                  onClick={() => onStepChange(item.key)}
                  type="button"
                >
                  {text}
                </button>
              ) : (
                <span aria-current={state === 'current' ? 'step' : undefined} className={styles.text}>
                  {text}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
