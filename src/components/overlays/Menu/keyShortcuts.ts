// Nomes de tecla que a especificação ARIA espera em `aria-keyshortcuts`, pela grafia escrita em minúsculas.
const KEY_NAMES: Record<string, string> = {
  '⌘': 'Meta',
  cmd: 'Meta',
  command: 'Meta',
  meta: 'Meta',
  '⌥': 'Alt',
  alt: 'Alt',
  opt: 'Alt',
  option: 'Alt',
  '⇧': 'Shift',
  shift: 'Shift',
  '⌃': 'Control',
  ctrl: 'Control',
  control: 'Control',
  esc: 'Escape',
  escape: 'Escape',
  del: 'Delete',
  delete: 'Delete',
  '⌫': 'Backspace',
  backspace: 'Backspace',
  '↵': 'Enter',
  enter: 'Enter',
  return: 'Enter',
  '⇥': 'Tab',
  tab: 'Tab',
  space: 'Space',
  espaço: 'Space',
  '+': 'Plus',
  '↑': 'ArrowUp',
  up: 'ArrowUp',
  '↓': 'ArrowDown',
  down: 'ArrowDown',
  '←': 'ArrowLeft',
  left: 'ArrowLeft',
  '→': 'ArrowRight',
  right: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
};

function toKeyName(key: string) {
  const name = KEY_NAMES[key.toLowerCase()];

  if (name) {
    return name;
  }

  return key.length === 1 || /^f\d{1,2}$/i.test(key) ? key.toUpperCase() : key;
}

function toKeyCombination(shortcut: string) {
  // Os símbolos do macOS vêm colados (`⌘⇧D`); o `+` final de `Ctrl++` é a própria tecla.
  const separated = shortcut.replace(/([⌘⌥⇧⌃])(?=[^+])/g, '$1+');

  return (separated.match(/[^+]+|\+$/g) ?? []).map(toKeyName).join('+');
}

/** Converte o atalho escrito, como `Ctrl+Shift+D` ou `⌘K, Ctrl+K`, no valor de `aria-keyshortcuts`. */
export function toAriaKeyShortcuts(shortcut: string) {
  return shortcut
    .replace(/\s*\+\s*/g, '+')
    .replace(/([^+]),/g, '$1 ')
    .split(/\s+/)
    .filter(Boolean)
    .map(toKeyCombination)
    .join(' ');
}
