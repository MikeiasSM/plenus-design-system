import { SliderBase, type SliderCommonProps } from './SliderBase';

export interface SliderProps extends SliderCommonProps {
  /** Valor inicial, nao controlado; o `reset` do formulario volta a ele. Sem declarar, o `min`. */
  defaultValue?: number;
  /** Com ele, um input oculto carrega o valor para o `FormData`. */
  name?: string;
  /** A cada passo, durante o arrasto e no teclado. */
  onValueChange?: (value: number) => void;
  /** Ao soltar o ponteiro, e a cada tecla: para o que so deve correr no fim, como a consulta ao servidor. */
  onValueCommit?: (value: number) => void;
  value?: number;
}

/** Ajuste de um valor num intervalo, por arrasto, toque ou teclado. */
export function Slider({ defaultValue, min = 0, name, onValueChange, onValueCommit, value, ...props }: SliderProps) {
  return (
    <SliderBase
      {...props}
      defaultValue={[defaultValue ?? min]}
      formNames={[name]}
      min={min}
      minDistance={0}
      onValuesChange={onValueChange && ((values) => onValueChange(values[0]))}
      onValuesCommit={onValueCommit && ((values) => onValueCommit(values[0]))}
      summary={([text]) => text}
      values={value === undefined ? undefined : [value]}
    />
  );
}
