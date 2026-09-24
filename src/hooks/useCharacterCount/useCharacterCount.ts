import { useEffect, useRef, useState } from 'react';

type FieldValue = string | number | readonly string[] | undefined;

function countCharacters(value: FieldValue) {
  return Array.from(String(value ?? '')).length;
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
