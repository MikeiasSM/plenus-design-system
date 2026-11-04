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

export function tsvField(text: string) {
  return /[\t\r\n"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** O que a planilha cola em células: texto como na tela, abas entre as colunas e quebras entre as linhas. Sem totais. */
export function toTsv(model: DataGridExportModel, withHeaders: boolean) {
  const line = (cells: readonly string[]) => cells.map(tsvField).join('\t');
  const lines = model.rows.map((row) => line(row.cells.map((cell) => cell.text)));

  return (withHeaders ? [line(model.columns.map((column) => column.header)), ...lines] : lines).join('\r\n');
}

export type DataGridExportValues = 'text' | 'raw';

export interface DataGridExportMatrix {
  header: string[];
  rows: unknown[][];
  /** Os totais, na ordem das colunas, quando o modelo os traz. */
  summary?: unknown[];
}

/** O modelo em matrizes, que a maioria das bibliotecas de planilha e de PDF recebe: o texto da tela ou o valor cru. */
export function toExportMatrix(model: DataGridExportModel, values: DataGridExportValues): DataGridExportMatrix {
  const valueOf = (cell: DataGridExportCell) => (values === 'text' ? cell.text : cell.value);

  return {
    header: model.columns.map((column) => column.header),
    rows: model.rows.map((row) => row.cells.map(valueOf)),
    summary: model.summary?.map(valueOf),
  };
}
