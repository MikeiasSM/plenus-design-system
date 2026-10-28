import { useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import styles from './Chart.module.css';

/** Lugar de uma marca na grade do grafico: a coluna e a categoria ou a fatia; a linha, a serie. */
export interface MarkPosition {
  column: number;
  row: number;
}

/** Argumento do clique numa marca de serie: a barra, o ponto. */
export interface ChartMarkClick {
  category: string;
  index: number;
  series: string;
  value: number;
}

export interface MarkNavigationOptions {
  /** Ativa a marca, pelo clique, por Enter ou por Espaco. Sem ele, as marcas nao sao botoes. */
  onActivate?: (position: MarkPosition) => void;
  /** Marca em foco pelo teclado, ou `null` ao sair, para o grafico realcar e abrir o balao. */
  onFocusMark?: (position: MarkPosition | null) => void;
  /** As marcas que existem e estao visiveis. As setas saltam as ausentes. */
  present: readonly MarkPosition[];
}

const DIRECTIONS: Record<string, MarkPosition> = {
  ArrowDown: { column: 0, row: 1 },
  ArrowLeft: { column: -1, row: 0 },
  ArrowRight: { column: 1, row: 0 },
  ArrowUp: { column: 0, row: -1 },
};

const keyOf = ({ column, row }: MarkPosition) => `${row}:${column}`;

function positionFrom(event: SyntheticEvent): MarkPosition | null {
  const mark = (event.target as Element).getAttribute?.('data-mark');
  const [row, column] = mark?.split(':').map(Number) ?? [];

  return Number.isInteger(row) && Number.isInteger(column) ? { column, row } : null;
}

/** A marca mais proxima na direcao da seta, na mesma linha ou na mesma coluna. */
function neighbor(present: readonly MarkPosition[], from: MarkPosition, { column, row }: MarkPosition) {
  const candidates = present.filter((mark) =>
    column !== 0
      ? mark.row === from.row && Math.sign(mark.column - from.column) === column
      : mark.column === from.column && Math.sign(mark.row - from.row) === row,
  );

  return candidates.sort(
    (a, b) => Math.abs(a.column - from.column) + Math.abs(a.row - from.row) - (Math.abs(b.column - from.column) + Math.abs(b.row - from.row)),
  )[0];
}

/**
 * Marcas como botoes, quando o grafico tem clique na marca: uma parada de
 * tabulacao para o grupo, setas entre as marcas, Home e End nas pontas da
 * linha e Enter ou Espaco para ativar.
 */
export function useMarkNavigation({ onActivate, onFocusMark, present }: MarkNavigationOptions) {
  const [tabStop, setTabStop] = useState<string | null>(null);
  const interactive = onActivate !== undefined;
  const keys = present.map(keyOf);
  const stop = tabStop !== null && keys.includes(tabStop) ? tabStop : keys[0];

  function move(event: KeyboardEvent<SVGElement>, to: MarkPosition | undefined) {
    event.preventDefault();

    if (to) {
      setTabStop(keyOf(to));
      event.currentTarget.querySelector<SVGElement>(`[data-mark="${keyOf(to)}"]`)?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<SVGElement>) {
    const from = positionFrom(event);

    if (!from) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate?.(from);
      return;
    }

    if (event.key in DIRECTIONS) {
      move(event, neighbor(present, from, DIRECTIONS[event.key]));
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      const row = present.filter((mark) => mark.row === from.row).sort((a, b) => a.column - b.column);
      move(event, event.key === 'Home' ? row[0] : row.at(-1));
    }
  }

  return {
    groupProps: interactive
      ? {
          onBlur: () => onFocusMark?.(null),
          onClick: (event: SyntheticEvent) => {
            const position = positionFrom(event);
            if (position) {
              setTabStop(keyOf(position));
              onActivate(position);
            }
          },
          onFocus: (event: SyntheticEvent) => {
            const position = positionFrom(event);
            if (position) {
              setTabStop(keyOf(position));
              onFocusMark?.(position);
            }
          },
          onKeyDown: handleKeyDown,
        }
      : {},
    interactive,
    /** Atributos da marca, somando a classe propria dela a de botao. */
    markProps: (position: MarkPosition, className?: string) =>
      interactive
        ? {
            className: className ? `${className} ${styles.interactiveMark}` : styles.interactiveMark,
            'data-mark': keyOf(position),
            role: 'button' as const,
            tabIndex: keyOf(position) === stop ? 0 : -1,
          }
        : { className },
  };
}
