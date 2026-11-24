import { useEffect, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { blockRepeatedPress } from '../../../utils/press/press';
import { usePortalContainer } from '../../overlays/Portal/PortalContext';
import { useOpenState } from '../../../hooks/useOpenState';
import { useClickShieldOnClose } from '../../../hooks/useOverlayClickGuard';
import {
  closeDateInput,
  closeMonthInput,
  closeYearInput,
  completeDateInput,
  completeMonthInput,
  completeYearInput,
  formatDate,
  formatDateInput,
  formatMonthInput,
  formatYearInput,
  keepDateChars,
  keepMonthChars,
  keepYearChars,
  parseDateInput,
  parseMonthInput,
  parseYearInput,
} from '../../../utils/formatters';
import { useTemporalInput } from '../../../hooks/useTemporalInput';
import { Button } from '../../actions/Button';
import {
  isUnavailable,
  shiftPeriod,
  startOfPeriod,
  type CalendarGranularity,
  type CalendarLimits,
} from '../../../hooks/useCalendar/calendar';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import { Calendar } from './Calendar';
import { readIsoDate } from './iso';
import styles from './DatePicker.module.css';
import { IconCalendar } from '../../icons';

export type DatePickerSize = 'sm' | 'md' | 'lg';

/** O que se escolhe: o dia, o mes ou o ano. */
export type DatePickerGranularity = CalendarGranularity;

/** Mascara, leitura e texto de cada granularidade. */
const ENTRADAS = {
  day: {
    close: closeDateInput,
    complete: completeDateInput,
    filter: keepDateChars,
    mask: formatDateInput,
    parse: parseDateInput,
    placeholder: 'dd/mm/aaaa',
    text: (date: CalendarDate) => [String(date.day).padStart(2, '0'), String(date.month).padStart(2, '0'), date.year].join('/'),
  },
  month: {
    close: closeMonthInput,
    complete: completeMonthInput,
    filter: keepMonthChars,
    mask: formatMonthInput,
    parse: parseMonthInput,
    placeholder: 'mm/aaaa',
    text: (date: CalendarDate) => [String(date.month).padStart(2, '0'), date.year].join('/'),
  },
  year: {
    close: closeYearInput,
    complete: completeYearInput,
    filter: keepYearChars,
    mask: formatYearInput,
    parse: parseYearInput,
    placeholder: 'aaaa',
    text: (date: CalendarDate) => String(date.year),
  },
} satisfies Record<CalendarGranularity, unknown>;

const HOJE = { day: 'Hoje', month: 'Este mês', year: 'Este ano' } satisfies Record<CalendarGranularity, string>;

/**
 * As propriedades nativas vao ao campo de texto, que e o controle; o `className` soma a caixa do campo, que e o que
 * se posiciona e dimensiona.
 */
export interface DatePickerProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'defaultValue' | 'max' | 'min' | 'name' | 'onChange' | 'size' | 'type' | 'value'
  > {
  /** Data em ISO, `2026-03-09`, como no `FormData`: a API nao expoe tipo de biblioteca de terceiros. */
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  /**
   * `month` e `year` escolhem o mes ou o ano: a grade mostra doze meses ou doze anos, a mascara vira `mm/aaaa` ou
   * `aaaa`, e o valor e o primeiro dia do periodo, `2026-06-01` ou `2026-01-01`.
   */
  granularity?: DatePickerGranularity;
  hint?: string;
  id?: string;
  /** Na granularidade de mes ou de ano, recebe o primeiro dia do periodo. */
  isDateUnavailable?: (date: string) => boolean;
  label?: string;
  /**
   * Nome do campo no formulario. Com ele, um input oculto carrega o valor para
   * o `FormData`: sem controle nativo por baixo, o envio ignorava o campo.
   */
  name?: string;
  locale?: string;
  max?: string;
  min?: string;
  /** Avisa, ao confirmar ou sair do campo, o texto que não é data válida e por quê. */
  onInvalidText?: (text: string, reason: 'invalid' | 'outOfRange') => void;
  /** Sem data inteira e permitida, o valor e `null`, que mantem o campo controlado e vazio. */
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
  size?: DatePickerSize;
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

export function DatePicker({
  'aria-describedby': ariaDescribedBy,
  className,
  defaultOpen,
  defaultValue,
  name,
  disabled = false,
  error,
  granularity = 'day',
  hint,
  id: providedId,
  isDateUnavailable,
  label,
  locale = 'pt-BR',
  max,
  min,
  onInvalidText,
  onValueChange,
  onBlur,
  onOpenChange,
  onKeyDown,
  onPaste,
  open: controlledOpen,
  portalContainer,
  placeholder,
  required = false,
  size = 'md',
  ref,
  value,
  ...props
}: DatePickerProps) {
  const container = usePortalContainer(portalContainer);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  useClickShieldOnClose(open);
  const wasOpenRef = useRef(open);
  const devolverFocoRef = useRef(true);
  const limites: CalendarLimits = {
    isDateUnavailable: isDateUnavailable && ((data) => isDateUnavailable(data.toString())),
    max: readIsoDate(max),
    min: readIsoDate(min),
  };
  const entrada = ENTRADAS[granularity];
  const recusada = (data: CalendarDate) => isUnavailable(data, limites, granularity);
  // Outro dia do periodo vale como o primeiro: `2026-06-15`, em meses, e junho de 2026.
  const ler = (texto?: string | null) => {
    const data = readIsoDate(texto);

    return data && startOfPeriod(data, granularity);
  };
  const agora = () => startOfPeriod(today(getLocalTimeZone()), granularity);
  const [internalValue, setInternalValue] = useState<CalendarDate | null>(() => ler(defaultValue) ?? null);
  const controlado = value === undefined ? undefined : (ler(value) ?? null);
  const escolhido = (controlado === undefined ? internalValue : controlado) ?? undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const resetRef = useFormReset<HTMLInputElement>(() => {
    setInternalValue(ler(defaultValue) ?? null);
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
  const [rascunho, setRascunho] = useState(escolhido);
  const [versaoDoCalendario, setVersaoDoCalendario] = useState(0);

  useEffect(() => {
    if (open) {
      setRascunho(escolhido);
    }
  }, [open]);

  // O interno acompanha mesmo controlado: se o consumidor devolver `undefined`, nao ressurge um valor velho.
  function definir(proximo: CalendarDate | null) {
    setInternalValue(proximo);
    onValueChange?.(proximo?.toString() ?? null);
  }

  function fechar(devolverFoco = true) {
    devolverFocoRef.current = devolverFoco;
    setOpen(false);
  }

  const textOf = (date?: CalendarDate) => (date ? entrada.text(date) : '');
  const entry = useTemporalInput<CalendarDate>({
    announce: (date) => anunciar(date, granularity, locale),
    close: entrada.close,
    commit: definir,
    error,
    evaluate: (text) => {
      const parsed = entrada.complete(text, today(getLocalTimeZone()));

      if (!parsed) {
        return { message: 'Data inválida.', reason: 'invalid' };
      }

      return recusada(parsed) ? { message: 'Data fora do intervalo permitido.', reason: 'outOfRange' } : { value: parsed };
    },
    filter: entrada.filter,
    format: textOf,
    inputRef,
    isAllowed: (date) => !recusada(date),
    mask: entrada.mask,
    now: agora,
    onInvalidText,
    parse: (text) => {
      const parsed = entrada.parse(text);

      return parsed && !recusada(parsed) ? parsed : undefined;
    },
    step: (date, direction) => {
      const proximo = shiftPeriod(date, granularity, direction);

      return { cursor: entrada.text(proximo).length, value: proximo };
    },
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
            value={escolhido?.toString() ?? ''}
          />
          <div
            className={[styles.field, styles[size], entry.error && styles.error, className].filter(Boolean).join(' ')}
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
              onBlur={(event) => entry.handleBlur(event, onBlur)}
              onChange={(event) => entry.change(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(event) => entry.handlePaste(event, onPaste)}
              placeholder={placeholder ?? entrada.placeholder}
              ref={mergedRef}
              type="text"
              value={entry.text}
            />
            <button
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label="Abrir calendário"
              className={styles.trigger}
              disabled={disabled}
              onClick={() => (open ? fechar() : setOpen(true))}
              onKeyDown={blockRepeatedPress}
              ref={triggerRef}
              type="button"
            >
              <IconCalendar size={15} />
            </button>
          </div>
          <span className={styles.visuallyHidden} role="status">
            {entry.announcement}
          </span>
          {open &&
            container &&
            createPortal(
              <FocusScope restoreFocus>
                <div
                  {...overlayProps}
                  aria-label={label ? 'Calendário de ' + label : 'Calendário'}
                  className={styles.panel}
                  // Camada de cima: o `ariaHideOutside` do Dialog ignora quem a declara.
                  data-react-aria-top-layer="true"
                  ref={panelRef}
                  role="dialog"
                  style={{ ...positionProps.style, zIndex: 'var(--pl-z-popover)' }}
                >
                  <Calendar
                    autoFocus
                    granularity={granularity}
                    key={versaoDoCalendario}
                    isDateUnavailable={limites.isDateUnavailable}
                    locale={locale}
                    max={limites.max}
                    min={limites.min}
                    onSelect={setRascunho}
                    value={rascunho}
                  />
                  <div className={styles.footer}>
                    <Button
                      onClick={() => {
                        // Remontada, a grade volta ao mes de hoje mesmo que o rascunho ja fosse hoje.
                        setRascunho(agora());
                        setVersaoDoCalendario((versao) => versao + 1);
                      }}
                      size="sm"
                      variant="ghost"
                      type="button"
                    >
                      {HOJE[granularity]}
                    </Button>
                    <div className={styles.actions}>
                      <Button onClick={() => fechar()} size="sm" variant="secondary" type="button">
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => {
                          definir(rascunho ?? null);
                          entry.reset();
                          fechar();
                        }}
                        size="sm"
                        type="button"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              </FocusScope>,
              container,
            )}
        </>
      )}
    </Field>
  );
}

/** A data nova se anuncia por extenso, no tamanho do periodo: "22 de novembro de 2026", "junho de 2026" ou "2026". */
function anunciar(date: CalendarDate, granularity: CalendarGranularity, locale: string) {
  if (granularity === 'day') {
    return formatDate(date.toString(), { format: 'long', locale });
  }

  return granularity === 'month'
    ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date.toDate(getLocalTimeZone()))
    : String(date.year);
}
