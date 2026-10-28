import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { IconArrowDown, IconArrowUp, IconMore } from '../../icons';
import { Menu, type MenuSection } from '../../overlays/Menu';
import type { DataGridSortItem } from './gridState';
import styles from './DataGrid.module.css';

/** Largura mínima de uma coluna redimensionada pela pessoa. */
export const MIN_COLUMN_WIDTH = 48;

interface DataGridHeaderCellProps {
  /** Se a coluna arrastada pode cair aqui: só dentro da mesma área, fixa ou não. */
  canDrop: () => boolean;
  className: string;
  colIndex: number;
  columnId: string;
  /** Caixa de seleção de todas e o espaço da seta, na primeira coluna. */
  controls: ReactNode;
  focused: boolean;
  header: string;
  label: ReactNode;
  labelId: string;
  menuItems: readonly MenuSection[];
  menuOpen: boolean;
  onDragEnd: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  onFit: () => void;
  onFocus: () => void;
  onMenuOpenChange: (open: boolean) => void;
  /** Largura do conteúdo, sem os controles, enquanto a pessoa arrasta a borda. */
  onResize: (width: number) => void;
  onSort: ((event: MouseEvent) => void) | undefined;
  sortCount: number;
  sortIndex: number;
  sortItem: DataGridSortItem | undefined;
  style: CSSProperties;
  /** Largura atual do conteúdo, sem os controles, de onde o redimensionar parte. */
  width: number;
}

export function DataGridHeaderCell({
  canDrop,
  className,
  colIndex,
  columnId,
  controls,
  focused,
  header,
  label,
  labelId,
  menuItems,
  menuOpen,
  onDragEnd,
  onDragStart,
  onDrop,
  onFit,
  onFocus,
  onMenuOpenChange,
  onResize,
  onSort,
  sortCount,
  sortIndex,
  sortItem,
  style,
  width,
}: DataGridHeaderCellProps) {
  /* Com o ponteiro capturado, o clique de soltar cai na borda, e não no título, que ordenaria. */
  const resizeStart = useRef<{ x: number; width: number } | null>(null);
  const [dropTarget, setDropTarget] = useState(false);

  function startResize(event: PointerEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeStart.current = { x: event.clientX, width };
  }

  function resize(event: PointerEvent<HTMLSpanElement>) {
    const start = resizeStart.current;
    if (start) {
      onResize(Math.max(start.width + event.clientX - start.x, MIN_COLUMN_WIDTH));
    }
  }

  function stopResize() {
    resizeStart.current = null;
  }

  return (
    <div
      aria-colindex={colIndex}
      aria-labelledby={labelId}
      aria-sort={sortIndex === 0 && sortItem ? (sortItem.direction === 'asc' ? 'ascending' : 'descending') : undefined}
      className={[className, dropTarget && styles.dropTarget].filter(Boolean).join(' ')}
      data-column={columnId}
      data-row=""
      draggable
      role="columnheader"
      style={style}
      tabIndex={focused ? 0 : -1}
      onClick={(event) => {
        /* O clique num item do menu atravessa o portal pela árvore do React: não é clique no título. */
        if (onSort && event.currentTarget.contains(event.target as Node)) {
          onSort(event);
        }
      }}
      onDragEnd={() => {
        setDropTarget(false);
        onDragEnd();
      }}
      onDragLeave={() => setDropTarget(false)}
      onDragOver={(event) => {
        if (canDrop()) {
          event.preventDefault();
          setDropTarget(true);
        }
      }}
      onDragStart={(event) => {
        if (resizeStart.current) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', header);
        onDragStart();
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDropTarget(false);
        onDrop();
      }}
      onFocus={() => {
        if (!focused) {
          onFocus();
        }
      }}
    >
      {controls}
      <span className={styles.headerLabel} id={labelId}>
        {label}
      </span>
      {sortItem && (
        <span aria-hidden="true" className={styles.sortMark}>
          {sortItem.direction === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
          {sortCount > 1 && <sup>{sortIndex + 1}</sup>}
        </span>
      )}
      <span className={[styles.headerActions, menuOpen && styles.headerActionsOpen].filter(Boolean).join(' ')}>
        <Menu items={menuItems} label={`Menu da coluna ${header}`} open={menuOpen} onOpenChange={onMenuOpenChange}>
          <button
            aria-label={`Menu da coluna ${header}`}
            className={styles.headerMenuButton}
            tabIndex={-1}
            type="button"
            onClick={(event) => event.stopPropagation()}
          >
            <IconMore size={14} />
          </button>
        </Menu>
      </span>
      <span
        aria-hidden="true"
        className={styles.resizer}
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onFit();
        }}
        onLostPointerCapture={stopResize}
        onPointerDown={startResize}
        onPointerMove={resize}
        onPointerUp={stopResize}
      />
    </div>
  );
}
