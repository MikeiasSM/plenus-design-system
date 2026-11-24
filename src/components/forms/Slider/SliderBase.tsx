import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { isDevelopment } from '../../../utils/isDevelopment';
import { numberFormat } from '../../../utils/formatters/intlCache';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import { clamp, constrainThumb, fractionOf, sameValues, snapToStep } from './sliderMath';
import styles from './Slider.module.css';

export type SliderSize = 'sm' | 'md' | 'lg';

/** Marca sob o trilho. Sem `label`, mostra o valor formatado. So mostra: o encaixe e sempre o `step`. */
export interface SliderMark {
  label?: ReactNode;
  value: number;
}

/** O que o `Slider` e o `RangeSlider` tem em comum. As nativas de `<div>` vao a area do trilho, que recebe o `ref`. */
export interface SliderCommonProps
  extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'defaultValue' | 'onChange' | 'role'> {
  disabled?: boolean;
  error?: string;
  /** Opcoes do `Intl.NumberFormat` para o valor ao lado do rotulo, as marcas e o `aria-valuetext`. */
  format?: Intl.NumberFormatOptions;
  hint?: string;
  label?: string;
  /** O passo do PageUp e do PageDown. Sem declarar, dez passos. */
  largeStep?: number;
  locale?: string;
  marks?: readonly (number | SliderMark)[];
  max?: number;
  min?: number;
  size?: SliderSize;
  step?: number;
}

interface SliderBaseProps extends SliderCommonProps {
  defaultValue: readonly number[];
  /** Nomes dos valores no formulario, um por polegar. */
  formNames: readonly (string | undefined)[];
  minDistance: number;
  onValuesChange?: (values: number[]) => void;
  onValuesCommit?: (values: number[]) => void;
  /** Texto do valor ao lado do rotulo, a partir dos valores ja formatados. */
  summary: (texts: readonly string[]) => string;
  /** O que se soma ao nome de cada polegar, como "mínimo" e "máximo". Sem ele, o polegar leva so o nome. */
  thumbSuffixes?: readonly string[];
  values: readonly number[] | undefined;
}

/** O gesto em curso: um polegar, ou a faixa inteira, que guarda onde o ponteiro pegou e onde ela estava. */
type Gesture =
  | { kind: 'thumb'; index: number; offset: number; start: readonly number[]; tie: boolean }
  | { kind: 'band'; from: number; start: readonly number[] };

export function SliderBase({
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  defaultValue,
  disabled = false,
  error,
  format,
  formNames,
  hint,
  id: providedId,
  label,
  largeStep,
  locale = 'pt-BR',
  marks,
  max = 100,
  min = 0,
  minDistance,
  onPointerDown,
  onPointerLeave,
  onPointerMove,
  onValuesChange,
  onValuesCommit,
  ref: refDoConsumidor,
  size = 'md',
  step = 1,
  style,
  summary,
  thumbSuffixes,
  values: controlledValues,
  ...props
}: SliderBaseProps) {
  const suffixId = useId();
  const [internalValues, setInternalValues] = useState<readonly number[]>(defaultValue);
  const controlled = controlledValues !== undefined;
  const raw = controlled ? controlledValues : internalValues;
  // O valor de fora pode vir fora dos extremos: a tela mostra o que caberia, sem avisar quem controla.
  const values = raw.map((value) => clamp(value, min, max));
  const latest = useRef(values);
  latest.current = values;
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const [overBand, setOverBand] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resetRef = useFormReset<HTMLDivElement>(() => {
    if (!controlled) {
      setInternalValues(defaultValue);
    }
  });
  const mergedRef = useMergedRefs(resetRef, refDoConsumidor);
  const formatter = numberFormat(locale, format ?? {});
  const texts = values.map((value) => formatter.format(value));
  const big = largeStep ?? step * 10;
  const range = values.length > 1;
  const name = label ?? ariaLabel;

  useEffect(() => {
    if (!name && !ariaLabelledby && isDevelopment()) {
      console.warn('Slider: o controle precisa de nome; passe `label`, `aria-label` ou `aria-labelledby`.');
    }
  }, [name, ariaLabelledby]);

  function update(next: number[]) {
    if (sameValues(next, latest.current)) {
      return false;
    }

    latest.current = next;

    if (!controlled) {
      setInternalValues(next);
    }

    onValuesChange?.(next);
    return true;
  }

  function moveThumb(index: number, value: number) {
    const current = latest.current;
    const snapped = snapToStep(value, min, max, step);
    const next = [...current];
    next[index] = constrainThumb(current, index, snapped, min, max, minDistance);
    return update(next);
  }

  function valueAt(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();

    if (!rect || rect.width <= 0) {
      return min;
    }

    return min + clamp((clientX - rect.left) / rect.width, 0, 1) * (max - min);
  }

  function startGesture(next: Gesture | null) {
    gestureRef.current = next;
    setGesture(next);
  }

  function insideBand(target: EventTarget, value: number) {
    const current = latest.current;
    return range && !isThumb(target) && value > current[0] && value < current[1];
  }

  function isThumb(target: EventTarget) {
    return target instanceof Element && target.closest('[data-slider-thumb]') !== null;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    onPointerDown?.(event);

    if (disabled || event.defaultPrevented || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    const value = valueAt(event.clientX);
    const current = latest.current;
    // Sem o padrao do navegador, o arrasto nao seleciona texto; o foco vai a mao, ao polegar que se move.
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    if (insideBand(event.target, value)) {
      startGesture({ kind: 'band', from: value, start: current });
      return;
    }

    const hit = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-slider-thumb]') : null;
    const tie = range && current[0] === current[1];
    let index = hit ? Number(hit.dataset.index) : 0;

    if (!hit && range) {
      index = tie ? (value < current[0] ? 0 : 1) : Math.abs(value - current[0]) <= Math.abs(value - current[1]) ? 0 : 1;
    }

    thumbRefs.current[index]?.focus({ preventScroll: true });
    // Quem pega o polegar fora do centro nao o ve saltar: a distancia ate o centro acompanha o arrasto.
    const offset = hit ? current[index] - value : 0;
    startGesture({ kind: 'thumb', index, offset, start: current, tie: Boolean(hit) && tie });

    if (!hit) {
      moveThumb(index, value);
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    onPointerMove?.(event);
    const active = gestureRef.current;

    if (!active) {
      if (!disabled) {
        setOverBand(insideBand(event.target, valueAt(event.clientX)));
      }
      return;
    }

    const value = valueAt(event.clientX);

    if (active.kind === 'band') {
      const width = active.start[1] - active.start[0];
      const low = clamp(snapToStep(active.start[0] + value - active.from, min, max, step), min, max - width);
      update([low, low + width]);
      return;
    }

    let index = active.index;

    // Os dois no mesmo ponto: o primeiro movimento decide qual sai, para nenhum ficar preso atras do outro.
    if (active.tie) {
      const target = value + active.offset;

      if (target === active.start[index]) {
        return;
      }

      index = target < active.start[0] ? 0 : 1;
      const next: Gesture = { ...active, index, tie: false };
      startGesture(next);
      thumbRefs.current[index]?.focus({ preventScroll: true });
    }

    moveThumb(index, value + active.offset);
  }

  function endGesture() {
    const active = gestureRef.current;

    if (!active) {
      return;
    }

    startGesture(null);

    if (!sameValues(active.start, latest.current)) {
      onValuesCommit?.([...latest.current]);
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      return;
    }

    const current = latest.current[index];
    const moves: Record<string, number> = {
      ArrowRight: current + step,
      ArrowUp: current + step,
      ArrowLeft: current - step,
      ArrowDown: current - step,
      PageUp: current + big,
      PageDown: current - big,
      Home: min,
      End: max,
    };

    if (!(event.key in moves)) {
      return;
    }

    event.preventDefault();
    const target = moves[event.key];
    // Home e End vao ao extremo mesmo quando ele nao cai no passo.
    const snapped = event.key === 'Home' || event.key === 'End' ? target : snapToStep(target, min, max, step);
    const next = [...latest.current];
    next[index] = constrainThumb(latest.current, index, snapped, min, max, minDistance);

    if (update(next)) {
      onValuesCommit?.(next);
    }
  }

  const fractions = values.map((value) => fractionOf(value, min, max));
  const fillStart = range ? fractions[0] : 0;
  const fillEnd = range ? fractions[1] : fractions[0];
  const marksList = (marks ?? []).map((mark) => (typeof mark === 'number' ? { value: mark } : mark));

  return (
    <Field
      aria-describedby={ariaDescribedBy}
      error={error}
      hint={hint}
      id={providedId}
      label={label}
      labelAddon={
        // O valor ja chega ao leitor de tela pelo `aria-valuetext` de cada polegar.
        <span aria-hidden="true" className={styles.value}>
          {summary(texts)}
        </span>
      }
    >
      {({ id, describedBy, invalid }) => (
        <>
          {formNames.map((formName, index) => (
            <FormValue
              disabled={disabled}
              key={index}
              name={formName}
              onFocus={() => thumbRefs.current[index]?.focus()}
              required={false}
              value={String(values[index])}
            />
          ))}
          <div
            {...props}
            aria-label={range ? name : undefined}
            aria-labelledby={range && !name ? ariaLabelledby : undefined}
            className={[styles.slider, styles[size], className].filter(Boolean).join(' ')}
            data-band-hover={(overBand && !gesture) || undefined}
            data-disabled={disabled || undefined}
            data-grabbing={gesture?.kind === 'band' || undefined}
            data-invalid={invalid || undefined}
            onLostPointerCapture={endGesture}
            onPointerCancel={endGesture}
            onPointerDown={handlePointerDown}
            onPointerLeave={(event) => {
              onPointerLeave?.(event);
              setOverBand(false);
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={endGesture}
            ref={mergedRef}
            role={range ? 'group' : undefined}
            style={style}
          >
            <div className={styles.track} ref={trackRef}>
              <div
                className={styles.fill}
                style={{ left: `${fillStart * 100}%`, width: `${(fillEnd - fillStart) * 100}%` }}
              />
            </div>
            {values.map((value, index) => {
              const suffix = thumbSuffixes?.[index];
              const dragging = gesture?.kind === 'band' || (gesture?.kind === 'thumb' && gesture.index === index);

              return (
                <div
                  aria-describedby={describedBy}
                  aria-disabled={disabled || undefined}
                  aria-invalid={invalid || undefined}
                  aria-label={name ? (suffix ? `${name}, ${suffix}` : name) : undefined}
                  aria-labelledby={!name && ariaLabelledby ? (suffix ? `${ariaLabelledby} ${suffixId}-${index}` : ariaLabelledby) : undefined}
                  aria-orientation="horizontal"
                  aria-valuemax={range && index === 0 ? values[1] - minDistance : max}
                  aria-valuemin={range && index === 1 ? values[0] + minDistance : min}
                  aria-valuenow={value}
                  aria-valuetext={texts[index]}
                  className={styles.thumb}
                  data-dragging={dragging || undefined}
                  data-index={index}
                  data-slider-thumb=""
                  id={index === 0 ? id : undefined}
                  key={index}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  ref={(node) => {
                    thumbRefs.current[index] = node;
                  }}
                  role="slider"
                  style={{ '--pl-slider-position': fractions[index] } as CSSProperties}
                  tabIndex={disabled ? undefined : 0}
                >
                  {!name && ariaLabelledby && suffix && (
                    <span className={styles.hiddenText} id={`${suffixId}-${index}`}>
                      {suffix}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {marksList.length > 0 && (
            <div aria-hidden="true" className={[styles.marks, styles[size]].join(' ')}>
              {marksList.map((mark) => {
                const fraction = fractionOf(mark.value, min, max);

                return (
                  <span
                    className={styles.mark}
                    data-edge={fraction === 0 ? 'start' : fraction === 1 ? 'end' : undefined}
                    key={mark.value}
                    style={{ left: `${fraction * 100}%` }}
                  >
                    {mark.label ?? formatter.format(mark.value)}
                  </span>
                );
              })}
            </div>
          )}
        </>
      )}
    </Field>
  );
}
