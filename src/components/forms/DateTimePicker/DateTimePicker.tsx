import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent } from 'react';
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
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { formatarEntradaDataHora, lerEntradaDataHora } from '../../../utils/formatters';
import { Button } from '../../actions/Button';
import { Calendar } from '../DatePicker/Calendar';
import { TimeSlots } from '../TimePicker/TimeSlots';
import { isUnavailable } from '../../../hooks/useCalendar/calendar';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import styles from './DateTimePicker.module.css';
import { IconCalendar } from '../../icons';

export type DateTimePickerSize = 'sm' | 'md';

/**
 * As propriedades nativas vao ao campo de texto, que e o controle; o `className` soma a caixa do campo, que e o que
 * se posiciona e dimensiona.
 */
export interface DateTimePickerProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'defaultValue' | 'max' | 'min' | 'name' | 'onChange' | 'size' | 'type' | 'value' | 'step'
  > {
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
  /** Sem data e hora inteiras e permitidas, o valor e `null`, que mantem o campo controlado e vazio. */
  onValueChange?: (value: CalendarDateTime | null) => void;
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

function paraTexto(valor?: CalendarDateTime) {
  if (!valor) {
    return '';
  }

  const data = [doisDigitos(valor.day), doisDigitos(valor.month), valor.year].join('/');

  return data + ' ' + doisDigitos(valor.hour) + ':' + doisDigitos(valor.minute);
}

export function DateTimePicker({
  'aria-describedby': ariaDescribedBy,
  className,
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
  onBlur,
  onKeyDown,
  placeholder = 'dd/mm/aaaa hh:mm',
  required = false,
  size = 'md',
  ref,
  value,
  ...props
}: DateTimePickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Fixo, o id fazia dois seletores dividirem os ids das opcoes de hora.
  const idDaLista = `datetime-hora-${useId()}`;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? null);
  const [texto, setTexto] = useState('');
  const [digitando, setDigitando] = useState(false);
  const escolhido = (value === undefined ? internalValue : value) ?? undefined;
  const [rascunho, setRascunho] = useState(escolhido);
  const [versaoDoCalendario, setVersaoDoCalendario] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetRef = useFormReset<HTMLInputElement>(() => {
    setInternalValue(defaultValue ?? null);
    setDigitando(false);
  });
  const mergedRef = useMergedRefs(inputRef, resetRef, ref);

  useEffect(() => {
    if (open) {
      setRascunho(escolhido);
    }
  }, [open]);
  const exibido = digitando ? texto : paraTexto(escolhido);

  // O interno acompanha mesmo controlado: se o consumidor devolver `undefined`, nao ressurge um valor velho.
  function definir(proximo: CalendarDateTime | null) {
    setInternalValue(proximo);
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

    definir(lido && dia && !isUnavailable(dia, { isDateUnavailable, max, min }) ? lido : null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);

    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === 'Escape' && open) {
      fechar(false);
    }
  }

  const { overlayProps } = useOverlay(
    {
      isOpen: open,
      onClose: () => fechar(false),
      isDismissable: true,
      shouldCloseOnBlur: false,
      // O gatilho nao conta como "fora": sem isto o ponteiro fecha o painel e o
      // clique dele reabre em seguida, e ele pisca sem abrir.
      shouldCloseOnInteractOutside: (elemento) => !fieldRef.current?.contains(elemento),
    },
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
    <Field aria-describedby={ariaDescribedBy} error={error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <FormValue
            disabled={disabled}
            name={name}
            onFocus={() => inputRef.current?.focus()}
            required={required}
            value={escolhido?.toString() ?? ''}
          />
          <div
            className={[styles.field, styles[size], error && styles.error, className].filter(Boolean).join(' ')}
            ref={fieldRef}
          >
            <input
              {...props}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              aria-required={required || undefined}
              autoComplete="off"
              className={styles.input}
              disabled={disabled}
              id={id}
              inputMode="numeric"
              onBlur={(event) => {
                setDigitando(false);
                onBlur?.(event);
              }}
              onChange={(event) => handleChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              ref={mergedRef}
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
                    key={versaoDoCalendario}
                    isDateUnavailable={isDateUnavailable}
                    locale={locale}
                    max={max}
                    min={min}
                    onSelect={rascunharData}
                    value={rascunho && new CalendarDate(rascunho.year, rascunho.month, rascunho.day)}
                  />
                  <TimeSlots
                    baseId={idDaLista}
                    onChange={rascunharHora}
                    step={step}
                    value={rascunho && new Time(rascunho.hour, rascunho.minute)}
                  />
                </div>
                <div className={styles.footer}>
                  <Button
                    onClick={() => {
                      // Remontada, a grade volta ao mes de hoje mesmo que o rascunho ja fosse hoje.
                      setRascunho(toCalendarDateTime(now(getLocalTimeZone())).set({ second: 0, millisecond: 0 }));
                      setVersaoDoCalendario((versao) => versao + 1);
                    }}
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
                        definir(rascunho ?? null);
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
