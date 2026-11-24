import { useState, type ComponentPropsWithRef } from 'react';
import { formatNumber } from '../../../utils/formatters';
import { IconCheck } from '../../icons';
import styles from './Steps.module.css';

export interface StepItem {
  description?: string;
  key: string;
  label: string;
}

/** `stacked`: marcador acima do nome. `inline`: marcador menor ao lado do nome, ligado ao próximo por uma linha fina. */
export type StepsLayout = 'stacked' | 'inline';

export interface StepsProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** Chave da etapa atual. As anteriores contam como concluidas, as seguintes como por vir. */
  current?: string;
  /** Etapa inicial no modo nao controlado. Sem ela, a primeira. */
  defaultCurrent?: string;
  /** Troca o texto da posição, que por padrão é `Etapa 2 de 3`. */
  formatPosition?: (current: number, total: number) => string;
  items: readonly StepItem[];
  /** Nome da navegacao, para o leitor de tela. */
  label: string;
  layout?: StepsLayout;
  /** Com ela, cada etapa vira um botao, para quem pode ir e voltar livremente. */
  onCurrentChange?: (key: string) => void;
  /** Mostra a posição da etapa atual, como `Etapa 2 de 3`, antes das etapas. É só leitura. */
  showPosition?: boolean;
}

export function Steps({
  className,
  current,
  defaultCurrent,
  formatPosition,
  items,
  label,
  layout = 'stacked',
  onCurrentChange,
  showPosition = false,
  ...props
}: StepsProps) {
  const [internalCurrent, setInternalCurrent] = useState(defaultCurrent ?? items[0]?.key);
  const currentKey = current ?? internalCurrent;
  const currentIndex = items.findIndex((item) => item.key === currentKey);
  const navigable = onCurrentChange !== undefined;

  function goTo(key: string) {
    if (current === undefined) {
      setInternalCurrent(key);
    }
    onCurrentChange?.(key);
  }

  return (
    <nav
      {...props}
      aria-label={label}
      className={[styles.steps, layout === 'inline' && styles.inline, className].filter(Boolean).join(' ')}
    >
      {showPosition && currentIndex >= 0 && (
        <p className={styles.position}>{(formatPosition ?? formatarPosicao)(currentIndex + 1, items.length)}</p>
      )}
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
              {navigable ? (
                <button
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={styles.text}
                  onClick={() => goTo(item.key)}
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

function formatarPosicao(atual: number, total: number) {
  return `Etapa ${formatNumber(atual)} de ${formatNumber(total)}`;
}
