import { contrast, mixOklab } from './color';
import { createPalette } from './createPalette';
import { measurePalette } from './measurePalette';

const role = (color: string, name: string, theme = 'light') =>
  measurePalette(color).find((item) => item.role === name && item.theme === theme)!;

describe('measurePalette', () => {
  it('measures the six roles, in order, first in the light theme and then in the dark one', () => {
    const roles = ['text-on-fill', 'hover', 'active', 'strong', 'outline', 'container'];

    expect(measurePalette('#49619C').map((item) => `${item.theme} ${item.role}`)).toEqual([
      ...roles.map((name) => `light ${name}`),
      ...roles.map((name) => `dark ${name}`),
    ]);
  });

  it('measures the dark theme with the colors of the dark side of the palette', () => {
    const style = createPalette('#49619C').style as Record<string, string>;

    expect(role('#49619C', 'text-on-fill', 'dark')).toMatchObject({
      foreground: style['--pl-palette-on-40'],
      background: style['--pl-palette-40'],
      minimum: 4.5,
    });
    expect(role('#49619C', 'strong', 'dark')).toMatchObject({ foreground: style['--pl-palette-strong-dark'], background: '#1B1D20' });
    expect(role('#49619C', 'outline', 'dark')).toMatchObject({ foreground: style['--pl-palette-40'], background: '#1B1D20', minimum: 3 });
    expect(role('#49619C', 'container', 'dark')).toMatchObject({
      foreground: style['--pl-palette-30'],
      background: mixOklab(style['--pl-palette-40'], '#1B1D20', 0.16),
    });
    expect(role('#49619C', 'strong', 'dark').passes).toBe(contrast(style['--pl-palette-strong-dark'], '#1B1D20') >= 4.5);
  });

  it('mixes in OKLab like color-mix, from one color to the other', () => {
    expect(mixOklab('#49619C', '#1B1D20', 1)).toBe('#49619C');
    expect(mixOklab('#49619C', '#1B1D20', 0)).toBe('#1B1D20');
  });

  it('reports what the palette kept and what it adjusted for a light fill', () => {
    expect(role('#EED037', 'text-on-fill')).toMatchObject({ foreground: '#373435', minimum: 4.5, passes: true, adjusted: false, imposed: false });
    expect(role('#EED037', 'strong')).toMatchObject({ foreground: '#816E03', passes: true, adjusted: true });
    expect(role('#EED037', 'outline')).toMatchObject({ foreground: '#816E03', minimum: 3, passes: true, adjusted: true });
  });

  it('reports a dark fill as kept everywhere', () => {
    const laudo = measurePalette('#111111');

    expect(laudo.every((item) => item.passes)).toBe(true);
    expect(role('#111111', 'outline')).toMatchObject({ foreground: '#111111', adjusted: false });
  });

  it('marks the text imposed by the product as imposed, not adjusted, and does not hide a failing ratio', () => {
    const texto = measurePalette('#FF3B00', { onSolid: '#FFFFFF' }).find((item) => item.role === 'text-on-fill' && item.theme === 'light')!;

    expect(texto).toMatchObject({ adjusted: false, imposed: true, passes: false, ratio: 3.57 });
  });

  it('marks nothing as imposed when the library chose every color', () => {
    expect(measurePalette('#FF3B00').every((item) => !item.imposed)).toBe(true);
  });

  it('decides passes on the raw ratio, not on the rounded one it shows', () => {
    const texto = measurePalette('#727272', { onSolid: '#FFFF3D' }).find((item) => item.role === 'text-on-fill' && item.theme === 'light')!;

    expect(texto).toMatchObject({ minimum: 4.5, passes: false, ratio: 4.5 });
  });

  it('refuses the same colors as createPalette, with its own name in the message', () => {
    expect(() => measurePalette('#FFE14D')).toThrow(RangeError);
    expect(() => measurePalette('#FFE14D')).toThrow(/^measurePalette: /);
    expect(() => measurePalette('amarelo')).toThrow(/^measurePalette: /);
    expect(() => measurePalette('#67BD50', { onSolid: 'white' })).toThrow(/^measurePalette: onSolid/);
  });

  it('does not repeat the console warning of createPalette for an imposed text that fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    measurePalette('#FF3B00', { onSolid: '#FFFFFF' });
    measurePalette('#F5E46A', { acceptFaintFill: true });
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  describe('with the faint fill accepted by the product', () => {
    it('opens the report with the fill against the light surface, failing and imposed', () => {
      const laudo = measurePalette('#FFE14D', { acceptFaintFill: true });

      expect(laudo[0]).toEqual({
        adjusted: false,
        background: '#FFFFFF',
        foreground: '#FFE14D',
        imposed: true,
        minimum: 1.5,
        passes: false,
        ratio: 1.3,
        role: 'fill',
        theme: 'light',
      });
      expect(laudo.slice(1).map((item) => `${item.theme} ${item.role}`)).toEqual(measurePalette('#EED037').map((item) => `${item.theme} ${item.role}`));
    });

    it('measures the darkened hover and pressed fills under the text', () => {
      const laudo = measurePalette('#FFE14D', { acceptFaintFill: true });

      expect(laudo.find((item) => item.role === 'active' && item.theme === 'light')).toMatchObject({ background: '#E1C320', passes: true, adjusted: true });
    });

    it('reports a color that already passes as passing, and adds the fill only when the option is given', () => {
      expect(measurePalette('#EED037', { acceptFaintFill: true })[0]).toMatchObject({ role: 'fill', passes: true, imposed: false });
      expect(measurePalette('#EED037').some((item) => (item.role as string) === 'fill')).toBe(false);
    });
  });
});
