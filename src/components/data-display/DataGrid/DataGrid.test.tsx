import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { DataGrid, type DataGridColumn } from '.';

interface Order {
  id: string;
  customer: string;
  total: number;
}

const columns: DataGridColumn<Order>[] = [
  { id: 'id', header: 'Nº', width: 80 },
  { id: 'customer', header: 'Cliente' },
  { id: 'total', header: 'Total', type: 'currency' },
];

const orders: Order[] = [
  { id: 'P-1', customer: 'Atacado Sul', total: 300 },
  { id: 'P-2', customer: 'Óleos Brasil', total: 1250 },
  { id: 'P-3', customer: 'Casa Norte', total: 80 },
];

const getRowId = (order: Order) => order.id;

function manyOrders(count: number) {
  return Array.from({ length: count }, (_, i) => ({ id: `P-${i + 1}`, customer: `Cliente ${i + 1}`, total: i }));
}

function renderGrid(props: Partial<Parameters<typeof DataGrid<Order>>[0]> = {}) {
  return render(<DataGrid columns={columns} getRowId={getRowId} label="Pedidos" rows={orders} {...props} />);
}

function bodyRows() {
  return screen.getAllByRole('row').filter((row) => row.getAttribute('aria-rowindex') !== '1');
}

function firstColumn() {
  return bodyRows().map((row) => within(row).getAllByRole('gridcell')[0].textContent);
}

describe('DataGrid', () => {
  it('exposes a named grid with the real row count and formatted cells', () => {
    renderGrid();

    const grid = screen.getByRole('grid', { name: 'Pedidos' });
    expect(grid).toHaveAttribute('aria-rowcount', '4');
    expect(grid).toHaveAttribute('aria-colcount', '3');
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Nº', 'Cliente', 'Total']);
    expect(screen.getByRole('gridcell', { name: 'R$ 1.250,00' })).toHaveAttribute('aria-colindex', '3');
  });

  it('renders custom cells with the row, value and formatted text', () => {
    renderGrid({
      columns: [
        ...columns.slice(0, 2),
        { ...columns[2], renderCell: ({ row, text }) => <strong>{`${row.id}: ${text}`}</strong> },
      ],
    });

    expect(screen.getByRole('gridcell', { name: 'P-3: R$ 80,00' }).querySelector('strong')).not.toBeNull();
  });

  describe('sorting', () => {
    it('cycles a column through ascending, descending and none, and announces it', () => {
      renderGrid();
      const total = screen.getByRole('columnheader', { name: 'Total' });

      fireEvent.click(total);
      expect(total).toHaveAttribute('aria-sort', 'ascending');
      expect(firstColumn()).toEqual(['P-3', 'P-1', 'P-2']);
      expect(screen.getByRole('status')).toHaveTextContent('Ordenado por Total, crescente');

      fireEvent.click(total);
      expect(firstColumn()).toEqual(['P-2', 'P-1', 'P-3']);

      fireEvent.click(total);
      expect(total).not.toHaveAttribute('aria-sort');
      expect(firstColumn()).toEqual(['P-1', 'P-2', 'P-3']);
    });

    it('stacks columns with Shift and sorts from the keyboard', () => {
      const onSortChange = vi.fn();
      renderGrid({ onSortChange });

      fireEvent.click(screen.getByRole('columnheader', { name: 'Total' }));
      fireEvent.keyDown(screen.getByRole('columnheader', { name: 'Cliente' }), { key: 'Enter', shiftKey: true });

      expect(onSortChange).toHaveBeenLastCalledWith([
        { columnId: 'total', direction: 'asc' },
        { columnId: 'customer', direction: 'asc' },
      ]);
    });
  });

  describe('search', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    function searchFor(term: string) {
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar em Pedidos' }), { target: { value: term } });
      act(() => vi.advanceTimersByTime(300));
    }

    it('filters by the displayed text after a pause and announces the result', () => {
      renderGrid({ children: <DataGrid.Toolbar><DataGrid.Search /></DataGrid.Toolbar> });

      searchFor('oleos');

      expect(firstColumn()).toEqual(['P-2']);
      expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '2');
      expect(screen.getByRole('status')).toHaveTextContent('1 linha encontrada');
    });

    it('says when nothing matches', () => {
      renderGrid({ children: <DataGrid.Search /> });

      searchFor('zzz');

      expect(screen.getByRole('gridcell', { name: 'Nenhum registro atende à busca "zzz".' })).toHaveAttribute(
        'aria-colspan',
        '3',
      );
    });
  });

  describe('pagination', () => {
    it('shows one page at a time with the range and keeps the absolute row index', () => {
      renderGrid({ pagination: true, rows: manyOrders(60) });

      expect(screen.getByText('1–25 de 60')).toBeInTheDocument();
      expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '61');

      fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

      expect(firstColumn()[0]).toBe('P-26');
      expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '27');
    });

    it('goes back to the first page when the sort changes', () => {
      const onPageChange = vi.fn();
      renderGrid({ pagination: true, rows: manyOrders(60), defaultPage: 2, onPageChange });

      fireEvent.click(screen.getByRole('columnheader', { name: 'Total' }));

      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe('selection', () => {
    it('selects rows by checkbox, Space and Shift range, and all from the header', () => {
      const onSelectedIdsChange = vi.fn();
      renderGrid({ selectionMode: 'multiple', onSelectedIdsChange });

      fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar P-1' }));
      expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['P-1']);
      expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'true');

      fireEvent.keyDown(screen.getByRole('gridcell', { name: /P-3/ }), { key: ' ', shiftKey: true });
      expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['P-1', 'P-2', 'P-3']);
      expect(screen.getByRole('checkbox', { name: 'Selecionar todas as linhas' })).toBeChecked();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas as linhas' }));
      expect(onSelectedIdsChange).toHaveBeenLastCalledWith([]);
    });

    it('keeps one row in single mode', () => {
      renderGrid({ selectionMode: 'single' });

      fireEvent.keyDown(screen.getByRole('gridcell', { name: /P-1/ }), { key: ' ' });
      fireEvent.keyDown(screen.getByRole('gridcell', { name: /P-2/ }), { key: ' ' });

      expect(bodyRows().map((row) => row.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
      expect(screen.getByRole('grid')).not.toHaveAttribute('aria-multiselectable');
    });
  });

  describe('keyboard', () => {
    it('has a single tab stop that follows the arrows', () => {
      renderGrid();
      const header = screen.getByRole('columnheader', { name: 'Nº' });

      expect([...screen.getByRole('grid').querySelectorAll('[tabindex="0"]')]).toEqual([header]);

      header.focus();
      fireEvent.keyDown(header, { key: 'ArrowDown' });
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
      fireEvent.keyDown(document.activeElement!, { key: 'End', ctrlKey: true });

      expect(document.activeElement).toHaveTextContent(/^R\$\s80,00$/);
      expect([...screen.getByRole('grid').querySelectorAll('[tabindex="0"]')]).toEqual([document.activeElement]);
    });

    it('enters a cell with Enter and leaves it with Escape', () => {
      renderGrid({
        columns: [
          ...columns,
          {
            id: 'action',
            header: 'Ação',
            sortable: false,
            renderCell: ({ row }) => <button tabIndex={-1} type="button">{`Abrir ${row.id}`}</button>,
          },
        ],
      });
      const cell = screen.getByRole('gridcell', { name: 'Abrir P-1' });

      cell.focus();
      fireEvent.keyDown(cell, { key: 'Enter' });
      expect(screen.getByRole('button', { name: 'Abrir P-1' })).toHaveFocus();

      fireEvent.keyDown(screen.getByRole('button', { name: 'Abrir P-1' }), { key: 'Escape' });
      expect(cell).toHaveFocus();
    });
  });

  it('draws only a window of the rows', () => {
    renderGrid({ rows: manyOrders(10_000), height: 400 });

    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '10001');
    expect(bodyRows().length).toBeLessThan(30);
  });

  it('leaves search, sort and pages to the server and asks for each change', () => {
    const onQueryChange = vi.fn();
    renderGrid({ dataMode: 'server', pagination: true, totalRows: 300, defaultPage: 3, onQueryChange });

    fireEvent.click(screen.getByRole('columnheader', { name: 'Total' }));

    expect(onQueryChange).toHaveBeenCalledWith({
      sort: [{ columnId: 'total', direction: 'asc' }],
      search: '',
      page: 1,
      pageSize: 25,
    });
    expect(firstColumn()).toEqual(['P-1', 'P-2', 'P-3']);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '301');
  });

  it('asks the server for the restored state on mount and keeps the page while the total is unknown', () => {
    const onQueryChange = vi.fn();
    const { rerender } = renderGrid({ dataMode: 'server', pagination: true, totalRows: 300, defaultPage: 3, onQueryChange });

    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }));

    rerender(
      <DataGrid
        columns={columns}
        dataMode="server"
        defaultPage={3}
        getRowId={getRowId}
        label="Pedidos"
        loading
        pagination
        rows={[]}
        totalRows={0}
        onQueryChange={onQueryChange}
      />,
    );

    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it('marks only the primary sort column with aria-sort', () => {
    renderGrid();

    fireEvent.click(screen.getByRole('columnheader', { name: 'Total' }));
    fireEvent.click(screen.getByRole('columnheader', { name: 'Cliente' }), { shiftKey: true });

    expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Cliente' })).not.toHaveAttribute('aria-sort');
  });

  it('moves the focus to the row in the same place when the focused row is removed', () => {
    const { rerender } = renderGrid();
    const cell = screen.getByRole('gridcell', { name: 'Atacado Sul' });

    fireEvent.focus(screen.getByRole('grid'));
    cell.focus();
    rerender(<DataGrid columns={columns} getRowId={getRowId} label="Pedidos" rows={orders.slice(1)} />);

    expect(screen.getByRole('gridcell', { name: 'Óleos Brasil' })).toHaveFocus();
  });

  it('follows the focus that lands on a control inside a cell', () => {
    renderGrid({ selectionMode: 'multiple' });

    act(() => screen.getByRole('checkbox', { name: 'Selecionar P-2' }).focus());

    expect(screen.getByRole('gridcell', { name: /P-2/ })).toHaveAttribute('tabindex', '0');
  });

  it('counts the message as the only body row', () => {
    renderGrid({ rows: [] });

    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '2');
    expect(screen.getByRole('gridcell', { name: 'Nenhum registro.' }).parentElement).toHaveAttribute('aria-rowindex', '2');
  });

  it('restores a saved snapshot and reports the next one', () => {
    const onStateChange = vi.fn();
    renderGrid({
      initialState: { version: 1, sort: [{ columnId: 'total', direction: 'desc' }], search: '', page: 1, pageSize: 25 },
      onStateChange,
    });

    expect(firstColumn()).toEqual(['P-2', 'P-1', 'P-3']);

    fireEvent.click(screen.getByRole('columnheader', { name: 'Cliente' }));

    expect(onStateChange).toHaveBeenLastCalledWith({
      version: 1,
      sort: [{ columnId: 'customer', direction: 'asc' }],
      search: '',
      page: 1,
      pageSize: 25,
    });
  });

  it('marks the grid busy while loading and shows a failure in place of the rows', () => {
    const { rerender } = renderGrid({ loading: true });

    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');

    rerender(<DataGrid columns={columns} error="Não foi possível carregar." getRowId={getRowId} label="Pedidos" rows={[]} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar.');
  });
});
