import type { CSSProperties } from 'react';
import { isDevelopment } from '../isDevelopment';
import { NEUTRAL_CHROMA, contrast, isHexColor, luminance, normalizeHex, oklchToHex, toOklch } from './color';
import { BLACK, CONTROL_MINIMUM, DARK_SURFACE, FILL_MINIMUM, GRAPHITE, LIGHT_SURFACE, TEXT_MINIMUM, WHITE } from './constants';

export interface CreatePaletteOptions {
  /**
   * Aceita a cor exata que mede menos de 1,5:1 contra a superfície clara, como o amarelo claro de uma marca, por
   * decisao do produto. Sem ela, a cor e recusada. Com ela, a funcao avisa uma vez em desenvolvimento, com a razao e
   * o tom aceito mais proximo; o hover e o pressionado escurecem, como em toda cor em que clarear sumiria com o botao; e o contorno
   * de `Switch` e `Checkbox` vem do traco da paleta, como em toda cor abaixo de 3:1.
   */
  acceptFaintFill?: boolean;
  /**
   * Texto sobre a cor, imposto pelo produto. Sem ele, o branco ou o grafite, o que medir mais; se nenhum dos dois
   * chega a 4,5:1, o que medir mais entre branco, grafite e preto.
   */
  onSolid?: string;
}

export interface PaletteScope {
  'data-palette': 'custom';
  style: CSSProperties;
}

/** Quanto o preenchimento de hover e o pressionado se afastam do texto, em luminosidade OKLCH. */
const FILL_HOVER_SHIFT = 0.05;
const FILL_ACTIVE_SHIFT = 0.09;

const STEP_LIGHTNESS = [0.975, 0.94, 0.875, 0.78, 0.62, 0.54, 0.46, 0.38, 0.3, 0.22];
const STEP_CHROMA = [0.12, 0.28, 0.5, 0.8, 1, 0.95, 0.88, 0.78, 0.66, 0.55];

/** Rampa de luminosidade fixa na matiz da cor: o passo 50 e sempre um tom medio. */
function rampOf(color: string) {
  const { C, h } = toOklch(color);
  const chroma = C < NEUTRAL_CHROMA ? 0 : C;

  return STEP_LIGHTNESS.map((L, index) => oklchToHex({ C: chroma * STEP_CHROMA[index], L, h }));
}

const legibleOn = (background: string, candidates: readonly string[]) =>
  candidates.reduce((best, candidate) => (contrast(candidate, background) > contrast(best, background) ? candidate : best));

/** Branco ou grafite, o que medir mais; abaixo de 4,5:1, o que medir mais entre branco, grafite e preto. */
function textOn(solid: string) {
  const preferred = legibleOn(solid, [WHITE, GRAPHITE]);

  return contrast(preferred, solid) >= TEXT_MINIMUM ? preferred : legibleOn(solid, [WHITE, GRAPHITE, BLACK]);
}

/**
 * Preenchimento do hover e do pressionado sob o texto. Os passos 60 e 70 servem quando o texto se le sobre eles;
 * senao, o proprio preenchimento se afasta do texto em luminosidade, mais claro sob o texto escuro e mais escuro
 * sob o claro. O tema escuro segue nos passos 30 e 20, como `--pl-color-primary-hover` e `-active`.
 */
function fillStates(solid: string, ramp: readonly string[], text: string): Record<string, string> {
  if (contrast(text, ramp[5]) >= TEXT_MINIMUM && contrast(text, ramp[6]) >= TEXT_MINIMUM) {
    return {};
  }

  const { active, hover } = shiftedFills(solid, text);

  return {
    '--pl-palette-fill-hover': `light-dark(${hover}, var(--pl-palette-30))`,
    '--pl-palette-fill-active': `light-dark(${active}, var(--pl-palette-20))`,
  };
}

/**
 * O preenchimento afastado do texto em luminosidade: mais claro sob o texto escuro e mais escuro sob o claro. Quando
 * clarear levaria o pressionado abaixo de 1,5:1 contra a superficie, o botao sumiria no clique; entao os dois
 * escurecem, e so ate onde o texto escuro ainda mede 4,5:1.
 */
function shiftedFills(solid: string, text: string) {
  const oklch = toOklch(solid);
  const towards = (direction: 1 | -1, shift: number) =>
    oklchToHex({ ...oklch, L: Math.min(1, Math.max(0, oklch.L + direction * shift)) });
  const darkText = luminance(text) < luminance(solid);
  const lightens = darkText && contrast(towards(1, FILL_ACTIVE_SHIFT), LIGHT_SURFACE) >= FILL_MINIMUM;

  const shifted = (shift: number) => {
    if (lightens || !darkText) {
      return towards(lightens ? 1 : -1, shift);
    }

    let legible = shift;
    while (legible > 0 && contrast(text, towards(-1, legible)) < TEXT_MINIMUM) {
      legible = Math.max(0, legible - 0.005);
    }

    return towards(-1, legible);
  };

  return { active: shifted(FILL_ACTIVE_SHIFT), hover: shifted(FILL_HOVER_SHIFT) };
}

/**
 * Contorno do preenchimento. Quando a cor fica abaixo de 3:1 contra a superfície clara, o `Switch` ligado e o
 * `Checkbox` marcado somem na superficie (WCAG 1.4.11). Entao a paleta declara `--pl-color-primary-outline` no traco,
 * que os dois usam como borda. No tema escuro a borda e o proprio preenchimento. Sem a declaracao, a borda e o
 * preenchimento, e cada escopo de `data-palette` a zera, para a paleta aninhada nao herdar a de fora.
 *
 * O criterio olha so o preenchimento em repouso. O fundo do hover e do pressionado (`--pl-palette-fill-*`) fica so
 * sob o texto do `Button` primario, e botao com texto nao exige fronteira de 3:1; nenhum controle sem texto pinta o
 * hover ou o pressionado. Se um passar a pintar, os dois entram aqui.
 */
function outlineOf(solid: string, strong: string): Record<string, string> {
  return contrast(solid, LIGHT_SURFACE) < CONTROL_MINIMUM
    ? { '--pl-color-primary-outline': `light-dark(${strong}, var(--pl-color-primary))` }
    : {};
}

/** Primeiro passo, a partir de `start` e na direcao dada, que se le contra a superficie. */
function strongFrom(ramp: readonly string[], start: number, direction: 1 | -1, surface: string) {
  for (let index = start; index >= 0 && index < ramp.length; index += direction) {
    if (contrast(ramp[index], surface) >= TEXT_MINIMUM) {
      return ramp[index];
    }
  }

  return ramp[direction === 1 ? ramp.length - 1 : 0];
}

/**
 * A cor que `createPalette` aceita mais proxima da pedida, na mesma matiz e croma, ou a propria cor quando
 * ja e aceita. Serve a cor que vem de fora do codigo, como a escolhida pelo usuario.
 */
export function nearestPaletteColor(color: string) {
  if (!isHexColor(color)) {
    throw new TypeError(`nearestPaletteColor: "${color}" não é uma cor hexadecimal.`);
  }

  const solid = normalizeHex(color);
  if (contrast(solid, LIGHT_SURFACE) >= FILL_MINIMUM) {
    return solid;
  }

  const oklch = toOklch(solid);
  for (let L = oklch.L; L > 0; L -= 0.01) {
    const candidate = oklchToHex({ ...oklch, L });
    if (contrast(candidate, LIGHT_SURFACE) >= FILL_MINIMUM) {
      return candidate;
    }
  }

  return solid;
}

/** As cores fracas ja avisadas: `createPalette` roda a cada render, e o aviso sai uma vez por cor. */
const faintFillsWarned = new Set<string>();

/** Quem chama, para a mensagem de erro, e se o texto imposto que reprova avisa no console. */
export interface PaletteTokensContext {
  caller: string;
  warn: boolean;
}

/**
 * As variaveis da paleta, ja medidas, sem o atributo. Uso interno: `createPalette` as espalha num elemento, e
 * `measurePalette` as mede, com o proprio nome nos erros e sem o aviso do console.
 */
export function paletteTokens(
  color: string,
  { acceptFaintFill = false, onSolid }: CreatePaletteOptions = {},
  { caller, warn }: PaletteTokensContext = { caller: 'createPalette', warn: true },
): Record<string, string> {
  if (!isHexColor(color)) {
    throw new TypeError(`${caller}: "${color}" não é uma cor hexadecimal.`);
  }

  if (onSolid !== undefined && !isHexColor(onSolid)) {
    throw new TypeError(`${caller}: onSolid "${onSolid}" não é uma cor hexadecimal.`);
  }

  const solid = normalizeHex(color);
  const fill = contrast(solid, LIGHT_SURFACE);

  if (fill < FILL_MINIMUM && !acceptFaintFill) {
    throw new RangeError(
      `${caller}: ${solid} mede ${fill.toFixed(2)}:1 contra a superfície clara, abaixo de ${FILL_MINIMUM}:1. ` +
        `Tom aceito mais próximo: ${nearestPaletteColor(solid)}.`,
    );
  }

  if (fill < FILL_MINIMUM && warn && isDevelopment() && !faintFillsWarned.has(solid)) {
    faintFillsWarned.add(solid);
    console.warn(
      `${caller}: ${solid} mede ${fill.toFixed(2)}:1 contra a superfície clara, abaixo de ${FILL_MINIMUM}:1, ` +
        `por decisão do produto. Tom aceito mais próximo: ${nearestPaletteColor(solid)}.`,
    );
  }

  const ramp = rampOf(solid);
  const textOnSolid = onSolid === undefined ? textOn(solid) : normalizeHex(onSolid);

  if (warn && onSolid !== undefined && isDevelopment() && contrast(textOnSolid, solid) < TEXT_MINIMUM) {
    console.warn(
      `${caller}: texto ${textOnSolid} sobre ${solid} mede ${contrast(textOnSolid, solid).toFixed(2)}:1, ` +
        `abaixo de ${TEXT_MINIMUM}:1, por decisão do produto.`,
    );
  }

  const steps = Object.fromEntries(ramp.map((tone, index) => [`--pl-palette-${(index + 1) * 10}`, tone]));
  const strongLight = fill >= TEXT_MINIMUM ? solid : strongFrom(ramp, 4, 1, LIGHT_SURFACE);

  return {
    ...steps,
    '--pl-palette-solid': solid,
    '--pl-palette-on-solid': textOnSolid,
    '--pl-palette-on-40': legibleOn(ramp[3], [WHITE, BLACK]),
    '--pl-palette-strong-light': strongLight,
    '--pl-palette-strong-dark': strongFrom(ramp, 3, -1, DARK_SURFACE),
    ...fillStates(solid, ramp, textOnSolid),
    ...outlineOf(solid, strongLight),
  };
}

/**
 * Paleta propria de um produto, gerada e medida a partir de uma cor. Devolve o
 * atributo e as variaveis de `data-palette`, para espalhar num elemento:
 * `<div {...createPalette('#67BD50')}>`.
 */
export function createPalette(color: string, options: CreatePaletteOptions = {}): PaletteScope {
  return { 'data-palette': 'custom', style: paletteTokens(color, options) as CSSProperties };
}
