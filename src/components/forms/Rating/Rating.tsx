import {
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useAvisoDeGrupoSemNome } from '../../../hooks/useAvisoDeGrupoSemNome';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { formatNumber } from '../../../utils/formatters/formatNumber';
import { isDevelopment } from '../../../utils/isDevelopment';
import fieldStyles from '../Field/Field.module.css';
import { GroupLegend } from '../RadioGroup/GroupLegend';
import styles from './Rating.module.css';

/** Estrela de 16, 24 ou 32px. Na entrada, o alvo de cada estrela tem 24, 28 ou 36px. */
export type RatingSize = 'sm' | 'md' | 'lg';

/** Passo da nota na entrada: inteira ou meia estrela. */
export type RatingStep = 1 | 0.5;

export interface RatingLabels {
  /** Texto do botao que limpa a nota, com `clearable`. */
  clear: string;
  /** Texto ao lado das estrelas na entrada sem nota. */
  noValue: string;
  /** Texto da exibicao sem nota. */
  noRatings: string;
  /** Nome de cada estrela na entrada, antes do nome da nota: "3 estrelas", "3,5 estrelas". */
  item: (value: number, formatted: string) => string;
  /** Valor escrito ao lado na entrada: "4 de 5". */
  valueText: (formatted: string, max: number) => string;
  /** Nome da exibicao: "4,5 de 5 estrelas, 128 avaliacoes". `count` vem formatado, ou `undefined`. */
  summary: (formatted: string, max: number, count: string | undefined, rawCount: number | undefined) => string;
}

const DEFAULT_RATING_LABELS: RatingLabels = {
  clear: 'Limpar nota',
  noValue: 'Sem nota',
  noRatings: 'Sem avaliações',
  item: (value, formatted) => `${formatted} ${value === 1 ? 'estrela' : 'estrelas'}`,
  valueText: (formatted, max) => `${formatted} de ${max}`,
  summary: (formatted, max, count, rawCount) =>
    `${formatted} de ${max} estrelas${count === undefined ? '' : `, ${count} ${rawCount === 1 ? 'avaliação' : 'avaliações'}`}`,
};

type RatingRootAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'defaultValue' | 'onChange' | 'role' | 'aria-describedby'
>;

interface RatingCommonProps extends RatingRootAttributes {
  'aria-describedby'?: string;
  /**
   * Icone no lugar da estrela, desenhado em `currentColor`: cheio na cor do traco (`--pl-rating-stroke`), vazio na
   * borda de controle (`--pl-control-border`), e cortado ao meio na meia nota.
   */
  icon?: ReactNode;
  labels?: Partial<RatingLabels>;
  /** Quantidade de estrelas, de 3 a 10. */
  max?: number;
  ref?: Ref<HTMLElement>;
  /** O valor escrito ao lado das estrelas: "4 de 5 · Bom" na entrada, "4,5" na exibicao. */
  showValue?: boolean;
  size?: RatingSize;
}

/** Exibicao de uma nota, so leitura: uma imagem com a nota no nome. */
export interface RatingDisplayProps extends RatingCommonProps {
  /** Uma estrela cheia e o numero, para tabela e lista. */
  compact?: boolean;
  /** Quantas avaliacoes formam a nota: "(128)" ao lado e ", 128 avaliacoes" no nome. */
  count?: number;
  readOnly: true;
  /** A nota, com qualquer fracao; o desenho arredonda a meia estrela. `null` e sem avaliacoes. */
  value: number | null;
  clearable?: never;
  defaultValue?: never;
  disabled?: never;
  error?: never;
  hint?: never;
  label?: never;
  name?: never;
  onHover?: never;
  onValueChange?: never;
  required?: never;
  step?: never;
  valueLabels?: never;
}

/** Entrada de uma nota num formulario: um grupo de radio, com um radio por estrela ou por meia estrela. */
export interface RatingInputProps extends RatingCommonProps {
  /** O botao "Limpar nota" depois das estrelas, enquanto ha nota. */
  clearable?: boolean;
  defaultValue?: number | null;
  disabled?: boolean;
  error?: string;
  hint?: string;
  /** Legenda do grupo. Opcional quando o grupo ja e nomeado por `aria-label` ou `aria-labelledby`. */
  label?: string;
  name?: string;
  /** A nota sob o ponteiro que paira, ou `null` quando ele sai das estrelas. */
  onHover?: (value: number | null) => void;
  /** A nova nota; `null` quando "Limpar nota" e acionado. */
  onValueChange?: (value: number | null) => void;
  readOnly?: false;
  required?: boolean;
  /** `1`, o padrao, para notas inteiras; `0.5` para meia estrela, com dois radios por estrela. */
  step?: RatingStep;
  /** A nota, multipla de `step`, de `step` a `max`. `null` e sem nota. */
  value?: number | null;
  /** Um nome por nota inteira, na ordem: "Pessimo" a "Otimo". Lido em cada radio e escrito ao lado. */
  valueLabels?: readonly string[];
  compact?: never;
  count?: never;
}

export type RatingProps = RatingDisplayProps | RatingInputProps;

const MIN_MAX = 3;
const MAX_MAX = 10;

const STAR = 'M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z';

const formatted = (value: number) => formatNumber(value, { decimals: Number.isInteger(value) ? 0 : 1 });

function clampMax(max: number) {
  return Math.min(MAX_MAX, Math.max(MIN_MAX, Math.round(max)));
}

type Fill = 'empty' | 'half' | 'full';

function fillOf(value: number | null, index: number): Fill {
  if (value === null || value <= index - 1) {
    return 'empty';
  }

  return value >= index ? 'full' : 'half';
}

function Star({ fill, icon }: { fill: Fill; icon?: ReactNode }) {
  if (icon !== undefined) {
    return (
      <span className={styles.icon} data-fill={fill} aria-hidden="true">
        <span className={styles.iconEmpty}>{icon}</span>
        {fill !== 'empty' && <span className={styles.iconFull}>{icon}</span>}
      </span>
    );
  }

  return (
    <span className={styles.icon} data-fill={fill} aria-hidden="true">
      <svg className={styles.iconEmpty} viewBox="0 0 24 24" focusable="false">
        <path className={styles.emptyPath} d={STAR} />
      </svg>
      {fill !== 'empty' && (
        <svg className={styles.iconFull} viewBox="0 0 24 24" focusable="false">
          <path className={styles.fullPath} d={STAR} />
        </svg>
      )}
    </span>
  );
}

function useAvisosDoRating(props: RatingProps, max: number) {
  const { max: requested = 5 } = props;
  const readOnly = props.readOnly === true;
  const step = readOnly ? 1 : (props.step ?? 1);
  const valueLabels = readOnly ? undefined : props.valueLabels;
  const record = props as unknown as Record<string, unknown>;

  useEffect(() => {
    if (!isDevelopment()) {
      return;
    }

    if (requested !== max) {
      console.warn(`Rating: \`max\` aceita inteiros de ${MIN_MAX} a ${MAX_MAX}; ${requested} é tratado como ${max}.`);
    }

    if (step !== 1 && step !== 0.5) {
      console.warn(`Rating: \`step\` aceita 1 ou 0.5; ${String(step)} é tratado como 1.`);
    }

    if (valueLabels && valueLabels.length !== max) {
      console.warn(`Rating: \`valueLabels\` tem ${valueLabels.length} nomes para ${max} notas; os nomes são ignorados.`);
    }

    const doOutroModo = readOnly
      ? ['clearable', 'defaultValue', 'error', 'hint', 'label', 'name', 'onHover', 'onValueChange', 'required', 'step', 'valueLabels']
      : ['compact', 'count'];
    const usadas = doOutroModo.filter((chave) => record[chave] !== undefined);

    if (usadas.length > 0) {
      console.warn(
        `Rating: ${usadas.map((chave) => `\`${chave}\``).join(', ')} só se ${usadas.length === 1 ? 'aplica' : 'aplicam'} ${
          readOnly ? 'à entrada, sem `readOnly`' : 'à exibição, com `readOnly`'
        }.`,
      );
    }
    // Os avisos dependem so das chaves e dos numeros, nao da identidade do objeto.
  }, [requested, max, step, valueLabels?.length, readOnly]);
}

/**
 * Avaliacao em estrelas. Com `readOnly`, a exibicao de uma nota, como a media de um item com a contagem: uma imagem
 * com a nota no nome. Sem ele, a entrada de uma nota num formulario: um grupo de radio nativo, com uma parada de Tab,
 * setas que trocam a nota e o valor escrito ao lado.
 */
export function Rating(props: RatingProps) {
  const max = clampMax(props.max ?? 5);
  useAvisosDoRating(props, max);

  return props.readOnly === true ? <RatingDisplay {...props} max={max} /> : <RatingInput {...props} max={max} />;
}

function RatingDisplay({
  'aria-label': ariaLabel,
  className,
  compact = false,
  count,
  icon,
  labels: customLabels,
  max = 5,
  readOnly: _readOnly,
  ref,
  showValue = true,
  size = 'md',
  value,
  ...props
}: RatingDisplayProps) {
  const labels = { ...DEFAULT_RATING_LABELS, ...customLabels };
  const classes = [styles.rating, styles.display, styles[size], className].filter(Boolean).join(' ');

  if (value === null || !Number.isFinite(value)) {
    return (
      <span {...props} className={classes} ref={ref as Ref<HTMLSpanElement>}>
        <span className={styles.count}>{labels.noRatings}</span>
      </span>
    );
  }

  const nota = Math.min(max, Math.max(0, value));
  const desenho = Math.round(nota * 2) / 2;
  const contagem = count === undefined ? undefined : formatNumber(count);
  const nome = ariaLabel ?? labels.summary(formatted(nota), max, contagem, count);
  const indices = compact ? [1] : Array.from({ length: max }, (_, index) => index + 1);

  return (
    <span {...props} aria-label={nome} className={classes} ref={ref as Ref<HTMLSpanElement>} role="img">
      <span className={styles.stars}>
        {indices.map((index) => (
          <span className={styles.star} key={index}>
            <Star fill={compact ? 'full' : fillOf(desenho, index)} icon={icon} />
          </span>
        ))}
      </span>
      {(showValue || compact) && <span className={styles.number}>{formatted(nota)}</span>}
      {contagem !== undefined && <span className={styles.count}>({contagem})</span>}
    </span>
  );
}

function RatingInput({
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
  clearable = false,
  defaultValue = null,
  disabled = false,
  error,
  hint,
  icon,
  label,
  labels: customLabels,
  max = 5,
  name: providedName,
  onHover,
  onValueChange,
  readOnly: _readOnly,
  ref,
  required = false,
  showValue = true,
  size = 'md',
  step: requestedStep = 1,
  value: controlledValue,
  valueLabels,
  ...props
}: RatingInputProps) {
  useAvisoDeGrupoSemNome('Rating', { ariaLabel, ariaLabelledby, label });
  const labels = { ...DEFAULT_RATING_LABELS, ...customLabels };
  const step: RatingStep = requestedStep === 0.5 ? 0.5 : 1;
  const generatedId = useId();
  const name = providedName ?? `rating-${generatedId}`;
  const messageId = `rating-${generatedId}-message`;
  const labelId = `rating-${generatedId}-label`;
  const [uncontrolledValue, setUncontrolledValue] = useState<number | null>(defaultValue);
  const [hovered, setHovered] = useState<number | null>(null);
  const resetRef = useFormReset<HTMLFieldSetElement>(() => setUncontrolledValue(defaultValue));
  const mergedRef = useMergedRefs(resetRef, ref as Ref<HTMLFieldSetElement>);
  const controlado = controlledValue !== undefined;
  const value = controlado ? controlledValue : uncontrolledValue;
  const nomes = valueLabels && valueLabels.length === max ? valueLabels : undefined;
  const shown = hovered ?? value;
  const describedBy = [ariaDescribedBy, error || hint ? messageId : undefined].filter(Boolean).join(' ') || undefined;
  const values = Array.from({ length: max / step }, (_, index) => (index + 1) * step);

  function nameOf(nota: number) {
    const base = labels.item(nota, formatted(nota));
    const nome = Number.isInteger(nota) ? nomes?.[nota - 1] : undefined;

    return nome ? `${base}, ${nome}` : base;
  }

  function choose(next: number | null) {
    if (!controlado) {
      setUncontrolledValue(next);
    }

    onValueChange?.(next);
  }

  function hover(next: number | null) {
    setHovered(next);
    onHover?.(next);
  }

  function clear() {
    choose(null);
    const fieldset = resetRef.current;
    // Sem nota, o primeiro radio e a parada de Tab do grupo; o foco volta a ele, e nao ao corpo da pagina.
    requestAnimationFrame(() => fieldset?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus());
  }

  const radio = (nota: number, half?: 'start' | 'end') => (
    <input
      aria-label={nameOf(nota)}
      checked={value === nota}
      className={[styles.input, half && styles.half, half && styles[half]].filter(Boolean).join(' ')}
      disabled={disabled}
      key={nota}
      name={name}
      onChange={(evento: ChangeEvent<HTMLInputElement>) => {
        if (evento.target.checked) {
          choose(nota);
        }
      }}
      onPointerEnter={(evento: PointerEvent<HTMLInputElement>) => {
        if (evento.pointerType !== 'touch' && !disabled) {
          hover(nota);
        }
      }}
      required={required}
      type="radio"
      value={String(nota)}
    />
  );

  const valueText =
    shown === null
      ? labels.noValue
      : [labels.valueText(formatted(shown), max), Number.isInteger(shown) ? nomes?.[shown - 1] : undefined]
          .filter(Boolean)
          .join(' · ');

  return (
    <fieldset
      {...props}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      aria-label={ariaLabelledby ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-required={required || undefined}
      className={[styles.rating, styles.entry, styles[size], error && styles.invalid, className].filter(Boolean).join(' ')}
      data-disabled={disabled || undefined}
      ref={mergedRef}
      role="radiogroup"
    >
      {label && <GroupLegend label={label} labelId={labelId} required={required} />}
      <div className={styles.line}>
        <span
          className={styles.stars}
          onPointerLeave={() => {
            if (hovered !== null) {
              hover(null);
            }
          }}
        >
          {Array.from({ length: max }, (_, index) => {
            const estrela = index + 1;

            return (
              <span className={styles.star} key={estrela}>
                {step === 0.5 ? [radio(estrela - 0.5, 'start'), radio(estrela, 'end')] : radio(estrela)}
                <Star fill={fillOf(shown, estrela)} icon={icon} />
              </span>
            );
          })}
        </span>
        {showValue && (
          <span className={[styles.value, hovered !== null && styles.preview].filter(Boolean).join(' ')} aria-hidden="true">
            {valueText}
          </span>
        )}
        {clearable && value !== null && !disabled && (
          <button className={styles.clear} onClick={clear} type="button">
            {labels.clear}
          </button>
        )}
      </div>
      {(error || hint) && (
        <span className={error ? fieldStyles.errorMessage : fieldStyles.hint} id={messageId} role={error ? 'alert' : undefined}>
          {error || hint}
        </span>
      )}
    </fieldset>
  );
}
