import { numberOf } from './filterModel';
import { cellValue, type DataGridColumnModel } from './gridState';

/** Modelo da edição de célula do DataGrid: o rascunho, a conversão e a validação. Sem React e sem DOM. */

/** A célula em edição. O rascunho é o texto do campo padrão, ou o valor que o editor do produto entrega. */
export interface DataGridEditing {
  columnId: string;
  draft: unknown;
  error: string | null;
  rowKey: string;
}

export type DataGridEditResult = { error: string; ok: false } | { changed: boolean; ok: true; value: unknown };

export function isEditable<Row>(column: DataGridColumnModel<Row>, row: Row) {
  return typeof column.editable === 'function' ? column.editable(row) : column.editable === true;
}

function isNumeric<Row>(column: DataGridColumnModel<Row>) {
  return column.type === 'number' || column.type === 'currency';
}

function isBlank(value: unknown) {
  return value === null || value === undefined || value === '';
}

/** O texto que o campo padrão abre: o valor cru, com a vírgula decimal do número. */
export function initialDraft<Row>(column: DataGridColumnModel<Row>, row: Row) {
  const value = cellValue(column, row);

  if (isBlank(value)) {
    return '';
  }

  return isNumeric(column) ? String(value).replace('.', ',') : String(value);
}

function parseDraft<Row>(column: DataGridColumnModel<Row>, row: Row, draft: string): unknown {
  if (column.parse) {
    return column.parse(draft, row);
  }
  if (!isNumeric(column)) {
    return draft;
  }

  return draft.trim() === '' ? null : numberOf(draft.trim());
}

function sameValue(a: unknown, b: unknown) {
  if (isBlank(a) && isBlank(b)) {
    return true;
  }

  return a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : Object.is(a, b);
}

/**
 * Converte o rascunho no valor, valida e diz se mudou. O editor do produto entrega o valor pronto: ele não passa por
 * `parse`. O número ilegível é recusado antes de a validação do produto ser chamada.
 */
export function commitEdit<Row>(
  column: DataGridColumnModel<Row>,
  row: Row,
  draft: unknown,
  custom: boolean,
): DataGridEditResult {
  const value = custom ? draft : parseDraft(column, row, String(draft));

  if (typeof value === 'number' && Number.isNaN(value)) {
    return { ok: false, error: 'Informe um número.' };
  }

  const error = column.validate?.(value, row);

  if (error) {
    return { ok: false, error };
  }

  return { ok: true, value, changed: !sameValue(value, cellValue(column, row)) };
}
