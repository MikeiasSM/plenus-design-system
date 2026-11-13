import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type RefObject } from 'react';
import { formatNumber } from '../../../utils/formatters';
import { blockRepeatedPress } from '../../../utils/press/press';
import { Select } from '../../forms/Select';
import stepsStyles from '../Steps/Steps.module.css';
import styles from './Pagination.module.css';
import { IconChevronBarLeft, IconChevronBarRight, IconChevronLeft, IconChevronRight } from '../../icons';

/** Posições, contadas de 1, do primeiro e do último item da página, e o total de itens. */
export interface PaginationRange {
  end: number;
  start: number;
  total: number;
}

export interface PaginationProps extends ComponentPropsWithRef<'nav'> {
  /** Força o modo compacto: anterior, o texto "3 de 12" e próxima. Sem ele, o modo compacto vem sozinho quando a largura não comporta os números. */
  compact?: boolean;
  /** Pagina inicial no modo nao controlado. */
  defaultPage?: number;
  /** Tamanho de pagina inicial no modo nao controlado. Sem ele, a primeira opcao de `pageSizeOptions`. */
  defaultPageSize?: number;
  /** Suspende os botoes de pagina, como enquanto a pagina pedida carrega; continuam focaveis. O seletor de tamanho segue ativo. */
  disabled?: boolean;
  /** Troca o texto do modo compacto, que por padrão é `3 de 12`; o devolvido é também o que se anuncia. */
  formatCompact?: (page: number, pageCount: number) => string;
  /** Troca o texto do intervalo, que por padrão é `1.201–1.250 de 4.380`. */
  formatRange?: (range: PaginationRange) => string;
  label?: string;
  onPageChange?: (page: number) => void;
  /** Recebe o tamanho escolhido. A pagina muda junto, para a que contem o primeiro item da atual. */
  onPageSizeChange?: (pageSize: number) => void;
  page?: number;
  /** Total de paginas. Sem ele, sai de `totalItems` e `pageSize`. */
  pageCount?: number;
  /** Itens por página. Com `totalItems`, mostra o intervalo da página atual. */
  pageSize?: number;
  /** Tamanhos oferecidos. Com eles, mostra o seletor de itens por página. */
  pageSizeOptions?: readonly number[];
  /** Mostra os passos para a primeira e a última página. */
  showFirstLast?: boolean;
  /** Quantidade de paginas mostradas de cada lado da atual. */
  siblings?: number;
  /** Total de itens. Com `pageSize`, mostra o intervalo da página atual. */
  totalItems?: number;
}

export function Pagination({
  className,
  compact = false,
  defaultPage = 1,
  defaultPageSize,
  disabled = false,
  formatCompact,
  formatRange,
  label = 'Paginação',
  onPageChange,
  onPageSizeChange,
  page,
  pageCount,
  pageSize,
  pageSizeOptions,
  showFirstLast = false,
  siblings = 1,
  totalItems,
  ...props
}: PaginationProps) {
  const [internalPage, setInternalPage] = useState(defaultPage);
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize ?? pageSizeOptions?.[0]);
  const tamanho = pageSize ?? internalPageSize;
  const totalDePaginas = pageCount ?? (totalItems !== undefined && tamanho ? Math.ceil(totalItems / tamanho) : 0);
  const renderiza = totalDePaginas > 1 || Boolean(pageSizeOptions);
  const temPassos = totalDePaginas > 1;
  const passos = useRef<HTMLDivElement>(null);
  const nivelMedido = useRef<number | null>(null);
  const [largura, setLargura] = useState(-1);
  const [ajuste, setAjuste] = useState({ chave: '', nivel: 0 });
  const ultimo = siblings + 1 + (showFirstLast ? 1 : 0);
  const chaveDe = (medida: number) => `${medida}|${totalDePaginas}|${siblings}|${showFirstLast}|${compact}`;
  const chave = chaveDe(largura);
  const nivel = ajuste.chave === chave ? ajuste.nivel : compact ? siblings + 1 : 0;

  useEffect(() => {
    const nav = passos.current?.parentElement;

    if (!nav || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observador = new ResizeObserver(() => setLargura(Math.round(nav.getBoundingClientRect().width)));
    observador.observe(nav);

    return () => observador.disconnect();
  }, [temPassos]);

  useLayoutEffect(() => {
    const nav = passos.current?.parentElement;

    if (!passos.current || !nav) {
      nivelMedido.current = null;
      return;
    }

    const medida = Math.round(nav.getBoundingClientRect().width);
    const nivelMudou = nivelMedido.current !== null && nivelMedido.current !== nivel;
    nivelMedido.current = nivel;

    if (medida !== largura) {
      setLargura(medida);

      if (nivelMudou) {
        setAjuste({ chave: chaveDe(medida), nivel });
      }

      return;
    }

    if (nivel < ultimo && passos.current.getBoundingClientRect().width > nav.getBoundingClientRect().width + 0.5) {
      setAjuste({ chave, nivel: nivel + 1 });
    }
  });

  if (!renderiza) {
    return null;
  }

  const atual = Math.min(Math.max(page ?? internalPage, 1), Math.max(totalDePaginas, 1));
  const modoCompacto = nivel > siblings;
  const paginas = montarFaixa(atual, totalDePaginas, Math.max(siblings - nivel, 0));
  const intervalo =
    totalItems && tamanho
      ? { start: (atual - 1) * tamanho + 1, end: Math.min(atual * tamanho, totalItems), total: totalItems }
      : undefined;

  function mudarPagina(pagina: number) {
    if (page === undefined) {
      setInternalPage(pagina);
    }
    onPageChange?.(pagina);
  }

  function irPara(pagina: number) {
    if (!disabled) {
      mudarPagina(pagina);
    }
  }

  function trocarTamanho(novo: number) {
    const pagina = tamanho ? Math.floor(((atual - 1) * tamanho) / novo) + 1 : 1;
    if (pageSize === undefined) {
      setInternalPageSize(novo);
    }
    onPageSizeChange?.(novo);
    if (pagina !== atual) {
      mudarPagina(pagina);
    }
  }

  return (
    <nav {...props} aria-label={label} className={[styles.pagination, className].filter(Boolean).join(' ')}>
      {intervalo && <PaginationRangeText formatRange={formatRange} range={intervalo} />}
      {pageSizeOptions && (
        <span className={styles.pageSize}>
          <span aria-hidden="true">Itens por página</span>
          <Select
            aria-label="Itens por página"
            options={pageSizeOptions.map((opcao) => ({ value: String(opcao), label: formatNumber(opcao) }))}
            size="sm"
            value={tamanho === undefined ? undefined : String(tamanho)}
            onValueChange={(valor) => trocarTamanho(Number(valor))}
          />
        </span>
      )}
      {totalDePaginas > 1 && (
        <PaginationSteps
          atual={atual}
          compactText={modoCompacto ? (formatCompact ?? formatarCompacto)(atual, totalDePaginas) : undefined}
          disabled={disabled}
          irPara={irPara}
          paginas={paginas}
          passos={passos}
          showFirstLast={showFirstLast && nivel <= siblings + 1}
          totalDePaginas={totalDePaginas}
        />
      )}
    </nav>
  );
}

function formatarCompacto(pagina: number, total: number) {
  return `${formatNumber(pagina)} de ${formatNumber(total)}`;
}

function PaginationSteps({
  atual,
  compactText,
  disabled,
  irPara,
  paginas,
  passos,
  showFirstLast,
  totalDePaginas,
}: {
  atual: number;
  compactText?: string;
  disabled: boolean;
  irPara: (pagina: number) => void;
  paginas: (number | null)[];
  passos: RefObject<HTMLDivElement | null>;
  showFirstLast: boolean;
  totalDePaginas: number;
}) {
  const noInicio = disabled || atual === 1 || undefined;
  const noFim = disabled || atual === totalDePaginas || undefined;

  return (
    <div className={styles.steps} ref={passos}>
      {showFirstLast && (
        <button
          className={styles.step}
          type="button"
          aria-label="Primeira página"
          aria-disabled={noInicio}
          onClick={() => atual > 1 && irPara(1)}
          onKeyDown={blockRepeatedPress}
        >
          <IconChevronBarLeft size={14} />
        </button>
      )}
      {/* `aria-disabled`, e nao `disabled`: desabilitado na borda, o botao perdia o foco de quem acabou de usa-lo. */}
      <button
        className={styles.step}
        type="button"
        aria-label="Página anterior"
        aria-disabled={noInicio}
        onClick={() => atual > 1 && irPara(atual - 1)}
        onKeyDown={blockRepeatedPress}
      >
        <IconChevronLeft size={14} />
      </button>
      {compactText === undefined ? (
        <ol className={styles.list}>
          {paginas.map((numero, indice) =>
            numero === null ? (
              <li className={styles.gap} key={`gap-${indice}`} aria-hidden="true">
                &hellip;
              </li>
            ) : (
              <li key={numero}>
                <button
                  className={[styles.page, numero === atual && styles.current].filter(Boolean).join(' ')}
                  type="button"
                  aria-label={`Página ${numero}`}
                  aria-current={numero === atual ? 'page' : undefined}
                  aria-disabled={disabled || undefined}
                  onClick={() => irPara(numero)}
                  onKeyDown={blockRepeatedPress}
                >
                  {numero}
                </button>
              </li>
            ),
          )}
        </ol>
      ) : (
        <span className={styles.compactText} role="status">
          <span aria-current="page">{compactText}</span>
        </span>
      )}
      <button
        className={styles.step}
        type="button"
        aria-label="Próxima página"
        aria-disabled={noFim}
        onClick={() => atual < totalDePaginas && irPara(atual + 1)}
        onKeyDown={blockRepeatedPress}
      >
        <IconChevronRight size={14} />
      </button>
      {showFirstLast && (
        <button
          className={styles.step}
          type="button"
          aria-label="Última página"
          aria-disabled={noFim}
          onClick={() => atual < totalDePaginas && irPara(totalDePaginas)}
          onKeyDown={blockRepeatedPress}
        >
          <IconChevronBarRight size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Região viva: ao trocar de página, o leitor de tela anuncia o novo intervalo, e só ele, pois os botões não mudam
 * de nome. O travessão some na fala de muitos leitores, e o texto padrão tem uma forma falada à parte.
 */
function PaginationRangeText({
  formatRange,
  range,
}: {
  formatRange?: (range: PaginationRange) => string;
  range: PaginationRange;
}) {
  if (formatRange) {
    return (
      <span className={styles.range} role="status">
        {formatRange(range)}
      </span>
    );
  }

  const [inicio, fim, total] = [range.start, range.end, range.total].map((numero) => formatNumber(numero));

  return (
    <span className={styles.range} role="status">
      <span aria-hidden="true">{`${inicio}–${fim} de ${total}`}</span>
      <span className={stepsStyles.hiddenText}>{`Itens ${inicio} a ${fim} de ${total}`}</span>
    </span>
  );
}

/**
 * Primeira e ultima pagina sempre visiveis; null representa a reticencia. A faixa tem sempre as mesmas vagas: perto
 * da ponta a janela encosta nela em vez de encolher, e reticencia nunca esconde uma pagina so.
 */
export function montarFaixa(atual: number, total: number, vizinhos: number): (number | null)[] {
  const vagas = vizinhos * 2 + 5;

  if (total <= vagas) {
    return Array.from({ length: total }, (_, indice) => indice + 1);
  }

  const inicio = Math.max(Math.min(atual - vizinhos, total - vizinhos * 2 - 2), 3);
  const fim = Math.min(Math.max(atual + vizinhos, vizinhos * 2 + 3), total - 2);
  const janela = Array.from({ length: fim - inicio + 1 }, (_, indice) => inicio + indice);

  return [1, inicio > 3 ? null : 2, ...janela, fim < total - 2 ? null : total - 1, total];
}
