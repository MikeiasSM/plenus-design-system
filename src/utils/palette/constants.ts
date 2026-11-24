// Superficies de `src/tokens/semantic/color.css` e o texto do tema: o CSS nao mede contraste, entao a medida e feita
// em `createPalette` e repetida no laudo de `measurePalette`, com os mesmos valores.
export const LIGHT_SURFACE = '#FFFFFF';
export const DARK_SURFACE = '#1B1D20';
export const GRAPHITE = '#373435';
export const WHITE = '#FFFFFF';
export const BLACK = '#000000';

export const TEXT_MINIMUM = 4.5;
/** Fronteira de componente (WCAG 1.4.11): abaixo dela o preenchimento precisa de contorno. */
export const CONTROL_MINIMUM = 3;
/** Piso visual do preenchimento: abaixo dele a cor some na superficie clara, como o creme. */
export const FILL_MINIMUM = 1.5;
