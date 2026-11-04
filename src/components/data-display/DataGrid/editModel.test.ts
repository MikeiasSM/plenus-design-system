import { commitEdit, initialDraft, isEditable } from './editModel';
import type { DataGridColumnModel } from './gridState';

interface Item {
  name: string;
  price: number | null;
}

const name: DataGridColumnModel<Item> = { id: 'name', header: 'Nome', editable: true };
const price: DataGridColumnModel<Item> = { id: 'price', header: 'Preço', type: 'currency', editable: true };
const item: Item = { name: 'Café', price: 12.5 };

describe('editModel', () => {
  it('resolves editability per column and per row', () => {
    expect(isEditable(name, item)).toBe(true);
    expect(isEditable({ id: 'x', header: 'X' }, item)).toBe(false);
    expect(isEditable({ ...name, editable: (row: Item) => row.price !== null }, { name: 'a', price: null })).toBe(false);
  });

  it('opens the default field with the raw value, using the decimal comma for numbers', () => {
    expect(initialDraft(name, item)).toBe('Café');
    expect(initialDraft(price, item)).toBe('12,5');
    expect(initialDraft(price, { name: 'a', price: null })).toBe('');
  });

  it('turns numeric text into a number and flags unreadable numbers', () => {
    expect(commitEdit(price, item, '1.250,75', false)).toEqual({ ok: true, value: 1250.75, changed: true });
    expect(commitEdit(price, item, '', false)).toEqual({ ok: true, value: null, changed: true });
    expect(commitEdit(price, item, 'abc', false)).toEqual({ ok: false, error: 'Informe um número.' });
  });

  it('reports no change when the value is the same', () => {
    expect(commitEdit(name, item, 'Café', false)).toEqual({ ok: true, value: 'Café', changed: false });
    expect(commitEdit(price, item, '12,5', false)).toMatchObject({ changed: false });
  });

  it('keeps the product editor value as it came and lets the product validate it', () => {
    const column: DataGridColumnModel<Item> = { ...name, validate: (value) => (value === '' ? 'Obrigatório.' : null) };

    expect(commitEdit(column, item, '', true)).toEqual({ ok: false, error: 'Obrigatório.' });
    expect(commitEdit(column, item, 'Chá', true)).toEqual({ ok: true, value: 'Chá', changed: true });
  });

  it('uses the product parser for the default field', () => {
    const column: DataGridColumnModel<Item> = { ...name, parse: (input) => input.trim().toUpperCase() };

    expect(commitEdit(column, item, ' chá ', false)).toMatchObject({ value: 'CHÁ' });
  });
});
