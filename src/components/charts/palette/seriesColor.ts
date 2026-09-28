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

/** Token de cada intencao. A paleta e quem detem esse mapa. */
export const INTENT_TOKENS: Record<SeriesIntent, string> = {
  positive: 'var(--pl-chart-positive)',
  negative: 'var(--pl-chart-negative)',
  warning: 'var(--pl-chart-warning)',
  neutral: 'var(--pl-chart-neutral)',
};

/** Cores da paleta e das intencoes, que tem token de texto proprio, medido em cada tema. */
const COR_COM_TEXTO_PROPRIO = /^var\(--pl-chart-(series-\d|positive|negative|warning|neutral)\)$/;

/** Luminancia em que branco e preto medem o mesmo contraste; acima dela, o preto mede mais. */
const LUMINANCIA_DE_EMPATE = Math.sqrt(1.05 * 0.05) - 0.05;

function luminanciaDoHexadecimal(cor: string) {
  const hexadecimal = cor.trim().replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i, '#$1$1$2$2$3$3');
  const canais = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hexadecimal);

  if (!canais) {
    return undefined;
  }

  const [r, g, b] = canais.slice(1).map((canal) => {
    const valor = parseInt(canal, 16) / 255;

    return valor <= 0.04045 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Cor do texto escrito sobre a marca, como a porcentagem dentro da fatia. A cor
 * informada em hexadecimal e medida; em outro formato, o texto fica branco.
 */
export function textColorOn(color: string) {
  const token = COR_COM_TEXTO_PROPRIO.exec(color.trim())?.[1];

  if (token) {
    return `var(--pl-chart-on-${token})`;
  }

  const luminancia = luminanciaDoHexadecimal(color);

  return luminancia !== undefined && luminancia > LUMINANCIA_DE_EMPATE
    ? 'var(--pl-chart-on-light)'
    : 'var(--pl-chart-on-dark)';
}

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
