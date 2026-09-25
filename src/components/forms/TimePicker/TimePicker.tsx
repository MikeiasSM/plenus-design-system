import { useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { Time } from '@internationalized/date';
import { Field } from '../Field';
import { TimeSlots, formatarEntradaHora, lerEntradaHora, paraTextoDeHora } from './TimeSlots';
import styles from './TimePicker.module.css';
import { IconClock } from '../../icons';

export type TimePickerSize = 'sm' | 'md';

export interface TimePickerProps {
  defaultValue?: Time;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  label?: string;
  max?: Time;
  min?: Time;
  step?: number;
  onValueChange?: (value?: Time) => void;
  placeholder?: string;
  required?: boolean;
  size?: TimePickerSize;
  value?: Time;
}

export function TimePicker({
  defaultValue,
  disabled = false,
  error,
  hint,
  id: providedId,
  label,
  max,
  min,
  step = 30,
  onValueChange,
  placeholder = 'hh:mm',
  required = false,
  size = 'md',
  value,
}: TimePickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [texto, setTexto] = useState(() => paraTextoDeHora(defaultValue));
  const [digitando, setDigitando] = useState(false);
  const escolhido = value ?? internalValue;
  const exibido = digitando ? texto : paraTextoDeHora(escolhido);

  function definir(proximo?: Time) {
    if (value === undefined) {
      setInternalValue(proximo);
    }

    onValueChange?.(proximo);
  }

  function fechar(devolverFoco = true) {
    setOpen(false);

    if (devolverFoco) {
      triggerRef.current?.focus();
    }
  }

  function handleChange(entrada: string) {
    const mascarado = formatarEntradaHora(entrada);

    setDigitando(true);
    setTexto(mascarado);

    const lido = lerEntradaHora(mascarado);

    if (lido) {
      definir(lido);
    } else if (mascarado === '') {
      definir(undefined);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      setOpen(true);
    }
  }

  const { overlayProps } = useOverlay(
    { isOpen: open, onClose: () => fechar(false), isDismissable: true, shouldCloseOnBlur: false },
    panelRef,
  );
  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: fieldRef,
    overlayRef: panelRef,
    placement: 'bottom start',
    offset: 6,
    containerPadding: 8,
    isOpen: open,
  });

  return (
    <Field error={error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <div className={[styles.field, styles[size], error && styles.error].filter(Boolean).join(' ')} ref={fieldRef}>
            <input
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              aria-required={required || undefined}
              autoComplete="off"
              className={styles.input}
              disabled={disabled}
              id={id}
              inputMode="numeric"
              onBlur={() => setDigitando(false)}
              onChange={(event) => handleChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              type="text"
              value={exibido}
            />
            <button
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label="Abrir seletor de hora"
              className={styles.trigger}
              disabled={disabled}
              onClick={() => (open ? fechar() : setOpen(true))}
              ref={triggerRef}
              type="button"
            >
              <IconClock size={15} />
            </button>
          </div>
          {open &&
            createPortal(
              <div
                {...overlayProps}
                aria-label={label ? 'Horas de ' + label : 'Horas'}
                className={styles.panel}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    fechar();
                  }
                  overlayProps.onKeyDown?.(event);
                }}
                ref={panelRef}
                role="dialog"
                style={positionProps.style}
              >
                <TimeSlots
                  baseId={providedId ?? 'hora'}
                  max={max}
                  min={min}
                  onChange={(hora) => {
                    definir(hora);
                    setDigitando(false);
                    fechar();
                  }}
                  step={step}
                  value={escolhido}
                />
              </div>,
              document.body,
            )}
        </>
      )}
    </Field>
  );
}
