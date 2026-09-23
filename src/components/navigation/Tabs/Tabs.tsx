import { useEffect, useId, useMemo, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import styles from './Tabs.module.css';

export interface TabItem {
  content: ReactNode;
  disabled?: boolean;
  key: string;
  label: string;
}

export type TabsOrientation = 'horizontal' | 'vertical';

export interface TabsProps {
  defaultSelectedKey?: string;
  items: readonly TabItem[];
  label: string;
  onSelectionChange?: (key: string) => void;
  orientation?: TabsOrientation;
  selectedKey?: string;
}

export function Tabs({
  defaultSelectedKey,
  items,
  label,
  onSelectionChange,
  orientation = 'horizontal',
  selectedKey,
}: TabsProps) {
  const baseId = `tabs-${useId()}`;
  const nodes = useRef(new Map<string, HTMLElement>());
  const collection = useMemo<SelectionItem[]>(
    () => items.map((item) => ({ key: item.key, disabled: item.disabled, textValue: item.label })),
    [items],
  );
  const primeira = collection.find((item) => !item.disabled)?.key;
  const selection = useSelection({
    items: collection,
    mode: 'single',
    defaultSelectedKeys: selectedKey === undefined ? [defaultSelectedKey ?? primeira ?? ''] : undefined,
    selectedKeys: selectedKey === undefined ? undefined : [selectedKey],
    onSelectionChange: (keys) => {
      const [escolhida] = keys;
      if (escolhida !== undefined) {
        onSelectionChange?.(escolhida);
      }
    },
  });
  const [ativa] = selection.selectedKeys;
  const painel = items.find((item) => item.key === ativa);

  useEffect(() => {
    if (selection.focusedKey) {
      nodes.current.get(selection.focusedKey)?.focus();
    }
  }, [selection.focusedKey]);

  // Ativacao automatica: mover o foco troca a aba, conforme o padrao do APG
  // para paineis que carregam instantaneamente.
  function mover(proxima: string | undefined) {
    if (proxima) {
      selection.select(proxima);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const atual = selection.focusedKey ?? ativa;
    const avancar = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const voltar = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

    if (event.key === avancar) {
      event.preventDefault();
      mover(proximaChave(collection, atual, 1));
    } else if (event.key === voltar) {
      event.preventDefault();
      mover(proximaChave(collection, atual, -1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      mover(collection.find((item) => !item.disabled)?.key);
    } else if (event.key === 'End') {
      event.preventDefault();
      mover([...collection].reverse().find((item) => !item.disabled)?.key);
    }
  }

  return (
    <div className={[styles.tabs, styles[orientation]].join(' ')}>
      <div
        className={styles.list}
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => (
          <button
            key={item.key}
            ref={(node) => {
              if (node) {
                nodes.current.set(item.key, node);
              } else {
                nodes.current.delete(item.key);
              }
            }}
            className={[styles.tab, ativa === item.key && styles.active].filter(Boolean).join(' ')}
            type="button"
            role="tab"
            id={`${baseId}-${item.key}`}
            aria-controls={`${baseId}-${item.key}-panel`}
            aria-selected={ativa === item.key}
            disabled={item.disabled}
            tabIndex={ativa === item.key ? 0 : -1}
            onClick={() => selection.select(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {painel && (
        <div
          className={styles.panel}
          role="tabpanel"
          id={`${baseId}-${painel.key}-panel`}
          aria-labelledby={`${baseId}-${painel.key}`}
          tabIndex={0}
        >
          {painel.content}
        </div>
      )}
    </div>
  );
}

// Percorre em circulo, como o APG define para abas.
function proximaChave(items: readonly SelectionItem[], from: string | undefined, passo: 1 | -1) {
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
