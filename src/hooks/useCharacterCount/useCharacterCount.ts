import { useEffect, useRef, useState } from 'react';

type FieldValue = string | number | readonly string[] | undefined;

// Conta unidades UTF-16, a mesma medida do maxLength nativo, para que o
// numero exibido corresponda ao ponto exato em que o navegador corta.
function countCharacters(value: FieldValue) {
  return String(value ?? '').length;
}

export function useCharacterCount<T extends HTMLInputElement | HTMLTextAreaElement>(
  value: FieldValue,
  defaultValue: FieldValue,
) {
  const elementRef = useRef<T>(null);
  const [uncontrolledCount, setUncontrolledCount] = useState(() => countCharacters(defaultValue));

  useEffect(() => {
    const form = elementRef.current?.form;

    if (!form) {
      return;
    }

    function restoreInitialCount() {
      setUncontrolledCount(countCharacters(defaultValue));
    }

    form.addEventListener('reset', restoreInitialCount);

    return () => form.removeEventListener('reset', restoreInitialCount);
  }, [defaultValue]);

  return {
    ref: elementRef,
    count: value === undefined ? uncontrolledCount : countCharacters(value),
    updateCount(nextValue: string) {
      if (value === undefined) {
        setUncontrolledCount(countCharacters(nextValue));
      }
    },
  };
}
