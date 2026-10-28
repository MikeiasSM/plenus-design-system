import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DataGridLevelContext } from './dataGridContext';
import type { DataGridDetailState, DataGridScrollRoot } from './scrollRoot';
import styles from './DataGrid.module.css';

/** Altura até a primeira medida de um detalhe. */
export const DETAIL_ESTIMATE = 240;

const EMPTY_STATE: DataGridDetailState = {};

export interface DataGridDetailContext<Row> {
  /** Nível da linha-mãe: 1 na grade de fora. */
  level: number;
  row: Row;
  /** Guardado pela grade: sobrevive à rolagem que desmonta o detalhe e a recolher e abrir de novo. */
  state: DataGridDetailState;
  /** Soma os campos ao estado guardado. */
  setState: (patch: DataGridDetailState) => void;
}

interface DataGridDetailRowProps<Row> {
  colCount: number;
  focused: boolean;
  label: string;
  level: number;
  onFocusDetail: (rowKey: string) => void;
  path: string;
  render: (context: DataGridDetailContext<Row>) => ReactNode;
  root: DataGridScrollRoot;
  row: Row;
  rowKey: string;
  top: number;
}

/** Linha de largura total, com uma célula só; o conteúdo acompanha a largura da tela ao rolar para o lado. */
export const DataGridDetailRow = memo(function DataGridDetailRow<Row>({
  colCount,
  focused,
  label,
  level,
  onFocusDetail,
  path,
  render,
  root,
  row,
  rowKey,
  top,
}: DataGridDetailRowProps<Row>) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [state, setLocalState] = useState(() => root.detailStates.get(path) ?? EMPTY_STATE);
  const levelValue = useMemo(() => ({ level: level + 1, path }), [level, path]);

  const setState = useCallback(
    (patch: DataGridDetailState) => {
      const next = { ...(root.detailStates.get(path) ?? EMPTY_STATE), ...patch };
      root.detailStates.set(path, next);
      setLocalState(next);
    },
    [root, path],
  );

  useLayoutEffect(() => {
    const element = rowRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => root.measure(path, element.offsetHeight, DETAIL_ESTIMATE));
    observer.observe(element);
    return () => observer.disconnect();
  }, [root, path]);

  return (
    <div aria-level={level + 1} className={styles.detailRow} ref={rowRef} role="row" style={{ transform: `translateY(${top}px)` }}>
      <div
        aria-colindex={1}
        aria-colspan={colCount}
        aria-label={label}
        className={styles.detailCell}
        data-detail={rowKey}
        role="gridcell"
        tabIndex={focused ? 0 : -1}
        onFocus={() => {
          if (!focused) {
            onFocusDetail(rowKey);
          }
        }}
      >
        <div className={styles.detailContent}>
          <DataGridLevelContext.Provider value={levelValue}>
            {render({ level, row, state, setState })}
          </DataGridLevelContext.Provider>
        </div>
      </div>
    </div>
  );
}) as <Row>(props: DataGridDetailRowProps<Row>) => ReactNode;
