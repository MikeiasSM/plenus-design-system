import { KEY_NAMES } from '../../overlays/Menu/keyShortcuts';

/** `other` e Windows e Linux; `auto` descobre a plataforma no navegador. */
export type KbdPlatform = 'auto' | 'mac' | 'other';

/** As teclas que tem simbolo ou nome falado proprio. */
export type KbdKeyName =
  | 'Alt'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'Backspace'
  | 'Command'
  | 'Control'
  | 'Delete'
  | 'End'
  | 'Enter'
  | 'Escape'
  | 'Home'
  | 'Meta'
  | 'Option'
  | 'PageDown'
  | 'PageUp'
  | 'Plus'
  | 'Shift'
  | 'Space'
  | 'Tab';

/** Os nomes que o leitor de tela fala para cada tecla. */
export type KbdLabels = Partial<Record<KbdKeyName, string>>;

export const DEFAULT_KBD_LABELS: Record<KbdKeyName, string> = {
  Alt: 'Alt',
  ArrowDown: 'Seta para baixo',
  ArrowLeft: 'Seta para a esquerda',
  ArrowRight: 'Seta para a direita',
  ArrowUp: 'Seta para cima',
  Backspace: 'Backspace',
  Command: 'Command',
  Control: 'Control',
  Delete: 'Delete',
  End: 'End',
  Enter: 'Enter',
  Escape: 'Escape',
  Home: 'Home',
  Meta: 'Meta',
  Option: 'Option',
  PageDown: 'Page Down',
  PageUp: 'Page Up',
  Plus: 'Mais',
  Shift: 'Shift',
  Space: 'Espaço',
  Tab: 'Tab',
};

type Shown = { mac: string; other: string };

// O que se ve de cada tecla em cada plataforma; o nome falado sai de `labels`.
const SHOWN: Partial<Record<string, Shown & { spoken: { mac: KbdKeyName; other: KbdKeyName } }>> = {
  Alt: { mac: '⌥', other: 'Alt', spoken: { mac: 'Option', other: 'Alt' } },
  ArrowDown: { mac: '↓', other: '↓', spoken: { mac: 'ArrowDown', other: 'ArrowDown' } },
  ArrowLeft: { mac: '←', other: '←', spoken: { mac: 'ArrowLeft', other: 'ArrowLeft' } },
  ArrowRight: { mac: '→', other: '→', spoken: { mac: 'ArrowRight', other: 'ArrowRight' } },
  ArrowUp: { mac: '↑', other: '↑', spoken: { mac: 'ArrowUp', other: 'ArrowUp' } },
  Backspace: { mac: '⌫', other: 'Backspace', spoken: { mac: 'Backspace', other: 'Backspace' } },
  Control: { mac: '⌃', other: 'Ctrl', spoken: { mac: 'Control', other: 'Control' } },
  Delete: { mac: '⌦', other: 'Del', spoken: { mac: 'Delete', other: 'Delete' } },
  End: { mac: 'End', other: 'End', spoken: { mac: 'End', other: 'End' } },
  Enter: { mac: '↵', other: 'Enter', spoken: { mac: 'Enter', other: 'Enter' } },
  Escape: { mac: 'Esc', other: 'Esc', spoken: { mac: 'Escape', other: 'Escape' } },
  Home: { mac: 'Home', other: 'Home', spoken: { mac: 'Home', other: 'Home' } },
  Meta: { mac: '⌘', other: 'Meta', spoken: { mac: 'Command', other: 'Meta' } },
  Mod: { mac: '⌘', other: 'Ctrl', spoken: { mac: 'Command', other: 'Control' } },
  PageDown: { mac: 'PgDn', other: 'PgDn', spoken: { mac: 'PageDown', other: 'PageDown' } },
  PageUp: { mac: 'PgUp', other: 'PgUp', spoken: { mac: 'PageUp', other: 'PageUp' } },
  Plus: { mac: '+', other: '+', spoken: { mac: 'Plus', other: 'Plus' } },
  Shift: { mac: '⇧', other: 'Shift', spoken: { mac: 'Shift', other: 'Shift' } },
  Tab: { mac: '⇥', other: 'Tab', spoken: { mac: 'Tab', other: 'Tab' } },
};

export interface ResolvedKey {
  /** O nome falado, quando difere do que se ve. */
  spoken?: string;
  shown: string;
}

function canonical(key: string) {
  const lower = key.trim().toLowerCase();

  if (lower === 'mod') {
    return 'Mod';
  }

  return KEY_NAMES[lower] ?? key.trim();
}

/** O que se ve e o que se fala de uma tecla, na plataforma dada. */
export function resolveKey(key: string, platform: 'mac' | 'other', labels: KbdLabels = {}): ResolvedKey {
  const name = canonical(key);

  if (name === 'Space') {
    return { shown: labels.Space ?? DEFAULT_KBD_LABELS.Space };
  }

  const known = SHOWN[name];

  if (!known) {
    // Letra e tecla de funcao aparecem em maiuscula; o resto, como veio.
    return { shown: name.length === 1 || /^f\d{1,2}$/i.test(name) ? name.toUpperCase() : name };
  }

  const shown = known[platform];
  const spokenName = known.spoken[platform];
  const spoken = labels[spokenName] ?? DEFAULT_KBD_LABELS[spokenName];

  return spoken === shown ? { shown } : { shown, spoken };
}

export function detectMac() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;

  return /mac|iphone|ipad|ipod/i.test(data?.platform || navigator.platform || navigator.userAgent);
}

/**
 * O atalho como texto: "Ctrl+Shift+P", ou "⌘⇧P" no macOS, sem o `+` entre as teclas. Serve onde so cabe uma string,
 * como o `shortcut` do `Menu`. Com `auto`, a plataforma e descoberta na hora da chamada.
 */
export function formatShortcut(keys: readonly string[], platform: KbdPlatform = 'other') {
  const resolved = platform === 'auto' ? (detectMac() ? 'mac' : 'other') : platform;
  const shown = keys.map((key) => resolveKey(key, resolved).shown);

  return shown.join(resolved === 'mac' ? '' : '+');
}
