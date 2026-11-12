import { useEffect, useRef, useState, type ComponentPropsWithRef } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { getLocalTimeZone, type CalendarDate } from '@internationalized/date';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { withoutRepeat } from '../../../utils/press/press';
import { useOpenState } from '../../../hooks/useOpenState';
import { useClickShieldOnClose } from '../../../hooks/useOverlayClickGuard';
import { isUnavailable, type CalendarLimits } from '../../../hooks/useCalendar/calendar';
import { Button } from '../../actions/Button';
import { IconCalendar } from '../../icons';
import { usePortalContainer } from '../../overlays/Portal/PortalContext';
import { Calendar } from '../DatePicker/Calendar';
import { readIsoDate } from '../DatePicker/iso';
import datePickerStyles from '../DatePicker/DatePicker.module.css';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import selectStyles from '../Select/Select.module.css';
import styles from './DatePickerRange.module.css';

export type DatePickerRangeSize = 'sm' | 'md' | 'lg';

/** Intervalo em ISO, `2026-03-09`, com as duas pontas incluídas. */
export interface DateRange {
  end: string;
  start: string;
}

/** Atalho do painel. `range` é chamado ao escolher, para "Hoje" valer o dia da escolha e não o da montagem. */
export interface DateRangeShortcut {
  label: string;
  range: () => DateRange;
}

interface Selection {
  end?: CalendarDate;
  start?: CalendarDate;
}

/** As propriedades nativas vao ao gatilho, que e o controle; o `className` soma ao do sistema. */
export interface DatePickerRangeProps
  extends Omit<ComponentPropsWithRef<'button'>, 'children' | 'defaultValue' | 'name' | 'onChange' | 'type' | 'value'> {
  defaultOpen?: boolean;
  defaultValue?: DateRange;
  /** Nome do campo do fim no formulário. Com ele, um input oculto carrega o valor para o `FormData`. */
  endName?: string;
  error?: string;
  hint?: string;
  isDateUnavailable?: (date: string) => boolean;
  label?: string;
  locale?: string;
  max?: string;
  min?: string;
  onOpenChange?: (open: boolean) => void;
  /** Sem intervalo, o valor é `null`, que mantém o campo controlado e vazio. */
  onValueChange?: (value: DateRange | null) => void;
  open?: boolean;
  placeholder?: string;
  /** Elemento que recebe o painel. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
  required?: boolean;
  /** Atalhos do painel, definidos pelo produto. Sem a propriedade não há atalho; `defaultDateRangeShortcuts` é uma lista pronta. */
  shortcuts?: readonly DateRangeShortcut[];
  size?: DatePickerRangeSize;
  /** Nome do campo do início no formulário. */
  startName?: string;
  /** `null` é "controlado e vazio": devolver a propriedade a `undefined` não limpa o campo. */
  value?: DateRange | null;
}

function readRange(range: DateRange | null | undefined): Selection {
  return { start: readIsoDate(range?.start), end: readIsoDate(range?.end) };
}

export function DatePickerRange({
  'aria-describedby': ariaDescribedBy,
  className,
  defaultOpen,
  defaultValue,
  disabled = false,
  endName,
  error,
  hint,
  id: providedId,
  isDateUnavailable,
  label,
  locale = 'pt-BR',
  max,
  min,
  onClick,
  onKeyDown,
  onOpenChange,
  onValueChange,
  open: controlledOpen,
  placeholder = 'Selecione o período',
  portalContainer,
  ref,
  required = false,
  shortcuts = [],
  size = 'md',
  startName,
  value,
  ...props
}: DatePickerRangeProps) {
  const container = usePortalContainer(portalContainer);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  useClickShieldOnClose(open);
  const [internalValue, setInternalValue] = useState(() => readRange(defaultValue));
  const resetRef = useFormReset<HTMLButtonElement>(() => setInternalValue(readRange(defaultValue)));
  const mergedRef = useMergedRefs(triggerRef, resetRef, ref);
  const chosen = value === undefined ? internalValue : readRange(value);
  // O rascunho vale enquanto o painel está aberto: só `Aplicar` o torna o valor do campo.
  const [draft, setDraft] = useState<Selection | null>(null);
  const shown = draft ?? chosen;
  const limits: CalendarLimits = {
    isDateUnavailable: isDateUnavailable && ((date) => isDateUnavailable(date.toString())),
    max: readIsoDate(max),
    min: readIsoDate(min),
  };
  const dayFormat = new Intl.DateTimeFormat(locale);
  const formatDay = (day: CalendarDate) => dayFormat.format(day.toDate(getLocalTimeZone()));
  const formatRange = ({ start, end }: Selection) => (start && end ? `${formatDay(start)} – ${formatDay(end)}` : undefined);

  useEffect(() => {
    if (!open) {
      setDraft(null);
    }
  }, [open]);

  function selectDay(day: CalendarDate) {
    const { start, end } = shown;

    if (!start || end) {
      setDraft({ start: day });
    } else {
      setDraft(day.compare(start) < 0 ? { start: day, end: start } : { start, end: day });
    }
  }

  function apply() {
    const { start, end } = shown;

    setInternalValue({ start, end });
    onValueChange?.(start && end ? { start: start.toString(), end: end.toString() } : null);
    setOpen(false);
  }

  const { overlayProps } = useOverlay(
    {
      isOpen: open,
      onClose: () => setOpen(false),
      isDismissable: true,
      shouldCloseOnBlur: false,
      // O gatilho nao conta como "fora": o clique dele alterna, e o painel nao pode fechar e reabrir.
      shouldCloseOnInteractOutside: (element) => !triggerRef.current?.contains(element),
    },
    panelRef,
  );
  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: triggerRef,
    overlayRef: panelRef,
    placement: 'bottom start',
    offset: 6,
    containerPadding: 8,
    isOpen: open,
    onClose: () => setOpen(false),
  });

  return (
    <Field aria-describedby={ariaDescribedBy} error={error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <FormValue
            disabled={disabled}
            name={startName}
            onFocus={() => triggerRef.current?.focus()}
            required={required}
            value={chosen.start?.toString() ?? ''}
          />
          <FormValue
            disabled={disabled}
            name={endName}
            onFocus={() => triggerRef.current?.focus()}
            required={required}
            value={chosen.end?.toString() ?? ''}
          />
          <button
            {...props}
            aria-describedby={describedBy}
            aria-expanded={open}
            aria-haspopup="dialog"
            role="combobox"
            aria-invalid={invalid || undefined}
            aria-required={required || undefined}
            className={[selectStyles.trigger, selectStyles[size], error && selectStyles.error, className]
              .filter(Boolean)
              .join(' ')}
            disabled={disabled}
            id={id}
            onClick={(event) => {
              onClick?.(event);
              setOpen(!open);
            }}
            onKeyDown={withoutRepeat(onKeyDown)}
            ref={mergedRef}
            type="button"
          >
            <span className={formatRange(chosen) ? selectStyles.value : selectStyles.placeholder}>
              {formatRange(chosen) ?? placeholder}
            </span>
            <IconCalendar className={selectStyles.chevron} size={15} />
          </button>
          {open &&
            container &&
            createPortal(
              <FocusScope restoreFocus>
                <div
                  {...overlayProps}
                  aria-label={label ? 'Período de ' + label : 'Período'}
                  className={[datePickerStyles.panel, styles.panel].join(' ')}
                  // Camada de cima: o `ariaHideOutside` do Dialog ignora quem a declara.
                  data-react-aria-top-layer="true"
                  ref={panelRef}
                  role="dialog"
                  style={positionProps.style}
                >
                  {shortcuts.length > 0 && (
                    <div className={styles.shortcuts}>
                      {shortcuts.map((shortcut) => {
                        const range = shortcut.range();
                        const start = readIsoDate(range.start);
                        const end = readIsoDate(range.end);
                        const unavailable = !start || !end || isUnavailable(start, limits) || isUnavailable(end, limits);
                        const active = Boolean(start && end && shown.start?.compare(start) === 0 && shown.end?.compare(end) === 0);

                        return (
                          <Button
                            aria-pressed={active}
                            className={[styles.shortcut, active && styles.shortcutActive].filter(Boolean).join(' ')}
                            disabled={unavailable}
                            key={shortcut.label}
                            onClick={() => setDraft({ start, end })}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {shortcut.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                  <div className={styles.body}>
                    <p aria-live="polite" className={styles.summary}>
                      {formatRange(shown) ??
                        (shown.start ? `${formatDay(shown.start)} – escolha o fim` : 'Escolha o início')}
                    </p>
                    <Calendar
                      autoFocus
                      isDateUnavailable={limits.isDateUnavailable}
                      locale={locale}
                      max={limits.max}
                      min={limits.min}
                      onSelect={selectDay}
                      rangeEnd={shown.end}
                      value={shown.start}
                    />
                    <div className={datePickerStyles.footer}>
                      <Button onClick={() => setDraft({})} size="sm" type="button" variant="ghost">
                        Limpar
                      </Button>
                      <div className={datePickerStyles.actions}>
                        <Button onClick={() => setOpen(false)} size="sm" type="button" variant="secondary">
                          Cancelar
                        </Button>
                        <Button disabled={Boolean(shown.start && !shown.end)} onClick={apply} size="sm" type="button">
                          Aplicar
                        </Button>
                      </div>
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
