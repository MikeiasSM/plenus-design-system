import { useId, useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import styles from './Accordion.module.css';
import { IconMinusCircle, IconPlusCircle } from '../../icons';

export interface AccordionItem {
  content: ReactNode;
  disabled?: boolean;
  key: string;
  label: string;
}

export type AccordionIconPosition = 'left' | 'right';

export interface AccordionProps {
  defaultExpandedKeys?: readonly string[];
  expandedKeys?: readonly string[];
  items: readonly AccordionItem[];
  multiple?: boolean;
  onExpandedChange?: (keys: readonly string[]) => void;
  /** Direita e a convencao da web; esquerda serve a rotulos curtos em coluna estreita. */
  iconPosition?: AccordionIconPosition;
  /** Divisor entre as secoes, com a folga que ele exige. */
  divider?: boolean;
}

export function Accordion({
  defaultExpandedKeys,
  expandedKeys,
  items,
  multiple = false,
  onExpandedChange,
  iconPosition = 'right',
  divider = true,
}: AccordionProps) {
  const baseId = `accordion-${useId()}`;
  const nodes = useRef(new Map<string, HTMLElement>());
  const collection = useMemo<SelectionItem[]>(
    () => items.map((item) => ({ key: item.key, disabled: item.disabled, textValue: item.label })),
    [items],
  );
  const selection = useSelection({
    items: collection,
    mode: multiple ? 'multiple' : 'single',
    defaultSelectedKeys: expandedKeys === undefined ? defaultExpandedKeys : undefined,
    selectedKeys: expandedKeys,
    onSelectionChange: (keys) => onExpandedChange?.([...keys]),
  });

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, key: string) {
    let destino: string | undefined;

    if (event.key === 'ArrowDown') {
      destino = proxima(collection, key, 1);
    } else if (event.key === 'ArrowUp') {
      destino = proxima(collection, key, -1);
    } else if (event.key === 'Home') {
      destino = collection.find((item) => !item.disabled)?.key;
    } else if (event.key === 'End') {
      destino = [...collection].reverse().find((item) => !item.disabled)?.key;
    }

    if (destino) {
      event.preventDefault();
      nodes.current.get(destino)?.focus();
    }
  }

  return (
    <div className={[styles.accordion, divider && styles.divided].filter(Boolean).join(' ')}>
      {items.map((item) => {
        const aberto = selection.selectedKeys.has(item.key);

        return (
          <div className={styles.item} key={item.key}>
            <h3 className={styles.heading}>
              <button
                ref={(node) => {
                  if (node) {
                    nodes.current.set(item.key, node);
                  } else {
                    nodes.current.delete(item.key);
                  }
                }}
                className={[styles.trigger, iconPosition === 'left' && styles.iconLeft].filter(Boolean).join(' ')}
                type="button"
                id={`${baseId}-${item.key}`}
                aria-controls={`${baseId}-${item.key}-panel`}
                aria-expanded={aberto}
                disabled={item.disabled}
                onClick={() => selection.select(item.key)}
                onKeyDown={(event) => handleKeyDown(event, item.key)}
              >
                <span className={styles.label}>{item.label}</span>
                {aberto ? (
                  <IconMinusCircle className={styles.icon} size={20} />
                ) : (
                  <IconPlusCircle className={styles.icon} size={20} />
                )}
              </button>
            </h3>
            <div
              className={styles.panel}
              id={`${baseId}-${item.key}-panel`}
              role="region"
              aria-labelledby={`${baseId}-${item.key}`}
              hidden={!aberto}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function proxima(items: readonly SelectionItem[], from: string, passo: 1 | -1) {
  const total = items.length;
  const inicio = items.findIndex((item) => item.key === from);

  for (let i = 1; i <= total; i += 1) {
    const item = items[(inicio + passo * i + total * total) % total];
    if (!item.disabled) {
      return item.key;
    }
  }

  return from;
}
