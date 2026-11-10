import { createContext, useContext, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type CSSProperties } from 'react';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import styles from './Grid.module.css';

/** Espaçamento entre as células: o passo `N` de `--pl-space-N`, de 1 a 7. */
export type GridGap = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type GridAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

export interface GridProps extends ComponentPropsWithRef<'div'> {
  /** Alinhamento vertical das células na linha. Sem ele, elas se esticam. */
  align?: GridAlign;
  /** Máximo de colunas. Sem ele, entram quantas couberem. */
  columns?: number;
  /** Passo de `--pl-space-N` entre as células. Padrão: 4. */
  gap?: GridGap;
  /** Largura mínima de cada coluna: um número, em px, ou um valor CSS como `20rem`. Padrão: 240px. */
  minColumnWidth?: CSSProperties['minWidth'];
}

export interface GridItemProps extends ComponentPropsWithRef<'div'> {
  /** Colunas que a célula ocupa quando a grade tem esse tanto; com menos colunas, ocupa a linha inteira. */
  span?: number;
}

/** Quantas colunas a grade tem agora; `undefined` enquanto não foi medido. */
const GridColumnsContext = createContext<number | undefined>(undefined);

const DEFAULT_MIN_COLUMN_WIDTH = 240;

function countColumns(grid: HTMLElement) {
  const tracks = getComputedStyle(grid).gridTemplateColumns;

  if (!tracks || tracks === 'none' || tracks.includes('repeat(')) {
    return undefined;
  }

  return tracks.trim().split(/\s+/).length;
}

/** O número de colunas é o que o navegador resolveu para a largura da própria grade, não o da janela. */
function useColumnCount(ref: { current: HTMLElement | null }, watch: readonly unknown[]) {
  const [count, setCount] = useState<number>();

  useLayoutEffect(() => {
    const grid = ref.current;

    if (!grid) {
      return;
    }

    const measure = () => setCount(countColumns(grid));
    measure();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(grid);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, watch);

  return count;
}

/** Grade de colunas iguais que se ajusta à própria largura: quantas couberem, cada uma com ao menos `minColumnWidth`. */
function GridRoot({
  align,
  className,
  columns,
  gap = 4,
  minColumnWidth = DEFAULT_MIN_COLUMN_WIDTH,
  ref,
  style,
  ...props
}: GridProps) {
  const ownRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ownRef, ref);
  const count = useColumnCount(ownRef, [columns, gap, minColumnWidth]);
  const min = typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth;
  const limit = columns !== undefined && columns >= 1 ? Math.floor(columns) : undefined;

  return (
    <GridColumnsContext value={count}>
      <div
        {...props}
        className={[styles.root, className].filter(Boolean).join(' ')}
        data-align={align}
        data-gap={gap}
        data-limited={limit === undefined ? undefined : ''}
        ref={mergedRef}
        style={{ ...style, '--grid-columns': limit, '--grid-min': min } as CSSProperties}
      />
    </GridColumnsContext>
  );
}

function GridItem({ className, span, style, ...props }: GridItemProps) {
  const count = useContext(GridColumnsContext);
  let gridColumn: CSSProperties['gridColumn'];

  if (span !== undefined && count !== undefined) {
    gridColumn = span <= count ? `span ${Math.max(1, Math.floor(span))}` : '1 / -1';
  }

  return <div {...props} className={[styles.item, className].filter(Boolean).join(' ')} style={{ ...style, gridColumn }} />;
}

export const Grid = Object.assign(GridRoot, { Item: GridItem });
