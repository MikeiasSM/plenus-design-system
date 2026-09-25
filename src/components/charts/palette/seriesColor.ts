import { SERIES_TOKENS, paletteWithAccent, seriesColors } from './palette';

/**
 * Papel da serie quando a cor carrega significado. Uma serie com intencao nao
 * entra na rotacao categorica: pintar despesa com a cor de tema do usuario
 * trocaria o significado da barra a cada usuario.
 */
export type SeriesIntent = 'positive' | 'negative' | 'warning' | 'neutral';

export interface SeriesAppearance {
  color?: string;
  intent?: SeriesIntent;
}

export interface ResolveSeriesColorsOptions {
  accent?: string;
}

const INTENT_TOKENS: Record<SeriesIntent, string> = {
  positive: 'var(--pl-chart-positive)',
  negative: 'var(--pl-chart-negative)',
  warning: 'var(--pl-chart-warning)',
  neutral: 'var(--pl-chart-neutral)',
};

/**
 * Cor de cada serie, em tres niveis de precedencia: a cor informada pelo
 * implementador vence; depois a intencao semantica; por fim a paleta
 * categorica, que abre com a cor de tema quando houver.
 *
 * Series com cor ou intencao nao consomem posicao da paleta, para que as
 * categoricas sigam a ordem sem deixar buracos.
 */
export function resolveSeriesColors(
  series: readonly SeriesAppearance[],
  { accent }: ResolveSeriesColorsOptions = {},
) {
  const categoricas = series.filter((serie) => !serie.color && !serie.intent).length;
  const paleta = accent ? paletteWithAccent(accent, categoricas) : seriesColors(categoricas);
  let proxima = 0;

  return series.map((serie) => {
    if (serie.color) {
      return serie.color;
    }

    if (serie.intent) {
      return INTENT_TOKENS[serie.intent];
    }

    const cor = paleta[proxima] ?? seriesColors(SERIES_TOKENS)[proxima % SERIES_TOKENS];
    proxima += 1;

    return cor;
  });
}
