import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';
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
import { usePortalContainer } from '../../overlays/Portal/PortalContext';
import { useOpenState } from '../../../hooks/useOpenState';
import { completeDateTimeInput, formatDateTimeInput, keepInputChars, parseDateTimeInput } from '../../../utils/formatters';
import { useCampoDigitado } from '../../../hooks/useCampoDigitado';
import { Button } from '../../actions/Button';
import { Calendar } from '../DatePicker/Calendar';
import { readIsoDate, readIsoDateTime, toIsoDateTime } from '../DatePicker/iso';
import { TimeSlots } from '../TimePicker/TimeSlots';
import { isUnavailable, type CalendarLimits } from '../../../hooks/useCalendar/calendar';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import datePickerStyles from '../DatePicker/DatePicker.module.css';
import styles from './DateTimePicker.module.css';
import { IconCalendar } from '../../icons';

export type DateTimePickerSize = 'sm' | 'md' | 'lg';

/**
 * As propriedades nativas vao ao campo de texto, que e o controle; o `className` soma a caixa do campo, que e o que
 * se posiciona e dimensiona.
 */
export interface DateTimePickerProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'defaultValue' | 'max' | 'min' | 'name' | 'onChange' | 'onInvalid' | 'size' | 'type' | 'value' | 'step'
  > {
  /** Data e hora em ISO, `2026-03-09T18:40`, como no `FormData`: a API nao expoe tipo de biblioteca de terceiros. */
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  isDateUnavailable?: (date: string) => boolean;
  label?: string;
  /**
   * Nome do campo no formulario. Com ele, um input oculto carrega o valor para
   * o `FormData`: sem controle nativo por baixo, o envio ignorava o campo.
   */
  name?: string;
  locale?: string;
  /** Limites de data, em `2026-03-09`. */
  max?: string;
  min?: string;
  step?: number;
  /** Avisa o texto digitado que não é uma data e hora válidas, ao confirmar ou sair do campo. */
  onInvalid?: (texto: string) => void;
  /** Sem data e hora inteiras e permitidas, o valor e `null`, que mantem o campo controlado e vazio. */
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
  size?: DateTimePickerSize;
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
  defaultOpen,
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
  onInvalid,
  onValueChange,
  onBlur,
  onOpenChange,
  onKeyDown,
  open: controlledOpen,
  portalContainer,
  placeholder = 'dd/mm/aaaa hh:mm',
  required = false,
  size = 'md',
  ref,
  value,
  ...props
}: DateTimePickerProps) {
  const container = usePortalContainer(portalContainer);
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Fixo, o id fazia dois seletores dividirem os ids das opcoes de hora.
  const idDaLista = `datetime-hora-${useId()}`;
  const [open, setOpen] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  const wasOpenRef = useRef(open);
  const devolverFocoRef = useRef(true);
  const limites: CalendarLimits = {
    isDateUnavailable: isDateUnavailable && ((data) => isDateUnavailable(data.toString())),
    max: readIsoDate(max),
    min: readIsoDate(min),
  };
  const [internalValue, setInternalValue] = useState<CalendarDateTime | null>(() => readIsoDateTime(defaultValue) ?? null);
  const controlado = value === undefined ? undefined : (readIsoDateTime(value) ?? null);
  const escolhido = (controlado === undefined ? internalValue : controlado) ?? undefined;
  const [rascunho, setRascunho] = useState(escolhido);
  const [versaoDoCalendario, setVersaoDoCalendario] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetRef = useFormReset<HTMLInputElement>(() => {
    setInternalValue(readIsoDateTime(defaultValue) ?? null);
    campo.limpar();
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

  useEffect(() => {
    if (open) {
      setRascunho(escolhido);
    }
  }, [open]);

  // O interno acompanha mesmo controlado: se o consumidor devolver `undefined`, nao ressurge um valor velho.
  function definir(proximo: CalendarDateTime | null) {
    setInternalValue(proximo);
    onValueChange?.(proximo ? toIsoDateTime(proximo) : null);
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
    devolverFocoRef.current = devolverFoco;
    setOpen(false);
  }

  const campo = useCampoDigitado<CalendarDateTime>({
    agora: () => toCalendarDateTime(now(getLocalTimeZone())).set({ second: 0, millisecond: 0 }),
    atual: escolhido,
    avaliar: (digitado) => {
      const lido = completeDateTimeInput(digitado, today(getLocalTimeZone()));

      if (lido.invalid) {
        return { mensagem: lido.invalid === 'date' ? 'Data inválida.' : 'Hora inválida.' };
      }

      return isUnavailable(toCalendarDate(lido.value), limites)
        ? { mensagem: 'Data fora do intervalo permitido.' }
        : { valor: lido.value };
    },
    deslocar: (valor, passo, digitado, cursor) => {
      const espaco = digitado.indexOf(' ');
      const doisPontos = digitado.indexOf(':');

      if (espaco < 0 || cursor <= espaco) {
        return { cursor: 10, valor: valor.add({ days: passo }) };
      }

      return doisPontos < 0 || cursor <= doisPontos
        ? { cursor: 13, valor: valor.add({ hours: passo }) }
        : { cursor: 16, valor: valor.add({ minutes: passo }) };
    },
    erro: error,
    filtrar: (entrada) => keepInputChars(entrada, '/ :'),
    gravar: definir,
    inputRef,
    ler: (digitado) => {
      const lido = parseDateTimeInput(digitado);

      return lido && !isUnavailable(toCalendarDate(lido), limites) ? lido : undefined;
    },
    mascarar: formatDateTimeInput,
    onInvalid,
    paraTexto,
    permitido: (valor) => !isUnavailable(toCalendarDate(valor), limites),
    separadores: '/ :',
  });

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    campo.tratarTecla(event);

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
    <Field aria-describedby={ariaDescribedBy} error={campo.erro} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => (
        <>
          <FormValue
            disabled={disabled}
            name={name}
            onFocus={() => inputRef.current?.focus()}
            required={required}
            value={escolhido ? toIsoDateTime(escolhido) : ''}
          />
          <div
            className={[datePickerStyles.field, datePickerStyles[size], campo.erro && datePickerStyles.error, className].filter(Boolean).join(' ')}
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
              onBlur={(event) => campo.sair(event, onBlur)}
              onChange={(event) => campo.mudar(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              ref={mergedRef}
              type="text"
              value={campo.exibido}
            />
            <button
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-label="Abrir calendário"
              className={datePickerStyles.trigger}
              disabled={disabled}
              onClick={() => (open ? fechar() : setOpen(true))}
              ref={triggerRef}
              type="button"
            >
              <IconCalendar size={15} />
            </button>
          </div>
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
                  style={positionProps.style}
                >
                  <div className={styles.columns}>
                    <Calendar
                      autoFocus
                      key={versaoDoCalendario}
                      isDateUnavailable={limites.isDateUnavailable}
                      locale={locale}
                      max={limites.max}
                      min={limites.min}
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
                          campo.limpar();
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
