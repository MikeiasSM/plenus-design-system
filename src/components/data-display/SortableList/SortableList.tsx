import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useSelection, type SelectionItem } from '../../../hooks/useSelection';
import { IconDragHandle } from '../../icons';
import styles from './SortableList.module.css';

export interface SortableListItem {
  /** Ações da linha, como `ButtonIcon`: alcançadas pelas setas para os lados. */
  actions?: ReactNode;
  excerpt?: string;
  icon?: ReactNode;
  key: string;
  /** Nível de aninhamento, a partir de 1. Só recua a linha. */
  level?: number;
  title: string;
}

export interface SortableListProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onKeyDown'> {
  defaultSelectedKey?: string;
  items: readonly SortableListItem[];
  /** Nome da lista, para o leitor de tela. */
  label: string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSelectionChange?: (key: string) => void;
  /** `null` deixa a lista controlada sem nenhum item escolhido. */
  selectedKey?: string | null;
}

interface Drag {
  from: number;
  /** Fresta onde o item cairia: 0 antes do primeiro, `items.length` depois do último. */
  gap: number;
}

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]';

function focusWithinRow(row: HTMLElement, from: HTMLElement, step: 1 | -1) {
  const stops = [row, ...row.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => !element.matches(':disabled'));
  stops[stops.indexOf(from) + step]?.focus();
}

export function SortableList({
  className,
  defaultSelectedKey,
  items,
  label,
  onReorder,
  onSelectionChange,
  selectedKey,
  ...props
}: SortableListProps) {
  const baseId = useId();
  const rows = useRef(new Map<string, HTMLDivElement>());
  const movedKey = useRef<string>(undefined);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const collection = useMemo<SelectionItem[]>(() => items.map((item) => ({ key: item.key, textValue: item.title })), [items]);
  const selection = useSelection({
    items: collection,
    mode: 'single',
    defaultSelectedKeys: defaultSelectedKey === undefined ? undefined : [defaultSelectedKey],
    selectedKeys: selectedKey === undefined ? undefined : selectedKey === null ? [] : [selectedKey],
    onSelectionChange: (keys) => {
      const [key] = keys;
      if (key !== undefined) {
        onSelectionChange?.(key);
      }
    },
  });
  const [selected] = selection.selectedKeys;
  const tabStop = [selection.focusedKey, selected].find((key) => items.some((item) => item.key === key)) ?? items[0]?.key;
  const dragging = drag !== null;
  // Soltar logo acima ou logo abaixo de si mesmo não move nada, e não ganha indicador.
  const dropGap = drag && drag.gap !== drag.from && drag.gap !== drag.from + 1 ? drag.gap : undefined;

  // Os controles das linhas saem da ordem do Tab: a lista é uma parada só, e as setas para os lados chegam a eles.
  useEffect(() => {
    rows.current.forEach((row) => row.querySelectorAll<HTMLElement>(FOCUSABLE).forEach((element) => (element.tabIndex = -1)));
  });

  // Reordenar move o nó no DOM, e o navegador tira o foco dele.
  useEffect(() => {
    if (movedKey.current !== undefined) {
      rows.current.get(movedKey.current)?.focus();
      movedKey.current = undefined;
    }
  }, [items]);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    function cancel(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setDrag(null);
      }
    }

    document.addEventListener('keydown', cancel, true);
    return () => document.removeEventListener('keydown', cancel, true);
  }, [dragging]);

  function choose(key: string | undefined) {
    if (key === undefined) {
      return;
    }

    if (key === selected) {
      selection.focus(key);
    } else {
      selection.select(key);
    }

    rows.current.get(key)?.focus();
  }

  function move(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= items.length || toIndex === fromIndex) {
      return;
    }

    movedKey.current = items[fromIndex].key;
    onReorder(fromIndex, toIndex);
    setAnnouncement(`Movido para a posição ${toIndex + 1} de ${items.length}`);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLElement>('[role="row"]');
    const index = items.findIndex((item) => rows.current.get(item.key) === row);

    if (!row || index < 0) {
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      focusWithinRow(row, target, event.key === 'ArrowRight' ? 1 : -1);
      return;
    }

    // Nos controles da linha, as demais teclas são deles.
    if (target !== row) {
      return;
    }

    if (event.altKey && event.key === 'ArrowUp') {
      move(index, index - 1);
    } else if (event.altKey && event.key === 'ArrowDown') {
      move(index, index + 1);
    } else if (event.key === 'ArrowUp') {
      choose(items[index - 1]?.key);
    } else if (event.key === 'ArrowDown') {
      choose(items[index + 1]?.key);
    } else if (event.key === 'Home') {
      choose(items[0].key);
    } else if (event.key === 'End') {
      choose(items[items.length - 1].key);
    } else if (event.key === ' ' || event.key === 'Enter') {
      choose(items[index].key);
    } else {
      return;
    }

    event.preventDefault();
  }

  function handleRowClick(event: MouseEvent<HTMLDivElement>, key: string) {
    // O clique num controle da linha é do controle, e não escolhe a linha.
    if ((event.target as HTMLElement).closest(FOCUSABLE) === event.currentTarget) {
      choose(key);
    }
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ from: index, gap: index });
  }

  function followDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) {
      return;
    }

    const gap = items.filter((item) => {
      const box = rows.current.get(item.key)?.getBoundingClientRect();
      return box !== undefined && box.top + box.height / 2 < event.clientY;
    }).length;

    if (gap !== drag.gap) {
      setDrag({ ...drag, gap });
    }
  }

  function endDrag() {
    if (!drag) {
      return;
    }

    setDrag(null);
    move(drag.from, drag.gap > drag.from ? drag.gap - 1 : drag.gap);
  }

  return (
    <>
      <div
        {...props}
        aria-label={label}
        className={[styles.list, className].filter(Boolean).join(' ')}
        onKeyDown={handleKeyDown}
        role="grid"
      >
        {items.map((item, index) => {
          const depth = (item.level ?? 1) - 1;
          const titleId = `${baseId}-${index}-title`;
          const excerptId = `${baseId}-${index}-excerpt`;

          return (
            <div
              aria-describedby={item.excerpt ? excerptId : undefined}
              aria-labelledby={titleId}
              aria-selected={item.key === selected}
              className={[
                styles.row,
                item.key === selected && styles.selected,
                drag?.from === index && styles.dragging,
                dropGap === index && styles.dropBefore,
                dropGap === items.length && index === items.length - 1 && styles.dropAfter,
              ]
                .filter(Boolean)
                .join(' ')}
              key={item.key}
              onClick={(event) => handleRowClick(event, item.key)}
              onFocus={() => selection.focus(item.key)}
              ref={(node) => {
                if (node) {
                  rows.current.set(item.key, node);
                } else {
                  rows.current.delete(item.key);
                }
              }}
              role="row"
              style={depth > 0 ? { marginInlineStart: `calc(${depth} * var(--pl-space-5))` } : undefined}
              tabIndex={item.key === tabStop ? 0 : -1}
            >
              <div className={styles.cell} role="gridcell">
                <button
                  aria-describedby={`${baseId}-hint`}
                  aria-label={`Reordenar ${item.title}`}
                  className={styles.handle}
                  onPointerCancel={() => setDrag(null)}
                  onPointerDown={(event) => startDrag(event, index)}
                  onPointerMove={followDrag}
                  onPointerUp={endDrag}
                  type="button"
                >
                  <IconDragHandle />
                </button>
                {item.icon && (
                  <span aria-hidden="true" className={styles.icon}>
                    {item.icon}
                  </span>
                )}
                <span className={styles.text}>
                  <span className={styles.title} id={titleId}>
                    {item.title}
                  </span>
                  {item.excerpt && (
                    <span className={styles.excerpt} id={excerptId}>
                      {item.excerpt}
                    </span>
                  )}
                </span>
                {item.actions && <span className={styles.actions}>{item.actions}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <span className={styles.hiddenText} id={`${baseId}-hint`}>
        Na linha, Alt com as setas para cima e para baixo move o item.
      </span>
      <span className={styles.hiddenText} role="status">
        {announcement}
      </span>
    </>
  );
}
