const EDITABLE = 'input, textarea, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';

function isMac() {
  return /mac|iphone|ipad/i.test(navigator.platform);
}

export function isEditableTarget(target: EventTarget | null) {
  return target instanceof Element && target.closest(EDITABLE) !== null;
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string) {
  const parts = shortcut.toLowerCase().split('+').map((part) => part.trim());
  const key = parts.pop();
  const wanted = new Set(parts);
  const mac = isMac();

  return (
    event.key.toLowerCase() === key &&
    event.ctrlKey === (wanted.has('ctrl') || (wanted.has('mod') && !mac)) &&
    event.metaKey === (wanted.has('meta') || (wanted.has('mod') && mac)) &&
    event.altKey === wanted.has('alt') &&
    event.shiftKey === wanted.has('shift')
  );
}
