# Progresso de implementacao

Este documento acompanha a implementacao do Plenustech Design System em relacao a documentacao oficial do repositorio.

Ele nao substitui, interpreta ou altera `README.md`, `ARCHITECTURE.md`, `COMPONENTS.md`, `TOKENS.md` ou `CONTRIBUTING.md`. Esses documentos sao a fonte normativa do projeto. As diretrizes de programacao, idioma, nomenclatura e referencias externas estao em `CLAUDE.md`, subordinadas a eles.

O historico cronologico das alteracoes esta no `git log`. Aqui ficam o estado atual, as decisoes que nao devem ser reabertas sem motivo novo, e o que vem a seguir.

## Estado atual

557 testes em 68 arquivos. Build da biblioteca e do Showcase validados.

### Inventario

Os componentes assinalados como disponiveis em `COMPONENTS-CATALOG.md` estao implementados, testados e exportados por `src/index.ts`. O catalogo e a fonte dos nomes e do papel de cada um; aqui fica apenas o estado.

Outros modulos:

- `src/components/icons` — biblioteca oficial de icones. A base `Icon` e **interna** e fecha o conjunto; os icones
  em si sao publicos, com nomenclatura de familia.
- `src/components/forms/Field` — cromo de campo compartilhado, agora **publico**, com testes proprios.
- `src/hooks/useCharacterCount` — contagem de caracteres, controlada ou nao. **Interno**, nao exportado. Serve apenas `InputText` e `Textarea`, os campos de texto plano.
- `src/hooks/useSelection` — State Motor de selecao, com `selection.ts` puro e a ligacao React. **Interno**, nao exportado. Serve `Menu`, `Select`, `ComboBox`, `Tabs`, `Accordion` e `List`. Alem das chaves escolhidas, retem os itens, para que a escolha sobreviva ao item sair da colecao filtrada.
- `src/components/data-display/List/useListing` e `ListingOptions` — a listagem compartilhada: colecao, filtro, teclado, ARIA, marcacao e virtualizacao. **Internos**, nao exportados. Servem `List`, `Select` e `ComboBox`.
- `src/components/data-display/List/useVirtualWindow` — janela virtual da listagem. **Interno**, pertence ao componente conforme `ARCHITECTURE.md` secao 8.

  A janela sustenta a rolagem por dois espacadores, e a altura deles e a lista inteira. Como `.options` e um flex em coluna com rolagem, **os espacadores e as opcoes precisam de `flex: none`**: sem isso o flex renegocia a altura de todo filho encolhivel quando o conteudo excede o container, e o espacador de centenas de milhares de pixels e o primeiro a ceder. A altura util passa a depender da distribuicao do encolhimento, que depende da janela, que depende da rolagem — e a barra oscila sem a lista andar. O defeito aparecia no fim da lista, onde o espacador de cima e maior. Visto em navegador; o jsdom nao tem layout e a suite nao o alcanca.
- `src/hooks/useCalendar` — State Motor de calendario, com `calendar.ts` puro e a ligacao React. **Interno**, nao exportado. Serve `DatePicker` e, por ele, `DateTimePicker`.
- `src/utils/textSearch` — comparacao textual que ignora caixa e acento, sobre `Intl.Collator`. **Interno**, nao exportado. Serve o typeahead do motor e o filtro do `ComboBox`.
- `src/components/forms/TimePicker/TimeSlots` — campo `hh:mm` e lista de horarios do painel. **Interno**, nao exportado. Serve `TimePicker` e `DateTimePicker`.
- `src/utils/formatters` — mascaras de entrada `formatarEntradaDecimal`, `formatarEntradaMonetaria` e `formatarEntradaData` com `lerEntradaData`, **nao exportadas**, e os formatadores de apresentacao `formatarData` e `formatarHora`, **exportados** conforme `ARCHITECTURE.md` secao 9.1.
- `src/components/charts/core` — o que os onze graficos compartilham. `ChartFrame` e a moldura de todos: titulo,
  area de desenho, estado vazio e legenda. `CartesianFrame` e uma camada sobre ela, com grade e eixos. Ao lado,
  `ChartLegend`, o calculo de layout de `cartesianLayout.ts`, as medidas de `spacing.ts`, a medida e o corte de
  texto de `measureText.ts`, o texto de centro de `centerText.ts`, os caminhos de `shapes.ts` e `arcs.ts`, o
  agrupamento de `slices.ts`, `useChartMetrics`, `useSliceRing`, `useSeriesToggle` e `useTweenedNumbers`.
  **Internos**, nao exportados, exceto os tipos que aparecem na API publica dos graficos.
- `src/tokens` — camadas primitiva e semantica. `src/styles/tokens.css` ainda carrega o bloco legado.

Dependencias de runtime: `react`, `react-dom`, `@react-aria/focus`, `@react-aria/overlays`, `@internationalized/date`, `d3-scale`, `d3-array`, `d3-shape`, `d3-hierarchy` e `d3-sankey`. Todas externalizadas no build.

### Decisoes tomadas

Registradas para nao serem reabertas sem motivo novo. O porque importa mais que o que.

**Dependencias e arquitetura**

- React Aria entra **apenas como primitivo de comportamento sem estado**: foco, posicionamento, rolagem, ponteiro e internacionalizacao. Maquinas de colecao, selecao e navegacao permanecem como State Motors proprios, conforme `ARCHITECTURE.md` secao 7. Os hooks vetados estao nomeados em `CLAUDE.md`.
- Descartados como fundacao: `react-aria-components` e `react-stately`, por cederem a maquina de estado; Radix e shadcn/ui, por cederem tambem o DOM; Tailwind, por conflitar com o CSS Modules exigido em `ARCHITECTURE.md` secao 4.
- `@react-aria/focus` e `@react-aria/overlays` sao externalizados no build, junto de `react/jsx-runtime`, para nao serem embutidos no pacote.
- Untitled UI guia o visual sempre que houver referencia correspondente. Consultar **antes** de arbitrar tratamento visual, nao depois.

**Validacao**

- O contraste e medido por `scripts/check-contraste.mjs`, que le os tokens na ordem da cascata, resolve as cadeias de `var()` e mede os dois temas. Ele nao e um teste do Vitest porque nao ha componente envolvido: o que se verifica e o valor do token, e ligar o processamento de CSS no jsdom sairia caro para medir o que o arquivo ja declara.
- As reprovacoes aceitas vivem declaradas **no script**, e nao so em prosa. Uma quinta reprovacao derruba o comando.
- A ordem dos arquivos no script copia a de `tokens.css`: os `@import` primeiro e o bloco legado depois, porque e ele quem vence onde redeclara. Medir na ordem errada daria um laudo que nao corresponde ao que o navegador aplica.
- O pacote construido e conferido por `scripts/check-pacote.mjs`, fora da suite: `dist/` nao existe antes do build, e um teste que se pula sozinho esconde a falha que deveria mostrar.
- A separacao entre series sob deficiencia de visao de cores **nao** entra nesses scripts. Ela foi medida a parte e continua sem ferramenta no repositorio.

**Correcoes vindas do primeiro consumo real**

- Um relatorio de integracao com o PlenusLAB, sobre o commit `a9df04c`, levantou cerca de cento e cinquenta pontos. As afirmacoes de maior peso foram reproduzidas antes de qualquer conserto, e uma delas **nao reproduziu**: `formatarHora('00:05', 'en-US')` devolve `00:05` no Node 24, e nao `24:05` — deve depender da versao do ICU. A troca de `hour12` por `hourCycle` foi feita assim mesmo, porque esta certa.
- Tres dos achados eram regressoes desta mesma sessao: o `ChartBar` quebrando com serie nova, o `chartSeriesIn` sem definicao e o `prepare` arrastando o Showcase. Os tres corrigidos.
- **O ponto e ambiguo e nao pode ser descartado sem olhar.** Em pt-BR ele separa milhar, mas teclado numerico e texto colado de origem inglesa o usam como decimal. `formatarEntradaDecimal` passou a le-lo como decimal quando e o unico e o que vem depois nao forma grupo de milhar. Antes, colar `12.50` gravava `1250`.
- **Numero que vem de fora arredonda; o que esta sendo digitado trunca.** Sao coisas diferentes: no primeiro caso o valor esta pronto e truncar e perda; no segundo ele esta pela metade.
- **Data sem hora entra pelo fuso local; o resto vai inteiro para o `Date`.** O corte por hifen engolia o `T` e devolvia vazio para tudo que sai de `toISOString()`.
- **Um diagrama de fluxo e aciclico.** O `ChartSankey` detecta ciclo e autolaco antes de chamar o `d3-sankey`, que lancava e derrubava a arvore. Anuncia em vez de descartar ligacao pelas costas.
- **Com sinais mistos, o total nao define a pilha.** `+10` e `-5` somam `5`, mas o segmento positivo chega a `10` e era desenhado por cima do titulo. `stackedExtremes` devolve o caminho do acumulado, e nao so o fim dele.
- **O React 19 trata `ref` como propriedade**, entao os campos passaram a aceita-lo sem `forwardRef`, com `mergeRefs` juntando o interno ao de fora. Antes nenhum campo entregava o elemento nativo.

**Fronteira com a aplicacao hospedeira**

- **O CSS global foi partido em dois, por decisao do mantenedor, depois do primeiro consumo real.** `styles/base.css` viaja com os componentes e traz so o que eles exigem do documento; `styles/reset.css` e opcional, sai como arquivo proprio em `dist/reset.css` e carrega a base de pagina — corpo, titulos, links, controles nativos, selecao, barra de rolagem. Antes disso, instalar a biblioteca reescrevia o `body`, os titulos, o `select` nativo e a barra de rolagem do hospedeiro, que e o oposto do que o `README.md` promete quando diz que as aplicacoes consomem.
- A regra e: **o que um componente precisa para estar correto mora no modulo dele.** Separar sem isso seria pior que nao separar, porque quem importasse so o CSS dos componentes receberia padding errado em silencio. Na pratica sobrou o `box-sizing` em `base.css`, e dois consertos: `Field` passou a declarar a propria familia tipografica, que herdava do `body`, e `Accordion` e `Pagination` ganharam anel de foco proprio, que era o unico par que dependia do `:focus-visible` global.
- **Uma regra de pagina continua viajando com os componentes, de proposito**: o bloco de `prefers-reduced-motion` com `!important`. Dezoito modulos animam sem guarda propria, e sem ele a preferencia deixaria de valer para quase toda a biblioteca. Ele so age quando a pessoa pediu menos movimento, que e quando passar por cima do hospedeiro e o comportamento certo. Dar guarda propria aos dezoito e o que permitiria move-lo para o reset.
- Medido no pacote construido: o CSS dos componentes nao tem mais nenhum seletor de elemento nu, e `body`, barra de rolagem e `select` nativo so existem no reset.

**Distribuicao**

- O pacote foi conferido por instalacao real sob a configuracao mais severa que um consumidor pode usar: `moduleResolution: nodenext`, `skipLibCheck: false` e `noUncheckedSideEffectImports`. Zero erros. Antes disso reprovava em quatro frentes.
- As declaracoes saem com **extensao explicita**, acrescentada no pos-build. Sem ela, `node16` e `nodenext` recusam cada import relativo — eram 97 erros. Corrigir no fonte custaria reescrever duzentos imports por uma exigencia de empacotamento.
- `@types/d3-scale` e **dependencia**, e nao dependencia de desenvolvimento: a declaracao publica de `cartesianLayout` alcanca `scales`, cujo tipo de retorno vem do `d3-scale`. Tipo que aparece na API publica e dependencia de quem consome.
- O `tsc` copia para a declaracao os imports de efeito colateral do ponto de entrada, inclusive os de CSS. Esses caminhos nao existem no pacote e sao removidos no pos-build.
- As folhas publicadas tem declaracao propria, ligada pela condicao `types` do `exports`. Sem ela o consumidor com `noUncheckedSideEffectImports` reprova ao importar o CSS por subcaminho.
- O build emite **sourcemap**. Sem ele, depurar a biblioteca dentro do consumidor era ler codigo minificado.

- `react` e `react-dom` sao **peer dependencies**, nao dependencias. Instalados como dependencia, o
  consumidor receberia uma segunda copia do React e todo hook quebraria. Eles permanecem em
  `devDependencies` porque o build e a suite precisam deles aqui.
- A extensao do bundle CommonJS e `.cjs`, e nao `.cjs.js`. Com `type: module` no pacote, o Node le
  qualquer `.js` como ESM: o arquivo carregava sem erro e exportava **zero** simbolos. So a
  instalacao real pegou isso; nenhum teste da suite toca o pacote construido.
- As declaracoes saem do proprio `tsc`, por `tsconfig.build.json`, em vez de um plugin. Nao ha
  problema concreto que justifique a dependencia.
- `prepare` constroi o pacote, para que a instalacao direta do repositorio funcione: `dist/` e
  ignorado pelo git, e sem o script o consumidor receberia um pacote vazio. O custo e conhecido e
  aceito: o script tambem roda a cada `npm install` feito aqui dentro.
- `prepare` chama `build:pacote`, e **nao** `build`. O `build` roda `tsc -b`, que inclui o projeto
  do Showcase: um erro de tipo la impedia instalar o pacote. O `build:pacote` verifica apenas `src`.
- A folha de estilo nao entra pelo bundle: o Vite a extrai, e o consumidor a importa por
  `@plenustech/design-system/styles.css`, um caminho do mapa de `exports`.

**Nomenclatura e idioma**

- Componentes de uma familia usam tipo seguido de especializacao: `InputText`, `InputNumber`, `InputPassword`, `InputCurrency`. Conceito unico mantem nome simples.
- Componentes, hooks e tokens em ingles; formatadores e utilitarios de apresentacao em portugues.
- O idioma dos tokens foi confirmado como ingles pelos documentos de referencia de cores e tipografia, que prevalecem sobre os exemplos conceituais de `TOKENS.md` secao 3.
- `COMPONENTS.md` secao 12 atualizada: `Table` para o componente basico e `DataGrid` para o completo.

**Padroes de componente**

- `Field` concentra rotulo, ajuda, erro, contador e a fiacao de `id` e `aria-describedby`. O valor da contagem fica em cada controle, que e quem detem o valor.
- Campos **derivam** o valor exibido em vez de espelhar estado em efeito.
- Os formatadores de entrada sao mascaras, distintas do `formatarMoeda` de apresentacao previsto em `ARCHITECTURE.md` secao 9.1, que ainda nao existe.
- `Menu` e `Select` devolvem o foco ao gatilho por conta propria. O `restoreFocus` do `FocusScope` nao era observavel em teste e mascarava a ausencia.
- Espalhar `overlayProps` e declarar `onKeyDown` em seguida **substitui** o manipulador da biblioteca. Encadear, sempre.
- A contagem de caracteres nao controlada vive em `useCharacterCount`, que ouve o evento `reset` do formulario e restaura a contagem inicial. Sem isso, a contagem ficava presa ao ultimo valor digitado enquanto o campo voltava ao inicial.
- A API do `Avatar` aceita apenas atributos validos nos dois elementos que ele pode renderizar. Atributos exclusivos de `img` acabavam no `span` de fallback.

**Decisoes visuais do mantenedor**

- Borda dos controles: neutra em repouso, `--pl-color-primary` no hover. O hover e o unico estado que altera a borda.
- Hover dos controles acrescenta elevacao discreta com `--pl-sh-1`.
- Foco dos campos: borda em `primary` mais halo de `primary-container`. O `outline` deslocado foi adotado e revertido, por produzir borda dupla.
- Hover de itens de lista em `Menu`, `Select` e `ComboBox`: `primary-container` com texto em `on-primary-container`.
- Hover do cabecalho do `Accordion` muda apenas texto e icone, sem preencher o fundo.
- A `Table` usa a familia mono em **todo** o conteudo, nao apenas nas colunas de valor. Confirmado pelo mantenedor.
- `Progress` e `Spinner` usam `primary-hover`, o tom mais claro que alcanca o minimo de 3:1 contra o trilho.

**Acessibilidade**

- Contraste validado em WCAG AA nos dois temas, exceto as excecoes registradas adiante.
- `prefers-reduced-motion` respeitado globalmente.
- `Button` em carregamento usa `aria-disabled` com `aria-busy`, preservando o foco. O clique e bloqueado no handler.
- Contadores de caractere nao usam `aria-live`, que anunciava a cada tecla. A contagem fica acessivel por `aria-describedby`.

### Em construcao

- **Verificacao em navegador real, por Playwright.** Duas coisas medidas em Chrome, contra o Showcase servido: o movimento ao desligar uma serie pela legenda anima — a largura da barra caminha 55,6 → 34,3 → 16,5 → 3,2 → 0 em cerca de 200ms, e a altura acompanha o eixo reescalando —, e a lista virtual assenta no fim, com `scrollTop` fixo em 399.764 contra `scrollHeight` de 400.004, que e `10000 x 40 + 4` como a conta previa. O `prefers-reduced-motion` reportado pelo navegador limpo e `false`.
- O MCP do Playwright esta configurado no escopo local do projeto. Ele so entra em vigor numa sessao nova, porque servidores MCP sao carregados na abertura.
- **O Showcase estatico foi removido, e a entrada oficial passa a ser unica: `showcase/app`.** Ele era o mock de uma implementacao anterior — 53 KB de HTML escrito a mao e 44 KB de CSS que reimplementava estilo de producao, exatamente o que `README.md` nega ao Showcase. Nenhum script o alcancava: a raiz do `vite.config.ts` ja era `app`, e a entrada React cobre 53 secoes contra 38 dele.
- Saiu com ele a documentacao **visual** de fundamentos: cores, tipografia, espacamento, raios e sombras e estrategia de CSS. O conteudo continua normativo em `TOKENS.md` e nos dois documentos de referencia; o que se perdeu foi a pagina que o desenhava. Esta no historico do git, se for para repor.
- Showcase sem formatador improvisado: as vinte e oito funcoes de formatacao escritas a mao nos graficos deram lugar aos formatadores de apresentacao. Sobraram duas, e ambas acrescentam unidade de dominio — `dias` — que nao pertence ao Design System.
- Showcase com alternancia de tema no topo da barra lateral, para inspecionar o claro e o escuro lado a lado. A escolha guardada vence; sem ela, vale a preferencia do sistema. E inspecao manual, nao substitui o teste automatizado de tema escuro que continua pendente.
- Expansao do Showcase React para os proximos componentes oficiais.
- Consolidacao do bloco legado de `tokens.css` com as camadas primitiva e semantica.
- Validacao da carga das familias e pesos tipograficos definidos.

### Ainda nao implementado

- O `DataGrid` da etapa 10.
- Ligacao do `ChartTooltip` aos doze graficos. A costura existe em `ChartBar`, `ChartCombo`, `ChartWaterfall`, `ChartPie` e `ChartDonut`. Faltam as faixas invisiveis de `ChartLine` e `ChartArea`, o `ChartSunburst` e o `ChartTreemap`, A troca do `<title>` por `aria-label` ja esta feita.
- State Motor da grade, para o `DataGrid`.
- Temas alternativos de marca, previstos em `TOKENS-REFERENCE-COLORS.md`.
- Testes de tema escuro, de importacao do pacote construido e verificacao automatizada de contraste.
- Pipeline de validacao e publicacao do pacote.
- Showcase consumindo o pacote como aplicacao externa, em vez do alias local.

## Pendencias de correcao identificadas no review

- **`npm run check:contraste` reprova hoje**, com uma unica falha nao declarada: `--pl-chart-series-4` mede 2.55:1 contra a superficie clara, abaixo do piso de 3:1 que a WCAG 1.4.11 pede a objeto grafico. Depende de decisao do mantenedor, porque o corpus normativo nao fixa piso para marca de dado e porque a alternativa tem custo: `brand.blue.60` levaria a serie a 7.77:1 contra a superficie, mas a separacao dela para a serie 1 cairia de 2.37:1 para 1.29:1.
- Definir o idioma dos tokens de raio, espacamento e motion na consolidacao de `tokens.css`. Nenhum documento de referencia os cobre, e `TOKENS.md` secoes 7 e 8 os exemplifica em portugues.
- Promover as decisoes arquiteturais registradas no cabecalho de `tokens.css` para o documento normativo adequado, antes de enxugar o comentario.
- Exportar as mascaras de entrada pela API publica quando fizerem parte do contrato de consumo. Os formatadores de apresentacao `formatarData` e `formatarHora` ja sao exportados.
- Consolidar os tokens antigos e novos, removendo ambiguidades entre `tokens.css` e as camadas primitivas/semanticas.
- Ampliar testes para controlled inputs, temas dark, limites de escala, acessibilidade e importacao do pacote construido.
- Verificar em navegador real o foco inicial e a contencao de foco dos overlays. O jsdom trata como invisivel todo elemento em portal, por nao ter layout, entao `autoFocus` e `contain` do `FocusScope` nao sao observaveis na suite. O retorno de foco, esse sim, e verificado.

## Excecoes de contraste aceitas

Falhas conhecidas, mantidas por decisao visual do mantenedor apos comparacao lado a lado das alternativas.

- `Button` variante `primary` solida: texto branco sobre `brand.orange.50` em 3.03:1, contra o minimo de 4.5:1. Mantido o laranja de marca. Vale nos **dois** temas: `color.primary` nao muda no escuro.
- `Button` variante `primary` solida, contorno contra o fundo da pagina: 2.83:1 no tema claro, contra o minimo de 3:1. Passa em 6.03:1 no tema escuro.
- `--pl-color-border-strong` como contorno de campo em repouso: 1.33:1 no claro e 1.57:1 no escuro, contra o minimo de 3:1. Mantida a borda discreta. No hover e no foco a borda alcanca 3.03:1 e 5.57:1.
- Halo de foco em `primary-container`: 1.08:1, decorativo. O sinal acessivel do foco e a troca da borda, nao o halo. Consequencia: com ponteiro, foco e hover ficam visualmente iguais. Quem depende do indicador de foco navega por teclado e nao dispara hover.

As demais combinacoes de texto e de componente passam em AA nos dois temas.

## Contexto para implementacoes futuras

### Familia de listagem: List, Select e ComboBox

Decisoes tomadas em discussao com o mantenedor, antes de qualquer implementacao. Os cenarios existem hoje nas duas aplicacoes principais: escolha simples, listagem com selecao unica, listagem com selecao multipla, listagem simples com busca e listagem com selecao e busca.

- Tres componentes publicos e um motor interno. `List` e a listagem visivel na tela. `ComboBox` e o componente completo: campo mais painel, com selecao simples ou multipla e busca. `Select` permanece simples: escolha unica, lista curta, sem busca.
- `ComboBox` nao compoe `Select`. Os dois compoem a mesma listagem interna, porque o que compartilham e o painel, nao o campo. Compor o completo sobre o simples inverteria a dependencia e colocaria um botao com `aria-haspopup` dentro de um campo `role="combobox"`.
- Cada cenario e um modo, nunca um componente novo nem um booleano acumulado. Nada de `MultiSelect` ou `SearchableSelect`.
- Regra de corte entre parte e modo: o que ocupa espaco na tela e o produto precisa controlar e parte, e vira composicao; o que e comportamento sem estrutura propria e modo, e vira propriedade. A busca e parte. A selecao e modo.
- O papel ARIA acompanha o modo: sem selecao a marcacao e de lista; com selecao, de listbox. `COMPONENTS.md` secao 7 pede ARIA somente quando necessario.
- A selecao trabalha com os itens escolhidos, nao com chaves. Com busca no servidor o item selecionado normalmente nao esta na colecao carregada, e sem o rotulo nao ha como exibi-lo no campo nem no topo do painel. Por isso `sanitizeSelection`, que hoje nao possui consumidor, desaparece: descartar chaves fora da colecao e a regra oposta da necessaria.
- Busca: filtro local para listas curtas, filtro externo para as grandes. Quando externo, o componente avisa que o termo mudou e recebe a lista pronta com o sinal de carregamento. Quando consultar o servidor e decisao do produto, conforme a fronteira que `ARCHITECTURE.md` secao 9 ja estabelece para internacionalizacao. O componente nao avisa quando o termo nao mudou.
- Volume: listas podem passar de dez mil registros. Virtualizacao e requisito estrutural, nao acrescimo posterior, e obriga a declarar total e posicao de cada item para o leitor de tela.
- Selecionados ficam visiveis no campo e no topo do painel. No campo, quando as etiquetas nao couberem, exibir a primeira e um resumo com a contagem restante. O leitor de tela precisa ouvir a contagem total, nao apenas a primeira etiqueta.
- Etiquetas nao entram na ordem de tabulacao. `Backspace` com o campo vazio remove a ultima.
- Selecao multipla se apresenta com caixa de marcacao por item, sem preencher o fundo da linha. A caixa e apenas visual: quem comunica a marcacao e o proprio item. O `Checkbox` do projeto nao serve, por ser campo de formulario completo e criar um controle focavel dentro de outro.
- Foco de teclado, hover e selecao sao tres estados visuais distintos e devem ser desenhados juntos.
- O motor de selecao ganha ancora, faixa por Shift, marcar todos e estado indeterminado quando a `List` exigir, nao antes. Hoje o modo multiplo nao possui consumidor.
- Nome: `List`. `ListBox` mentiria no modo sem selecao.
- A faixa por Shift **acumula** sobre o que ja estava escolhido, em vez de substituir a escolha. Em lista com caixa de marcacao, substituir apagaria silenciosamente o trabalho anterior do usuario.
- A ancora e o ultimo item escolhido item a item. Shift com clique e Shift com as setas partem dela.
- `List.SelectAll` e parte composta, nao propriedade: e um controle visivel na tela, conforme o criterio de `COMPONENTS.md` secao 4. Ele consome o `Checkbox` do projeto, que aqui cabe por estar fora do listbox, e alcanca apenas os itens habilitados e visiveis.
- `Ctrl+A` foi implementado e removido: com a busca em foco ele sequestraria a selecao do texto do campo. O marcar todos tem controle proprio, acessivel por teclado.
- `Select` e `ComboBox` nao se compoem: ambos compoem `ListingOptions` dentro do proprio painel. O que compartilham e o painel, nao o campo. Cada um mantem seu gatilho, seu overlay e sua ligacao com `Field`.
- O painel virou dois elementos: um envoltorio com o posicionamento, a borda e a dispensa do overlay, e o `role="listbox"` dentro dele. O `aria-activedescendant` precisa viver no elemento que detem o foco e tem papel de listagem, e as propriedades do `useOverlay` precisam de um elemento proprio.
- `ComboBox` ganhou `onSearch` e `loading` na reestruturacao: com a busca externa a cargo do produto, ele atende os dez mil registros sem filtrar por conta propria.
- O filtro textual da listagem chama-se `filter`; a busca por digitacao do motor chama-se `typeahead`. Sao comportamentos distintos e o nome `search` servia aos dois, o que confundia.
- A `List` recebe os itens por propriedade e as partes por composicao. Virtualizacao exige que o componente decida quais itens existem no DOM a cada instante, e itens escritos como filhos ja estao criados antes de o componente ver qualquer um. Busca, opcoes e vazio permanecem partes compostas, conforme `COMPONENTS.md` secao 4.
- A `List` troca o elemento conforme o modo: `ul` e `li` sem selecao, `div` com `role="listbox"` e `role="option"` com selecao. O `ul` nao aceita um grupo como filho direto, e no modo sem selecao a marcacao nativa de lista e a correta.
- A secao de selecionados no topo aparece somente com busca ativa, listando o que foi escolhido e saiu do resultado. Fora da busca, subir os marcados faria o item pular de lugar no instante da escolha, o que e pior com a lista virtualizada.
- Navegacao por teclado existe apenas nos modos com selecao. Sem selecao nao ha o que focar, e `aria-activedescendant` apontaria para itens sem papel.
- A janela virtual mede o **passo entre dois itens**, nao a altura de um item. Medindo so a altura, o espaco que o container coloca entre eles ficava de fora, o erro se acumulava e perto do fim da lista os espacadores colidiam com os itens, com numeros aparecendo fora de lugar. Ela desliga se a medida for zero, o que mantem o comportamento correto em jsdom, onde nao ha layout. A rolagem ate o item focado usa a matematica da janela quando virtualizada e o proprio elemento quando nao.
- A comparacao textual usa `Intl.Collator` com sensibilidade `base`, e nao `useFilter` ou `useCollator`. O typeahead vive em `selection.ts`, que e motor puro sem React conforme `ARCHITECTURE.md` secao 7, e um hook nao cabe ali. Injetar a comparacao de fora furaria a pureza do motor para resolver o que o `Intl` nativo resolve em poucas linhas, sem uma terceira dependencia.

### Formatadores e localidade

`formatarMoeda`, `formatarNumero` e `formatarPercentual` existem, com a assinatura que `ARCHITECTURE.md` secao 9.1 define: valor e um objeto de opcoes, com `localidade` em pt-BR por padrao. Todos sobre `Intl.NumberFormat`, sem dependencia externa.

- `formatarPercentual` recebe a **fracao**, nao o numero ja multiplicado: `0.42` vira `42%`. E a fracao que sai de uma divisao de duas medidas, e receber o valor pronto obrigaria cada consumidor a dividir antes de exibir.
- A forma compacta sai da **localidade**, e nao de um sufixo proprio: em pt-BR um milhao e `1 mi`, nao `1M`. Inventar o sufixo quebraria em qualquer outra localidade.
- Casas decimais so entram quando declaradas. Sem elas, quem decide e a localidade — e, na moeda, a propria moeda.
- Nenhum deles memoriza o objeto do `Intl`: a construcao repetida e cara em tese, mas o motor ja a resolve para argumentos iguais, e uma cache propria duplicaria uma otimizacao que existe abaixo.

Os formatadores de entrada continuam assumindo a convencao pt-BR no codigo: virgula como decimal, ponto como milhar. Fazer os separadores deles derivarem da mesma fonte dos de apresentacao continua em aberto.

Atencao a um detalhe que agora tem consequencia visivel: `Intl.NumberFormat` usa espaco nao separavel entre o simbolo da moeda e o numero, diferente do espaco comum das mascaras de entrada. O espaco nao separavel impede que a quebra de linha afaste o simbolo do valor, entao ele fica; a convergencia das duas formas e que precisa de decisao.

### Campos numericos e monetarios

- `InputText` generico nao deve formatar valores.
- `InputNumber` deve separar claramente valor bruto, valor exibido, parser e formatter.
- O modo inteiro nao aceita virgula ou ponto e nao aplica casas decimais.
- O modo decimal usa virgula como separador e respeita `decimalScale`.
- `InputCurrency` deve manter a edicao bruta durante o foco e aplicar a formatacao monetaria no blur.
- Mudancas externas em componentes controlled devem ser refletidas mesmo durante o foco, conforme o contrato definido.
- `InputNumber` e `InputCurrency` expoem apenas `onValueChange`, com o valor ja normalizado. Repassar o evento cru divergia do valor exibido, e a propriedade `onChange` foi removida por isso.

### Graficos

- O eixo e a grade recebem as marcas **ja posicionadas**: converter valor em pixel pertence a escala, nao ao desenho. Isso os torna testaveis sem montar um grafico inteiro.
- A linha da base tem estilo proprio na grade: ela separa positivos de negativos e nao e apenas mais uma marca.
- O grafico e `role="img"` nomeado pelo titulo, e cada marca carrega a propria descricao em `aria-label`. A visao em tabela, que a `Table` ja permite, entra quando houver o primeiro consumidor pedindo — e e ela, nao a marca, o caminho da leitura medida a medida.
- D3 entra como **calculo, nunca como renderizador**. `d3-scale` e `d3-array` para escalas e dominios; `d3-selection` e `d3-axis` ficam de fora por tocarem o DOM. Eixos, marcas e rotulos sao JSX, e o React continua dono da arvore. E a mesma fronteira ja firmada para o React Aria.
- O sistema de escalas precede os graficos porque a ausencia dele e a causa raiz do duplo eixo em producao: sem escala confiavel, duas series de grandeza diferente acabam em dois eixos, e o cruzamento entre elas vira artefato da escala escolhida. `mergeDomains` une series num eixo unico.
- O dominio inclui o zero por padrao. Barra que nao parte do zero exagera a diferenca entre os valores.
- Paleta de series em `src/tokens/semantic/chart.css`, com seis posicoes fixas e tons proprios por tema. A serie N usa sempre o mesmo token, para que um filtro que reduza as series nao repinte as restantes.
- As oito cores institucionais nao formam paleta de dados: tres sao status, duas sao neutras e sobram tres matizes. Medidas em conjunto, reprovam em separacao para deficiencia de visao de cores (3,6 no par laranja e verde), em separacao para visao plena (9,7 no par cinza e azul) e em contraste nos dois temas. A paleta de series usa tons das rampas de marca e leva o pior par de 3,6 para 20,6.
- Verde, vermelho e amarelo permanecem reservados a status, e sao a escolha certa quando o dado **e** status, como o mapa de produtos por margem e o DRE.
- A aplicacao pode passar as proprias cores, conforme `ARCHITECTURE.md` secao 15: a cor de tema escolhida pelo usuario e politica do produto. `paletteWithAccent` abre a paleta com essa cor e segue com as do sistema, saltando a posicao que a repetiria.
- `seriesColors`, `paletteWithAccent` e `resolveSeriesColors` **permanecem na API publica** mesmo sem consumidor no Showcase. Quem preenche as propriedades dos graficos e a classe intermediaria da aplicacao, a partir do manifesto, e ela precisa das mesmas cores fora de um grafico: numa legenda compartilhada ou num cartao de indicador. Confirmado pelo mantenedor.
- A cor de uma serie se resolve em tres niveis de precedencia: a cor informada pelo implementador vence; depois a intencao semantica; por fim a paleta categorica. Series com cor ou intencao **nao consomem posicao** da paleta, para que as categoricas sigam a ordem sem deixar buracos.
- Intencoes: `positive`, `negative`, `warning` e `neutral`, esta ultima para totais e subtotais. Elas ignoram a paleta e a cor de tema do usuario, porque ali a cor carrega significado: pintar despesa com a cor escolhida pelo usuario trocaria o sentido da barra a cada usuario. O DRE, a cascata e o mapa de produtos por margem sao exatamente esse caso.
- O cinza medio volta com papel proprio em `--pl-chart-neutral`, depois de sair da rotacao de series. No tema escuro ele cede lugar a um cinza mais claro, porque some contra a superficie escura em 2,69:1.
- **Gerar as demais cores a partir da escolhida foi implementado e descartado.** Girar a matiz em passos iguais nao separa as series de forma perceptivel: a paleta derivada do laranja mediu 3,1 em deuteranopia, pior que a paleta atual. O circulo de matiz nao e perceptivelmente uniforme, e passo igual nao produz distancia igual.
- A referencia visual dos graficos e **hibrida**, conforme o mantenedor: shadcn/ui na maioria da familia, Metabase no pie, no donut e no sankey, Untitled UI onde nenhum dos dois tiver correspondente. O codigo da referencia foi aberto, nao apenas a descricao, e dele saem quatro decisoes: grade so horizontal e sutil; eixo sem linha e sem tique, apenas o rotulo; linha `monotone` com traco de 2; area com gradiente vertical do tom cheio ao quase transparente, mais linha de contorno. Registrado na tabela de referencias do `CLAUDE.md`.
- **O duplo eixo Y e declarado, nunca inferido.** No `ChartCombo` a serie diz a que eixo pertence, e e essa declaracao que faz nascer o eixo direito. Isso nao reabre a decisao registrada acima: o que ela condena e o eixo duplo que *acontece* por falta de escala confiavel, e e justamente a divisao automatica que fica proibida. O `Split y-axis when necessary` do Metabase e esse mecanismo automatico; o shadcn, pelo Recharts, exige `yAxisId` em cada eixo, e e esse o caminho adotado. Sem serie a direita, o dominio e unico e o eixo direito espelha o esquerdo.
- Uma segunda escala sem eixo para le-la e exatamente o duplo eixo que engana, entao o eixo direito do `ChartCombo` aparece por padrao assim que uma serie pertence a ele. O consumidor ainda pode impor os tres estados de visibilidade.
- Os dois dominios do `ChartCombo` caminham numa **animacao so**, e por isso chegam juntos. Duas animacoes independentes descasariam as barras das linhas no meio da transicao.
- No `ChartCombo` a linha passa pelo **centro da faixa**, que e onde a marca do eixo de categoria tambem fica. As duas formas compartilham a escala de faixas em vez de manterem cada uma a sua.
- `barSlots` devolve uma faixa por presenca, e a presenca vem do tween. Quando entra uma serie nova, o tween devolve o array anterior por um render e o indice da nova ainda nao existe: o acesso passa por `NO_BAR_SLOT`. A extracao tinha perdido essa guarda, que existia antes como `presencas[i] ?? 0`, e o grafico quebrava com `Cannot read properties of undefined`.
- O traco da linha e o marcador de ponto passaram para `core/Chart.module.css` quando o `ChartCombo` virou o terceiro consumidor deles. `ChartLine`, `ChartArea` e `ChartCombo` compoem a partir de la; `ChartArea` mantem o nome local `outline`.
- A moldura cartesiana e um componente interno, nao uma camada preventiva: cinco graficos repetiam titulo, margens, area de desenho, estado vazio, colocacao dos dois eixos e legenda. Ela fala em **x e y**, nao em categoria e valor — e o grafico que decide qual eixo recebe cada marca. Foi o que dissolveu o ramo `vertical`/`horizontal` da colocacao de eixos do `ChartBar`.
- `d3-shape` entrou pela mesma fronteira do restante do D3: ele devolve string de caminho, nao toca no DOM. Interpolacao cubica monotona e geracao de faixa com base variavel sao matematica sutil que nao vale reimplementar, e o pacote tambem serve os arcos dos radiais.
- Valor ausente **interrompe** a curva, em vez de emendar sobre o buraco. Emendar desenharia um trecho que o dado nao afirma. Vale para `ChartLine` e para a faixa do `ChartArea`.
- Area empilhada recebe **cor solida**, nao gradiente: gradientes sobrepostos somam opacidade e a faixa de cima escurece a de baixo. O contorno permanece nos dois casos, porque e ele que separa uma faixa da vizinha.
- O raio da bolha do `ChartScatter` cresce pela **raiz** do valor, para que a area acompanhe o dado. Mapeando o valor direto ao raio, a area cresceria com o quadrado dele.
- Na cascata, o **sinal do rotulo pertence ao grafico**, que formata a magnitude. Delegar o sinal ao formatador do consumidor perdia a variacao com qualquer formatador que exibisse apenas o valor. O teste pegou isso.
- Na cascata, a faixa de cada passo e indexada pela **posicao**, nao pelo rotulo: numa sequencia de passos o mesmo rotulo pode repetir, e a escala categorica funde dominios iguais, sobrepondo as barras.
- Um passo marcado como total parte do zero e recebe intencao `neutral`: ele fecha a conta em vez de acrescentar a ela, e o rotulo dele dispensa o sinal.
- **`ChartTooltip` implementado**, depois de adiado duas rodadas. Acompanha o ponteiro, em portal, e sai a qualquer outra interacao: ponteiro fora da area, rolagem, tecla ou a janela mudando de tamanho. Traz titulo, subtitulo, uma linha por medida com marcador, colunas numericas, uma coluna calculada e um totalizador com operador por coluna.
- **Apesar do nome, o `ChartTooltip` nao conhece grafico algum.** Ele recebe linhas e colunas; quem as monta e quem o usa. O nome veio do shadcn, por decisao do mantenedor, e da referencia visual ja adotada para os graficos — mas o `ChartTooltip` de la e `const ChartTooltip = RechartsPrimitive.Tooltip`, um alias vazio, e o `ChartTooltipContent` que o acompanha nao tem subtitulo, nem multiplas colunas, nem campo calculado, nem totalizador. O nome e emprestado; o componente e nosso.
- O balao **segue o ponteiro**, e nao a marca. Por isso nao usa `useOverlayPosition`, que ancora em elemento e nao em coordenada: a posicao sai do proprio evento, com giro para o lado oposto ao encostar na borda da janela.
- O `ChartTooltip` e **decorativo** para leitor de tela, com `aria-hidden`. Uma grade que some a qualquer interacao nao e leitura acessivel.
- **O `<title>` por marca deu lugar a `aria-label`**, nos doze graficos, por decisao do mantenedor. Ele desenhava um segundo balao, nativo, sempre que o ponteiro parava sobre a marca. E ele nunca foi leitura de leitor de tela: o desenho e `role="img"`, que apresenta o grafico como uma imagem unica e nao expoe os descendentes. A troca elimina o balao duplo e nao custa acessibilidade; o que falta para a leitura medida a medida e a visao em tabela.
- A costura de hover vive em dois lugares, um por familia. `useHoveredBand` serve os cartesianos de faixa — `ChartBar`, `ChartCombo` e `ChartWaterfall` —, que expoem `onHoverCategory` ou, no caso do passo, `onHoverStep`. `useSliceRing` serve o anel, e expoe `onHoverSlice`.
- **O anel entrega a fatia, e nao o indice.** As pequenas ja foram reunidas em "Outros" quando o ponteiro chega, entao o indice do anel nao corresponde ao que o consumidor informou. Entregar a fatia agrupada, com rotulo e valor, dispensa qualquer busca do lado de fora. O `setFocused` do hook virou `focus` na mesma mudanca: ele passou a avisar alem de gravar, e o nome anterior escondia isso.
- `ChartLine` e `ChartArea` **nao** ganharam costura. Eles usam `pointScale`, sem faixa e sem estado de hover; avisar a categoria ali exige criar faixas de clique invisiveis sobre a area, com decisao de largura e de encaixe no ponto mais proximo. E desenho, nao fiacao. No `ChartScatter` o eixo X e numerico e categoria nao se aplica.
- Valor no balao e **JetBrains Mono**, conforme `TOKENS-REFERENCE-TYPOGRAPHY.md`: `type.data-value` cobre valores monetarios, percentuais e totais em tabelas. O rotulo da serie continua em Montserrat, que e conteudo de interface.
- **Legenda clicavel implementada**, depois de adiada uma rodada. Cada entrada e um botao com `aria-pressed`, e o estado e controlado ou nao conforme `COMPONENTS.md` secao 6. Ela trabalha com rotulos, nao com indices: e o rotulo que a legenda exibe e o que o produto reconhece, e o indice mudaria de significado ao reordenar as series.

**Movimento**

- O movimento dos dados anima **o dominio da escala**, nao cada marca. Uma unica animacao move barras, curvas, grade e marcas do eixo, em vez de uma por elemento.
- A escala alvo fixa as **marcas do eixo**; a animada posiciona o desenho. Sem separar as duas, o eixo exibiria valores quebrados durante a transicao.
- Cada serie tem uma **presenca** entre zero e um, que tambem caminha. Nas barras ela reparte a faixa, entao a serie desligada encolhe e as demais ocupam o lugar dela; na area empilhada ela pesa a contribuicao, e a pilha acompanha. As duas animacoes tem a mesma duracao e a mesma curva, e por isso ficam em sincronia sem coordenacao explicita.
- A serie desligada **permanece no DOM**, fora da arvore de acessibilidade. E a permanencia que permite transicao nos dois sentidos; removida, so a saida seria animavel.
- **A escala em CSS sobre a serie foi removida, depois de um defeito visto em navegador.** Ela era uma segunda animacao sobre a primeira: onde ha geometria a animar, quem recolhe a serie ja e a presenca no JavaScript. Somavam-se tres erros. O `transform-origin: 50% 100%` nunca foi o que o comentario dizia, porque sem `transform-box` a origem resolve contra o viewport do SVG e nao contra a caixa do grupo, que ainda por cima esta dentro de um `translate` das margens. A caixa do grupo **colapsa** quando a serie esta oculta, porque as barras vao a espessura zero, entao a escala pivotava em torno de nada. E `animation: ... both` disputava a opacidade com a `transition` da mesma propriedade, porque animacao vence transicao enquanto preenche. Sobrou a opacidade, que e o que a serie sem geometria precisa.
- `--pl-chart-series-origin` saiu junto: era uma variavel que nenhum arquivo definia.
- A duracao do movimento dos dados e maior que a dos tokens de `speed`, que medem resposta a um gesto. Aqui o olho precisa acompanhar uma barra mudando de altura, nao apenas notar que algo respondeu.
- Sem `matchMedia` nao ha navegador para animar, e sem preferencia conhecida o salto e a escolha segura. Isso respeita `prefers-reduced-motion` e mantem o resultado deterministico fora do navegador, onde nao existe quadro a quadro.
- A cor de uma serie sai sempre da **lista inteira**, nunca das visiveis: desligar uma serie nao pode repintar as demais.

**Elegancia dos graficos, a partir da revisao do mantenedor**

- **Nenhuma medida do grafico e constante.** As margens saem da largura medida dos rotulos, e nao de numeros chutados. A ordem resolve a dependencia entre elas sozinha: as calhas laterais definem a largura util, a largura util define o passo entre categorias, o passo define o angulo dos rotulos e o angulo define a altura que eles ocupam embaixo. O eixo Y das barras horizontais cortava nomes longos exatamente por causa do `52` fixo.
- A largura de um rotulo e medida no **canvas**, com a fonte lida dos tokens no proprio elemento do grafico. Ler a fonte do elemento evita repetir em JavaScript um valor que ja pertence ao CSS. Onde o canvas nao existe, como no jsdom, a estimativa por caractere mantem o calculo deterministico em vez de devolver zero e amontoar os rotulos.
- O angulo dos rotulos de baixo e **calculado**, com `auto` por padrao. Deitado enquanto dois rotulos vizinhos nao se tocam; a partir dai o que precisa caber e a distancia perpendicular entre duas linhas de base, que vale o passo vezes o seno do angulo, o que da 45 graus enquanto `passo x sen45 >= entrelinha` e 90 graus abaixo disso. O consumidor ainda pode impor 0, 45 ou 90.
- Os eixos tem tres estados de visibilidade, nos dois lados: `visible`, `hidden` e `onHover`. Em `onHover` **a calha permanece reservada** e o eixo desliza para dentro dela depois de 600ms de ponteiro parado, saindo na hora em que o ponteiro deixa a area. Reservar a calha e o que impede o desenho de se mexer sob o ponteiro; so `hidden` devolve o espaco ao grafico.
- O atraso vive no estado de hover e o repouso tem atraso zero, entao a entrada espera e a saida e imediata sem nenhum temporizador em JavaScript.
- O eixo da direita **espelha a escala da esquerda** em `ChartBar`, `ChartLine`, `ChartArea`, `ChartScatter` e `ChartWaterfall`. So o `ChartCombo` tem segunda escala propria, e so quando uma serie declara pertencer a ela.
- A legenda horizontal tem alinhamento proprio, `left`, `center` ou `right`, **centrado por padrao**. A legenda lateral o recusa: ali cada entrada ocupa a linha inteira, e e essa largura que alinha a coluna de medidas do anel. Alinhar uma coluna e alinhar uma linha sao decisoes diferentes, e so a segunda e do consumidor.
- A legenda tem posicao escolhida entre `top`, `bottom`, `left`, `right` e `none`. Barras horizontais recusam `left` e `right` e caem para `bottom`: ali a largura e o proprio desenho, e a legenda ao lado espremeria as barras.
- A altura aceita `fill`, que a toma do contêiner. E o que permite um grafico ocupar a celula de um painel sem ninguem repetir a medida em JavaScript. A area de desenho fica fora do fluxo, para que a medida seja o que o layout concedeu e nao o que o proprio desenho ocupou, e um piso de altura evita o grafico sumir por medir zero quando quem envolve nao impoe altura alguma.
- **Hover nao apaga as outras marcas.** A opacidade reduzida nas barras vizinhas foi implementada e descartada pelo mantenedor: o realce agora e um veu discreto atras da faixa sob o ponteiro, como o cursor da referencia. O token `--pl-chart-cursor` escurece no tema claro e clareia no escuro, porque um veu escuro sobre superficie escura nao apareceria.
- Barra sempre com raio, pelo token. O atributo `rx` nao aceita variavel CSS, entao o valor vem da propriedade `rx` no modulo, que le o token.
- Marcadores e rotulos de valor sao opcionais em toda a familia, com os mesmos nomes: `showDots` e `showDataLabels`. `ChartScatter` fica de fora dos dois, porque ali a bolha ja e a marca e rotulo por ponto se atropela assim que as bolhas se aproximam.

### Datas

- `@internationalized/date` entrou como dependencia, conforme os primitivos admitidos em `CLAUDE.md`, e e externalizada no build. Os hooks `useCalendar` e `useDatePicker` do React Aria permanecem vetados: o comportamento e o deles, a maquina de estado e nossa.
- O motor de calendario vive em `src/hooks/useCalendar/calendar.ts`, puro e sem React, conforme `ARCHITECTURE.md` secao 7. Ele monta a grade do mes, aplica limites e resolve a navegacao por teclado.
- Formatar `CalendarDate` exige converter com o fuso local, nao com UTC. Convertendo com UTC, o cabecalho do calendario exibia o mes anterior em qualquer fuso negativo: meia-noite UTC do dia primeiro e ainda dia 28 do mes anterior no horario local. O teste pegou isso.
- Cada dia anuncia a data por extenso, nao apenas o numero. Alem de ser o que o leitor de tela precisa, resolve a ambiguidade dos dias de meses vizinhos, que repetem o mesmo numero na mesma grade.
- `TimePicker` **nao** usa `input type="time"`. O seletor nativo foi implementado e descartado: ele segue a localidade do sistema operacional, nao a da aplicacao, e exibia 12 horas com AM/PM num contexto pt-BR; seu painel tambem nao aceita estilo, ficando fora do Design System por construcao.
- O painel de hora e **uma coluna de horarios**, nao duas colunas de hora e minuto. E o que o `DateTimePickerDemo` do Untitled UI faz: uma lista rolavel de horarios ao lado do calendario, de trinta em trinta minutos por padrao. A primeira versao, com colunas separadas de hora e minuto, foi descartada por divergir da referencia.
- Os horarios saem de `gerarHorarios`, entre `min` e `max`, com o passo de `step`. Sem limites, a lista cobre o dia inteiro: da meia-noite as 23h30 no passo padrao. A lista corre sobre a listagem compartilhada de `List`, `Select` e `ComboBox`, com altura limitada por CSS e sem virtualizacao, que para algumas dezenas de itens so traria risco.
- O painel de horarios tem um campo `hh:mm` proprio, para informar a hora sem percorrer a lista.
- A hora digitada so e aplicada com os quatro digitos. Aceitar `18:4` como `18:04`, por ser tecnicamente valido, fixava o valor no terceiro digito e impedia completar a dezena do minuto. Vale para o campo do `TimePicker`, o do painel e o do `DateTimePicker`.
- O rodape do `DateTimePicker` traz **Agora**, com data e hora correntes, e nao `Hoje`: num campo que carrega horario, oferecer so o dia deixaria a hora por conta do usuario sem necessidade.
- `DateTimePicker` e um campo unico, com data e hora na mesma mascara, e um painel unico com o calendario a esquerda e os horarios a direita.
- O painel trabalha sobre um **rascunho**: nada e aplicado ate o usuario confirmar, conforme o rodape de cancelar e aplicar da referencia. `Hoje` leva o calendario para a data corrente sem confirmar.
- Escolher hora sem data escolhida apoia-se em **hoje**. A primeira versao inventava o dia primeiro de janeiro, e o campo exibia uma data que o usuario nunca havia escolhido.
- Tipografia: `type.title` pertence a Montserrat, nao a Poppins. O `Card` nascera errado e foi corrigido. Poppins fica restrita a display e headline, conforme `TOKENS-REFERENCE-TYPOGRAPHY.md`.
- Tipografia: campo e lista de horarios usam **Montserrat**, com `font-variant-numeric: tabular-nums` para os digitos alinharem. JetBrains Mono chegou a ser aplicada ali por analogia visual e foi revertida: `TOKENS-REFERENCE-TYPOGRAPHY.md` da a Montserrat o papel exclusivo sobre formularios, e restringe a JetBrains Mono a tabelas, valores de tabela, chaves e codigo. O alinhamento que se queria vem do `tabular-nums`, sem trocar a familia.
- Tipografia: a `Table` usa **JetBrains Mono**, a familia que `TOKENS-REFERENCE-TYPOGRAPHY.md` reserva a tabelas e dados tecnicos, com `tabular-nums` para os digitos alinharem em coluna. `Table.Column` e `Table.Cell` mantem `numeric`, que aplica `type.data-value` em tamanho, peso e alinhamento a direita.
- Pendente: entrada segmentada, em que dia, mes e ano sao campos navegaveis por setas, como no React Aria. Hoje a entrada e um campo unico com mascara, que aceita barra, traco, ponto e espaco, como a referencia do Untitled UI descreve.
- Pendente do Untitled UI: intervalo de datas, atalhos de periodo, visao de dois meses e rodape com cancelar e aplicar. Nenhum deles foi pedido por um cenario concreto ate agora.

### Biblioteca de icones

- A fonte e o **Bootstrap Icons**, por decisao do mantenedor, sob licenca MIT. Ha preferencia pelas variantes preenchidas, sem que isso seja regra: onde a versao de contorno ler melhor, ela vale. Chevrons e setas nao tem variante — ja sao caminhos cheios.
- **Copia dos caminhos, e nao dependencia.** Sao dois mil icones para resolver onze, e o mandamento 13 pesa contra a dependencia nesse caso. A atribuicao fica no cabecalho de `icons.tsx`.
- Os dez componentes que desenhavam o proprio SVG passaram a consumir a biblioteca. Chevron, fechar e seta estavam repetidos entre eles, com espessuras e tamanhos que andaram sozinhos.
- Nomenclatura de familia, conforme `CLAUDE.md`: tipo seguido de especializacao — `IconChevronDown`, `IconCalendar`, `IconClose`.
- A base `Icon` e **interna**. Ela fecha o conjunto, para que a aplicacao use a biblioteca oficial em vez de desenhar o proprio caminho, conforme `ARCHITECTURE.md` secao 12.
- Sem medida declarada o icone acompanha o tamanho do texto ao redor, e a cor vem sempre de `currentColor`: ele herda a cor de onde esta em vez de fixar a propria.
- Sem `label` o icone sai da arvore de acessibilidade, que e o certo quando ha texto ao lado dizendo a mesma coisa. Com `label`, ganha nome acessivel para o caso em que carrega o significado sozinho.
- O conjunto cobre o que os componentes usam, e cresce quando um componente precisar de um simbolo que ainda nao existe.

### Familia de tabela: Table, Card e DataGrid

Levantamento das referencias feito antes da implementacao. O Untitled UI guia visual **e** funcionalidade; a arquitetura permanece do Design System.

- O `Table` recebe as linhas por colecao, com `items` e uma funcao que desenha a linha. Linhas escritas soltas impediriam saber a colecao antes de renderizar, e sem isso nao ha marcar todos, nem faixa por Shift confiavel, nem `aria-rowcount` quando a virtualizacao existir. A forma estatica pode ser acrescentada depois sem quebrar contrato.
- O `Table` **nao desenha contorno externo**. Quem envolve desenha. Foi assim que o acoplamento com o cartao deixou de existir: o `Card` nao sabe que ha uma tabela dentro, e a tabela nao sabe que esta num cartao.
- O cartao nasceu como `Card` generico, e nao como `TableCard`, porque o mantenedor declarou que havera um cartao para outros conteudos. Criar o especifico seria trabalho a descartar.
- A coluna de selecao e inserida pelo componente, nao escrita pelo consumidor. O controle segue o modo: radio na escolha unica, caixa de marcacao na multipla, com `toggle` disponivel por propriedade.
- `highlightSelectedRow` segue a referencia e vem ligado. A `List` mantem a decisao oposta, destaque apenas na marcacao, porque ali o item nao e uma linha de tabela.
- Ordenacao e estado, nao algoritmo. Com o consumidor dono das linhas, quem reordena os dados e ele ou o servidor. O componente guarda a direcao, declara `aria-sort` e avisa a mudanca, como a referencia.
- O descarte de colunas em telas estreitas usa `hideBelow` com media query e atributo de dado, sem hook de breakpoint. O `useBreakpoint` previsto em `ARCHITECTURE.md` secao 8 nasce quando um componente exigir medida em tempo de execucao.
- O `DataGrid` tem escopo levantado a partir do AG Grid Community: colunas fixas, redimensionaveis e reordenaveis, filtro por coluna, edicao de celula, virtualizacao de linha e coluna, e navegacao bidimensional. Exportacao para planilha, graficos integrados e area de transferencia dependem de decisao sobre dependencia, conforme o mandamento 13, e conversam com a escolha do D3 como nucleo de graficos.

### Contador de caracteres

- O contador existe apenas em campo de texto plano: `InputText` e `Textarea`. `InputNumber` e `InputCurrency` omitem `showCharacterCount` do tipo herdado de `InputText`, e `InputPassword` nao o possui.
- A contagem usa unidades UTF-16, a mesma medida do `maxLength` nativo, definida pelo HTML. Assim o numero exibido corresponde ao ponto exato em que o navegador corta. Um emoji conta 2, como no limite.
- Contar pontos de codigo, como era feito antes, exibia um numero que nao correspondia ao corte: com `maxLength` de 20, vinte emojis apareciam como 10/20 e o navegador ja havia cortado a metade.
- Contar grafemas corresponderia ao que o usuario ve, mas obrigaria o componente a impor o limite por conta propria e nenhuma referencia do projeto faz isso. Nenhuma delas oferece contador.

### InputPassword

- A senha inicia mascarada e a revelacao exige acao explicita, e volta a ser ocultada quando o formulario e enviado.
- `showCharacterCount` foi removido. Um contador ao vivo em campo mascarado publica na tela o comprimento exato da senha, que e justamente o que a mascara protege. Nenhuma referencia do projeto oferece contador em campo de senha. `maxLength` permanece, sem contagem visivel.
- Copia e corte sao bloqueados por padrao, mas colagem e autocomplete permanecem permitidos.
- O botao de visibilidade deve respeitar o estado disabled do campo.
- Validacoes de produto devem ser configuraveis, sem transformar regras como maiuscula, minuscula, numero ou caractere especial em variantes visuais.
- A API deve definir claramente quando validar, como expor a mensagem e como informar o resultado ao produto.
- Forca da senha, quando necessaria, deve ser um mecanismo ou componente separado da entrada basica.

### Distribuicao e API publica

- O pacote documentado para consumidores precisa possuir entrypoint, exports e declaracoes TypeScript configurados.
- Utilitarios reutilizaveis so devem ser considerados parte da API publica quando forem exportados por `src/index.ts`.
- O Showcase deve consumir componentes oficiais e possuir uma fonte de entrada claramente definida.

## Ordem de implementacao

1. **Fundacao do projeto** — concluida
   - Stack, `package.json`, TypeScript, build e estrategia de testes definidos.
   - Ponto de entrada publico criado.

2. **Tokens e estilos globais** — em andamento
   - Camadas primitiva e semantica organizadas. Contraste validado em AA, com as excecoes aceitas registradas.
   - Pendente: consolidar o bloco legado de `tokens.css` e definir o idioma dos tokens de raio, espacamento e motion.

3. **Componentes primitivos** — concluida
   - `Button`, `Label`, `InputText`, `InputNumber`, `InputPassword`, `InputCurrency`, `Badge` e `Avatar`, com testes e exportacao publica.

4. **Campo compartilhado e Textarea** — concluida
   - Componente interno `Field` concentra rotulo, ajuda, mensagem de erro, contador e fiacao de `id` e `aria-describedby`.
   - `InputText`, `InputPassword` e `Textarea` consomem `Field`. O valor da contagem permanece em cada controle, que e quem detem o valor.

5. **Controles de selecao e feedback** — concluida
   - `Checkbox`, `RadioGroup` com `Radio`, `Switch`, `Alert`, `Progress` e `Spinner` implementados sobre HTML nativo, sem overlay e sem State Motor.
   - `Button` consome `Spinner` em vez do indicador proprio.

6. **State Motor de selecao** — concluida
   - Motor puro em `src/hooks/useSelection/selection.ts`, testado isoladamente, conforme `ARCHITECTURE.md` secao 7.
   - Ligacao React fina em `useSelection`. Serve `Menu`, `Select`, `ComboBox`, `Tabs`, `Accordion`, `List` e `Table`.

7. **Familia de overlays** — concluida
   - `Dialog`, `Popover`, `Tooltip`, `Menu`, `Select` e `ComboBox` implementados, testados, exportados e documentados no Showcase.
   - `Select` e `ComboBox` sao a primeira aplicacao do State Motor da etapa 6.

8. **Navegacao e composicao** — concluida
   - `Tabs`, `Accordion`, `Breadcrumb` e `Pagination` implementados, testados, exportados e documentados no Showcase.
   - `Tabs` e `Accordion` sao o terceiro e o quarto consumidores do State Motor.

9. **Familia de listagem** — concluida
   - `List` implementada com os tres modos de selecao, busca local e externa, virtualizacao, testes, exportacao publica e Showcase. Concluida.
   - `Select` e `ComboBox` reestruturados sobre a mesma listagem interna. Os tres paineis independentes deram lugar a um. Concluida.
   - Busca acentuada corrigida em `src/utils/textSearch`, alcancando o typeahead de `Select` e `Menu` e o filtro do `ComboBox`. Concluida.
   - Motor de selecao estendido com ancora, faixa por Shift, marcar todos e estado indeterminado, servindo `List.SelectAll`. Concluida.

10. **Tabelas e datas** — concluida, exceto o `DataGrid`
   - `Table` implementado em HTML nativo, com ordenacao, selecao nos tres modos, densidade, zebra, divisor, cabecalho fixo, descarte de colunas, vazio e carregamento. `Card` criado como superficie que o envolve. Ambos testados, exportados e documentados no Showcase.
   - `DataGrid` fica em decisao propria, com AG Grid como referencia. Escopo levantado, sem data.
   - `DatePicker`, `TimePicker` e `DateTimePicker` implementados sobre `@internationalized/date`, com State Motor de calendario proprio, testes, exportacao publica e Showcase.
   - `formatarData` e `formatarHora` criados conforme `ARCHITECTURE.md` secao 9.1, e exportados pela API publica. `formatarEntradaData` e `lerEntradaData` acompanham as mascaras de entrada ja existentes.

11. **Graficos** — concluida
   - Escalas, paleta, resolucao de cor por precedencia, medida do container, eixo e grade concluidos.
   - Moldura cartesiana compartilhada extraida, com `ChartBar` migrado sobre ela sem alteracao de teste nem de API.
   - `ChartBar` implementado, vertical e horizontal, agrupado e empilhado, com rotulos de valor, legenda, estado vazio e intencao semantica. Testado, exportado e documentado no Showcase.
   - `ChartLine`, `ChartArea`, `ChartScatter` e `ChartWaterfall` implementados sobre a moldura, com curva suave ou reta, interrupcao no valor ausente, gradiente e empilhamento, bolha pelo eixo Z com guias no ponto sob o ponteiro, e cascata com barra flutuante, conectores tracejados e rotulo de variacao. Testados, exportados e documentados no Showcase. A familia cartesiana esta concluida.
   - Revisao de elegancia do mantenedor aplicada aos cinco: margens derivadas dos rotulos, angulacao automatica, visibilidade de eixo em tres estados nos dois lados, legenda posicionavel, altura pelo contêiner, realce por faixa no lugar da opacidade e raio na barra.
   - `ChartPie`, `ChartDonut`, `ChartRadial`, `ChartTreemap`, `ChartSunburst` e `ChartSankey` implementados, testados, exportados e documentados no Showcase. Os onze graficos do catalogo estao disponiveis.
   - `ChartCombo` implementado, testado, exportado e documentado no Showcase, e acrescentado ao `COMPONENTS-CATALOG.md`. A familia de graficos esta concluida.

**Graficos radiais, hierarquicos e de fluxo**

- A referencia do anel e o **Metabase**, por decisao do mantenedor, e nao o shadcn/ui: anel vazado com o total no centro, centro trocado pelo valor da fatia sob o ponteiro, legenda em lista com o percentual alinhado numa coluna, e fatias pequenas reunidas em Outros por percentual minimo. Os demais graficos seguem o shadcn/ui.
- O separador entre fatias e a propria superficie mostrando por baixo, como traco, e nao um angulo de folga. Assim a folga mantem largura constante em qualquer raio.
- O valor do centro e um KPI, e `TOKENS-REFERENCE-TYPOGRAPHY.md` reserva a Poppins a esse papel. Em anel pequeno ele **desce na escala oficial** — display, depois headline, depois title — em vez de sair dela com um tamanho proprio.
- A fatia reunida entra no lugar da primeira pequena, para a ordem das demais, que a legenda repete, permanecer a mesma, e recebe intencao neutra para nao disputar posicao na paleta.
- Uma fatia pequena sozinha nao vira Outros: trocar o nome dela por um rotulo generico nao ganha nada.
- `ChartPie` e `ChartDonut` nao se compoem: os dois compoem `useSliceRing`, que e o anel repartido. O que compartilham e o anel, nao o componente — a mesma regra ja firmada para `Select` e `ComboBox`.
- O rotulo sobre a fatia so entra quando ela o comporta. Ate meia volta a largura disponivel e a corda no centro do arco; dali em diante a corda volta a encolher e quem manda e o raio. Sem essa virada, a fatia quase inteira ficava sem rotulo.
- No sunburst, o filho nasce da cor do pai e clareia a cada anel, por `color-mix`. Sem isso os aneis externos repetiriam a cor do nivel zero e nada distinguiria um filho do outro. A legenda lista apenas o nivel zero, como na referencia.
- A banda dos rotulos projetados e **reservada antes do anel**, medida pelo rotulo mais largo do anel externo, com teto de uma fracao da largura para um rotulo longo nao encolher o anel ate ele deixar de ser o assunto. Antes o rotulo era desenhado no que sobrasse, que nas laterais era quase nada: ele encolhia a duas letras ou sumia, e o conector apontava para o vazio. E a mesma regra ja firmada para a calha do eixo cartesiano — medida do conteudo, nao constante.
- O ponteiro sobre uma fatia acende **ela e os arcos que a originaram**, ate a raiz, e apaga todo o resto — inclusive os filhos dela, que nao explicam nada sobre ela. O parentesco e testado pela identidade do no, nao por prefixo de rotulo: o caminho era montado da folha para a raiz e a comparacao nunca casava com o ancestral. O foco e conferido contra a arvore corrente, porque um redimensionamento a remonta e um no perdido apagaria o grafico inteiro.
- No mapa de area, a legenda muda de papel conforme a cor: com `intentLabels` ela **nomeia as cores**, porque ali o que precisa ser explicado e o significado do status; sem ele, lista os grupos e desliga cada um.
- A ligacao do sankey e desenhada como **traco**, nao como preenchimento: a espessura e que carrega o volume, e ela vem da propria medida do no.
- No sankey, a ligacao sob o ponteiro **sobe de tom** e as demais apagam. Apagar as outras sozinho nao destaca nada: o que se via era o grafico inteiro sumindo. O realce vem do estado, nao de `:hover` no CSS, porque as ligacoes se cruzam e o `:hover` piscava na travessia.
- `mix-blend-mode: multiply` saiu das ligacoes: contra a superficie escura do tema escuro ele as levava ao preto.
- A ligacao fica **lavada em repouso**, e nao em cor cheia: o no e que carrega a cor, e e sobre a faixa lavada que o rotulo do no do meio continua legivel. Em cor cheia o rotulo desaparecia no fundo saturado.
- **A referencia do sankey e o Metabase**, como a do anel. Dela saem tanto a forma quanto as opcoes: o rotulo fica sempre a direita do no — a referencia nao oferece escolha de posicao —, e as opcoes que ela oferece sao o alinhamento dos nos, o valor escrito sobre a ligacao e a origem da cor da ligacao. Sao essas que o componente expoe.
- O valor da ligacao tem tres posicoes — `start`, `middle` e `end` —, com `end` por padrao. O rotulo do no ocupa a faixa logo a direita dele, entao `end` e o unico que nunca disputa espaco com o rotulo da propria origem. Em qualquer posicao, o valor que ainda assim cruzaria um rotulo e **omitido**: dois textos sobrepostos nao informam nada, e o valor continua no `title` da ligacao.
- So o rotulo do no de **saida** tem banda reservada: ele nao tem fluxo a direita para escrever por cima. Os demais caem sobre o proprio fluxo, e ali o halo da cor da superficie e que os separa do que passa por baixo.
- Rotulo por papel do no, rotulo quebrado em linhas e no arredondado e estendido foram **implementados e descartados**, por divergirem da referencia. O `wrapToWidth` do nucleo saiu junto, por ficar sem consumidor.
- O realce do hover **sobe um degrau**, e nao ate a cor cheia: o realce aponta qual ligacao e, nao muda o grafico de aparencia.
- O no do sankey usa o raio do token, pelo mesmo caminho das barras, em vez de um valor proprio no CSS.
- O lado do rotulo do sankey sai do **papel do no**: entrada a esquerda, saida a direita, cada um na sua banda reservada. A regra anterior usava a metade da largura e jogava o rotulo da primeira coluna para dentro do fluxo. O no do meio nao tem banda e cai sobre o fluxo mesmo; ali um halo da cor da superficie e que o separa do que passa por baixo.
- Entrada e saida saem das proprias ligacoes, antes do posicionamento: e isso que permite reservar a banda de cada lado.
- `d3-hierarchy` e `d3-sankey` entram pela mesma fronteira do restante do D3: calculam posicoes e devolvem numeros, sem tocar no DOM.
- As pontas do arco sao arredondadas nos tres radiais, com o raio vindo do token e aberto por propriedade em cada um.
- O valor do centro **desce de degrau da escala oficial ate caber**, e no ultimo degrau e cortado. O SVG nao quebra linha nem esconde o que transborda, entao quem precisa caber e o texto. O degrau depende do valor **e** do anel: um numero longo desce mesmo em anel grande.
- A familia de display e lida do elemento, junto da de corpo, porque medir o valor do centro exige a fonte em que ele sera desenhado.

**Barra**

- O raio de cada canto e desenhado no **proprio caminho**, e nao pelo atributo `rx`, que arredonda os quatro de uma vez. Numa pilha isso separava visualmente os segmentos; agora so as duas pontas sao arredondadas e o meio fica reto, de modo que a pilha leia como uma barra so. Segmento de valor zero nao conta como ponta.
- O caminho leva apenas pares de coordenadas, sem `H` nem `V`: fica uniforme e as medidas saem dele sem interpretar comando a comando.
- O raio vem do token, lido do elemento junto da fonte, porque geometria de caminho nao le variavel CSS.

**Moldura**

- Uma moldura so para os onze. As tres que existiam — cartesiana, radial e sem eixos — repetiam o mesmo cerco de
  titulo, area de desenho, estado vazio e legenda; a radial e a sem eixos diferiam em quatro linhas. O que muda
  entre as familias e o que se desenha dentro, nao o cerco.
- A origem no centro virou modo da moldura, e nao componente proprio: ela nao acrescenta parte alguma a arvore,
  so muda onde o filho comeca a contar, que e o criterio de `COMPONENTS.md` secao 4.
- A legenda saiu para arquivo proprio. Ela servia as tres molduras e morava dentro da cartesiana, que nao e dona
  dela.

**Espaco e medidas**

- As medidas de espaco do desenho vivem em `core/spacing.ts`, e nao em cada grafico. Guardadas por arquivo, o mesmo conceito aparecia com valores diferentes em vizinhos: o recuo do rotulo era `8` no fluxo e `6` no anel, o teto da banda `0,22` e `0,24`, a folga de borda `12` num lugar e `8` em outros dois. Geometria em SVG nao le variavel CSS, entao continuam numeros — mas de um lugar so.
- O espaco do rotulo de valor **sai da entrelinha medida**, nao de um numero fixo. Ele era `18` em tres graficos e `20` num quarto, sem que nada justificasse a diferenca; agora o rotulo ocupa o que o texto ocupa. O mesmo vale para as linhas do mapa de area.
- O mapa de intencao para token tem **um dono**: a paleta. O mapa de area o havia redeclarado identico.

**Grade**

- A linha da base e a do eixo passam a usar `--pl-chart-baseline`, um passo acima da grade e bem abaixo da cor do texto do eixo. Elas estavam na cor do texto terciario, forte demais contra a grade.

12. **Editor em blocos**
   - Componente complexo, previsto em `ARCHITECTURE.md` secao 6.3 entre os exemplos de editores, com State Motor proprio conforme a secao 7.
   - Gutenberg, do WordPress, como referencia de funcionalidade e de modelo de blocos.
   - Escopo, nome e limites a definir antes da implementacao, com o levantamento da referencia como base.

13. **Showcase como consumidor** — em andamento
   - Entrada oficial unica definida: `showcase/app`, a aplicacao React que consome o Design System. O
     Showcase estatico foi removido.
   - Preservar o Showcase como demonstracao, validacao visual e ambiente de integracao.
   - Repor as paginas visuais de fundamentos que sairam com o estatico, se forem desejadas.

**Icones** — concluida. Biblioteca oficial criada e consumida pelos dez componentes que desenhavam o proprio SVG.

14. **Integracao e distribuicao** — em andamento
   - `main`, `module`, `types` e `exports` configurados; declaracoes emitidas em `dist/types`; pacote
     construido validado por instalacao real num projeto separado, nos dois formatos.
   - `private` removido por decisao do mantenedor, e a importacao da folha de estilo documentada na
     secao de Uso do `README.md`. Falta definir o registro de publicacao.
   - Revisar as excecoes de contraste aceitas, conforme exige `TOKENS-REFERENCE-COLORS.md`.

## Ordem recomendada de leitura da documentacao

1. `README.md` — visao geral, objetivo, limites e estrutura do projeto.
2. `ARCHITECTURE.md` — dependencias, camadas e decisoes arquiteturais.
3. `TOKENS.md` — linguagem visual, temas e regras de valores compartilhados.
   - `TOKENS-REFERENCE-COLORS.md` — referencia detalhada de cores e temas.
   - `TOKENS-REFERENCE-TYPOGRAPHY.md` — referencia detalhada de tipografia.
4. `COMPONENTS.md` — classificacao, APIs, composicao e acessibilidade dos componentes.
   - `COMPONENTS-CATALOG.md` — escopo de componentes, papel de cada um e fronteiras entre nomes proximos.
5. `CONTRIBUTING.md` — processo pratico para implementar e revisar alteracoes.
6. `CLAUDE.md` — diretrizes de programacao, versionamento, idioma, nomenclatura e referencias externas. Subordinado aos documentos acima.
7. `showcase/` — referencia visual e validacao pratica da implementacao.
8. `PROGRESS.md` — estado atual da implementacao e proximas etapas.

A ordem segue do geral para o especifico: primeiro o contrato do projeto, depois a arquitetura, os fundamentos visuais, os componentes, o processo de contribuicao e, por fim, o estado concreto da implementacao.

## Regra de manutencao

Alteracoes nos documentos normativos devem ocorrer somente quando houver uma decisao arquitetural ou de produto que justifique a mudanca e mediante aprovacao. Atualizacoes rotineiras de andamento devem ser feitas neste arquivo.
