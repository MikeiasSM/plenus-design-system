import type { CSSProperties } from 'react';
import { isDevelopment } from '../isDevelopment';
import { NEUTRAL_CHROMA, contrast, isHexColor, luminance, normalizeHex, oklchToHex, toOklch } from './color';

export interface CreatePaletteOptions {
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

// Superficies de `src/tokens/semantic/color.css` e o texto do tema: o CSS nao mede contraste, entao a medida e feita aqui.
const LIGHT_SURFACE = '#FFFFFF';
const DARK_SURFACE = '#1B1D20';
const GRAPHITE = '#373435';
const WHITE = '#FFFFFF';
const BLACK = '#000000';

const TEXT_MINIMUM = 4.5;
/** Piso visual do preenchimento: abaixo dele a cor some na superficie clara, como o creme. */
const FILL_MINIMUM = 1.5;

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

  const oklch = toOklch(solid);
  const direction = luminance(text) < luminance(solid) ? 1 : -1;
  const shifted = (shift: number) => oklchToHex({ ...oklch, L: Math.min(1, Math.max(0, oklch.L + direction * shift)) });

  return {
    '--pl-palette-fill-hover': `light-dark(${shifted(FILL_HOVER_SHIFT)}, var(--pl-palette-30))`,
    '--pl-palette-fill-active': `light-dark(${shifted(FILL_ACTIVE_SHIFT)}, var(--pl-palette-20))`,
  };
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
    throw new TypeError(`nearestPaletteColor: "${color}" nao e uma cor hexadecimal.`);
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

/**
 * Paleta propria de um produto, gerada e medida a partir de uma cor. Devolve o
 * atributo e as variaveis de `data-palette`, para espalhar num elemento:
 * `<div {...createPalette('#67BD50')}>`.
 */
export function createPalette(color: string, { onSolid }: CreatePaletteOptions = {}): PaletteScope {
  if (!isHexColor(color)) {
    throw new TypeError(`createPalette: "${color}" nao e uma cor hexadecimal.`);
  }

  if (onSolid !== undefined && !isHexColor(onSolid)) {
    throw new TypeError(`createPalette: onSolid "${onSolid}" nao e uma cor hexadecimal.`);
  }

  const solid = normalizeHex(color);
  const fill = contrast(solid, LIGHT_SURFACE);

  if (fill < FILL_MINIMUM) {
    throw new RangeError(
      `createPalette: ${solid} mede ${fill.toFixed(2)}:1 contra a superficie clara, abaixo de ${FILL_MINIMUM}:1. ` +
        `Tom mais proximo aceito: ${nearestPaletteColor(solid)}.`,
    );
  }

  const ramp = rampOf(solid);
  const textOnSolid = onSolid === undefined ? textOn(solid) : normalizeHex(onSolid);

  if (onSolid !== undefined && isDevelopment() && contrast(textOnSolid, solid) < TEXT_MINIMUM) {
    console.warn(
      `createPalette: texto ${textOnSolid} sobre ${solid} mede ${contrast(textOnSolid, solid).toFixed(2)}:1, ` +
        `abaixo de ${TEXT_MINIMUM}:1, por decisao do produto.`,
    );
  }

  const steps = Object.fromEntries(ramp.map((tone, index) => [`--pl-palette-${(index + 1) * 10}`, tone]));

  return {
    'data-palette': 'custom',
    style: {
      ...steps,
      '--pl-palette-solid': solid,
      '--pl-palette-on-solid': textOnSolid,
      '--pl-palette-on-40': legibleOn(ramp[3], [WHITE, BLACK]),
      '--pl-palette-strong-light': fill >= TEXT_MINIMUM ? solid : strongFrom(ramp, 4, 1, LIGHT_SURFACE),
      '--pl-palette-strong-dark': strongFrom(ramp, 3, -1, DARK_SURFACE),
      ...fillStates(solid, ramp, textOnSolid),
    } as CSSProperties,
  };
}
