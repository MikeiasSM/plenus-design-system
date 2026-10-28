import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { DataGrid, type DataGridColumn, type DataGridColumnDefinition, type DataGridDetailContext } from '.';

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

      expect(screen.getByRole('gridcell', { name: /^Nenhum registro atende à busca "zzz"\./ })).toHaveAttribute(
        'aria-colspan',
        '3',
      );

      fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
      expect(bodyRows()).toHaveLength(3);
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
      filter: { logic: 'and', conditions: [] },
      page: 1,
      pageSize: 25,
      summaries: [],
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
      filter: { logic: 'and', conditions: [] },
      page: 1,
      pageSize: 25,
      columns: { collapsedGroups: [], hidden: [], order: ['id', 'customer', 'total'], pinned: {}, widths: {} },
      density: 'normal',
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

  describe('filters', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    function openFilter(header: string) {
      fireEvent.keyDown(screen.getByRole('columnheader', { name: new RegExp(`^${header}`) }), { key: 'ArrowDown', altKey: true });
      return screen.getByRole('dialog', { name: `Filtro de ${header}` });
    }

    it('filters a column from the funnel after a pause, marks the title and announces the count', () => {
      renderGrid();

      fireEvent.change(within(openFilter('Cliente')).getByRole('textbox', { name: 'Valor de Cliente' }), {
        target: { value: 'sul' },
      });
      expect(bodyRows()).toHaveLength(3);
      act(() => vi.advanceTimersByTime(300));

      expect(firstColumn()).toEqual(['P-1']);
      expect(screen.getByRole('columnheader', { name: 'Cliente filtrada' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Filtrar Cliente, filtro ativo' })).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('1 de 3 linhas após o filtro');
    });

    it('offers to clear the filters when nothing is left', () => {
      const onFilterChange = vi.fn();
      renderGrid({
        defaultFilter: { logic: 'and', conditions: [{ columnId: 'total', operator: 'greaterThan', value: 5000 }] },
        onFilterChange,
      });

      expect(screen.getByRole('gridcell', { name: /^Nenhum registro atende aos filtros\./ })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Limpar filtros' }));

      expect(bodyRows()).toHaveLength(3);
      expect(onFilterChange).toHaveBeenLastCalledWith({ logic: 'and', conditions: [] });
    });

    it('filters by a set of values computed without the column own filter', () => {
      renderGrid({ columns: [columns[0], { ...columns[1], filter: 'set' }, columns[2]] });

      const panel = openFilter('Cliente');
      fireEvent.click(within(panel).getByRole('checkbox', { name: 'Casa Norte' }));
      fireEvent.click(within(panel).getByRole('checkbox', { name: 'Óleos Brasil' }));
      act(() => vi.advanceTimersByTime(300));

      expect(firstColumn()).toEqual(['P-1']);
      expect(within(panel).getAllByRole('checkbox')).toHaveLength(4);

      fireEvent.change(within(panel).getByRole('searchbox', { name: 'Buscar valores de Cliente' }), {
        target: { value: 'oleos' },
      });
      expect(within(panel).getByRole('checkbox', { name: 'Selecionar os 1 encontrados' })).not.toBeChecked();
    });

    it('waits for the apply button when asked to', () => {
      renderGrid({ filterApplyMode: 'button' });

      const panel = openFilter('Cliente');
      fireEvent.change(within(panel).getByRole('textbox', { name: 'Valor de Cliente' }), { target: { value: 'sul' } });
      act(() => vi.advanceTimersByTime(300));
      expect(bodyRows()).toHaveLength(3);

      fireEvent.click(within(panel).getByRole('button', { name: 'Aplicar' }));
      expect(firstColumn()).toEqual(['P-1']);
      expect(screen.queryByRole('dialog', { name: 'Filtro de Cliente' })).not.toBeInTheDocument();
    });

    it('never rewrites the filter just by opening the panel', () => {
      const onFilterChange = vi.fn();
      renderGrid({
        defaultFilter: {
          logic: 'and',
          conditions: [{ logic: 'or', conditions: [
            { columnId: 'total', operator: 'lessThan', value: 100 },
            { columnId: 'total', operator: 'greaterThan', value: 1000 },
            { columnId: 'total', operator: 'equals', value: 300 },
          ] }],
        },
        onFilterChange,
      });

      expect(openFilter('Total')).toHaveTextContent('Este filtro foi montado fora do funil');
      act(() => vi.advanceTimersByTime(300));
      expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('applies what was typed when the panel closes before the pause', () => {
      renderGrid();

      const input = within(openFilter('Cliente')).getByRole('textbox', { name: 'Valor de Cliente' });
      fireEvent.change(input, { target: { value: 'sul' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(firstColumn()).toEqual(['P-1']);
    });

    it('keeps a second condition out while the first is incomplete', () => {
      renderGrid({
        defaultFilter: {
          logic: 'or',
          conditions: [{ logic: 'or', conditions: [
            { columnId: 'total', operator: 'greaterThan', value: 1000 },
            { columnId: 'total', operator: 'lessThan', value: 100 },
          ] }],
        },
      });
      expect(firstColumn()).toEqual(['P-2', 'P-3']);

      fireEvent.change(within(openFilter('Total')).getAllByRole('textbox', { name: 'Valor de Total' })[0], {
        target: { value: '' },
      });
      act(() => vi.advanceTimersByTime(300));

      expect(bodyRows()).toHaveLength(3);
    });

    it('opens from the column menu and sends the filter to the server', () => {
      const onQueryChange = vi.fn();
      renderGrid({ dataMode: 'server', onQueryChange });

      fireEvent.click(screen.getByRole('button', { name: 'Menu da coluna Total' }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Filtrar/ }));
      const panel = screen.getByRole('dialog', { name: 'Filtro de Total' });
      fireEvent.change(within(panel).getByRole('textbox', { name: 'Valor de Total' }), { target: { value: '100' } });
      act(() => vi.advanceTimersByTime(300));

      expect(onQueryChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          filter: { logic: 'and', conditions: [{ columnId: 'total', operator: 'equals', value: 100 }] },
        }),
      );
      expect(bodyRows()).toHaveLength(3);
    });
  });

  describe('summary', () => {
    const summed: DataGridColumn<Order>[] = [columns[0], columns[1], { ...columns[2], summary: 'sum' }];

    it('totals the filtered rows of every page in a row fixed at the bottom', () => {
      renderGrid({
        columns: summed,
        pagination: true,
        pageSizeOptions: [2],
        defaultFilter: { logic: 'and', conditions: [{ columnId: 'total', operator: 'lessThan', value: 1000 }] },
      });

      const grid = screen.getByRole('grid');
      expect(grid).toHaveAttribute('aria-rowcount', '4');
      expect(screen.getByRole('gridcell', { name: 'Total de 2 linhas' })).toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: /^Soma: R\$\s380,00$/ }).closest('[role="row"]')).toHaveAttribute(
        'aria-rowindex',
        '4',
      );
    });

    it('is reached by the keyboard after the last row', () => {
      renderGrid({ columns: summed });

      const lastTotal = screen.getByRole('gridcell', { name: /^R\$\s80,00$/ });
      act(() => lastTotal.focus());
      fireEvent.keyDown(lastTotal, { key: 'ArrowDown' });

      expect(screen.getByRole('gridcell', { name: /^Soma: R\$\s1.630,00$/ })).toHaveFocus();
    });

    it('leaves the row out of the navigation while a failure takes the place of the rows', () => {
      renderGrid({ columns: summed, error: 'Falhou' });

      const header = screen.getByRole('columnheader', { name: 'Total' });
      act(() => header.focus());
      fireEvent.keyDown(header, { key: 'ArrowDown' });

      expect(screen.queryByRole('row', { name: /Soma/ })).not.toBeInTheDocument();
      expect(document.querySelector('[tabindex="0"]')).not.toBeNull();
    });

    it('shows the aggregates the server sends and asks for them in the query', () => {
      const onQueryChange = vi.fn();
      renderGrid({ columns: summed, dataMode: 'server', totalRows: 300, summaryValues: { total: 99000 }, onQueryChange });

      expect(screen.getByRole('gridcell', { name: /^Soma: R\$\s99.000,00$/ })).toBeInTheDocument();
      expect(onQueryChange).toHaveBeenCalledWith(expect.objectContaining({ summaries: [{ columnId: 'total', aggregator: 'sum' }] }));
    });
  });

  describe('tree', () => {
    interface Account {
      id: string;
      name: string;
      balance: number;
      children?: Account[];
    }

    const accounts: Account[] = [
      {
        id: '1',
        name: 'Receitas',
        balance: 500,
        children: [
          { id: '1.1', name: 'Vendas', balance: 300 },
          { id: '1.2', name: 'Aluguéis', balance: 200 },
        ],
      },
      { id: '2', name: 'Despesas', balance: 100 },
      { id: '3', name: 'Investimentos', balance: 50 },
    ];
    const accountColumns: DataGridColumn<Account>[] = [
      { id: 'name', header: 'Conta' },
      { id: 'balance', header: 'Saldo', type: 'currency', summary: 'sum' },
    ];
    const getChildren = (account: Account) => account.children;

    function renderTree(props: Partial<Parameters<typeof DataGrid<Account>>[0]> = {}) {
      return render(
        <DataGrid
          columns={accountColumns}
          getChildren={getChildren}
          getRowId={(account) => account.id}
          label="Plano de contas"
          rows={accounts}
          {...props}
        />,
      );
    }

    function names() {
      return screen
        .getAllByRole('row')
        .filter((row) => row.hasAttribute('data-anchor'))
        .map((row) => within(row).getAllByRole('gridcell')[0].textContent);
    }

    it('draws the children as rows of the same grid, with level and position among siblings', () => {
      renderTree();

      expect(screen.getByRole('treegrid', { name: 'Plano de contas' })).toHaveAttribute('aria-rowcount', '5');
      fireEvent.click(screen.getByRole('button', { name: 'Expandir Receitas' }));

      expect(names()).toEqual(['Receitas', 'Vendas', 'Aluguéis', 'Despesas', 'Investimentos']);
      const child = screen.getByRole('gridcell', { name: 'Aluguéis' }).closest('[role="row"]');
      expect(child).toHaveAttribute('aria-level', '2');
      expect(child).toHaveAttribute('aria-posinset', '2');
      expect(child).toHaveAttribute('aria-setsize', '2');
      expect(screen.getByRole('treegrid')).toHaveAttribute('aria-rowcount', '7');
    });

    it('toggles a branch with Ctrl+Enter and totals only the roots', () => {
      renderTree();

      const cell = screen.getByRole('gridcell', { name: 'Receitas' });
      act(() => cell.focus());
      fireEvent.keyDown(cell, { key: 'Enter', ctrlKey: true });

      expect(cell.closest('[role="row"]')).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('gridcell', { name: /^Soma: R\$\s650,00$/ })).toBeInTheDocument();
    });

    it('sorts among siblings and keeps the path to what the search finds', () => {
      vi.useFakeTimers();
      renderTree({ defaultExpandedIds: ['1'], children: <DataGrid.Search /> });

      fireEvent.click(screen.getByRole('columnheader', { name: 'Conta' }));
      expect(names()).toEqual(['Despesas', 'Investimentos', 'Receitas', 'Aluguéis', 'Vendas']);

      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vendas' } });
      act(() => vi.advanceTimersByTime(300));
      expect(names()).toEqual(['Receitas', 'Vendas']);
      vi.useRealTimers();
    });

    it('shows a branch loading until the product brings its children', () => {
      const lazy: Account[] = [{ id: '9', name: 'Sob demanda', balance: 0 }];
      const onExpandedIdsChange = vi.fn();
      const props = {
        rows: lazy,
        rowHasChildren: (account: Account) => account.id === '9',
        onExpandedIdsChange,
      };
      const { rerender } = renderTree(props);

      fireEvent.click(screen.getByRole('button', { name: 'Expandir Sob demanda' }));
      expect(onExpandedIdsChange).toHaveBeenLastCalledWith(['9']);
      expect(screen.getByRole('gridcell', { name: 'Sob demanda' }).closest('[role="row"]')).toHaveAttribute('aria-busy', 'true');

      rerender(
        <DataGrid
          columns={accountColumns}
          getChildren={(account) => (account.id === '9' ? [{ id: '9.1', name: 'Carregada', balance: 1 }] : undefined)}
          getRowId={(account) => account.id}
          label="Plano de contas"
          {...props}
        />,
      );
      expect(names()).toEqual(['Sob demanda', 'Carregada']);
    });

    it('takes the focus to the parent when its branch closes', () => {
      const { rerender } = renderTree({ expandedIds: ['1'] });

      const child = screen.getByRole('gridcell', { name: 'Aluguéis' });
      act(() => child.focus());
      rerender(
        <DataGrid columns={accountColumns} expandedIds={[]} getChildren={getChildren} getRowId={(account) => account.id} label="Plano de contas" rows={accounts} />,
      );

      expect(screen.getByRole('gridcell', { name: 'Receitas' })).toHaveFocus();
    });

    it('counts and totals the matching branches when searching', () => {
      vi.useFakeTimers();
      renderTree({ children: <DataGrid.Search /> });

      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'vendas' } });
      act(() => vi.advanceTimersByTime(300));

      expect(screen.getByRole('status')).toHaveTextContent('1 linha encontrada');
      expect(screen.getByRole('gridcell', { name: /^Soma: R\$\s300,00$/ })).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('pages by the roots, with the children following theirs', () => {
      renderTree({ defaultExpandedIds: ['1'], pagination: true, pageSizeOptions: [2] });

      expect(names()).toEqual(['Receitas', 'Vendas', 'Aluguéis', 'Despesas']);
      fireEvent.click(screen.getByRole('button', { name: 'Página 2' }));
      expect(names()).toEqual(['Investimentos']);
      expect(screen.getByRole('gridcell', { name: 'Investimentos' }).closest('[role="row"]')).toHaveAttribute('aria-rowindex', '6');
    });
  });

  describe('export', () => {
    function exportVia(label: string) {
      fireEvent.click(screen.getByRole('button', { name: 'Menu da tabela Pedidos' }));
      fireEvent.click(screen.getByRole('menuitem', { name: label }));
    }

    it('hands the exporter the shown columns, the filtered rows in order and the totals', async () => {
      const exporter = { id: 'xlsx', label: 'XLSX', export: vi.fn() };
      renderGrid({
        children: <DataGrid.TableMenu />,
        columns: [columns[0], columns[1], { ...columns[2], summary: 'sum' }],
        defaultColumnState: { hidden: ['customer'] },
        defaultFilter: { logic: 'and', conditions: [{ columnId: 'total', operator: 'lessThan', value: 1000 }] },
        defaultSort: [{ columnId: 'total', direction: 'asc' }],
        exporters: [exporter],
      });

      exportVia('Exportar XLSX');
      await act(async () => undefined);

      const model = exporter.export.mock.calls[0][0];
      expect(model.columns.map((column: { id: string }) => column.id)).toEqual(['id', 'total']);
      expect(model.rows.map((row: { cells: { text: string }[] }) => row.cells[0].text)).toEqual(['P-3', 'P-1']);
      expect(model.rows[0].cells[1]).toEqual({ text: expect.stringMatching(/^R\$\s80,00$/), value: 80 });
      expect(model.summary[1].value).toBe(380);
      expect(model.summary[0].text).toBe('Total');
      expect(screen.getByRole('status')).toHaveTextContent('XLSX exportado');
    });

    it('exports only the selected rows when asked', () => {
      const exporter = { id: 'csv', label: 'CSV', export: vi.fn() };
      renderGrid({ children: <DataGrid.TableMenu />, defaultSelectedIds: ['P-2'], exporters: [exporter], selectionMode: 'multiple' });

      exportVia('Exportar CSV da selecionada');

      const model = exporter.export.mock.calls[0][0];
      expect(model.scope).toBe('selected');
      expect(model.rows).toHaveLength(1);
      expect(model.summary).toBeUndefined();
    });

    it('downloads a CSV by default', () => {
      const createObjectURL = vi.fn(() => 'blob:x');
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
      vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL: vi.fn() }));
      renderGrid({ children: <DataGrid.TableMenu /> });

      exportVia('Exportar CSV');

      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(click).toHaveBeenCalled();
      click.mockRestore();
      vi.unstubAllGlobals();
    });
  });

  describe('table menu', () => {
    function rowOf(name: string) {
      return screen.getByRole('gridcell', { name }).closest('[role="row"]');
    }

    function openTableMenu() {
      fireEvent.click(screen.getByRole('button', { name: 'Menu da tabela Pedidos' }));
      return screen.getByRole('menu', { name: 'Menu da tabela Pedidos' });
    }

    function renderWithMenu(props: Partial<Parameters<typeof DataGrid<Order>>[0]> = {}) {
      return renderGrid({
        children: (
          <DataGrid.Toolbar>
            <DataGrid.Search />
            <DataGrid.TableMenu />
          </DataGrid.Toolbar>
        ),
        ...props,
      });
    }

    it('shows and hides columns, and never the last visible one', () => {
      renderWithMenu();

      fireEvent.click(within(openTableMenu()).getByRole('menuitemcheckbox', { name: 'Cliente' }));
      expect(screen.queryByRole('columnheader', { name: 'Cliente' })).not.toBeInTheDocument();

      fireEvent.click(within(openTableMenu()).getByRole('menuitemcheckbox', { name: 'Cliente' }));
      expect(screen.getByRole('columnheader', { name: 'Cliente' })).toBeInTheDocument();
    });

    it('changes the density of the rows and keeps it in the snapshot', () => {
      const onStateChange = vi.fn();
      renderWithMenu({ onStateChange });

      fireEvent.click(within(openTableMenu()).getByRole('menuitemcheckbox', { name: 'Compacta' }));

      expect(rowOf('Atacado Sul')).toHaveStyle({ height: '32px' });
      expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ density: 'compact' }));
    });

    it('opens the details on the screen with a cap and collapses them all', () => {
      const onExpandedIdsChange = vi.fn();
      renderWithMenu({ renderDetail: () => <p>Itens</p>, onExpandedIdsChange });

      fireEvent.click(within(openTableMenu()).getByRole('menuitem', { name: 'Expandir os da tela, até 10' }));
      expect(onExpandedIdsChange).toHaveBeenLastCalledWith(['P-1', 'P-2', 'P-3']);

      fireEvent.click(within(openTableMenu()).getByRole('menuitem', { name: 'Recolher todos' }));
      expect(onExpandedIdsChange).toHaveBeenLastCalledWith([]);
    });

    it('goes full screen and back with Escape', () => {
      const { container } = renderWithMenu();

      fireEvent.click(within(openTableMenu()).getByRole('menuitem', { name: 'Tela cheia' }));
      const root = container.firstElementChild as HTMLElement;
      expect(root.className).toMatch(/fullScreen/);

      fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Buscar em Pedidos' }), { key: 'Escape' });
      expect(root.className).toMatch(/fullScreen/);

      fireEvent.keyDown(screen.getByRole('gridcell', { name: 'Atacado Sul' }), { key: 'Escape' });
      expect(root.className).not.toMatch(/fullScreen/);
    });

    it('restores the default columns, order and density', () => {
      renderWithMenu({ defaultSort: [{ columnId: 'total', direction: 'asc' }] });

      fireEvent.click(screen.getByRole('columnheader', { name: 'Cliente' }));
      fireEvent.click(within(openTableMenu()).getByRole('menuitemcheckbox', { name: 'Total' }));
      fireEvent.click(within(openTableMenu()).getByRole('menuitem', { name: 'Restaurar o padrão' }));

      expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveAttribute('aria-sort', 'ascending');
    });

    it('shows the whole text of a cut cell under the pointer', () => {
      renderGrid();
      const text = screen.getByText('Atacado Sul');
      Object.defineProperty(text, 'scrollWidth', { configurable: true, value: 200 });
      Object.defineProperty(text, 'clientWidth', { configurable: true, value: 80 });

      fireEvent.pointerEnter(text);

      expect(text).toHaveAttribute('title', 'Atacado Sul');
    });
  });

  describe('header groups', () => {
    const grouped: DataGridColumnDefinition<Order>[] = [
      { id: 'id', header: 'Nº', width: 80 },
      {
        id: 'sale',
        header: 'Venda',
        collapsible: true,
        children: [
          { id: 'customer', header: 'Cliente', hideWhenCollapsed: true },
          { id: 'total', header: 'Total', type: 'currency' },
        ],
      },
    ];

    it('draws the group above its columns and counts its row', () => {
      renderGrid({ columns: grouped });

      const group = screen.getByRole('columnheader', { name: 'Venda' });
      expect(group).toHaveAttribute('aria-colspan', '2');
      expect(group).toHaveAttribute('aria-colindex', '2');
      expect(group.parentElement).toHaveAttribute('aria-rowindex', '1');
      expect(screen.getByRole('columnheader', { name: 'Cliente' }).parentElement).toHaveAttribute('aria-rowindex', '2');
      expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '5');
      expect(screen.getByRole('gridcell', { name: 'Atacado Sul' }).parentElement).toHaveAttribute('aria-rowindex', '3');
    });

    it('collapses a group, hiding the marked columns, and keeps it in the column state', () => {
      const onColumnStateChange = vi.fn();
      renderGrid({ columns: grouped, onColumnStateChange });

      fireEvent.click(screen.getByRole('button', { name: 'Recolher Venda' }));

      expect(screen.queryByRole('columnheader', { name: 'Cliente' })).not.toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Venda' })).toHaveAttribute('aria-colspan', '1');
      expect(screen.getByRole('button', { name: 'Expandir Venda' })).toHaveAttribute('aria-expanded', 'false');
      expect(onColumnStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ collapsedGroups: ['sale'], hidden: [] }));
    });

    it('keeps a column inside its group when moving it', () => {
      renderGrid({ columns: grouped });
      const customer = screen.getByRole('columnheader', { name: 'Cliente' });
      act(() => customer.focus());

      fireEvent.keyDown(customer, { key: 'ArrowLeft', ctrlKey: true, shiftKey: true });

      expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Venda', 'Nº', 'Cliente', 'Total']);
      expect(screen.getAllByRole('status').at(-1)).toHaveTextContent('Cliente não sai do próprio grupo');
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
