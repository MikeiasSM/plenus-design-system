/** As 27 unidades da federação, usadas nas páginas de Select, ComboBox e List. */
export const ESTADOS = [
  ['ac', 'Acre'], ['al', 'Alagoas'], ['ap', 'Amapá'], ['am', 'Amazonas'],
  ['ba', 'Bahia'], ['ce', 'Ceará'], ['df', 'Distrito Federal'], ['es', 'Espírito Santo'],
  ['go', 'Goiás'], ['ma', 'Maranhão'], ['mt', 'Mato Grosso'], ['ms', 'Mato Grosso do Sul'],
  ['mg', 'Minas Gerais'], ['pa', 'Pará'], ['pb', 'Paraíba'], ['pr', 'Paraná'],
  ['pe', 'Pernambuco'], ['pi', 'Piauí'], ['rj', 'Rio de Janeiro'], ['rn', 'Rio Grande do Norte'],
  ['rs', 'Rio Grande do Sul'], ['ro', 'Rondônia'], ['rr', 'Roraima'], ['sc', 'Santa Catarina'],
  ['sp', 'São Paulo'], ['se', 'Sergipe'], ['to', 'Tocantins'],
].map(([value, label]) => ({ value, label }));

/** Resultados de busca no acervo: opção composta, com segunda linha, ícone e grupo. */
export const RESULTADOS_DO_ACERVO = [
  { value: 'guia', label: 'Guia de integração', description: 'Faturamento · atualizado em 15/10/2026', group: 'Documentos' },
  { value: 'manual', label: 'Manual do operador', description: 'Atendimento · atualizado em 02/10/2026', group: 'Documentos' },
  { value: 'politica', label: 'Política de acesso', description: 'Sistema · atualizado em 28/09/2026', group: 'Documentos' },
  { value: 'faturamento', label: 'Faturamento', description: '12 documentos', group: 'Coleções' },
  { value: 'atendimento', label: 'Atendimento', description: '8 documentos', group: 'Coleções' },
];
