# Catálogo de componentes

Este documento define o escopo de componentes do Plenustech Design System: quais componentes o Design System cobre, qual o papel de cada um na interface e onde ficam as fronteiras entre nomes próximos.

A divisão de responsabilidades entre os documentos é:

- `COMPONENTS.md` define **como** um componente é criado, composto, testado e nomeado.
- Este catálogo define **quais** componentes existem e **o que** cada um representa.
- `CHANGELOG.md` registra o que cada versão publicada entregou e não é normativo.
- A API de cada componente é definida pelo código, exposta por `src/index.ts`, e está nos tipos (`.d.ts`) do pacote e neste catálogo.

Um componente entra neste catálogo mediante decisão de produto ou arquitetural aprovada. Estar previsto aqui não determina prioridade nem prazo.

## 1. Situação

Cada componente registra uma situação, em dois valores:

- **Disponível** — implementado e exportado pela API pública.
- **Previsto** — pertence ao escopo e ainda não foi implementado.

A situação indica a existência do componente, não a cobertura integral do papel descrito. O que cada versão entregou está no `CHANGELOG.md`.

## 2. Ações

| Componente | Papel | Situação |
| --- | --- | --- |
| `Button` | Aciona uma operação. | Disponível |
| `ButtonIcon` | Aciona uma operação representada só por ícone. | Disponível |
| `ButtonTile` | Ação em ladrilho, com ícone acima do nome, para paletas de inserção. | Disponível |
| `Toolbar` | Agrupa controles de uma mesma superfície, com navegação por setas. | Disponível |

O `ButtonIcon` existe para quando o texto não cabe ou repetiria o que o contexto já diz: o filtro ao lado da busca, o fechar, a ação de uma linha. O nome é obrigatório e vai em `label`, que o leitor de tela ouve e a dica mostra a quem passa o ponteiro ou chega pelo teclado. Havendo espaço para o texto, o `Button` com texto é a escolha: ícone sozinho pede que a pessoa adivinhe.

Quando a ação leva a outra página, `Button` e `ButtonIcon` recebem o destino em `href` (ou o componente de link da aplicação em `as`, com `linkProps`) e viram link de verdade, com o mesmo visual: abrem em outra aba, têm o endereço copiável e o leitor de tela anuncia "link". Operação que muda dados continua sendo botão.
O `Button` leva o ícone como filho, antes do texto: `<Button><IconPlus />Novo pedido</Button>`.

O `ButtonTile` é o botão de uma paleta — os blocos que um editor insere, os tipos de registro que uma tela cria. Ícone e nome ficam sempre visíveis, e uma descrição curta é opcional. Com `selected`, ele alterna e expõe `aria-pressed`. Fora de uma grade de opções equivalentes, a escolha é o `Button`.

A `Toolbar` agrupa os controles de uma superfície, como a barra de formatação de um editor: um único ponto de tabulação e as setas percorrendo os controles, conforme o padrão de barra de ferramentas do WAI-ARIA. Ela pode ficar fixa no fluxo, presa ao topo ao rolar, ou flutuar ancorada a um elemento. Os controles são os do próprio catálogo. Um conjunto solto de botões sem relação entre si não é barra de ferramentas.

## 3. Formulários

| Componente | Papel | Situação |
| --- | --- | --- |
| `Field` | Cromo de campo: rótulo, ajuda, erro, contador e a fiação entre eles. | Disponível |
| `Label` | Rótulo associado a um controle. | Disponível |
| `InputText` | Entrada de texto de linha única. | Disponível |
| `InputNumber` | Entrada numérica, inteira ou decimal. | Disponível |
| `InputPassword` | Entrada de senha, com revelação explícita. | Disponível |
| `InputCurrency` | Entrada monetária. | Disponível |
| `Textarea` | Entrada de texto de múltiplas linhas. | Disponível |
| `Checkbox` | Escolha binária independente. | Disponível |
| `CheckboxGroup` | Escolha múltipla entre opções sempre visíveis. | Disponível |
| `RadioGroup` com `Radio` | Escolha única entre opções sempre visíveis. | Disponível |
| `Switch` | Alternância de um estado ativo. | Disponível |
| `SegmentedControl` | Escolha única entre poucos segmentos lado a lado. | Disponível |
| `DatePicker` | Entrada de data, digitada ou escolhida em calendário. | Disponível |
| `DatePickerRange` | Escolha de um intervalo de datas em calendário, com atalhos definidos pelo produto. | Disponível |
| `TimePicker` | Entrada de hora. | Disponível |
| `DateTimePicker` | Entrada de data e hora combinadas. | Disponível |
| `ColorPicker` | Escolha de cor entre amostras definidas pelo produto. | Disponível |
| `FileUpload` | Seleção de arquivos, por clique ou arrasto, com a lista dos envios. | Disponível |
| `FieldRow` | Linha de ajuste: rótulo e explicação de um lado, o controle do outro. | Disponível |
| `SaveBar` | Barra de alterações não salvas, com descartar e salvar. | Disponível |
| `SaveStatus` | Texto curto da situação do salvamento, com o indicador do estado. | Disponível |

`Field` é a moldura que os campos deste catálogo já usam por dentro, exposta para quem precisa montar um campo que o Design System não entrega — uma máscara de documento, um seletor de arquivo, um autocompletar de endereço. Ele recebe uma função e devolve o `id`, a descrição acessível já montada, o estado de inválido e a classe com o visual dos campos do sistema, no tamanho pedido; o controle continua sendo de quem o escreve, e a classe própria dele, somada à entregue, vence.

A fronteira com `Label` é de alcance: `Label` nomeia **um** controle; `Field` cuida do conjunto — rótulo, ajuda, erro e contador — e da amarração entre eles, que é a parte que mais se erra. Um campo do próprio catálogo nunca deve ser envolvido por `Field`: ele já tem o seu.

O `InputText` aceita um ícone decorativo à frente do texto, como a lupa de uma busca. O nome do campo continua no rótulo. `mask` formata o que se digita ou cola, por um padrão (`0` dígito, `a` letra, `*` letra ou dígito, o resto literal) ou por uma função; o campo, o `onValueChange` e o `name` ficam com o texto formatado, e `onRawValueChange` entrega o cru. É mecanismo: a biblioteca não traz máscara de CPF, CNPJ ou telefone, que são do produto.

`SegmentedControl` e `RadioGroup` fazem a mesma escolha única, e a fronteira é a forma: o `RadioGroup` é a lista de opções de um formulário, com legenda, ajuda e erro; o `SegmentedControl` é um controle compacto, de poucas opções curtas, que muda o que a tela mostra — o período de um painel, a lista ou os cartões. Por baixo ele também é rádio nativo. Com mais de cinco opções, ou opções longas, a escolha é `Select`. A fronteira com `Tabs` é o painel: a aba troca o conteúdo que ela controla; o segmento muda um valor.

`CheckboxGroup` está para o `Checkbox` como o `RadioGroup` está para o `Radio`: a legenda, a ajuda, o erro e o valor do conjunto ficam no grupo, e cada `Checkbox` com `value` dentro dele lê o próprio estado dali. A fronteira com o `RadioGroup` é a quantidade: lá a escolha é uma só; aqui são quantas a pessoa quiser. Com lista longa ou que pede busca, a escolha é o `ComboBox` múltiplo.

O `RadioGroup` e o `CheckboxGroup` aceitam `orientation`: na vertical, o padrão, uma opção por linha; na horizontal, lado a lado e com quebra de linha quando não couberem, para poucas opções curtas.

O `InputNumber` aceita `unit`, a unidade ou o sufixo ao fim do campo — `%`, `kg`, `dias`. Ela fica fora do rótulo e do valor, e o leitor de tela a ouve como descrição do campo.

`DatePickerRange` é um componente à parte do `DatePicker`, e não um modo dele, porque o valor é outro, `{ start, end }` em ISO, e o campo é um gatilho que abre o painel, sem texto a digitar. O nome segue o tipo e depois a especialização. O primeiro clique no calendário marca o início e o segundo o fim, trocando as pontas se vier antes; só `Aplicar` grava o valor, e `Limpar` o esvazia. Os atalhos, como "Últimos 7 dias" e "Este mês", são do produto: `shortcuts` recebe `{ label, range }`, e `range` é uma função, chamada com o painel aberto, para que "Hoje" valha o dia da escolha. Sem a propriedade não há atalho. `defaultDateRangeShortcuts` é uma lista pronta e opcional (Hoje, Ontem, Últimos 7 dias, Últimos 30 dias, Este mês e Mês passado) que o produto passa inteira, filtra ou substitui. O atalho cujo intervalo sai de `min` e `max` fica desabilitado.

O `ColorPicker` escolhe entre amostras que o produto define, cada uma com nome — a cor de uma etiqueta, o destaque de um bloco. Não é seletor livre de cor: não há espectro nem campo hexadecimal. Por baixo são rádios nativos, e o nome de cada amostra é o que o leitor de tela ouve. Uma opção "Padrão", sem cor, é opcional.

O `FileUpload` cuida da escolha dos arquivos e da lista que mostra o andamento, e não envia nada: o produto recebe os arquivos aceitos, faz o envio e informa a cada item o progresso, a conclusão ou o erro. Tipo e tamanho são conferidos na escolha, e o que for recusado volta ao produto com o motivo. Quem não arrasta escolhe pelo seletor de arquivos nativo, que é o que recebe o foco.

O `FieldRow` é a linha de uma lista de ajustes: o rótulo e a explicação à esquerda, o controle à direita, descendo para sob o texto quando a linha estreita. Ele rotula e descreve um controle só, o que o `Field` também faz, e a fronteira é o desenho: o `Field` empilha rótulo, controle e mensagem, para formulário; o `FieldRow` alinha em linha, para ajustes que valem na hora, como chaves e limites, em cartão sem respiro. A `SaveBar` serve ao formulário inteiro, no lugar do salvar por cartão: o produto diz quando há alteração pendente, e ela oferece descartar e salvar, presa ao topo ou ao pé da área de rolagem em que for montada, conforme o `placement`. O que ela não faz é guardar o estado do formulário ou saber o que mudou. Fechada, ela tira os botões do foco, e o foco que estava num deles cai no `body`: ao salvar ou descartar, o produto o devolve a um ponto do formulário, como o campo editado.

O `SaveStatus` é o texto curto da situação do salvamento, no lugar do texto montado à mão num rodapé ou numa barra: o `status` (`idle`, `dirty`, `saving`, `saved` ou `error`) escolhe o indicador e o produto escreve o texto, como "Rascunho salvo às 10:42". `saving` mostra o `Spinner` pequeno, `saved` o sinal de pronto no tom de sucesso e `error` o de erro no tom de perigo; `idle` e `dirty` ficam só com o texto, porque a alteração pendente não é erro nem aviso e o texto já a diz sem depender de cor. O texto tem o tamanho de legenda, em tom terciário, numa região `role="status"` sempre montada, para a mudança ser lida sem tirar o foco. Na situação do `AppShell.PageFooter`, que já é uma região de status, ela não cria a sua, e o texto é lido uma vez só. A fronteira com a `SaveBar` é a ação: a `SaveStatus` só informa e não tem botão, e cabe no `start` do `Card.Footer` ou no rodapé da página. Quem salva, e quando, é do produto.

O controle do `FieldRow` vem como função filha, que recebe `{ id, describedBy }`. Os dois valores vão ao controle um a um, como `id={id}` e `aria-describedby={describedBy}`, e não espalhados nele:

```tsx
<FieldRow label="Desconto sem aprovação" description="Até este valor, o pedido segue direto.">
  {({ describedBy, id }) => <InputNumber id={id} aria-describedby={describedBy} />}
</FieldRow>
```

O controle que se nomeia pelo conteúdo, como um `Button`, usa só `describedBy`.

## 4. Listagem e escolha

| Componente | Papel | Situação |
| --- | --- | --- |
| `Select` | Campo de escolha única a partir de uma lista curta. | Disponível |
| `ComboBox` | Campo de listagem completo, com busca e seleção simples ou múltipla. | Disponível |
| `List` | Listagem visível na própria interface, com busca e seleção opcionais. | Disponível |

Os três nomes são próximos e a fronteira é o papel na interface, não a implementação.

`List` é a listagem que ocupa espaço na tela e permanece visível, onde selecionar é a própria tarefa. `Select` é o campo de formulário para escolha única em lista curta, sem busca. `ComboBox` é o campo completo, para os casos em que a lista é longa, precisa de busca ou admite mais de uma escolha.

Os três compartilham a mesma listagem interna. O consumidor escolhe pelo papel, não pela capacidade isolada.

A opção do `ComboBox` pode ser composta: uma segunda linha, como a coleção de um documento, um ícone decorativo à frente e o grupo a que pertence. O nome da opção continua sendo o rótulo, e a segunda linha é a descrição dela. As opções seguidas de um mesmo grupo aparecem juntas, sob o título, e as setas passam de um grupo ao outro sem parar nele. É o campo de busca que mostra resultados ricos, como o do acervo de documentos.

Na seleção múltipla, o `ComboBox` pode ter rodapé no painel. `selectAll` marca os itens habilitados do resultado da busca, sem desmarcar o resto; `clearable` desmarca tudo, inclusive o que a busca esconde. `confirmSelection` torna a marcação um rascunho: `onValueChange` é chamado uma vez, em "Aplicar", e Cancelar, Escape ou sair do campo descartam o que foi marcado. `labels` troca os quatro textos (`selectAll`, `clear`, `apply` e `cancel`). Pelo teclado, o Tab do campo vai aos botões do rodapé, o Shift+Tab no primeiro volta ao campo, e o Tab no último devolve o foco ao campo e fecha o painel; Enter e Espaço no campo continuam marcando a opção em foco. Uma região de status anuncia a contagem a cada mudança. Sem as três propriedades o painel não tem rodapé.

## 5. Dados

| Componente | Papel | Situação |
| --- | --- | --- |
| `Avatar` | Representação visual de uma pessoa ou entidade. | Disponível |
| `AvatarItem` | Avatar ao lado de um título e uma descrição, numa linha que não estoura a largura. | Disponível |
| `Card` | Superfície que agrupa conteúdo, com cabeçalho e rodapé próprios. | Disponível |
| `CardMetric` | Indicador num cartão: valor, tendência, composição ou evolução, com ativação para o detalhe. | Disponível |
| `Badge` | Rótulo curto de estado ou categoria. | Disponível |
| `Tag` | Etiqueta operada: removível, como o filtro ativo, ou de alternar. | Disponível |
| `Accordion` | Seções expansíveis de conteúdo. | Disponível |
| `CodeBlock` | Trecho de código para leitura, com cópia, numeração e destaque de linhas. | Disponível |
| `Timeline` | Histórico de estados de um registro, com datas e o estado atual destacado. | Disponível |
| `ActivityFeed` | Registro do que aconteceu, do mais recente ao mais antigo, com comentários. | Disponível |
| `NumberedList` | Sequência numerada de passos que explica como algo funciona, sem etapa atual. | Disponível |
| `SortableList` | Lista reordenável por arrasto ou teclado, com seleção de um item. | Disponível |
| `DescriptionList` | Pares de termo e descrição, empilhados ou em linha, com destaque para o total. | Disponível |
| `Table` | Tabela básica, em HTML semântico. | Disponível |
| `DataGrid` | Grade completa, com ordenação, paginação, seleção, virtualização e demais comportamentos de grade. | Disponível |

O critério entre os dois é quem decide quais linhas existem na página. No `Table`, o consumidor escreve a linha e todas estão presentes. No `DataGrid`, o componente decide e mantém apenas a faixa visível, o que é o que torna possível a virtualização.

Daí decorre o resto: o `Table` usa marcação tabular nativa e a tabulação percorre os controles de cada célula; o `DataGrid` é um controle interativo, com navegação bidimensional entre células.

O `DataGrid` traz os recursos de grade como mecanismo, e nenhum é regra de produto: cada um é desligado por padrão, e sem a propriedade que o liga nada muda.

- **Copiar.** `copyable` leva ao Ctrl+C as linhas selecionadas ou, sem seleção, a célula com foco, em texto separado por tabulação, como a planilha cola.
- **Linhas fixas no topo.** `pinnedRows` fixa sob o título linhas do produto, como um resumo, fora da ordem, do filtro, da paginação e da seleção.
- **Edição de célula.** `editable` na coluna abre um campo de texto, ou o editor que o produto der em `renderEditor`; a grade valida o número, o produto valida o resto e recebe o valor por `onCellEdit`, sem que a grade guarde a linha.
- **Agrupar por coluna.** `groupBy` agrupa as linhas em grupos que abrem e fecham, cada um com a quantidade e o agregado `summary` das colunas, formatado como a coluna.
- **Construtor de filtros.** `DataGrid.FilterBuilder` monta condições de qualquer coluna, combinadas por E ou OU, em grupos, sobre o mesmo `filter` do funil.
- **Virtualização de colunas.** `virtualizeColumns` desenha só as colunas que cruzam a tela, junto da janela de linhas que a grade sempre tem.
- **Exportação.** O CSV vem no núcleo. XLSX, PDF ou outro formato entram por `exporters`, sem dependência na biblioteca: o exportador do produto recebe as colunas visíveis e as linhas do escopo, já filtradas e ordenadas, com o texto exibido e o valor cru, e `apiRef` entrega o mesmo modelo fora do menu.

O `Table` não desenha contorno externo. O contorno pertence a quem o envolve, normalmente um `Card`. Fora de um contêiner com borda, a tabela fica solta na página: a faixa do cabeçalho não tem linha em cima. A dica do `help` do título abre embaixo dele, onde cobre só o respiro da primeira linha, e não os filtros e o cabeçalho de página que costumam ficar em cima da tabela; sem espaço embaixo, ela inverte sozinha. A `Table` não rola na vertical: com muitas linhas em altura limitada, como o corpo de um `Card` de altura imposta, o excesso é cortado. Para esse caso, use o `DataGrid` com `height="fill"`. A coluna com `hideBelow` sai abaixo do breakpoint do sistema que ele nomeia, medido na janela, e não na largura da tabela: `sm` é 900px, `md` é 1180px e `lg` é 1280px.

A `Table.Toolbar` é a barra acima da tabela, com a busca e as ações dela. Ela pode vir como irmã antes da `Table` ou como filha dela; como filha, a `Table` a desenha antes do `<table>`, no mesmo contêiner, e o HTML segue válido. É um grupo rotulado (`label`), e não `role="toolbar"`, que pede navegação por setas entre os controles e impede o uso do campo de texto da busca. O primeiro filho, em geral a busca, cresce até 360px; os demais ficam ao lado, e tudo quebra de linha quando falta espaço. Os itens se alinham pela base, para o campo com rótulo visível não esticar os controles ao lado. O respiro lateral é o da margem da tabela, para a busca alinhar com a primeira coluna.

O `Card.Footer` leva à esquerda o que vier no `start`, como uma ação secundária ou a `SaveStatus`, e à direita os filhos, juntos, que podem faltar. Sem `start`, os filhos ficam como antes: nas pontas, com um só indo ao fim da linha.

O `CardMetric` é o `Card` de um indicador. O produto o monta com o `Card.Header` e as partes `Body`, `Value`, `Trend`, `Bar` e `Chart`, e põe no cabeçalho as ações que quiser; o componente não conhece nenhuma delas. Vários indicadores cabem num cartão só, um `CardMetric.Body` para cada, com o `label` do `Value` nomeando o indicador: os corpos seguidos se separam por uma linha e se empilham a partir do topo. A `Bar` mostra a composição de um total, e o `Chart`, a evolução, só em área ou linha: outros gráficos não se leem nesse tamanho. Um painel de gráfico com eixos e legenda é um `Card` com o gráfico no corpo.

A fronteira entre `Badge` e `Tag` é o controle. O `Badge` só rotula um estado ou uma categoria e não responde a nada. A `Tag` é operada: removida, como o filtro ativo de uma busca, ou ligada e desligada, como o papel escolhido entre vários.

O `CodeBlock` exibe código e não o edita: um editor de documento mantém a própria superfície de edição e usa o `CodeBlock` para mostrar o bloco. O realce de sintaxe é léxico e do próprio Design System, para Java, JavaScript, TypeScript, JSX, TSX, SQL, JSON, Shell e Delphi: ele colore o que ajuda a ler o trecho, sem analisar a linguagem como uma IDE. Uma linguagem fora dessa lista aparece numa cor só, com o rótulo que o produto informar.

A `Timeline` mostra por onde um registro passou — criado, enviado, aprovado — com a data de cada estado. A fronteira com `Steps` é o tempo: as etapas indicam onde se está num processo a cumprir, e a pessoa pode navegar entre elas; a linha do tempo registra o que já aconteceu e não é navegável.

O `ActivityFeed` registra o que aconteceu, do mais recente ao mais antigo: quem fez o quê, quando, e os comentários deixados no caminho. A fronteira com a `Timeline` é o estado: a linha do tempo mostra por quais estados um registro passou e destaca o atual; o feed lista acontecimentos, sem estado atual, e cada um pode trazer um comentário citado. Cada `ActivityFeed.Item` recebe o texto do acontecimento, o momento em `time`, com `dateTime` para a data legível por máquina, e o comentário em `comment`, quando houver. A ordem é a que o produto passar.

A `NumberedList` explica uma sequência, como os passos de uma primeira vez: cada `NumberedList.Item` traz o número, o título e uma descrição opcional. Em `layout="list"`, o padrão, os passos descem um abaixo do outro; em `layout="grid"`, viram ladrilhos numa grade que se ajusta à largura. A fronteira com `Steps` é o estado: as etapas indicam onde se está num processo e podem navegar; a lista numerada só explica, sem etapa atual.

A `SortableList` existe para a ordem: as seções de um documento, as colunas de um relatório. Arrastar reordena, e pelo teclado `Alt` com as setas faz o mesmo, com o anúncio da nova posição. A fronteira com a `List` é a tarefa: na `List` a pessoa escolhe itens; na `SortableList`, ela os ordena. Como cada linha pode trazer ações próprias, a marcação é de grade, com uma célula por linha, e não de `listbox`, que não admite controles dentro das opções.

O `DescriptionList` mostra pares de termo e descrição na marcação semântica de lista de descrição, sem o produto repetir `dl`, `dt` e `dd`: cada `DescriptionList.Item` recebe o `term` e, como filhos, a descrição. Em `layout="stacked"`, o padrão, o termo fica em cima, em texto de apoio, e a descrição embaixo, como nos dados de um cliente ou de uma entrega; em `layout="inline"`, o termo fica à esquerda e a descrição à direita, na mesma linha, com algarismos tabulares, como nos totais de um pedido. O destaque de total é `emphasis` no item: a linha ganha um separador acima e o peso de rótulo, e é a forma de marcar o total de uma lista de valores.

O `AvatarItem` é a linha de uma pessoa ou entidade: o `avatar`, normalmente um `Avatar`, à esquerda, o `title` e, abaixo dele, a `description` opcional. Texto longo vira reticências em vez de estourar a largura, e a linha mantém a altura do avatar. Serve a células de tabela, listas de membros e cabeçalhos de contato; o `AvatarItem` não é um controle e não responde a clique.

## 6. Gráficos

| Componente | Papel | Situação |
| --- | --- | --- |
| `ChartBar` | Comparação por categoria, em barras verticais ou horizontais. | Disponível |
| `ChartLine` | Evolução de uma medida ao longo do tempo. | Disponível |
| `ChartArea` | Evolução com ênfase no volume acumulado. | Disponível |
| `ChartCombo` | Duas leituras da mesma categoria, em barras e linhas. | Disponível |
| `ChartPie` | Composição de um total em partes. | Disponível |
| `ChartDonut` | Composição de um total, com o valor central em destaque. | Disponível |
| `ChartWaterfall` | Formação de um resultado, passo a passo. | Disponível |
| `ChartRadial` | Progresso de uma ou mais medidas contra a sua meta. | Disponível |
| `ChartScatter` | Relação entre duas medidas numéricas. | Disponível |
| `ChartTreemap` | Composição hierárquica por área. | Disponível |
| `ChartSunburst` | Composição hierárquica por anéis concêntricos. | Disponível |
| `ChartSankey` | Fluxo entre origens e destinos. | Disponível |
| `ChartTimeline` | Intervalos de tempo dispostos em linhas, como a jornada de cada dia ou as tarefas de um projeto. | Disponível |
| `ChartMap` | Regiões pintadas pelo valor e marcadores por coordenada, sobre a geometria que o produto fornece. | Disponível |
| `ChartGauge` | Um valor numa escala com faixas de significado, como o atingimento de uma meta. | Disponível |
| `ChartHeatmap` | Uma medida no cruzamento de duas categorias, pintada pela cor. | Disponível |
| `ChartTooltip` | Leitura das medidas sob o ponteiro, em lista. | Disponível |

`ChartCombo` desenha barras e linhas sobre o mesmo eixo de categorias, e é a escolha quando uma categoria carrega duas leituras de naturezas diferentes — o volume em barra, a taxa em linha. Com um único tipo de marca, `ChartBar` e `ChartLine` continuam sendo os componentes certos.

Cada série do `ChartCombo`, do `ChartLine`, do `ChartArea` e do `ChartBar` vertical declara a que eixo de valor pertence, e é essa declaração que cria o eixo direito. O gráfico nunca parte a escala por conta própria: um segundo eixo que aparece sozinho transforma o ponto de cruzamento entre as séries em artefato da escala escolhida, e não em fato do dado. Sem nenhuma série à direita, o domínio é único. Com os dois eixos, o zero fica na mesma altura nos dois, e as barras de cada eixo crescem da mesma base: cada domínio se estende só do lado que precisa, com a mesma folga nos dois. A pilha junta só as séries do mesmo eixo, porque somar grandezas de escalas diferentes não tem leitura. No `ChartBar` horizontal o eixo de valor fica embaixo, e o eixo da série é ignorado.

`ChartTooltip` é a leitura no ponteiro: título, subtítulo opcional, uma linha por medida com marcador e colunas numéricas, uma coluna calculada e um totalizador com operador por coluna. Ele acompanha o cursor e sai a qualquer outra interação — ponteiro fora, rolagem ou tecla.

Os gráficos já trazem o `ChartTooltip` montado, ligado por padrão em `showTooltip`: as séries da categoria sob o ponteiro, cada uma com a sua cor e no formato do seu eixo; a fatia com a parte do total; o caminho até o nó; na cascata, a variação do passo e o acumulado. Os números do balão seguem `formatTooltipValue` e, sem ele, o `formatValue` do gráfico: o eixo pode sair compacto — `500 mil` ou `500 k`, pelo `formatNumber` — e o balão, exato. Quem precisa de outras colunas, de um campo calculado ou de um totalizador próprio desliga o integrado e monta o seu pela costura.

A fronteira com `Tooltip` é o conteúdo, não o gráfico: `Tooltip` descreve **um** elemento em uma frase curta e nomeia esse elemento para quem usa leitor de tela; `ChartTooltip` exibe **várias** medidas em forma de grade e é decorativo, porque uma grade que some a qualquer interação não é leitura acessível.

Cada marca carrega a própria descrição em `aria-label`. Com o balão desligado e sem costura, a mesma descrição vai também no `<title>` da marca, que o navegador mostra quando o ponteiro repousa sobre ela; com balão, integrado ou montado pela costura, o `<title>` fica de fora, porque seria um segundo balão sobre o `ChartTooltip`. `ChartScatter`, `ChartRadial` e `ChartSankey` têm balão integrado, mas não costura: o ponto com as medidas nomeadas, o anel com valor, meta e quanto foi atingido, e a ligação com o fluxo e a parte dele na saída da origem.

Todo gráfico com marca traz o botão "Ver como tabela", que troca o desenho pela leitura medida a medida, e `showTableToggle` (ligado por padrão) o tira. A tabela é a mesma leitura do desenho, sem o filtro da legenda: a série desligada continua nela, e a legenda, que liga e desliga só o desenho, sai enquanto a tabela está aberta. Nos cartesianos, uma linha por categoria e uma coluna por série, no formato do eixo dela; na cascata, a variação com sinal e o acumulado; na dispersão, um ponto por linha; no anel, o valor e a parte do total; no `ChartRadial`, o valor, a meta e quanto foi atingido; no `ChartTreemap` e no `ChartSunburst`, um nó por linha, com o caminho do grupo até ele e a parte do total da raiz; no `ChartSankey`, uma ligação por linha, com o fluxo e a parte da saída da origem. `ChartMap`, `ChartTimeline` e `ChartHeatmap` têm a tabela do seu dado, com busca e ordenação no mapa. O `ChartGauge` fica sem ela: o medidor já diz o valor, a faixa e a meta no texto. A estrutura é do core, `ChartTable`, e cada gráfico só monta as linhas.

No toque, o dedo não paira, então o gráfico faz com ele o que faz com o ponteiro, e o mantém até outro toque. Tocar numa marca a fixa, com o realce e o balão, que sobe acima do dedo para a mão não cobri-lo; tocar em outra troca a fixada; tocar fora do desenho, na legenda ou rolar a página solta. O primeiro toque só fixa: `onHover` avisa a marca, e `onMarkClick` não é chamado. Tocar de novo na marca já fixada ativa, e aí `onMarkClick` avisa, como o clique do mouse. O clique do mouse e o do teclado ativam de primeira. A rolagem fica intacta: o gráfico não cancela o gesto nem muda o `touch-action`, e o toque que o navegador toma para rolar, ou em que o dedo anda além da folga, não fixa nada. Mouse e caneta seguem o ponteiro de sempre. A exceção é o `ChartMap` com `zoomable`: a área do mapa deixa a rolagem com um dedo e toma a pinça, com dois dedos, para aproximar e arrastar o desenho.

Abaixo do espaço que o gráfico inteiro pede, ele retira partes em vez de encolher tudo, na ordem do que menos pesa na leitura. A parte sai quando, medida, a área que sobra ao desenho fica menor que o mínimo (120 por 96 px nos cartesianos, 96 px de diâmetro nas formas radiais) e a saída devolve espaço na dimensão que falta: tirar a legenda de baixo não devolve largura, nem tirar o rótulo do eixo de valor devolve altura, e essas partes ficam. A medida vem do texto e do contêiner, e não há ponto de quebra próprio. O Metabase decompõe os cartões pequenos do painel pelo mesmo critério, medido: a legenda sai quando o desenho fica abaixo de 150 px de largura, e os rótulos do eixo, abaixo de 96 px de altura. A ordem, por família:

| Família | Ordem |
| --- | --- |
| `ChartBar`, `ChartLine`, `ChartArea`, `ChartCombo`, `ChartWaterfall`, `ChartScatter` | legenda → título dos eixos → rótulos do eixo de valor (o direito primeiro) → eixos → só o traço (grade, pontos e rótulos de dado) |
| `ChartPie`, `ChartDonut`, `ChartRadial` | legenda → texto do centro → só a forma |
| `ChartGauge` | marcas e rótulos da escala → o arco com o valor |
| `ChartTreemap` | legenda → rótulos, retângulo a retângulo, onde não cabem → só as formas |
| `ChartSunburst`, `ChartSankey` | legenda (no `ChartSunburst`) → rótulos dos nós → só as formas |
| `ChartHeatmap` | legenda da escala → rótulos dos eixos, espaçados e depois retirados → valores nas células |
| `ChartMap` | legenda → rótulos em coluna → só o mapa |
| `ChartTimeline` | resumo das linhas, que vai para baixo do rótulo → rótulos encurtados |

Com a parte fora, a leitura continua pelo `aria-label` de cada marca e pela visão em tabela; o que se perde é o controle da legenda, que liga e desliga séries, e o que o próprio desenho dizia em texto. O botão "Ver como tabela" sai quando o cabeçalho não comporta o título e ele lado a lado, abaixo de 200 px de largura. Sem espaço apertado, o desenho é o mesmo.

Pontos e rótulos de valor seguem a mesma visibilidade dos eixos, em `showDots` e `showDataLabels`: `visible`, `hidden` ou `onHover`. Em `onHover` aparecem só os da série sob o ponteiro — a da barra em que ele está, ou, na linha e na área, a série mais próxima dele —, para o desenho ficar limpo até alguém olhar uma série.

Os avisos têm o mesmo nome em todos os gráficos que têm marca. `onHover` é a costura: avisa o que está sob o ponteiro ou o foco, e `null` ao sair. `onMarkClick` avisa a marca ativada por clique, Enter ou Espaço, e com ele as marcas viram botões. No `ChartSankey` e no `ChartMap`, `clickableMarks` limita os botões às espécies listadas, e as demais seguem como símbolo gráfico. `hidden`, `defaultHidden` e `onHiddenChange` guardam os rótulos que a legenda desliga, no trio do estado controlável; no `ChartMap`, que tem duas legendas, `hidden` vale para as categorias e as séries de marcadores, e `hiddenClasses` para as faixas da escala. O argumento tem a forma de cada família, e cada gráfico mantém o nome dos seus dados — `series`, `slices`, `tracks`, `steps`, `nodes`, `flows`, `cells`: nos cartesianos, `onHover` entrega a categoria, com o rótulo e o índice, e `onMarkClick` a barra ou o ponto, com categoria, série e valor; no `ChartScatter`, o ponto com a série; no anel, a fatia ou o anel; nos hierárquicos, o caminho até o nó — do grupo ao nó, cada nível com o seu valor; no `ChartWaterfall`, o passo e a posição dele; no `ChartHeatmap`, a célula; no `ChartSankey` e no `ChartMap`, que têm duas espécies de marca, um objeto cujo `kind` diz qual; no `ChartTimeline`, o intervalo e a linha dele, só no clique. Cada aviso leva um argumento de dado, e o segundo é reservado aos detalhes da legenda. Nos gráficos que o têm, `hidden` toma o lugar do atributo nativo da figure. O `ChartGauge` não tem marca nem legenda que alterne, e fica sem os três avisos. Em `ChartLine` e `ChartArea` não há barra para apontar: a área de desenho se divide em faixas invisíveis, cada uma do ponto até o meio do caminho para o vizinho, e vale o ponto mais próximo do ponteiro. O desenho é `role="img"` nomeado pelo título — exceto o `ChartGauge`, que é um medidor, `role="meter"`, com o valor, a faixa e a meta no texto do valor —, e a tecnologia assistiva o apresenta como uma imagem só — a leitura medida a medida chega pela visão em tabela. Onde a marca é acionável, como a região do `ChartMap` e a célula do `ChartHeatmap` com `onMarkClick`, o desenho vira grupo, e as marcas, botões numa parada só de Tab, percorridos pelas setas. Em `ChartPie`, `ChartDonut`, `ChartRadial` e `ChartSunburst` o aviso vem também da entrada da legenda, que realça a marca e abre o balão integrado junto dela, como o ponteiro. Sem ponteiro de onde tirar a posição, esse aviso traz um segundo argumento, `{ anchor, color }`: o ponto da janela onde ancorar o `ChartTooltip` — a ponta direita da entrada, a meia altura, com a largura e a altura dela em `width` e `height`, para o balão encostar na entrada — e a cor com que a marca foi desenhada, que a paleta resolve por dentro. A fatia, o anel e o caminho entregues são os mesmos do ponteiro.

Apesar do nome, ele não conhece gráfico algum: recebe linhas e colunas, e quem as monta é o gráfico ou quem o usa. Isso o torna utilizável fora dos gráficos, num cartão de indicador ou numa célula de tabela.

A cor de uma série se resolve em quatro níveis: a cor informada pelo consumidor vence; depois a intenção semântica — `positive`, `negative`, `warning` e `neutral` —, que usa os tokens de status e ignora a paleta; depois a `palette` do gráfico, uma lista em rotação ou `{ base }`, que gera os tons de uma cor; por fim a paleta categórica, que abre com a cor de tema quando houver. A cor de tema, em `accent`, pula a posição da paleta que a repetiria só quando chega em hexadecimal: um `var()` não é resolvido pelo componente.

Séries com intenção não entram na rotação categórica. Pintar uma despesa com a cor de tema escolhida pelo usuário trocaria o significado da barra a cada usuário.

O texto escrito sobre a cor da série — a porcentagem na fatia do `ChartPie`, o rótulo e o valor no retângulo do `ChartTreemap` — usa o token de texto daquela cor, `chart.on-*`, medido nos dois temas. A cor informada em hexadecimal é medida pelo componente; em outro formato, o texto fica branco.

Séries, fatias, anéis e grupos são desligados pela legenda, que é um controle. O componente guarda quais estão ocultos quando o produto não informa, e avisa a mudança sempre.

`ChartPie` e `ChartDonut` são a mesma composição com papéis distintos: o anel existe para abrigar um valor no centro, e é isso que o separa da pizza cheia. `ChartSunburst` estende o anel para a hierarquia, com os filhos repartindo o ângulo do pai e herdando a cor dele. No `ChartSunburst` e no `ChartTreemap`, o valor de um nó com filhos é o maior entre o próprio e a soma dos filhos: sem valor próprio, vale a soma; com um valor maior, a parte que os filhos não detalham fica vazia.

`ChartTimeline` e `Timeline` têm nomes próximos e papéis distintos. A `Timeline` é a lista dos estados por que um registro passou, sem escala de tempo e sem navegação. O `ChartTimeline` é um gráfico: barras de intervalo sobre um eixo de tempo contínuo, uma linha por categoria, com faixas de referência ao fundo, marcas pontuais e um resumo por linha.

O `ChartMap` não embute fronteiras. O produto fornece a geometria em GeoJSON e os dados casados pelo identificador de cada região, e o mesmo componente desenha país, regiões, unidades federativas ou municípios. Descer de um nível a outro é composição do produto, que troca a geometria. Com `zoomable`, quem lê aproxima, afasta e arrasta o desenho, pelos botões, por Ctrl ou ⌘ com a rodinha, pela pinça e pelo teclado; o enquadramento de `focus` e `focusMarkers` é a vista inicial e o limite do afastamento. Mapa de ruas, camadas sobre ele e mapa de calor por densidade são de biblioteca de mapas e ficam fora.

O `ChartHeatmap` é a matriz de calor: linhas e colunas são categorias, e a cor de cada célula mede o valor no cruzamento, como dia por horário, regional por mês, correlação entre indicadores ou retenção por coorte. Ele usa as mesmas escalas de cor do `ChartMap` — sequencial, divergente e por faixas — e a mesma legenda. A célula sem valor é hachurada; o cruzamento que não vem nos dados fica em branco. Como a cor é a única codificação, ele já traz a visão em tabela.

`ChartGauge` e `ChartRadial` são arcos com papéis distintos. O `ChartRadial` mostra o progresso de uma ou mais medidas contra a meta, em anéis concêntricos. O `ChartGauge` mostra onde um único valor cai numa escala com faixas nomeadas — crítico, atenção, bom — e é um medidor: o leitor de tela o ouve como `meter`, com o valor, a faixa e a meta. A meta pode ser monetária, e a exibição em moeda ou em percentual da meta é escolha de quem usa. Vários medidores lado a lado, como a meta de cada vendedor, são composição do produto.

O Design System entrega os gráficos. A tradução entre o manifesto de um dashboard e as propriedades de cada gráfico pertence à aplicação, conforme `ARCHITECTURE.md` §15.

Em todos os gráficos, `hideTitle` esconde o título e o deixa só para o leitor de tela, quando o contêiner já o mostra. `ChartBar`, `ChartLine`, `ChartArea` e `ChartCombo`, que têm eixo à direita, aceitam `formatRightValue`: o formato do eixo da direita, dos rótulos e do balão das séries dele; sem ele, vale o `formatValue`. O `height` é a altura do desenho, em pixels, ou `fill` para o contêiner decidir: o cabeçalho e a legenda ficam fora dela.

## 7. Feedback

| Componente | Papel | Situação |
| --- | --- | --- |
| `Alert` | Mensagem de estado dirigida ao usuário. | Disponível |
| `Progress` | Progresso de uma operação, determinado ou não. | Disponível |
| `Spinner` | Indicação de atividade em curso. | Disponível |
| `EmptyState` | Ocupa o lugar do conteúdo que não há: sem registros, sem resultado ou falha ao carregar. | Disponível |
| `Skeleton` | Lugar de um conteúdo que ainda carrega, na forma do que vai chegar. | Disponível |
| `Toast` | Aviso flutuante sobre uma operação que acabou de acontecer. | Disponível |

A fronteira entre `EmptyState` e `Alert` é o lugar. O `Alert` acompanha o conteúdo e fala de uma operação; o `EmptyState` está no lugar do conteúdo que faltou e diz por que ele não está ali e o que fazer. Por isso a falha ao carregar uma lista é `EmptyState` em tom de erro, e a falha ao salvar um formulário é `Alert`.

Tabela, lista e gráficos usam o `EmptyState` no próprio vazio. O `ComboBox` mantém a frase curta, porque a lista dele é um painel que acompanha o campo e não comporta um bloco.

A fronteira entre `Skeleton`, `Spinner` e `Progress` é o que se sabe do resultado. O `Skeleton` desenha a forma do conteúdo que vai chegar, e serve quando essa forma é conhecida — linhas de uma tabela, um cartão. O `Spinner` diz só que há atividade; o `Progress`, quanto falta. O `Skeleton` é decorativo: quem o envolve anuncia o carregamento.

A fronteira entre `Toast` e `Alert` é o lugar e a duração. O `Alert` fica junto do conteúdo de que fala, até a situação mudar. O `Toast` aparece no canto da tela, fala de algo que acabou de acontecer — salvo, publicado, falhou — e sai sozinho, exceto o erro, que espera ser fechado. É exibido pelo `ToastRegion`, montado uma vez na raiz da aplicação, e disparado por `showToast` de qualquer lugar. Quando duas aplicações dividem a página, ou cada teste precisa do próprio estado, o `ToastProvider` dá à árvore o estado próprio: o `ToastRegion` dentro dele mostra só os avisos disparados por `useToast()` na mesma árvore, e o `showToast` solto continua indo ao estado global. O provider não renderiza o canto; ele é só o estado, e o `ToastRegion` continua sendo posto pelo produto. Com `portalContainer` no `ToastRegion`, ou o `PortalProvider` acima dele, o canto é renderizado dentro de um elemento escolhido, e herda o tema dele.

O aviso aceita até duas ações em `actions`, na ordem dada, como "Desfazer" e "Ver detalhes"; a terceira em diante não aparece, porque o aviso é breve e não é lugar de menu. Acionar qualquer uma fecha o aviso. `action`, a forma de uma ação só, continua valendo.

## 8. Navegação

| Componente | Papel | Situação |
| --- | --- | --- |
| `Breadcrumb` | Caminho percorrido até a posição atual. | Disponível |
| `Pagination` | Navegação entre páginas de um conjunto. | Disponível |
| `Tabs` | Alternância entre painéis de conteúdo. | Disponível |
| `TabsNav` | Faixa de abas em que cada aba é um endereço. | Disponível |
| `Steps` | Etapas de um processo, com a atual destacada e as anteriores concluídas. | Disponível |
| `AppShell` | Moldura de tela em camadas: a navegação da `Sidebar` e a página. | Disponível |
| `Sidebar` | Navegação da aplicação: trilho de módulos, submenu do módulo com grupos e níveis, conta e gaveta no celular. | Disponível |
| `PageHeader` | Cabeçalho de página: título, descrição, selos de situação e ações. | Disponível |
| `LinkList` | Lista de links em que cada item leva a uma página, em linhas ou em grade. | Disponível |

`Steps` é o indicador do processo, não o processo: o conteúdo de cada etapa e os botões de avançar e voltar pertencem ao produto. Com navegação livre, cada etapa vira botão. A fronteira com `Tabs` é a ordem: as abas são painéis equivalentes; as etapas têm sequência, e as anteriores à atual contam como concluídas.

A `Pagination` também serve de rodapé de tabela: oferece o seletor de itens por página e os passos para a primeira e a última página. Ao trocar o tamanho, a página passa à que contém o primeiro item da atual, para não perder o lugar de quem lia.

`Tabs` e `TabsNav` têm o mesmo desenho, e a fronteira é o endereço. As `Tabs` trocam o painel na mesma página, com as setas entre as abas, como pede o padrão de abas do WAI-ARIA. No `TabsNav` cada aba é um link para uma página própria: recarregar ou abrir em outra guia leva à mesma aba, e voltar no navegador volta à anterior. Por isso ele é navegação, com `aria-current="page"` na aba atual e o Tab passando por todas, e não `role="tab"`, que prometeria as setas e um painel. O link é o da aplicação, recebido conforme a seção "Link da aplicação", abaixo.

O `PageHeader` é o cabeçalho da página, não de um cartão: o título é o `h1`, e a linha que o separa do conteúdo vai de borda a borda do elemento que o contém. Voltar é um link da aplicação, recebido conforme a seção "Link da aplicação", abaixo, posto acima do título, com a seta e o texto visível; o `label` é o nome acessível e deve conter esse texto; a trilha do caminho continua sendo o `Breadcrumb`, e o cabeçalho de um cartão, o `Card.Header`. A ação principal fica à direita, com até duas secundárias antes dela, e o excedente num `Menu`; o sistema não impõe o limite. Fixar ou compactar ao rolar é do produto.

O `AppShell` é a moldura da aplicação e ocupa a janela inteira; só as áreas internas rolam. Ele ocupa a altura do elemento que o contém: para tomar a janela, `html`, `body` e o elemento raiz da aplicação precisam de `height: 100%`, e o `body`, de margem zero, que o `reset.css` já zera. Ele tem três camadas: a base é o fundo da aplicação, o trilho de módulos e a página são folhas no mesmo nível, e o submenu do módulo fica na base, entre as duas. A navegação é a `Sidebar`, e a página é o `AppShell.Page`, com a barra (`PageBar`), o corpo (`PageBody`), a única área da página que rola, e, quando a tela pede, o rodapé fixo (`PageFooter`). O rodapé fica sempre à vista, fora da área que rola: a situação à esquerda (`status`), como a do rascunho salvo sozinho, anunciada ao leitor de tela, e as ações à direita. A fronteira com a `SaveBar` é o momento: a `SaveBar` aparece quando há alteração por salvar, e o rodapé fica sempre lá. O estado da navegação fica no `SidebarProvider`, que o `AppShell` monta por dentro, ou usa o de fora quando já existe um. A barra da página já traz o botão de abrir o submenu e a gaveta, e o produto não acrescenta outro: o `Sidebar.Trigger` avulso é só de quem monta a própria moldura.

A `Sidebar` reúne todas as formas de navegação da aplicação. O trilho traz os módulos, só com ícone e dica, e um grupo fixo no pé para os itens de sistema e a conta. O submenu é a lista do módulo: itens com ícone, complemento ao fim da linha, como uma contagem, e links que saem da aplicação, em grupos com título. Abrir o submenu empurra a página, sem sobrepô-la, e recolher devolve a largura; a largura do submenu é do produto, pelo `width` do `Sidebar.Panel`, e todos os painéis devem usar o mesmo valor para a página não mudar de largura ao trocar de módulo; o módulo atual no trilho também alterna o submenu, e um módulo sem lista deixa o submenu só como lugar da conta. O terceiro nível tem duas formas: expandir os filhos no lugar, que é o padrão, ou trocar o painel pelo nível de baixo, com o caminho de volta. A conta do usuário abre dentro do submenu, de baixo para cima, também em duas formas: na altura das opções, que é o padrão, ou cobrindo a lista do módulo; com o submenu recolhido, o avatar no trilho a abre. A marca do produto fica no alto do trilho e do submenu, com o `Sidebar.Brand`: no trilho, só o símbolo, num quadrado na cor principal ou puro; no submenu, o nome e a descrição, ou o logotipo de cada tema, claro e escuro; com `href`, leva ao início da aplicação. Em largura estreita, o trilho e o submenu passam a uma gaveta com a interação do `Drawer`. A `Sidebar` funciona dentro do `AppShell` ou de um `SidebarProvider`: quem monta a própria moldura usa o provider, o `useSidebar()` para ler e mudar o estado e o `Sidebar.Trigger` como botão de abrir. Os módulos, os links e o conteúdo da conta são do produto; o link é o da aplicação, recebido conforme a seção "Link da aplicação", abaixo.

A `LinkList` é a lista de destinos de uma tela, como as pendências que levam aonde cada uma se resolve ou os atalhos de um índice de configurações. Cada item é um link inteiro, recebido conforme a seção "Link da aplicação", abaixo, com título, descrição opcional, ícone e um complemento ao fim, como uma contagem. Em `layout="list"`, o padrão, os itens são linhas separadas por uma divisória, com a seta ao fim; em `layout="grid"`, são células numa grade que se ajusta à largura, sem seta. `tone="danger"` marca o item que pede atenção. Escolher itens é papel da `List`, e uma ação que não navega continua sendo botão.

### Link da aplicação

Os componentes de navegação não conhecem o roteador: a aplicação entrega o componente de link, e o sistema cuida da aparência e da acessibilidade.

- Nas coleções, `Breadcrumb` e `TabsNav`, o `as` fica na raiz e vale para todos os itens. Cada item leva o próprio `href` ou `linkProps`.
- Nos elementos avulsos, o `as` fica no próprio elemento: `PageHeader.Back`, `AppShell.RailItem` e `AppShell.PanelItem`.
- Sem `as`, o link é um `<a>`.

O componente em `as` recebe o `href`, as props de `linkProps` espalhadas e as demais props do elemento, como `className`, `aria-current`, `aria-label` e os filhos. O `linkProps` serve ao roteador que não usa `href`: o do React Router pede `to`.

```tsx
import { Link } from 'react-router-dom';

<Breadcrumb
  as={Link}
  items={[
    { label: 'Pedidos', linkProps: { to: '/pedidos' } },
    { label: 'Pedido 1042' },
  ]}
/>

<PageHeader.Back as={Link} label="Voltar para Pedidos" linkProps={{ to: '/pedidos' }} />
```

## 9. Sobreposições

| Componente | Papel | Situação |
| --- | --- | --- |
| `Dialog` | Interação modal que interrompe o fluxo. | Disponível |
| `Drawer` | Painel modal preso à lateral da tela. | Disponível |
| `SidePanel` | Painel não modal ao lado do conteúdo, de qualquer lado, que empurra a página. | Disponível |
| `Popover` | Conteúdo ancorado a um gatilho, sem bloquear a página. | Disponível |
| `Tooltip` | Descrição curta de um elemento, exibida no ponteiro ou no foco. | Disponível |
| `Menu` | Lista de ações disparada por um gatilho. | Disponível |

`Drawer` e `Dialog` são a mesma interação modal — foco preso, fundo inerte, Escape fecha — e dividem a mecânica. Ao abrir, o foco vai ao primeiro elemento focável, que, com `title`, é o botão Fechar do cabeçalho; para começar num campo, dê `autoFocus` a ele. Ao fechar, o foco volta a quem abriu. A fronteira é a tarefa: o `Dialog` interrompe para uma decisão ou um formulário curto; o `Drawer` abre ao lado da página para editar ou detalhar um item sem sair da página, e comporta conteúdo longo. Um painel que fica ao lado do conteúdo sem bloquear a página não é `Drawer`: é o `SidePanel`. Ele abre de qualquer lado e empurra o conteúdo, que continua usável, sem foco preso nem fundo inerte. Em largura estreita, onde não há espaço para empurrar, passa a se comportar como o `Drawer`.

O `Dialog` sem `title` não tem cabeçalho, e o nome vem do `aria-label`, que passa a ser obrigatório. Serve ao diálogo em que o próprio conteúdo é a tarefa, como a paleta de busca do `Ctrl+K`; a saída é o Esc ou o clique fora.

O `Dialog` tem os tamanhos `sm`, `md`, `lg` e `xl`, de até 1040px, para formulários e conteúdos largos. `onBeforeClose` deixa o produto impedir o fechamento, como quando há alterações não salvas: devolve `boolean` ou `Promise<boolean>`, e `false` mantém aberto. É consultado por Esc, pelo clique no véu e pelo botão Fechar, uma consulta por vez, e não quando o produto muda `open`, que é decisão dele. Não recebe o motivo do fechamento, porque a confirmação não difere pela via; se um produto precisar, a assinatura ganha um argumento sem quebrar. O `Drawer` recebe o mesmo `onBeforeClose`, pois divide a mecânica com o `Dialog` e é onde mais se edita um item com alterações a perder.

O `Drawer` sem `title` segue o `Dialog`: sem cabeçalho, nomeado pelo `aria-label` obrigatório. Com `flush`, o corpo perde o respiro interno, para o conteúdo que desenha a própria margem; a rolagem do meio continua.

O `Tooltip` abre no ponteiro e no foco por teclado; o foco que vem do clique ou de `focus()` programático não o abre. Aberta, a dica acompanha a âncora que se move numa transição ou animação.

O `Menu` admite submenu: o item com itens próprios abre outra lista ao lado, pela seta para a direita, pelo Enter ou ao passar o ponteiro, e a seta para a esquerda volta ao item pai. Escolher em qualquer nível fecha o menu inteiro. O submenu serve para agrupar escolhas de um mesmo assunto, como densidade ou formato de exportação.

`placement` define o lado e o alinhamento do painel em relação ao gatilho, com os mesmos nomes do `Popover`: `bottom start`, `bottom`, `bottom end`, `top`, `top start`, `top end`, `left` e `right`. O padrão é `bottom start`, e o submenu abre sempre à direita do item pai.

O `Popover` é um diálogo não modal: ao abrir, o foco entra nele, e volta ao gatilho ao fechar. Ele não serve de painel para um campo em que a pessoa continua digitando, porque o foco precisa ficar no campo. Esse caso tem dois caminhos. Quando o painel é uma lista de resultados ou sugestões, é o `ComboBox`, com a opção composta e os grupos: o foco fica no campo, e as setas percorrem as opções por `aria-activedescendant`. Quando não é uma lista, como uma prévia ou uma dica sobre o que se digita, o painel fica no fluxo da página, logo abaixo do campo, e não sobreposto: o campo o aponta por `aria-controls`, e a mudança que precisa ser ouvida sai numa região viva, com `role="status"`.

Os overlays em portal vão ao `document.body`, e por isso herdam o tema e a paleta do documento, e não os da subárvore do gatilho. Para herdá-los, o produto indica o elemento de destino. O `PortalProvider` recebe o elemento em `container` e vale para todos os overlays abaixo dele: `Dialog`, `Drawer`, `Popover`, `Tooltip`, `Menu` e seus submenus, `Toolbar` ancorada, `ChartTooltip`, os painéis de `Select`, `ComboBox`, `DatePicker`, `DateTimePicker` e `TimePicker`, e o canto do `ToastRegion` quando o destino foi escolhido. Cada um aceita também `portalContainer`, que vale sobre o provider. O elemento chega por `ref` em estado (`useState` e `ref={setContainer}`), porque o provider precisa dele depois da montagem; com `null`, o destino é o `document.body`. Um destino com `transform` ou `contain` cria o bloco de contenção dos elementos de posição fixa, e a posição do overlay passa a contar a partir dele.

## 10. Ícones

| Componente | Papel | Situação |
| --- | --- | --- |
| Biblioteca oficial de ícones | Conjunto de ícones exposto pelo Design System, conforme `ARCHITECTURE.md` seção 12. | Disponível |

A biblioteca tem duas entradas. O ponto de entrada principal traz os ícones de interface, que os componentes usam e as ações gerais pedem — editar, excluir, filtrar, desfazer, abrir fora, os dispositivos —, nomeados pelo significado: `IconFilter`, e não funil. O subcaminho `@plenustech/design-system/icons` traz a suíte completa do Bootstrap Icons, por decisão do mantenedor de 18/10/2026: os 2.050 desenhos, pelo nome de cada um no Bootstrap (`IconFolder`, `IconTruck`, `IconCashStack`), para os produtos também categorizarem conteúdo — assuntos, tipos de documento, seções — sem desenhar ícone próprio. Cada ícone da suíte tem ainda o próprio módulo, em `@plenustech/design-system/icons/IconFolder`, para quem importa só um desenho e não conta com o tree-shaking do empacotador. Oito nomes existem nas duas entradas com desenhos diferentes, e o `README.md` traz a lista. Os dois conjuntos seguem a nomenclatura de família, tipo seguido de especialização. A base `Icon` continua interna, para a aplicação usar a biblioteca oficial em vez de desenhar o próprio caminho.

Um ícone sem `label` é decorativo e sai da árvore de acessibilidade, que é o caso sempre que houver texto ao lado dizendo a mesma coisa. Com `label`, ele ganha nome acessível e passa a ser anunciado.

## 11. Tipografia

| Componente | Papel | Situação |
| --- | --- | --- |
| `Text` | Texto com papel tipográfico e tom, em uma linha ou truncado. | Disponível |

O `Text` aplica um papel tipográfico dos tokens (`body`, `label`, `caption`, `micro`, `title` ou `code`) e um tom (`default`, `secondary`, `tertiary` ou `danger`) a um trecho de texto, para o produto não repetir tamanho, entrelinha e cor em cada tela. Por padrão renderiza um `span`; `as` troca o elemento, como `p` ou `div`, quando o texto precisa de bloco. `truncate` mantém o texto numa linha e corta o excesso com reticências, e `numeric` usa algarismos tabulares. O `Text` não é título de página nem de seção: o nível de cabeçalho é de quem escreve a estrutura, como no `PageHeader` e no `Card.Header`.

## 12. Acessibilidade

| Componente | Papel | Situação |
| --- | --- | --- |
| `VisuallyHidden` | Texto que só o leitor de tela lê, para dar nome ao que a tela mostra só por ícone, cor ou posição, como uma coluna de ações sem título. | Disponível |
| `SkipLink` | Atalho para o conteúdo principal, para quem navega por teclado. | Disponível |

Os componentes de acessibilidade existem para quem não usa a tela como ela é vista: quem ouve o leitor de tela ou navega só pelo teclado. O `VisuallyHidden` tira o conteúdo da vista e o mantém na árvore de acessibilidade, para o leitor de tela ler o que a interface mostra só por ícone ou posição, como o rótulo de uma coluna de ações. Não serve para esconder o que ninguém deve ler: para isso, o conteúdo sai da página. O `SkipLink` é o primeiro destino do Tab, que leva direto ao conteúdo principal, sem passar pela navegação.

## 13. Leiaute

| Componente | Papel | Situação |
| --- | --- | --- |
| `Stack` | Pilha flex que espaça os filhos num eixo. | Disponível |
| `Grid` | Grade de colunas iguais que se ajusta à própria largura. | Disponível |
| `Container` | Coluna de conteúdo centrada, com largura máxima. | Disponível |

Os componentes de leiaute arranjam o que o produto já tem, sem conteúdo nem aparência próprios, com os espaçamentos do `--pl-space-N`. A `Stack` espaça os filhos num eixo, na vertical por padrão e na horizontal com `direction="horizontal"`, com `gap`, `align`, `justify` e `wrap`. A `Grid` reparte a largura em colunas iguais e mede a si mesma, e não a janela: entram quantas colunas couberem, cada uma com ao menos `minColumnWidth`, e `columns` limita o máximo. O `Grid.Item` com `span` ocupa várias colunas, e numa grade com menos colunas que o `span` passa a ocupar a linha inteira. Quando o número de colunas não é múltiplo do `span`, como itens de duas colunas numa grade que caiu para três, sobra espaço vazio na linha, como em toda grade CSS: para conteúdos de larguras diferentes, use uma `Grid` para cada grupo, como os indicadores numa e os gráficos noutra. O `Container` centra a coluna de conteúdo com um `maxWidth` e o respiro lateral dos tokens; com o mesmo valor no `PageHeader`, os dois alinham na mesma borda. O respiro vertical é de quem usa o `Container`.

As predefinições da seção seguinte arranjam a página; estes componentes arranjam um trecho dela. A fronteira com as predefinições é o conteúdo: as predefinições conhecem partes com papel próprio, como o trilho e a coluna lateral, e o leiaute só distribui.

## 14. Predefinições

| Componente | Papel | Situação |
| --- | --- | --- |
| `AnnotatedSection` | Seção com título e explicação num trilho à esquerda e o conteúdo à direita. | Disponível |
| `Columns` | Conteúdo principal com uma coluna lateral ou com o índice da página. | Disponível |

As predefinições são arranjos de página prontos, montados com os demais componentes, para o produto partir deles em vez de refazer o leiaute em cada tela. Elas arranjam o conteúdo sem impô-lo: o que vai em cada parte é do produto. Cada uma mede a própria largura, e não a da janela, e abaixo de 900px, o `--pl-bp-sm`, passa a uma coluna.

A `AnnotatedSection` serve às telas de configuração e aos formulários por assunto. O título nomeia a seção, que é uma região da página, e sai em `h2`, com `headingLevel` para outro nível; a explicação e uma ação opcional ficam abaixo dele. Seções vizinhas se separam por uma linha. Em uma coluna, o trilho fica acima do conteúdo.

O `Columns` arranja o conteúdo da página em duas colunas e não é a navegação da aplicação, que é a `Sidebar`. Ao lado do `Columns.Main` vai uma de duas partes. O `Columns.Aside` é a coluna de complemento, como um resumo ou os dados de apoio, em um terço da largura; em uma coluna, desce para baixo do conteúdo. O `Columns.Index` é o índice "Nesta página": um link para cada seção, pelo `id` dela, fixo enquanto a página rola e com a seção à vista marcada. Escolher um link rola até a seção, sem animação quando o sistema pede menos movimento, leva o foco para ela e não altera o endereço. Em uma coluna, o índice some.

As montagens que se repetem sem pedir componente próprio, como o painel de filtros, o menu de ações do cabeçalho e o controle do usuário, são patterns e ficam na seção Patterns do Showcase (`COMPONENTS.md` §16). Elas respeitam os papéis e as fronteiras deste catálogo.

## 15. Fora do escopo

O Design System não cobre, conforme `ARCHITECTURE.md` seções 9.2, 11 e 15:

- Componentes que codificam conceitos de produto, como cliente, contrato, fatura, pedido ou usuário.
- Regras de negócio e transformação de dados de domínio.
- Infraestrutura de internacionalização, como catálogos, carregamento de traduções e contexto de idioma.
- Roteamento. Componentes de navegação recebem a abstração de link da aplicação.

Uma necessidade que caia em qualquer um desses casos permanece na aplicação consumidora.
