import { useCallback, useState } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

function needsFocus(element: HTMLElement) {
  const overflows = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;

  return overflows && !element.querySelector(FOCUSABLE);
}

export function useScrollFocusable() {
  const [focusable, setFocusable] = useState(false);

  const ref = useCallback((element: HTMLElement | null) => {
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const measure = () => setFocusable(needsFocus(element));
    const resize = new ResizeObserver(measure);
    const watchChildren = () => {
      for (const child of element.children) {
        resize.observe(child);
      }
    };
    const mutation = new MutationObserver(() => {
      watchChildren();
      measure();
    });

    resize.observe(element);
    watchChildren();

    mutation.observe(element, { attributeFilter: ['disabled', 'href', 'tabindex'], attributes: true, childList: true, subtree: true });

    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);

  return { focusable, ref };
}
