import { useId, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay, useOverlayPosition } from '@react-aria/overlays';
import { Time } from '@internationalized/date';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { formatarEntradaHora, lerEntradaHora } from '../../../utils/formatters';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import { TimeSlots, isTimeAllowed, paraTextoDeHora } from './TimeSlots';
import styles from './TimePicker.module.css';
import { IconClock } from '../../icons';

export type TimePickerSize = 'sm' | 'md';

/**
 * As propriedades nativas vao ao campo de texto, que e o controle; o `className` soma a caixa do campo, que e o que
 * se posiciona e dimensiona.
 */
export interface TimePickerProps
  extends Omit<
    ComponentPropsWithRef<'input'>,
    'defaultValue' | 'max' | 'min' | 'name' | 'onChange' | 'size' | 'type' | 'value' | 'step'
  > {
  defaultValue?: Time;
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
  max?: Time;
  min?: Time;
  step?: number;
  /** Sem hora inteira e permitida, o valor e `null`, que mantem o campo controlado e vazio. */
  onValueChange?: (value: Time | null) => void;
  placeholder?: string;
  required?: boolean;
  size?: TimePickerSize;
  /**
   * `null` e "controlado e vazio": devolver a propriedade a `undefined` nao
   * limpa o campo, porque ali ele volta a ser nao controlado.
   */
  value?: Time | null;
}

export function TimePicker({
  'aria-describedby': ariaDescribedBy,
  className,
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
  onValueChange,
  onBlur,
  onKeyDown,
  placeholder = 'hh:mm',
  required = false,
  size = 'md',
  ref,
  value,
  ...props
}: TimePickerProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Sem isto, dois seletores de hora na mesma pagina dividiam os ids das opcoes.
  const idDaLista = `hora-${useId()}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? null);
  const [texto, setTexto] = useState('');
  const [digitando, setDigitando] = useState(false);
  const escolhido = (value === undefined ? internalValue : value) ?? undefined;
  const exibido = digitando ? texto : paraTextoDeHora(escolhido);
  const inputRef = useRef<HTMLInputElement>(null);
  const resetRef = useFormReset<HTMLInputElement>(() => {
    setInternalValue(defaultValue ?? null);
    setDigitando(false);
  });
  const mergedRef = useMergedRefs(inputRef, resetRef, ref);

  // O interno acompanha mesmo controlado: se o consumidor devolver `undefined`, nao ressurge um valor velho.
  function definir(proximo: Time | null) {
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
    const mascarado = formatarEntradaHora(entrada);

    setDigitando(true);
    setTexto(mascarado);

    // O valor acompanha o texto: `18:4` ou `25:99` na tela nao convivem com a hora anterior.
    const lido = lerEntradaHora(mascarado);

    definir(lido && isTimeAllowed(lido, min, max) ? lido : null);
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
            value={paraTextoDeHora(escolhido)}
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
                  autoFocus
                  baseId={providedId ?? idDaLista}
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
