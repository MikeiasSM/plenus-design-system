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
| `ButtonIcon` | Aciona uma operação representada só por ícone. | Disponível |
| `ButtonTile` | Ação em ladrilho, com ícone acima do nome, para paletas de inserção. | Disponível |
| `Toolbar` | Agrupa controles de uma mesma superfície, com navegação por setas. | Disponível |

O `ButtonIcon` existe para quando o texto não cabe ou repetiria o que o contexto já diz: o filtro ao lado da busca, o fechar, a ação de uma linha. O nome é obrigatório e vai em `label`, que o leitor de tela ouve e a dica mostra a quem passa o ponteiro ou chega pelo teclado. Havendo espaço para o texto, o `Button` com texto é a escolha: ícone sozinho pede que a pessoa adivinhe.

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
| `TimePicker` | Entrada de hora. | Disponível |
| `DateTimePicker` | Entrada de data e hora combinadas. | Disponível |
| `ColorPicker` | Escolha de cor entre amostras definidas pelo produto. | Disponível |
| `FileUpload` | Seleção de arquivos, por clique ou arrasto, com a lista dos envios. | Disponível |

`Field` é a moldura que os campos deste catálogo já usam por dentro, exposta para quem precisa montar um campo que o Design System não entrega — uma máscara de documento, um seletor de arquivo, um autocompletar de endereço. Ele recebe uma função e devolve o `id`, a descrição acessível já montada, o estado de inválido e a classe com o visual dos campos do sistema, no tamanho pedido; o controle continua sendo de quem o escreve, e a classe própria dele, somada à entregue, vence.

A fronteira com `Label` é de alcance: `Label` nomeia **um** controle; `Field` cuida do conjunto — rótulo, ajuda, erro e contador — e da amarração entre eles, que é a parte que mais se erra. Um campo do próprio catálogo nunca deve ser envolvido por `Field`: ele já tem o seu.

O `InputText` aceita um ícone decorativo à frente do texto, como a lupa de uma busca. O nome do campo continua no rótulo.

`SegmentedControl` e `RadioGroup` fazem a mesma escolha única, e a fronteira é a forma: o `RadioGroup` é a lista de opções de um formulário, com legenda, ajuda e erro; o `SegmentedControl` é um controle compacto, de poucas opções curtas, que muda o que a tela mostra — o período de um painel, a lista ou os cartões. Por baixo ele também é rádio nativo. Com mais de cinco opções, ou opções longas, a escolha é `Select`. A fronteira com `Tabs` é o painel: a aba troca o conteúdo que ela controla; o segmento muda um valor.

`CheckboxGroup` está para o `Checkbox` como o `RadioGroup` está para o `Radio`: a legenda, a ajuda, o erro e o valor do conjunto ficam no grupo, e cada `Checkbox` com `value` dentro dele lê o próprio estado dali. A fronteira com o `RadioGroup` é a quantidade: lá a escolha é uma só; aqui são quantas a pessoa quiser. Com lista longa ou que pede busca, a escolha é o `ComboBox` múltiplo.

O `ColorPicker` escolhe entre amostras que o produto define, cada uma com nome — a cor de uma etiqueta, o destaque de um bloco. Não é seletor livre de cor: não há espectro nem campo hexadecimal. Por baixo são rádios nativos, e o nome de cada amostra é o que o leitor de tela ouve. Uma opção "Padrão", sem cor, é opcional.

O `FileUpload` cuida da escolha dos arquivos e da lista que mostra o andamento, e não envia nada: o produto recebe os arquivos aceitos, faz o envio e informa a cada item o progresso, a conclusão ou o erro. Tipo e tamanho são conferidos na escolha, e o que for recusado volta ao produto com o motivo. Quem não arrasta escolhe pelo seletor de arquivos nativo, que é o que recebe o foco.

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

## 5. Dados

| Componente | Papel | Situação |
| --- | --- | --- |
| `Avatar` | Representação visual de uma pessoa ou entidade. | Disponível |
| `Card` | Superfície que agrupa conteúdo, com cabeçalho e rodapé próprios. | Disponível |
| `Badge` | Rótulo curto de estado ou categoria. | Disponível |
| `Tag` | Etiqueta operada: removível, como o filtro ativo, ou de alternar. | Disponível |
| `Accordion` | Seções expansíveis de conteúdo. | Disponível |
| `CodeBlock` | Trecho de código para leitura, com cópia, numeração e destaque de linhas. | Disponível |
| `Timeline` | Histórico de estados de um registro, com datas e o estado atual destacado. | Disponível |
| `SortableList` | Lista reordenável por arrasto ou teclado, com seleção de um item. | Disponível |
| `Table` | Tabela básica, em HTML semântico. | Disponível |
| `DataGrid` | Grade completa, com ordenação, paginação, seleção, virtualização e demais comportamentos de grade. | Previsto |

O critério entre os dois é quem decide quais linhas existem na página. No `Table`, o consumidor escreve a linha e todas estão presentes. No `DataGrid`, o componente decide e mantém apenas a faixa visível, o que é o que torna possível a virtualização.

Daí decorre o resto: o `Table` usa marcação tabular nativa e a tabulação percorre os controles de cada célula; o `DataGrid` é um controle interativo, com navegação bidimensional entre células.

O `Table` não desenha contorno externo. O contorno pertence a quem o envolve, normalmente um `Card`. Fora de um contêiner com borda, a tabela fica solta na página: a faixa do cabeçalho não tem linha em cima.

A fronteira entre `Badge` e `Tag` é o controle. O `Badge` só rotula um estado ou uma categoria e não responde a nada. A `Tag` é operada: removida, como o filtro ativo de uma busca, ou ligada e desligada, como o papel escolhido entre vários.

O `CodeBlock` exibe código e não o edita: um editor de documento mantém a própria superfície de edição e usa o `CodeBlock` para mostrar o bloco. O realce de sintaxe é léxico e do próprio Design System, para Java, JavaScript, TypeScript, JSX, TSX, SQL, JSON e Shell: ele colore o que ajuda a ler o trecho, sem analisar a linguagem como uma IDE. Uma linguagem fora dessa lista aparece numa cor só, com o rótulo que o produto informar.

A `Timeline` mostra por onde um registro passou — criado, enviado, aprovado — com a data de cada estado. A fronteira com `Steps` é o tempo: as etapas indicam onde se está num processo a cumprir, e a pessoa pode navegar entre elas; a linha do tempo registra o que já aconteceu e não é navegável.

A `SortableList` existe para a ordem: as seções de um documento, as colunas de um relatório. Arrastar reordena, e pelo teclado `Alt` com as setas faz o mesmo, com o anúncio da nova posição. A fronteira com a `List` é a tarefa: na `List` a pessoa escolhe itens; na `SortableList`, ela os ordena. Como cada linha pode trazer ações próprias, a marcação é de grade, com uma célula por linha, e não de `listbox`, que não admite controles dentro das opções.

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
| `ChartTimeline` | Intervalos de tempo dispostos em linhas, como a jornada de cada dia ou as tarefas de um projeto. | Previsto |
| `ChartMap` | Regiões pintadas pelo valor e marcadores por coordenada, sobre a geometria que o produto fornece. | Previsto |
| `ChartGauge` | Um valor numa escala com faixas de significado, como o atingimento de uma meta. | Previsto |
| `ChartTooltip` | Leitura das medidas sob o ponteiro, em lista. | Disponível |

`ChartCombo` desenha barras e linhas sobre o mesmo eixo de categorias, e é a escolha quando uma categoria carrega duas leituras de naturezas diferentes — o volume em barra, a taxa em linha. Com um único tipo de marca, `ChartBar` e `ChartLine` continuam sendo os componentes certos.

Cada série do `ChartCombo` declara a que eixo de valor pertence, e é essa declaração que cria o eixo direito. O gráfico nunca parte a escala por conta própria: um segundo eixo que aparece sozinho transforma o ponto de cruzamento entre as séries em artefato da escala escolhida, e não em fato do dado. Sem nenhuma série à direita, o domínio é único. Com os dois eixos, o zero fica na mesma altura nos dois, e as barras de cada eixo crescem da mesma base: cada domínio se estende só do lado que precisa, com a mesma folga nos dois.

`ChartTooltip` é a leitura no ponteiro: título, subtítulo opcional, uma linha por medida com marcador e colunas numéricas, uma coluna calculada e um totalizador com operador por coluna. Ele acompanha o cursor e sai a qualquer outra interação — ponteiro fora, rolagem ou tecla.

Os gráficos já trazem o `ChartTooltip` montado, ligado por padrão em `showTooltip`: as séries da categoria sob o ponteiro, cada uma com a sua cor e no formato do seu eixo; a fatia com a parte do total; o caminho até o nó; na cascata, a variação do passo e o acumulado. Os números do balão seguem `formatTooltipValue` e, sem ele, o `formatValue` do gráfico: o eixo pode sair compacto — `500 mil` ou `500 k`, pelo `formatarNumero` — e o balão, exato. Quem precisa de outras colunas, de um campo calculado ou de um totalizador próprio desliga o integrado e monta o seu pela costura.

A fronteira com `Tooltip` é o conteúdo, não o gráfico: `Tooltip` descreve **um** elemento em uma frase curta e nomeia esse elemento para quem usa leitor de tela; `ChartTooltip` exibe **várias** medidas em forma de grade e é decorativo, porque uma grade que some a qualquer interação não é leitura acessível.

Cada marca carrega a própria descrição em `aria-label`. Com o balão desligado e sem costura, a mesma descrição vai também no `<title>` da marca, que o navegador mostra quando o ponteiro repousa sobre ela; com balão, integrado ou montado pela costura, o `<title>` fica de fora, porque seria um segundo balão sobre o `ChartTooltip`. `ChartScatter`, `ChartRadial` e `ChartSankey` têm balão integrado, mas não costura: o ponto com as medidas nomeadas, o anel com valor, meta e quanto foi atingido, e a ligação com o fluxo e a parte dele na saída da origem.

Pontos e rótulos de valor seguem a mesma visibilidade dos eixos, em `showDots` e `showDataLabels`: `visible`, `hidden` ou `onHover`. Em `onHover` aparecem só os da série sob o ponteiro — a da barra em que ele está, ou, na linha e na área, a série mais próxima dele —, para o desenho ficar limpo até alguém olhar uma série.

A costura avisa o que está sob o ponteiro, na forma de cada família: a categoria nos cartesianos, a fatia no anel e o caminho até o nó nos hierárquicos — do grupo ao nó, cada nível com o valor somado. Em `ChartLine` e `ChartArea` não há barra para apontar: a área de desenho se divide em faixas invisíveis, cada uma do ponto até o meio do caminho para o vizinho, e vale o ponto mais próximo do ponteiro. O desenho é `role="img"` nomeado pelo título, e a tecnologia assistiva o apresenta como uma imagem só — a leitura medida a medida chega pela visão em tabela, quando houver consumidor pedindo.

Apesar do nome, ele não conhece gráfico algum: recebe linhas e colunas, e quem as monta é o gráfico ou quem o usa. Isso o torna utilizável fora dos gráficos, num cartão de indicador ou numa célula de tabela.

A cor de uma série se resolve em três níveis: a cor informada pelo consumidor vence; depois a intenção semântica — `positive`, `negative`, `warning` e `neutral` —, que usa os tokens de status e ignora a paleta; por fim a paleta categórica, que abre com a cor de tema quando houver.

Séries com intenção não entram na rotação categórica. Pintar uma despesa com a cor de tema escolhida pelo usuário trocaria o significado da barra a cada usuário.

O texto escrito sobre a cor da série — a porcentagem na fatia do `ChartPie`, o rótulo e o valor no retângulo do `ChartTreemap` — usa o token de texto daquela cor, `chart.on-*`, medido nos dois temas. A cor informada em hexadecimal é medida pelo componente; em outro formato, o texto fica branco.

Séries, fatias, anéis e grupos são desligados pela legenda, que é um controle. O componente guarda quais estão ocultos quando o produto não informa, e avisa a mudança sempre.

`ChartPie` e `ChartDonut` são a mesma composição com papéis distintos: o anel existe para abrigar um valor no centro, e é isso que o separa da pizza cheia. `ChartSunburst` estende o anel para a hierarquia, com os filhos repartindo o ângulo do pai e herdando a cor dele.

`ChartTimeline` e `Timeline` têm nomes próximos e papéis distintos. A `Timeline` é a lista dos estados por que um registro passou, sem escala de tempo e sem navegação. O `ChartTimeline` é um gráfico: barras de intervalo sobre um eixo de tempo contínuo, uma linha por categoria, com faixas de referência ao fundo, marcas pontuais e um resumo por linha.

O `ChartMap` não embute fronteiras. O produto fornece a geometria em GeoJSON e os dados casados pelo identificador de cada região, e o mesmo componente desenha país, regiões, unidades federativas ou municípios. Descer de um nível a outro é composição do produto, que troca a geometria. Mapa de ruas, camadas sobre ele e mapa de calor por densidade são de biblioteca de mapas e ficam fora.

`ChartGauge` e `ChartRadial` são arcos com papéis distintos. O `ChartRadial` mostra o progresso de uma ou mais medidas contra a meta, em anéis concêntricos. O `ChartGauge` mostra onde um único valor cai numa escala com faixas nomeadas — crítico, atenção, bom — e é um medidor: o leitor de tela o ouve como `meter`, com o valor, a faixa e a meta. A meta pode ser monetária, e a exibição em moeda ou em percentual da meta é escolha de quem usa. Vários medidores lado a lado, como a meta de cada vendedor, são composição do produto.

O Design System entrega os gráficos. A tradução entre o manifesto de um dashboard e as propriedades de cada gráfico pertence à aplicação, conforme `ARCHITECTURE.md` §15.

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

A fronteira entre `Toast` e `Alert` é o lugar e a duração. O `Alert` fica junto do conteúdo de que fala, até a situação mudar. O `Toast` aparece no canto da tela, fala de algo que acabou de acontecer — salvo, publicado, falhou — e sai sozinho, exceto o erro, que espera ser fechado. É exibido pelo `ToastRegion`, montado uma vez na raiz da aplicação, e disparado por `showToast` de qualquer lugar.

## 8. Navegação

| Componente | Papel | Situação |
| --- | --- | --- |
| `Breadcrumb` | Caminho percorrido até a posição atual. | Disponível |
| `Pagination` | Navegação entre páginas de um conjunto. | Disponível |
| `Tabs` | Alternância entre painéis de conteúdo. | Disponível |
| `TabsNav` | Faixa de abas em que cada aba é um endereço. | Disponível |
| `Steps` | Etapas de um processo, com a atual destacada e as anteriores concluídas. | Disponível |
| `SkipLink` | Atalho para o conteúdo principal, para quem navega por teclado. | Disponível |

`Steps` é o indicador do processo, não o processo: o conteúdo de cada etapa e os botões de avançar e voltar pertencem ao produto. Com navegação livre, cada etapa vira botão. A fronteira com `Tabs` é a ordem: as abas são painéis equivalentes; as etapas têm sequência, e as anteriores à atual contam como concluídas.

`Tabs` e `TabsNav` têm o mesmo desenho, e a fronteira é o endereço. As `Tabs` trocam o painel na mesma página, com as setas entre as abas, como pede o padrão de abas do WAI-ARIA. No `TabsNav` cada aba é um link para uma página própria: recarregar ou abrir em outra guia leva à mesma aba, e voltar no navegador volta à anterior. Por isso ele é navegação, com `aria-current="page"` na aba atual e o Tab passando por todas, e não `role="tab"`, que prometeria as setas e um painel. O link é o da aplicação, recebido como no `Breadcrumb`.

## 9. Sobreposições

| Componente | Papel | Situação |
| --- | --- | --- |
| `Dialog` | Interação modal que interrompe o fluxo. | Disponível |
| `Drawer` | Painel modal preso à lateral da tela. | Disponível |
| `Popover` | Conteúdo ancorado a um gatilho, sem bloquear a página. | Disponível |
| `Tooltip` | Descrição curta de um elemento, exibida no ponteiro ou no foco. | Disponível |
| `Menu` | Lista de ações disparada por um gatilho. | Disponível |

`Drawer` e `Dialog` são a mesma interação modal — foco preso, fundo inerte, Escape fecha — e dividem a mecânica. A fronteira é a tarefa: o `Dialog` interrompe para uma decisão ou um formulário curto; o `Drawer` abre ao lado da página para editar ou detalhar um item sem sair da página, e comporta conteúdo longo. Um painel que fica ao lado do conteúdo sem bloquear a página não é `Drawer`: é composição de layout da aplicação.

O `Dialog` sem `title` não tem cabeçalho, e o nome vem do `aria-label`, que passa a ser obrigatório. Serve ao diálogo em que o próprio conteúdo é a tarefa, como a paleta de busca do `Ctrl+K`; a saída é o Esc ou o clique fora.

O `Popover` é um diálogo não modal: ao abrir, o foco entra nele, e volta ao gatilho ao fechar. Ele não serve de painel para um campo em que a pessoa continua digitando, porque o foco precisa ficar no campo. Esse caso tem dois caminhos. Quando o painel é uma lista de resultados ou sugestões, é o `ComboBox`, com a opção composta e os grupos: o foco fica no campo, e as setas percorrem as opções por `aria-activedescendant`. Quando não é uma lista, como uma prévia ou uma dica sobre o que se digita, o painel fica no fluxo da página, logo abaixo do campo, e não sobreposto: o campo o aponta por `aria-controls`, e a mudança que precisa ser ouvida sai numa região viva, com `role="status"`.

## 10. Ícones

| Componente | Papel | Situação |
| --- | --- | --- |
| Biblioteca oficial de ícones | Conjunto de ícones exposto pelo Design System, conforme `ARCHITECTURE.md` seção 12. | Disponível |

Os ícones seguem a nomenclatura de família: tipo seguido de especialização — `IconChevronDown`, `IconCalendar`, `IconClose`. O conjunto cobre o que os componentes do Design System usam e as ações gerais de interface que os produtos pedem — editar, excluir, filtrar, desfazer, abrir fora, os dispositivos —, e cresce quando aparece um símbolo que ainda não existe. O nome diz o significado, e não o desenho: `IconFilter`, e não funil. A base `Icon` continua interna, para a aplicação usar o conjunto oficial em vez de desenhar o próprio caminho.

Um ícone sem `label` é decorativo e sai da árvore de acessibilidade, que é o caso sempre que houver texto ao lado dizendo a mesma coisa. Com `label`, ele ganha nome acessível e passa a ser anunciado.

## 11. Fora do escopo

O Design System não cobre, conforme `ARCHITECTURE.md` seções 9.2, 11 e 15:

- Componentes que codificam conceitos de produto, como cliente, contrato, fatura, pedido ou usuário.
- Regras de negócio e transformação de dados de domínio.
- Infraestrutura de internacionalização, como catálogos, carregamento de traduções e contexto de idioma.
- Roteamento. Componentes de navegação recebem a abstração de link da aplicação.

Uma necessidade que caia em qualquer um desses casos permanece na aplicação consumidora.
