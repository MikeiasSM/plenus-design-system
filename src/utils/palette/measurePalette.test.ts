import { measurePalette } from './measurePalette';

const role = (color: string, name: string) => measurePalette(color).find((item) => item.role === name)!;

describe('measurePalette', () => {
  it('measures the six roles, in order', () => {
    expect(measurePalette('#49619C').map((item) => item.role)).toEqual(['text-on-fill', 'hover', 'active', 'strong', 'outline', 'container']);
  });

  it('reports what the palette kept and what it adjusted for a light fill', () => {
    expect(role('#EED037', 'text-on-fill')).toMatchObject({ foreground: '#373435', minimum: 4.5, passes: true, adjusted: false });
    expect(role('#EED037', 'strong')).toMatchObject({ foreground: '#816E03', passes: true, adjusted: true });
    expect(role('#EED037', 'outline')).toMatchObject({ foreground: '#816E03', minimum: 3, passes: true, adjusted: true });
  });

  it('reports a dark fill as kept everywhere', () => {
    const laudo = measurePalette('#111111');

    expect(laudo.every((item) => item.passes)).toBe(true);
    expect(laudo.find((item) => item.role === 'outline')).toMatchObject({ foreground: '#111111', adjusted: false });
  });

  it('marks the text imposed by the product as adjusted and does not hide a failing ratio', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const texto = measurePalette('#FF3B00', { onSolid: '#FFFFFF' }).find((item) => item.role === 'text-on-fill')!;

    expect(texto).toMatchObject({ adjusted: true, passes: false, ratio: 3.57 });
  });

  it('refuses the same colors as createPalette', () => {
    expect(() => measurePalette('#FFE14D')).toThrow(RangeError);
    expect(() => measurePalette('amarelo')).toThrow(TypeError);
  });
});
