import type { CSSProperties, ReactNode } from 'react';
import type { ColorGradient, ColorScaleEntry } from '../scales/colorScale';
import { ChartLegend, type ChartLegendAlign } from './ChartLegend';
import styles from './ColorLegend.module.css';

const ALIGNMENT: Record<ChartLegendAlign, string> = {
  center: styles.legendCenter,
  left: styles.legendLeft,
  right: styles.legendRight,
};

export interface ColorLegendEntry extends ColorScaleEntry {
  count: number;
  hidden: boolean;
}

export interface ColorLegendProps {
  align: ChartLegendAlign;
  /** Blocos proprios do grafico, depois da escala, como as series de marcadores do mapa. */
  children?: ReactNode;
  entries: readonly ColorLegendEntry[];
  formatValue: (value: number) => string;
  gradient?: ColorGradient;
  /** Posicao, na barra, do valor sob o ponteiro. */
  indicator?: number;
  noData?: { color: string; count: number; label: string };
  onHighlight: (key: string | null) => void;
  onToggle: (key: string) => void;
  position: 'top' | 'bottom' | 'right';
  style?: CSSProperties;
  valueLabel: string;
}

/** A legenda liga e desliga pelo rotulo; aqui ele volta a ser a chave, que e o que o grafico e o produto reconhecem. */
export function keyByLabel(items: readonly { key: string; label: string }[]) {
  const keys = new Map<string, string>();
  items.forEach((item) => !keys.has(item.label) && keys.set(item.label, item.key));
  return (label: string | null) => (label === null ? null : (keys.get(label) ?? null));
}

/**
 * Legenda de uma escala de cor: a barra continua, com o valor sob o ponteiro marcado nela, ou as faixas e categorias,
 * que destacam e desligam o que pintam; e a entrada de sem dado.
 */
export function ColorLegend({
  align,
  children,
  entries,
  formatValue,
  gradient,
  indicator,
  noData,
  onHighlight,
  onToggle,
  position,
  style,
  valueLabel,
}: ColorLegendProps) {
  const entryKey = keyByLabel(entries);
  const lateral = position === 'right';
  const listPosition = lateral ? 'right' : 'bottom';

  if (!gradient && entries.length === 0 && !noData && !children) {
    return null;
  }

  return (
    <div className={`${styles.legend} ${lateral ? styles.legendSide : ALIGNMENT[align]}`} style={style}>
      {gradient && (
        <div className={styles.legendBlock}>
          <span className={styles.legendTitle}>
            {valueLabel}
            {gradient.log && ' · escala logarítmica'}
          </span>
          <div aria-hidden="true" className={styles.gradientBar} style={{ background: `linear-gradient(to right, ${gradient.stops.join(', ')})` }}>
            {indicator !== undefined && <span className={styles.gradientIndicator} style={{ left: `${indicator * 100}%` }} />}
          </div>
          <div className={styles.gradientTicks}>
            {gradient.ticks.map((tick) => (
              <span
                className={tick.position === 0 ? styles.tickStart : tick.position === 1 ? styles.tickEnd : styles.tickMiddle}
                key={tick.position}
                style={{ left: `${tick.position * 100}%` }}
              >
                {formatValue(tick.value)}
              </span>
            ))}
          </div>
        </div>
      )}

      {(entries.length > 0 || noData) && (
        <div className={styles.legendBlock}>
          {entries.length > 0 && <span className={styles.legendTitle}>{valueLabel}</span>}
          <div className={styles.legendLists}>
            {entries.length > 0 && (
              <ChartLegend
                align={align}
                entries={entries.map((entry) => ({ ...entry, value: String(entry.count) }))}
                onHighlight={(label) => onHighlight(entryKey(label))}
                onToggle={(label) => {
                  const key = entryKey(label);
                  if (key !== null) {
                    onToggle(key);
                  }
                }}
                position={listPosition}
              />
            )}
            {noData && (
              <ChartLegend
                align={align}
                entries={[{ color: noData.color, label: noData.label, value: String(noData.count) }]}
                position={listPosition}
              />
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
