import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * O texto de uma região de status oculta, sempre montada. Com `delay`, o texto só entra se nada o trocar antes:
 * uma espera que acaba logo não chega a ser anunciada.
 */
export function useAnnouncement() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const announce = useCallback((text: string, delay = 0) => {
    clearTimeout(timer.current);

    if (delay > 0) {
      timer.current = setTimeout(() => setMessage(text), delay);
      return;
    }

    setMessage(text);
  }, []);

  return { announce, message };
}
