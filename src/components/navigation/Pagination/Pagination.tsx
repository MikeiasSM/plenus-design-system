import styles from './Pagination.module.css';

export interface PaginationProps {
  label?: string;
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
  /** Quantidade de paginas mostradas de cada lado da atual. */
  siblings?: number;
}

export function Pagination({
  label = 'Paginacao',
  onPageChange,
  page,
  pageCount,
  siblings = 1,
}: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  const atual = Math.min(Math.max(page, 1), pageCount);
  const paginas = montarFaixa(atual, pageCount, siblings);

  return (
    <nav className={styles.pagination} aria-label={label}>
      <button
        className={styles.step}
        type="button"
        aria-label="Pagina anterior"
        disabled={atual === 1}
        onClick={() => onPageChange(atual - 1)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
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
        disabled={atual === pageCount}
        onClick={() => onPageChange(atual + 1)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </nav>
  );
}

// Primeira e ultima pagina sempre visiveis; null representa a reticencia.
export function montarFaixa(atual: number, total: number, vizinhos: number): (number | null)[] {
  // Abaixo deste limite a reticencia nao economizaria espaco algum.
  const limite = vizinhos * 2 + 5;

  if (total <= limite) {
    return Array.from({ length: total }, (_, indice) => indice + 1);
  }

  const inicio = Math.max(2, atual - vizinhos);
  const fim = Math.min(total - 1, atual + vizinhos);
  const faixa: (number | null)[] = [1];

  if (inicio > 2) {
    faixa.push(null);
  }

  for (let i = inicio; i <= fim; i += 1) {
    faixa.push(i);
  }

  if (fim < total - 1) {
    faixa.push(null);
  }

  if (total > 1) {
    faixa.push(total);
  }

  return faixa;
}
