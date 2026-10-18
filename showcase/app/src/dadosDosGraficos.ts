import {
  formatarNumero,
  type ChartBarSeries,
  type ChartPieSlice,
  type ChartSunburstNode,
} from '@plenustech/design-system';

/** Dados de demonstração repetidos entre as páginas dos gráficos. */

export const MESES = ['04/26', '05/26', '06/26', '07/26', '08/26', '09/26'];

export const FATURAMENTO = [42000, 58000, 39000, 96000, 54000, 63000];
export const CONVERSAO = [3.2, 4.1, 2.8, 6.4, 3.9, 4.6];

export const SERVICOS = [42000, 58000, 39000, 96000, 54000, 63000];
export const PRODUTOS = [38000, 62000, 41000, 58000, 88000, 71000];
export const ASSINATURAS = [12000, 15000, 18000, 21000, 26000, 31000];

/** Composição do faturamento, de uma a três séries, para os playgrounds. */
export const COMPOSICAO: ChartBarSeries[] = [
  { label: 'Serviços', values: SERVICOS },
  { label: 'Produtos', values: PRODUTOS },
  { label: 'Assinaturas', values: ASSINATURAS },
];

/** Formas de pagamento por mês, com quantidade e valor, como no relatório real. */
export const FORMAS_DE_PAGAMENTO = [
  {
    label: 'Prazo',
    quantidades: [418, 402, 390, 455, 430, 441],
    valores: [164352.89, 158020.4, 149330.1, 180224.7, 170110.5, 174880.2],
  },
  {
    label: 'C/ Sicredi 930-0',
    quantidades: [30, 28, 34, 41, 36, 39],
    valores: [11837.73, 10920.5, 13240.8, 16110.2, 14005.6, 15320.9],
  },
  {
    label: 'Outros',
    quantidades: [22, 19, 25, 30, 27, 24],
    valores: [8632.09, 7410.3, 9880.4, 11720.6, 10240.8, 9115.4],
  },
];

export const RECEITA: ChartPieSlice[] = [
  { label: 'Serviços', value: 320000 },
  { label: 'Produtos', value: 280000 },
  { label: 'Assinaturas', value: 150000 },
];

export const DESPESAS_POR_TIPO: ChartPieSlice[] = [
  { label: 'Despesas fixas', value: 1760000 },
  { label: 'Despesas variáveis', value: 352000 },
  { label: 'Multas', value: 26000 },
  { label: 'Tarifas bancárias', value: 22000 },
  { label: 'Doações', value: 18000 },
];

export const DESPESAS: ChartSunburstNode[] = [
  {
    label: 'Operacionais',
    children: [
      { label: 'Pessoal', value: 520000 },
      { label: 'Aluguel', value: 180000 },
      { label: 'Energia', value: 90000 },
    ],
  },
  {
    label: 'Administrativas',
    children: [
      { label: 'Sistemas', value: 160000 },
      { label: 'Contabilidade', value: 80000 },
    ],
  },
  { label: 'Financeiras', children: [{ label: 'Juros', value: 120000 }] },
];

export const TOTAL_DE_DESPESAS = DESPESAS.flatMap((grupo) => grupo.children ?? []).reduce(
  (soma, folha) => soma + (folha.value ?? 0),
  0,
);

export const CORES_DE_TEMA = ['#F26B35', '#49619C', '#6E2A92', '#67BD50', '#ED3237', '#FCB52F', '#373435', '#606062'];

/** Opções do controle `accent` nos playgrounds: sem cor de tema, ou uma delas. */
export const OPCOES_DE_ACCENT = ['nenhuma', ...CORES_DE_TEMA];

export function accentDa(opcao: string | number | boolean) {
  return opcao === 'nenhuma' ? undefined : String(opcao);
}

export const formatarCompacto = (valor: number) => formatarNumero(valor, { compacto: true });
