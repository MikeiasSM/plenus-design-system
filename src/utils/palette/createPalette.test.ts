import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrast, toOklch } from './color';
import { createPalette, nearestPaletteColor } from './createPalette';

const tokens = (color: string, options?: Parameters<typeof createPalette>[1]) =>
  createPalette(color, options).style as Record<string, string>;

const ramp = (color: string) => Array.from({ length: 10 }, (_, index) => tokens(color)[`--pl-palette-${(index + 1) * 10}`]);

const BRAND_COLORS = ['#F26B35', '#4B4B4D', '#000000', '#49619C', '#67BD50', '#6E2A92', '#ED3237', '#FCB52F'];

describe('createPalette', () => {
  it('marks the scope and keeps the declared color as the fill', () => {
    const palette = createPalette('#67bd50');

    expect(palette['data-palette']).toBe('custom');
    expect((palette.style as Record<string, string>)['--pl-palette-solid']).toBe('#67BD50');
  });

  it('builds a ramp that only gets darker, whatever the starting color', () => {
    for (const color of [...BRAND_COLORS, '#1C1F2A']) {
      const lightness = ramp(color).map((tone) => toOklch(tone).L);

      lightness.slice(1).forEach((value, index) => expect(value).toBeLessThan(lightness[index]));
    }
  });

  it('keeps colors without chroma neutral instead of tinting them', () => {
    for (const color of ['#000000', '#4B4B4D', '#808080']) {
      ramp(color).forEach((tone) => expect(toOklch(tone).C).toBeLessThan(0.005));
    }
  });

  it('measures every role of the brand colors in both themes', () => {
    for (const color of BRAND_COLORS) {
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

  describe('text and fill under it', () => {
    const COLORS = ['#F26B35', '#FF3B00', '#EED037', '#FCB52F', '#67BD50', '#49619C', '#111111', '#ED3237', '#7F7F7F', '#F9A8D4'];
    // O lado claro do `light-dark()`; sem o token da paleta, o fundo e o passo da rampa, como em `color.css`.
    const lightSide = (value: string | undefined, fallback: string) => value?.match(/^light-dark\((#[0-9A-F]{6}),/)?.[1] ?? fallback;

    it('reads the text at 4.5:1 over the fill, the hover fill and the pressed fill', () => {
      for (const color of COLORS) {
        const palette = tokens(color);
        const text = palette['--pl-palette-on-solid'];

        expect(contrast(text, palette['--pl-palette-solid'])).toBeGreaterThanOrEqual(4.5);
        expect(contrast(text, lightSide(palette['--pl-palette-fill-hover'], palette['--pl-palette-60']))).toBeGreaterThanOrEqual(4.5);
        expect(contrast(text, lightSide(palette['--pl-palette-fill-active'], palette['--pl-palette-70']))).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('keeps the primary text step at 4.5:1 against white', () => {
      for (const color of COLORS) {
        expect(contrast(tokens(color)['--pl-palette-70'], '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('falls back to black when neither white nor graphite reaches 4.5:1, and moves the fill away from it', () => {
      expect(tokens('#F26B35')).toMatchObject({
        '--pl-palette-on-solid': '#000000',
        '--pl-palette-fill-hover': 'light-dark(#FE8051, var(--pl-palette-30))',
        '--pl-palette-fill-active': 'light-dark(#FB9875, var(--pl-palette-20))',
      });
      expect(tokens('#FF3B00')).toMatchObject({
        '--pl-palette-on-solid': '#000000',
        '--pl-palette-fill-hover': 'light-dark(#FC6B4C, var(--pl-palette-30))',
        '--pl-palette-fill-active': 'light-dark(#FE8367, var(--pl-palette-20))',
      });
    });

    it('lightens the fill under graphite instead of darkening it into the text', () => {
      const palette = tokens('#EED037');

      expect(palette['--pl-palette-on-solid']).toBe('#373435');
      expect(toOklch(lightSide(palette['--pl-palette-fill-hover'], '')).L).toBeGreaterThan(toOklch('#EED037').L);
      expect(toOklch(lightSide(palette['--pl-palette-fill-active'], '')).L).toBeGreaterThan(
        toOklch(lightSide(palette['--pl-palette-fill-hover'], '')).L,
      );
    });

    it('declares no fill of its own when the text already reads over the steps 60 and 70', () => {
      for (const color of ['#49619C', '#111111']) {
        expect(tokens(color)).not.toHaveProperty('--pl-palette-fill-hover');
        expect(tokens(color)).not.toHaveProperty('--pl-palette-fill-active');
      }
    });

    it('keeps the white or the graphite that already passes', () => {
      expect(tokens('#49619C')['--pl-palette-on-solid']).toBe('#FFFFFF');
      expect(tokens('#FCB52F')['--pl-palette-on-solid']).toBe('#373435');
    });
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

  describe('faint fill accepted by the product', () => {
    it('keeps the exact color and warns once per color in development', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(tokens('#FFE14D', { acceptFaintFill: true })['--pl-palette-solid']).toBe('#FFE14D');
      tokens('#ffe14d', { acceptFaintFill: true });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringMatching(/#FFE14D mede 1\.30:1 .* por decisao do produto\. Tom mais proximo aceito: #EED037\./));

      warn.mockRestore();
    });

    it('darkens the hover and the pressed fill instead of lightening them into the surface', () => {
      const style = tokens('#FFE14D', { acceptFaintFill: true });
      const light = (name: string) => style[name].match(/#[0-9A-F]{6}/)![0];

      expect(light('--pl-palette-fill-hover')).toBe('#EED037');
      expect(light('--pl-palette-fill-active')).toBe('#E1C320');
      expect(contrast(light('--pl-palette-fill-active'), '#FFFFFF')).toBeGreaterThan(contrast(light('--pl-palette-fill-hover'), '#FFFFFF'));
      expect(contrast(style['--pl-palette-on-solid'], light('--pl-palette-fill-active'))).toBeGreaterThanOrEqual(4.5);
    });

    it('declares the outline of Switch and Checkbox from the stroke', () => {
      expect(tokens('#FFE14D', { acceptFaintFill: true })['--pl-color-primary-outline']).toBe('light-dark(#816E02, var(--pl-color-primary))');
    });

    it('changes nothing for a color that already passes', () => {
      expect(tokens('#EED037', { acceptFaintFill: true })).toEqual(tokens('#EED037'));
    });
  });
});

describe('nearestPaletteColor', () => {
  it('returns an accepted color as it is, normalized', () => {
    expect(nearestPaletteColor('#67bd50')).toBe('#67BD50');
  });

  it('darkens a refused color until createPalette accepts it, keeping the hue', () => {
    const nearest = nearestPaletteColor('#F3E9D2');

    expect(contrast(nearest, '#FFFFFF')).toBeGreaterThanOrEqual(1.5);
    expect(Math.abs(toOklch(nearest).h - toOklch('#F3E9D2').h)).toBeLessThan(2);
    expect(() => createPalette(nearest)).not.toThrow();
    expect(() => createPalette('#F3E9D2')).toThrow(nearest);
  });

  it('rejects values that are not hexadecimal colors', () => {
    expect(() => nearestPaletteColor('creme')).toThrow(TypeError);
  });
});

describe('fill tokens under the primary text', () => {
  const color = readFileSync(resolve(process.cwd(), 'src/tokens/semantic/color.css'), 'utf8');
  const button = readFileSync(resolve(process.cwd(), 'src/components/actions/Button/Button.module.css'), 'utf8');

  it('are declared in every theme and palette scope, falling back to the hover and pressed steps', () => {
    const block = color.slice(color.search(/\[data-palette\] \{/));

    expect(block).toContain('--pl-color-primary-fill-hover: var(--pl-palette-fill-hover, var(--pl-color-primary-hover));');
    expect(block).toContain('--pl-color-primary-fill-active: var(--pl-palette-fill-active, var(--pl-color-primary-active));');
  });

  it('paint the primary Button under its text, and the hover and pressed tokens stay for text and bare fills', () => {
    expect(button).not.toMatch(/background: var\(--pl-color-primary-(hover|active)\)/);
    expect(color).toContain('--pl-color-primary-hover: light-dark(var(--pl-palette-60), var(--pl-palette-30));');
    expect(color).toContain('--pl-color-primary-active: light-dark(var(--pl-palette-70), var(--pl-palette-20));');
  });
});

describe('outline of a faint fill', () => {
  const button = readFileSync(resolve(process.cwd(), 'src/components/actions/Button/Button.module.css'), 'utf8');

  it('declares the stroke as outline when the fill is below 3:1 on the light surface', () => {
    const style = tokens('#EED037');

    expect(contrast('#EED037', '#FFFFFF')).toBeLessThan(3);
    expect(style['--pl-color-primary-outline']).toBe(`light-dark(${style['--pl-palette-strong-light']}, var(--pl-color-primary))`);
    expect(contrast(style['--pl-palette-strong-light'], '#FFFFFF')).toBeGreaterThanOrEqual(3);
  });

  it('declares nothing when the fill stands out on the surface', () => {
    expect(tokens('#111111')['--pl-color-primary-outline']).toBeUndefined();
    expect(tokens('#49619C')['--pl-color-primary-outline']).toBeUndefined();
  });

  it('ignores the hover and pressed fills, which only sit under the text of the primary Button', () => {
    const style = tokens('#FF3B00');
    const hover = style['--pl-palette-fill-hover']?.match(/#[0-9A-F]{6}/)?.[0];

    expect(contrast('#FF3B00', '#FFFFFF')).toBeGreaterThanOrEqual(3);
    expect(contrast(hover!, '#FFFFFF')).toBeLessThan(3);
    expect(style['--pl-color-primary-outline']).toBeUndefined();
  });

  it('is not used by the primary Button, whose text needs no 3:1 boundary', () => {
    expect(button).not.toContain('--pl-color-primary-outline');
  });
});

describe('outline in nested palettes', () => {
  const color = readFileSync(resolve(process.cwd(), 'src/tokens/semantic/color.css'), 'utf8');
  const palettes = readFileSync(resolve(process.cwd(), 'src/tokens/semantic/palette.css'), 'utf8');

  it('is reset in every palette scope, so a nested palette does not inherit the outline of the outer one', () => {
    expect(color).toMatch(/(^|\n)\[data-palette\] \{\s+--pl-color-primary-outline: initial;\s+\}/);
  });

  it('is never declared by the fixed palettes, which rely on the reset', () => {
    expect(palettes).not.toContain('--pl-color-primary-outline');
  });

  it('is declared on the element of the faint palette, whose inline style wins over the reset', () => {
    const palette = createPalette('#EED037');

    expect(palette['data-palette']).toBe('custom');
    expect(palette.style).toHaveProperty('--pl-color-primary-outline');
  });
});
