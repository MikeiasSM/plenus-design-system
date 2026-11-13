// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { useColorScheme, type ColorScheme } from './useColorScheme';

function Mostra({ padrao }: { padrao?: ColorScheme }) {
  const { colorScheme, resolvedColorScheme } = useColorScheme({ defaultColorScheme: padrao });

  return <p>{`${colorScheme}/${resolvedColorScheme}`}</p>;
}

describe('useColorScheme no servidor', () => {
  it('renderiza sem window nem document, com o padrão e o esquema claro', () => {
    expect(typeof window).toBe('undefined');
    expect(renderToString(<Mostra />)).toContain('system/light');
    expect(renderToString(<Mostra padrao="dark" />)).toContain('dark/dark');
  });
});
