export { ChartMap } from './ChartMap';
export type {
  ChartMapLegendPosition,
  ChartMapMarker,
  ChartMapMarkerEvent,
  ChartMapMarkerSeries,
  ChartMapProps,
  ChartMapRegion,
  ChartMapRegionDatum,
} from './ChartMap';
export type { ChartMapFeature, ChartMapFeatureCollection } from './mapGeometry';
import type { ChartColorCategory, ChartColorScale } from '../scales';

/** @deprecated Use `ChartColorScale`. Sai na 0.4.0. */
export type ChartMapColorScale = ChartColorScale;
/** @deprecated Use `ChartColorCategory`. Sai na 0.4.0. */
export type ChartMapCategory = ChartColorCategory;
