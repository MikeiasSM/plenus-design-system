import { toCsv, type DataGridExportModel } from './exportModel';

const model: DataGridExportModel = {
  title: 'Pedidos',
  scope: 'filtered',
  tree: false,
  columns: [
    { id: 'id', header: 'Nº', numeric: false },
    { id: 'customer', header: 'Cliente', numeric: false },
    { id: 'total', header: 'Total', numeric: true },
  ],
  rows: [
    {
      depth: 0,
      cells: [
        { text: 'P-1', value: 'P-1' },
        { text: 'Atacado; "Sul"', value: 'Atacado; "Sul"' },
        { text: 'R$ 1.250,50', value: 1250.5 },
      ],
    },
  ],
};

describe('csv', () => {
  it('writes numbers without float noise and keeps text from running as a formula', () => {
    const csv = toCsv({
      ...model,
      rows: [
        {
          depth: 0,
          cells: [
            { text: '=HYPERLINK("x")', value: '=HYPERLINK("x")' },
            { text: '-', value: '-' },
            { text: 'R$ 30,30', value: 10.1 + 20.2 },
          ],
        },
        { depth: 0, cells: [{ text: '', value: '' }, { text: '', value: '' }, { text: '', value: 1e-7 }] },
      ],
    });

    expect(csv.split('\r\n').slice(1, 3)).toEqual([`"'=HYPERLINK(""x"")";'-;30,3`, ';;0,0000001']);
  });

  it('writes UTF-8 with BOM, semicolons and plain decimal numbers', () => {
    expect(toCsv(model)).toBe('﻿Nº;Cliente;Total\r\nP-1;"Atacado; ""Sul""";1250,5\r\n');
  });

  it('adds the totals and, in a tree, the level of each row', () => {
    const csv = toCsv({
      ...model,
      tree: true,
      rows: [{ ...model.rows[0], depth: 1 }],
      summary: [
        { text: '', value: undefined },
        { text: '', value: undefined },
        { text: 'R$ 1.250,50', value: 1250.5 },
      ],
    });

    expect(csv.split('\r\n')).toEqual(['﻿Nível;Nº;Cliente;Total', '2;P-1;"Atacado; ""Sul""";1250,5', ';;;1250,5', '']);
  });
});
