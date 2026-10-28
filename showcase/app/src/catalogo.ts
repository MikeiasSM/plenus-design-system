import type { Pagina } from './estrutura/tipos';

export interface ComponenteDoCatalogo {
  /** O que vai entre as chaves do `import`, quando nao e so o nome. */
  importa?: string;
  nome: string;
  pagina?: Pagina;
  papel: string;
  previsto?: boolean;
}

export interface Familia {
  componentes: readonly ComponenteDoCatalogo[];
  nome: string;
}

// A pagina de cada componente vive em `paginas/<Nome>.tsx` e entra aqui pelo nome do arquivo.
const paginas = import.meta.glob<Pagina>('./paginas/*.tsx', { eager: true, import: 'pagina' });

function componente(nome: string, papel: string, extra: Omit<ComponenteDoCatalogo, 'nome' | 'papel'> = {}) {
  return { nome, papel, pagina: paginas[`./paginas/${nome}.tsx`], ...extra };
}

/** As familias e os papeis de `COMPONENTS-CATALOG.md`, na mesma ordem. */
export const familias: readonly Familia[] = [
  {
    nome: 'Ações',
    componentes: [
      componente('Button', 'Aciona uma operação.'),
      componente('ButtonIcon', 'Aciona uma operação representada só por ícone.'),
      componente('ButtonTile', 'Ação em ladrilho, com ícone acima do nome, para paletas de inserção.'),
      componente('Toolbar', 'Agrupa controles de uma mesma superfície, com navegação por setas.'),
    ],
  },
  {
    nome: 'Formulários',
    componentes: [
      componente('Field', 'Cromo de campo: rótulo, ajuda, erro, contador e a fiação entre eles.'),
      componente('Label', 'Rótulo associado a um controle.'),
      componente('InputText', 'Entrada de texto de linha única.'),
      componente('InputNumber', 'Entrada numérica, inteira ou decimal.'),
      componente('InputPassword', 'Entrada de senha, com revelação explícita.'),
      componente('InputCurrency', 'Entrada monetária.'),
      componente('Textarea', 'Entrada de texto de múltiplas linhas.'),
      componente('Checkbox', 'Escolha binária independente.'),
      componente('CheckboxGroup', 'Escolha múltipla entre opções sempre visíveis.', { importa: 'CheckboxGroup, Checkbox' }),
      componente('RadioGroup', 'Escolha única entre opções sempre visíveis.', { importa: 'RadioGroup, Radio' }),
      componente('Switch', 'Alternância de um estado ativo.'),
      componente('SegmentedControl', 'Escolha única entre poucos segmentos lado a lado.'),
      componente('DatePicker', 'Entrada de data, digitada ou escolhida em calendário.'),
      componente('TimePicker', 'Entrada de hora.'),
      componente('DateTimePicker', 'Entrada de data e hora combinadas.'),
      componente('ColorPicker', 'Escolha de cor entre amostras definidas pelo produto.'),
      componente('FileUpload', 'Seleção de arquivos, por clique ou arrasto, com a lista dos envios.'),
    ],
  },
  {
    nome: 'Listagem e escolha',
    componentes: [
      componente('Select', 'Campo de escolha única a partir de uma lista curta.'),
      componente('ComboBox', 'Campo de listagem completo, com busca e seleção simples ou múltipla.'),
      componente('List', 'Listagem visível na própria interface, com busca e seleção opcionais.'),
    ],
  },
  {
    nome: 'Dados',
    componentes: [
      componente('Avatar', 'Representação visual de uma pessoa ou entidade.'),
      componente('Card', 'Superfície que agrupa conteúdo, com cabeçalho e rodapé próprios.'),
      componente('Badge', 'Rótulo curto de estado ou categoria.'),
      componente('Tag', 'Etiqueta operada: removível, como o filtro ativo, ou de alternar.'),
      componente('Accordion', 'Seções expansíveis de conteúdo.'),
      componente('CodeBlock', 'Trecho de código para leitura, com cópia, numeração e destaque de linhas.'),
      componente('Timeline', 'Histórico de estados de um registro, com datas e o estado atual destacado.'),
      componente('SortableList', 'Lista reordenável por arrasto ou teclado, com seleção de um item.'),
      componente('Table', 'Tabela básica, em HTML semântico.'),
      componente('DataGrid', 'Grade completa, com ordenação, paginação, seleção e virtualização.', { previsto: true }),
    ],
  },
  {
    nome: 'Gráficos',
    componentes: [
      componente('ChartBar', 'Comparação por categoria, em barras verticais ou horizontais.'),
      componente('ChartLine', 'Evolução de uma medida ao longo do tempo.'),
      componente('ChartArea', 'Evolução com ênfase no volume acumulado.'),
      componente('ChartCombo', 'Duas leituras da mesma categoria, em barras e linhas.'),
      componente('ChartPie', 'Composição de um total em partes.'),
      componente('ChartDonut', 'Composição de um total, com o valor central em destaque.'),
      componente('ChartWaterfall', 'Formação de um resultado, passo a passo.'),
      componente('ChartRadial', 'Progresso de uma ou mais medidas contra a sua meta.'),
      componente('ChartScatter', 'Relação entre duas medidas numéricas.'),
      componente('ChartTreemap', 'Composição hierárquica por área.'),
      componente('ChartSunburst', 'Composição hierárquica por anéis concêntricos.'),
      componente('ChartSankey', 'Fluxo entre origens e destinos.'),
      componente('ChartTimeline', 'Intervalos de tempo dispostos em linhas, como a jornada de cada dia ou as tarefas de um projeto.'),
      componente('ChartHeatmap', 'Uma medida no cruzamento de duas categorias, pintada pela cor.'),
      componente('ChartMap', 'Regiões pintadas pelo valor e marcadores por coordenada, sobre a geometria que o produto fornece.'),
      componente('ChartGauge', 'Um valor numa escala com faixas de significado, como o atingimento de uma meta.'),
      componente('ChartTooltip', 'Leitura das medidas sob o ponteiro, em lista.'),
    ],
  },
  {
    nome: 'Feedback',
    componentes: [
      componente('Alert', 'Mensagem de estado dirigida ao usuário.'),
      componente('Progress', 'Progresso de uma operação, determinado ou não.'),
      componente('Spinner', 'Indicação de atividade em curso.'),
      componente('EmptyState', 'Ocupa o lugar do conteúdo que não há: sem registros, sem resultado ou falha ao carregar.'),
      componente('Skeleton', 'Lugar de um conteúdo que ainda carrega, na forma do que vai chegar.'),
      componente('Toast', 'Aviso flutuante sobre uma operação que acabou de acontecer.', {
        importa: 'ToastRegion, showToast',
      }),
    ],
  },
  {
    nome: 'Navegação',
    componentes: [
      componente('Breadcrumb', 'Caminho percorrido até a posição atual.'),
      componente('Pagination', 'Navegação entre páginas de um conjunto.'),
      componente('Tabs', 'Alternância entre painéis de conteúdo.'),
      componente('TabsNav', 'Faixa de abas em que cada aba é um endereço.'),
      componente('Steps', 'Etapas de um processo, com a atual destacada e as anteriores concluídas.'),
      componente('SkipLink', 'Atalho para o conteúdo principal, para quem navega por teclado.'),
    ],
  },
  {
    nome: 'Sobreposições',
    componentes: [
      componente('Dialog', 'Interação modal que interrompe o fluxo.'),
      componente('Drawer', 'Painel modal preso à lateral da tela.'),
      componente('Popover', 'Conteúdo ancorado a um gatilho, sem bloquear a página.'),
      componente('Tooltip', 'Descrição curta de um elemento, exibida no ponteiro ou no foco.'),
      componente('Menu', 'Lista de ações disparada por um gatilho.'),
    ],
  },
  {
    nome: 'Fundamentos',
    componentes: [componente('Paletas', 'Paletas de marca prontas e próprias, por data-palette e createPalette.', { importa: 'createPalette' })],
  },
  {
    nome: 'Ícones',
    componentes: [componente('Icon', 'Biblioteca oficial de ícones do Design System.', { importa: 'IconSearch' })],
  },
];
