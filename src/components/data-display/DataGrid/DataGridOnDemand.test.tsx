import { createRef } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { formatCurrency } from '../../../utils/formatters';
import { DataGrid, type DataGridApi, type DataGridColumn, type DataGridFilter } from '.';

interface Order {
  id: string;
  customer: string;
  region: string;
  total: number;
}

const columns: DataGridColumn<Order>[] = [
  { id: 'id', header: 'Nº', width: 80 },
  { id: 'customer', header: 'Cliente' },
  { id: 'region', header: 'Região', groupable: true },
  { id: 'total', header: 'Total', type: 'currency', summary: 'sum' },
];

const orders: Order[] = [
  { id: 'P-1', customer: 'Atacado Sul', region: 'Sul', total: 300 },
  { id: 'P-2', customer: 'Óleos Brasil', region: 'Norte', total: 1250 },
  { id: 'P-3', customer: 'Casa Norte', region: 'Sul', total: 80 },
  { id: 'P-4', customer: 'Loja Sul', region: 'Sul', total: 20 },
];

const getRowId = (order: Order) => order.id;

function renderGrid(props: Partial<Parameters<typeof DataGrid<Order>>[0]> = {}) {
  return render(<DataGrid columns={columns} getRowId={getRowId} label="Pedidos" rows={orders} {...props} />);
}

function cell(name: string | RegExp) {
  return screen.getByRole('gridcell', { name });
}

/** O foco vai à célula e o evento sai do texto dela, como o navegador o dispara. */
function copyFrom(element: HTMLElement) {
  const data: Record<string, string> = {};
  const event = new Event('copy', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
  event.clipboardData = { setData: (type: string, value: string) => (data[type] = value) };
  act(() => element.focus());
  act(() => {
    (element.querySelector('span') ?? element).dispatchEvent(event);
  });

  return { data, prevented: event.defaultPrevented };
}

describe('DataGrid, copy', () => {
  it('copies the selected rows as tab-separated text, with the titles when asked', () => {
    renderGrid({ copyable: true, copyHeaders: true, defaultSelectedIds: ['P-3', 'P-1'], selectionMode: 'multiple' });
    const target = cell('Atacado Sul');
    target.focus();

    const { data, prevented } = copyFrom(target);

    expect(prevented).toBe(true);
    expect(data['text/plain']).toBe(
      `Nº\tCliente\tRegião\tTotal\r\nP-1\tAtacado Sul\tSul\t${formatCurrency(300)}\r\nP-3\tCasa Norte\tSul\t${formatCurrency(80)}`,
    );
    expect(screen.getByRole('status')).toHaveTextContent('2 linhas copiadas');
  });

  it('copies the focused cell, as shown, when no row is selected', () => {
    renderGrid({ copyable: true, selectionMode: 'multiple' });
    const target = cell(/1\.250,00/);

    expect(copyFrom(target).data['text/plain']).toBe(formatCurrency(1250));
    expect(screen.getByRole('status')).toHaveTextContent('Célula copiada');
  });

  it('quotes a cell that would break the sheet', () => {
    renderGrid({ copyable: true, rows: [{ id: 'P-9', customer: 'Linha\ncom "aspas"', region: 'Sul', total: 1 }] });

    expect(copyFrom(cell(/Linha/)).data['text/plain']).toBe('"Linha\ncom ""aspas"""');
  });

  it('leaves the copy to the browser without copyable, and for the title cells', () => {
    const { unmount } = renderGrid();
    expect(copyFrom(cell('Atacado Sul')).prevented).toBe(false);
    unmount();

    renderGrid({ copyable: true });
    expect(copyFrom(screen.getByRole('columnheader', { name: 'Cliente' })).prevented).toBe(false);
  });

  it('leaves selected text to the browser', () => {
    renderGrid({ copyable: true });
    const target = cell('Atacado Sul');
    const text = target.querySelector('span') as HTMLElement;
    act(() => target.focus());
    const range = document.createRange();
    range.selectNodeContents(text);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    expect(copyFrom(target).prevented).toBe(false);
    window.getSelection()?.removeAllRanges();
  });

  it('does not take the copy of a field inside the cell', () => {
    renderGrid({
      copyable: true,
      columns: [{ ...columns[0], renderCell: () => <input aria-label="Nota" /> }, ...columns.slice(1)],
    });

    expect(copyFrom(screen.getAllByLabelText('Nota')[0]).prevented).toBe(false);
  });
});

describe('DataGrid, pinned rows', () => {
  const pinned: Order[] = [{ id: 'T', customer: 'Resumo', region: '-', total: 1650 }];

  it('draws them under the title, outside the sort, and numbers the rows after them', () => {
    renderGrid({ pinnedRows: pinned, defaultSort: [{ columnId: 'total', direction: 'asc' }] });
    const rows = screen.getAllByRole('row');

    expect(rows[1]).toHaveTextContent('Resumo');
    expect(rows[1]).toHaveAttribute('aria-rowindex', '2');
    expect(rows[2]).toHaveTextContent('P-4');
    expect(rows[2]).toHaveAttribute('aria-rowindex', '3');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '7');
  });

  it('keeps them out of the search and the selection, and reaches them by the arrows', () => {
    renderGrid({ pinnedRows: pinned, defaultSearch: 'Óleos', selectionMode: 'multiple' });

    expect(screen.getByText('Resumo')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox', { name: /Selecionar/ })).toHaveLength(2);

    const header = screen.getByRole('columnheader', { name: 'Nº' });
    header.focus();
    fireEvent.keyDown(header, { key: 'ArrowDown' });
    expect(document.activeElement).toHaveTextContent('T');
    expect(document.activeElement).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toHaveTextContent('P-2');
  });

  it('copies the focused cell of a pinned row', () => {
    renderGrid({ copyable: true, pinnedRows: pinned });

    expect(copyFrom(cell('Resumo')).data['text/plain']).toBe('Resumo');
  });
});

describe('DataGrid, cell editing', () => {
  const editable: DataGridColumn<Order>[] = [
    columns[0],
    { ...columns[1], editable: true },
    columns[2],
    { ...columns[3], editable: (order) => order.id !== 'P-3' },
  ];

  function startEdit(name: string | RegExp, key = 'Enter') {
    const target = cell(name);
    target.focus();
    fireEvent.keyDown(target, { key });
    return target;
  }

  it('opens the field with Enter or F2, announces it and confirms with Enter', () => {
    const onCellEdit = vi.fn();
    renderGrid({ columns: editable, onCellEdit });

    const target = startEdit('Atacado Sul');
    const field = screen.getByRole('textbox', { name: 'Cliente de P-1' });

    expect(field).toHaveFocus();
    expect(field).toHaveValue('Atacado Sul');
    expect(screen.getByRole('status')).toHaveTextContent('Editando Cliente de P-1');

    fireEvent.change(field, { target: { value: 'Atacado Norte' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(onCellEdit).toHaveBeenCalledWith({
      columnId: 'customer',
      previousValue: 'Atacado Sul',
      row: orders[0],
      rowId: 'P-1',
      value: 'Atacado Norte',
    });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(target).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Cliente alterada para Atacado Norte');
  });

  it('cancels with Escape and calls nothing', () => {
    const onCellEdit = vi.fn();
    renderGrid({ columns: editable, onCellEdit });
    const target = startEdit('Casa Norte', 'F2');

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Outro' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });

    expect(onCellEdit).not.toHaveBeenCalled();
    expect(target).toHaveFocus();
    expect(cell('Casa Norte')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Edição cancelada');
  });

  it('confirms with Tab and keeps the focus in the cell', () => {
    const onCellEdit = vi.fn();
    renderGrid({ columns: editable, onCellEdit });
    const target = startEdit('Casa Norte');

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Casa Leste' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Tab' });

    expect(onCellEdit).toHaveBeenCalledWith(expect.objectContaining({ value: 'Casa Leste' }));
    expect(target).toHaveFocus();
  });

  it('does not call when the value did not change', () => {
    const onCellEdit = vi.fn();
    renderGrid({ columns: editable, onCellEdit });
    startEdit('Casa Norte');

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it('reads a number typed in Brazilian format and refuses one it cannot read', () => {
    const onCellEdit = vi.fn();
    renderGrid({ columns: editable, onCellEdit });
    startEdit(/300,00/);
    const field = screen.getByRole('textbox');

    expect(field).toHaveValue('300');
    fireEvent.change(field, { target: { value: 'abc' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById(field.getAttribute('aria-describedby') as string)).toHaveTextContent('Informe um número.');
    expect(onCellEdit).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: '1.250,5' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(onCellEdit).toHaveBeenCalledWith(expect.objectContaining({ columnId: 'total', value: 1250.5, previousValue: 300 }));
  });

  it('keeps the edit open while the product refuses the value, and announces why', () => {
    const onCellEdit = vi.fn();
    const validated = [{ ...editable[1], validate: (value: unknown) => (value === '' ? 'O cliente é obrigatório.' : null) }];
    renderGrid({ columns: [columns[0], validated[0], ...editable.slice(2)], onCellEdit });
    startEdit('Casa Norte');

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('O cliente é obrigatório.');
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Tab' });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(onCellEdit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Casa Oeste' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onCellEdit).toHaveBeenCalledTimes(1);
  });

  it('does not open a cell the row does not allow, nor a column that is not editable', () => {
    renderGrid({ columns: editable });

    startEdit(/80,00/);
    const region = screen.getAllByRole('gridcell', { name: 'Sul' })[0];
    region.focus();
    fireEvent.keyDown(region, { key: 'F2' });
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('leaves Enter to the row action and still edits with F2', () => {
    const onRowActivate = vi.fn();
    renderGrid({ columns: editable, rowClickAction: 'activate', onRowActivate });

    startEdit('Casa Norte');
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('textbox')).toBeNull();

    startEdit('Casa Norte', 'F2');
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('opens with a double click, and the next cell with focus confirms the value', () => {
    const onCellEdit = vi.fn();
    renderGrid({ columns: editable, onCellEdit });

    fireEvent.doubleClick(cell('Casa Norte'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Casa Leste' } });
    act(() => cell('Loja Sul').focus());

    expect(onCellEdit).toHaveBeenCalledWith(expect.objectContaining({ rowId: 'P-3', value: 'Casa Leste' }));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('hands the value of a product editor over as it comes, without parsing it', () => {
    const onCellEdit = vi.fn();
    const regions = columns[2];
    renderGrid({
      onCellEdit,
      columns: [
        columns[0],
        columns[1],
        {
          ...regions,
          editable: true,
          renderEditor: ({ commit, error, errorId, onChange, value }) => (
            <select
              aria-describedby={error ? errorId : undefined}
              aria-label="Região"
              value={String(value)}
              onChange={(event) => {
                onChange(event.target.value);
              }}
              onKeyDown={(event) => event.key === 'Enter' && commit()}
            >
              <option>Norte</option>
              <option>Sul</option>
            </select>
          ),
        },
      ],
    });
    startEdit('Norte');
    const select = screen.getByRole('combobox', { name: 'Região' });

    fireEvent.change(select, { target: { value: 'Sul' } });
    fireEvent.keyDown(select, { key: 'Enter' });

    expect(onCellEdit).toHaveBeenCalledWith(expect.objectContaining({ columnId: 'region', value: 'Sul', previousValue: 'Norte' }));
  });
});

describe('DataGrid, group by column', () => {
  function groupRowOf(name: string) {
    return screen.getAllByRole('row').find((row) => row.textContent?.startsWith(name)) as HTMLElement;
  }

  it('lists the groups closed, with the count and the aggregate of each column', () => {
    renderGrid({ groupBy: ['region'] });

    expect(screen.getByRole('treegrid')).toBeInTheDocument();
    expect(groupRowOf('Região: Sul')).toHaveTextContent('3 linhas');
    expect(groupRowOf('Região: Sul')).toHaveTextContent('R$ 400,00');
    expect(groupRowOf('Região: Norte')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('gridcell', { name: 'Casa Norte' })).toBeNull();
  });

  it('opens and closes a group by click, Enter and Space, announcing it', () => {
    renderGrid({ groupBy: ['region'] });
    const south = groupRowOf('Região: Sul');

    fireEvent.click(south);
    expect(south).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('gridcell', { name: /Sul|Casa|Loja|Atacado/ }).length).toBeGreaterThan(3);
    expect(screen.getByRole('status')).toHaveTextContent('Sul expandido');

    const cellOfGroup = within(south).getAllByRole('gridcell')[0];
    cellOfGroup.focus();
    fireEvent.keyDown(cellOfGroup, { key: 'Enter' });
    expect(south).toHaveAttribute('aria-expanded', 'false');
    fireEvent.keyDown(cellOfGroup, { key: ' ' });
    expect(south).toHaveAttribute('aria-expanded', 'true');
  });

  it('groups in levels, one inside the other', () => {
    renderGrid({ groupBy: ['region', 'customer'], defaultExpandedIds: [] });

    fireEvent.click(groupRowOf('Região: Sul'));
    const inner = groupRowOf('Cliente: Atacado Sul');

    expect(inner).toHaveAttribute('aria-level', '2');
    expect(inner).toHaveAttribute('aria-expanded', 'false');
  });

  it('is applied from the column menu and reported by the trio', () => {
    const onGroupByChange = vi.fn();
    renderGrid({ defaultGroupBy: [], onGroupByChange });
    const header = screen.getByRole('columnheader', { name: 'Região' });

    header.focus();
    fireEvent.keyDown(header, { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Agrupar linhas por esta coluna' }));

    expect(onGroupByChange).toHaveBeenCalledWith(['region']);
    expect(groupRowOf('Região: Sul')).toBeDefined();
    expect(screen.getByRole('status')).toHaveTextContent('Agrupado por Região');

    fireEvent.keyDown(screen.getByRole('columnheader', { name: 'Região' }), { key: 'Enter', ctrlKey: true });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover do agrupamento de linhas' }));
    expect(onGroupByChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('treegrid')).toBeNull();
  });

  it('offers the grouping in the column menu only for the columns that ask for it', () => {
    renderGrid();
    const header = screen.getByRole('columnheader', { name: 'Cliente' });

    header.focus();
    fireEvent.keyDown(header, { key: 'Enter', ctrlKey: true });

    expect(screen.queryByRole('menuitem', { name: /Agrupar linhas/ })).toBeNull();
  });

  it('never selects a group, and selects the rows in the order the screen shows them', () => {
    const onSelectedIdsChange = vi.fn();
    renderGrid({ groupBy: ['region'], selectionMode: 'multiple', defaultExpandedIds: [], onSelectedIdsChange });

    expect(screen.queryAllByRole('checkbox', { name: /Selecionar [^t]/ })).toHaveLength(0);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas as linhas' }));
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['P-1', 'P-3', 'P-4', 'P-2']);
  });

  it('expands every group from the table menu and collapses them again', () => {
    renderGrid({
      groupBy: ['region'],
      children: (
        <DataGrid.Toolbar>
          <DataGrid.TableMenu />
        </DataGrid.Toolbar>
      ),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Menu da tabela Pedidos' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Expandir todos os grupos' }));

    expect(screen.getByRole('gridcell', { name: 'Óleos Brasil' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: 'Casa Norte' })).toBeInTheDocument();
  });

  it('paginates by the first-level groups and exports the rows of the page', () => {
    const api = createRef<DataGridApi>();
    renderGrid({ apiRef: api, groupBy: ['region'], pagination: true, pageSizeOptions: [1] });

    expect(screen.getByRole('row', { name: /Região: Sul/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Região: Norte/ })).toBeNull();
    expect(api.current?.getExportModel('page').rows.map((row) => row.cells[0].text)).toEqual(['P-1', 'P-3', 'P-4']);
    expect(api.current?.getExportModel('filtered').rows).toHaveLength(4);
  });
});

describe('DataGrid, filter builder', () => {
  function renderBuilder(props: Partial<Parameters<typeof DataGrid<Order>>[0]> = {}) {
    return renderGrid({
      children: (
        <DataGrid.Toolbar>
          <DataGrid.FilterBuilder />
        </DataGrid.Toolbar>
      ),
      ...props,
    });
  }

  function lastFilter(onFilterChange: ReturnType<typeof vi.fn>) {
    return onFilterChange.mock.calls.at(-1)?.[0] as DataGridFilter;
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function open() {
    fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }));
  }

  function settle() {
    act(() => {
      vi.advanceTimersByTime(300);
    });
  }

  it('adds a condition on any column and filters when it is complete', () => {
    const onFilterChange = vi.fn();
    renderBuilder({ onFilterChange });
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Condição' }));
    settle();
    expect(onFilterChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor de Nº' }), { target: { value: 'P-2' } });
    settle();

    expect(lastFilter(onFilterChange)).toEqual({ logic: 'and', conditions: [{ columnId: 'id', operator: 'contains', value: 'P-2' }] });
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Filtros (1)' })).toBeInTheDocument();
  });

  it('combines the conditions by E or OU, and a group has its own', () => {
    const onFilterChange = vi.fn();
    const filter: DataGridFilter = {
      logic: 'and',
      conditions: [
        { columnId: 'region', operator: 'equals', value: 'Norte' },
        { columnId: 'region', operator: 'equals', value: 'Sul' },
      ],
    };
    renderBuilder({ defaultFilter: filter, onFilterChange });
    expect(screen.getByText('Nenhum registro atende aos filtros.')).toBeInTheDocument();

    open();
    fireEvent.click(screen.getByRole('radio', { name: 'OU' }));
    settle();

    expect(lastFilter(onFilterChange).logic).toBe('or');
    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('6');

    fireEvent.click(screen.getByRole('button', { name: 'Grupo' }));
    expect(screen.getByRole('group', { name: 'Grupo 3' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remover o grupo 3' }));
    expect(screen.queryByRole('group', { name: 'Grupo 3' })).toBeNull();
  });

  it('removes a condition and clears everything', () => {
    const onFilterChange = vi.fn();
    renderBuilder({
      defaultFilter: { logic: 'and', conditions: [{ columnId: 'region', operator: 'equals', value: 'Norte' }] },
      onFilterChange,
    });
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(lastFilter(onFilterChange)).toEqual({ logic: 'and', conditions: [] });
    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('6');
  });

  it('follows the controlled filter and waits for Aplicar in the button mode', () => {
    const onFilterChange = vi.fn();
    renderBuilder({ filter: { logic: 'and', conditions: [] }, filterApplyMode: 'button', onFilterChange });
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Condição' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Valor de Nº' }), { target: { value: 'P-2' } });
    settle();
    expect(onFilterChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('DataGrid, column virtualization', () => {
  const many: DataGridColumn<Record<string, string>>[] = Array.from({ length: 40 }, (_, index) => ({
    id: `c${index}`,
    header: `Coluna ${index}`,
    width: 100,
  }));
  const row = Object.fromEntries(many.map((column) => [column.id, `v-${column.id}`]));

  function renderMany(props = {}) {
    return render(<DataGrid columns={many} getRowId={() => 'r'} label="Largo" rows={[row]} virtualizeColumns {...props} />);
  }

  function drawn() {
    return screen.getAllByRole('columnheader').map((header) => Number(header.getAttribute('aria-colindex')));
  }

  it('draws only the columns that fit the screen, with their real positions', () => {
    renderMany();

    expect(screen.getByRole('grid')).toHaveAttribute('aria-colcount', '40');
    expect(drawn()).toEqual(Array.from({ length: drawn().length }, (_, index) => index + 1));
    expect(drawn().length).toBeLessThan(20);
    expect(screen.getAllByRole('gridcell').length).toBe(drawn().length);
    expect(screen.queryByRole('gridcell', { name: 'v-c39' })).toBeNull();
  });

  it('draws them all without the option', () => {
    render(<DataGrid columns={many} getRowId={() => 'r'} label="Largo" rows={[row]} />);

    expect(screen.getAllByRole('columnheader')).toHaveLength(40);
  });

  it('draws the columns that scroll into view and leaves a margin for the ones it skipped', () => {
    renderMany();
    const scroller = screen.getByRole('grid').parentElement as HTMLElement;

    Object.defineProperty(scroller, 'scrollLeft', { configurable: true, value: 3000 });
    fireEvent.scroll(scroller);

    /* A primeira coluna segue desenhada: é a que tem o foco. */
    const [focused, far] = drawn();
    expect(focused).toBe(1);
    expect(far).toBeGreaterThan(20);
    expect(screen.getByRole('gridcell', { name: `v-c${far - 1}` })).toHaveStyle({ marginInlineStart: `${(far - 2) * 100}px` });
  });

  it('draws the column the keyboard reaches, even far from the screen', () => {
    renderMany();
    const first = screen.getByRole('gridcell', { name: 'v-c0' });

    first.focus();
    fireEvent.keyDown(first, { key: 'End' });

    expect(screen.getByRole('gridcell', { name: 'v-c39' })).toHaveFocus();
  });

  it('keeps the pinned columns always drawn', () => {
    const pinnedEnd = [...many.slice(0, 39), { ...many[39], pinned: 'end' as const }];
    render(<DataGrid columns={pinnedEnd} getRowId={() => 'r'} label="Largo" rows={[row]} virtualizeColumns />);

    expect(drawn().at(-1)).toBe(40);
  });
});

describe('DataGrid, export access', () => {
  it('hands the visible columns and the filtered, sorted rows with the text and the raw value', () => {
    const api = createRef<DataGridApi>();
    renderGrid({
      apiRef: api,
      defaultSearch: 'Sul',
      defaultSort: [{ columnId: 'total', direction: 'desc' }],
      columns: [columns[0], columns[3], { ...columns[1], pinned: 'start' }],
    });

    const model = api.current!.getExportModel();

    expect(model.columns.map((column) => column.id)).toEqual(['customer', 'id', 'total']);
    expect(model.rows.map((row) => row.cells[1].text)).toEqual(['P-1', 'P-4']);
    expect(model.rows[0].cells[2]).toEqual({ text: formatCurrency(300), value: 300 });
    expect(model.summary?.[2].value).toBe(320);
  });

  it('hands over only the selected rows when asked', () => {
    const api = createRef<DataGridApi>();
    renderGrid({ apiRef: api, defaultSelectedIds: ['P-2'], selectionMode: 'multiple' });

    expect(api.current?.getExportModel('selected').rows.map((row) => row.cells[0].text)).toEqual(['P-2']);
  });
});
