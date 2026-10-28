import { isHexColor, oklchToHex, toOklch } from '../../../utils/palette/color';

/** Quantidade de series que a paleta do Design System cobre. */
export const SERIES_TOKENS = 6;

/**
 * Cores das series na paleta do Design System, como variaveis CSS. Resolvem
 * tema claro e escuro sozinhas, e a serie N usa sempre o mesmo token, para que
 * um filtro que reduza as series nao repinte as restantes.
 */
export function seriesColors(quantidade: number) {
  return Array.from(
    { length: Math.max(quantidade, 0) },
    (_, indice) => `var(--pl-chart-series-${(indice % SERIES_TOKENS) + 1})`,
  );
}

/** Cores de marca que ja ocupam uma posicao fixa na paleta do sistema. */
const POSICAO_NA_PALETA: Record<string, number> = {
  '#49619c': 1,
  '#f26b35': 2,
  '#6e2a92': 3,
};

/**
 * Paleta que abre com a cor escolhida pela aplicacao e segue com as do Design
 * System, saltando a posicao que repetiria essa cor.
 *
 * Gerar as demais a partir da cor escolhida foi medido e descartado: girar a
 * matiz em passos iguais nao separa as series de forma perceptivel, e a paleta
 * resultante reprova na verificacao de deficiencia de visao de cores.
 */
export function paletteWithAccent(accent: string, quantidade: number) {
  if (quantidade <= 0) {
    return [];
  }

  const ocupada = POSICAO_NA_PALETA[accent.trim().toLowerCase()];
  const restantes = seriesColors(SERIES_TOKENS).filter(
    (_, indice) => ocupada === undefined || indice + 1 !== ocupada,
  );

  return [accent, ...Array.from({ length: quantidade - 1 }, (_, i) => restantes[i % restantes.length])];
}

/** Cores das series sem cor propria: uma lista em rotacao, ou uma cor base que gera os tons. */
export type ChartPalette = readonly string[] | { base: string };

const TOM_MAIS_ESCURO = 0.36;
const TOM_MAIS_CLARO = 0.86;

/**
 * Tons da cor base, do mais escuro ao mais claro, na mesma matiz. Saem em
 * hexadecimal para que o texto sobre cada um continue medido.
 */
function tonesOf(base: string, quantidade: number) {
  if (quantidade === 1) {
    return [base];
  }

  const { C, h } = toOklch(base);

  return Array.from({ length: quantidade }, (_, indice) =>
    oklchToHex({
      C,
      L: TOM_MAIS_ESCURO + ((TOM_MAIS_CLARO - TOM_MAIS_ESCURO) * indice) / (quantidade - 1),
      h,
    }),
  );
}

/** Uma cor por serie a partir da paleta do grafico. A cor base fora do hexadecimal pinta todas com ela. */
export function paletteOf(palette: ChartPalette, quantidade: number) {
  if (quantidade <= 0) {
    return [];
  }

  if ('base' in palette) {
    return isHexColor(palette.base) ? tonesOf(palette.base, quantidade) : Array.from({ length: quantidade }, () => palette.base);
  }

  return palette.length === 0
    ? seriesColors(quantidade)
    : Array.from({ length: quantidade }, (_, indice) => palette[indice % palette.length]);
}
