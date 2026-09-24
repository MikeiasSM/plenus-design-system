# Progresso de implementacao

Este documento acompanha a implementacao do Plenustech Design System em relacao a documentacao oficial do repositorio.

Ele nao substitui, interpreta ou altera `README.md`, `ARCHITECTURE.md`, `COMPONENTS.md`, `TOKENS.md` ou `CONTRIBUTING.md`. Esses documentos sao a fonte normativa do projeto. As diretrizes de programacao, idioma, nomenclatura e referencias externas estao em `CLAUDE.md`, subordinadas a eles.

O historico cronologico das alteracoes esta no `git log`. Aqui ficam o estado atual, as decisoes que nao devem ser reabertas sem motivo novo, e o que vem a seguir.

## Estado atual

278 testes em 40 arquivos. Build da biblioteca e do Showcase validados.

### Inventario

Os componentes assinalados como disponiveis em `COMPONENTS-CATALOG.md` estao implementados, testados e exportados por `src/index.ts`. O catalogo e a fonte dos nomes e do papel de cada um; aqui fica apenas o estado.

Outros modulos:

- `src/components/forms/Field` — cromo de campo compartilhado. **Interno**, nao exportado.
- `src/hooks/useCharacterCount` — contagem de caracteres, controlada ou nao. **Interno**, nao exportado. Serve apenas `InputText` e `Textarea`, os campos de texto plano.
- `src/hooks/useSelection` — State Motor de selecao, com `selection.ts` puro e a ligacao React. **Interno**, nao exportado. Serve `Menu`, `Select`, `ComboBox`, `Tabs`, `Accordion` e `List`. Alem das chaves escolhidas, retem os itens, para que a escolha sobreviva ao item sair da colecao filtrada.
- `src/components/data-display/List/useListing` e `ListingOptions` — a listagem compartilhada: colecao, filtro, teclado, ARIA, marcacao e virtualizacao. **Internos**, nao exportados. Servem `List`, `Select` e `ComboBox`.
- `src/components/data-display/List/useVirtualWindow` — janela virtual da listagem. **Interno**, pertence ao componente conforme `ARCHITECTURE.md` secao 8.
- `src/hooks/useCalendar` — State Motor de calendario, com `calendar.ts` puro e a ligacao React. **Interno**, nao exportado. Serve `DatePicker` e, por ele, `DateTimePicker`.
- `src/utils/textSearch` — comparacao textual que ignora caixa e acento, sobre `Intl.Collator`. **Interno**, nao exportado. Serve o typeahead do motor e o filtro do `ComboBox`.
- `src/utils/formatters` — `formatarEntradaDecimal` e `formatarEntradaMonetaria`. **Nao exportados** pela API publica.
- `src/tokens` — camadas primitiva e semantica. `src/styles/tokens.css` ainda carrega o bloco legado.

Dependencias de runtime: `react`, `react-dom`, `@react-aria/focus`, `@react-aria/overlays`, `@internationalized/date`. Todas externalizadas no build.

### Decisoes tomadas

Registradas para nao serem reabertas sem motivo novo. O porque importa mais que o que.

**Dependencias e arquitetura**

- React Aria entra **apenas como primitivo de comportamento sem estado**: foco, posicionamento, rolagem, ponteiro e internacionalizacao. Maquinas de colecao, selecao e navegacao permanecem como State Motors proprios, conforme `ARCHITECTURE.md` secao 7. Os hooks vetados estao nomeados em `CLAUDE.md`.
- Descartados como fundacao: `react-aria-components` e `react-stately`, por cederem a maquina de estado; Radix e shadcn/ui, por cederem tambem o DOM; Tailwind, por conflitar com o CSS Modules exigido em `ARCHITECTURE.md` secao 4.
- `@react-aria/focus` e `@react-aria/overlays` sao externalizados no build, junto de `react/jsx-runtime`, para nao serem embutidos no pacote.
- Untitled UI guia o visual sempre que houver referencia correspondente. Consultar **antes** de arbitrar tratamento visual, nao depois.

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
- `Progress` e `Spinner` usam `primary-hover`, o tom mais claro que alcanca o minimo de 3:1 contra o trilho.

**Acessibilidade**

- Contraste validado em WCAG AA nos dois temas, exceto as excecoes registradas adiante.
- `prefers-reduced-motion` respeitado globalmente.
- `Button` em carregamento usa `aria-disabled` com `aria-busy`, preservando o foco. O clique e bloqueado no handler.
- Contadores de caractere nao usam `aria-live`, que anunciava a cada tecla. A contagem fica acessivel por `aria-describedby`.

### Em construcao

- Showcase visual derivado de um mock de implementacao anterior.
- Migracao gradual do Showcase estatico para componentes oficiais.
- Expansao do Showcase React para os proximos componentes oficiais.
- Consolidacao do bloco legado de `tokens.css` com as camadas primitiva e semantica.
- Validacao da carga das familias e pesos tipograficos definidos.

### Ainda nao implementado

- Componentes das etapas 9 e 10 da ordem de implementacao.
- Utilitarios de apresentacao previstos em `ARCHITECTURE.md` secao 9.1, como `formatarMoeda` e `formatarData`.
- State Motors dos demais componentes complexos, como calendario e grade.
- Biblioteca oficial de icones, prevista em `ARCHITECTURE.md` secao 12. Hoje cada componente desenha o SVG de que precisa.
- Temas alternativos de marca, previstos em `TOKENS-REFERENCE-COLORS.md`.
- Testes de tema escuro, de importacao do pacote construido e verificacao automatizada de contraste.
- Pipeline de validacao e publicacao do pacote.
- Showcase consumindo o pacote como aplicacao externa, em vez do alias local.

## Pendencias de correcao identificadas no review

- Validar o contraste antes de publicar um tema ou expor os tokens como API publica, conforme exige `TOKENS-REFERENCE-COLORS.md`. As excecoes aceitas abaixo precisam ser revistas ou formalizadas nesse momento.
- Definir o idioma dos tokens de raio, espacamento e motion na consolidacao de `tokens.css`. Nenhum documento de referencia os cobre, e `TOKENS.md` secoes 7 e 8 os exemplifica em portugues.
- Promover as decisoes arquiteturais registradas no cabecalho de `tokens.css` para o documento normativo adequado, antes de enxugar o comentario.
- Configurar `main`, `module`, `exports` e `types` para consumo externo do pacote quando a publicacao for preparada.
- Exportar os formatadores pela API publica quando fizerem parte do contrato de consumo.
- Consolidar os tokens antigos e novos, removendo ambiguidades entre `tokens.css` e as camadas primitivas/semanticas.
- Definir qual Showcase e a referencia oficial e evitar divergencia entre a entrada estatica e a entrada React.
- Ampliar testes para controlled inputs, temas dark, limites de escala, acessibilidade e importacao do pacote construido.
- Verificar em navegador real o foco inicial e a contencao de foco dos overlays. O jsdom trata como invisivel todo elemento em portal, por nao ter layout, entao `autoFocus` e `contain` do `FocusScope` nao sao observaveis na suite. O retorno de foco, esse sim, e verificado.

## Excecoes de contraste aceitas

Falhas conhecidas, mantidas por decisao visual do mantenedor apos comparacao lado a lado das alternativas.

- `Button` variante `primary` solida: texto branco sobre `brand.orange.50` em 3.03:1, contra o minimo de 4.5:1. Mantido o laranja de marca.
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

Os formatadores de entrada assumem a convencao pt-BR no codigo: virgula como decimal, ponto como milhar. Isso e escopo adequado ao momento, nao defeito, pelo mandamento 9.

A localidade deve entrar quando o formatador de apresentacao previsto em `ARCHITECTURE.md` secao 9.1 for construido, com a assinatura que o documento ja define. Nesse momento, `Intl.NumberFormat` resolve separadores, simbolo e agrupamento sem dependencia externa, e vale revisar se as mascaras de entrada devem derivar os separadores da mesma fonte.

Atencao a um detalhe de compatibilidade: `Intl.NumberFormat` usa espaco nao separavel entre o simbolo da moeda e o numero, diferente do espaco comum usado hoje.

### Campos numericos e monetarios

- `InputText` generico nao deve formatar valores.
- `InputNumber` deve separar claramente valor bruto, valor exibido, parser e formatter.
- O modo inteiro nao aceita virgula ou ponto e nao aplica casas decimais.
- O modo decimal usa virgula como separador e respeita `decimalScale`.
- `InputCurrency` deve manter a edicao bruta durante o foco e aplicar a formatacao monetaria no blur.
- Mudancas externas em componentes controlled devem ser refletidas mesmo durante o foco, conforme o contrato definido.
- `InputNumber` e `InputCurrency` expoem apenas `onValueChange`, com o valor ja normalizado. Repassar o evento cru divergia do valor exibido, e a propriedade `onChange` foi removida por isso.

### Datas

- `@internationalized/date` entrou como dependencia, conforme os primitivos admitidos em `CLAUDE.md`, e e externalizada no build. Os hooks `useCalendar` e `useDatePicker` do React Aria permanecem vetados: o comportamento e o deles, a maquina de estado e nossa.
- O motor de calendario vive em `src/hooks/useCalendar/calendar.ts`, puro e sem React, conforme `ARCHITECTURE.md` secao 7. Ele monta a grade do mes, aplica limites e resolve a navegacao por teclado.
- Formatar `CalendarDate` exige converter com o fuso local, nao com UTC. Convertendo com UTC, o cabecalho do calendario exibia o mes anterior em qualquer fuso negativo: meia-noite UTC do dia primeiro e ainda dia 28 do mes anterior no horario local. O teste pegou isso.
- Cada dia anuncia a data por extenso, nao apenas o numero. Alem de ser o que o leitor de tela precisa, resolve a ambiguidade dos dias de meses vizinhos, que repetem o mesmo numero na mesma grade.
- `TimePicker` **nao** usa `input type="time"`. O seletor nativo foi implementado e descartado: ele segue a localidade do sistema operacional, nao a da aplicacao, e exibia 12 horas com AM/PM num contexto pt-BR; seu painel tambem nao aceita estilo, ficando fora do Design System por construcao.
- O painel de hora e **uma coluna de horarios**, nao duas colunas de hora e minuto. E o que o `DateTimePickerDemo` do Untitled UI faz: uma lista rolavel de horarios ao lado do calendario, de trinta em trinta minutos por padrao. A primeira versao, com colunas separadas de hora e minuto, foi descartada por divergir da referencia.
- Os horarios saem de `gerarHorarios`, entre `min` e `max`, com o passo de `step`. Sem limites, a lista cobre o dia inteiro: da meia-noite as 23h30 no passo padrao. A lista corre sobre a listagem compartilhada de `List`, `Select` e `ComboBox`, com altura limitada por CSS e sem virtualizacao, que para algumas dezenas de itens so traria risco.
- O painel de horarios tem um campo `hh:mm` proprio, para informar a hora sem percorrer a lista.
- `DateTimePicker` e um campo unico, com data e hora na mesma mascara, e um painel unico com o calendario a esquerda e os horarios a direita.
- O painel trabalha sobre um **rascunho**: nada e aplicado ate o usuario confirmar, conforme o rodape de cancelar e aplicar da referencia. `Hoje` leva o calendario para a data corrente sem confirmar.
- Escolher hora sem data escolhida apoia-se em **hoje**. A primeira versao inventava o dia primeiro de janeiro, e o campo exibia uma data que o usuario nunca havia escolhido.
- Tipografia: `type.title` pertence a Montserrat, nao a Poppins. O `Card` nascera errado e foi corrigido. Poppins fica restrita a display e headline, conforme `TOKENS-REFERENCE-TYPOGRAPHY.md`.
- Tipografia: a `Table` usa **JetBrains Mono**, a familia que `TOKENS-REFERENCE-TYPOGRAPHY.md` reserva a tabelas e dados tecnicos, com `tabular-nums` para os digitos alinharem em coluna. `Table.Column` e `Table.Cell` mantem `numeric`, que aplica `type.data-value` em tamanho, peso e alinhamento a direita.
- Pendente: entrada segmentada, em que dia, mes e ano sao campos navegaveis por setas, como no React Aria. Hoje a entrada e um campo unico com mascara, que aceita barra, traco, ponto e espaco, como a referencia do Untitled UI descreve.
- Pendente do Untitled UI: intervalo de datas, atalhos de periodo, visao de dois meses e rodape com cancelar e aplicar. Nenhum deles foi pedido por um cenario concreto ate agora.

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
   - Ligacao React fina em `useSelection`. Hoje serve `Menu`, `Select`, `ComboBox`, `Tabs` e `Accordion`, e esta pronta para `Table`.

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

11. **Showcase como consumidor**
   - Definir a entrada oficial unica e substituir os blocos estaticos por componentes oficiais.
   - Preservar o Showcase como demonstracao, validacao visual e ambiente de integracao.

12. **Integracao e distribuicao**
   - Configurar `main`, `module`, `exports` e `types`, emitir declaracoes e validar o pacote construido.
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
