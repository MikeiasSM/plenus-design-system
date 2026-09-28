import { type ComponentPropsWithRef } from 'react';
import styles from './Pagination.module.css';
import { IconChevronLeft, IconChevronRight } from '../../icons';

export interface PaginationProps extends ComponentPropsWithRef<'nav'> {
  label?: string;
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
  /** Quantidade de paginas mostradas de cada lado da atual. */
  siblings?: number;
}

export function Pagination({
  className,
  label = 'Paginacao',
  onPageChange,
  page,
  pageCount,
  siblings = 1,
  ...props
}: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const atual = Math.min(Math.max(page, 1), pageCount);
  const paginas = montarFaixa(atual, pageCount, siblings);

  return (
    <nav {...props} aria-label={label} className={[styles.pagination, className].filter(Boolean).join(' ')}>
      {/* `aria-disabled`, e nao `disabled`: desabilitado na borda, o botao perdia o foco de quem acabou de usa-lo. */}
      <button
        className={styles.step}
        type="button"
        aria-label="Pagina anterior"
        aria-disabled={atual === 1 || undefined}
        onClick={() => atual > 1 && onPageChange(atual - 1)}
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
                aria-label={`Pagina ${numero}`}
                aria-current={numero === atual ? 'page' : undefined}
                onClick={() => onPageChange(numero)}
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
        aria-label="Proxima pagina"
        aria-disabled={atual === pageCount || undefined}
        onClick={() => atual < pageCount && onPageChange(atual + 1)}
      >
        <IconChevronRight size={14} />
      </button>
    </nav>
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
