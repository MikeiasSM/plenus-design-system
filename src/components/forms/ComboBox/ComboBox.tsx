import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal, flushSync } from 'react-dom';
import { useOverlayPosition } from '@react-aria/overlays';
import { ListingOptions, optionId } from '../../data-display/List/ListingOptions';
import { useListing, type ListingItem } from '../../data-display/List/useListing';
import { Badge } from '../../data-display/Badge';
import { Button } from '../../actions/Button';
import { useFormReset } from '../../../hooks/useFormReset';
import { useMergedRefs } from '../../../hooks/useMergedRefs';
import { usePortalContainer } from '../../overlays/Portal/PortalContext';
import { useOpenState } from '../../../hooks/useOpenState';
import { Field } from '../Field';
import { FormValue } from '../Field/FormValue';
import styles from './ComboBox.module.css';

export type ComboBoxSize = 'sm' | 'md' | 'lg';

export interface ComboBoxOption {
  /** Segunda linha da opção, como a coleção de um documento. A busca local procura só no rótulo. */
  description?: string;
  disabled?: boolean;
  /** Título do grupo. As opções seguidas de um mesmo grupo aparecem juntas, sob ele. */
  group?: string;
  /** Decorativo, à frente do rótulo. */
  icon?: ReactNode;
  label: string;
  value: string;
}

/** As propriedades nativas vao ao campo de texto, que e o controle; o `className` soma ao do sistema. */
interface ComboBoxBaseProps
  extends Omit<ComponentPropsWithRef<'input'>, 'defaultValue' | 'name' | 'onChange' | 'size' | 'type' | 'value'> {
  /** Abertura da lista de início, sem controle. */
  defaultOpen?: boolean;
  emptyMessage?: string;
  error?: string;
  hint?: string;
  label?: string;
  /**
   * Nome do campo no formulario. Com ele, um input oculto carrega o valor para
   * o `FormData`: sem controle nativo por baixo, o envio ignorava o campo.
   */
  name?: string;
  loading?: boolean;
  /** Avisa cada abertura e fechamento, por qualquer via: digitar, setas, clique, Escape, Tab, rolagem ou escolha. */
  onOpenChange?: (open: boolean) => void;
  onSearch?: (term: string) => void;
  /** Com ele a lista é controlada: só muda quando o produto atualiza a propriedade. */
  open?: boolean;
  /** Elemento que recebe o painel. Sem ele vale o `PortalProvider` mais próximo e, sem este, o `document.body`. */
  portalContainer?: HTMLElement | null;
  options: readonly ComboBoxOption[];
  size?: ComboBoxSize;
}

/** Textos do rodapé do painel. O que não for informado fica em português. */
export interface ComboBoxLabels {
  apply: string;
  cancel: string;
  clear: string;
  selectAll: string;
}

/** Controles do rodapé do painel, só na seleção múltipla. Sem nenhum deles, o painel não tem rodapé. */
export interface ComboBoxMultipleActions {
  /** "Limpar": desmarca tudo, inclusive o que a busca esconde. */
  clearable?: boolean;
  /**
   * A escolha só vale ao aplicar: `onValueChange` é chamado uma vez, em "Aplicar". Fechar o painel de qualquer outro
   * modo, inclusive "Cancelar", descarta o que foi marcado.
   */
  confirmSelection?: boolean;
  labels?: Partial<ComboBoxLabels>;
  /** "Selecionar todos": marca os itens habilitados do resultado da busca, sem desmarcar o resto. */
  selectAll?: boolean;
}

export interface ComboBoxSingleProps extends ComboBoxBaseProps, Partial<Record<keyof ComboBoxMultipleActions, never>> {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  selectionMode?: 'single';
  value?: string;
}

export interface ComboBoxMultipleProps extends ComboBoxBaseProps, ComboBoxMultipleActions {
  defaultValue?: readonly string[];
  onValueChange?: (values: readonly string[]) => void;
  selectionMode: 'multiple';
  value?: readonly string[];
}

export type ComboBoxProps = ComboBoxSingleProps | ComboBoxMultipleProps;

function comoItens(valor: string | readonly string[] | undefined): ListingItem[] | undefined {
  if (valor === undefined) {
    return undefined;
  }

  return (typeof valor === 'string' ? [valor] : valor).map((value) => ({ value, label: '' }));
}

function relatarEscolha(props: ComboBoxProps, escolhidos: readonly ListingItem[]) {
  if (props.selectionMode === 'multiple') {
    props.onValueChange?.(escolhidos.map((item) => item.value));
    return;
  }

  const [primeiro] = escolhidos;

  if (primeiro) {
    props.onValueChange?.(primeiro.value);
  }
}

export function ComboBox(allProps: ComboBoxProps) {
  const {
    'aria-describedby': ariaDescribedBy,
    className,
    clearable = false,
    confirmSelection = false,
    defaultOpen,
    defaultValue,
    name,
    disabled = false,
    emptyMessage = 'Nenhum resultado',
    error,
    hint,
    id: providedId,
    label,
    labels,
    loading = false,
    onBlur,
    onClick,
    onKeyDown,
    onOpenChange,
    onSearch,
    // Fora do resto, que vai ao campo: quem o chama e `relatarEscolha`, que conhece o modo.
    onValueChange,
    open: controlledOpen,
    options,
    portalContainer,
    placeholder,
    ref,
    required = false,
    selectAll = false,
    selectionMode = 'single',
    size = 'md',
    value,
    ...props
  } = allProps;
  const container = usePortalContainer(portalContainer);
  const multiple = selectionMode === 'multiple';
  const confirm = multiple && confirmSelection;
  const texts: ComboBoxLabels = {
    apply: 'Aplicar',
    cancel: 'Cancelar',
    clear: 'Limpar',
    selectAll: 'Selecionar todos',
    ...labels,
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = `combobox-${useId()}`;
  const [open, setOpen] = useOpenState({ defaultOpen, onOpenChange, open: controlledOpen });
  const wasOpenRef = useRef(open);
  const [filtering, setFiltering] = useState(false);
  // Só com `confirmSelection`: o que se marca no painel é rascunho, e o valor do campo continua o aplicado.
  const [draft, setDraft] = useState<readonly ListingItem[] | null>(null);
  const [appliedInternally, setAppliedInternally] = useState<readonly ListingItem[]>(() => comoItens(defaultValue) ?? []);
  const applied = comoItens(value) ?? appliedInternally;
  const resetRef = useFormReset<HTMLInputElement>(() => {
    listing.reset();
    setAppliedInternally(comoItens(defaultValue) ?? []);
    fechar();
  });
  const mergedRef = useMergedRefs(inputRef, resetRef, ref);

  // O valor e a chave, e nao a opcao: com opcoes que chegam depois, filtrar por elas perdia a escolha.
  const listing = useListing({
    items: options,
    selectionMode,
    defaultValue: comoItens(defaultValue),
    value: confirm ? (open ? (draft ?? applied) : applied) : comoItens(value),
    onSearch,
    onSelectionChange: (escolhidos) => (confirm ? setDraft(escolhidos) : relatarEscolha(allProps, escolhidos)),
  });

  const known = [...listing.selected, ...options];
  const escolhidos = confirm
    ? applied.map((item) => known.find((option) => option.value === item.value && option.label) ?? item)
    : listing.selected;
  const [chosen] = escolhidos;
  // Na escolha multipla o campo so guarda a busca: quem mostra o que esta escolhido sao as etiquetas.
  const texto = multiple || filtering ? listing.term : chosen?.label ?? '';
  const ancoraRef = multiple ? controlRef : inputRef;
  const activeIndex = listing.visible.findIndex((option) => option.value === listing.focusedKey);

  const { overlayProps: positionProps } = useOverlayPosition({
    targetRef: ancoraRef,
    overlayRef: panelRef,
    placement: 'bottom start',
    offset: 6,
    containerPadding: 8,
    isOpen: open,
    onClose: fechar,
  });
  const [largura, setLargura] = useState<number>();
  const alturaMaxima = Math.min(Number(positionProps.style?.maxHeight) || 280, 280);

  useLayoutEffect(() => {
    setLargura(ancoraRef.current?.offsetWidth);
  }, [ancoraRef, open]);

  // Sem medida, como no servidor, o campo resume as escolhas; medido, mostra todas as etiquetas enquanto couberem.
  const [resumir, setResumir] = useState(true);
  const selecaoRef = useRef<HTMLSpanElement>(null);
  const chaveDasEscolhas = escolhidos.map((item) => item.value).join('\n');

  useLayoutEffect(() => {
    const moldura = controlRef.current;

    if (!moldura || typeof ResizeObserver === 'undefined') {
      return;
    }

    // Desenhar todas e medir na mesma passada, antes da pintura, para o campo nao piscar ao redimensionar.
    const observador = new ResizeObserver(() => {
      flushSync(() => setResumir(false));
      const selecao = selecaoRef.current;
      flushSync(() => setResumir(Boolean(selecao && selecao.scrollWidth > selecao.clientWidth)));
    });

    observador.observe(moldura);

    return () => observador.disconnect();
  }, [chaveDasEscolhas, multiple]);

  function encerrarFiltro() {
    setFiltering(false);
    listing.filter('');
  }

  function fechar() {
    setOpen(false);
    setDraft(null);
    encerrarFiltro();
  }

  function fecharNoCampo() {
    inputRef.current?.focus();
    fechar();
  }

  function aplicar() {
    setAppliedInternally(listing.selected);
    relatarEscolha(allProps, listing.selected);
    fecharNoCampo();
  }

  const hasFooter = multiple && (selectAll || clearable || confirm);

  function footerButtons() {
    return Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
  }

  // O painel fica em outro ponto do DOM; o Tab percorre o rodape e volta ao campo, de onde segue a ordem da pagina.
  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      fecharNoCampo();
      return;
    }

    const buttons = footerButtons();
    const edge = buttons[event.shiftKey ? 0 : buttons.length - 1];

    if (event.key === 'Tab' && document.activeElement === edge) {
      if (event.shiftKey) {
        event.preventDefault();
        inputRef.current?.focus();
      } else {
        fecharNoCampo();
      }
    }
  }

  function handlePanelBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;

    if (!next || (!event.currentTarget.contains(next) && next !== inputRef.current)) {
      fechar();
    }
  }

  // O fechamento feito pelo produto ao mudar `open` tambem desfaz a busca.
  useEffect(() => {
    if (wasOpenRef.current && !open && filtering) {
      encerrarFiltro();
    }
    if (!open) {
      setDraft(null);
    }
    wasOpenRef.current = open;
    // Só na transição de `open`: `encerrarFiltro` muda a cada renderização.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);

    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      setOpen(true);
      listing.focusFirst();
      return;
    }

    if (event.key === 'Escape') {
      fechar();
      return;
    }

    if (event.key === 'Tab' && !event.shiftKey && open && hasFooter) {
      const [first] = footerButtons();

      if (first) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (event.key === 'Enter') {
      const alvo = listing.visible.find((option) => option.value === listing.focusedKey);

      if (open && alvo && !alvo.disabled) {
        event.preventDefault();
        listing.select(alvo);

        if (!multiple) {
          fechar();
        }
      }
      return;
    }

    const ultimo = escolhidos[escolhidos.length - 1];

    if (event.key === 'Backspace' && multiple && texto === '' && ultimo) {
      listing.select(ultimo);
      return;
    }

    listing.handleKeyDown(event);
  }

  return (
    <Field aria-describedby={ariaDescribedBy} error={error} hint={hint} id={providedId} label={label} required={required}>
      {({ id, describedBy, invalid }) => {
        const resumoId = id + '-selection';
        const campo = (
          <input
            {...props}
            ref={mergedRef}
            className={[multiple ? styles.search : styles.input, !multiple && styles[size], !multiple && error && styles.error, className]
              .filter(Boolean)
              .join(' ')}
            id={id}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-describedby={[describedBy, multiple && escolhidos.length > 0 && resumoId].filter(Boolean).join(' ') || undefined}
            aria-invalid={invalid || undefined}
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={open ? baseId + '-options' : undefined}
            aria-activedescendant={open && activeIndex >= 0 ? optionId(baseId, activeIndex) : undefined}
            aria-required={required || undefined}
            disabled={disabled}
            placeholder={placeholder}
            value={texto}
            // Sair do campo desfaz a busca: o texto volta a dizer o que esta escolhido.
            onBlur={(event: FocusEvent<HTMLInputElement>) => {
              if (!panelRef.current?.contains(event.relatedTarget as Node | null)) {
                fechar();
              }
              onBlur?.(event);
            }}
            onChange={(event) => {
              setFiltering(true);
              setOpen(true);
              listing.filter(event.target.value);
            }}
            onClick={(event: MouseEvent<HTMLInputElement>) => {
              setOpen(true);
              onClick?.(event);
            }}
            onKeyDown={handleKeyDown}
          />
        );

        return (
          <>
            {(escolhidos.length > 0 ? escolhidos : [undefined]).map((item) => (
              <FormValue
                disabled={disabled}
                key={item?.value ?? ''}
                name={name}
                onFocus={() => inputRef.current?.focus()}
                required={required}
                value={item?.value ?? ''}
              />
            ))}
            {multiple ? (
              <div
                className={[styles.control, styles[size], error && styles.error].filter(Boolean).join(' ')}
                // O clique na moldura, fora do campo, leva o foco a ele em vez de tira-lo.
                onMouseDown={(event) => {
                  if (event.target !== inputRef.current) {
                    event.preventDefault();
                    inputRef.current?.focus();
                  }
                }}
                ref={controlRef}
              >
                {chosen && (
                  <>
                    <span aria-hidden="true" className={styles.selection} ref={selecaoRef}>
                      {(resumir ? [chosen] : escolhidos).map((item) => (
                        <Badge key={item.value}>{item.label}</Badge>
                      ))}
                      {resumir && escolhidos.length > 1 && (
                        <span className={styles.rest}>+{escolhidos.length - 1}</span>
                      )}
                    </span>
                    <span className={styles.summary} id={resumoId}>
                      {escolhidos.length === 1 ? '1 selecionado' : `${escolhidos.length} selecionados`}:{' '}
                      {escolhidos.map((item) => item.label).join(', ')}
                    </span>
                  </>
                )}
                {campo}
              </div>
            ) : (
              campo
            )}
            {open &&
              container &&
              createPortal(
                <div
                  ref={panelRef}
                  className={styles.panel}
                  // Camada de cima: o `ariaHideOutside` do Dialog ignora quem a declara.
                  data-react-aria-top-layer="true"
                  // O clique no painel, fora de uma opcao, nao tira o foco do campo nem fecha a lista.
                  onBlur={handlePanelBlur}
                  onKeyDown={hasFooter ? handlePanelKeyDown : undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  style={{ ...positionProps.style, width: largura, maxHeight: alturaMaxima }}
                >
                  <ListingOptions
                    baseId={baseId}
                    empty={<p className={styles.empty}>{emptyMessage}</p>}
                    holdsFocus={false}
                    label={label ?? placeholder ?? 'Opções'}
                    listing={listing}
                    loading={loading}
                    onSelect={multiple ? undefined : fechar}
                  />
                  {hasFooter && (
                    <div className={styles.footer}>
                      <span className={styles.status} role="status">
                        {listing.selected.length === 0
                          ? 'Nenhum selecionado'
                          : `${listing.selected.length} ${listing.selected.length === 1 ? 'selecionado' : 'selecionados'}`}
                      </span>
                      <div className={styles.footerActions}>
                        {selectAll && (
                          <Button
                            disabled={listing.status === 'all' || !listing.visible.some((option) => !option.disabled)}
                            onClick={() => {
                              listing.selectAll();
                              inputRef.current?.focus();
                            }}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {texts.selectAll}
                          </Button>
                        )}
                        {clearable && (
                          <Button
                            disabled={listing.selected.length === 0}
                            onClick={() => {
                              listing.clear();
                              inputRef.current?.focus();
                            }}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {texts.clear}
                          </Button>
                        )}
                      </div>
                      {confirm && (
                        <div className={styles.footerActions}>
                          <Button onClick={fecharNoCampo} size="sm" type="button" variant="secondary">
                            {texts.cancel}
                          </Button>
                          <Button onClick={aplicar} size="sm" type="button">
                            {texts.apply}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>,
                container,
              )}
          </>
        );
      }}
    </Field>
  );
}
