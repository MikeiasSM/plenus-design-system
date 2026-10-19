# Progresso de implementacao

Este documento acompanha a implementacao do Plenustech Design System em relacao a documentacao oficial do repositorio.

Ele nao substitui, interpreta ou altera `README.md`, `ARCHITECTURE.md`, `COMPONENTS.md`, `TOKENS.md` ou `CONTRIBUTING.md`. Esses documentos sao a fonte normativa do projeto. As diretrizes de programacao, idioma, nomenclatura e referencias externas estao em `CLAUDE.md`, subordinadas a eles.

O historico cronologico das alteracoes esta no `git log`. Aqui ficam o estado atual, as decisoes que nao devem ser reabertas sem motivo novo, e o que vem a seguir.

## Estado atual

988 testes em 113 arquivos. Build da biblioteca e do Showcase validados; `check:pacote` e `check:contraste` aprovam.

### Inventario

Os componentes assinalados como disponiveis em `COMPONENTS-CATALOG.md` estao implementados, testados e exportados por `src/index.ts`. O catalogo e a fonte dos nomes e do papel de cada um; aqui fica apenas o estado.

Outros modulos:

- `src/components/icons` — biblioteca oficial de icones. A base `Icon` e **interna** e fecha o conjunto; os icones
  em si sao publicos, com nomenclatura de familia.
- `src/components/forms/Field` — cromo de campo compartilhado, agora **publico**, com testes proprios.
- `src/hooks/useCharacterCount` — contagem de caracteres, controlada ou nao. **Interno**, nao exportado. Serve apenas `InputText` e `Textarea`, os campos de texto plano.
- `src/hooks/useDecimalInput` — estado dos campos decimais: valor, texto em edicao e reinicio do formulario. **Interno**. Serve `InputNumber` e `InputCurrency`.
- `src/hooks/useMergedRefs` — junta o ref interno ao de fora numa funcao estavel, com a limpeza do React 19. **Interno**. Substituiu o utilitario `mergeRefs`, que criava funcao nova a cada render.
- `src/hooks/useFormReset` — avisa o componente do `reset` do formulario. **Interno**.
- `src/components/forms/Field/FormValue` — leva ao formulario o valor de `Select`, `ComboBox` e dos tres seletores: oculto, ou validavel pelo navegador quando obrigatorio. **Interno**.
- `src/hooks/useSelection` — State Motor de selecao, com `selection.ts` puro e a ligacao React. **Interno**, nao exportado. Serve `Menu`, `Select`, `ComboBox`, `Tabs`, `Accordion` e `List`. Alem das chaves escolhidas, retem os itens, para que a escolha sobreviva ao item sair da colecao filtrada.
- `src/components/data-display/List/useListing` e `ListingOptions` — a listagem compartilhada: colecao, filtro, teclado, ARIA, marcacao e virtualizacao. **Internos**, nao exportados. Servem `List`, `Select` e `ComboBox`.
- `src/components/data-display/List/useVirtualWindow` — janela virtual da listagem. **Interno**, pertence ao componente conforme `ARCHITECTURE.md` secao 8.

  A janela sustenta a rolagem por dois espacadores, e a altura deles e a lista inteira. Como `.options` e um flex em coluna com rolagem, **os espacadores e as opcoes precisam de `flex: none`**: sem isso o flex renegocia a altura de todo filho encolhivel quando o conteudo excede o container, e o espacador de centenas de milhares de pixels e o primeiro a ceder. A altura util passa a depender da distribuicao do encolhimento, que depende da janela, que depende da rolagem — e a barra oscila sem a lista andar. O defeito aparecia no fim da lista, onde o espacador de cima e maior. Visto em navegador; o jsdom nao tem layout e a suite nao o alcanca.
- `src/hooks/useCalendar` — State Motor de calendario, com `calendar.ts` puro e a ligacao React. **Interno**, nao exportado. Serve `DatePicker` e, por ele, `DateTimePicker`.
- `src/utils/textSearch` — comparacao textual que ignora caixa e acento, sobre `Intl.Collator`. **Interno**, nao exportado. Serve o typeahead do motor e o filtro do `ComboBox`.
- `src/components/forms/TimePicker/TimeSlots` — campo `hh:mm` e lista de horarios do painel. **Interno**, nao exportado. Serve `TimePicker` e `DateTimePicker`.
- `src/utils/formatters` — mascaras de entrada `formatarEntradaDecimal` e `formatarEdicaoDecimal`, `formatarEntradaMonetaria`, `formatarEntradaData` com `lerEntradaData`, `formatarEntradaHora` com `lerEntradaHora` e `formatarEntradaDataHora` com `lerEntradaDataHora`, as tres ultimas sobre `mascararPartes`, **nao exportadas**, e os formatadores de apresentacao `formatarData`, `formatarHora`, `formatarMoeda`, `formatarNumero` e `formatarPercentual`, **exportados** conforme `ARCHITECTURE.md` secao 9.1.
- `src/components/charts/core` — o que os onze graficos compartilham. `ChartFrame` e a moldura de todos: titulo,
  area de desenho, estado vazio e legenda. `CartesianFrame` e uma camada sobre ela, com grade e eixos. Ao lado,
  `ChartLegend`, o calculo de layout de `cartesianLayout.ts`, as medidas de `spacing.ts`, a medida e o corte de
  texto de `measureText.ts`, o texto de centro de `centerText.ts`, os caminhos de `shapes.ts` e `arcs.ts`, o
  agrupamento de `slices.ts`, as faixas de `PointBands`, o caminho de `hoverPath`, `useChartMetrics`, `useSliceRing`, `useSeriesToggle` e `useTweenedNumbers`.
  **Internos**, nao exportados, exceto os tipos que aparecem na API publica dos graficos.
- `src/components/overlays/Dialog/DialogFrame` — mecanica modal: portal, foco preso, rolagem travada, cabecalho, corpo e rodape. **Interno**. Serve `Dialog` e `Drawer`.
- `src/components/feedback/Toast/toastStore` — fila dos avisos, lida pelo `ToastRegion`. Exporta so `showToast`, `dismissToast` e os tipos.
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
- As reprovacoes aceitas vivem declaradas **no script**, e nao so em prosa. Uma reprovacao fora da lista derruba o comando.
- A ordem dos arquivos no script copia a de `tokens.css`: os `@import` primeiro e o bloco legado depois, porque e ele quem vence onde redeclara. Medir na ordem errada daria um laudo que nao corresponde ao que o navegador aplica. Ate a reverificacao da 0.1.1 o bloco legado era descartado: preso aos `@import` no mesmo trecho, ele parecia uma regra `@`. E o bloco `:root, :root[data-theme]` de aliases ia so para o escuro.
- O laudo mede tambem as mensagens de estado — sucesso, atencao, perigo, informacao e o erro sob o campo —, que o comentario do script prometia e nao media.
- O `check:pacote` confere, alem das exportacoes e dos keyframes, que nenhuma variavel do CSS publicado fica sem declaracao e que nenhum seletor sem classe alcanca a pagina do hospedeiro. As duas regras eram conferidas a mao.
- O pacote construido e conferido por `scripts/check-pacote.mjs`, fora da suite: `dist/` nao existe antes do build, e um teste que se pula sozinho esconde a falha que deveria mostrar.
- A separacao entre series sob deficiencia de visao de cores **nao** entra nesses scripts. Ela foi medida a parte e continua sem ferramenta no repositorio.

**Correcoes vindas do primeiro consumo real**

- **Nenhuma medida, nenhum anuncio.** O grafico sem largura — SSR, aba escondida, contêiner recolhido — esperava dizendo "sem dados". Os dados estavam la; o que faltava era largura.
- **O zero no eixo passou a ser opcional** em `ChartLine`, `ChartArea` e `ChartScatter`. Ele continua ligado por padrao, porque marca que nao parte do zero exagera a diferenca; mas um eixo de anos ia de 0 a 2200.
- **Ponto sem vizinho aparece sempre.** A curva entre ele e o nada nao tem tracado, e o marcador so no hover deixava o dado invisivel.
- A marca do eixo e a linha da grade sao identificadas pela **ordem**, nao pela posicao animada: com a posicao na chave, cada quadro do movimento remontava a lista inteira.
- O centro do `ChartRadial` segue o primeiro anel **visivel**, e some quando todos estao desligados. Com muitos aneis, espessura e folga cedem na mesma proporcao antes de o raio ficar negativo.
- Zero na cascata nao leva sinal, e a entrada desligada da legenda muda de cor em vez de desbotar — a opacidade derrubava o contraste abaixo do minimo.
- A `List` retem toda opcao ja vista: com busca assincrona, resolver a escolha so contra a colecao corrente descartava o que veio de uma busca anterior. E o primeiro render monta so o suficiente para medir, em vez de dez mil nos; se a medida der zero — jsdom, lista montada escondida — a janela desliga e monta tudo, e mede de novo quando a lista aparece.

**A biblioteca nao se molda a uma aplicacao**

- **As incompatibilidades levantadas pelo PlenusLAB estao encerradas, por decisao do mantenedor.** Tema por classe propria em vez de `:root[data-theme]`, `@container` no lugar de `@media`, ponte entre os tokens dos dois lados, indicador de aba, `radius-full` e a cor `#F87500`: sao regras daquele produto contra decisoes deste. Quem se adapta e a aplicacao.
- O que veio do mesmo relatorio e **era defeito** foi corrigido, e esta registrado nos blocos abaixo. A fronteira e essa: defeito reproduzivel entra; preferencia de um consumidor, nao.
- Uma unica excecao ja estava decidida antes e continua valendo: separar o CSS de pagina do CSS dos componentes. Ela nao e preferencia do PlenusLAB — e o `README.md` dizendo que as aplicacoes consomem, e uma biblioteca que reescreve o `body` do hospedeiro nao esta sendo consumida.

**Contrato publico dos componentes**

- **Cada componente aceita as propriedades nativas do elemento que renderiza como raiz**, e o `className` **soma** em vez de substituir o do sistema. Nos campos o elemento e o controle: o `input` nos de texto, o gatilho no `Select`, o campo de texto no `ComboBox` e nos seletores, onde o `className` vai a caixa do campo. Nos conteineres, `Accordion`, `Card`, `List`, `Table`, `Tabs`, `Pagination`, `Breadcrumb`, `RadioGroup` e `Field`, e o elemento de fora; no `Dialog` e no `Popover`, o elemento do dialogo; no `Progress`, o proprio `progressbar`, que passou a ser o elemento de fora — o `className` ia ao envoltorio e o resto a trilha.
- **`Menu` e `Tooltip` nao levam `id` nem `data-*` ao painel, por decisao.** A raiz deles e o gatilho, que ja e do consumidor e recebe o que ele quiser. O painel e interno e se alcanca pelo papel e pelo nome, `menu` e `tooltip`; abrir uma segunda porta de propriedades para ele seria API sem problema concreto.
- **`Menu` aceita `open`, `defaultOpen` e `onOpenChange`**, o mesmo trio dos demais estados controlados ou nao da biblioteca. Controlado, ele pede a mudanca e espera o consumidor; o foco volta ao gatilho no pedido de fechar, como no modo nao controlado.
- **`title` e o titulo do componente em toda a biblioteca** — graficos, `Card`, `Dialog`, `Alert` e `ChartTooltip`. No `Alert` ele sombreia o atributo nativo, o balao do navegador, e isso fica assim: trocar o nome so ali quebraria a convencao de dezesseis componentes para devolver um atributo que ninguem pediu.
- **`ref` e propriedade, nao `forwardRef`.** O React 19 a trata assim, e `useMergedRefs` junta o ref interno ao de fora — sem ele, um dos dois se perdia: o interno, sobrescrito por `{...props}`, ou o de fora, sobrescrito pelo componente.
- **`name` leva o valor ao `FormData`.** `Select`, `ComboBox` e os tres seletores nao tem controle nativo por baixo, entao um input oculto carrega o valor. Sem ele o campo simplesmente nao era enviado. Ele respeita `disabled`, como o controle nativo, e o reinicio do formulario.
- **Obrigatorio barra o envio.** Input oculto fica fora da validacao do navegador, e o formulario vazio passava. Com `required`, o valor vai num campo validavel e invisivel, que devolve o foco ao controle quando o navegador aponta o erro.
- **O gatilho nao conta como "fora".** Em `Menu`, `Select`, `Popover` e nos tres seletores, o ponteiro fechava o painel e o clique do gatilho reabria em seguida. `shouldCloseOnInteractOutside` resolve nos seis.
- O `Breadcrumb` entrega `linkProps` inteiras ao componente de link, para o roteador que pede `to` em vez de `href`. `linkProps` sozinhas bastam para o item virar link.

**Data e hora**

- **O valor acompanha o texto.** Enquanto o que esta escrito nao e uma data e hora inteiras e permitidas, o campo nao tem valor. Antes, `18:4` na tela convivia com meia-noite no consumidor, e uma data fora dos limites ficava com o valor anterior. A regra vale nos tres seletores, e substitui a decisao anterior de ficar em silencio durante a digitacao: silencio deixava texto e valor discordando. A hora digitada tambem respeita `min` e `max`.
- Sem hora nenhuma, meia-noite continua sendo o valor. E decisao ja fixada em teste, e a data sozinha e um instante legitimo.
- **`null` e "controlado e vazio".** Devolver a propriedade a `undefined` nao limpa o campo, porque ali ele volta a ser nao controlado — era assim que um `form.reset()` ficava sem efeito nos tres seletores.
- **O campo sem valor emite `null`, e nao `undefined`.** O laco `value={v} onValueChange={setV}` recebia `undefined`, voltava ao modo nao controlado e ressuscitava o ultimo valor interno. O estado interno tambem acompanha o que foi emitido, mesmo controlado. **Mudanca incompativel** no tipo de `onValueChange` dos tres seletores.
- **Data digitada respeita `min`, `max` e `isDateUnavailable`.** O calendario ja as recusava; o campo era a porta dos fundos.
- **O mes visivel segue o valor.** Digitar uma data e abrir o painel mostrava o mes corrente. E `goToMonth` leva o foco junto, senao a seta seguinte devolvia a grade ao mes anterior.
- **O separador digitado fecha a parte.** `1/3/2026`, colado ou tecla a tecla, e dia 1 e mes 3, e o campo mostra como foi digitado ate sair dele. Editar o dia no meio da data nao empurra digitos para o mes: selecionar `09` e digitar `15` gravava 1 de marco. Sem separador, a parte fecha ao encher. A mesma mascara, `mascararPartes`, serve data, hora e data com hora, e o `DateTimePicker` passou a entender `1/3/2026 18:40`. ISO tambem e aceito, com o ano reordenado.
- Passo nao positivo na lista de horarios travava a aba num laco sem fim, e a lista nao andava por teclado — faltava passar o proprio teclado ao `ListingOptions`.
- Ids de listbox saem de `useId`: `Math.random` no `Select` mudava entre servidor e cliente, e o `'hora'` fixo fazia dois seletores dividirem os ids das opcoes — no `TimePicker` e no `DateTimePicker`.
- **O painel de horas recebe o foco ao abrir**, e o teclado parte do horario escolhido, como no `Select`. Antes a seta abria o painel e deixava o foco no campo, onde nem seta nem Enter faziam nada, e a lista partia da meia-noite. Escape fecha o painel tambem com o foco no campo.
- **O foco do calendario mora no dia.** A grade tinha o foco e so o desenho apontava o dia, entao o leitor de tela nao ouvia nada ao andar pelas setas. Agora o dia em foco e a parada de Tab, recebe o foco de verdade e o dia indisponivel usa `aria-disabled`, para continuar alcancavel. O foco so anda com o dia se ja estava na grade: o `ref` em linha chamava `focus()` a cada render, e o segundo Enter em "Proximo mes" escolhia um dia.
- **Hoje e Agora levam a grade ao mes corrente**, mesmo com o rascunho ja em hoje: o calendario so seguia o valor quando ele mudava, e ficava no mes navegado.
- **A API dos seletores fala em texto ISO**: `'2026-03-09'` no `DatePicker`, `'18:40'` no `TimePicker` e `'2026-03-09T18:40'` no `DateTimePicker`, em `value`, `defaultValue`, `min`, `max`, `isDateUnavailable` e `onValueChange`. E o mesmo texto que vai ao `FormData`, sem segundos, que os seletores nao escolhem. Os tipos do `@internationalized/date` ficaram por dentro: o `CLAUDE.md` admite o pacote como primitivo e veda tipo de terceiro em propriedade publica, e a veda o alcanca. Texto que nao e data valida conta como ausente, em vez de derrubar o componente.

- **Havia duas escalas de tamanho respondendo a mesma pergunta.** `--pl-type-*`, documentada, com nove papeis; e `--pl-size-*`, herdada do mock v8, com 11, 13 e 15 — degraus que a escala oficial nao tem. Trinta e quatro modulos usavam a documentada e oito usavam a legada, entao um botao saia com 13px ao lado de uma aba com 14px, mesmo papel e mesmo peso. O `TOKENS-REFERENCE-TYPOGRAPHY.md` tem secao propria proibindo escala paralela; ela existia. Os oito migraram, e a legada foi apagada.
- Consequencia visivel, aceita pelo mantenedor: botao vai de 13px para 14px, botao grande de 15px para 16px e **badge de 11px para 14px** — o documento nomeia o badge junto de botoes e abas, em `type.label`.
- **A entrelinha do `Button` tambem saiu da escala.** Com `1.2`, o botao medio media 39px ao lado dos 42px do `InputText`. Cada tamanho usa agora a entrelinha do proprio papel — `caption`, `label` e `title` —, e o medio fica na altura do campo. O pequeno e o grande tiveram o respiro vertical ajustado para ficar perto de onde estavam, em 28px e 48px.
- **A coluna numerica da `Table` pegava o peso do papel sem a familia.** `data-value` e JetBrains Mono, unica familia carregada no peso 500; aplicar o peso sobre Montserrat dava seminegrito sintetizado, justamente onde o monoespacado serve para alinhar digito com digito. Medido em navegador: a celula agora sai em `JetBrains Mono` 500.
- **As familias nao tinham defeito algum.** Poppins 600, Montserrat 400 e 600 e JetBrains Mono 500 batem com o que a referencia manda carregar, e os nove pesos da camada semantica cabem nessa importacao. Dois usos pediam a mono em 600, que nao e carregada, e saiam em negrito sintetizado: o cabecalho da `Table` e a linha em destaque do `ChartTooltip`. Os dois voltaram ao peso carregado.
- `--pl-font-mono` era declarado duas vezes, e o bloco legado vencia com uma pilha fora da referencia. Ficou a da camada semantica.
- O Showcase passou a importar `reset.css`. Separado o CSS de pagina, ele deixou de herdar a base tipografica e o corpo voltava aos 16px do navegador — o consumidor precisa pedir o reset, e o Showcase e um consumidor.

- Um relatorio de integracao com o PlenusLAB, sobre o commit `a9df04c`, levantou cerca de cento e cinquenta pontos. As afirmacoes de maior peso foram reproduzidas antes de qualquer conserto, e uma delas **nao reproduziu**: `formatarHora('00:05', 'en-US')` devolve `00:05` no Node 24, e nao `24:05` — deve depender da versao do ICU. A troca de `hour12` por `hourCycle` foi feita assim mesmo, porque esta certa.
- Tres dos achados eram regressoes desta mesma sessao: o `ChartBar` quebrando com serie nova, o `chartSeriesIn` sem definicao e o `prepare` arrastando o Showcase. Os tres corrigidos.
- **O ponto e ambiguo e nao pode ser descartado sem olhar.** Em pt-BR ele separa milhar, mas teclado numerico e texto colado de origem inglesa o usam como decimal. `formatarEntradaDecimal` o le como decimal quando e o unico, sem virgula, e o que vem depois nao forma grupo de milhar — ou o que vem antes e zero, porque ninguem escreve `0.500` para quinhentos. Antes, colar `12.50` gravava `1250`.
- **Digitado, o ponto espera a proxima tecla.** Decidido na hora, `1.` virava `1,` e `1.234,56` tecla a tecla terminava em `1,23`. Com menos de tres digitos depois, o ponto fica na tela como foi digitado e o valor o le como decimal; o terceiro digito, ou a virgula, decide. Ao sair do campo, o ponto indeciso vira virgula. Quem mostra e `formatarEdicaoDecimal`, e o estado vive em `useDecimalInput`, que `InputNumber` e `InputCurrency` compartilham.
- **Numero que vem de fora arredonda; o que esta sendo digitado trunca.** Sao coisas diferentes: no primeiro caso o valor esta pronto e truncar e perda; no segundo ele esta pela metade.
- **Data sem hora entra pelo fuso local; o resto vai inteiro para o `Date`.** O corte por hifen engolia o `T` e devolvia vazio para tudo que sai de `toISOString()`.
- **Um diagrama de fluxo e aciclico.** O `ChartSankey` detecta ciclo e autolaco antes de chamar o `d3-sankey`, que lancava e derrubava a arvore. Anuncia em vez de descartar ligacao pelas costas.
- **Com sinais mistos, o total nao define a pilha.** `+10` e `-5` somam `5`, mas o segmento positivo chega a `10` e era desenhado por cima do titulo. `stackedExtremes` devolve o caminho do acumulado, e nao so o fim dele.
- **Cada keyframe vive no modulo que o usa.** O CSS Modules renomeia o nome na declaracao `animation` mesmo quando ele foi definido num arquivo global, e a referencia deixava de casar — em silencio, porque CSS nao reclama de animacao inexistente. No pacote publicado, Spinner nao girava, Progress indeterminado nao andava e as entradas de Sankey e Treemap nao animavam. O `check:pacote` agora compara definidos contra referenciados.
- **Numero invalido tem o mesmo destino do ausente: nao se desenha.** `NaN` virava `y = 0`, que o eixo le como o maximo, entao a curva afirmava o contrario do dado. Uma fatia invalida zerava o anel inteiro. A regra chegou depois a cascata, onde o passo invalido nao desenha nem move o acumulado; a dispersao, que desenhava o ponto em `x = 0`; o radial, cujo maximo virava `NaN`; a area empilhada, onde um invalido embaixo partia a serie de cima; o agrupamento em "Outros"; e aos rotulos e descricoes da barra e do anel. Anel ou mapa sem valor positivo anuncia vazio.
- **O formato padrao dos graficos e pt-BR.** `String(valor)` mostrava `1234.5` numa biblioteca cuja terminologia, documentacao e formatadores sao em portugues. Vale tambem na dispersao e no `ChartTooltip`. Ano em eixo de valor pede formato sem separador de milhar, e a documentacao de `includeZero` avisa.
- Os formatadores de apresentacao nao poem sinal no zero: `-0`, e o que arredonda para zero, saiam `-0` e `-0,00`.
- **Overlay dentro de Dialog declara-se camada de cima.** O `ariaHideOutside` do Dialog esconde de leitor de tela tudo que nasce fora dele, e Menu, Popover e Tooltip montam portal no `body`. O atributo faltava no Popover, que so tinha o comentario; o teste agora espera o `MutationObserver`, antes do qual passava com o overlay escondido. O Menu tem escopo de foco proprio, **sem `contain`**: o escopo o poe na arvore do Dialog, e o `contain` disputava o foco com o gatilho. Por isso o foco volta ao gatilho **na hora e antes do `onSelect`** — um campo com `autoFocus` ou um Dialog aberto por ele guardavam o item do menu, que sai da tela, e o foco ia ao `body`. O clique fora fecha sem devolver o foco, que e de quem foi clicado.
- **O Popover nao prende o foco**, como o catalogo o define: sem bloquear a pagina. Sem `contain`, o `restoreFocus` do `FocusScope` leva o Tab da borda ao elemento seguinte ao gatilho. Ele renderiza no servidor sem `document`, como o Dialog.
- **O gatilho nao e "fora".** Sem `shouldCloseOnInteractOutside`, o ponteiro fechava o menu e o clique do gatilho reabria em seguida. E o `cloneElement` deixou de descartar `ref`, `onClick` e `onKeyDown` de quem escreveu o gatilho.
- **Em modo unico, o vazio e valido no acordeao e invalido na aba.** `useSelection` ganhou `allowEmpty`, que so o Accordion liga: a secao aberta fecha ao ser clicada de novo.
- O grupo de radio da `Table` deriva do `baseId`. Fixo em `table-selection`, duas tabelas na mesma pagina viravam um grupo so.
- **O React 19 trata `ref` como propriedade**, entao os campos passaram a aceita-lo sem `forwardRef`, com `mergeRefs` juntando o interno ao de fora. Antes nenhum campo entregava o elemento nativo.

**Correcoes vindas da reverificacao da 0.1.1**

A reverificacao de 28/09, sobre a 0.1.1 do registro, trouxe 38 achados novos e o estado dos 125 do relatorio anterior. Cada defeito de comportamento ganhou um teste que falha no codigo anterior; os de CSS foram conferidos no pacote construido, que o jsdom nao estiliza. O que depende de decisao esta na lista de pendencias, e nao foi implementado.

- **Pilha com sinais mistos e divergente**: o positivo sobe do zero sobre os positivos e o negativo desce dele sob os negativos, na barra e na area. `stackedExtremes` corrigiu o dominio e nao o desenho, que seguia a soma corrida: `+10` e `-5` pintavam a saida de 10 a 5, por cima da entrada. `stackDiverging` resolve os dois, e cada pilha arredonda as proprias pontas.
- **Sem o zero no dominio, a area desce ate o limite do eixo.** A base em `escala(0)` levava o preenchimento centenas de pixels para fora do desenho, por cima do eixo e da pagina.
- **O `ref` e ligado uma vez so.** `mergeRefs` criava funcao nova a cada render, e o React desligava e religava o elemento em todo render, sem rodar a limpeza que o React 19 permite devolver. E o ref do gatilho de `Menu` e `Tooltip` e lido das propriedades: `children.ref` avisa no React 19.
- **A escolha de `Select` e `ComboBox` e a chave.** Resolvida contra `options`, ela sumia da tela e do envio enquanto as opcoes nao chegavam; a listagem registra tambem os itens que so vieram pelo valor, e a `List` controlada deixou de perder a escolha que nao esta entre os itens.
- **Home, End e Espaco editam o campo de busca**, em vez de navegar ou escolher. Sair do `ComboBox` no meio de uma busca devolve o texto da escolha, e o clique no painel, fora de uma opcao, nao fecha a lista.
- **A lista que detem o foco o recebe no clique.** So o campo de busca segura o foco onde ele esta.
- **Tabela**: a ajuda da coluna saiu de dentro do botao de ordenacao, porque controle dentro de controle nao e HTML valido; caixa e chave desmarcam na selecao unica; marcar todas fica desabilitado sem `rows`, onde so apagava a escolha; a chave e anunciada como chave; a linha perdeu `aria-selected`, que so vale em grade; a coluna que sai da tela sai do registro; a linha marcada mantem o destaque na zebra; `defaultSelectedIds` da a escolha inicial; e o descarte de colunas usa os breakpoints do sistema, 900, 1180 e 1280, e nao uma escala propria de 640, 768 e 1024, como `COMPONENTS.md` secao 9 pede.
- **A lista de abas sempre tem uma parada de Tab.** Com a escolhida inexistente ou desabilitada, nenhuma aba era alcancavel.
- **A faixa de paginas tem sempre as mesmas vagas**, e reticencia nunca esconde uma pagina so. Perto da ponta ela encolhia, e a reticencia chegava a ocupar o lugar so do 2.
- **O Tooltip aceita o ponteiro**, como pede a WCAG 1.4.13: sair do gatilho espera a travessia ate o balao.
- O botao de mostrar senha diz o estado pelo rotulo, que acompanha o texto visivel; `aria-pressed` junto dizia duas vezes.
- A mascara monetaria escreve o simbolo da moeda que o `Intl` da em pt-BR, `US$` para o dolar; antes so o real tinha simbolo, e as demais mostravam o codigo.
- Os tres seletores tem a caixa do `InputText` — raio, altura de 42px, estados de erro e de desabilitado —, num lugar so: `TimePicker` e `DateTimePicker` compoem do `DatePicker`, em vez de repetir o CSS com raio e altura proprios.
- Graficos: o mapa de area sem grupo visivel nao desenha o bloco cinza da raiz; a chave das ligacoes do sankey e a posicao, porque `a-b` para `c` e `a` para `b-c` colidiam; o rotulo do negativo fica alem da ponta, e nao dentro da barra; o balao tem largura maxima; os degraus e o peso do valor do centro saem dos tokens tipograficos; e o `ChartDonut` recusa espessura fora de 0 a 1, que deixava o raio interno negativo.
- **O tema dos graficos e o do documento**, `:root[data-theme]`, como o das demais camadas. Com `[data-theme]` sozinho, uma subarvore escura trocava as series e nada mais.
- `logScale` e `timeScale` sairam, por nao terem consumidor.
- A suite deixou de escrever dezoito erros de canvas do jsdom, que escondiam os verdadeiros: o setup devolve contexto nulo, e a medida ja cai na estimativa.

Mudancas incompativeis desta rodada, conforme `CONTRIBUTING.md` secao 11:

- `onValueChange` de `DatePicker`, `TimePicker` e `DateTimePicker` emite `null`, e nao `undefined`, quando nao ha valor.
- `Popover` nao prende mais o foco, e o clique no gatilho e do consumidor. As propriedades `aria-label` e `aria-labelledby` continuam, agora como parte das nativas.
- Na `Table`, a linha nao tem `aria-selected`, caixa e chave desmarcam na selecao unica e os breakpoints de `hideBelow` passaram a 900, 1180 e 1280.
- Passos da `Pagination` e dias indisponiveis do calendario usam `aria-disabled`, e nao `disabled`.
- O botao de senha nao tem `aria-pressed`.
- Os seletores mudaram de raio e de altura, para a do `InputText`.
- O `Select`, o `ComboBox` e os seletores obrigatorios barram o envio vazio.

**Pendencias da reverificacao resolvidas na 0.2.0**

A pedido do mantenedor, a lista de decisoes pendentes da reverificacao foi resolvida, exceto o que muda contrato ou pede desenho. Cada conserto de comportamento ganhou um teste que falha no codigo anterior.

- **O `<title>` voltou onde nao ha `ChartTooltip`**: `ChartLine`, `ChartArea`, `ChartScatter`, `ChartRadial`, `ChartTreemap`, `ChartSunburst` e `ChartSankey`, ao lado do `aria-label`. O balao duplo que justificou a troca so existe onde ha costura; sem ela, o `<title>` era a unica leitura do valor sob o ponteiro, e o valor que o sankey omite por colisao ficava sem leitura alguma.
- **`includeZero` da dispersao aceita o eixo**: `true` nos dois, `'x'` ou `'y'` so naquele, `false` em nenhum. Um ano no X ja nao leva junto o zero do valor no Y.
- **O texto sobre a cor da serie tem token proprio**, `chart.on-*`, um por cor da paleta e por intencao, medido nos dois temas pelo `check:contraste`. O branco fixo do `ChartPie` e do `ChartTreemap` ficava abaixo de 4,5:1 em cinco das dez cores do claro e em todas as do escuro. A cor informada em hexadecimal, como a cor de tema, e medida pelo componente. O valor do mapa perdeu a opacidade, que diluia o contraste medido.
- **Os dois eixos do `ChartCombo` tem o zero na mesma altura**, e as barras de cada um crescem da mesma base. `alignZeros` estende cada dominio so do lado que precisa, com a mesma folga nos dois.
- **O centro do `ChartRadial` reserva o espaco do valor** no menor degrau da escala, ate metade do raio. Com o piso de 8px, o valor sumia a partir de seis aneis; agora quem cede e a espessura deles.
- **As marcas dos graficos sao chaveadas pela posicao**, como a presenca e a cor ja eram. Rotulo repetido — que a legenda, por decisao, continua tratando como a mesma serie — colidia a chave do React.
- **A barra empilhada rotula o total da categoria**, alem da ponta da pilha. `showDataLabels` nao fazia nada com `stacked`.
- **O degrade da area clareia rumo ao zero pelos dois lados.** Ancorado no topo, o trecho negativo, que e o mais distante do zero, saia quase transparente.
- **O cabecalho fixo da `Table` cola na rolagem da pagina enquanto a tabela cabe.** Rolar dentro da tabela e colar na rolagem de fora se excluem em CSS; o envoltorio so continua conteiner de rolagem quando a tabela transborda dele, na largura ou numa altura imposta, e ai o cabecalho cola nessa rolagem. Sem `ResizeObserver`, fica o comportamento antigo. O `overflow-y` que caia no `<table>` saiu.
- **Os controles de selecao da `Table` tem o visual do sistema**, compondo o CSS de `Checkbox`, `Radio` e `Switch` sobre o mesmo `input` nativo.
- **O pacote declara as familias e a aplicacao carrega as fontes**, como o `TOKENS-REFERENCE-TYPOGRAPHY.md` ja dizia. O `README.md` agora explica o carregamento, com o exemplo do Google Fonts, e descreve a estrutura real de estilos — `tokens.css`, `base.css` e `reset.css`. O `.editorconfig` que ele citava foi criado.
- **O seletor de tema fica `:root[data-theme]`.** Os exemplos de `TOKENS.md` e `ARCHITECTURE.md` secao 5, com `[data-theme='dark']`, sao conceituais, como o `CLAUDE.md` registra, e o documento especializado de cores nao fixa seletor. Tema por subarvore nao e suportado; se for pedido, a mudanca e nos tokens, e nao nos exemplos.
- **O Showcase importa pelo nome do pacote.** No desenvolvimento o nome aponta para `src`, para o recarregamento instantaneo; no build, para o `dist`, e o `build:showcase` constroi o pacote antes. O que o Showcase publicado mostra e o que o consumidor recebe.

Mudancas incompativeis da 0.2.0, conforme `CONTRIBUTING.md` secao 11:

- `DatePicker`, `TimePicker` e `DateTimePicker` recebem e emitem texto ISO, e nao os tipos do `@internationalized/date`. O `DateTimePicker` envia ao `FormData` o texto sem segundos, `2026-03-09T18:40`, como o `datetime-local` nativo.
- As propriedades nativas do `Progress` vao ao elemento de fora, que agora e o `progressbar`, e nao mais a trilha.
- O `Button` medio passou de 39px para 42px.
- Na `Table` com `stickyHeader`, o cabecalho cola na rolagem da pagina quando a tabela cabe, e os controles de selecao trocaram o visual nativo pelo do sistema.
- Nos graficos: o rotulo sobre a fatia e o retangulo passou a preto nas cores claras; o eixo direito do `ChartCombo` pode ganhar trecho negativo para alinhar o zero; o balao nativo do `<title>` voltou em sete graficos; a barra empilhada com `showDataLabels` mostra o total; o anel do `ChartRadial` afina para reservar o centro; e o degrade da area com negativo clareia rumo ao zero.

**Depois da 0.2.3**, na `0.2.4`. A versao sobe so a correcao por decisao do mantenedor, como nas anteriores. Entraram tres graficos, `ChartTimeline`, `ChartMap` e `ChartGauge`, descritos em Graficos em desenho, o formatador `formatarDuracao`, a dependencia `d3-geo` e os tokens das escalas de valor. O `useChartMetrics` passou a medir tambem a area que monta depois do grafico. Mudanca incompativel, conforme `CONTRIBUTING.md` secao 11: `DialogProps` passou de interface a uniao de tipos, para exigir `aria-label` sem `title`; quem declarava `interface X extends DialogProps` passa a usar `type X = DialogProps & {...}`. Antes dos graficos, entraram tres pedidos do relato do PlenusLAB que estavam em Decisoes pendentes. O `Dialog` sem `title` nao tem cabecalho e exige `aria-label`, pelo tipo, para a paleta de busca do `Ctrl+K`; o `title` deixou de ser obrigatorio sem quebrar quem ja o passa. O `TabsNav` entrou no catalogo, para as abas que sao enderecos, descrito em Contexto. A opcao do `ComboBox` ganhou `description`, `icon` e `group`, renderizados pela listagem interna: o nome continua o rotulo, a segunda linha e a descricao, e o grupo e `role="group"` com titulo, fora da navegacao. A `List` nao os recebe: a janela virtual dela mede passo uniforme, e grupos e linhas de altura diferente a desalinhariam. O `Popover` que nao leva o foco foi descartado; o catalogo, secao 9, descreve os dois caminhos para o painel sob um campo.

**Depois da 0.2.2**, na `0.2.3`. Entraram no catalogo, por decisao do mantenedor em 18/10/2026, a partir da analise do que o PlenusLAB construiu por falta deles: a `Tag`, o `SegmentedControl`, o `Drawer`, o `Toast`, o `Skeleton`, o `Steps` e o `SkipLink`, descritos em Contexto. O `InputText` ganhou `icon`, a lupa a frente da busca. O `Field` passou a entregar, junto da fiacao, a `className` com o visual dos campos do sistema, em `size` sm ou md: quem monta o proprio controle o recebe pronto, e a pagina do Showcase mostrava um input cru. O CSS saiu do `InputText`, que agora usa a classe do `Field`, sem copia. O `ChartTooltip` passou a ter costura em `ChartLine`, `ChartArea`, `ChartTreemap` e `ChartSunburst`, e os doze graficos tem leitura no ponteiro. Para servir a gaveta, a mecanica modal do `Dialog` foi para o `DialogFrame`, interno; o esqueleto da `Table` passou a ser o `Skeleton`. Novos icones: `IconCheck`, `IconCheckCircle`, `IconExclamationCircle`, `IconExclamationTriangle` e `IconInfoCircle`, pedidos pela `Tag`, pelo `Steps` e pelo `Toast`. Muda o comportamento visual do eixo `onHover` deixa de reservar a calha, e o grafico ocupa o espaco todo ate o ponteiro parar sobre ele, quando encolhe para o eixo entrar. No Showcase, o registro de eventos do playground ficou nos 6 mais recentes, numa caixa de altura fixa. Ao desligar a ultima serie, a barra, a linha ou a area saia esticada para cima, cobrindo o que estava fora do grafico: sem serie visivel o dominio desabava a [0, 1], a animacao o levava ate la com a serie ainda desenhada, e o SVG nao recorta. Agora, sem nenhuma visivel, a escala e a de todas, por `seriesInScale`, em `ChartBar`, `ChartLine`, `ChartArea`, `ChartScatter` e, por eixo, `ChartCombo`. O `ChartTooltip` passou a vir integrado nos nove graficos com costura, ligado por padrao em `showTooltip`; a moldura comum o monta na area de desenho e cada grafico informa as linhas, por `categoryTooltip`, `sliceTooltip` e `pathTooltip`. O `ChartTooltip` aceita formato por linha, para a serie do eixo da direita. `showDots` e `showDataLabels` deixam de ser booleanos e passam a `'visible' | 'hidden' | 'onHover'`, como os eixos: em `onHover`, so os da serie sob o ponteiro, a da barra ou, na linha e na area, a mais proxima dele, por `nearestSeriesAt`. Mudancas incompativeis, conforme `CONTRIBUTING.md` secao 11: `showDots` e `showDataLabels` mudam de tipo, com padrao `'onHover'` nos pontos, `'hidden'` nos rotulos e `'visible'` na cascata; quem monta o proprio `ChartTooltip` em volta do grafico passa `showTooltip={false}`, ou ve dois baloes. No Showcase, o `accent` mostra o nome da cor ao lado do codigo. Na area empilhada, ponto e rotulo sumiam na cor do proprio preenchimento: o ponto passou a anel, com miolo na cor da superficie e borda na cor da serie, em linha, area e combo; o rotulo de valor ganhou halo na cor da superficie; e a pilha passou a preenchimento a 40%, com o contorno em cor cheia. Com rotulos visiveis em mais de uma serie, o da serie de baixo desce para baixo do ponto quando alcancaria o de cima, e os das pontas se alinham para dentro, longe dos numeros do eixo, por `pointLabelPlacement`. O `formatarNumero` e o `formatarMoeda` ganharam `compacto: 'sigla'`, que da `500 k`, `1,5 M`, `2 B` e `R$ 512 k`, com a virgula e o milhar da localidade; `compacto: true` continua na forma da localidade, `500 mil` e `1,5 mi`. A escolha e de quem implementa, por decisao do mantenedor em 18/10/2026; ate ali o formatador recusava sufixo proprio. Os nove graficos com balao ganharam `formatTooltipValue`, para o eixo sair compacto e o balao exato; sem ele, vale o `formatValue`. Do relato do PlenusLAB, entraram os ajustes dentro do papel atual:
- **Altura dos campos:** os campos declaravam 40px e desenhavam 42px; a altura passou a token, `--pl-control-height-sm` e `--pl-control-height-md`, em `src/tokens/semantic/control.css`, registrado em `TOKENS.md`.
- **`Accordion`:** ganhou `headingLevel`, `id` de ancora no cabecalho e o painel fechado em `hidden="until-found"`, que o Ctrl+F acha e abre pelo `beforematch`.
- **`Menu`:** o item ganhou `icon`, `shortcut` (em `aria-keyshortcuts`), `tone="danger"` e `checked` (`menuitemcheckbox`), e a lista aceita secoes com titulo, separadas por divisor.
- **`Tabs`:** ganhou `fitted`, abas em partes iguais, e `fillHeight`, painel que ocupa a altura e rola.

Nos graficos, `ChartScatter`, `ChartRadial` e `ChartSankey` tambem ganharam balao, e os doze o tem; a dispersao ganhou `xLabel`, `yLabel` e `zLabel` para nomear as medidas nele. Desligar a ultima serie pela legenda passou a manter a escala da serie que saiu, pelo `isOutOfScale` do `useSeriesToggle`. No Showcase, os playgrounds dos graficos tem os controles de formato do eixo e do balao.

**Depois da 0.2.1**, na `0.2.2`. A versao sobe so a correcao por decisao do mantenedor, como na `0.2.1`, embora traga mudancas incompativeis, listadas no fim deste paragrafo; quem declara `^0.2.0` ou `^0.2.1` as recebe na proxima instalacao. Entraram: o `Accordion` troca o mais e o menos pelo chevron, que gira ao abrir; o `Dialog` e redesenhado a partir de versoes num artefato — a escolhida tem cabecalho e rodape fixos separados por linha, o meio rolando, rodape em fundo sutil, icone opcional ao lado do titulo, titulo em `type.title` no lugar do Poppins de 24px, fundo desfocado e entrada subindo; no celular continua cartao centralizado, com as acoes dividindo a largura, e nao folha presa a base, por decisao do mantenedor. O raio ficou no `radius.md`, de 8px: a versao do artefato usava 12px, que nao tem token; o `ButtonIcon`, o `CodeBlock` e o `EmptyState`, que entram no catalogo, e o pacote com um modulo por arquivo, descrito em Distribuicao. O `Card` com corpo sem respiro separa o cabecalho do corpo por uma linha, com o mesmo respiro em cima e embaixo: a faixa do cabecalho de uma tabela comecava colada a descricao do cartao. A linha nao foi para a faixa da `Table`: sem cabecalho, ela encostaria na borda do cartao e sairia dupla. A `Table` sem registros mostra o vazio desenhado — icone de busca, *Nenhum registro encontrado* e um subtitulo que sugere rever a busca e os filtros —, e carregando troca as linhas por esqueleto, na mesma quantidade das que estavam na tela, com a mensagem so para o leitor de tela. O `Badge` desceu a 12px, como no Untitled UI, com o raio do sistema. Na `List`, o marcar todos ganhou o respiro da opcao e a caixa desenhada das opcoes passou de 16px a 18px, a do `Checkbox`: as caixas e os textos estavam fora de prumo. Mudancas incompativeis, conforme `CONTRIBUTING.md` secao 11: `Table.Body` troca `empty` por `emptyTitle` e `emptyDescription`, e o vazio aparece mesmo sem eles; o `Badge` passa de 14px a 12px; o texto da `Table` sai da mono para a Montserrat.

**Corrigido depois da publicacao da 0.2.0**, na `0.2.1`. A versao sobe so a correcao por decisao do mantenedor, embora traga as mudancas incompativeis listadas abaixo; quem declara `^0.2.0` as recebe na proxima instalacao.

- **O `Menu` aberto na primeira renderizacao quebrava no servidor.** Com `defaultOpen` ou `open`, ele montava o portal sem `document`. Ganhou a guarda do `Dialog` e do `Popover`, e o teste de servidor passou a cobri-lo.
- **Os arcos e rotulos do `ChartSunburst` sao chaveados pela posicao**, como os dos demais graficos. O caminho de rotulos, usado antes, colidia com dois filhos de mesmo nome.
- **A `Table` acompanha o desenho do Untitled UI**, conferido no codigo dele e em Chrome. A margem lateral passou de 12px a 24px, a do cabecalho do `Card`, e a primeira coluna alinha com o titulo; a coluna de selecao fica a 12px da seguinte. O cabecalho desceu a `caption` em `text-tertiary`, e as celulas a `text-secondary`, a hierarquia da referencia. Depois, a pedido do mantenedor, as linhas desceram abaixo das da referencia, que sobravam: 60px no `md` e 48px no `sm`, com 12px e 8px de respiro vertical. O cabecalho de 44px e 36px ficou. A coluna ordenavel mostra `IconChevronExpand` desde o inicio, em vez de revelar a seta so no ponteiro, e a ajuda virou `IconQuestionCircle`. A linha marcada mantem o fundo e deixa de tingir o texto. Os dois icones entram no conjunto porque a `Table` os usa. Mudanca incompativel, conforme `CONTRIBUTING.md` secao 11: a `Table` `md` passou de 72px para 60px por linha, e a `sm` de 64px para 48px.

**Relato do primeiro consumidor integral, o PlenusLAB, em 07/10/2026**, tambem na `0.2.1`. Das vinte linhas do relato, entrou o que e defeito ou ja estava prometido; o resto depende de decisao e esta em Decisoes pendentes do relato do PlenusLAB.

- **Os paineis de `Select`, `ComboBox`, `DatePicker`, `DateTimePicker` e `TimePicker` declaram-se camada de cima**, como `Menu`, `Popover` e `Tooltip` ja faziam. Dentro de um `Dialog`, o `ariaHideOutside` os escondia do leitor de tela, escolher uma opcao do `ComboBox` fechava o dialogo, e a contencao de foco devolvia ao gatilho o foco que o calendario e a lista de horas pediam. O atributo e lido nos tres lugares.
- **Os nomes acessiveis ganharam acento**: `Paginação`, `Página anterior`, `Próxima página`, `Página N`, `Trilha de navegação` e `Opções`. O leitor de tela pronunciava errado.
- **A `Pagination` aceita `disabled`**, que suspende a troca enquanto a pagina pedida carrega. Com `aria-disabled`, pelo mesmo motivo dos passos na borda: o botao desabilitado perderia o foco.
- **O `Table.Body` chaveia a linha pelo `id` do item.** Sem chave, o React reaproveitava a linha pela posicao e o foco voltava para a linha errada depois de reordenar.
- **O erro de campo e anunciado quando aparece**: a mensagem de `Field`, `Checkbox`, `RadioGroup` e `Switch` sai com `role="alert"`. A ajuda continua sem papel.
- **O `Dialog` aceita `role="alertdialog"`**, para a confirmacao que exige resposta. A propriedade ja era aceita pelo tipo e ignorada.
- **O `label` do `Checkbox` e opcional e aceita conteudo.** Sem rotulo visivel, o nome vem de `aria-label` ou `aria-labelledby`, como nos demais campos.
- **O `ComboBox` ganhou `selectionMode="multiple"`**, que o catalogo ja declarava. Segue o que estava decidido para a familia de listagem: lista aberta a cada escolha, caixa de marcacao por item, etiqueta no campo, contagem total para o leitor de tela e `Backspace` no campo vazio removendo a ultima. O `FormData` recebe um valor por escolha. O campo mostra todas as etiquetas enquanto cabem e passa a primeira e a contagem das demais quando transbordam, medido por `ResizeObserver` e conferido em Chrome; sem ele, como no servidor, resume sempre. O `onValueChange` deixou de vazar para o `input`.

Mudancas incompativeis destes consertos, conforme `CONTRIBUTING.md` secao 11:

- O item de `Table.Body` precisa ter `id`, como o de `rows` ja tinha.
- `ComboBoxProps` passou de interface a uniao de `ComboBoxSingleProps` e `ComboBoxMultipleProps`; quem a estendia com `interface` estende agora uma das duas.
- O `role` do `Dialog` so aceita `dialog` e `alertdialog`.
- Teste de consumidor que procura os botoes da `Pagination` ou a trilha do `Breadcrumb` pelo nome sem acento deixa de achar.

**Fronteira com a aplicacao hospedeira**

- **O CSS global foi partido em dois, por decisao do mantenedor, depois do primeiro consumo real.** `styles/base.css` viaja com os componentes e traz so o que eles exigem do documento; `styles/reset.css` e opcional, sai como arquivo proprio em `dist/reset.css` e carrega a base de pagina — corpo, titulos, links, controles nativos, selecao, barra de rolagem. Antes disso, instalar a biblioteca reescrevia o `body`, os titulos, o `select` nativo e a barra de rolagem do hospedeiro, que e o oposto do que o `README.md` promete quando diz que as aplicacoes consomem.
- A regra e: **o que um componente precisa para estar correto mora no modulo dele.** Separar sem isso seria pior que nao separar, porque quem importasse so o CSS dos componentes receberia padding errado em silencio. Na pratica sobrou o `box-sizing` em `base.css`, e dois consertos: `Field` passou a declarar a propria familia tipografica, que herdava do `body`, e `Accordion` e `Pagination` ganharam anel de foco proprio. Eles nao eram os unicos que dependiam do `:focus-visible` global, como se registrou aqui.
- Na reverificacao da 0.1.1 ela ainda falhava em varios: ajuda e erro de `Checkbox`, `RadioGroup` e `Switch` sem familia — agora compostos do `Field` —, anel de foco proprio que faltava em `Tabs`, `Breadcrumb`, no fechar do `Dialog`, no `Button` em carregamento e nos controles da `Table`, e texto sem familia ou cor no carregamento da `Table`, na reticencia da `Pagination` e no conteudo do `Card`. O `reset.css` passou a usar so tokens semanticos, e a consolidacao do bloco legado nao o quebra mais.
- **Uma regra de pagina continua viajando com os componentes, de proposito**: o bloco de `prefers-reduced-motion` com `!important`. Dezoito modulos animam sem guarda propria, e sem ele a preferencia deixaria de valer para quase toda a biblioteca. Ele so age quando a pessoa pediu menos movimento, que e quando passar por cima do hospedeiro e o comportamento certo. Dar guarda propria aos dezoito e o que permitiria move-lo para o reset.
- Medido no pacote construido: o CSS dos componentes nao tem mais nenhum seletor de elemento nu, e `body`, barra de rolagem e `select` nativo so existem no reset.

**Distribuicao**

- **O pacote sai com um modulo por arquivo** (`preserveModules`), nas duas entradas, `dist/index.js` e `dist/index.cjs`. Num arquivo so, o empacotador do consumidor tratava a biblioteca como um modulo unico: quando a primeira visita e uma tela sob demanda a usavam juntas, o pedaco da entrada levava tudo o que qualquer tela usava dela. Medido com Rollup e esbuild sobre o `dist`: `Button` na entrada e graficos, datas, `ComboBox`, `Dialog` e `Table` sob demanda davam 51 kB minificados na primeira visita, e passam a 1,2 kB; seis componentes na entrada e sete sob demanda, de 66 kB para 27 kB. Foi achado no PlenusLAB, em 18/10/2026, quando um `Button` na leitura levou a primeira visita de 399 kB para 567 kB. O pacote vai de 156 para 700 arquivos e de 1,66 MB para 1,8 MB descompactado. Quem importa pelo nome do pacote nao percebe a troca; caminho direto para `dist/plenus-design-system.es.js` deixa de existir, e o `exports` ja o recusava.
- **A `0.2.0` foi publicada em 28/09/2026, da maquina do mantenedor e sem procedencia.** As mudancas incompativeis das duas rodadas da reverificacao pediam versao menor nova pela convencao de 0.x, e a `v0.1.2` ja existia apontando para um commit sem os consertos. O fluxo da tag `v0.2.0` passou por tipos, suite, build e as duas conferencias, e parou na credencial: o segredo `NPM_TOKEN` nao existe no repositorio. A publicacao saiu do commit da tag, reconstruido e conferido de novo, com `--ignore-scripts`, como o fluxo faria. Reexecutar aquela execucao nao serve mais, porque a versao ja existe no registro.
- **`"license": "UNLICENSED"`.** O pacote e publico no registro, mas o repositorio nao concede uso, e sem o campo nada dizia isso. Escolher uma licenca aberta e decisao do mantenedor.
- **Publicacao no npm publico, por decisao do mantenedor**, na versao `0.1.1`. A `v0.1.0` continua apontando para a base conceitual, e a versao subiu para nao disputar o nome com ela. `publishConfig.access` fica `public` no proprio pacote: escopado, ele nasceria restrito e o `publish` falharia sem a bandeira. O `repository` tambem entrou, porque o npm o usa na pagina do pacote.
- **A publicacao e disparada pelo git.** `.github/workflows/publicar.yml` publica ao receber uma tag `vX.Y.Z`; nada publica a partir de um commit solto na `main`.
- O fluxo repete as comportas locais antes de publicar: tipos, suite, build, `check:pacote` e `check:contraste`. Uma reprovacao em qualquer uma impede a publicacao, e e de proposito — o laudo de contraste e exigencia do `TOKENS-REFERENCE-COLORS.md` antes de expor os tokens.
- **A tag e o `package.json` tem de dizer a mesma coisa.** Sem essa comporta, empurrar `v0.2.0` com o pacote em `0.1.1` publicaria a versao errada sob um nome que promete outra.
- O segredo do repositorio chama-se `NPM_TOKEN` e precisa ser um token **granular**, com escrita no escopo `@plenustech` e a dispensa de 2FA marcada. O token classico exige o codigo de seis digitos, que nenhuma automacao responde — foi exatamente o que barrou a primeira tentativa manual.
- **Procedencia (`--provenance`) enquanto o repositorio for publico.** A atestacao do npm exige repositorio publico; o fluxo le a visibilidade no proprio evento e so pede a procedencia quando ela e possivel, com `id-token: write`. Se o repositorio voltar a ser privado, a publicacao segue sem ela, em vez de falhar.
- A publicacao da 0.1.2 falhou, e o fluxo corrigido nunca rodou: a tag `v0.1.2` aponta para o commit anterior a checagem da credencial. O fluxo agora publica com `--ignore-scripts` — o `prepare` reconstruia o pacote depois de o `check:pacote` aprovar outro build —, derruba o passo quando o `whoami` falha, o que dentro da substituicao nao acontecia, e recusa tag posta fora da `main`. Na `v0.2.0` ele so nao chegou a publicar; a proxima tag o exercita por inteiro, com procedencia, quando o segredo existir.

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
- Os formatadores de entrada sao mascaras, distintas do `formatarMoeda` de apresentacao de `ARCHITECTURE.md` secao 9.1.
- `Menu` e `Select` devolvem o foco ao gatilho por conta propria. O `restoreFocus` do `FocusScope` nao era observavel em teste e mascarava a ausencia.
- Controle desabilitado na borda usa `aria-disabled`, e nao `disabled`: o botao desabilitado perde o foco de quem acabou de usa-lo. Vale nos passos da `Pagination` e nos dias indisponiveis do calendario.
- Espalhar `overlayProps` e declarar `onKeyDown` em seguida **substitui** o manipulador da biblioteca. Encadear, sempre.
- A contagem de caracteres nao controlada vive em `useCharacterCount`, que ouve o evento `reset` do formulario e restaura a contagem inicial. Sem isso, a contagem ficava presa ao ultimo valor digitado enquanto o campo voltava ao inicial.
- A API do `Avatar` aceita apenas atributos validos nos dois elementos que ele pode renderizar. Atributos exclusivos de `img` acabavam no `span` de fallback.

**Decisoes visuais do mantenedor**

- Borda dos controles: neutra em repouso, `--pl-color-primary` no hover. O hover e o unico estado que altera a borda.
- Hover dos controles acrescenta elevacao discreta com `--pl-sh-1`.
- Foco dos campos: borda em `primary` mais halo de `primary-container`. O `outline` deslocado foi adotado e revertido, por produzir borda dupla.
- Hover de itens de lista em `Menu`, `Select` e `ComboBox`: `primary-container` com texto em `on-primary-container`.
- Hover do cabecalho do `Accordion` muda apenas texto e icone, sem preencher o fundo.
- A `Table` usa Montserrat no texto e JetBrains Mono so nas colunas `numeric`. Ate 18/10/2026 a mono cobria o conteudo inteiro, por decisao do mantenedor; ao lado do `Badge` e do `Button`, em Montserrat, a mono de 14px parecia maior que o resto da linha, e o mantenedor revogou a decisao. Agora a tabela segue o `TOKENS-REFERENCE-TYPOGRAPHY.md`, que reserva a mono a quando o alinhamento do digito importa.
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
- **O Showcase passou a ter uma pagina por componente**, em 18/10/2026, a partir de um modelo validado num artefato. A pagina unica de 2.600 linhas tinha ficado dificil de percorrer. Agora:
  - topo com busca por nome, papel ou familia, sem acento nem caixa, em `Ctrl K`, e o tema claro ou escuro, guardado;
  - menu lateral pelas familias do catalogo e uma visao geral em cartoes;
  - rota no endereco, ate a secao: `#/button/playground`;
  - em cada pagina, nesta ordem: playground, exemplos de uso com o codigo, faca e evite onde o catalogo traca a fronteira, variantes, modos e estados, acessibilidade e API.
- **O playground** edita as propriedades com os proprios componentes do sistema, mostra o codigo gerado no `CodeBlock`, registra cada callback disparado e roda verificacoes ao vivo: nome acessivel, contraste documentado, combinacao que o catalogo desaconselha. A previa nao tem tema proprio, porque os tokens trocam na raiz do documento; a largura Tablet ou Celular estreita a previa, mas as consultas de midia seguem a janela. Um iframe resolveria os dois, e quebraria os overlays, que abrem portal no `document`.
- Cada pagina vive em `showcase/app/src/paginas/<Nome>.tsx` e entra no catalogo do Showcase pelo nome do arquivo. Teclado, garantias e API sairam do codigo e dos testes de cada componente; a tabela de API e escrita a mao, como no modelo aprovado.
- Consolidacao do bloco legado de `tokens.css` com as camadas primitiva e semantica.
- Validacao da carga das familias e pesos tipograficos definidos.
- **Nada da reverificacao da 0.1.1 foi conferido em navegador real.** O relatorio viu em Chromium a pilha de sinais mistos, a area abaixo do eixo, a lista escondida no Accordion, o foco do Menu e do Popover e o cabecalho fixo. Os consertos estao cobertos no jsdom, mas geometria, foco em portal e `:has()` pedem o navegador.

### Ainda nao implementado

- O `DataGrid` da etapa 10.
- State Motor da grade, para o `DataGrid`.
- Temas alternativos de marca, previstos em `TOKENS-REFERENCE-COLORS.md`.
- Testes de tema escuro e de importacao do pacote construido. O contraste e o pacote ja tem conferencia automatizada, por script, e o fluxo de publicacao repete as comportas.

## Pendencias de correcao identificadas no review

- **`npm run check:contraste` passa.** A serie 4 era a unica reprovacao, com 2.55:1 contra a superficie clara. A escolha saiu da propria paleta: ela ja aceita 1.77:1 entre a serie 2 e a serie 5, que sao o laranja claro e o escuro. `brand.blue.70` da 1.66:1 contra a serie 1 — o mesmo padrao — e 10.05:1 contra a superficie. `brand.blue.60`, cogitado antes, daria 1.29:1 e ficaria abaixo do que a casa aceita.
- **No tema claro, o segundo tom de cada matiz desce.** Um azul claro sobre superficie clara nao alcanca o piso de 3:1 da WCAG 1.4.11. E o que o laranja ja fazia; o azul passou a fazer igual.
- Definir o idioma dos tokens de raio, espacamento e motion na consolidacao de `tokens.css`. Nenhum documento de referencia os cobre, e `TOKENS.md` secoes 7 e 8 os exemplifica em portugues.
- A escala tipografica paralela foi **removida**: `--pl-size-*` e os pesos `--pl-weight-bold` e `--pl-weight-medium` nao existem mais, e nada os referencia.
- Promover as decisoes arquiteturais registradas no cabecalho de `tokens.css` para o documento normativo adequado, antes de enxugar o comentario.
- Exportar as mascaras de entrada pela API publica quando fizerem parte do contrato de consumo. Os formatadores de apresentacao `formatarData` e `formatarHora` ja sao exportados.
- Consolidar os tokens antigos e novos, removendo ambiguidades entre `tokens.css` e as camadas primitivas/semanticas.
- Ampliar testes para controlled inputs, temas dark, limites de escala, acessibilidade e importacao do pacote construido.
- Verificar em navegador real o foco inicial e a contencao de foco dos overlays. O jsdom trata como invisivel todo elemento em portal, por nao ter layout, entao `autoFocus` e `contain` do `FocusScope` nao sao observaveis na suite. O retorno de foco, esse sim, e verificado.

## Decisoes pendentes da reverificacao da 0.1.1

O resto da lista foi resolvido na 0.2.0 e esta registrado nas decisoes. O que segue muda contrato ou pede desenho, e depende do mantenedor.

- **Valor de `InputNumber` e `InputCurrency`.** Eles emitem texto em pt-BR, `'1234,56'`, e o consumidor converte antes de usar. Numero — `value?: number | null` e `onValueChange(number | null)` — e o que um formulario de valores espera, e ida e volta nao tem ambiguidade; um texto canonico como `'1234.56'` teria, porque `formatarEntradaDecimal` le `'1.234'` como milhar. Recomendacao: numero. Muda o contrato dos dois campos e de `useDecimalInput`, entao e decisao do mantenedor; se vier, o melhor momento e a mesma 0.2.0, que ja quebra contrato.
- **Teclado e toque nos graficos.** O hover so ouve o mouse, e no toque nao ha passar por cima. Tocar para fixar o realce e o balao e tocar fora para soltar e um modelo de interacao a desenhar. O teclado segue o catalogo: o grafico e uma imagem so, e a leitura medida a medida vem pela visao em tabela.
- **API comum entre os `Chart*`.** `series`, `slices`, `tracks`, `nodes` e `flows`, e `onHoverCategory`, `onHoverStep` e `onHoverSlice`, seguem a forma do dado de cada grafico; a unificacao feita cobre so os cartesianos. Unificar o resto quebra quase todos os graficos, e pede o desenho da API antes.
- **Copias antigas que o `d3-sankey` arrasta.** A ultima versao dele, a 0.12.3, depende de `d3-array` 2 e `d3-shape` 1, e quem usa o `ChartSankey` recebe cerca de 18 KB duplicados. O pacote nao consegue corrigir isso pelo consumidor: `overrides` nao atravessa a instalacao. Os caminhos sao aceitar, pedir ao consumidor o proprio `overrides` ou reescrever o layout aqui, o que troca uma dependencia parada por codigo a manter.

## Decisoes pendentes do relato do PlenusLAB

Linhas do relato de 07/10/2026 que nao entraram, cada uma com a norma que a segura. Nenhuma foi implementada.

- **`Badge` clicavel.** O catalogo define `Badge` como rotulo de estado; o pedido muda o papel do componente. A escolha de papeis que o motivou e o `ComboBox` multiplo, ou a `Tag` de alternar. As abas como links entraram como `TabsNav`, em 18/10/2026.
- **Icones de interface geral e a base `Icon` exportada.** O catalogo, secao 10, limita o conjunto ao que os componentes usam; `ARCHITECTURE.md` secao 12 manda as aplicacoes usarem a biblioteca oficial. As duas leituras precisam ser conciliadas antes de o conjunto crescer.
- **`Popover` que nao leva o foco para dentro.** Descartado pelo mantenedor em 18/10/2026: ele e `role="dialog"`, e `COMPONENTS.md` secao 7 pede que dialogo gerencie o foco. O painel sob um campo em que se digita e o `ComboBox` com opcao composta ou, fora de uma lista, um painel no fluxo, como descreve o catalogo, secao 9.
- **Contador sobreposto ao botao**, a ultima peca da barra de filtros do PlenusLAB, prevista em 17/10/2026. A busca com icone entrou como `icon` do `InputText` e a etiqueta removivel como `Tag`, em 18/10/2026. O contador nao tem lugar no catalogo: o `Badge` e rotulo de estado, e pendura-lo no `ButtonIcon` muda o papel do botao. A barra em si e composicao do produto e fica na aplicacao.
- **Nomes dos botoes da `Pagination` configuraveis.** Os acentos foram corrigidos; nomes por propriedade so fazem falta com outro idioma, e a infraestrutura de internacionalizacao esta fora do escopo pelo catalogo, secao 11.

## Excecoes de contraste aceitas

Falhas conhecidas, mantidas por decisao visual do mantenedor apos comparacao lado a lado das alternativas.

- `--pl-chart-sequential-7` no tema escuro: 2,17:1 contra a superficie, abaixo do minimo de 3:1. Decorre da decisao "mais escuro = maior" nos dois temas, de 18/10/2026: o maior valor fica perto do fundo. O contorno das regioes em `--pl-color-border-strong`, a legenda e a tabela compensam.

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
- O grafico e `role="img"` nomeado pelo titulo, e cada marca carrega a propria descricao em `aria-label`; sem costura para o `ChartTooltip`, tambem no `<title>`. A visao em tabela, que a `Table` ja permite, entra quando houver o primeiro consumidor pedindo — e e ela, nao a marca, o caminho da leitura medida a medida.
- D3 entra como **calculo, nunca como renderizador**. `d3-scale` e `d3-array` para escalas e dominios; `d3-selection` e `d3-axis` ficam de fora por tocarem o DOM. Eixos, marcas e rotulos sao JSX, e o React continua dono da arvore. E a mesma fronteira ja firmada para o React Aria.
- O sistema de escalas precede os graficos porque a ausencia dele e a causa raiz do duplo eixo em producao: sem escala confiavel, duas series de grandeza diferente acabam em dois eixos, e o cruzamento entre elas vira artefato da escala escolhida. `mergeDomains` une series num eixo unico.
- O dominio inclui o zero por padrao. Barra que nao parte do zero exagera a diferenca entre os valores. Na dispersao, `includeZero` escolhe o eixo.
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
- Com os dois eixos, **o zero cai na mesma altura nos dois**. Cada dominio e arredondado como o eixo o mostraria sozinho e depois estendido so do lado que precisa, com a mesma folga nos dois; arredondar depois de alinhar desfaria o alinhamento.
- No `ChartCombo` a linha passa pelo **centro da faixa**, que e onde a marca do eixo de categoria tambem fica. As duas formas compartilham a escala de faixas em vez de manterem cada uma a sua.
- `barSlots` devolve uma faixa por presenca, e a presenca vem do tween. Quando entra uma serie nova, o tween devolve o array anterior por um render e o indice da nova ainda nao existe: o acesso passa por `NO_BAR_SLOT`. A extracao tinha perdido essa guarda, que existia antes como `presencas[i] ?? 0`, e o grafico quebrava com `Cannot read properties of undefined`.
- O traco da linha e o marcador de ponto passaram para `core/Chart.module.css` quando o `ChartCombo` virou o terceiro consumidor deles. `ChartLine`, `ChartArea` e `ChartCombo` compoem a partir de la; `ChartArea` mantem o nome local `outline`.
- A moldura cartesiana e um componente interno, nao uma camada preventiva: cinco graficos repetiam titulo, margens, area de desenho, estado vazio, colocacao dos dois eixos e legenda. Ela fala em **x e y**, nao em categoria e valor — e o grafico que decide qual eixo recebe cada marca. Foi o que dissolveu o ramo `vertical`/`horizontal` da colocacao de eixos do `ChartBar`.
- `d3-shape` entrou pela mesma fronteira do restante do D3: ele devolve string de caminho, nao toca no DOM. Interpolacao cubica monotona e geracao de faixa com base variavel sao matematica sutil que nao vale reimplementar, e o pacote tambem serve os arcos dos radiais.
- Valor ausente **interrompe** a curva, em vez de emendar sobre o buraco. Emendar desenharia um trecho que o dado nao afirma. Vale para `ChartLine` e para a faixa do `ChartArea`.
- Area empilhada recebe **cor solida**, nao gradiente: gradientes sobrepostos somam opacidade e a faixa de cima escurece a de baixo. O contorno permanece nos dois casos, porque e ele que separa uma faixa da vizinha.
- O gradiente da area clareia **rumo ao zero**, pelos dois lados quando a serie tem negativo. E a distancia do zero que o tom cheio marca, e nao a altura no desenho.
- O raio da bolha do `ChartScatter` cresce pela **raiz** do valor, para que a area acompanhe o dado. Mapeando o valor direto ao raio, a area cresceria com o quadrado dele.
- Na cascata, o **sinal do rotulo pertence ao grafico**, que formata a magnitude. Delegar o sinal ao formatador do consumidor perdia a variacao com qualquer formatador que exibisse apenas o valor. O teste pegou isso.
- Na cascata, a faixa de cada passo e indexada pela **posicao**, nao pelo rotulo: numa sequencia de passos o mesmo rotulo pode repetir, e a escala categorica funde dominios iguais, sobrepondo as barras.
- Um passo marcado como total parte do zero e recebe intencao `neutral`: ele fecha a conta em vez de acrescentar a ela, e o rotulo dele dispensa o sinal.
- **`ChartTooltip` implementado**, depois de adiado duas rodadas. Acompanha o ponteiro, em portal, e sai a qualquer outra interacao: ponteiro fora da area, rolagem, tecla ou a janela mudando de tamanho. Traz titulo, subtitulo, uma linha por medida com marcador, colunas numericas, uma coluna calculada e um totalizador com operador por coluna.
- **Apesar do nome, o `ChartTooltip` nao conhece grafico algum.** Ele recebe linhas e colunas; quem as monta e quem o usa. O nome veio do shadcn, por decisao do mantenedor, e da referencia visual ja adotada para os graficos — mas o `ChartTooltip` de la e `const ChartTooltip = RechartsPrimitive.Tooltip`, um alias vazio, e o `ChartTooltipContent` que o acompanha nao tem subtitulo, nem multiplas colunas, nem campo calculado, nem totalizador. O nome e emprestado; o componente e nosso.
- O balao **segue o ponteiro**, e nao a marca. Por isso nao usa `useOverlayPosition`, que ancora em elemento e nao em coordenada: a posicao sai do proprio evento, com giro para o lado oposto ao encostar na borda da janela.
- O `ChartTooltip` e **decorativo** para leitor de tela, com `aria-hidden`. Uma grade que some a qualquer interacao nao e leitura acessivel.
- **O `<title>` por marca deu lugar a `aria-label`**, nos doze graficos, por decisao do mantenedor. Ele desenhava um segundo balao, nativo, sempre que o ponteiro parava sobre a marca. E ele nunca foi leitura de leitor de tela: o desenho e `role="img"`, que apresenta o grafico como uma imagem unica e nao expoe os descendentes. A troca elimina o balao duplo e nao custa acessibilidade; o que falta para a leitura medida a medida e a visao em tabela.
- **O `<title>` voltou nos sete graficos sem costura**, ao lado do `aria-label`. O balao duplo so existe onde ha `ChartTooltip`; nos demais, o `<title>` era a unica leitura do valor sob o ponteiro.
- A costura de hover vive em dois lugares, um por familia. `useHoveredBand` serve os cartesianos de faixa — `ChartBar`, `ChartCombo` e `ChartWaterfall` —, que expoem `onHoverCategory` ou, no caso do passo, `onHoverStep`. `useSliceRing` serve o anel, e expoe `onHoverSlice`.
- **O anel entrega a fatia, e nao o indice.** As pequenas ja foram reunidas em "Outros" quando o ponteiro chega, entao o indice do anel nao corresponde ao que o consumidor informou. Entregar a fatia agrupada, com rotulo e valor, dispensa qualquer busca do lado de fora. O `setFocused` do hook virou `focus` na mesma mudanca: ele passou a avisar alem de gravar, e o nome anterior escondia isso.
- `ChartLine` e `ChartArea` ganharam costura em 18/10/2026, com `onHoverCategory`. Sem faixa na escala de pontos, a area de desenho se divide em faixas invisiveis, `PointBands`, cada uma do ponto ate o meio do caminho para o vizinho: vale o ponto mais proximo. Uma guia vertical marca o ponto. Faixas e guia so existem com a costura; sem ela o ponto mantem o `<title>`. No `ChartScatter` o eixo X e numerico e categoria nao se aplica.
- `ChartTreemap` e `ChartSunburst` ganharam `onHoverNode`, que entrega o caminho do grupo ate o no, cada nivel com o valor somado, pelo `hoverPath`. O valor somado e o que o consumidor nao tem: o no sem `value` vale a soma dos filhos. Com a costura o `<title>` sai.
- Valor no balao e **JetBrains Mono**, conforme `TOKENS-REFERENCE-TYPOGRAPHY.md`: `type.data-value` cobre valores monetarios, percentuais e totais em tabelas. O rotulo da serie continua em Montserrat, que e conteudo de interface.
- O texto escrito sobre a cor da serie — a porcentagem na fatia, o rotulo e o valor no retangulo — usa **`chart.on-*`**, o token de texto daquela cor, medido nos dois temas. O preto, e nao `color.ink`, e o texto sobre cor clara: a tinta do tema claro mede 4,39:1 contra a serie 6 e 3,63:1 contra o vermelho. A cor em hexadecimal e medida pelo componente, pela luminancia em que branco e preto empatam; em outro formato, fica o branco.
- **Legenda clicavel implementada**, depois de adiada uma rodada. Cada entrada e um botao com `aria-pressed`, e o estado e controlado ou nao conforme `COMPONENTS.md` secao 6. Ela trabalha com rotulos, nao com indices: e o rotulo que a legenda exibe e o que o produto reconhece, e o indice mudaria de significado ao reordenar as series.
- **As marcas, ao contrario, sao chaveadas pela posicao**, como a presenca e a cor. A legenda trata rotulo repetido como a mesma serie, por decisao, mas o desenho continua com uma marca para cada uma, e a chave pelo rotulo as colidia.

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
- Os eixos tem tres estados de visibilidade, nos dois lados: `visible`, `hidden` e `onHover`. Em `onHover` **o desenho ocupa o espaco todo**: depois de 600ms com o ponteiro sobre o grafico, ele encolhe numa transicao de 240ms e o eixo surge na calha que se abriu; ao sair, volta na hora. Decisao do mantenedor em 18/10/2026, porque aproveitar o espaco e o que mais importa no grafico; ate ali a calha ficava reservada, para o desenho nao se mexer sob o ponteiro, e o `onHover` desperdicava o mesmo espaco que o `visible`. O atraso e o que impede o grafico de encolher quando o ponteiro so o atravessa. `useCartesianLayout` calcula o layout recolhido e o revelado e anima um progresso so entre eles: dado e tamanho que mudam continuam reposicionando na hora.
- O atraso vive no estado de hover e o repouso tem atraso zero, entao a entrada espera e a saida e imediata sem nenhum temporizador em JavaScript.
- O eixo da direita **espelha a escala da esquerda** em `ChartBar`, `ChartLine`, `ChartArea`, `ChartScatter` e `ChartWaterfall`. So o `ChartCombo` tem segunda escala propria, e so quando uma serie declara pertencer a ela.
- A legenda horizontal tem alinhamento proprio, `left`, `center` ou `right`, **centrado por padrao**. A legenda lateral o recusa: ali cada entrada ocupa a linha inteira, e e essa largura que alinha a coluna de medidas do anel. Alinhar uma coluna e alinhar uma linha sao decisoes diferentes, e so a segunda e do consumidor.
- A legenda tem posicao escolhida entre `top`, `bottom`, `left`, `right` e `none`. Barras horizontais recusam `left` e `right` e caem para `bottom`: ali a largura e o proprio desenho, e a legenda ao lado espremeria as barras.
- A altura aceita `fill`, que a toma do contêiner. E o que permite um grafico ocupar a celula de um painel sem ninguem repetir a medida em JavaScript. A area de desenho fica fora do fluxo, para que a medida seja o que o layout concedeu e nao o que o proprio desenho ocupou, e um piso de altura evita o grafico sumir por medir zero quando quem envolve nao impoe altura alguma.
- **Hover nao apaga as outras marcas.** A opacidade reduzida nas barras vizinhas foi implementada e descartada pelo mantenedor: o realce agora e um veu discreto atras da faixa sob o ponteiro, como o cursor da referencia. O token `--pl-chart-cursor` escurece no tema claro e clareia no escuro, porque um veu escuro sobre superficie escura nao apareceria.
- Barra sempre com raio, pelo token. O atributo `rx` nao aceita variavel CSS, entao o valor vem da propriedade `rx` no modulo, que le o token.
- Marcadores e rotulos de valor sao opcionais em toda a familia, com os mesmos nomes: `showDots` e `showDataLabels`. Na barra empilhada, o rotulo e o total da categoria, alem da ponta da pilha. `ChartScatter` fica de fora dos dois, porque ali a bolha ja e a marca e rotulo por ponto se atropela assim que as bolhas se aproximam.

### Graficos em desenho: ChartTimeline, ChartMap e ChartGauge

Pedidos em 18/10/2026. Antes de implementar, cada um ganhou um artefato com prototipo vivo, cenarios, matriz de recursos contra as referencias de mercado (AG Charts, Highcharts, Grafana, Apache ECharts, Metabase, MUI X, Power BI, IBM Carbon, Microsoft Fluent, Google Charts, ApexCharts), API proposta e decisoes. Os artefatos sao privados do mantenedor:

- `ChartTimeline`: https://claude.ai/artifact/8LpGSTc4qrEAJZt8sSHSu7 — **validado**.
- `ChartMap`: https://claude.ai/artifact/Jndvf48UUbRZ64XrzjKPBb e o teste de carga https://claude.ai/artifact/Ac6EZJzyY1zqaXN7gQ7Xp2 — **validados**. O componente e a soma dos dois: as configuracoes do artefato de desenho e o que o teste de carga mediu.
- `ChartGauge`: https://claude.ai/artifact/TpBbmcYpNWtF44mTjAJwDe — **validado**, com a meta monetaria, global e por vendedor, acrescentada a pedido do mantenedor.

Os tres entram em implementacao, um de cada vez, na ordem ChartTimeline, ChartMap, ChartGauge, por decisao do mantenedor em 18/10/2026. Na mesma data ele decidiu: a escala do ChartMap segue "mais escuro = maior" tambem no tema escuro; `d3-geo` entra como dependencia e os tokens de escala sequencial, divergente e sem dado entram em `TOKENS-REFERENCE-COLORS.md`; e a regra de graficos com marcas acionaveis — grupo nomeado, marcas como botoes, um ponto de tabulacao — entrou em `COMPONENTS.md` secao 7.

**ChartGauge.** Implementado em 18/10/2026. `value`, `min`, `max`, arco de 180, 240 ou 270 graus, arco preenchido e/ou ponteiro, faixas nomeadas com intencao, meta, marcas da escala, centro com valor, rotulo e variacao, escala que cruza o zero partindo do zero, compacto, balao e `role="meter"` com `aria-valuetext` que diz a faixa e a meta. Valor fora da escala satura e avisa. Meta monetaria: `valueDisplay: 'value' | 'percentOfTarget'` escolhe o que o centro mostra, com o atingimento calculado pelo componente; `segmentUnit: 'percentOfTarget'` declara as faixas em fracao da meta; sem `max`, a escala vai ate 120% da meta. Varios medidores lado a lado sao composicao do produto. A variante linear fica para depois, como `ChartBullet`. Na implementacao: moldura propria, porque o `ChartFrame` fixa `role="img"` e o medidor e `role="meter"`, nomeado pelo titulo; carregando e sem dado voltam a `role="img"`. O valor do centro desce nos degraus tipograficos do sistema; a animacao usa a duracao padrao do nucleo. Divergencias do artefato: sem `shape` e `orientation`, que eram da variante linear; a legenda nao realca a faixa atual; nao ha opcao de esconder o titulo visivel, entao o medidor dentro de uma celula de tabela mostra o proprio titulo; a segunda linha do centro sai quando nao cabe, e continua no balao e no nome acessivel.

**ChartTimeline.** Implementado em 18/10/2026, com o `formatarDuracao` (`10h16m`, `48m`, `12h`). O nome e do mantenedor. Linhas por categoria, intervalos com inicio e fim e cor por serie, eixo de tempo em horas do dia ou em datas, faixas de referencia por linha (a jornada) e globais, marcas pontuais, linha de referencia, sobreposicao em sub-faixas, rotulo dentro da barra quando cabe, progresso parcial, coluna de resumo por linha calculada pelo consumidor, grupos recolhiveis, modo de estados que junta valores iguais seguidos, balao integrado, legenda que desliga serie e visao em tabela. Ficam para depois: dependencias entre tarefas, marco como tipo proprio, zoom ou selecao de faixa, virtualizacao. Fora: arrastar para editar. A navegacao de periodo (mes anterior e proximo) e composicao do produto. Divergencias do artefato, na implementacao: o balao abre so pelo ponteiro, porque o `ChartTooltip` fecha a qualquer tecla — o foco mostra o anel e o leitor de tela ouve a descricao do intervalo, e ancorar o balao no foco pede uma propriedade nova no `ChartTooltip`; o inicio e o fim vao no subtitulo do balao, que so aceita numeros nas colunas; a tabela e `<table>` nativa, porque a `Table` nao tem cabecalho de secao `th scope="rowgroup"`; o botao "Ver como tabela" mantem o texto e alterna so `aria-pressed`; o instante aparece na legenda com amostra quadrada.

Ao integrar, o `useChartMetrics` deixou de medir so uma vez a area que monta depois do grafico: o observador de tamanho passou a acompanhar o elemento, e nao a montagem. Sem isso, a area de desenho do ChartTimeline guardava a largura de antes da fonte carregar e passava 22 px da borda. No Showcase, o playground e o exemplo ganharam `largo`, que poe os controles embaixo e o exemplo na linha inteira, para graficos que precisam da largura.

**ChartMap.** Implementado em 18/10/2026. O produto fornece a geometria em GeoJSON e os dados como `{ id, value }`, casados pelo identificador de cada regiao; marcadores por latitude e longitude. A base que o mantenedor enviou para teste (geografia e populacao do IBGE, vendas simuladas) e caso de teste, nao formato. O teste de carga mediu, no Chrome:

- 27 UFs, 645 municipios de SP e os 5.573 do Brasil (807 mil vertices, 18 MB) desenham em SVG, o ultimo em cerca de 670 ms, com resposta ao ponteiro perto de 1 ms. Canvas nao desenhou mais rapido: o componente fica em SVG, sem modo canvas. O gargalo e a transferencia, e a documentacao recomenda ao produto carregar um nivel por vez.
- Vendas e densidade concentram nas capitais: a escala linear deixa quase tudo num tom. Entram escala continua linear e logaritmica e classes por quantis, intervalos iguais ou limites fixos, alem de divergente e categorica.
- Regiao sem dado e desenhada com hachura e entra na legenda; dado sem regiao gera aviso em desenvolvimento, em vez de sumir calado.
- Rotulos por nivel: nome na regiao, sigla na UF, nenhum no municipio. O componente calcula o centro visual de cada regiao (polylabel, na maior parte da regiao, para ilhas nao deslocarem o rotulo) e confere que os quatro cantos cabem dentro dela; sem espaco para o valor, fica so a sigla; sem espaco nem para ela, o rotulo vai para uma coluna junto ao desenho, com linha guia. O total do nivel aparece sob o titulo, com as razoes recalculadas sobre os totais.
- A tabela, com busca, e a leitura acessivel e o unico caminho para regioes de poucos pixels.
- Ao abrir uma regiao pequena, como o DF, o enquadramento tem teto de zoom e as vizinhas entram em cinza como contexto: sozinho, o DF ocupava o palco e as bordas retas pareciam corte. Com um valor so, a escala vira uma cor e uma entrada na legenda; com menos valores distintos que cores, as classes diminuem.
- Dependencia: `d3-geo`, do nucleo do D3 e so de calculo, coerente com a fronteira de D3 desta secao. `d3-zoom` nao entra, por tocar o DOM; zoom fica para depois.

Os tokens das escalas (`--pl-chart-sequential-1..7`, `--pl-chart-diverging-*`, `--pl-chart-no-data`) entram com o componente, na ordem "mais escuro = maior" nos dois temas.

Na implementacao:
- Cores por token: classes usam `var(--pl-chart-sequential-N)` e as escalas continuas misturam passos vizinhos com `color-mix(in oklab, ...)`, entao a troca de tema repinta o mapa sem JavaScript. As regioes levam contorno em `--pl-color-border-strong`.
- Desempenho medido em build de producao: 27 UFs com a malha detalhada em ~310 ms, 645 municipios de SP em ~200 ms, 1.794 do Nordeste em ~200 ms, 5.573 do Brasil em ~1,4 s, acima dos ~670 ms do teste de carga, que desenhava direto com d3, sem React nem as descricoes de cada regiao. O ponteiro custa ~2 ms de JavaScript.
- O aviso de dado sem regiao usa `process.env.NODE_ENV`, que o build de biblioteca preserva: o bundler do produto o liga em desenvolvimento e o retira em producao. `import.meta.env.DEV` seria trocado por `false` no pacote publicado.
- `ChartLegend` ganhou `onHighlight`, opcional, para o destaque de classe ao passar pela legenda.
- Cor, como nos demais graficos: `accent` abre a paleta das categorias e dos marcadores, e `color` na escala sequencial ou em classes troca o azul por outra cor, de que saem os sete tons por mistura, mais escuro e maior. O ChartTimeline tambem ganhou `accent`, e os tres playgrounds, o seletor de cor nomeada.
- Divergencias do artefato: rotulo na cor do texto do tema com halo da superficie, porque a escala continua nao tem cor medivel por passo; com `onRegionClick` ou `onMarkerClick`, o desenho vira grupo e regioes e marcadores entram no teclado, pela regra de `COMPONENTS.md` secao 7; balao so pelo ponteiro, como no ChartTimeline; a coluna de rotulos atende so as regioes da metade do desenho junto a ela, porque a linha guia cruzava o mapa; a tabela nao tem coluna de grupo.
- No Showcase, o exemplo dos municipios do Nordeste, pedido pelo mantenedor, usa a base de teste que ele enviou, recortada e simplificada a 0,004 grau em `showcase/app/public/dados-mapa` (2,4 MB, buscada sob demanda): geografia do IBGE, vendas simuladas.

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
- Tipografia: o texto da `Table` e Montserrat, `type.body` nas celulas e `type.caption` em peso 600 no cabecalho. `Table.Column` e `Table.Cell` com `numeric` usam `type.data-value`, em JetBrains Mono com `tabular-nums`, para os digitos alinharem em coluna, e alinham a direita.
- **A celula segue a coluna da mesma posicao.** Sem `align`, `numeric` ou `hideBelow` proprios, ela herda os da coluna; o cabecalho e a linha numeram os filhos do consumidor, e a coluna de selecao fica fora da conta. A coluna registra o que a celula herda antes da pintura, para o valor nao aparecer um quadro do lado errado. Antes, o consumidor repetia os tres em cada celula, e o `hideBelow` esquecido tirava o cabecalho e deixava o valor. O esqueleto do carregamento segue a mesma regra: a barra de uma coluna `end` fica a direita.
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

### ButtonIcon

Entrou no catalogo por decisao do mantenedor em 18/10/2026, como componente proprio da familia `Button`, e nao como variante dele.

- **O nome e obrigatorio**, em `label`: vai ao `aria-label` e a dica do `Tooltip`, que aparece ao passar o ponteiro ou chegar pelo teclado. Como variante do `Button`, o nome acessivel viraria regra escondida, exigida so quando nao ha texto.
- **Quadrado na altura do `Button`** de cada tamanho, 28, 42 e 48px, para alinhar com ele e com o `InputText` numa barra.
- **`secondary` por padrao**, e nao `primary` como o `Button`: um quadrado na cor principal chama mais atencao do que uma acao de icone pede.
- **Sem `loading`.** No quadrado, o indicador disputaria o lugar do icone; nasce quando houver consumidor pedindo.
- O conjunto de icones ainda nao tem o funil de filtro nem o mais simples. Ele cresce quando um componente precisa, e a decisao sobre icones de interface geral continua pendente.

### EmptyState

Entrou no catalogo por decisao do mantenedor em 18/10/2026, desenhado num artefato a partir dos estados vazios do Untitled UI: entendidos, nao copiados.

- **Ocupa o lugar do conteudo que faltou.** A fronteira com o `Alert` e o lugar: falha ao carregar uma lista e `EmptyState` em tom de erro; falha ao salvar e `Alert`.
- **O fundo e de cartoes fantasma.** Dois cartoes vazios, inclinados, flutuam devagar atras do icone: o conteudo que ainda nao chegou. Os aneis concentricos da referencia e uma malha de pontos com onda foram descartados pelo mantenedor. A animacao para com `prefers-reduced-motion`.
- **Tres tamanhos.** `sm` para listas, paineis e graficos, sem os cartoes; `md` para tabelas e cartoes; `lg` para pagina inteira, com o titulo em `type.headline-medium`.
- **Dois tons.** `neutral` nao interrompe o leitor de tela; `danger` sai com `role="alert"`, sem os cartoes, porque a falha nao e conteudo a caminho.
- **Icone e cartoes ficam fora da leitura.** Quem fala e o texto.
- **Quem usa.** `Table` no vazio, `List.Empty` e os doze graficos, estes com `IconChartBar`. O `ComboBox` mantem a frase curta: o painel dele acompanha o campo e nao comporta o bloco.

### Tag

Entrou no catalogo em 18/10/2026. O nome e o do Untitled UI, a referencia visual; o PlenusLAB a chama de `Chip`.

- **Removivel ou de alternar.** `onRemove` acrescenta o botao de remover; `selected` transforma o texto em botao com `aria-pressed`. Os dois convivem, um ao lado do outro, sem botao dentro de botao.
- **O botao de remover se chama "Remover" mais o texto da etiqueta**, por `aria-labelledby` apontando para si e para o texto. O texto pode ser composto, entao o nome nao e montado em string.
- **Selecionada, mostra o visto**, alem da cor: o estado nao depende so dela.
- O rotulo de estado com tom, que o `Chip` do PlenusLAB tambem cobre, e papel do `Badge`.

### SegmentedControl

Entrou no catalogo em 18/10/2026.

- **Radios nativos por baixo**, escondidos atras de cada segmento. Setas, a parada unica de Tab, a escolha seguindo o foco e o envio pelo `name` vem do navegador, sem motor proprio.
- **`iconOnly`** mostra so os icones; o `label` de cada item continua sendo o nome e vira dica, pelo `Tooltip`.
- Na altura do `Button` de cada tamanho, para alinhar numa barra.

### Drawer

Entrou no catalogo em 18/10/2026, para o `PainelLateral` do PlenusLAB. O `PainelAoLado`, que fica ao lado do conteudo sem bloquear a pagina, e layout da aplicacao.

- **A mecanica e a do `Dialog`.** Portal, `FocusScope`, `useOverlay`, `usePreventScroll`, `ariaHideOutside`, cabecalho, corpo e rodape sairam do `Dialog` para o `DialogFrame`, interno, que os dois usam. Cada um so define a superficie e o fundo.
- Altura toda da tela, sem raio, entrando pelo lado. `side` escolhe direita ou esquerda; `size` tem tres larguras, e no celular a gaveta ocupa a largura.
- Sem `icon` nem `role`: o icone ao lado do titulo e a confirmacao que exige resposta sao do `Dialog`.

### Toast

Entrou no catalogo em 18/10/2026, para os avisos do editor do PlenusLAB, que os pede no canto inferior direito, com tentar de novo e 6s no sucesso.

- **Sem provider.** O `ToastRegion` e montado uma vez na raiz; `showToast` e `dismissToast` falam com uma fila em modulo, lida por `useSyncExternalStore`. E o modelo do `toast()` do shadcn, e serve tambem a quem dispara o aviso fora de um componente. No servidor a fila e vazia.
- **Tempo.** 6s por padrao, e o erro fica ate ser fechado: quem nao leu a falha nao pode perde-la. `duration` troca, e `null` mantem. Ponteiro ou foco dentro param o tempo, que recomeca ao sair.
- **Tres a vista**, os mais recentes; os de tras aparecem quando um sai.
- **Anuncio como o do `Alert`**: aviso e erro com `role="alert"`, os demais com `role="status"`.
- Uma acao so, que fecha o aviso ao ser acionada.

### Skeleton

Entrou no catalogo em 18/10/2026. O esqueleto ja existia dentro da `Table`, que passou a usa-lo.

- Tres formas, `line`, `circle` e `block`, com `width` e `height` para a medida do que vai chegar.
- **Decorativo**, sempre com `aria-hidden`. Quem envolve anuncia o carregamento, como a `Table` faz com a mensagem de status.

### Steps

Entrou no catalogo em 18/10/2026, para as `Etapas` do PlenusLAB.

- **E o indicador, nao o processo.** O conteudo da etapa e os botoes de anterior e proxima ficam no produto: no PlenusLAB, cada uso monta um formulario diferente.
- As anteriores a atual sao concluidas, com o visto e ", concluída" para o leitor de tela; a atual leva `aria-current="step"`.
- Com `onStepChange`, cada etapa vira botao. Sem ele, o indicador so mostra a posicao.
- No celular as etapas empilham, com a linha na vertical.

### ButtonTile

Entrou no catalogo em 18/10/2026, para a paleta de blocos do editor do PlenusLAB.

- **E um `button`**, com icone acima do nome e descricao opcional. `selected` liga o `aria-pressed`; sem ele, e um botao comum.
- Dois tamanhos, `sm` e `md`. O nome e obrigatorio e sempre visivel: o ladrilho nao existe so com icone.

### Toolbar

Entrou no catalogo em 18/10/2026, para a barra de formatacao do editor do PlenusLAB.

- **Padrao de barra de ferramentas do WAI-ARIA**: `role="toolbar"` com nome, uma parada de Tab e as setas, Home e End percorrendo os controles, no eixo de `orientation`. `Toolbar.Group` agrupa com `role="group"` e divisor.
- **Tres posicoes.** No fluxo; `sticky`, presa ao topo ao rolar; ou flutuante, ancorada por `anchorRef` com o `useOverlayPosition`, em `placement`. `appearance` escolhe entre `floating`, com sombra, e `flat`.
- Limite conhecido: ancorada, ela acompanha a rolagem da pagina, nao a de um conteiner interno.

### CheckboxGroup

Entrou no catalogo em 18/10/2026.

- **`fieldset` com legenda**, ajuda e erro, como o `RadioGroup`. O valor do grupo e a lista dos `value` marcados, controlada ou nao.
- **O `Checkbox` le o grupo por contexto** quando tem `value` dentro dele; fora, segue solto, sem mudar a API.
- `required` exige ao menos uma marcada.

### ColorPicker

Entrou no catalogo em 18/10/2026, para a cor das etiquetas e dos destaques do editor do PlenusLAB.

- **Radios nativos por baixo**, como o `SegmentedControl`: setas, Tab e envio pelo `name` vem do navegador.
- **Cada amostra tem nome**, que o leitor de tela ouve e a dica mostra. A cor sozinha nao identifica a opcao.
- `defaultOption` acrescenta a opcao sem cor, de valor `null`.
- Sem espectro nem campo hexadecimal: a escolha livre de cor nao esta no papel.

### FileUpload

Entrou no catalogo em 18/10/2026, para os anexos do PlenusLAB.

- **Nao envia.** `onFilesSelected` entrega os aceitos; o produto envia e devolve a lista em `items`, com `status` e `progress`. Cancelar, remover e tentar de novo sao chamadas para o produto.
- **Tipo e tamanho conferidos na escolha**, por `accept` e `maxSize`; os recusados saem em `onFilesRejected`, com o motivo, e a mensagem aparece no campo.
- **O controle acessivel e o `input type="file"` nativo**, que recebe o foco; o botao visivel fica fora da arvore para nao duplicar o nome.
- O tamanho do arquivo sai por `formatarTamanhoDeArquivo`, novo formatador publico.

### Timeline

Entrou no catalogo em 18/10/2026, para o historico de estados dos registros do PlenusLAB.

- **`ol` com o estado atual em `aria-current="step"`**; os anteriores contam como concluidos, com o visto. Data e descricao opcionais.
- O visual compoe o do `Steps` na vertical, sem copia. Nao e navegavel.

### SortableList

Entrou no catalogo em 18/10/2026, para a estrutura de secoes do editor do PlenusLAB.

- **Grade de uma coluna, `role="grid"`**, e nao `listbox`: cada linha pode ter acoes proprias, e opcao de lista nao admite controle dentro. Setas para cima e para baixo movem o foco; para os lados, entram nas acoes da linha.
- **Reordena por arrasto ou por `Alt` com as setas**, e anuncia a nova posicao por `role="status"`. O componente nao reordena sozinho: `onReorder` entrega origem e destino ao produto.
- Selecao de um item pelo `useSelection`, controlada ou nao. `level` recua o item, para a hierarquia de titulos.
- O arrasto usa eventos de ponteiro, sem a API de arrastar do HTML.

### TabsNav

Entrou no catalogo em 18/10/2026, para a faixa das telas de Sistema e do acervo do PlenusLAB, que a reconstruia por conta propria.

- **Navegacao, nao abas.** `nav` nomeada, links numa lista e `aria-current="page"` na atual. `role="tab"` prometeria setas e painel, e a aba aqui e endereco.
- **O link e o da aplicacao**, por `as` e `linkProps`, como no `Breadcrumb`. `current` vem da rota: o componente nao guarda estado.
- O desenho compoe o das `Tabs`, sem copia. `fitted` divide a largura.

### SkipLink

Entrou no catalogo em 18/10/2026. Um link nativo para a ancora do conteudo, fora da tela ate receber foco. O navegador ja leva o ponto de partida da tabulacao para a ancora, entao o componente nao foca o alvo por conta propria.

### CodeBlock

Entrou no catalogo por decisao do mantenedor em 18/10/2026, a partir do bloco de codigo do editor do PlenusLAB.

- **Exibe, nao edita.** O editor do produto mantem a propria superficie de edicao e usa o `CodeBlock` para mostrar o bloco.
- **A referencia visual e o `CodeSnippet` do Untitled UI**, da versao paga: numeros em coluna propria e copia no bloco. As cores do realce, por pedido do mantenedor, vem dos temas da JetBrains, registradas em `TOKENS-REFERENCE-COLORS.md`.
- **O realce e lexico e do proprio Design System**, sem dependencia. Shiki, highlight.js e os analisadores do Lezer custam de 50 kB a mais de 200 kB, e o bloco de codigo chega na primeira visita de quem le documento; regras de palavra reservada, texto, numero, comentario, anotacao, chamada e propriedade cobrem as linguagens do produto em poucos kB. JSX e TSX somam tag, atributo com valor e o texto entre tags, que fica sem cor. O que se perde e o que exige analisar a linguagem: a cor de um tipo, a diferenca entre declarar e chamar, a interpolacao dentro de texto e o atributo sem valor, como `flush`.
- **Delphi entrou a pedido do mantenedor em 18/10/2026**, lido sem distincao de caixa como o SQL: as tres formas de comentario (`//`, `{ }` e `(* *)`), a diretiva de compilacao `{$...}` como anotacao, o texto com aspa dobrada, o codigo de caractere `#13` e o hexadecimal `$FF`.
- **`syntax` liga o realce e da o rotulo padrao.** `language` continua livre, para o produto nomear como quiser ou mostrar uma linguagem que o realce nao cobre.
- **Sem ligaduras**, como nas IDEs da JetBrains: a fonte juntava `!=` em `≠`.
- **`highlightedLines` recebe numeros, nao texto.** Ler `1, 3-5` e tarefa de quem oferece o campo ao usuario.
- **A linha destacada e `<mark>`**, e nao so fundo: a enfase chega ao leitor de tela, e uma borda a esquerda a mostra sem depender da cor.
- **Os numeros sao gerados pelo CSS**, com texto alternativo vazio: nao entram na selecao, na copia nem na leitura. Linha e numero compartilham as colunas do codigo por `subgrid`, entao a linha quebrada continua alinhada.
- **Sem quebra, o `pre` recebe foco**, porque a linha longa rola de lado e quem usa teclado so a alcanca assim. Com quebra, nao ha o que rolar.
- **Copiar** usa a area de transferencia do navegador e mostra *Copiado* por dois segundos, com a mensagem anunciada por `role="status"`. Sem a API, como em contexto inseguro, o botao nao faz nada.
- Tipografia `type.code`, em JetBrains Mono.

### Familia de tabela: Table, Card e DataGrid

Levantamento das referencias feito antes da implementacao. O Untitled UI guia visual **e** funcionalidade; a arquitetura permanece do Design System.

- O `Table` recebe as linhas por colecao, com `items` e uma funcao que desenha a linha. Linhas escritas soltas impediriam saber a colecao antes de renderizar, e sem isso nao ha marcar todos, nem faixa por Shift confiavel, nem `aria-rowcount` quando a virtualizacao existir. A forma estatica pode ser acrescentada depois sem quebrar contrato.
- O `Table` **nao desenha contorno externo**. Quem envolve desenha. Foi assim que o acoplamento com o cartao deixou de existir: o `Card` nao sabe que ha uma tabela dentro, e a tabela nao sabe que esta num cartao.
- O cartao nasceu como `Card` generico, e nao como `TableCard`, porque o mantenedor declarou que havera um cartao para outros conteudos. Criar o especifico seria trabalho a descartar.
- A coluna de selecao e inserida pelo componente, nao escrita pelo consumidor. O controle segue o modo: radio na escolha unica, caixa de marcacao na multipla, com `toggle` disponivel por propriedade.
- `highlightSelectedRow` segue a referencia e vem ligado. A `List` mantem a decisao oposta, destaque apenas na marcacao, porque ali o item nao e uma linha de tabela.
- Ordenacao e estado, nao algoritmo. Com o consumidor dono das linhas, quem reordena os dados e ele ou o servidor. O componente guarda a direcao, declara `aria-sort` e avisa a mudanca, como a referencia.
- **O cabecalho fixo cola na rolagem da pagina enquanto a tabela cabe.** O envoltorio so e conteiner de rolagem quando a tabela transborda dele, medido por `ResizeObserver`; ai o cabecalho cola na rolagem da propria tabela. Os dois nao convivem em CSS.
- Os controles de selecao compoem o CSS de `Checkbox`, `Radio` e `Switch` sobre o `input` nativo, em vez do `accent-color`.
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
- O valor da ligacao tem tres posicoes — `start`, `middle` e `end` —, com `end` por padrao. O rotulo do no ocupa a faixa logo a direita dele, entao `end` e o unico que nunca disputa espaco com o rotulo da propria origem. Em qualquer posicao, o valor que ainda assim cruzaria um rotulo e **omitido**: dois textos sobrepostos nao informam nada. O valor omitido continua no `<title>` da ligacao, que o navegador mostra sob o ponteiro.
- So o rotulo do no de **saida** tem banda reservada: ele nao tem fluxo a direita para escrever por cima. Os demais caem sobre o proprio fluxo, e ali o halo da cor da superficie e que os separa do que passa por baixo.
- Rotulo por papel do no, rotulo quebrado em linhas e no arredondado e estendido foram **implementados e descartados**, por divergirem da referencia. O `wrapToWidth` do nucleo saiu junto, por ficar sem consumidor.
- O realce do hover **sobe um degrau**, e nao ate a cor cheia: o realce aponta qual ligacao e, nao muda o grafico de aparencia.
- O no do sankey usa o raio do token, pelo mesmo caminho das barras, em vez de um valor proprio no CSS.
- O lado do rotulo do sankey sai do **papel do no**: entrada a esquerda, saida a direita, cada um na sua banda reservada. A regra anterior usava a metade da largura e jogava o rotulo da primeira coluna para dentro do fluxo. O no do meio nao tem banda e cai sobre o fluxo mesmo; ali um halo da cor da superficie e que o separa do que passa por baixo.
- Entrada e saida saem das proprias ligacoes, antes do posicionamento: e isso que permite reservar a banda de cada lado.
- `d3-hierarchy` e `d3-sankey` entram pela mesma fronteira do restante do D3: calculam posicoes e devolvem numeros, sem tocar no DOM.
- As pontas do arco sao arredondadas nos tres radiais, com o raio vindo do token e aberto por propriedade em cada um.
- Quando mostrado, **o centro reserva o espaco do valor** no menor degrau, ate metade do raio: com muitos aneis, quem cede e a espessura deles.
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
     secao de Uso do `README.md`. Publicado no npm publico, por tag, pelo fluxo `publicar.yml`.
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
