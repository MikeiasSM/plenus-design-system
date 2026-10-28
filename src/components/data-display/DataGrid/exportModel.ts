/** Modelo de exportação do DataGrid e o CSV do núcleo. Sem React e sem DOM: o arquivo sai por um exportador. */

export type DataGridExportScope = 'filtered' | 'selected' | 'page';

export interface DataGridExportColumn {
  header: string;
  id: string;
  /** Número ou moeda sem formato próprio: o valor cru vale o mesmo que a tela mostra. */
  numeric: boolean;
}

export interface DataGridExportCell {
  /** Como aparece na célula. */
  text: string;
  /** O valor cru, para o exportador que escreve número e data como tais. */
  value: unknown;
}

export interface DataGridExportRow {
  cells: readonly DataGridExportCell[];
  /** Nível na árvore, a partir de 0; fora dela, sempre 0. */
  depth: number;
}

/** As colunas na ordem da tela, as linhas do escopo na ordem atual e os totais, quando há. */
export interface DataGridExportModel {
  columns: readonly DataGridExportColumn[];
  rows: readonly DataGridExportRow[];
  scope: DataGridExportScope;
  summary?: readonly DataGridExportCell[];
  title: string;
  tree: boolean;
}

/** Adaptador de exportação: o CSV vem no núcleo; XLSX e PDF entram por exportador do produto, inclusive assíncrono. */
export interface DataGridExporter {
  export: (model: DataGridExportModel) => void | Promise<void>;
  id: string;
  label: string;
}

const SEPARATOR = ';';
/** Sem milhar, com vírgula e sem o ruído do ponto flutuante nem notação científica. */
const plainNumber = new Intl.NumberFormat('pt-BR', { useGrouping: false, maximumSignificantDigits: 15 });

/** Número que a planilha em português lê como número; o texto que ela leria como fórmula ganha o apóstrofo, como a OWASP pede. */
function csvText(column: DataGridExportColumn, cell: DataGridExportCell) {
  if (column.numeric && typeof cell.value === 'number' && Number.isFinite(cell.value)) {
    return plainNumber.format(cell.value);
  }

  return /^[=+\-@\t\r]/.test(cell.text) ? `'${cell.text}` : cell.text;
}

function csvField(text: string) {
  return /[";\r\n]/.test(text) || text !== text.trim() ? `"${text.replace(/"/g, '""')}"` : text;
}

/** UTF-8 com BOM e separador `;`, como a planilha em português abre sem perguntar. Na árvore, o nível vem primeiro. */
export function toCsv(model: DataGridExportModel) {
  const line = (cells: readonly string[]) => cells.map(csvField).join(SEPARATOR);
  const level = (text: string) => (model.tree ? [text] : []);
  const lines = [
    line([...level('Nível'), ...model.columns.map((column) => column.header)]),
    ...model.rows.map((row) =>
      line([...level(String(row.depth + 1)), ...row.cells.map((cell, index) => csvText(model.columns[index], cell))]),
    ),
  ];

  if (model.summary) {
    lines.push(line([...level(''), ...model.summary.map((cell, index) => csvText(model.columns[index], cell))]));
  }

  return `﻿${lines.join('\r\n')}\r\n`;
}
