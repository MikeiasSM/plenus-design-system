import { useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type RefObject } from 'react';

type Evaluation<T> = { value: T } | { message: string; reason: 'invalid' | 'outOfRange' };

interface TemporalInputOptions<T> {
  announce: (value: T) => string;
  commit: (value: T | null) => void;
  error?: string;
  evaluate: (text: string) => Evaluation<T>;
  filter: (input: string) => string;
  format: (value?: T) => string;
  inputRef: RefObject<HTMLInputElement | null>;
  isAllowed: (value: T) => boolean;
  mask: (input: string) => string;
  now: () => T;
  onInvalidText?: (text: string, reason: 'invalid' | 'outOfRange') => void;
  parse: (text: string) => T | undefined;
  step: (value: T, direction: 1 | -1, text: string, cursor: number) => { cursor: number; value: T };
  value: T | undefined;
}

export function useTemporalInput<T extends { toString: () => string }>({
  announce,
  commit,
  error,
  evaluate,
  filter,
  format,
  inputRef,
  isAllowed,
  mask,
  now,
  onInvalidText,
  parse,
  step,
  value,
}: TemporalInputOptions<T>) {
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [message, setMessage] = useState<string>();
  const [announcement, setAnnouncement] = useState('');
  const cursorRef = useRef<number | null>(null);
  const reportedRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (cursorRef.current !== null) {
      inputRef.current?.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  function reset() {
    setTyping(false);
    setMessage(undefined);
  }

  function apply(next: T, cursor?: number) {
    if (!isAllowed(next)) {
      return;
    }

    const written = format(next);

    cursorRef.current = cursor ?? written.length;
    setText(written);
    reset();

    if (next.toString() !== value?.toString()) {
      commit(next);
      setAnnouncement(announce(next));
    }
  }

  function change(input: string) {
    const masked = mask(filter(input));

    reportedRef.current = null;
    setAnnouncement('');
    setTyping(true);
    setText(masked);

    if (masked.trim() === '') {
      setMessage(undefined);
      commit(null);
      return;
    }

    const parsed = parse(masked);

    if (parsed) {
      setMessage(undefined);
      commit(parsed);
    }
  }

  function confirm() {
    if (!typing) {
      return;
    }

    if (text.trim() === '') {
      reset();
      return;
    }

    const evaluated = evaluate(text);

    if ('message' in evaluated) {
      setMessage(evaluated.message);

      if (reportedRef.current !== text) {
        reportedRef.current = text;
        onInvalidText?.(text, evaluated.reason);
      }
      return;
    }

    setText(format(evaluated.value));
    reset();

    if (evaluated.value.toString() !== value?.toString()) {
      commit(evaluated.value);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const { altKey, ctrlKey, key, metaKey } = event;

    if (event.defaultPrevented || event.currentTarget.readOnly || altKey || ctrlKey || metaKey) {
      return;
    }

    if (key === 'Enter') {
      confirm();
    } else if (key === 'h' || key === 'H') {
      event.preventDefault();
      apply(now());
    } else if (key === '+' || key === '-') {
      event.preventDefault();

      const base = typing ? (text.trim() === '' ? undefined : (parse(text) ?? value)) : value;
      const next = step(
        base ?? now(),
        key === '+' ? 1 : -1,
        event.currentTarget.value,
        event.currentTarget.selectionStart ?? event.currentTarget.value.length,
      );

      apply(next.value, next.cursor);
    } else if (key.length === 1 && !(key >= '0' && key <= '9')) {
      event.preventDefault();
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>, onBlur?: (event: FocusEvent<HTMLInputElement>) => void) {
    confirm();
    onBlur?.(event);
  }

  return {
    announcement,
    change,
    confirm,
    error: error || message,
    handleBlur,
    handleKeyDown,
    reset,
    text: typing ? text : format(value),
  };
}
