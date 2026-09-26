import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
import { formatarEntradaData, lerEntradaData } from '../../../utils/formatters';
import { Button } from '../../actions/Button';
import { isUnavailable } from '../../../hooks/useCalendar/calendar';
import { Field } from '../Field';
import { Calendar } from './Calendar';
import styles from './DatePicker.module.css';
import { IconCalendar } from '../../icons';

export type DatePickerSize = 'sm' | 'md';

export interface DatePickerProps {
  defaultValue?: CalendarDate;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  isDateUnavailable?: (date: CalendarDate) => boolean;
  label?: string;
  /**
   * Nome do campo no formulario. Com ele, um input oculto carrega o valor para
   * o `FormData`: sem controle nativo por baixo, o envio ignorava o campo.
   */
  name?: string;
  locale?: string;
  max?: CalendarDate;
  min?: CalendarDate;
  onValueChange?: (value?: CalendarDate) => void;
  placeholder?: string;
  required?: boolean;
  size?: DatePickerSize;
  /**
   * `null` e "controlado e vazio": devolver a propriedade a `undefined` nao
   * limpa o campo, porque ali ele volta a ser nao controlado.
   */
  value?: CalendarDate | null;
}

export function DatePicker({
  defaultValue,
  name,
  disabled = false,
  error,
  hint,
  id: providedId,
  isDateUnavailable,
  label,
  locale = 'pt-BR',
  max,
  min,
  onValueChange,
  placeholder = 'dd/mm/aaaa',
  required = false,
  size = 'md',
  value,
}: DatePickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const escolhido = value === undefined ? internalValue : value ?? undefined;
  const [texto, setTexto] = useState(() => (escolhido ? formatarEntradaData(escolhido.toString().split('-').reverse().join('')) : ''));
  const [digitando, setDigitando] = useState(false);
  const [rascunho, setRascunho] = useState(escolhido);

  useEffect(() => {
    if (open) {
      setRascunho(escolhido);
    }
  }, [open]);

  const exibido = digitando
    ? texto
    : escolhido
      ? [String(escolhido.day).padStart(2, '0'), String(escolhido.month).padStart(2, '0'), escolhido.year].join('/')
      : '';

  function definir(proximo?: CalendarDate) {
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
    const mascarado = formatarEntradaData(entrada);

    setDigitando(true);
    setTexto(mascarado);

    // Data fora dos limites nao se grava: o calendario ja a recusa, e o campo
    // digitado nao pode ser a porta dos fundos dela.
    const lido = lerEntradaData(mascarado);
    const permitido = lido && !isUnavailable(lido, { isDateUnavailable, max, min }) ? lido : undefined;

    definir(permitido);
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
          {name !== undefined && <input name={name} type="hidden" value={escolhido?.toString() ?? ''} />}
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
              aria-label="Abrir calendário"
              className={styles.trigger}
              disabled={disabled}
              onClick={() => (open ? fechar() : setOpen(true))}
              ref={triggerRef}
              type="button"
            >
              <IconCalendar size={15} />
            </button>
          </div>
          {open &&
            createPortal(
              <div
                {...overlayProps}
                aria-label={label ? 'Calendário de ' + label : 'Calendário'}
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
                <Calendar
                  autoFocus
                  isDateUnavailable={isDateUnavailable}
                  locale={locale}
                  max={max}
                  min={min}
                  onSelect={setRascunho}
                  value={rascunho}
                />
                <div className={styles.footer}>
                  <Button onClick={() => setRascunho(today(getLocalTimeZone()))} size="sm" variant="ghost" type="button">
                    Hoje
                  </Button>
                  <div className={styles.actions}>
                    <Button onClick={() => fechar()} size="sm" variant="secondary" type="button">
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        definir(rascunho);
                        setDigitando(false);
                        fechar();
                      }}
                      size="sm"
                      type="button"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </>
      )}
    </Field>
  );
}
