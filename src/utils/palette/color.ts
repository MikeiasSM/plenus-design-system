/** Cor em OKLCH: luminosidade de 0 a 1, croma e matiz em radianos. */
export interface Oklch {
  C: number;
  L: number;
  h: number;
}

const HEXADECIMAL = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string) {
  return HEXADECIMAL.test(value.trim());
}

export function normalizeHex(value: string) {
  const hex = value.trim().toUpperCase();

  return hex.length === 4 ? `#${[...hex.slice(1)].map((digit) => digit + digit).join('')}` : hex;
}

const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const toGamma = (channel: number) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055);

function linearChannels(hex: string) {
  const digits = normalizeHex(hex).slice(1);

  return [0, 2, 4].map((start) => toLinear(parseInt(digits.slice(start, start + 2), 16) / 255));
}

export function luminance(hex: string) {
  const [r, g, b] = linearChannels(hex);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razao de contraste da WCAG entre duas cores hexadecimais. */
export function contrast(a: string, b: string) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);

  return (lighter + 0.05) / (darker + 0.05);
}

export function toOklch(hex: string): Oklch {
  const [r, g, b] = linearChannels(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  return {
    C: Math.hypot(a, bAxis),
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    h: Math.atan2(bAxis, a),
  };
}

function oklchToRgb({ C, L, h }: Oklch) {
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(toGamma);
}

const inGamut = (channels: number[]) => channels.every((channel) => channel >= -0.001 && channel <= 1.001);

/** Converte para hexadecimal, reduzindo o croma ate a cor caber no sRGB. */
export function oklchToHex(color: Oklch) {
  let chroma = color.C;
  let channels = oklchToRgb(color);

  while (!inGamut(channels) && chroma > 0.0005) {
    chroma *= 0.92;
    channels = oklchToRgb({ ...color, C: chroma });
  }

  return `#${channels
    .map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

/** Abaixo deste croma a cor e lida como neutra, e a matiz calculada e ruido. */
export const NEUTRAL_CHROMA = 0.01;
