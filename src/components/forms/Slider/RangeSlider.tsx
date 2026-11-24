import { SliderBase, type SliderCommonProps } from './SliderBase';

export type SliderRange = [number, number];

/** Os textos da faixa, para trocar os de padrao. */
export interface RangeSliderLabels {
  /** Somado ao nome do segundo polegar: "Faixa de preço, máximo". */
  end?: string;
  /** Entre os dois valores, ao lado do rotulo: "R$ 300 a R$ 1.200". */
  separator?: string;
  /** Somado ao nome do primeiro polegar: "Faixa de preço, mínimo". */
  start?: string;
}

export interface RangeSliderProps extends SliderCommonProps {
  /** Faixa inicial, nao controlada; o `reset` do formulario volta a ela. Sem declarar, de `min` a `max`. */
  defaultValue?: SliderRange;
  /** Nome do fim no formulario. Com ele, um input oculto carrega o valor para o `FormData`. */
  endName?: string;
  labels?: RangeSliderLabels;
  /** Intervalo minimo entre os dois polegares, na unidade do valor. */
  minDistance?: number;
  /** A cada passo, durante o arrasto e no teclado. */
  onValueChange?: (value: SliderRange) => void;
  /** Ao soltar o ponteiro, e a cada tecla: para o que so deve correr no fim, como a consulta ao servidor. */
  onValueCommit?: (value: SliderRange) => void;
  /** Nome do inicio no formulario. */
  startName?: string;
  value?: SliderRange;
}

/**
 * Ajuste de uma faixa com dois polegares, que nao se cruzam. Arrastar entre eles move a faixa inteira, com a mesma
 * largura; pelo teclado, cada polegar anda sozinho.
 */
export function RangeSlider({
  defaultValue,
  endName,
  labels,
  max = 100,
  min = 0,
  minDistance = 0,
  onValueChange,
  onValueCommit,
  startName,
  value,
  ...props
}: RangeSliderProps) {
  const separator = labels?.separator ?? ' a ';

  return (
    <SliderBase
      {...props}
      defaultValue={defaultValue ?? [min, max]}
      formNames={[startName, endName]}
      max={max}
      min={min}
      minDistance={minDistance}
      onValuesChange={onValueChange && ((values) => onValueChange([values[0], values[1]]))}
      onValuesCommit={onValueCommit && ((values) => onValueCommit([values[0], values[1]]))}
      summary={([start, end]) => `${start}${separator}${end}`}
      thumbSuffixes={[labels?.start ?? 'mínimo', labels?.end ?? 'máximo']}
      values={value}
    />
  );
}
