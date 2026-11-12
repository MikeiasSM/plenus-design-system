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
