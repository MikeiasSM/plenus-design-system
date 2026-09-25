# Catálogo de componentes

Este documento define o escopo de componentes do Plenustech Design System: quais componentes o Design System cobre, qual o papel de cada um na interface e onde ficam as fronteiras entre nomes próximos.

A divisão de responsabilidades entre os documentos é:

- `COMPONENTS.md` define **como** um componente é criado, composto, testado e nomeado.
- Este catálogo define **quais** componentes existem e **o que** cada um representa.
- `PROGRESS.md` acompanha o **estado** de cada implementação e não é normativo.
- A API de cada componente é definida pelo código, exposta por `src/index.ts` e demonstrada no Showcase.

Um componente entra neste catálogo mediante decisão de produto ou arquitetural aprovada. Estar previsto aqui não determina prioridade nem prazo.

## 1. Situação

Cada componente registra uma situação, em dois valores:

- **Disponível** — implementado e exportado pela API pública.
- **Previsto** — pertence ao escopo e ainda não foi implementado.

A situação indica a existência do componente, não a cobertura integral do papel descrito. O andamento detalhado pertence ao `PROGRESS.md`.

## 2. Ações

| Componente | Papel | Situação |
| --- | --- | --- |
| `Button` | Aciona uma operação. | Disponível |

## 3. Formulários

| Componente | Papel | Situação |
| --- | --- | --- |
| `Label` | Rótulo associado a um controle. | Disponível |
| `InputText` | Entrada de texto de linha única. | Disponível |
| `InputNumber` | Entrada numérica, inteira ou decimal. | Disponível |
| `InputPassword` | Entrada de senha, com revelação explícita. | Disponível |
| `InputCurrency` | Entrada monetária. | Disponível |
| `Textarea` | Entrada de texto de múltiplas linhas. | Disponível |
| `Checkbox` | Escolha binária independente. | Disponível |
| `RadioGroup` com `Radio` | Escolha única entre opções sempre visíveis. | Disponível |
| `Switch` | Alternância de um estado ativo. | Disponível |
| `DatePicker` | Entrada de data, digitada ou escolhida em calendário. | Disponível |
| `TimePicker` | Entrada de hora. | Disponível |
| `DateTimePicker` | Entrada de data e hora combinadas. | Disponível |

## 4. Listagem e escolha

| Componente | Papel | Situação |
| --- | --- | --- |
| `Select` | Campo de escolha única a partir de uma lista curta. | Disponível |
| `ComboBox` | Campo de listagem completo, com busca e seleção simples ou múltipla. | Disponível |
| `List` | Listagem visível na própria interface, com busca e seleção opcionais. | Disponível |

Os três nomes são próximos e a fronteira é o papel na interface, não a implementação.

`List` é a listagem que ocupa espaço na tela e permanece visível, onde selecionar é a própria tarefa. `Select` é o campo de formulário para escolha única em lista curta, sem busca. `ComboBox` é o campo completo, para os casos em que a lista é longa, precisa de busca ou admite mais de uma escolha.

Os três compartilham a mesma listagem interna. O consumidor escolhe pelo papel, não pela capacidade isolada.

## 5. Dados

| Componente | Papel | Situação |
| --- | --- | --- |
| `Avatar` | Representação visual de uma pessoa ou entidade. | Disponível |
| `Card` | Superfície que agrupa conteúdo, com cabeçalho e rodapé próprios. | Disponível |
| `Badge` | Rótulo curto de estado ou categoria. | Disponível |
| `Accordion` | Seções expansíveis de conteúdo. | Disponível |
| `Table` | Tabela básica, em HTML semântico. | Disponível |
| `DataGrid` | Grade completa, com ordenação, paginação, seleção, virtualização e demais comportamentos de grade. | Previsto |

O critério entre os dois é quem decide quais linhas existem na página. No `Table`, o consumidor escreve a linha e todas estão presentes. No `DataGrid`, o componente decide e mantém apenas a faixa visível, o que é o que torna possível a virtualização.

Daí decorre o resto: o `Table` usa marcação tabular nativa e a tabulação percorre os controles de cada célula; o `DataGrid` é um controle interativo, com navegação bidimensional entre células.

O `Table` não desenha contorno externo. O contorno pertence a quem o envolve, normalmente um `Card`.

## 6. Gráficos

| Componente | Papel | Situação |
| --- | --- | --- |
| `ChartBar` | Comparação por categoria, em barras verticais ou horizontais. | Disponível |
| `ChartLine` | Evolução de uma medida ao longo do tempo. | Disponível |
| `ChartArea` | Evolução com ênfase no volume acumulado. | Disponível |
| `ChartPie` | Composição de um total em partes. | Previsto |
| `ChartDonut` | Composição de um total, com o valor central em destaque. | Previsto |
| `ChartWaterfall` | Formação de um resultado, passo a passo. | Disponível |
| `ChartRadial` | Progresso de uma ou mais medidas contra a sua meta. | Previsto |
| `ChartScatter` | Relação entre duas medidas numéricas. | Disponível |
| `ChartTreemap` | Composição hierárquica por área. | Previsto |
| `ChartSunburst` | Composição hierárquica por anéis concêntricos. | Previsto |
| `ChartSankey` | Fluxo entre origens e destinos. | Previsto |

A cor de uma série se resolve em três níveis: a cor informada pelo consumidor vence; depois a intenção semântica — `positive`, `negative`, `warning` e `neutral` —, que usa os tokens de status e ignora a paleta; por fim a paleta categórica, que abre com a cor de tema quando houver.

Séries com intenção não entram na rotação categórica. Pintar uma despesa com a cor de tema escolhida pelo usuário trocaria o significado da barra a cada usuário.

O Design System entrega os gráficos. A tradução entre o manifesto de um dashboard e as propriedades de cada gráfico pertence à aplicação, conforme `ARCHITECTURE.md` §15.

## 7. Feedback

| Componente | Papel | Situação |
| --- | --- | --- |
| `Alert` | Mensagem de estado dirigida ao usuário. | Disponível |
| `Progress` | Progresso de uma operação, determinado ou não. | Disponível |
| `Spinner` | Indicação de atividade em curso. | Disponível |

## 8. Navegação

| Componente | Papel | Situação |
| --- | --- | --- |
| `Breadcrumb` | Caminho percorrido até a posição atual. | Disponível |
| `Pagination` | Navegação entre páginas de um conjunto. | Disponível |
| `Tabs` | Alternância entre painéis de conteúdo. | Disponível |

## 9. Sobreposições

| Componente | Papel | Situação |
| --- | --- | --- |
| `Dialog` | Interação modal que interrompe o fluxo. | Disponível |
| `Popover` | Conteúdo ancorado a um gatilho, sem bloquear a página. | Disponível |
| `Tooltip` | Descrição curta de um elemento, exibida no ponteiro ou no foco. | Disponível |
| `Menu` | Lista de ações disparada por um gatilho. | Disponível |

## 10. Ícones

| Componente | Papel | Situação |
| --- | --- | --- |
| Biblioteca oficial de ícones | Conjunto de ícones exposto pelo Design System, conforme `ARCHITECTURE.md` seção 12. | Previsto |

## 11. Fora do escopo

O Design System não cobre, conforme `ARCHITECTURE.md` seções 9.2, 11 e 15:

- Componentes que codificam conceitos de produto, como cliente, contrato, fatura, pedido ou usuário.
- Regras de negócio e transformação de dados de domínio.
- Infraestrutura de internacionalização, como catálogos, carregamento de traduções e contexto de idioma.
- Roteamento. Componentes de navegação recebem a abstração de link da aplicação.

Uma necessidade que caia em qualquer um desses casos permanece na aplicação consumidora.
