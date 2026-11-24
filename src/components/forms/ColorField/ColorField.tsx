import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { Icon } from '../../icons/Icon';
import { ColorPicker, type ColorPickerOption } from '../ColorPicker';
import { InputText, type InputTextProps } from '../InputText';
import styles from './ColorField.module.css';

/** Uma amostra sugerida pelo produto, como uma cor tirada do logo. */
export interface ColorFieldSuggestion {
  /** Cor em hexadecimal, `#RRGGBB`. */
  color: string;
  /** Nome da amostra, ouvido pelo leitor de tela e mostrado como dica. */
  label: string;
}

export interface ColorFieldProps
  extends Omit<InputTextProps, 'defaultValue' | 'end' | 'icon' | 'mask' | 'onChange' | 'onValueChange' | 'unit' | 'value'> {
  defaultValue?: string | null;
  /** Nome do botao do conta-gotas. So aparece onde o navegador tem o `EyeDropper`. */
  eyedropperLabel?: string;
  /** Erro de formato, depois que a pessoa sai do campo com um codigo invalido. */
  invalidMessage?: string;
  label: string;
  /** A cor normalizada, `#RRGGBB` em maiusculas, quando o codigo e valido; `null` com o campo vazio. */
  onValueChange?: (value: string | null) => void;
  /** Amostras do produto, como as cores do logo. Ficam abaixo do campo, como grupo de radio. */
  suggestions?: readonly ColorFieldSuggestion[];
  /** Nome do grupo das amostras. O padrão cita o rótulo do campo: "Cores sugeridas para <label>". */
  suggestionsLabel?: string;
  value?: string | null;
}

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperConstructor {
  new (): { open: () => Promise<EyeDropperResult> };
}

/** Conta-gotas, o mesmo desenho de `IconEyedropper`, sem trazer a suite inteira para a entrada principal. */
function IconEyedropper() {
  return (
    <Icon>
      <path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708zM2 12.707l7-7L10.293 7l-7 7H2z" />
    </Icon>
  );
}

/** `#abc`, `abc`, `#aabbcc` e `aabbcc` viram `#AABBCC`; o resto, `null`. */
export function normalizeHex(text: string): string | null {
  const raw = text.trim().replace(/^#/, '');

  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${[...raw].map((char) => char + char).join('')}`.toUpperCase();
  }

  return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw}`.toUpperCase() : null;
}

/** Se o texto corresponde ao valor: `null` só corresponde ao campo vazio. */
function matches(text: string, value: string | null | undefined) {
  return value == null ? text.trim() === '' : normalizeHex(text) === normalizeHex(value);
}

function getEyeDropper(): EyeDropperConstructor | undefined {
  return typeof window === 'undefined' ? undefined : (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper;
}

/**
 * Campo de cor livre: o codigo hexadecimal, as amostras que o produto sugere e o conta-gotas do navegador, onde ele
 * existe (hoje Chrome e Edge de computador). Sem `EyeDropper`, o botao nao aparece.
 */
export function ColorField(allProps: ColorFieldProps) {
  const {
    defaultValue,
    error,
    eyedropperLabel = 'Pegar uma cor da tela',
    invalidMessage = 'Use o código hexadecimal, como #E85D1F.',
    label,
    onBlur,
    onValueChange,
    suggestions,
    suggestionsLabel = `Cores sugeridas para ${label}`,
    value,
    ...props
  } = allProps;
  const controlled = value !== undefined;
  const [text, setText] = useState(() => (controlled ? (value ?? '') : (defaultValue ?? '')));
  const [touched, setTouched] = useState(false);
  const [hasEyeDropper, setHasEyeDropper] = useState(false);
  // O último valor avisado no modo não controlado; no controlado, quem guarda é o `value`.
  const reported = useRef(normalizeHex(text));
  // As props e o texto do último desenho: dizem se o desenho atual veio do produto ou da digitação.
  const [lastRender, setLastRender] = useState({ props: allProps, text });
  const pickerId = `color-field-${useId()}`;

  // O navegador só é conhecido depois da montagem: assim o servidor e o cliente desenham o mesmo.
  useEffect(() => setHasEyeDropper(Boolean(getEyeDropper())), []);

  // No modo controlado, o texto acompanha o `value` sempre que o produto redesenha o campo e o texto não acabou de
  // mudar. Assim um `null` limpa também um rascunho inválido, como "e8", que já valia `null`. Enquanto a pessoa
  // digita, o texto muda no mesmo desenho e fica como está.
  if (lastRender.props !== allProps || lastRender.text !== text) {
    let next = text;

    if (controlled && lastRender.props !== allProps && lastRender.text === text && !matches(text, value)) {
      next = value ?? '';
      setText(next);
    }

    setLastRender({ props: allProps, text: next });
  }

  // Desabilitado ou só de leitura, nem o conta-gotas nem as amostras mudam a cor: só o texto do campo seria pouco.
  const size = props.size ?? 'md';
  const locked = Boolean(props.disabled || props.readOnly);
  const color = normalizeHex(text);
  const invalid = touched && text.trim() !== '' && color === null;

  function report(next: string | null) {
    const last = controlled ? normalizeHex(value ?? '') : reported.current;

    reported.current = next;

    if (next !== last) {
      onValueChange?.(next);
    }
  }

  // O código de seis dígitos vale na hora; o resto, inclusive o curto em digitação, vale `null` até a saída do campo.
  function commit(next: string) {
    setText(next);
    report(next.trim().replace(/^#/, '').length === 6 ? normalizeHex(next) : null);
  }

  // O código curto só vale quando a pessoa sai do campo: em digitação, "e85" é o começo de "e85d1f", e não uma cor.
  function commitShortCode() {
    const normalized = normalizeHex(text);

    if (normalized && text.trim().replace(/^#/, '').length === 3) {
      setText(normalized);
      report(normalized);
    }
  }

  async function pick() {
    const EyeDropper = getEyeDropper();

    if (!EyeDropper || locked) {
      return;
    }

    try {
      const result = await new EyeDropper().open();
      setTouched(true);
      commit(result.sRGBHex.toUpperCase());
    } catch {
      // A pessoa cancelou com Esc: nada muda.
    }
  }

  const options: ColorPickerOption[] = (suggestions ?? []).map((suggestion) => ({
    color: suggestion.color,
    label: suggestion.label,
    value: normalizeHex(suggestion.color) ?? suggestion.color,
  }));
  const chosen = options.some((option) => option.value === color) ? color : null;

  return (
    <div className={styles.colorField}>
      <InputText
        {...props}
        autoCapitalize="characters"
        autoComplete="off"
        // A fenda fica sempre montada, vazia sem conta-gotas: trocar a estrutura do InputText depois da montagem
        // recriaria o <input> e tiraria dele o foco e o autoFocus.
        end={
          hasEyeDropper ? (
            <ButtonIcon
              disabled={locked}
              icon={<IconEyedropper />}
              label={eyedropperLabel}
              onClick={() => void pick()}
              size={size === 'lg' ? 'md' : 'sm'}
              variant="ghost"
            />
          ) : null
        }
        error={error ?? (invalid ? invalidMessage : undefined)}
        icon={<span className={styles.chip} data-empty={color ? undefined : ''} style={color ? { backgroundColor: color } : undefined} />}
        label={label}
        maxLength={7}
        onBlur={(event: FocusEvent<HTMLInputElement>) => {
          setTouched(true);
          commitShortCode();
          onBlur?.(event);
        }}
        onValueChange={commit}
        placeholder={props.placeholder ?? '#RRGGBB'}
        spellCheck={false}
        value={text}
      />
      {options.length > 0 && (
        <ColorPicker
          aria-readonly={props.readOnly && !props.disabled ? true : undefined}
          disabled={props.disabled}
          label={suggestionsLabel}
          // As amostras só preenchem o campo: quem vai ao formulário é o texto, pelo `name` do campo. O `form` aponta
          // para um formulário que não existe, e assim os rádios ficam fora do envio sem perder o grupo, que depende
          // do `name` para as setas.
          form={`${pickerId}-sem-envio`}
          name={pickerId}
          onValueChange={(next) => {
            if (next && !locked) {
              setTouched(true);
              commit(next);
            }
          }}
          options={options}
          size={size}
          value={chosen}
        />
      )}
    </div>
  );
}
