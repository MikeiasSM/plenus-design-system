import type { CSSProperties } from 'react';
import { ChartLegend, type ChartLegendAlign } from '../core';
import type { MapGradient, MapScaleEntry } from './mapScales';
import styles from './ChartMap.module.css';

const ALIGNMENT: Record<ChartLegendAlign, string> = {
  center: styles.legendCenter,
  left: styles.legendLeft,
  right: styles.legendRight,
};

export interface MapLegendEntry extends MapScaleEntry {
  count: number;
  hidden: boolean;
}

export interface MapLegendSeries {
  color: string;
  hidden: boolean;
  key: string;
  label: string;
}

interface ChartMapLegendProps {
  align: ChartLegendAlign;
  entries: readonly MapLegendEntry[];
  formatValue: (value: number) => string;
  gradient?: MapGradient;
  /** Posicao, na barra, do valor da regiao sob o ponteiro. */
  indicator?: number;
  markerSeries: readonly MapLegendSeries[];
  markerSizes?: { maximum: number; radiusOf: (value: number) => number };
  markerValueLabel: string;
  noData?: { color: string; count: number; label: string };
  onHighlight: (key: string | null) => void;
  onToggle: (key: string) => void;
  onToggleMarkerSeries: (key: string) => void;
  position: 'top' | 'bottom' | 'right';
  style?: CSSProperties;
  valueLabel: string;
}

/** A legenda liga e desliga pelo rotulo; aqui ele volta a ser a chave, que e o que o mapa e o produto reconhecem. */
function byLabel(items: readonly { key: string; label: string }[]) {
  const keys = new Map<string, string>();
  items.forEach((item) => !keys.has(item.label) && keys.set(item.label, item.key));
  return (label: string | null) => (label === null ? null : (keys.get(label) ?? null));
}

/**
 * Legenda do mapa: a barra da escala continua, com o valor sob o ponteiro marcado nela, ou as faixas e categorias, que
 * destacam e desligam as regioes; a entrada de sem dado; e as series de marcadores com a chave de tamanho.
 */
export function ChartMapLegend({
  align,
  entries,
  formatValue,
  gradient,
  indicator,
  markerSeries,
  markerSizes,
  markerValueLabel,
  noData,
  onHighlight,
  onToggle,
  onToggleMarkerSeries,
  position,
  style,
  valueLabel,
}: ChartMapLegendProps) {
  const entryKey = byLabel(entries);
  const seriesKey = byLabel(markerSeries);
  const lateral = position === 'right';
  const listPosition = lateral ? 'right' : 'bottom';

  if (!gradient && entries.length === 0 && !noData && markerSeries.length === 0) {
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

      {markerSeries.length > 0 && (
        <div className={styles.legendBlock}>
          <span className={styles.legendTitle}>{markerValueLabel}</span>
          <ChartLegend
            align={align}
            entries={markerSeries}
            onToggle={(label) => {
              const key = seriesKey(label);
              if (key !== null) {
                onToggleMarkerSeries(key);
              }
            }}
            position={listPosition}
            swatch="dot"
          />
          {markerSizes && (
            <div aria-hidden="true" className={styles.sizeKey}>
              {[markerSizes.maximum / 10, markerSizes.maximum / 2, markerSizes.maximum]
                .map((value) => Number(value.toPrecision(2)))
                .map((value) => {
                  const diameter = markerSizes.radiusOf(value) * 2;

                  return (
                    <span className={styles.sizeKeyItem} key={value}>
                      <i className={styles.sizeKeyCircle} style={{ height: diameter, width: diameter }} />
                      {formatValue(value)}
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
