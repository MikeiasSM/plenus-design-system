import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { DataGrid, type DataGridColumn, type DataGridDetailContext } from '.';

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
      columns: { hidden: [], order: ['id', 'customer', 'total'], pinned: {}, widths: {} },
    });
  });

  it('marks the grid busy while loading and shows a failure in place of the rows', () => {
    const { rerender } = renderGrid({ loading: true });

    expect(screen.getByRole('grid')).toHaveAttribute('aria-busy', 'true');

    rerender(<DataGrid columns={columns} error="Não foi possível carregar." getRowId={getRowId} label="Pedidos" rows={[]} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar.');
  });

  describe('columns', () => {
    function headers() {
      return screen.getAllByRole('columnheader').map((header) => header.textContent);
    }

    function header(name: string) {
      return screen.getByRole('columnheader', { name });
    }

    it('opens the column menu with Ctrl+Enter, sorts from it and gives the focus back to the title', async () => {
      renderGrid();
      act(() => header('Cliente').focus());

      fireEvent.keyDown(header('Cliente'), { key: 'Enter', ctrlKey: true });
      const menu = screen.getByRole('menu', { name: 'Menu da coluna Cliente' });
      fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: 'Ordenar decrescente' }));

      expect(firstColumn()).toEqual(['P-2', 'P-3', 'P-1']);
      await waitFor(() => expect(header('Cliente')).toHaveFocus());
    });

    it('hides a column from its menu and reports the column state', () => {
      const onColumnStateChange = vi.fn();
      renderGrid({ onColumnStateChange });

      fireEvent.click(screen.getByRole('button', { name: 'Menu da coluna Total' }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Ocultar coluna' }));

      expect(headers()).toEqual(['Nº', 'Cliente']);
      expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '2');
      expect(onColumnStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ hidden: ['total'] }));
      expect(screen.getAllByRole('status').at(-1)).toHaveTextContent('Total oculta');
    });

    it('gives the focus of a hidden column to the one that takes its place', async () => {
      renderGrid();
      act(() => header('Cliente').focus());

      fireEvent.keyDown(header('Cliente'), { key: 'Enter', ctrlKey: true });
      fireEvent.click(screen.getByRole('menuitem', { name: 'Ocultar coluna' }));

      await waitFor(() => expect(header('Total')).toHaveFocus());
    });

    it('pins a column to the edge, where it sticks', () => {
      renderGrid();

      fireEvent.click(screen.getByRole('button', { name: 'Menu da coluna Total' }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Fixar à esquerda' }));

      expect(headers()).toEqual(['Total', 'Nº', 'Cliente']);
      expect(header('Total').style.left).toBe('0px');
      expect(screen.getByRole('gridcell', { name: /^R\$\s300,00$/ }).style.left).toBe('0px');
    });

    it('moves a column with Ctrl+Shift and the arrows, keeping the focus on it', () => {
      renderGrid();
      act(() => header('Nº').focus());

      fireEvent.keyDown(header('Nº'), { key: 'ArrowRight', ctrlKey: true, shiftKey: true });

      expect(headers()).toEqual(['Cliente', 'Nº', 'Total']);
      expect(header('Nº')).toHaveFocus();
      expect(screen.getAllByRole('status').at(-1)).toHaveTextContent('Nº na posição 2 de 3');
    });

    it('moves a column by dragging its title onto another', () => {
      renderGrid();
      const dataTransfer = { effectAllowed: '', setData: vi.fn() };

      fireEvent.dragStart(header('Total'), { dataTransfer });
      fireEvent.dragOver(header('Nº'), { dataTransfer });
      fireEvent.drop(header('Nº'), { dataTransfer });

      expect(headers()).toEqual(['Total', 'Nº', 'Cliente']);
    });

    it('restores the columns from a saved snapshot, ignoring the ones that no longer exist', () => {
      renderGrid({
        initialState: {
          version: 1,
          sort: [],
          search: '',
          page: 1,
          pageSize: 25,
          columns: { order: ['total', 'removed', 'id', 'customer'], hidden: ['id'], pinned: {}, widths: { customer: 200 } },
        },
      });

      expect(headers()).toEqual(['Total', 'Cliente']);
      expect(header('Cliente').style.width).toBe('200px');
    });
  });

  describe('detail', () => {
    interface Item {
      id: string;
      product: string;
    }

    const itemColumns: DataGridColumn<Item>[] = [{ id: 'product', header: 'Produto' }];
    const itemsOf = (order: Order): Item[] => [
      { id: `${order.id}-a`, product: `Cabo de ${order.id}` },
      { id: `${order.id}-b`, product: `Disjuntor de ${order.id}` },
    ];

    function renderItems({ row }: DataGridDetailContext<Order>) {
      return <DataGrid columns={itemColumns} getRowId={(item) => item.id} label={`Itens de ${row.id}`} rows={itemsOf(row)} />;
    }

    function renderNotes({ row, state, setState }: DataGridDetailContext<Order>) {
      const note = typeof state.note === 'string' ? state.note : '';
      return <input aria-label={`Nota de ${row.id}`} value={note} onChange={(event) => setState({ note: event.target.value })} />;
    }

    function rowOf(name: string) {
      return screen.getByRole('gridcell', { name }).closest('[role="row"]');
    }

    it('turns into a tree grid with an expander only on the rows that have a detail', () => {
      renderGrid({ renderDetail: renderItems, rowHasDetail: (order) => order.id !== 'P-3' });

      expect(screen.getByRole('treegrid', { name: 'Pedidos' })).toBeInTheDocument();
      expect(rowOf('Atacado Sul')).toHaveAttribute('aria-expanded', 'false');
      expect(rowOf('Atacado Sul')).toHaveAttribute('aria-level', '1');
      expect(rowOf('Casa Norte')).not.toHaveAttribute('aria-expanded');
      expect(screen.queryByRole('button', { name: 'Expandir P-3' })).not.toBeInTheDocument();
    });

    it('opens a full-width detail named after its row, right below it', () => {
      renderGrid({ renderDetail: renderItems });

      fireEvent.click(screen.getByRole('button', { name: 'Expandir P-1' }));

      const detail = screen.getByRole('gridcell', { name: 'Detalhe de P-1' });
      expect(detail).toHaveAttribute('aria-colspan', '3');
      expect(rowOf('Atacado Sul')).toHaveAttribute('aria-expanded', 'true');
      expect(within(detail).getByRole('grid', { name: 'Itens de P-1' })).toBeInTheDocument();
      expect(rowOf('Atacado Sul')?.nextElementSibling).toBe(detail.parentElement);
      expect(screen.getAllByRole('status').at(-1)).toHaveTextContent('P-1 expandido');
    });

    it('toggles with Ctrl+Enter and keeps one open in single mode', () => {
      renderGrid({ renderDetail: renderItems, expandMode: 'single' });

      fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Atacado Sul' }), { key: 'Enter', ctrlKey: true });
      fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Óleos Brasil' }), { key: 'Enter', ctrlKey: true });

      expect(screen.queryByRole('gridcell', { name: 'Detalhe de P-1' })).not.toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: 'Detalhe de P-2' })).toBeInTheDocument();

      fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Óleos Brasil' }), { key: 'Enter', ctrlKey: true });
      expect(screen.queryByRole('gridcell', { name: 'Detalhe de P-2' })).not.toBeInTheDocument();
    });

    it('reaches the detail with the arrow, enters the nested grid with Enter and comes back with Escape', () => {
      renderGrid({ renderDetail: renderItems, defaultExpandedIds: ['P-1'] });
      const cell = screen.getByRole('gridcell', { name: 'Atacado Sul' });

      act(() => cell.focus());
      fireEvent.keyDown(cell, { key: 'ArrowDown' });
      const detail = screen.getByRole('gridcell', { name: 'Detalhe de P-1' });
      expect(detail).toHaveFocus();

      fireEvent.keyDown(detail, { key: 'ArrowRight' });
      expect(detail).toHaveFocus();

      fireEvent.keyDown(detail, { key: 'Enter' });
      const nestedHeader = screen.getByRole('columnheader', { name: 'Produto' });
      expect(nestedHeader).toHaveFocus();

      fireEvent.keyDown(nestedHeader, { key: 'ArrowDown' });
      expect(screen.getByRole('gridcell', { name: 'Cabo de P-1' })).toHaveFocus();

      fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Cabo de P-1' }), { key: 'Escape' });
      expect(detail).toHaveFocus();

      fireEvent.keyDown(detail, { key: 'ArrowDown' });
      expect(screen.getByRole('gridcell', { name: 'Óleos Brasil' })).toHaveFocus();
    });

    it('keeps the detail state and the nested grid state after collapsing and opening again', () => {
      renderGrid({
        renderDetail: (context) => (
          <>
            {renderNotes(context)}
            {renderItems(context)}
          </>
        ),
      });
      const toggle = () =>
        fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Atacado Sul' }), { key: 'Enter', ctrlKey: true });

      toggle();
      fireEvent.change(screen.getByRole('textbox', { name: 'Nota de P-1' }), { target: { value: 'Conferir frete' } });
      fireEvent.click(screen.getByRole('columnheader', { name: 'Produto' }));
      fireEvent.click(screen.getByRole('columnheader', { name: 'Produto' }));
      toggle();
      expect(screen.queryByRole('textbox', { name: 'Nota de P-1' })).not.toBeInTheDocument();

      toggle();
      expect(screen.getByRole('textbox', { name: 'Nota de P-1' })).toHaveValue('Conferir frete');
      expect(screen.getByRole('columnheader', { name: 'Produto' })).toHaveAttribute('aria-sort', 'descending');
    });

    it('nests without a scroll of its own', () => {
      renderGrid({ renderDetail: renderItems, defaultExpandedIds: ['P-1'] });

      const nested = screen.getByRole('grid', { name: 'Itens de P-1' });
      expect((nested.parentElement as HTMLElement).style.height).toBe('');
    });

    it('runs the chosen row click action, but not on the controls of the row', () => {
      const onSelectedIdsChange = vi.fn();
      renderGrid({ renderDetail: renderItems, rowClickAction: 'expand', selectionMode: 'multiple', onSelectedIdsChange });

      fireEvent.click(screen.getByRole('gridcell', { name: 'Óleos Brasil' }));
      expect(screen.getByRole('gridcell', { name: 'Detalhe de P-2' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar P-1' }));
      expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['P-1']);
      expect(screen.queryByRole('gridcell', { name: 'Detalhe de P-1' })).not.toBeInTheDocument();
    });

    it('activates the row with a click or Enter, leaving F2 for the cell controls', () => {
      const onRowActivate = vi.fn();
      renderGrid({ rowClickAction: 'activate', onRowActivate });

      fireEvent.click(screen.getByRole('gridcell', { name: 'Casa Norte' }));
      fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Atacado Sul' }), { key: 'Enter' });

      expect(onRowActivate.mock.calls.map(([order]) => order.id)).toEqual(['P-3', 'P-1']);
    });

    it('asks for the change when the expansion is controlled', () => {
      const onExpandedIdsChange = vi.fn();
      renderGrid({ renderDetail: renderItems, expandedIds: [], onExpandedIdsChange });

      fireEvent.click(screen.getByRole('button', { name: 'Expandir P-2' }));

      expect(onExpandedIdsChange).toHaveBeenCalledWith(['P-2']);
      expect(screen.queryByRole('gridcell', { name: 'Detalhe de P-2' })).not.toBeInTheDocument();
    });

    it('gives the focus back to the parent row when the product closes the detail', () => {
      const props = { columns, getRowId, label: 'Pedidos', rows: orders, renderDetail: renderNotes };
      const { rerender } = render(<DataGrid {...props} expandedIds={['P-1']} />);

      act(() => screen.getByRole('textbox', { name: 'Nota de P-1' }).focus());
      rerender(<DataGrid {...props} expandedIds={[]} />);

      expect(document.activeElement).toHaveAttribute('data-row', 'P-1');
    });

    it('leaves a grid in the aside dialog on its own scroll, not nested', () => {
      renderGrid({
        defaultExpandedIds: ['P-1'],
        renderDetail: ({ row }) => (
          <DataGrid.DetailLayout
            aside={<DataGrid columns={itemColumns} getRowId={(item) => item.id} label="Entregas" rows={itemsOf(row)} />}
            asidePlacement="dialog"
            asideTitle="Entregas"
            onAsideClose={vi.fn()}
          >
            {renderItems({ row, level: 1, state: {}, setState: vi.fn() })}
          </DataGrid.DetailLayout>
        ),
      });

      const inDialog = screen.getByRole('grid', { name: 'Entregas', hidden: true });
      expect((inDialog.parentElement as HTMLElement).style.height).toBe('480px');
    });
  });

  describe('DetailLayout', () => {
    it('places the aside next to the content and closes it', () => {
      const onAsideClose = vi.fn();
      render(
        <DataGrid.DetailLayout aside={<p>Gráfico</p>} asideTitle="Entregas" onAsideClose={onAsideClose}>
          <p>Itens</p>
        </DataGrid.DetailLayout>,
      );

      expect(screen.getByRole('region', { name: 'Entregas' })).toHaveTextContent('Gráfico');
      fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
      expect(onAsideClose).toHaveBeenCalled();
    });

    it('shows only the content without an aside, and the aside in a dialog when asked', () => {
      const { rerender } = render(
        <DataGrid.DetailLayout onAsideClose={vi.fn()} asideTitle="Entregas">
          <p>Itens</p>
        </DataGrid.DetailLayout>,
      );
      expect(screen.queryByRole('region')).not.toBeInTheDocument();

      rerender(
        <DataGrid.DetailLayout onAsideClose={vi.fn()} aside={<p>Gráfico</p>} asidePlacement="dialog" asideTitle="Entregas">
          <p>Itens</p>
        </DataGrid.DetailLayout>,
      );
      expect(screen.getByRole('dialog', { name: 'Entregas' })).toHaveTextContent('Gráfico');
    });

    it('keeps the content mounted when the aside opens, in any placement', () => {
      const content = <input aria-label="Filtro dos itens" />;
      const { rerender } = render(<DataGrid.DetailLayout onAsideClose={vi.fn()} asidePlacement="dialog" asideTitle="Entregas">{content}</DataGrid.DetailLayout>);
      const input = screen.getByRole('textbox', { name: 'Filtro dos itens' });

      rerender(
        <DataGrid.DetailLayout onAsideClose={vi.fn()} aside={<p>Gráfico</p>} asidePlacement="dialog" asideTitle="Entregas">
          {content}
        </DataGrid.DetailLayout>,
      );

      expect(screen.getByRole('textbox', { name: 'Filtro dos itens', hidden: true })).toBe(input);
    });
  });
});
