import { contrast, isHexColor, normalizeHex } from './color';
import { createPalette, type CreatePaletteOptions } from './createPalette';

// Superficie clara de `src/tokens/semantic/color.css`: o laudo vale para o tema claro.
const LIGHT_SURFACE = '#FFFFFF';
const TEXT_MINIMUM = 4.5;
const CONTROL_MINIMUM = 3;

/** Papeis medidos, na ordem do laudo. */
export type PaletteRole = 'text-on-fill' | 'hover' | 'active' | 'strong' | 'outline' | 'container';

export interface PaletteMeasure {
  role: PaletteRole;
  /** Cor da frente da medida, ja como a paleta a usa. */
  foreground: string;
  /** Cor do fundo da medida. */
  background: string;
  /** Razao de contraste da WCAG, arredondada a duas casas so para mostrar. */
  ratio: number;
  /** 4,5 para texto; 3 para o contorno de controle. */
  minimum: number;
  /** Se a razao, sem arredondar, chega ao minimo: 4,4952 reprova, embora se mostre 4,5. */
  passes: boolean;
  /** A paleta usa, neste papel, outra cor que nao a informada ou o passo padrao da rampa. */
  adjusted: boolean;
}

const lightOf = (value: string | undefined) => value?.match(/#[0-9A-F]{6}/i)?.[0]?.toUpperCase();

function measure(role: PaletteRole, foreground: string, background: string, minimum: number, adjusted: boolean): PaletteMeasure {
  const ratio = contrast(foreground, background);

  return { adjusted, background, foreground, minimum, passes: ratio >= minimum, ratio: Math.round(ratio * 100) / 100, role };
}

/**
 * Laudo da paleta de `createPalette(cor, opcoes)`, no tema claro: uma medida por papel (texto sobre o preenchimento,
 * hover, pressionado, traco, contorno e conteiner), com as cores, a razao, o minimo e se a paleta ajustou a cor. Serve
 * ao produto para mostrar a quem escolheu a cor o que ficou como estava e o que mudou. E separada de `createPalette`
 * para o retorno dela continuar espalhavel num elemento. Recusa as mesmas cores que `createPalette`.
 */
export function measurePalette(color: string, options: CreatePaletteOptions = {}): PaletteMeasure[] {
  if (!isHexColor(color)) {
    throw new TypeError(`measurePalette: "${color}" nao e uma cor hexadecimal.`);
  }

  const solid = normalizeHex(color);
  const style = createPalette(solid, options).style as Record<string, string>;
  const text = style['--pl-palette-on-solid'];
  const strong = style['--pl-palette-strong-light'];
  const hover = lightOf(style['--pl-palette-fill-hover']);
  const active = lightOf(style['--pl-palette-fill-active']);
  const outline = lightOf(style['--pl-color-primary-outline']);

  return [
    measure('text-on-fill', text, solid, TEXT_MINIMUM, options.onSolid !== undefined),
    measure('hover', text, hover ?? style['--pl-palette-60'], TEXT_MINIMUM, hover !== undefined),
    measure('active', text, active ?? style['--pl-palette-70'], TEXT_MINIMUM, active !== undefined),
    measure('strong', strong, LIGHT_SURFACE, TEXT_MINIMUM, strong !== solid),
    outline ? measure('outline', outline, LIGHT_SURFACE, CONTROL_MINIMUM, true) : measure('outline', solid, LIGHT_SURFACE, CONTROL_MINIMUM, false),
    measure('container', style['--pl-palette-80'], style['--pl-palette-10'], TEXT_MINIMUM, false),
  ];
}
