import { contrast, mixOklab } from './color';
import { CONTROL_MINIMUM, DARK_SURFACE, LIGHT_SURFACE, TEXT_MINIMUM } from './constants';
import { type CreatePaletteOptions, paletteTokens } from './createPalette';

/** Papeis medidos, na ordem do laudo. */
export type PaletteRole = 'text-on-fill' | 'hover' | 'active' | 'strong' | 'outline' | 'container';

/** Tema da medida: a paleta tem outras cores no escuro. */
export type PaletteTheme = 'light' | 'dark';

export interface PaletteMeasure {
  role: PaletteRole;
  theme: PaletteTheme;
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
  /**
   * A biblioteca escolheu, neste papel, outra cor que nao a informada ou o passo padrao da rampa: o traco mais escuro
   * que a cor, o hover e o pressionado afastados do texto, o contorno. A cor que o produto impos nao conta aqui.
   */
  adjusted: boolean;
  /** A cor deste papel veio do produto, como o texto de `onSolid`, e nao da escolha da biblioteca. */
  imposed: boolean;
}

const lightOf = (value: string | undefined) => value?.match(/#[0-9A-F]{6}/i)?.[0]?.toUpperCase();

interface MeasureFlags {
  adjusted?: boolean;
  imposed?: boolean;
}

function measure(
  role: PaletteRole,
  theme: PaletteTheme,
  foreground: string,
  background: string,
  minimum: number,
  { adjusted = false, imposed = false }: MeasureFlags = {},
): PaletteMeasure {
  const ratio = contrast(foreground, background);

  return {
    adjusted,
    background,
    foreground,
    imposed,
    minimum,
    passes: ratio >= minimum,
    ratio: Math.round(ratio * 100) / 100,
    role,
    theme,
  };
}

/**
 * Laudo da paleta de `createPalette(cor, opcoes)`, nos dois temas: uma medida por papel (texto sobre o preenchimento,
 * hover, pressionado, traco, contorno e conteiner), primeiro no claro e depois no escuro, com as cores, a razao, o
 * minimo, se a biblioteca ajustou a cor e se o produto a impos. Serve ao produto para mostrar a quem escolheu a cor o
 * que ficou como estava e o que mudou. E separada de `createPalette` para o retorno dela continuar espalhavel num
 * elemento. Recusa as mesmas cores que `createPalette`, com o proprio nome na mensagem, e nao avisa no console: o
 * texto imposto que reprova aparece no proprio laudo.
 *
 * O escuro segue `src/tokens/semantic/color.css`: o preenchimento e o passo 40 sob `--pl-palette-on-40`, o hover e o
 * pressionado sao os passos 30 e 20, o traco e `--pl-palette-strong-dark`, o contorno e o proprio passo 40, e o
 * conteiner e o passo 40 a 16% sobre a superficie escura, com o passo 30 como texto.
 */
export function measurePalette(color: string, options: CreatePaletteOptions = {}): PaletteMeasure[] {
  const style = paletteTokens(color, options, { caller: 'measurePalette', warn: false });
  const step = (value: number) => style[`--pl-palette-${value}`];
  const solid = style['--pl-palette-solid'];
  const text = style['--pl-palette-on-solid'];
  const strong = style['--pl-palette-strong-light'];
  const hover = lightOf(style['--pl-palette-fill-hover']);
  const active = lightOf(style['--pl-palette-fill-active']);
  const outline = lightOf(style['--pl-color-primary-outline']);
  const darkText = style['--pl-palette-on-40'];
  const darkStrong = style['--pl-palette-strong-dark'];

  return [
    measure('text-on-fill', 'light', text, solid, TEXT_MINIMUM, { imposed: options.onSolid !== undefined }),
    measure('hover', 'light', text, hover ?? step(60), TEXT_MINIMUM, { adjusted: hover !== undefined }),
    measure('active', 'light', text, active ?? step(70), TEXT_MINIMUM, { adjusted: active !== undefined }),
    measure('strong', 'light', strong, LIGHT_SURFACE, TEXT_MINIMUM, { adjusted: strong !== solid }),
    measure('outline', 'light', outline ?? solid, LIGHT_SURFACE, CONTROL_MINIMUM, { adjusted: outline !== undefined }),
    measure('container', 'light', step(80), step(10), TEXT_MINIMUM),
    measure('text-on-fill', 'dark', darkText, step(40), TEXT_MINIMUM),
    measure('hover', 'dark', darkText, step(30), TEXT_MINIMUM),
    measure('active', 'dark', darkText, step(20), TEXT_MINIMUM),
    measure('strong', 'dark', darkStrong, DARK_SURFACE, TEXT_MINIMUM, { adjusted: darkStrong !== step(40) }),
    measure('outline', 'dark', step(40), DARK_SURFACE, CONTROL_MINIMUM),
    measure('container', 'dark', step(30), mixOklab(step(40), DARK_SURFACE, 0.16), TEXT_MINIMUM),
  ];
}
