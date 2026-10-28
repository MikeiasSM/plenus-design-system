import { contrast, toOklch } from './color';
import { createPalette } from './createPalette';

const tokens = (color: string, options?: Parameters<typeof createPalette>[1]) =>
  createPalette(color, options).style as Record<string, string>;

const ramp = (color: string) => Array.from({ length: 10 }, (_, index) => tokens(color)[`--pl-palette-${(index + 1) * 10}`]);

const PAINEL = ['#F26B35', '#4B4B4D', '#000000', '#49619C', '#67BD50', '#6E2A92', '#ED3237', '#FCB52F'];

describe('createPalette', () => {
  it('marks the scope and keeps the declared color as the fill', () => {
    const palette = createPalette('#67bd50');

    expect(palette['data-palette']).toBe('custom');
    expect((palette.style as Record<string, string>)['--pl-palette-solid']).toBe('#67BD50');
  });

  it('builds a ramp that only gets darker, whatever the starting color', () => {
    for (const color of [...PAINEL, '#1C1F2A']) {
      const lightness = ramp(color).map((tone) => toOklch(tone).L);

      lightness.slice(1).forEach((value, index) => expect(value).toBeLessThan(lightness[index]));
    }
  });

  it('keeps colors without chroma neutral instead of tinting them', () => {
    for (const color of ['#000000', '#4B4B4D', '#808080']) {
      ramp(color).forEach((tone) => expect(toOklch(tone).C).toBeLessThan(0.005));
    }
  });

  it('measures every role of the Painel colors in both themes', () => {
    for (const color of PAINEL) {
      const palette = tokens(color);

      expect(contrast(palette['--pl-palette-on-solid'], palette['--pl-palette-solid'])).toBeGreaterThanOrEqual(3);
      expect(contrast(palette['--pl-palette-on-40'], palette['--pl-palette-40'])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette['--pl-palette-strong-light'], '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette['--pl-palette-strong-dark'], '#1B1D20')).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('writes graphite over light fills such as yellow and green', () => {
    expect(tokens('#FCB52F')['--pl-palette-on-solid']).toBe('#373435');
    expect(tokens('#67BD50')['--pl-palette-on-solid']).toBe('#373435');
    expect(tokens('#49619C')['--pl-palette-on-solid']).toBe('#FFFFFF');
  });

  it('accepts the text imposed by the product and warns in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(tokens('#FCB52F', { onSolid: '#fff' })['--pl-palette-on-solid']).toBe('#FFFFFF');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('por decisao do produto'));

    warn.mockRestore();
  });

  it('refuses a fill that disappears on the light surface and suggests the nearest tone', () => {
    expect(() => createPalette('#F3E9D2')).toThrow(RangeError);
    expect(() => createPalette('#F3E9D2')).toThrow(/Tom mais proximo aceito: #[0-9A-F]{6}/);
  });

  it('rejects values that are not hexadecimal colors', () => {
    expect(() => createPalette('verde')).toThrow(TypeError);
    expect(() => createPalette('#67BD50', { onSolid: 'white' })).toThrow(TypeError);
  });
});
