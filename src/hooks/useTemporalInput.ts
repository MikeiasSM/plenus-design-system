import {
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';

type Evaluation<T> = { value: T } | { message: string; reason: 'invalid' | 'outOfRange' };

interface TemporalInputOptions<T> {
  announce: (value: T) => string;
  close: (text: string, key: string) => string | undefined;
  commit: (value: T | null) => void;
  error?: string;
  evaluate: (text: string, closed: boolean) => Evaluation<T>;
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
  close,
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
  const closedRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (cursorRef.current !== null) {
      inputRef.current?.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  function reset() {
    closedRef.current = null;
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

  function write(masked: string) {
    if (closedRef.current !== null && !masked.startsWith(closedRef.current)) {
      closedRef.current = null;
    }

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

  function change(input: string) {
    write(mask(filter(input)));
  }

  function closeAt(masked: string, key: string) {
    const closed = close(masked, key);

    if (closed !== undefined) {
      closedRef.current = closed;
    }

    return closed;
  }

  function confirm() {
    if (!typing) {
      return;
    }

    if (text.trim() === '') {
      reset();
      return;
    }

    const closed = closedRef.current !== null && !/\D/.test(text.slice(closedRef.current.length));
    const evaluated = evaluate(text, closed);

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

      const { selectionEnd, selectionStart, value: current } = event.currentTarget;
      const closed = selectionStart === current.length && selectionEnd === current.length ? closeAt(current, key) : undefined;

      if (closed !== undefined) {
        cursorRef.current = closed.length;
        write(closed);
      }
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>, onPaste?: (event: ClipboardEvent<HTMLInputElement>) => void) {
    onPaste?.(event);

    if (event.defaultPrevented || event.currentTarget.readOnly) {
      return;
    }

    event.preventDefault();

    const { selectionEnd, selectionStart, value: current } = event.currentTarget;
    const input =
      current.slice(0, selectionStart ?? current.length) +
      event.clipboardData.getData('text') +
      current.slice(selectionEnd ?? current.length);
    let typed = '';

    closedRef.current = null;

    for (const char of filter(input)) {
      typed = closeAt(typed, char) ?? (char >= '0' && char <= '9' ? mask(typed + char) : typed);
    }

    cursorRef.current = typed.length;
    write(typed);
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
    handlePaste,
    reset,
    text: typing ? text : format(value),
  };
}
