import type { CSSProperties } from 'react';
import { isDevelopment } from '../isDevelopment';
import { NEUTRAL_CHROMA, contrast, isHexColor, normalizeHex, oklchToHex, toOklch } from './color';

export interface CreatePaletteOptions {
  /** Texto sobre a cor, imposto pelo produto. Sem ele, o branco ou o grafite, o que medir mais. */
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

/** Primeiro passo, a partir de `start` e na direcao dada, que se le contra a superficie. */
function strongFrom(ramp: readonly string[], start: number, direction: 1 | -1, surface: string) {
  for (let index = start; index >= 0 && index < ramp.length; index += direction) {
    if (contrast(ramp[index], surface) >= TEXT_MINIMUM) {
      return ramp[index];
    }
  }

  return ramp[direction === 1 ? ramp.length - 1 : 0];
}

function nearestAccepted(color: string) {
  const oklch = toOklch(color);

  for (let L = oklch.L; L > 0; L -= 0.01) {
    const candidate = oklchToHex({ ...oklch, L });
    if (contrast(candidate, LIGHT_SURFACE) >= FILL_MINIMUM) {
      return candidate;
    }
  }

  return color;
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
        `Tom mais proximo aceito: ${nearestAccepted(solid)}.`,
    );
  }

  const ramp = rampOf(solid);
  const textOnSolid = onSolid === undefined ? legibleOn(solid, [WHITE, GRAPHITE]) : normalizeHex(onSolid);

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
    } as CSSProperties,
  };
}
