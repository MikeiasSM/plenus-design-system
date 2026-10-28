# Changelog

Mudanças de cada versão publicada de `@plenustech/design-system`, da mais recente para a mais antiga.

A política de versão está em `CONTRIBUTING.md` §11. Cada versão tem uma seção `## [X.Y.Z] — AAAA-MM-DD`, com os grupos que se aplicarem, nesta ordem: **Incompatível**, **Adicionado**, **Alterado**, **Corrigido** e **Removido**. Mudanças ainda não publicadas ficam em `## [Não publicado]`.

## [Não publicado]

### Adicionado

- `DataGrid`, fase 1: grade com colunas como dados, tipos de coluna, ordenação simples e empilhada, busca global, paginação no cliente e modo servidor por `onQueryChange`, seleção única e múltipla, janela virtual, teclado em dois modos e retrato do estado por `initialState` e `onStateChange`. Partes `DataGrid.Toolbar` e `DataGrid.Search`. Segue em desenvolvimento até o lançamento.

- `Pagination`: seletor de itens por página, com `pageSizeOptions` e o trio `pageSize`, `defaultPageSize` e `onPageSizeChange`. Ao trocar o tamanho, a página passa à que contém o primeiro item da atual. Com o seletor, o componente fica na tela mesmo com uma página só.
- `Pagination`: `showFirstLast`, os passos para a primeira e a última página.
- `Pagination`: `pageCount` deixa de ser obrigatório; sem ele, o total de páginas sai de `totalItems` e do tamanho da página.

### Corrigido

- `Select` sem `label` nomeia a lista aberta pelo `aria-label` do gatilho; antes ela se chamava "Selecione", o texto de espera.

## [0.4.0] — 2026-10-28

### Adicionado

- Paletas de marca: `data-palette="blue"` e `data-palette="purple"` trocam a identidade em qualquer elemento, inclusive numa subárvore. O laranja continua o padrão.
- `createPalette(cor, { onSolid })`: paleta própria de um produto, gerada e medida a partir de uma cor, para espalhar num elemento. Recusa a cor que mede menos de 1,5:1 contra a superfície clara, com o tom aceito mais próximo na mensagem.
- Token `--pl-color-primary-strong`, o traço da cor primária: texto, borda de seleção, anel de foco e aba ativa, a 4,5:1 sobre a superfície.
- Gráficos: `palette`, uma lista de cores em rotação ou `{ base }`, que gera os tons da cor base. Tipo `ChartPalette`.
- Clique na marca em todos os gráficos de dados, menos o `ChartGauge`, que mostra um valor só: `onBarClick` no `ChartBar`; `onPointClick` no `ChartLine`, no `ChartArea` e no `ChartScatter`; `onSliceClick` no `ChartPie` e no `ChartDonut`; `onMarkClick` no `ChartCombo`, para barras e pontos; `onTrackClick` no `ChartRadial`; `onNodeClick` no `ChartTreemap` e no `ChartSunburst`, com o caminho até o nó; `onFlowClick` no `ChartSankey`; e `onStepClick` no `ChartWaterfall`. Com ele, as marcas viram botões com uma parada de tabulação só, setas entre categorias e séries, `Home` e `End` nas pontas e `Enter` ou `Espaço` para ativar, e o balão abre no foco do teclado. Na linha e na área, o clique na faixa vale pelo ponto mais próximo. Tipos `ChartMarkClick` e `ChartScatterPointClick`.
- `ChartSankey`: `onNodeClick`, o clique no nó, com o rótulo e o total que passa por ele. Os nós ficam numa linha abaixo das ligações, alcançada pelas setas verticais. Tipo `ChartSankeyNodeClick`.
- `ChartPie` e `ChartDonut`: a fatia que reúne as pequenas traz em `grouped` as fatias reunidas, para o clique em "Outros" saber o que ela contém.

### Alterado

- Convenção de API (`CONTRIBUTING.md` §10). Os nomes antigos continuam aceitos, marcados como obsoletos, até a versão menor seguinte:
  - `Accordion`: `onExpandedKeysChange` completa o trio com `expandedKeys` e `defaultExpandedKeys`; `onExpandedChange` fica obsoleto.
  - `List`: `onValueChange` completa o trio com `value` e `defaultValue`; `onSelectionChange` fica obsoleto.
  - `SortableList` e `Tabs`: `onSelectedKeyChange` completa o trio com `selectedKey` e `defaultSelectedKey`; `onSelectionChange` fica obsoleto.
  - `Table`: `onSelectedIdsChange` completa o trio com `selectedIds` e `defaultSelectedIds`; `onSelectionChange` fica obsoleto.
  - `Tag` e `ButtonTile`: `defaultSelected` para o modo não controlado; viram botão de alternar com `selected`, `defaultSelected` ou `onSelectedChange`. O `ButtonTile` ganha também `onSelectedChange`.
  - `Steps`: `current` deixa de ser obrigatório; entram `defaultCurrent` e `onCurrentChange`, e `onStepChange` fica obsoleto. Sem etapa informada, começa na primeira.
  - `Pagination`: `defaultPage` para o modo não controlado; `page` e `onPageChange` deixam de ser obrigatórios.
  - `Dialog`, `Drawer` e `Popover`: `open` deixa de ser obrigatório; entram `defaultOpen` e `onOpenChange(open)`. `onClose` fica obsoleto e continua chamado ao fechar.
  - `Tooltip`: `defaultOpen`, quando o gatilho é filho.
  - `ChartMap`: `defaultHiddenClasses`, e `defaultSelectedRegion` com `onSelectedRegionChange` para a região escolhida; o clique escolhe a região e, na já escolhida, desfaz a escolha, quando o mapa usa seleção.
  - `InputText` e `Textarea` ganham `onValueChange(value)`; `Checkbox` e `Switch`, `onCheckedChange(checked)`, ao lado do `onChange` nativo.
  - `Badge`: tons `neutral`, `info`, `success`, `warning` e `danger`; `ok` e `warn` ficam obsoletos. O `primary` vira `variant="brand"`, a cor da marca, que ignora o tom; `tone="primary"` fica obsoleto. Tipo `BadgeVariant`.
  - Tamanho `lg`, de 56px, em `InputPassword`, `Textarea`, `Select`, `ComboBox`, `DatePicker`, `DateTimePicker`, `TimePicker` e `ColorPicker`; no `SegmentedControl`, o `lg` tem os 40px do `Button` lg. Tipo `InputPasswordSize`.
  - `ref` no tipo de `Avatar`, `Badge`, `Tag`, `Alert`, `Skeleton`, `Spinner` e `Label`. O `ToastRegion` passa a receber as propriedades nativas, o `ref` e a `className`; tipo `ToastRegionProps`.
- Formatadores em inglês: `formatCurrency`, `formatNumber`, `formatPercent`, `formatDate`, `formatTime`, `formatDuration` e `formatFileSize`, com as opções `currency`, `decimals`, `compact`, `locale`, `format` (`'short' | 'long' | 'numeric'`) e `seconds`. A sigla compacta passa de `'sigla'` a `'symbol'`. Tipos `CompactNotation`, `FormatCurrencyOptions`, `FormatDateOptions`, `FormatFileSizeOptions`, `FormatNumberOptions`, `FormatPercentOptions` e `FormatTimeOptions`. Os nomes em português — `formatarMoeda` e os demais, com os tipos `Compacto` e `OpcoesDe*` — ficam obsoletos: continuam funcionando, com as opções em português, até a versão menor seguinte.
- No tema claro, o traço do laranja passa do `orange.50` (3,03:1) ao `orange.70` (5,38:1) em links, abas, foco e bordas de seleção. O preenchimento continua o `orange.50`.
- No tema escuro, a cor primária desce ao passo 40 da paleta, e o texto sobre ela passa a preto. O container e a linha primários passam a ser misturas da paleta com a superfície.
- A borda no hover e o halo de foco dos campos derivam do traço primário.

### Corrigido

- `ChartHeatmap` com `squareCells`: o ângulo dos rótulos de coluna sai da coluna desenhada. Quando a altura manda, a coluna é mais estreita que a largura útil, e os rótulos se sobrepunham.
- Escala de cor com um valor só, e esse valor zero: a célula fica no passo mais claro, e não no meio da rampa.

## [0.3.0] — 2026-10-28

### Incompatível

- `ChartHeatmap`: a célula com `value: null` passa a ser hachurada, como no `ChartMap`; o cinza liso continua com `noDataStyle="neutral"`.
- `ChartHeatmap`: o cruzamento que não está em `cells` fica em branco, sem célula, sem foco e fora da contagem de sem dado. Antes ele era desenhado como sem dado.
- `ChartHeatmap`: a escala sequencial de valores não negativos, sem `domain`, parte do zero, e não mais do menor valor.
- `Button` e `ButtonIcon` passam à escala compacta, em degraus de 4px: `sm` de 28 para 32px, `md` de 42 para 36px e `lg` de 48 para 40px, todos com fonte de 14px. O `sm` usava 12px e o `lg`, 16px.
- `--pl-control-height-md` passa de 42 para 36px, e os campos médios acompanham: `InputText` e os demais montados no `Field`, `Select`, `ComboBox`, `InputPassword`, `DatePicker`, `TimePicker` e `DateTimePicker`.
- `SegmentedControl` passa de 34 para 32px no `sm` e de 42 para 36px no `md`.
- `FileUpload`: a zona de envio traz o ícone solto, sem caixa, o texto e as restrições em cima e o botão embaixo, agora "Escolher do computador". Antes, o botão ficava na frase, depois de "ou".

### Adicionado

- `ChartHeatmap`: `xAxisPosition` (`'bottom' | 'top'`), `squareCells`, `highlight` (`'cell' | 'rowColumn'`) e `noDataStyle`.
- `ChartHeatmap`: o botão "Ver como tabela", que troca o desenho por uma tabela de linhas por colunas.
- `ChartHeatmap`: `Ctrl+Home` e `Ctrl+End` vão aos cantos da grade, e as setas saltam os cruzamentos em branco.
- `ChartHeatmap`: em desenvolvimento, aviso no console para célula repetida ou fora de `xCategories` e `yCategories`.
- `ChartTooltip`: `anchor`, ponto fixo do balão, usado para abri-lo no foco do teclado.
- Tipos `AxisPosition`, `ChartHeatmapHighlight` e `NoDataStyle`.
- `Button` e `ButtonIcon`: variante `dangerGhost`, a destrutiva discreta, com o texto e o ícone em vermelho e o fundo vermelho suave sob o ponteiro, para excluir dentro de linhas, listas e barras.

### Corrigido

- `ChartHeatmap`: o valor escrito na escala contínua e nas faixas de cor própria ficava abaixo de 4,5:1 em parte dos tons; agora leva a cor do texto do tema com halo da superfície. Nas faixas da rampa padrão, segue o preto e o branco medidos por passo.
- `ChartHeatmap`: o balão abre na célula sem dado e no foco do teclado.
- `ChartHeatmap`: `onHoverCell` não recebe mais `null` entre uma seta e outra, e o balão não pisca ao cruzar o vão entre as células.
- `ChartHeatmap`: o vão entre células cai para 1 px quando a célula tem menos de 14 px.
- Os campos pequenos mediam 36px apesar do token de 32px: o respiro vertical era escrito à parte e vencia o `min-height`. O respiro dos campos e do `Button` `sm` e `md` passa a sair do token.
- O botão do calendário e o do horário empurravam a caixa do `DatePicker`, do `TimePicker` e do `DateTimePicker` pequenos; agora ocupam a altura da caixa.
- O pacote publicado é o mesmo que passou pelas conferências da publicação: o fluxo empacota o build conferido e publica esse arquivo, em vez de reconstruir o pacote no momento de publicar.

## [0.2.7] — 2026-10-27

### Adicionado

- `ChartHeatmap`, matriz de calor de duas categorias, com escala sequencial, divergente ou por faixas, valor na célula quando cabe e células clicáveis percorridas pelas setas.
- `ChartColorScale` e `ChartColorCategory`, a escala de cor antes exclusiva do `ChartMap`, agora compartilhada.

### Alterado

- `ChartMapColorScale` e `ChartMapCategory` passam a apelidos obsoletos de `ChartColorScale` e `ChartColorCategory`, e saem na 0.4.0.

## [0.2.6] — 2026-10-27

### Adicionado

- Os quinze gráficos aceitam as propriedades nativas da figura (`className`, `style`, `id`, `aria-*`) e o `ref`, e ganham `hideTitle`, que deixa o título só para o leitor de tela. O tipo `ChartRootProps` é exportado.
- Os módulos que usam hook, contexto ou portal saem com `'use client'`, para importar a biblioteca num Server Component do Next.

### Alterado

- Hover e foco dos controles deixam de parecer iguais: o hover usa uma borda mais suave, `--pl-control-border-hover`, e o halo do foco, `--pl-control-focus-halo`, fica mais visível. Com o ponteiro sobre um campo focado, o foco prevalece.
- O pacote passa de `UNLICENSED` para licença proprietária, descrita em `LICENSE`: o uso fica restrito aos produtos da Plenustech.
- O pacote publicado leva o `CHANGELOG.md`.

### Corrigido

- `@types/d3-geo` e `@types/d3-hierarchy` passam a dependências: as declarações públicas os importam, e o consumidor com TypeScript estrito não os achava.
- A coluna de seleção única da `Table` tem nome no cabeçalho, para o leitor de tela.
- O aviso da licença MIT do Bootstrap Icons volta a acompanhar o pacote, no `LICENSE`. O build retirava o comentário que o carregava.

## [0.2.5] — 2026-10-18

> Publicada como correção, embora traga mudança incompatível. Anterior à política de versão.

### Incompatível

- `TooltipProps` passou de interface a união de tipos, com filho ou com âncora. Quem declarava `interface X extends TooltipProps` passa a usar `type X = TooltipProps & {...}`.

### Adicionado

- Suíte completa de ícones, com os 2.050 desenhos do Bootstrap Icons 1.11.3, no subcaminho `@plenustech/design-system/icons`.
- Realce de Delphi no `CodeBlock`.
- `Tooltip` controlado, com `open` e `onOpenChange`, e `anchorRef` para ancorar fora do filho.
- Opção do `Select` com `description` e `icon`.
- `Pagination` com `totalItems` e `pageSize`, que mostram o intervalo e o total; `formatRange` troca o texto.
- `InputText` e `Field` no tamanho `lg`, pelo token `--pl-control-height-lg`.
- `Timeline` com `size="sm"`.

### Corrigido

- `Menu` converte o atalho escrito no nome das teclas que `aria-keyshortcuts` pede.
- `Toolbar` ancorada acompanha a rolagem de qualquer ancestral e a mudança de tamanho da âncora.
- `ButtonTile` `sm` não quebra mais a palavra no meio.

## [0.2.4] — 2026-10-18

> Publicada como correção, embora traga mudança incompatível. Anterior à política de versão.

### Incompatível

- `DialogProps` passou de interface a união de tipos, para exigir `aria-label` sem `title`. Quem declarava `interface X extends DialogProps` passa a usar `type X = DialogProps & {...}`.

### Adicionado

- `ChartTimeline`, `ChartMap` e `ChartGauge`, com os tokens das escalas de valor e a dependência `d3-geo`.
- Formatador `formatarDuracao`.
- `TabsNav`, para abas que são endereços.
- `Dialog` sem `title`, sem cabeçalho.
- Opção do `ComboBox` com `description`, `icon` e `group`.

## [0.2.3] — 2026-10-18

> Publicada como correção, embora traga mudanças incompatíveis. Anterior à política de versão.

### Incompatível

- `showDots` e `showDataLabels` deixam de ser booleanos e passam a `'visible' | 'hidden' | 'onHover'`, com padrão `'onHover'` nos pontos, `'hidden'` nos rótulos e `'visible'` na cascata.
- O `ChartTooltip` vem integrado nos gráficos com costura, ligado por `showTooltip`. Quem monta o próprio balão em volta do gráfico passa `showTooltip={false}`.
- O eixo `onHover` deixa de reservar a calha: o gráfico ocupa o espaço todo e encolhe quando o eixo entra.

### Adicionado

- `Tag`, `SegmentedControl`, `Drawer`, `Toast`, `Skeleton`, `Steps`, `SkipLink`, `ButtonTile`, `Toolbar`, `CheckboxGroup`, `ColorPicker`, `FileUpload`, `Timeline` e `SortableList`.
- Ícones de interface geral e do editor.
- Balão nos doze gráficos e `formatTooltipValue`.
- `compacto: 'sigla'` em `formatarNumero` e `formatarMoeda`.
- `InputText` com `icon`; `Field` entrega a `className` com o visual dos campos.
- `Accordion` com `headingLevel`; `Menu` com `icon`, `shortcut`, `tone="danger"`, `checked` e seções; `Tabs` com `fitted` e `fillHeight`.
- Tokens `--pl-control-height-sm` e `--pl-control-height-md`.

### Corrigido

- A última série desligada pela legenda sai encolhendo, sem esticar para fora do gráfico.
- Pontos e rótulos legíveis sobre a área empilhada, e rótulos de séries vizinhas que não se atropelam.

## [0.2.2] — 2026-10-18

> Publicada como correção, embora traga mudanças incompatíveis. Anterior à política de versão.

### Incompatível

- `Table.Body` troca `empty` por `emptyTitle` e `emptyDescription`, e o vazio aparece mesmo sem eles.
- O `Badge` passa de 14px a 12px.
- O texto da `Table` sai da fonte mono para a Montserrat.

### Adicionado

- `ButtonIcon`, `CodeBlock` e `EmptyState`.

### Alterado

- O pacote sai com um módulo por arquivo. Quem importa pelo nome do pacote não percebe a troca; o caminho direto para `dist/plenus-design-system.es.js` deixa de existir.
- `Dialog` redesenhado, com cabeçalho e rodapé fixos e ícone opcional.
- `Accordion` troca o mais e o menos pelo chevron.

## [0.2.1] — 2026-10-18

> Publicada como correção, embora traga mudanças incompatíveis. Anterior à política de versão.

### Incompatível

- A `Table` `md` passou de 72px para 60px por linha, e a `sm` de 64px para 48px.
- O item de `Table.Body` precisa ter `id`.
- `ComboBoxProps` passou de interface a união de `ComboBoxSingleProps` e `ComboBoxMultipleProps`.
- O `role` do `Dialog` só aceita `dialog` e `alertdialog`.
- Os nomes acessíveis da `Pagination` e do `Breadcrumb` ganharam acento; teste que os procura sem acento deixa de achar.

### Adicionado

- `ComboBox` com `selectionMode="multiple"`.
- `Pagination` com `disabled`.
- `Dialog` com `role="alertdialog"`.
- `label` do `Checkbox` opcional e aceitando conteúdo.

### Corrigido

- `Menu` aberto na primeira renderização não quebra mais no servidor.
- Painéis de `Select`, `ComboBox` e seletores de data e hora legíveis e operáveis dentro do `Dialog`.
- Erro de campo anunciado quando aparece.
- Linha da `Table` chaveada pelo `id`, sem devolver o foco à linha errada depois de reordenar.

## [0.2.0] — 2026-09-28

### Incompatível

- `DatePicker`, `TimePicker` e `DateTimePicker` recebem e emitem texto ISO, e não os tipos do `@internationalized/date`; sem valor, emitem `null`, e não `undefined`.
- `Popover` não prende mais o foco, e o clique no gatilho é do consumidor.
- As propriedades nativas do `Progress` vão ao elemento de fora, o `progressbar`.
- O `Button` médio passou de 39px para 42px; os seletores passaram à altura e ao raio do `InputText`.
- Na `Table`, a linha não tem `aria-selected`, os breakpoints de `hideBelow` passaram a 900, 1180 e 1280, e os controles de seleção ganharam o visual do sistema.
- Passos da `Pagination` e dias indisponíveis do calendário usam `aria-disabled`, e não `disabled`.
- `Select`, `ComboBox` e seletores obrigatórios barram o envio vazio.
- Gráficos: rótulo preto sobre cores claras, eixo direito do `ChartCombo` alinhado no zero, `<title>` de volta em sete gráficos, total na barra empilhada e centro reservado no `ChartRadial`.

### Removido

- `logScale` e `timeScale`.

## [0.1.2] — 2026-09-25

### Adicionado

- Publicação automática no npm ao empurrar uma tag de versão.

## [0.1.1] — 2026-09-25

Primeira versão publicada no npm: componentes de ações, formulários, exibição de dados, feedback, navegação e sobreposições; a família de gráficos; tokens, temas claro e escuro, formatadores e ícones.

## [0.1.0] — 2026-09-19

Base conceitual e documentação normativa. Não publicada.
