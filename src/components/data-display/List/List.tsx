import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { Checkbox } from '../../forms/Checkbox';
import { ListingOptions, optionId } from './ListingOptions';
import { useListing, type Listing, type ListingItem, type ListingSelectionMode } from './useListing';
import styles from './List.module.css';

export type ListSelectionMode = ListingSelectionMode;
export type ListItem = ListingItem;

export interface ListProps {
  children: ReactNode;
  defaultValue?: readonly ListItem[];
  items: readonly ListItem[];
  label?: string;
  loading?: boolean;
  loadingMessage?: string;
  onSearch?: (term: string) => void;
  onSelectionChange?: (items: readonly ListItem[]) => void;
  selectionMode?: ListSelectionMode;
  value?: readonly ListItem[];
}

interface ListContextValue {
  baseId: string;
  claimFocus: () => void;
  label?: string;
  listing: Listing;
  loading: boolean;
  loadingMessage: string;
  searchPresent: boolean;
}

const ListContext = createContext<ListContextValue | undefined>(undefined);

function useListContext(part: string) {
  const context = useContext(ListContext);

  if (!context) {
    throw new Error(part + ' deve ser usado dentro de List.');
  }

  return context;
}

export function List({
  children,
  defaultValue,
  items,
  label,
  loading = false,
  loadingMessage = 'Carregando',
  onSearch,
  onSelectionChange,
  selectionMode = 'none',
  value,
}: ListProps) {
  const baseId = useId();
  const [searchPresent, setSearchPresent] = useState(false);
  const listing = useListing({ defaultValue, items, onSearch, onSelectionChange, selectionMode, value });

  const context: ListContextValue = {
    baseId,
    claimFocus: useCallback(() => setSearchPresent(true), []),
    label,
    listing,
    loading,
    loadingMessage,
    searchPresent,
  };

  return (
    <div className={styles.list}>
      <ListContext.Provider value={context}>{children}</ListContext.Provider>
    </div>
  );
}

export interface ListSearchProps {
  placeholder?: string;
}

function ListSearch({ placeholder = 'Buscar' }: ListSearchProps) {
  const { baseId, claimFocus, label, listing } = useListContext('List.Search');

  useEffect(claimFocus, [claimFocus]);

  const activeIndex = listing.visible.findIndex((item) => item.value === listing.focusedKey);

  return (
    <input
      aria-activedescendant={activeIndex >= 0 ? optionId(baseId, activeIndex) : undefined}
      aria-controls={baseId + '-options'}
      aria-label={label ? 'Buscar em ' + label : placeholder}
      autoComplete="off"
      className={styles.search}
      onChange={(event) => listing.filter(event.target.value)}
      onKeyDown={listing.handleKeyDown}
      placeholder={placeholder}
      type="search"
      value={listing.term}
    />
  );
}

export interface ListOptionsProps {
  height?: number;
}

function ListOptions({ height }: ListOptionsProps) {
  const { baseId, label, listing, loading, loadingMessage, searchPresent } = useListContext('List.Options');

  return (
    <ListingOptions
      baseId={baseId}
      height={height}
      label={label}
      holdsFocus={!searchPresent}
      listing={listing}
      loading={loading}
      loadingMessage={loadingMessage}
      onKeyDown={searchPresent ? undefined : listing.handleKeyDown}
    />
  );
}

export interface ListSelectAllProps {
  label?: string;
}

function ListSelectAll({ label = 'Selecionar todos' }: ListSelectAllProps) {
  const { listing } = useListContext('List.SelectAll');

  if (listing.selectionMode !== 'multiple') {
    return null;
  }

  return (
    <Checkbox
      checked={listing.status === 'all'}
      indeterminate={listing.status === 'partial'}
      label={label}
      onChange={() => listing.toggleAll()}
    />
  );
}

export interface ListEmptyProps {
  children: ReactNode;
}

function ListEmpty({ children }: ListEmptyProps) {
  const { listing, loading } = useListContext('List.Empty');

  if (loading || listing.visible.length > 0) {
    return null;
  }

  return <p className={styles.empty}>{children}</p>;
}

List.Search = ListSearch;
List.SelectAll = ListSelectAll;
List.Options = ListOptions;
List.Empty = ListEmpty;
