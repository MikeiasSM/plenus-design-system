import { useEffect, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { formatarEntradaData, lerEntradaData } from '../../../utils/formatters';
import { Button } from '../../actions/Button';
import { isUnavailable } from '../../../hooks/useCalendar/calendar';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import { Calendar } from './Calendar';
import styles from './DatePicker.module.css';
import { IconCalendar } from '../../icons';

export type DatePickerSize = 'sm' | 'md';

/**
 * As propriedades nativas vao ao campo de texto, que e o controle; o `className` soma a caixa do campo, que e o que
 * se posiciona e dimensiona.
 */
export interface DatePickerProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'defaultValue' | 'max' | 'min' | 'name' | 'onChange' | 'size' | 'type' | 'value'
  > {
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
  /** Sem data inteira e permitida, o valor e `null`, que mantem o campo controlado e vazio. */
  onValueChange?: (value: CalendarDate | null) => void;
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
  onValueChange,
  onBlur,
  onKeyDown,
  placeholder = 'dd/mm/aaaa',
  required = false,
  size = 'md',
  ref,
  value,
  ...props
}: DatePickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? null);
  const escolhido = (value === undefined ? internalValue : value) ?? undefined;
  const [texto, setTexto] = useState('');
  const [digitando, setDigitando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetRef = useFormReset<HTMLInputElement>(() => {
    setInternalValue(defaultValue ?? null);
    setDigitando(false);
  });
  const mergedRef = useMergedRefs(inputRef, resetRef, ref);
  const [rascunho, setRascunho] = useState(escolhido);
  const [versaoDoCalendario, setVersaoDoCalendario] = useState(0);

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

  // O interno acompanha mesmo controlado: se o consumidor devolver `undefined`, nao ressurge um valor velho.
  function definir(proximo: CalendarDate | null) {
    setInternalValue(proximo);
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
    const permitido = lido && !isUnavailable(lido, { isDateUnavailable, max, min }) ? lido : null;

    definir(permitido);
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
                <Calendar
                  autoFocus
                  key={versaoDoCalendario}
                  isDateUnavailable={isDateUnavailable}
                  locale={locale}
                  max={max}
                  min={min}
                  onSelect={setRascunho}
                  value={rascunho}
                />
                <div className={styles.footer}>
                  <Button
                    onClick={() => {
                      // Remontada, a grade volta ao mes de hoje mesmo que o rascunho ja fosse hoje.
                      setRascunho(today(getLocalTimeZone()));
                      setVersaoDoCalendario((versao) => versao + 1);
                    }}
                    size="sm"
                    variant="ghost"
                    type="button"
                  >
                    Hoje
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
