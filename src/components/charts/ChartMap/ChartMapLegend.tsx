import { ChartLegend, ColorLegend, keyByLabel, type ColorLegendProps } from '../core';
import styles from './ChartMap.module.css';

export interface MapLegendSeries {
  color: string;
  hidden: boolean;
  key: string;
  label: string;
}

interface ChartMapLegendProps extends Omit<ColorLegendProps, 'children'> {
  markerSeries: readonly MapLegendSeries[];
  markerSizes?: { maximum: number; radiusOf: (value: number) => number };
  markerValueLabel: string;
  onToggleMarkerSeries: (key: string) => void;
}

/** A legenda da escala de cor, mais as series de marcadores com a chave de tamanho. */
export function ChartMapLegend({
  markerSeries,
  markerSizes,
  markerValueLabel,
  onToggleMarkerSeries,
  ...legend
}: ChartMapLegendProps) {
  const seriesKey = keyByLabel(markerSeries);

  return (
    <ColorLegend {...legend}>
      {markerSeries.length > 0 && (
        <div className={styles.markerBlock}>
          <span className={styles.markerTitle}>{markerValueLabel}</span>
          <ChartLegend
            align={legend.align}
            entries={markerSeries}
            onToggle={(label) => {
              const key = seriesKey(label);
              if (key !== null) {
                onToggleMarkerSeries(key);
              }
            }}
            position={legend.position === 'right' ? 'right' : 'bottom'}
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
                      {legend.formatValue(value)}
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </ColorLegend>
  );
}
