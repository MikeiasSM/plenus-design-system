import { toCsv, type DataGridExporter } from './exportModel';

const REVOKE_DELAY = 40_000;

/** Baixa o texto como arquivo, pelo link temporário que o navegador entende como download. */
export function downloadText(fileName: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  /* O Safari perde o download se o endereço sai antes de ele começar. */
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY);
}

export const dataGridCsvExporter: DataGridExporter = {
  id: 'csv',
  label: 'CSV',
  export: (model) => downloadText(`${model.title.trim() || 'dados'}.csv`, toCsv(model), 'text/csv;charset=utf-8'),
};
