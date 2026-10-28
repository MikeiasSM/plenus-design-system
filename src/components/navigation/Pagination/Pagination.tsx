import { type ComponentPropsWithRef } from 'react';
import { formatNumber } from '../../../utils/formatters';
import styles from './Pagination.module.css';
import { IconChevronLeft, IconChevronRight } from '../../icons';

/** Posições, contadas de 1, do primeiro e do último item da página, e o total de itens. */
export interface PaginationRange {
  end: number;
  start: number;
  total: number;
}

export interface PaginationProps extends ComponentPropsWithRef<'nav'> {
  /** Suspende a troca de pagina, como enquanto a pagina pedida carrega. Os botoes continuam focaveis. */
  disabled?: boolean;
  /** Troca o texto do intervalo, que por padrão é `1.201–1.250 de 4.380`. */
  formatRange?: (range: PaginationRange) => string;
  label?: string;
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
  /** Itens por página. Com `totalItems`, mostra o intervalo da página atual. */
  pageSize?: number;
  /** Quantidade de paginas mostradas de cada lado da atual. */
  siblings?: number;
  /** Total de itens. Com `pageSize`, mostra o intervalo da página atual. */
  totalItems?: number;
}

export function Pagination({
  className,
  disabled = false,
  formatRange,
  label = 'Paginação',
  onPageChange,
  page,
  pageCount,
  pageSize,
  siblings = 1,
  totalItems,
  ...props
}: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const atual = Math.min(Math.max(page, 1), pageCount);
  const paginas = montarFaixa(atual, pageCount, siblings);

  function irPara(pagina: number) {
    if (!disabled) {
      onPageChange(pagina);
    }
  }

  return (
    <nav {...props} aria-label={label} className={[styles.pagination, className].filter(Boolean).join(' ')}>
      {totalItems !== undefined && pageSize !== undefined && (
        <PaginationRangeText
          formatRange={formatRange}
          range={{
            start: (atual - 1) * pageSize + 1,
            end: Math.min(atual * pageSize, totalItems),
            total: totalItems,
          }}
        />
      )}
      {/* `aria-disabled`, e nao `disabled`: desabilitado na borda, o botao perdia o foco de quem acabou de usa-lo. */}
      <button
        className={styles.step}
        type="button"
        aria-label="Página anterior"
        aria-disabled={disabled || atual === 1 || undefined}
        onClick={() => atual > 1 && irPara(atual - 1)}
      >
        <IconChevronLeft size={14} />
      </button>
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
              >
                {numero}
              </button>
            </li>
          ),
        )}
      </ol>
      <button
        className={styles.step}
        type="button"
        aria-label="Próxima página"
        aria-disabled={disabled || atual === pageCount || undefined}
        onClick={() => atual < pageCount && irPara(atual + 1)}
      >
        <IconChevronRight size={14} />
      </button>
    </nav>
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
      <span className={styles.hiddenText}>{`Itens ${inicio} a ${fim} de ${total}`}</span>
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
