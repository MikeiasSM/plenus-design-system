import { useState } from 'react';
import { Button } from '../../actions/Button';
import { InputText } from '../../forms/InputText';
import { IconSearch } from '../../icons';
import styles from './ChartMap.module.css';

export interface MapTableRegionRow {
  classLabel?: string;
  id: string;
  name: string;
  rank?: number;
  selected: boolean;
  /** Parte do total, de 0 a 1. */
  share?: number;
  value: number | null;
  /** Valor formatado, ou a categoria; sem ele, a celula diz que nao ha dado. */
  valueText?: string;
}

export interface MapTableMarkerRow {
  key: string;
  name: string;
  series: string;
  value: string;
}

type SortKey = 'name' | 'value' | 'class' | 'share' | 'rank';

interface ChartMapTableProps {
  formatPercent: (ratio: number) => string;
  markerRows: readonly MapTableMarkerRow[];
  markerValueLabel: string;
  maxHeight?: number;
  noDataLabel: string;
  regionRows: readonly MapTableRegionRow[];
  showClasses: boolean;
  showRank: boolean;
  showShare: boolean;
  showValue: boolean;
  title: string;
  valueLabel: string;
}

/** Quantas linhas aparecem de cada vez: com 645 municipios, a tabela inteira de uma vez pesaria a pagina. */
const PAGE = 50;

/** Ignora caixa e acento, para "sao paulo" achar "São Paulo". */
function normalized(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');
}

/**
 * Leitura completa do mapa: uma linha por regiao, com busca pelo nome e cabecalhos que ordenam. E o caminho ate as
 * regioes de poucos pixels, que o ponteiro e o dedo nao alcancam.
 */
export function ChartMapTable({
  formatPercent,
  markerRows,
  markerValueLabel,
  maxHeight,
  noDataLabel,
  regionRows,
  showClasses,
  showRank,
  showShare,
  showValue,
  title,
  valueLabel,
}: ChartMapTableProps) {
  const numeric = showRank;
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ direction: 'ascending' | 'descending'; key: SortKey }>(
    numeric ? { direction: 'descending', key: 'value' } : { direction: 'ascending', key: 'name' },
  );
  const [limit, setLimit] = useState(PAGE);
  const term = normalized(query.trim());
  const matches = (name: string) => !term || normalized(name).includes(term);

  const sortValue = (row: MapTableRegionRow): number | string | undefined => {
    if (sort.key === 'name') {
      return row.name;
    }

    if (sort.key === 'value' && !numeric) {
      return row.valueText;
    }

    // Faixa, parte do total e posicao seguem o valor: ordenar por elas e ordenar por ele.
    return row.value ?? undefined;
  };
  const sign = sort.direction === 'ascending' ? 1 : -1;
  const rows = regionRows
    .filter((row) => matches(row.name))
    .sort((a, b) => {
      const [first, second] = [sortValue(a), sortValue(b)];

      if (first === undefined || second === undefined) {
        // Sem dado vai ao fim, nos dois sentidos.
        return first === second ? 0 : first === undefined ? 1 : -1;
      }

      const order =
        typeof first === 'number' && typeof second === 'number'
          ? first - second
          : String(first).localeCompare(String(second), 'pt-BR');

      return (sort.key === 'rank' ? -order : order) * sign;
    });
  const markers = markerRows.filter((row) => matches(row.name));

  const columns: { key: SortKey; label: string; numeric: boolean }[] = [
    { key: 'name', label: 'Nome', numeric: false },
    ...(showValue ? [{ key: 'value' as const, label: valueLabel, numeric }] : []),
    ...(showClasses ? [{ key: 'class' as const, label: 'Faixa', numeric: false }] : []),
    ...(showShare ? [{ key: 'share' as const, label: '% do total', numeric: true }] : []),
    ...(showRank ? [{ key: 'rank' as const, label: 'Posição', numeric: true }] : []),
  ];

  function sortBy(key: SortKey) {
    setSort((current) => ({
      direction: current.key === key && current.direction === 'descending' ? 'ascending' : 'descending',
      key,
    }));
  }

  return (
    <div className={styles.tableView}>
      <div className={styles.tableTools}>
        <InputText
          aria-label="Buscar pelo nome"
          icon={<IconSearch />}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimit(PAGE);
          }}
          placeholder="Buscar pelo nome"
          size="sm"
          type="search"
          value={query}
        />
        <span aria-live="polite" className={styles.tableCount}>
          {`${Math.min(limit, rows.length)} de ${rows.length} ${rows.length === 1 ? 'região' : 'regiões'}`}
        </span>
      </div>

      <div
        aria-label={`Tabela: ${title}`}
        className={styles.tableScroll}
        role="region"
        style={{ maxHeight }}
        tabIndex={0}
      >
        <table className={styles.table}>
          <caption className={styles.visuallyHidden}>{title}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  aria-sort={sort.key === column.key ? sort.direction : undefined}
                  className={column.numeric ? styles.numeric : undefined}
                  key={column.key}
                  scope="col"
                >
                  <button className={styles.sortButton} onClick={() => sortBy(column.key)} type="button">
                    {column.label}
                    {sort.key === column.key && <span aria-hidden="true">{sort.direction === 'ascending' ? ' ↑' : ' ↓'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((row) => (
              <tr className={row.selected ? styles.tableSelected : undefined} key={row.id}>
                <th scope="row">{row.name}</th>
                {showValue && (
                  <td className={numeric ? styles.numeric : undefined}>
                    {row.valueText ?? <span className={styles.tableMuted}>{noDataLabel}</span>}
                  </td>
                )}
                {showClasses && <td>{row.classLabel ?? ''}</td>}
                {showShare && <td className={styles.numeric}>{row.share === undefined ? '' : formatPercent(row.share)}</td>}
                {showRank && <td className={styles.numeric}>{row.rank === undefined ? '' : `${row.rank}º`}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {markers.length > 0 && (
          <table className={styles.table}>
            <caption className={styles.tableCaption}>Marcadores</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Série</th>
                <th className={styles.numeric} scope="col">
                  {markerValueLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {markers.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.name}</th>
                  <td>{row.series}</td>
                  <td className={styles.numeric}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rows.length > limit && (
        <Button onClick={() => setLimit((current) => current + PAGE)} size="sm" variant="secondary">
          {`Mostrar mais ${Math.min(PAGE, rows.length - limit)}`}
        </Button>
      )}
    </div>
  );
}
