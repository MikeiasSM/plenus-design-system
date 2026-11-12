interface PressKey {
  key: string;
  preventDefault: () => void;
  repeat: boolean;
}

export function blockRepeatedPress(event: PressKey) {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    return true;
  }

  return false;
}

export function isRepeatedClick(event: { detail: number }) {
  return event.detail > 1;
}

export function withoutRepeat<E extends PressKey>(handler?: (event: E) => void) {
  return (event: E) => {
    handler?.(event);
    blockRepeatedPress(event);
  };
}
