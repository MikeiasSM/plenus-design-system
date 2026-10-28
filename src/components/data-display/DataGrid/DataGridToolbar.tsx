import { useEffect, useRef, useState, type ComponentPropsWithRef } from 'react';
import { InputText } from '../../forms/InputText';
import { IconSearch } from '../../icons';
import { useDataGridContext } from './dataGridContext';
import styles from './DataGrid.module.css';

/** Espera depois da última tecla antes de buscar: no servidor, cada tecla seria uma consulta. */
const SEARCH_DELAY = 250;

export type DataGridToolbarProps = ComponentPropsWithRef<'div'>;

export function DataGridToolbar({ className, ...props }: DataGridToolbarProps) {
  return <div {...props} className={[styles.toolbar, className].filter(Boolean).join(' ')} />;
}

export interface DataGridSearchProps {
  className?: string;
  label?: string;
  placeholder?: string;
}

export function DataGridSearch({ className, label, placeholder = 'Buscar' }: DataGridSearchProps) {
  const { label: gridLabel, search, setSearch } = useDataGridContext('DataGrid.Search');
  const [draft, setDraft] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);
  const sent = useRef(search);

  if (search !== lastSearch) {
    setLastSearch(search);
    if (search !== sent.current) {
      setDraft(search);
    }
  }

  useEffect(() => {
    if (draft === search) {
      return undefined;
    }

    const timer = setTimeout(() => {
      sent.current = draft;
      setSearch(draft);
    }, SEARCH_DELAY);
    return () => clearTimeout(timer);
  }, [draft, search, setSearch]);

  return (
    <InputText
      aria-label={label ?? `Buscar em ${gridLabel}`}
      className={[styles.search, className].filter(Boolean).join(' ')}
      icon={<IconSearch size={14} />}
      placeholder={placeholder}
      size="sm"
      type="search"
      value={draft}
      onValueChange={setDraft}
    />
  );
}
