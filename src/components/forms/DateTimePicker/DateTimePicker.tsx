import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import {
  CalendarDate,
  CalendarDateTime,
  Time,
  getLocalTimeZone,
  now,
  toCalendarDate,
  toCalendarDateTime,
  today,
} from '@internationalized/date';
import { formatarEntradaData, lerEntradaData } from '../../../utils/formatters';
import { Button } from '../../actions/Button';
import { Calendar } from '../DatePicker/Calendar';
import { TimeSlots } from '../TimePicker/TimeSlots';
import { isUnavailable } from '../../../hooks/useCalendar/calendar';
import { Field } from '../Field';
import styles from './DateTimePicker.module.css';
import { IconCalendar } from '../../icons';

export type DateTimePickerSize = 'sm' | 'md';

export interface DateTimePickerProps {
  defaultValue?: CalendarDateTime;
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
  step?: number;
  onValueChange?: (value?: CalendarDateTime) => void;
  placeholder?: string;
  required?: boolean;
  size?: DateTimePickerSize;
  /**
   * `null` e "controlado e vazio": devolver a propriedade a `undefined` nao
   * limpa o campo, porque ali ele volta a ser nao controlado.
   */
  value?: CalendarDateTime | null;
}

const doisDigitos = (valor: number) => String(valor).padStart(2, '0');

/** Aplica a mascara dia/mes/ano hora:minuto conforme o usuario digita. */
export function formatarEntradaDataHora(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 12);
  const data = formatarEntradaData(digitos.slice(0, 8));

  if (digitos.length <= 8) {
    return data;
  }

  const hora = digitos.slice(8);

  return data + ' ' + (hora.length <= 2 ? hora : hora.slice(0, 2) + ':' + hora.slice(2));
}

export function lerEntradaDataHora(valor: string) {
  const [data, hora = ''] = valor.trim().split(/\s+/);
  const dia = lerEntradaData(data);

  if (!dia) {
    return undefined;
  }

  // Sem hora nenhuma, meia-noite e o valor: e a decisao ja fixada em teste, e a
  // data sozinha e um instante legitimo.
  if (hora === '') {
    return new CalendarDateTime(dia.year, dia.month, dia.day, 0, 0);
  }

  // Com hora pela metade ou impossivel, **nao ha valor**. Aceitar 18:4 como
  // 18:04 fixaria o valor no terceiro digito, e 25:99 viraria meia-noite sem
  // aviso — uma hora que ninguem digitou.
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    return undefined;
  }

  const [h, m] = hora.split(':').map(Number);

  if (h > 23 || m > 59) {
    return undefined;
  }

  return new CalendarDateTime(dia.year, dia.month, dia.day, h, m);
}

function paraTexto(valor?: CalendarDateTime) {
  if (!valor) {
    return '';
  }

  const data = [doisDigitos(valor.day), doisDigitos(valor.month), valor.year].join('/');

  return data + ' ' + doisDigitos(valor.hour) + ':' + doisDigitos(valor.minute);
}

export function DateTimePicker({
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
  step = 30,
  onValueChange,
  placeholder = 'dd/mm/aaaa hh:mm',
  required = false,
  size = 'md',
  value,
}: DateTimePickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [texto, setTexto] = useState(() => paraTexto(defaultValue));
  const [digitando, setDigitando] = useState(false);
  const escolhido = value === undefined ? internalValue : value ?? undefined;
  const [rascunho, setRascunho] = useState(escolhido);

  useEffect(() => {
    if (open) {
      setRascunho(escolhido);
    }
  }, [open]);
  const exibido = digitando ? texto : paraTexto(escolhido);

  function definir(proximo?: CalendarDateTime) {
    if (value === undefined) {
      setInternalValue(proximo);
    }

    onValueChange?.(proximo);
  }

  function rascunharData(data: CalendarDate) {
    setRascunho(new CalendarDateTime(data.year, data.month, data.day, rascunho?.hour ?? 0, rascunho?.minute ?? 0));
  }

  // Sem data escolhida, a hora se apoia em hoje: inventar outra data
  // faria o campo exibir um dia que o usuario nunca escolheu.
  function rascunharHora(hora: Time) {
    const base = rascunho ?? today(getLocalTimeZone());

    setRascunho(new CalendarDateTime(base.year, base.month, base.day, hora.hour, hora.minute));
  }

  function fechar(devolverFoco = true) {
    setOpen(false);

    if (devolverFoco) {
      triggerRef.current?.focus();
    }
  }

  function handleChange(entrada: string) {
    const mascarado = formatarEntradaDataHora(entrada);

    setDigitando(true);
    setTexto(mascarado);

    // O texto e o valor tem de concordar. Enquanto o que esta escrito nao e uma
    // data e hora inteiras, o campo nao tem valor — segurar o ultimo deixava o
    // consumidor com meia-noite enquanto a tela mostrava `18:4`.
    const lido = lerEntradaDataHora(mascarado);
    const dia = lido && toCalendarDate(lido);

    definir(dia && !isUnavailable(dia, { isDateUnavailable, max, min }) ? lido : undefined);
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
                <div className={styles.columns}>
                  <Calendar
                    autoFocus
                    isDateUnavailable={isDateUnavailable}
                    locale={locale}
                    max={max}
                    min={min}
                    onSelect={rascunharData}
                    value={rascunho && new CalendarDate(rascunho.year, rascunho.month, rascunho.day)}
                  />
                  <TimeSlots
                    baseId={(providedId ?? 'datetime') + '-hora'}
                    onChange={rascunharHora}
                    step={step}
                    value={rascunho && new Time(rascunho.hour, rascunho.minute)}
                  />
                </div>
                <div className={styles.footer}>
                  <Button
                    onClick={() => setRascunho(toCalendarDateTime(now(getLocalTimeZone())).set({ second: 0, millisecond: 0 }))}
                    size="sm"
                    variant="ghost"
                    type="button"
                  >
                    Agora
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
