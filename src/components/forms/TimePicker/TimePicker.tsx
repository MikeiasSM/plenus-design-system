import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { Time, getLocalTimeZone, now } from '@internationalized/date';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { usePortalContainer } from '../../overlays/Portal/PortalContext';
import { useOpenState } from '../../../hooks/useOpenState';
import { completeTimeInput, formatTime, formatTimeInput, keepDigits, parseTimeInput } from '../../../utils/formatters';
import { useTemporalInput } from '../../../hooks/useTemporalInput';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import { readIsoTime, toIsoTime } from '../DatePicker/iso';
import { TimeSlots, isTimeAllowed, paraTextoDeHora } from './TimeSlots';
import datePickerStyles from '../DatePicker/DatePicker.module.css';
import styles from './TimePicker.module.css';
import { IconClock } from '../../icons';

export type TimePickerSize = 'sm' | 'md' | 'lg';

/**
 * As propriedades nativas vao ao campo de texto, que e o controle; o `className` soma a caixa do campo, que e o que
 * se posiciona e dimensiona.
 */
export interface TimePickerProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'defaultValue' | 'max' | 'min' | 'name' | 'onChange' | 'size' | 'type' | 'value' | 'step'
  > {
  /** Hora em `HH:mm`, como no `FormData`: a API nao expoe tipo de biblioteca de terceiros. */
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  label?: string;
  /**
   * Nome do campo no formulario. Com ele, um input oculto carrega o valor para
   * o `FormData`: sem controle nativo por baixo, o envio ignorava o campo.
   */
  name?: string;
  max?: string;
  min?: string;
  step?: number;
  /** Avisa, ao confirmar ou sair do campo, o texto que não é hora válida e por quê. */
  onInvalidText?: (text: string, reason: 'invalid' | 'outOfRange') => void;
  /** Sem hora inteira e permitida, o valor e `null`, que mantem o campo controlado e vazio. */
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
  size?: TimePickerSize;
  /**
   * `null` e "controlado e vazio": devolver a propriedade a `undefined` nao
   * limpa o campo, porque ali ele volta a ser nao controlado.
   */
  value?: string | null;
  /** Abertura do painel de início, sem controle. */
  defaultOpen?: boolean;
  /** Avisa cada abertura e fechamento, por qualquer via. */
  onOpenChange?: (open: boolean) => void;
  /** Com ele o painel é controlado: só muda quando o produto atualiza a propriedade. */
  open?: boolean;
  /** Elemento que recebe o painel. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
}

export function TimePicker({
  'aria-describedby': ariaDescribedBy,
  className,
  defaultOpen,
  defaultValue,
  name,
  disabled = false,
  error,
  hint,
  id: providedId,
  label,
  max,
  min,
  step = 30,
  onInvalidText,
  onValueChange,
  onBlur,
  onOpenChange,
  onKeyDown,
  open: controlledOpen,
  portalContainer,
  placeholder = 'hh:mm',
  required = false,
  size = 'md',
  ref,
  value,
  ...props
}: TimePickerProps) {
  const container = usePortalContainer(portalContainer);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Sem isto, dois seletores de hora na mesma pagina dividiam os ids das opcoes.
  const idDaLista = `hora-${useId()}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  const wasOpenRef = useRef(open);
  const devolverFocoRef = useRef(true);
  const horaMinima = readIsoTime(min);
  const horaMaxima = readIsoTime(max);
  const [internalValue, setInternalValue] = useState<Time | null>(() => readIsoTime(defaultValue) ?? null);
  const controlado = value === undefined ? undefined : (readIsoTime(value) ?? null);
  const escolhido = (controlado === undefined ? internalValue : controlado) ?? undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const resetRef = useFormReset<HTMLInputElement>(() => {
    setInternalValue(readIsoTime(defaultValue) ?? null);
    entry.reset();
  });
  const mergedRef = useMergedRefs(inputRef, resetRef, ref);

  // Cobre todo fechamento, inclusive o feito pelo produto ao mudar `open`.
  useEffect(() => {
    if (wasOpenRef.current && !open && devolverFocoRef.current) {
      triggerRef.current?.focus({ preventScroll: true });
    }
    wasOpenRef.current = open;
    devolverFocoRef.current = true;
  }, [open]);

  // O interno acompanha mesmo controlado: se o consumidor devolver `undefined`, nao ressurge um valor velho.
  function definir(proximo: Time | null) {
    setInternalValue(proximo);
    onValueChange?.(proximo ? toIsoTime(proximo) : null);
  }

  function fechar(devolverFoco = true) {
    devolverFocoRef.current = devolverFoco;
    setOpen(false);
  }

  const entry = useTemporalInput<Time>({
    announce: (time) => formatTime(toIsoTime(time)),
    commit: definir,
    error,
    evaluate: (text) => {
      const parsed = completeTimeInput(text);

      if (!parsed) {
        return { message: 'Hora inválida.', reason: 'invalid' };
      }

      return isTimeAllowed(parsed, horaMinima, horaMaxima)
        ? { value: parsed }
        : { message: 'Hora fora do intervalo permitido.', reason: 'outOfRange' };
    },
    filter: keepDigits,
    format: paraTextoDeHora,
    inputRef,
    isAllowed: (time) => isTimeAllowed(time, horaMinima, horaMaxima),
    mask: formatTimeInput,
    now: () => {
      const current = now(getLocalTimeZone());

      return new Time(current.hour, current.minute);
    },
    onInvalidText,
    parse: (text) => {
      const parsed = parseTimeInput(text);

      return parsed && isTimeAllowed(parsed, horaMinima, horaMaxima) ? parsed : undefined;
    },
    step: (time, direction, _text, cursor) =>
      cursor <= 2
        ? { cursor: 2, value: time.add({ hours: direction }) }
        : { cursor: 5, value: time.add({ minutes: direction }) },
    value: escolhido,
  });

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    entry.handleKeyDown(event);

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
      onClose: () => fechar(Boolean(panelRef.current?.contains(document.activeElement))),
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
    onClose: fechar,
  });

  return (
    <Field aria-describedby={ariaDescribedBy} error={entry.error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <FormValue
            disabled={disabled}
            name={name}
            onFocus={() => inputRef.current?.focus()}
            required={required}
            value={paraTextoDeHora(escolhido)}
          />
          <div
            className={[datePickerStyles.field, datePickerStyles[size], entry.error && datePickerStyles.error, className].filter(Boolean).join(' ')}
            ref={fieldRef}
          >
            <input
              {...props}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              aria-required={required || undefined}
              autoComplete="off"
              className={datePickerStyles.input}
              disabled={disabled}
              id={id}
              inputMode="numeric"
              onBlur={(event) => entry.handleBlur(event, onBlur)}
              onChange={(event) => entry.change(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              ref={mergedRef}
              type="text"
              value={entry.text}
            />
            <button
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label="Abrir seletor de hora"
              className={datePickerStyles.trigger}
              disabled={disabled}
              onClick={() => (open ? fechar() : setOpen(true))}
              ref={triggerRef}
              type="button"
            >
              <IconClock size={15} />
            </button>
          </div>
          <span className={datePickerStyles.visuallyHidden} role="status">
            {entry.announcement}
          </span>
          {open &&
            container &&
            createPortal(
              <FocusScope restoreFocus>
                <div
                  {...overlayProps}
                  aria-label={label ? 'Horas de ' + label : 'Horas'}
                  className={styles.panel}
                  // Camada de cima: o `ariaHideOutside` do Dialog ignora quem a declara.
                  data-react-aria-top-layer="true"
                  ref={panelRef}
                  role="dialog"
                  style={positionProps.style}
                >
                  <TimeSlots
                    autoFocus
                    baseId={providedId ?? idDaLista}
                    max={horaMaxima}
                    min={horaMinima}
                    onChange={(hora) => {
                      definir(hora);
                      entry.reset();
                      fechar();
                    }}
                    step={step}
                    value={escolhido}
                  />
                </div>
              </FocusScope>,
              container,
            )}
        </>
      )}
    </Field>
  );
}
