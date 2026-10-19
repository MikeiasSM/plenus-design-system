import { toAriaKeyShortcuts } from './keyShortcuts';

describe('toAriaKeyShortcuts', () => {
  it.each([
    ['Ctrl+Shift+D', 'Control+Shift+D'],
    ['ctrl + d', 'Control+D'],
    ['Cmd+K', 'Meta+K'],
    ['⌘⇧P', 'Meta+Shift+P'],
    ['⌃⌥Del', 'Control+Alt+Delete'],
    ['Alt+↑', 'Alt+ArrowUp'],
    ['Esc', 'Escape'],
    ['Shift+F10', 'Shift+F10'],
    ['Ctrl++', 'Control+Plus'],
    ['Ctrl+,', 'Control+,'],
    ['Ctrl+Space', 'Control+Space'],
    ['Delete', 'Delete'],
  ])('converte %s em %s', (escrito, esperado) => {
    expect(toAriaKeyShortcuts(escrito)).toBe(esperado);
  });

  it('separa por espaço os vários atalhos escritos com vírgula ou espaço', () => {
    expect(toAriaKeyShortcuts('Ctrl+D, ⌘D')).toBe('Control+D Meta+D');
    expect(toAriaKeyShortcuts('Ctrl+D ⌘D')).toBe('Control+D Meta+D');
  });
});
