# Changelog

Mudanças de cada versão publicada de `@plenustech/design-system`, da mais recente para a mais antiga.

A política de versão está em `CONTRIBUTING.md` §11. Cada versão tem uma seção `## [X.Y.Z] — AAAA-MM-DD`, com os grupos que se aplicarem, nesta ordem: **Incompatível**, **Adicionado**, **Alterado**, **Corrigido** e **Removido**. Mudanças ainda não publicadas ficam em `## [Não publicado]`.

## [Não publicado]

### Incompatível

- `AppShell`: a moldura passa a ocupar a janela (`100dvh`) por padrão, em vez de a altura do elemento que a contém. Quem embute a moldura numa caixa de altura fixa, como um cartão ou uma demonstração, ou põe algo acima dela, passa a vê-la transbordar a caixa: redefina `--pl-shell-height`, por exemplo para `100%`, na caixa ou num ancestral. Quem dava altura a `html`, `body` e `#root` não precisa mudar nada.
- `Sidebar.Panel`: a largura padrão do submenu passa de 232 para 256 px: a página perde 24 px de largura onde o submenu está aberto, e a gaveta do celular fica 24 px mais larga. A medida agora é do produto, pelo `width`. Para manter a medida antiga, passe `width={232}`.
- `PageHeader.Back`: o voltar passa a ser um link acima do título, alinhado à borda do conteúdo, com a seta e o texto visível, e a 12 px do título. O cabeçalho com voltar fica mais alto, e o título passa a começar na borda, alinhado à descrição e ao contexto. O texto vem de `children`; sem ele, aparece o `label` inteiro, que segue como nome acessível e deve conter o texto visível. Para um texto curto, passe-o em `children` e mantenha o `label`: `<PageHeader.Back href="/pedidos" label="Voltar para Pedidos">Pedidos</PageHeader.Back>`.
- `PageHeader`: com ou sem voltar, o título, os selos e as ações se alinham pela primeira linha do título. Quando o título ocupa mais de uma linha, ele deixa de ficar centralizado na altura das ações, e os selos e a primeira fileira de ações ficam na altura da primeira linha dele. Sem busca, as ações que quebram em duas fileiras descem ao lado da descrição e do contexto, sem abrir espaço entre o título e a descrição; com busca, continuam na linha do título. Por isso a altura do cabeçalho muda: com ações numa fileira, fica 4 px mais baixo quando há descrição ou contexto e 2 px sem eles, e com ações em duas fileiras, mais baixo pelo espaço que deixa de existir entre o título e a descrição. Abaixo de 640 px de largura do cabeçalho, nada muda. Confira as telas e os testes visuais que dependem da altura do cabeçalho.
- `Card.Header`: o `trailing` fica centrado na primeira linha do título. Antes, alinhado pelo topo, um botão de 32 px ficava 4 px abaixo dela. A altura do cabeçalho não muda. Mais alto que o maior controle, de 56 px, o `trailing` para de subir e não sai do cabeçalho. Vale para `size="md"` com `trailingWhenNarrow="keep"`, o padrão.

### Adicionado

- `Sidebar.Panel`: a propriedade `width` define a largura do submenu aberto, em pixels (`width={280}`) ou em medida CSS (`width="18rem"`), com 256 px por padrão. Na gaveta do celular, a largura vale e fica limitada à largura da tela. O trilho segue com 56 px.
- `AnnotatedSection`: seção com título e explicação num trilho à esquerda e o conteúdo à direita, para telas de configuração e formulários por assunto. O título nomeia a seção e sai em `h2` (`headingLevel` para outro nível); `description` e `action` ficam abaixo dele. Seções vizinhas se separam por uma linha.
- `Columns`: conteúdo principal com uma coluna ao lado. O `Columns.Aside` é a coluna de complemento, em um terço da largura. O `Columns.Index` é o índice "Nesta página": marca a seção à vista enquanto a página rola, e escolher um link rola até a seção e leva o foco para ela, sem alterar o endereço.
- As duas medem a própria largura: abaixo de 900px passam a uma coluna, o `Columns.Aside` desce para baixo do conteúdo e o `Columns.Index` some.
- `Sidebar`: a navegação da aplicação, que sai do `AppShell` com todas as formas que ele já tinha. São o trilho de módulos (`Sidebar.Rail`, `Sidebar.RailItem` e `Sidebar.RailAccount`), o submenu (`Sidebar.Panel`) com grupos (`Sidebar.Group`) e itens com ícone, contagem, link externo e terceiro nível no lugar ou em pilha (`Sidebar.Item`), a conta (`Sidebar.Account`), o recolher e a gaveta no celular. Funciona dentro do `AppShell` ou de um `SidebarProvider`, que guarda o estado; `useSidebar()` lê e muda esse estado, e `Sidebar.Trigger` é o botão de abrir, para quem monta a própria moldura.
- `Sidebar.Brand`: a marca do produto no alto do trilho e do submenu, posta no `brand` de `Sidebar.Rail` e de `Sidebar.Panel`. No trilho, mostra só o símbolo (`logo`), num quadrado na cor principal ou puro (`logoFrame={false}`), nomeado por `name`; no submenu, o nome e a `description`, em uma linha cada. Com `wordmark`, o submenu mostra o logotipo no lugar do texto, com uma versão para cada tema (`light` e `dark`), e o nome segue para o leitor de tela. Com `href` (ou `as` e `linkProps`), a marca é um link para o início da aplicação nos dois lugares.
- `LinkList`: lista de links em que cada item leva a uma página, com ícone, título, descrição e complemento ao fim, em linhas (`layout="list"`, com a seta) ou em grade (`layout="grid"`). `tone="danger"` marca o item que pede atenção.
- `ActivityFeed`: registro do que aconteceu, do mais recente ao mais antigo. Cada `ActivityFeed.Item` traz o acontecimento, o momento (`time`, com `dateTime` legível por máquina) e, quando houver, um comentário citado (`comment`). Diferente da `Timeline`, não tem estado atual.
- `NumberedList`: sequência numerada de passos, com título e descrição, em lista (`layout="list"`) ou em ladrilhos (`layout="grid"`). Diferente de `Steps`, não tem etapa atual nem navegação.
- `Stack`: pilha flex que espaça os filhos num eixo, na vertical por padrão ou na horizontal (`direction`), com `gap` de 1 a 7 nos espaçamentos dos tokens, `align`, `justify` e `wrap`. `as` troca o elemento da raiz.
- `Grid`: grade de colunas iguais que se ajusta à própria largura, e não à da janela: entram quantas colunas couberem, cada uma com ao menos `minColumnWidth` (240px por padrão), e `columns` limita o máximo. O `Grid.Item` com `span` ocupa várias colunas e, quando a grade tem menos que isso, ocupa a linha inteira. Quando o número de colunas não é múltiplo do `span`, sobra espaço vazio na linha; para larguras diferentes, uma `Grid` para cada grupo.
- `Container`: coluna de conteúdo centrada, com largura máxima (`maxWidth`) e o respiro lateral dos tokens. Com o mesmo `maxWidth` do `PageHeader`, os dois alinham na mesma borda; o respiro vertical fica com quem o usa.
- `Text`: texto com papel tipográfico (`variant`: corpo, rótulo, legenda, microtexto, título e código) e tom (`tone`: padrão, secundário, terciário e perigo). `truncate` corta o excesso com reticências, `numeric` usa algarismos tabulares e `as` troca o elemento, que por padrão é `span`.
- `Table.Toolbar`: barra acima da tabela, com a busca e as ações dela. Vem como irmã antes da `Table` ou como filha dela; como filha, a `Table` a desenha antes do `<table>`, no mesmo contêiner, e o HTML segue válido. Nos dois casos, ela fica parada quando a tabela rola de lado. É um grupo rotulado (`label`), e não `role="toolbar"`, que pediria navegação por setas e impediria o campo de busca. O primeiro filho cresce até 360px, os demais ficam ao lado, os itens se alinham pela base, tudo quebra de linha, e o respiro lateral alinha com a primeira coluna da tabela.
- `SaveStatus`: texto curto da situação do salvamento, na família de formulários. O `status` (`idle`, `dirty`, `saving`, `saved` ou `error`) escolhe o indicador: o `Spinner` em `saving`, o sinal de pronto em `saved` e o de erro em `error`, e o produto escreve o texto. Fica numa região `role="status"` sempre montada, para a mudança ser lida; na situação do `AppShell.PageFooter`, que já é essa região, não cria outra.
- `Card.Footer`: a propriedade `start` leva conteúdo à esquerda do rodapé, como uma ação secundária ou a `SaveStatus`, e os filhos ficam juntos à direita, e podem faltar. Sem ela, nada muda.
- `VisuallyHidden`: componente de acessibilidade. Texto que só o leitor de tela lê, para dar nome ao que a tela mostra só por ícone, cor ou posição, como uma coluna de ações sem título. Sai da vista e continua na árvore de acessibilidade.
- `DescriptionList`: pares de termo e descrição, em `layout="stacked"` (o termo em cima) ou `layout="inline"` (o termo à esquerda e a descrição à direita, com algarismos tabulares). `emphasis` no `DescriptionList.Item` destaca a linha de total, com separador acima e peso de rótulo.
- `AvatarItem`: avatar ao lado de um título e de uma descrição opcional, numa linha que não estoura a largura: o texto longo vira reticências e a linha mantém a altura do avatar.
- `CardMetric`: vários indicadores num cartão, um `CardMetric.Body` por indicador, com o `label` do `Value` nomeando cada um. Os corpos seguidos se separam por uma linha e se empilham a partir do topo; o cartão de um indicador só não muda.
- `AppShell.PageFooter`: rodapé fixo da página, sempre à vista, fora da área que rola, com a situação à esquerda (`status`, anunciada ao leitor de tela, como a do rascunho salvo sozinho) e as ações à direita. A `SaveBar` continua sendo o aviso de alteração por salvar.
- `SaveBar`: a propriedade `placement` (`'top'` ou `'bottom'`, padrão `'top'`) escolhe se a barra se prende ao topo ou ao pé da área de rolagem. No pé, a borda passa para cima e a barra deve ser montada depois do conteúdo.
- Showcase: família Predefinições, com a página de cada componente, e páginas da `Sidebar`, com todas as formas de navegação, da `LinkList`, do `ActivityFeed` e da `SaveStatus`; a do `AppShell` passa a mostrar a moldura e o rodapé. As composições passam a usar `AnnotatedSection`, `Columns`, `Sidebar`, `LinkList`, `ActivityFeed` e o rodapé fixo, que leva o rascunho do Novo cliente; o Novo pedido continua com a `SaveBar`. A Tela inicial reúne três indicadores num `CardMetric`, e o vazio de Contas explica os passos com a `NumberedList`, no mesmo cartão. As composições passam a usar também `Stack`, `Grid`, `Container`, `Text`, `VisuallyHidden`, `DescriptionList` e `AvatarItem`, no lugar do leiaute e do texto que montavam à mão, e ainda `Table.Toolbar`, `SaveStatus` e o `start` do `Card.Footer`, no lugar da barra de busca, do texto de salvamento e do espaçador de rodapé que faziam em CSS próprio. O `SkipLink` passa da família Navegação para a nova Acessibilidade, ao lado do `VisuallyHidden`.
- Showcase: a seção Patterns, com um índice e uma página por pattern, a forma recomendada de montar um aspecto comum da interface com os componentes que já existem (`COMPONENTS.md` §16). Cada página traz o problema e quando usar, os componentes e o papel de cada um, um exemplo que funciona com o código para copiar, as decisões de acessibilidade e de comportamento e as variações e o que evitar. São doze: folha de página, painel de filtros, barra da tabela, visões salvas, salvar por cartão, bloco de ajustes, coluna de ação de linha, totais no rodapé, assistente, vazio da primeira vez, controle do usuário e menu de ações do cabeçalho. Os patterns não são componentes e não fazem parte do pacote.
- `Button` e `ButtonIcon`: com `href`, ou com `as` e `linkProps` para o componente de link da aplicação, viram link de verdade, com as mesmas variantes, tamanhos, ícones e estados. Abrem em outra aba, têm o endereço copiável e o leitor de tela anuncia "link". `disabled` tira o destino e a tabulação e o marca com `aria-disabled`; `loading` mantém o destino, marca `aria-busy` e não navega. Sem essas propriedades, nada muda, e a `ref` continua aceitando o elemento do botão.
- `RadioGroup`: a propriedade `orientation` (`'vertical'` ou `'horizontal'`, padrão `'vertical'`), a mesma do `CheckboxGroup`. Na horizontal, as opções ficam lado a lado e quebram de linha quando não couberem.
- `InputNumber` e `InputText`: a propriedade `unit` mostra uma unidade ou um sufixo, como `%` ou `kg`, ao fim do campo. Ela não entra no valor, e o leitor de tela a ouve como descrição do campo.

### Alterado

- `Button` e `ButtonIcon`: na variante `ghost`, o hover só tinge o fundo, sem a sombra, que no tema escuro aparecia como um halo cinza. As demais variantes não mudam.
- `AppShell`: a navegação passa à `Sidebar`, e o `AppShell` fica com a moldura e monta por dentro o `SidebarProvider`, que guarda o estado; dentro de um `SidebarProvider` já montado, usa o estado dele. Os nomes antigos continuam aceitos, marcados como obsoletos, até a versão menor seguinte. Troque `AppShell.Navigation` por `Sidebar`, `AppShell.PanelGroup` por `Sidebar.Group`, `AppShell.PanelItem` por `Sidebar.Item`, e `AppShell.Rail`, `RailItem`, `RailAccount`, `Panel` e `Account` pelas partes de mesmo nome da `Sidebar`. Os tipos trocam o prefixo `AppShell` por `Sidebar`, com `AppShellNavigationProps` virando `SidebarProps`, `AppShellPanelGroupProps` virando `SidebarGroupProps` e `AppShellPanelItemProps` virando `SidebarItemProps`.
- Showcase: toda demonstração das páginas de componente mostra o código que a reproduz, atrás de "Ver código". Valem as variantes, os modos e estados e os quadros de Faça e Evite, além dos exemplos de uso, que já mostravam.
- Showcase: as composições seguem o catálogo em mais pontos. A paginação recebe o total de itens, a navegação usa `Button` com `href`, os filtros ativos voltam como `Tag` removível, as ações repetidas de uma tabela têm nome único por linha, a situação de cada registro tem um selo só, e o índice das composições é uma `LinkList`. O modo de janela inteira passa a ser um diálogo modal, com o fundo inerte e o foco levado para dentro e devolvido ao sair.

### Corrigido

- `ComboBox` de seleção múltipla: o clique na moldura do campo, fora do texto, nas etiquetas dos escolhidos e no respiro, abre a lista, como o clique no texto. Antes, só dava foco.
- `CardMetric.Chart`: o botão "Ver como tabela" deixa de aparecer no gráfico do cartão. Antes, a partir de cerca de 300 px de largura, ele tomava parte do espaço e o desenho passava da borda do cartão. Agora o desenho cabe exatamente no espaço que o cartão concede, nas larguras de 200 a 400 px.
- `Table`: um texto só para leitor de tela no título de uma coluna, como "Ações", deixa de alargar a página inteira quando a tabela rola de lado, por exemplo no celular. Antes, ele se ancorava na página e criava uma rolagem horizontal do documento.
- `ComboBox`: o Escape com a lista aberta fecha só a lista; antes, dentro de um `SidePanel`, de um `Dialog` ou de um `Drawer`, fechava a camada junto, inclusive no `SidePanel` que vira gaveta na janela estreita. O próximo Escape fecha a camada. Com a lista fechada, o Escape segue adiante como antes.
- `SidePanel`: o foco volta a quem abriu também quando o painel fecha por uma ação de dentro dele, como "Aplicar filtros"; antes, ficava perdido. E o Escape que fecha o painel não fecha junto outra camada que também ouve a tecla.

- `Tooltip`: o Escape com o tooltip aberto fecha só o tooltip, também quando ele foi aberto só pelo ponteiro, com o foco em outro lugar, e quando está ancorado a um elemento fora dele; antes, dentro de um painel, de um `Dialog` ou de um `Drawer`, fechava a camada junto, inclusive o `SidePanel` que vira gaveta na janela estreita. O próximo Escape fecha a camada.
- `Card.Header`: com o título em mais de uma linha, o `badge` fica logo depois da última palavra, e não na ponta direita do cabeçalho. Sem espaço nessa linha, ele desce para a seguinte, rente ao título. Com o título numa linha só, a posição do selo não muda. Em `size="sm"`, em que o título para na terceira linha, o selo continua ao lado dele.
- Showcase: na página do `SidePanel`, em janela abaixo de 900 px, como a prévia em "Tablet" ou "Celular", o painel do playground, os exemplos "Filtros ao lado da página" e "À esquerda, estreito" e a demonstração de tamanhos começam fechados. Antes, abriam já como gaveta e tomavam o foco, e quem escolhia a largura da prévia pelas setas ia parar dentro dela. Em janela de computador, continuam começando abertos. Na demonstração de tamanhos, o botão "Filtros" passa a abrir e fechar o painel, que antes ficava sempre aberto.
- Documentação: os exemplos de tokens usam os nomes reais (`--pl-*`), conferidos no CSS, no lugar de nomes que não existiam.
- Documentação: o catálogo diz o que o `AppShell` pede para ocupar a janela: `html`, `body` e o elemento raiz da aplicação com `height: 100%`, e o `body` sem margem. Sem isso, a moldura cresce com o conteúdo, e a barra e o rodapé saem da vista ao rolar.
- Documentação: os exemplos de hooks citam os hooks reais do pacote. Fica claro que só o `useToast` é público e que os demais são internos.
- Documentação: o catálogo traz o contrato do link da aplicação (`as` e `linkProps`), o ícone como filho do `Button`, os valores do `hideBelow`, o uso do `FieldRow` e as props `hideTitle`, `formatRightValue` e `height` dos gráficos. O `README.md` lista os oito ícones de mesmo nome nas duas entradas. `ARCHITECTURE.md`, `COMPONENTS.md`, `CONTRIBUTING.md` e `TOKENS.md` dizem no topo para quem são.
- Showcase: nos playgrounds do `AppShell`, da `Sidebar` e do `SidePanel`, "Tablet" e "Celular", em "Largura da prévia", mostram o componente numa janela própria dessa largura, de até 768 e 390 px, e o modo celular entra de fato: o `AppShell` vira barra com o menu em gaveta, e o `SidePanel` vira gaveta. Antes, só estreitavam a caixa e o componente seguia a janela inteira, então em "Celular" o `AppShell` mostrava trilho e submenu espremendo a página. Em "Livre", a prévia segue a janela do navegador, como antes.
- `FieldRow`: o rótulo da linha aponta para o campo quando a função dos filhos pega o `id`. Com um controle que se nomeia pelo próprio conteúdo, como um botão, que recebe só a explicação, o rótulo deixa de apontar para um campo que não existe, já no HTML do servidor. O campo que monta depois, como o que espera dados, continua ligado ao rótulo.
- `Pagination`: sem largura para todas as páginas numa linha, como no rodapé de um cartão estreito ao lado de uma contagem, os números quebram em linhas entre os botões de anterior e próxima, em vez de vazar do contêiner e ter as últimas páginas cortadas. Onde a navegação já cabia, nada muda.
- Showcase: nas composições de tela e na página do `AppShell`, a área de conteúdo do Showcase deixa de ser um `main`, porque a moldura demonstrada já traz o dela no `AppShell.Page`. Antes, um `main` ficava dentro do outro.
- `Button` e `ButtonIcon`: o anel de foco deixa de sumir quando o ponteiro passa sobre o botão com foco de teclado.
- `Button` e `ButtonIcon`: o ícone guarda a medida num espaço apertado, como a coluna de ações de uma tabela. Antes, encolhia até sumir, e o botão de ícone ficava sem ícone. Agora o botão mantém o tamanho e a tabela rola na horizontal.
- `reset.css`: o teto `max-width: 100%` vale só para imagem e vídeo, como no Tailwind. No `svg`, deixava um ícone encolher até sumir.
- `PageHeader`: o título com uma palavra longa sem espaço, como um código ou um e-mail, quebra dentro da própria caixa em vez de cobrir os selos. Na descrição e no contexto, a palavra longa também quebra, em vez de alargar o cabeçalho para fora da tela.
- `Card`: no cabeçalho, a descrição com uma palavra longa sem espaço, como um código, um e-mail ou um endereço, quebra dentro da própria caixa em vez de passar da borda do cartão ou cobrir a ação ao lado. No `size="sm"`, ela continua cortada na segunda linha. Descrições que já cabiam não mudam.
- Showcase: a coluna "Remover" de Novo pedido e da seção de configuração perde a largura fixa de 56 px, que não cabia o botão, e alinha à direita, como na página da `Table`.
- Showcase: nos quadros Evite de `Tabs`, `Toast`, `Alert`, `CheckboxGroup`, `Timeline`, `ChartGauge` e `AppShell`, a prévia e o código mostram o uso que o texto desaconselha. Antes, mostravam a alternativa certa embaixo do "Evite".

## [0.6.3] — 2026-11-06

### Corrigido

- `ChartLine`, `ChartArea`, `ChartBar` e `ChartCombo`: com série no eixo direito e sem `yAxisRight`, o eixo direito ficava sempre visível, mesmo com `yAxis="onHover"`, e a calha dele seguia reservada sem o ponteiro. Sem valor, o eixo direito passa a seguir o `yAxis`.
- Gráficos cartesianos: o título de um eixo em `onHover` aparece e some junto com ele, e a sala do título entra no recolhimento. Antes, o título ficava à vista e a sala reservada, e o desenho não ocupava o espaço todo sem o ponteiro. Com o eixo `visible` ou `hidden`, nada muda.
- `ChartTooltip`: o conteúdo próprio (`content`), como o balão de comparações do `CardMetric.Trend`, encostava no título. O corpo do balão, em grade ou próprio, fica a 12 px do título, o mesmo respiro da borda.

## [0.6.2] — 2026-11-06

### Adicionado

- `CardMetric.Trend`: máscara das comparações. Cada produto escolhe quais partes aparecem, em que ordem e com que texto entre elas.
  - `mask`, uma linha da comparação por linha do texto, com as partes `{change}`, `{magnitude}`, `{icon}`, `{label}`, `{value}` e `{description}`. A parte ausente leva o separador junto, e o trecho entre `[ ]` aparece inteiro ou não aparece. Parte desconhecida fica de fora, com aviso em desenvolvimento.
  - `layout`: `'stack'`, o padrão, faz cada linha fluir; `'table'` alinha a primeira linha em colunas entre as comparações. Cada um tem a sua máscara padrão.
  - `badgeMask`, a máscara do selo, `{icon}{magnitude}` por padrão; `tonedParts`, as partes no tom da comparação, variação, ícone e rótulo por padrão; e `tooltipMaxWidth`.
  - O texto quebra livre e os números nunca quebram. A máscara é só visual: o nome acessível continua sendo a frase inteira, na ordem da lib.
  - Os tipos `CardMetricTrendLayout` e `CardMetricTrendPart` são exportados.
- `CardMetricComparison`: `description`, a explicação da comparação, que quebra livre no balão e entra no nome acessível.
- `ChartTooltip`: `content`, conteúdo próprio no lugar da grade de `rows`, que passa a ser opcional; e `maxWidth`, 360 px por padrão.
- `IconTrendUp` e `IconTrendDown`, linhas de tendência desenhadas pela lib, fora do Bootstrap Icons.
- `ChartPie`, `ChartDonut`, `ChartSunburst` e `ChartRadial`: a marca sob o ponteiro ou o foco acende a entrada dela na legenda, que ganha `data-active`, um fundo e o tom de texto principal. As demais recuam, com a amostra apagada e o texto terciário. No `ChartSunburst`, acende o grupo de onde o arco vem; a fatia agrupada acende "Outros".
- `groupSmallSlices` e o tipo `GroupSmallSlicesOptions` exportados: a regra com que o `ChartPie` e o `ChartDonut` reúnem as fatias pequenas, para o balão próprio listar as mesmas fatias do desenho. Sem opções, vale o padrão dos dois, "Outros" abaixo de 2%.

### Alterado

- `CardMetric.Trend`: o balão de comparações passa a ser, por padrão, a variação, o ícone e o rótulo no tom de cada comparação, com a diferença e a explicação embaixo e um traço entre as comparações, tudo em `caption`. O selo e o balão trocam as setas pelas linhas de tendência.
- `ChartPie`, `ChartDonut` e `ChartRadial`: a marca fora do realce recua para a opacidade de 0,35, a mesma do `ChartSunburst`. Em 0,82, o realce mal se via.
- `ChartTooltip`: o lado em que o balão abriu vale enquanto couber. Antes ele trocava de lado a cada marca, porque a largura mudava com o conteúdo.
- Legenda dos gráficos: com o ponteiro, o balão segue o cursor, como sobre o desenho, e o `anchor` do `onHover` é o ponto do ponteiro. A âncora na caixa da entrada fica para o foco pelo teclado.
- Pacote: os mapas de fonte não levam mais o código-fonte. O erro no consumidor continua apontando arquivo e linha.

### Corrigido

- Legenda dos gráficos: o espaço entre duas entradas não apaga mais o realce. A saída passa a ser medida na lista, e a marca deixa de piscar com o ponteiro descendo a legenda.
- Com `height="fill"` e a legenda ao lado, o corpo encolhe até a altura imposta e a legenda que não cabe rola, com um respiro até a barra de rolagem. Antes, ela empurrava o gráfico para fora do contêiner.
- `ChartTooltip` envolvendo o gráfico inteiro não segura mais a altura: com `height="fill"`, o gráfico encontra a altura do contêiner do produto.
- Os tokens de tipografia lidos pelos gráficos e pelo `CardMetric.Value` são resolvidos em pixels. Um token redefinido em `rem`, `calc()` ou `clamp()` dava um tamanho errado ou caía no padrão.

## [0.6.1] — 2026-11-04

### Adicionado

- `ChartMap`: zoom e arraste com `zoomable`, desligado por padrão. A vista fica no trio `view`, `defaultView` e `onViewChange`, com o tipo `ChartMapView` (`{ center: [longitude, latitude], scale }`). A escala 1 é o enquadramento de `focus` e `focusMarkers`, e o teto é o mesmo do `focusMarkers`, 100 vezes o mapa inteiro.
  - Os botões "Aproximar", "Afastar" e "Voltar ao enquadramento" ficam no canto do desenho e saem abaixo de 200 px de largura.
  - Ponteiro: arrastar move o mapa, e o arraste além da folga não ativa a marca. A rodinha só aproxima com Ctrl ou ⌘; sem a tecla, a página rola e uma dica ensina o gesto.
  - Toque: um dedo segue rolando a página, e dois dedos aproximam e arrastam. Só com `zoomable`, a área do mapa passa a ter `touch-action: pan-x pan-y`.
  - Teclado: `+` aproxima, `-` afasta, `0` volta e Shift com as setas arrasta. As setas continuam passando de marca em marca, e a marca focada fora da vista traz a vista até ela.
  - A escala é anunciada numa região de status. As bordas e o raio dos marcadores ficam constantes em pixels, e os rótulos de região são refeitos para a vista.
- `ChartSankey` e `ChartMap`: `clickableMarks`, as espécies de marca que viram botão com `onMarkClick`. O padrão são todas, como antes; as que ficam de fora seguem como símbolo gráfico, fora da tabulação. Substitui a escolha que os nomes obsoletos `onFlowClick`, `onNodeClick`, `onRegionClick` e `onMarkerClick` faziam, e também os limita.
- `ChartArea`, `ChartLine` e `ChartBar`: eixo de valor por série, com `axis: 'left' | 'right'`, `formatRightValue` e `minRightTickStep`, como no `ChartCombo`. A escala da direita usa só as séries dela, e o zero fica na mesma altura nos dois eixos. Sem série à direita, nada muda.
  - Com `stacked`, cada eixo tem a sua pilha. No `ChartBar`, as duas pilhas dividem a faixa da categoria, e o total do balão sai quando há série à direita.
  - No `ChartBar`, só na orientação vertical: na horizontal, `axis` é ignorado, com aviso em desenvolvimento. O `ChartBar` ganha `yAxisRightTitle`.
  - O tipo `ChartValueAxis` é exportado, e `ChartComboAxis` passa a ser um nome dele.

### Corrigido

- Grade e linha de base dos cartesianos alinhadas ao centro do pixel. Em coordenada fracionária, a linha de 1 px se espalhava por dois e saía mais clara que `--pl-chart-grid`.

## [0.6.0] — 2026-11-04

### Incompatível

- Saem os nomes marcados como obsoletos na 0.4.0. Troque o nome antigo pelo novo; o comportamento é o mesmo:
  - `Accordion`: `onExpandedChange` → `onExpandedKeysChange`.
  - `List`: `onSelectionChange` → `onValueChange`.
  - `SortableList` e `Tabs`: `onSelectionChange` → `onSelectedKeyChange`.
  - `Table`: `onSelectionChange` → `onSelectedIdsChange`.
  - `Steps`: `onStepChange` → `onCurrentChange`. As etapas viram botões só com `onCurrentChange`.
  - `Dialog`, `Drawer` e `Popover`: `onClose` → `onOpenChange`, que recebe `false` ao fechar.
  - `Badge`: `tone="ok"` → `tone="success"`, `tone="warn"` → `tone="warning"` e `tone="primary"` → `variant="brand"`.
- Saem os formatadores em português. Troque pelo nome em inglês e as opções pelas novas:
  - `formatarNumero` → `formatNumber`, `formatarMoeda` → `formatCurrency`, `formatarPercentual` → `formatPercent`, `formatarData` → `formatDate`, `formatarHora` → `formatTime`, `formatarDuracao` → `formatDuration`, `formatarTamanhoDeArquivo` → `formatFileSize`.
  - Opções: `casasDecimais` → `decimals`, `localidade` → `locale`, `moeda` → `currency`, `segundos` → `seconds`, `formato` → `format` (`'curto'`, `'longo'` e `'numerico'` → `'short'`, `'long'` e `'numeric'`) e `compacto` → `compact` (`'sigla'` → `'symbol'`).
  - Tipos: `OpcoesDeNumero`, `OpcoesDeMoeda`, `OpcoesDePercentual`, `OpcoesDeData`, `OpcoesDeHora` e `OpcoesDeTamanhoDeArquivo` → `FormatNumberOptions`, `FormatCurrencyOptions`, `FormatPercentOptions`, `FormatDateOptions`, `FormatTimeOptions` e `FormatFileSizeOptions`; `Compacto` → `CompactNotation`.
- Saem os tipos `ChartMapColorScale` e `ChartMapCategory`: use `ChartColorScale` e `ChartColorCategory`.
- `Card.Header` em `size="sm"`, `trailingWhenNarrow="wrap"` e `"hide"`: a descrição fica logo abaixo do título, na mesma coluna, enquanto o `trailing` estiver ao lado dele. Antes ela descia para baixo do `trailing` alto, com um vão de cerca de 44px, e tinha a largura do cabeçalho inteiro; agora tem a largura da coluna do título. Quando o `trailing` desce de linha, ele fica abaixo da descrição. A frase "abaixo do `trailing`" da 0.5.0 passa a valer o contrário. Em `size="md"` com `trailingWhenNarrow="keep"`, nada muda; em `size="sm"`, a mudança vale também com `keep`. Quem ajustava o leiaute pela posição da descrição deve revê-lo.
- O tema vale por subárvore e segue `prefers-color-scheme`. `:root[data-theme="dark"]` dá lugar a `[data-theme="dark"]` e `[data-theme="light"]`, que valem em qualquer elemento; sem `data-theme`, o sistema decide. Quem tinha o claro como padrão fixo passa a ver o escuro com o sistema em modo escuro: para manter o claro, ponha `data-theme="light"` no `<html>`. Quem sobrescrevia tokens com `:root[data-theme="dark"]` deve usar `[data-theme="dark"]` e repetir a regra em `@media (prefers-color-scheme: dark) { :root:not([data-theme]) }`. Uma variável derivada de token de cor deve ser declarada também em `[data-theme]` e `[data-palette]`, para se recalcular na subárvore. `color-scheme` acompanha o tema: no escuro, o fundo padrão da página, o texto sem cor declarada, os controles nativos e as barras de rolagem do produto também ficam escuros. Não sobrescreva `color-scheme` dentro de um tema: a cor primária se resolve por ele. Os overlays em portal seguem o tema do documento, e não o do gatilho. A cor primária usa `light-dark()`: Chrome 123, Firefox 120 e Safari 17.5 ou mais novos.
- `InputNumber` e `InputCurrency` trabalham com número: `value?: number | null`, `defaultValue?: number | null` e `onValueChange(value: number | null)`, no lugar do texto pt-BR (`'1234,56'`). `null` é o campo vazio; enquanto o texto digitado não forma número (`-`, `,`), o valor é `null`. O texto em edição continua em pt-BR. Com `name`, o formulário recebe o número com ponto decimal (`'1234.56'`), e não mais o texto do campo: no `InputCurrency`, antes ia a máscara `R$ 1.234,56`. O `name` vai para um `<input type="hidden">`, e o campo visível fica sem ele: quem lia o campo por `input[name=...]` ou `form.elements` passa a ler o oculto. O que fazer: guarde o estado como número, tire a conversão manual, troque `value=""` por `null` e ajuste o servidor ao formato com ponto. Por exemplo, `<InputCurrency defaultValue="165789,50" />` passa a `<InputCurrency defaultValue={165789.5} />`.
- `Card.Footer` com um filho só: o filho vai ao fim da linha, coerente com as ações do `Dialog` à direita; vale também para um texto sozinho. Com dois ou mais filhos, nada muda. Para manter o filho único no começo, dê a ele `margin-inline-start: 0`; a regra do rodapé não tem especificidade, e qualquer classe do consumidor a vence.
- `hidden` dos gráficos com legenda que alterna (`ChartBar`, `ChartLine`, `ChartArea`, `ChartCombo`, `ChartScatter`, `ChartPie`, `ChartDonut`, `ChartRadial`, `ChartTreemap`, `ChartSunburst`, `ChartTimeline` e `ChartMap`): a propriedade passa a ser a lista de rótulos ocultos, e não o atributo nativo `hidden` da figure. Quem escondia o gráfico com `hidden` deve usar `style={{ display: 'none' }}` ou esconder o contêiner. Os demais gráficos não mudam.
- `Tooltip`: a dica abre só no foco por teclado, e não mais no foco que vem do clique nem no de `element.focus()` depois de um clique; o ponteiro continua abrindo. O teste que abria a dica com `fireEvent.focus` passa a simular o teclado antes do foco, com `userEvent.tab()` ou com `fireEvent.keyDown(document.body, { key: 'Tab' })` seguido de `element.focus()`.
- `DrawerProps` passou de interface a união de tipos, para exigir `aria-label` sem `title`, como o `DialogProps` na 0.2.4. Quem declarava `interface X extends DrawerProps` passa a usar `type X = DrawerProps & {...}`.
- `DataGrid`, filtro de coluna numérica: o valor que a condição leva em `filter`, `onFilterChange`, `onQueryChange` e no retrato de `onStateChange` passa a ser número (`1234.56`), e não mais o texto pt-BR do campo (`'1234,56'`), porque o `InputNumber` do painel trabalha com número. Na faixa, as duas pontas também. Quem lia o texto no servidor, trocando a vírgula pelo ponto, tira essa conversão: o número chega pronto. O filtro e o retrato guardados com texto continuam valendo.
- Visão em tabela em todos os gráficos com marca: `ChartBar`, `ChartLine`, `ChartArea`, `ChartCombo`, `ChartWaterfall`, `ChartScatter`, `ChartPie`, `ChartDonut`, `ChartRadial`, `ChartTreemap`, `ChartSunburst` e `ChartSankey` ganham o botão "Ver como tabela" que `ChartMap`, `ChartTimeline` e `ChartHeatmap` já tinham, ligado por padrão em `showTableToggle?: boolean`, agora também nesses três. O botão entra no cabeçalho, que passa de cerca de 20 para 32 px de altura, medido em Chrome; em `height="fill"`, o desenho perde esses 12 px. Para manter o cabeçalho e o desenho de antes, passe `showTableToggle={false}`. A tabela mostra o dado inteiro, inclusive as séries desligadas na legenda, e por isso a legenda sai enquanto ela está aberta, como já faziam o `ChartMap` e o `ChartTimeline`; no `ChartHeatmap`, a legenda da escala, que antes ficava ao lado da tabela, também sai. O `ChartGauge` fica de fora, porque o medidor já diz o valor, a faixa e a meta no texto. A estrutura é do core (`ChartTable`), e a do `ChartHeatmap` passa a ser a mesma.
- Decomposição por encaixe, em todos os gráficos. Abaixo do espaço que o gráfico inteiro pede, ele retira partes, na ordem do que menos pesa na leitura, em vez de encolher tudo: nos cartesianos, a legenda, o título dos eixos, os rótulos do eixo de valor (o direito primeiro), os eixos e, por fim, a grade, os pontos e os rótulos de dado; nas formas radiais, a legenda e o texto do centro; no `ChartGauge`, as marcas e os rótulos da escala; no `ChartTreemap`, a legenda e os rótulos que não cabem em cada retângulo; no `ChartSunburst`, a legenda e os rótulos dos nós; no `ChartSankey`, os rótulos dos nós; no `ChartHeatmap`, a legenda da escala, os rótulos dos eixos e os valores das células; no `ChartMap`, a legenda e a coluna de rótulos; no `ChartTimeline`, o resumo das linhas e depois o encurtamento dos rótulos. A parte sai quando, medida, a área que sobra ao desenho fica abaixo de 120 por 96 px (96 px de diâmetro nas formas radiais) e a saída devolve espaço na dimensão que falta; não há ponto de quebra próprio. A leitura continua pelo `aria-label` de cada marca e pela visão em tabela; o que se perde é o controle da legenda, e o botão "Ver como tabela" sai abaixo de 200 px de largura. Com espaço, o desenho é o mesmo. No `ChartTimeline`, o limite do resumo ao lado passa a ser a medida do texto das colunas, e não mais 200 px fixos. Não há propriedade que desligue a decomposição: quem mostra o gráfico em espaço apertado e conta com uma parte, como a legenda que liga e desliga séries, dá ao contêiner o espaço que o gráfico inteiro pede, e refaz as capturas e os testes visuais feitos nesse espaço.
- Toque nos gráficos. Tocar numa marca fixa o realce e o balão, tocar em outra troca, e tocar fora do desenho, na legenda ou rolar a página solta. O primeiro toque só fixa (`onHover` avisa, `onMarkClick` não); o toque na marca já fixada ativa `onMarkClick`. Antes, o primeiro toque ativava. O dedo na marca não a foca. O balão sobe acima do dedo. A rolagem da página não é afetada, e mouse, caneta e teclado seguem como antes. Não há como voltar a ativar no primeiro toque: o teste de toque que ativava a marca com um toque passa a tocar duas vezes.

### Adicionado

- `AppShell`: moldura da aplicação em camadas, em composição. `AppShell.Navigation` reúne `Rail` (trilho de módulos, com `RailItem` e `RailAccount`) e `Panel` (submenu do módulo, com `PanelGroup`, `PanelItem` e a conta em `Account`); `Page`, `PageBar` e `PageBody` formam a folha da página. Abrir o submenu empurra a página; o terceiro nível abre no lugar ou em pilha (`nestedMode`); a conta abre acima do rodapé ou cobrindo a lista (`accountMode`). Abaixo de 900px, o trilho e o submenu passam a uma gaveta com a interação do `Drawer`. O submenu tem o trio `open`/`defaultOpen`/`onOpenChange`; módulo sem submenu leva o `Panel` sem itens, só como lugar da conta. A marca e o recolher do submenu ficam dentro da navegação do módulo, e os botões de recolher, abrir e fechar seguem o destaque da paleta, como os itens. Os links são os da aplicação, como no `Breadcrumb`.
- `SidePanel`: painel não modal ao lado do conteúdo, de qualquer lado (`side`) e em três larguras (`size`). Empurra a página, não prende o foco nem torna o fundo inerte; fechado, fica inerte. Abaixo de 900px passa a se comportar como o `Drawer`.
- Token `--pl-color-primary-selected`: o fundo do item selecionado, entre o container e a linha da cor primária (`palette.20` no claro; `palette.40` a 26% sobre a superfície no escuro).
- `PageHeader`: cabeçalho de página, em composição. `PageHeader.Title` é o `h1`; `Back` (link da aplicação, como no `Breadcrumb`, só com a seta e nomeado por `label`), `Badges`, `Description`, `Context`, `Actions` e `Search` ocupam a grade em qualquer ordem. A linha separadora vai de borda a borda do elemento que o contém, `maxWidth` alinha o texto à coluna do conteúdo, e abaixo de 640px de largura do cabeçalho os selos, as ações e a busca descem para sob o título. Ao lado de um título longo, os selos guardam a largura do maior deles, e quem quebra é o título.
- `FieldRow`: linha de ajuste, com rótulo e explicação de um lado e o controle do outro. O controle desce quando a linha estreita, pela largura da linha e não da janela: com menos de 560px por dentro da linha, todo controle desce, e as linhas de uma lista descem juntas; acima, desce só o controle que não cabe ao lado do texto. `children` pode ser uma função que recebe `{ id, describedBy }` para ligar o rótulo e a explicação ao controle. O `Switch` passa a aceitar a ausência de `label`, para ser nomeado pela linha ou por `aria-label`.
- `SaveBar`: barra de alterações não salvas, com descartar e salvar. `open` é do produto; a barra desliza ao abrir e fechar (sem transição com `prefers-reduced-motion`), anuncia a mensagem numa região de status ao abrir, tira os botões do foco enquanto fechada e fica presa ao topo da área de rolagem em que for montada. `message`, `saveLabel`, `discardLabel` e `saving` configuram textos e o salvamento em curso.
- Showcase: seção própria de **Composições** de tela, com as do protótipo `composicoes.html` montadas só com componentes do pacote dentro de um `AppShell` (tela inicial, lista com tabela e filtros, detalhe, formulários com `SaveBar` e anotado, painel de dados, índice sem grade, formulário rápido, assistente com `Steps`, estado vazio e a configuração nos três arranjos), cada uma com a regra de composição, os componentes usados e a estrutura; e a página de **Fundamentos** reposta (cores, tipografia, espaçamento, raios e sombras, movimento e leiaute, camadas e estratégia de CSS), lida dos tokens do pacote.
- `ToastProvider` e `useToast`: estado de avisos por árvore, para duas aplicações na mesma página ou testes isolados. O `ToastRegion` dentro do provider mostra só os avisos disparados por `useToast()`, que devolve `{ showToast, dismissToast }`; o provider é só o estado e não renderiza o canto. Sem provider, `useToast`, `showToast` e `ToastRegion` agem no estado global, como antes.
- `PortalProvider` e `portalContainer`: destino dos overlays em portal. `<PortalProvider container={elemento}>` leva para dentro do elemento os overlays abaixo dele, que passam a herdar o tema e o `data-palette` da subárvore; `container={null}` mantém o `document.body`. `Dialog`, `Drawer`, `Popover`, `Tooltip`, `Menu` (com os submenus), `Toolbar` ancorada, `ChartTooltip`, os painéis de `Select`, `ComboBox`, `DatePicker`, `DateTimePicker` e `TimePicker` e o `ToastRegion` aceitam também `portalContainer?: HTMLElement | null`, que vale sobre o provider. O `ToastRegion` só vai a um portal quando o destino foi escolhido; sem escolha, continua onde foi montado.
- Nomes comuns nos gráficos (`COMPONENTS-CATALOG.md` §6). Cada gráfico com marca ou legenda que alterna passa a ter os mesmos três contratos, e continua com o nome dos seus dados (`series`, `slices`, `tracks`, `steps`, `nodes`, `flows`, `cells`):
  - `hidden`, `defaultHidden` e `onHiddenChange(hidden)`: os rótulos desligados pela legenda, em `ChartBar`, `ChartLine`, `ChartArea`, `ChartCombo`, `ChartScatter`, `ChartPie`, `ChartDonut`, `ChartRadial`, `ChartTreemap`, `ChartSunburst`, `ChartTimeline` e `ChartMap` (categorias e séries de marcadores; `hiddenClasses` e `selectedRegion` ficam como estão). `ChartTimeline` mantém `collapsedGroups`.
  - `onHover(mark | null)`: o que está sob o ponteiro ou o foco. Nos cartesianos entrega `ChartCategoryHover` (`{ category, index }`); no `ChartScatter`, `ChartScatterPointClick`; em `ChartPie`, `ChartDonut`, `ChartRadial`, `ChartTreemap` e `ChartSunburst`, a fatia, o anel ou o caminho, como antes; no `ChartWaterfall`, `ChartWaterfallMark` (`{ index, step }`); no `ChartHeatmap`, a célula; no `ChartSankey` e no `ChartMap`, `ChartSankeyMark` e `ChartMapMark`, que se distinguem por `kind`. `ChartPie`, `ChartDonut`, `ChartSunburst` e, agora, `ChartRadial` trazem o segundo argumento `{ anchor, color }` quando o aviso vem da legenda.
  - `onMarkClick(mark)`: a marca ativada por clique, Enter ou Espaço, e com ele as marcas viram botões. Entrega `ChartMarkClick` nos cartesianos, `ChartScatterPointClick`, a fatia, o anel, o caminho, `ChartWaterfallMark`, a célula, `ChartSankeyMark`, `ChartMapMark` e `ChartTimelineMark` (`{ segment, row }`).
  - Novos avisos: `onHover` em `ChartScatter`, `ChartRadial` e `ChartSankey` (a ligação e o nó). Novos tipos exportados: `ChartCategoryHover`, `ChartWaterfallMark`, `ChartSankeyMark`, `ChartMapMark` e `ChartTimelineMark`. `ChartWaterfallStep` passa a estender `SeriesAppearance`, sem mudar os campos.
- `Drawer`: aceita a forma sem título, nomeada por `aria-label` e sem cabeçalho nem botão de fechar, como o `Dialog`; e `flush`, que tira o respiro interno do corpo, como no `Card.Body`. Sem as duas, nada muda. A gaveta do `AppShell` passa a usar o `Drawer`, e os botões de ícone do `AppShell` passam a ser `ButtonIcon`, com dica.
- `DatePickerRange`: escolha de um intervalo de datas em painel com calendário. `value` e `defaultValue` são `{ start, end }` em ISO, `onValueChange` recebe o intervalo ou `null`, e `startName` e `endName` levam as pontas ao `FormData`. A escolha vale só em `Aplicar`; `Limpar` esvazia. `shortcuts` recebe os atalhos do produto (`{ label, range }`, com `range` uma função); sem a propriedade não há atalho, e `defaultDateRangeShortcuts` é uma lista pronta e opcional. Atalho fora de `min` e `max` fica desabilitado.
- `Menu`: `placement` define o lado e o alinhamento do painel em relação ao gatilho, com os nomes do `Popover` (`bottom start`, `bottom end`, `top`, `right`...). O padrão continua `bottom start`.
- `Dialog`: tamanho `xl`, de até 1040px. `Dialog` e `Drawer`: `onBeforeClose`, `() => boolean | Promise<boolean>`, consultado antes de fechar por Esc, pelo clique no véu e pelo botão Fechar; `false` mantém aberto, e uma promessa permite confirmar de forma assíncrona. Não vale quando o produto muda `open`.
- `Toast`: `actions`, até duas ações por aviso, na ordem dada; a terceira em diante não aparece. `action` continua valendo e é ignorada quando `actions` vem.
- `ComboBox` múltiplo: `selectAll` ("Selecionar todos", sobre o resultado da busca), `clearable` ("Limpar") e `confirmSelection`, em que a escolha só vale em "Aplicar" e fechar de outro modo descarta o rascunho. `labels` troca os textos. O Tab do campo percorre os botões do rodapé, e uma região de status anuncia a contagem.
- `InputText`: `mask` formata o que a pessoa digita ou cola, com um padrão (`'000.000.000-00'`: `0` é dígito, `a` letra, `*` letra ou dígito, e o resto é literal) ou uma função `(texto) => texto formatado`. O cursor fica onde a pessoa estava ao digitar, apagar e colar no meio, e o `value` e o `defaultValue` também passam pela máscara, então podem chegar crus. `onValueChange` entrega o texto formatado, o mesmo do campo e do `name`; `onRawValueChange` entrega o cru: no padrão, só o que preencheu posições; na função, as letras e os dígitos do texto. Novo tipo exportado: `InputMask`. A biblioteca não traz máscara de domínio (CPF, telefone, CEP): elas são do produto, e o Showcase as mostra como exemplo. Sem `mask`, o campo não muda.
- `DataGrid`, copiar: `copyable` faz o Ctrl+C levar para a área de transferência, em texto separado por tabulação, as linhas selecionadas na ordem da tela ou, sem seleção, a célula com foco, como as vê a pessoa. `copyHeaders` junta os títulos das colunas na primeira linha. O que tem tabulação, quebra de linha ou aspas vai entre aspas. A célula de título e o campo dentro da célula ficam com a cópia do navegador. Sem `copyable`, nada muda.
- `DataGrid`, linhas fixas no topo: `pinnedRows` fixa sob o título as linhas do produto, como um resumo, fora da ordem, da busca, do filtro, da paginação e da seleção. Têm as mesmas colunas, `renderCell` e `aria-rowindex` logo depois do título, e a navegação por setas passa por elas.
- `DataGrid`, edição de célula: `editable` na coluna (verdadeiro ou função da linha) abre a edição com Enter, F2 ou duplo clique; Enter ou Tab confirmam, Esc cancela, e o foco em outra célula, na linha de resumo ou no detalhe confirma o valor válido e descarta o recusado, anunciando o motivo. Com `rowClickAction`, o Enter fica com a ação da linha e o F2 edita, e o duplo clique roda a ação uma vez só antes de abrir a edição. A célula editável é descrita ao leitor de tela: "Editável: Enter ou F2 edita.", ou "Editável: F2 edita." com `rowClickAction`. O campo padrão é de texto, e `parse` converte o texto em valor (o número em pt-BR já vem convertido). `validate(value, row)` devolve a mensagem de recusa: a edição fica aberta, o campo ganha `aria-invalid` e `aria-describedby`, e a mensagem é anunciada. `renderEditor` troca o campo pelo editor do produto, que recebe `{ value, onChange, commit, cancel, error, errorId, row, columnId }`. `onCellEdit({ row, rowId, columnId, value, previousValue })` avisa o valor novo; a grade não guarda a linha, e o produto a troca em `rows`. A abertura, a confirmação, o cancelamento e a recusa são anunciados. Tipos `DataGridCellEdit` e `DataGridEditorContext`.
- `DataGrid`, agrupar por coluna: `groupBy`, com `defaultGroupBy` e `onGroupByChange`, agrupa as linhas em níveis pelo texto exibido da coluna, depois da busca, do filtro e da ordem. A linha do grupo mostra o valor, a quantidade e, em cada coluna com `summary`, o agregado do grupo (soma, média, contagem, mínimo, máximo ou o próprio), formatado como a coluna. O valor do grupo fica na primeira coluna, onde o texto longo é cortado: ponha as colunas que agrupam primeiro. O grupo abre e fecha por clique, Enter ou Espaço, pelo mesmo `expandedIds` da árvore, com a chave que `dataGridGroupKey(valores)` monta dos valores do grupo, do primeiro nível ao dele, como a célula os mostra (`dataGridGroupKey(['Sul', 'Atacado Sul'])`); o formato da chave não é contrato. A seta à esquerda na primeira coluna de uma linha do grupo volta à linha do grupo. A paginação é pelos grupos do primeiro nível. O menu da tabela ganha "Expandir todos os grupos". `groupable` na coluna põe "Agrupar linhas por esta coluna" no menu dela. O grupo não se seleciona, e com `groupBy` o `renderDetail` não vale. Só no cliente e fora da árvore; id de coluna desconhecido em `groupBy` é ignorado.
- `DataGrid`, construtor de filtros: a parte `DataGrid.FilterBuilder` abre um painel com condições de qualquer coluna que filtre, combinadas por E ou OU, em grupos dentro de grupos. Escreve no mesmo `filter` do funil, então o estado é o trio `filter`, `defaultFilter` e `onFilterChange`, e `filterApplyMode` vale para ele. A grade recebe só as condições completas. O botão mostra quantas condições filtram.
- `DataGrid`, virtualização de colunas: `virtualizeColumns` desenha só as colunas que cruzam a tela, mais duas de cada lado, as fixas e a com foco, para dezenas ou centenas de colunas. `aria-colcount` e `aria-colindex` continuam os reais.
- `DataGrid`, exportação por mecanismo, sem dependência nova: `exporters` já aceitava `{ id, label, export(model) }` para XLSX, PDF ou o que o produto quiser, e agora há como ler o mesmo modelo fora do menu e em matrizes. `apiRef` entrega `getExportModel(scope)`, com as colunas visíveis na ordem da tela e as linhas do escopo (`'filtered'`, `'selected'` ou `'page'`) já filtradas e ordenadas, cada célula com o texto exibido e o valor cru. `dataGridExportMatrix(model, 'text' | 'raw')` devolve `{ header, rows, summary }`, o formato que as bibliotecas de planilha recebem. O Showcase traz o exemplo com uma biblioteca de XLSX do lado do produto. Tipos `DataGridApi`, `DataGridExportMatrix` e `DataGridExportValues`.
- Ícones, um módulo por ícone: `@plenustech/design-system/icons/<Nome>` (por exemplo `icons/IconStar`), em ESM e CommonJS e com tipos, traz só o desenho importado, sem depender do tree-shaking do empacotador. Num app mínimo com esbuild, `import { IconStar } from '@plenustech/design-system/icons/IconStar'` gera 0,9 KB em ESM e 1,4 KB em CommonJS; pelo subcaminho `icons`, sem tree-shaking, o mesmo ícone arrasta 1,0 MB em ESM e 1,2 MB em CommonJS. A raiz e o subcaminho `icons` continuam como estavam.
- CSS por componente: `@plenustech/design-system/styles/base.css` (tokens, temas e base de página) e `@plenustech/design-system/styles/<Componente>.css` (por exemplo `styles/Button.css`) carregam só o CSS dos componentes usados. Cada folha importa as de que depende, e `styles.css` segue sendo a folha inteira, sem mudança para quem a importa. Numa tela com `Button`, `InputText`, `Select`, `Dialog` e `Table`, são cerca de 8 KB comprimidos, contra 25 KB da folha inteira.

### Alterado

- Nomes comuns nos gráficos: os nomes antigos continuam aceitos, marcados como obsoletos, até a versão menor seguinte (a 0.7.0). Se o consumidor passa o antigo e o novo, vale o valor do novo (`hidden`, `defaultHidden`), e os dois avisos são chamados, cada um com a forma dele. Troque assim:
  - `hiddenSeries`, `hiddenSlices`, `hiddenTracks` e `hiddenGroups` → `hidden`; `defaultHiddenSeries`, `defaultHiddenSlices`, `defaultHiddenTracks` e `defaultHiddenGroups` → `defaultHidden`; `onHiddenSeriesChange`, `onHiddenSlicesChange`, `onHiddenTracksChange` e `onHiddenGroupsChange` → `onHiddenChange`. No `ChartMap`, só os de série (`hiddenSeries` e os dois outros); `hiddenClasses` não muda.
  - `onHoverCategory(index)` (`ChartBar`, `ChartLine`, `ChartArea`, `ChartCombo`) → `onHover({ category, index })`. Quem usava o índice lê `.index`.
  - `onHoverStep(index)` → `onHover({ index, step })` e `onStepClick(step, index)` → `onMarkClick({ index, step })` (`ChartWaterfall`).
  - `onHoverSlice(slice, details?)` → `onHover` (`ChartPie` e `ChartDonut`); `onHoverNode(path, details?)` → `onHover` (`ChartTreemap` e `ChartSunburst`); `onHoverCell(cell)` → `onHover` (`ChartHeatmap`). Os argumentos são os mesmos.
  - `onHoverRegion(id)` → `onHover(mark)` (`ChartMap`); quem só quer o id lê `mark.id`.
  - `onBarClick` (`ChartBar`), `onPointClick` (`ChartLine`, `ChartArea` e `ChartScatter`), `onSliceClick` (`ChartPie` e `ChartDonut`), `onTrackClick` (`ChartRadial`), `onNodeClick` (`ChartTreemap` e `ChartSunburst`) e `onCellClick` (`ChartHeatmap`) → `onMarkClick`, com o mesmo argumento. O `onMarkClick` do `ChartCombo` já tinha o nome final.
  - `onFlowClick(flow)` e `onNodeClick({ label, value })` (`ChartSankey`) → `onMarkClick(mark)`, que serve às duas marcas: ramifique por `mark.kind` (`'flow'` ou `'node'`). Com `onMarkClick`, ligações e nós viram botões; os antigos continuam tornando botões só a espécie que cada um nomeia.
  - `onRegionClick(region)` e `onMarkerClick(marker)` (`ChartMap`) → `onMarkClick(mark)`, com `mark.kind` `'region'` ou `'marker'`; `mark` traz os campos de `region` ou de `marker` além de `kind`.
  - `onSegmentClick(segment, row)` (`ChartTimeline`) → `onMarkClick({ segment, row })`.
- `Table`: a dica do `help` do título da coluna abre embaixo do título, e não mais em cima. Em cima, ela cobria o que estivesse sobre a tabela, como a barra de filtros; embaixo, cobre só o respiro da primeira linha. Sem espaço embaixo, a dica inverte sozinha. O lado não é configurável.
- `ChartSankey` calcula o leiaute por conta própria e a biblioteca deixa de depender do `d3-sankey`, que arrastava cópias antigas de `d3-array` e `d3-shape`. O desenho é o mesmo, com as mesmas coordenadas.

### Corrigido

- `DatePicker`, `DateTimePicker` e `TimePicker`: o Tab no último controle do painel saía para o fim do documento, e o Shift+Tab no primeiro ia ao último elemento da página, porque o painel vive no fim do `body`. Agora o foco segue para o elemento seguinte ou anterior ao gatilho, como no `Popover` e no `Select`. Também como no `Popover`, o clique fora numa área sem foco devolve o foco ao controle de onde o painel abriu, em vez de deixá-lo no `body`. Conferido em Chrome real.
- `DataGrid` em árvore: a seta à esquerda na primeira coluna de uma linha filha volta à linha-mãe, como pede o padrão de árvore do WAI-ARIA. Antes, ficava parada.
- `DataGrid` com `rowClickAction`: o duplo clique roda a ação da linha uma vez, e não duas, uma por clique.
- `Tooltip`: aberta, a dica acompanha a âncora que se move numa transição ou animação, como o botão da barra que o submenu empurra ao recolher. Antes ficava no ponto em que abriu.
- Gráficos: a marca que não é botão — a barra, o ponto, a fatia, o anel, o retângulo, o arco, a ligação, o nó, a célula, a região e o intervalo — leva `role="graphics-symbol"`, porque o `aria-label` num elemento SVG sem papel é proibido pelo ARIA, e o axe o acusava como grave em todos os gráficos. O nome de cada marca é o mesmo. No `ChartRadial`, o nome do anel sai do traçado de fundo e fica no grupo do anel, que já o levava quando o anel é botão.

## [0.5.7] — 2026-11-03

### Adicionado

- `ChartMap`: `subdivisions`, uma segunda geometria só de contorno, traçada por dentro das regiões, como as divisas dos estados numa visão por macrorregião. O traço é mais fino e esmaecido que a borda da região, sem preenchimento, rótulo nem interação, fora da tabela e da legenda; valor, balão, clique e rótulo continuam sendo das regiões. Sem a propriedade, o desenho não muda.
- `ChartScatter`: `xAxisTitle`, `yAxisTitle` e `yAxisRightTitle`, que seguem o lado da tela como nos demais cartesianos, e `minXTickStep` e `minYTickStep`, o passo mínimo entre as marcas de cada eixo. Ficam separados de `xLabel` e `yLabel`, que seguem nomeando as medidas no balão.
- `ComboBox`, `DatePicker`, `DateTimePicker` e `TimePicker`: abertura controlável por `open`, `defaultOpen` e `onOpenChange`, como no `Select`. Todo caminho que abre ou fecha avisa por `onOpenChange` uma vez; controlado, o painel só muda quando o produto atualiza `open`. Sem as propriedades, o comportamento é o mesmo.

### Corrigido

- Balão dos gráficos: o Esc fecha o balão aberto pelo teclado ou pela legenda, sem tirar o foco, quando o foco está dentro do gráfico. Dentro de um `Dialog`, o primeiro Esc fecha só o balão. Com o foco fora do gráfico, o Esc segue para quem estiver aberto, como um `Select`.
- Balão dos gráficos: rótulos e títulos longos quebram em até duas linhas, com reticências na última, em vez de cortar numa só; palavra sem espaço quebra em vez de vazar; o valor segue numa linha. Perto da borda direita, com barra de rolagem clássica, o balão vira de lado em vez de encolher.

## [0.5.6] — 2026-11-03

### Adicionado

- Títulos de eixo opcionais nos cartesianos: `xAxisTitle` e `yAxisTitle` em `ChartBar`, `ChartLine`, `ChartArea`, `ChartCombo` e `ChartWaterfall`, e `yAxisRightTitle` onde há eixo à direita. Seguem o lado da tela, como `xAxis` e `yAxis`: no `ChartBar` horizontal, o de baixo é o do valor. O espaço sai da área de desenho, e o texto fica fora da árvore de acessibilidade; o nome do gráfico continua sendo o `title`.
- `minTickStep`, passo mínimo entre as marcas do eixo de valor, em `ChartBar`, `ChartLine`, `ChartArea`, `ChartCombo` (com `minRightTickStep` para o eixo direito) e `ChartWaterfall`. Com 1, uma contagem de 1 e 2 mostra 0, 1 e 2, sem marcas fracionárias.
- `ChartCombo`: `showDataLabels` e `curve` por série, que vencem os do gráfico. Barra e linha de valores próximos deixam de sobrepor os rótulos quando só uma delas os mostra.
- `ChartMap`: `focusMarkers` enquadra o mapa pelos marcadores de ids indicados, com margem do raio do maior marcador e teto de aproximação próprio. As regiões em volta seguem desenhadas e interativas; com `focus` junto, o enquadramento abraça as regiões e os pontos.
- `Badge`: `size`, `'sm'` ou `'md'` (padrão, sem mudança). O `sm` tem 16px de altura e texto de 10px, para etiquetas ao lado de um título. Novo tipo `BadgeSize`.
- Papel tipográfico `micro` (`--pl-type-micro-size`, `--pl-type-micro-line-height` e `--pl-type-micro-weight`: 10px, 12px e 600), o único abaixo de 12px, restrito a micro-rótulos.
- `ChartAnchorPoint` ganha `width` e `height` opcionais. Com a caixa, o `ChartTooltip` encosta nela a 8px, alinhado ao topo; sem espaço à direita, vai para a esquerda sem cobri-la; sem espaço dos lados, desce ou sobe, sempre dentro da janela. A entrada da legenda entrega a caixa em `details.anchor`, com `x` e `y` iguais aos de antes.

### Alterado

- `ChartSunburst` e `ChartTreemap`: o valor de um nó com filhos passa a ser o maior entre o próprio e a soma dos filhos. Antes, o valor do pai era somado ao dos filhos, e o mesmo valor contava duas vezes (pai 100 com filhos 30 e 30 virava 160). Com o valor próprio maior, a parte que os filhos não detalham fica vazia. Dado coerente, só com valor nas folhas ou com o pai igual à soma, sai idêntico. O balão e a costura entregam o valor corrigido.
- `ChartRadial`: o centro acompanha o anel em foco, pelo ponteiro, pelo teclado ou pela legenda, e volta ao primeiro visível ao sair, como o da `ChartDonut`.

### Corrigido

- `ChartBar` horizontal: o rótulo de dado da barra mais longa saía da área de desenho ("215K" virava "215"). A margem direita reserva a largura do maior rótulo, com `showDataLabels` em `visible` e em `onHover`.
- `ChartBar` horizontal: nomes de categoria longos ocupavam até 64% da largura. A coluna tem teto de 24% da largura, com piso de 128px, e o nome que passar sai com reticências; o nome inteiro segue no balão e no rótulo acessível da barra.
- `ChartWaterfall`: o balão do passo de total dizia sempre "Total"; passa a usar o rótulo do passo.
- `ChartTooltip` sem título reservava 8px a mais no topo.
- O balão aberto pela legenda dos gráficos radiais abria em diagonal, longe da entrada, e perto da borda cobria as entradas de baixo.

## [0.5.5] — 2026-11-02

### Adicionado

- `ChartPie`, `ChartDonut` e `ChartSunburst`: ponteiro e foco numa entrada da legenda fazem o mesmo que o ponteiro na fatia ou no grupo. Realçam a marca, trocam o valor do centro da rosca, disparam `onHoverSlice` ou `onHoverNode` e abrem o balão integrado ao lado da entrada. Uma série desligada não realça.
- Por esse caminho da legenda, que não tem ponteiro para o balão seguir, `onHoverSlice` e `onHoverNode` recebem um segundo argumento, `ChartHoverDetails`, com `anchor` (o ponto da janela onde ancorar o `ChartTooltip` montado pelo produto) e `color` (a cor com que a marca foi desenhada). Pelo ponteiro, pelo teclado e pelo clique, o aviso continua com um argumento só e com a fatia ou o caminho de antes. Novos tipos `ChartHoverDetails` e `ChartAnchorPoint`.
- `ChartRadial` com mais de um anel: a entrada da legenda realça o anel e abre o balão.

### Alterado

- O esmaecimento das demais fatias e anéis passa a acompanhar também o foco do teclado e a legenda, e não só o ponteiro. Pelo ponteiro, o visual é o mesmo.

## [0.5.4] — 2026-11-02

### Adicionado

- `Select`: abertura controlável, com `open`, `defaultOpen` e `onOpenChange`. Toda via de abrir ou fechar (clique, teclado, Esc, Tab, clique fora, rolagem e escolha) avisa por `onOpenChange`; controlado, o painel só muda quando o produto atualiza `open`. Ao fechar, o foco volta ao gatilho também quando quem fecha é o produto.
- `ChartTimeline`: `height`, número ou `fill`. As linhas rolam na vertical dentro da altura, com o eixo de tempo fixo, e em `fill` ocupam a altura imposta pelo contêiner. Sem `height`, a altura continua vindo das linhas.
- `Button` e `ButtonIcon`: variante `dangerSoft`, o `soft` no tom de perigo, para a ação destrutiva que não deve competir com a primária.
- `IconStar` e `IconStarFill` entre os ícones do ponto de entrada principal, para favorito e padrão.
- Tokens de camada, em `src/tokens/semantic/layer.css`: `--pl-z-modal` (fundo do `Dialog` e do `Drawer`), `--pl-z-toast`, `--pl-z-tooltip` (balão dos gráficos), `--pl-z-skip-link` e `--pl-z-fullscreen` (`DataGrid` em tela cheia), com os valores de antes. O produto os redefine para encaixar a lib na própria escala de camadas; os painéis ancorados a um gatilho continuam acima de tudo, pelo posicionamento.
- Token `--pl-shell-gap`, de 6px, em `src/tokens/semantic/shell.css`: o respiro entre as folhas do `AppShell`, previsto no catálogo e ainda não implementado.

### Corrigido

- Gráficos radiais com legenda ao lado (`ChartPie`, `ChartDonut`, `ChartRadial` e `ChartSunburst`): a área de desenho ocupava toda a largura que a legenda deixava, e a legenda ficava longe da forma, na ponta do gráfico. A área passa a ter a medida da forma, a legenda encosta nela, e o conjunto fica centralizado. A medida da forma não muda.
- `ChartDonut` e `ChartRadial`: o valor do centro saía no maior degrau que coubesse na largura, e um valor curto, como "1M", dominava o anel. O degrau passa a respeitar também a altura do furo: num anel de 200px o valor sai em 16px, e num de 340px ainda chega a 36px.
- `Card.Body` passa a ocupar a sobra do cartão. Num cartão esticado por uma grade, o `Card.Footer` ficava no meio, e o conteúdo com `height="fill"` (gráficos, `DataGrid`) não recebia altura; agora o rodapé vai ao fundo, e o conteúdo com `fill` ocupa o corpo, com e sem `flush`. Num cartão sem altura imposta, nada muda. Num cartão de altura fixa com conteúdo mais alto que ele, o rodapé passa a aparecer no fundo, sobre o conteúdo que transborda, em vez de ser cortado.
- `Select`: o Esc avisava o fechamento duas vezes.

## [0.5.3] — 2026-11-02

### Alterado

- O painel de `Select`, `ComboBox`, `DatePicker`, `DateTimePicker`, `TimePicker`, `Menu` e `Popover`, e a dica do `Tooltip`, passam a fechar também quando a página rola. Antes acompanhavam a página abertos. Ao fechar pela rolagem, o foco volta ao gatilho sem rolar até ele, como no Esc. No `Menu`, rolar o menu pai fecha só o submenu.
- O `Popover` rola por dentro quando o conteúdo é mais alto que o espaço na tela, em vez de passar dela.

### Corrigido

- O painel de `Select`, `ComboBox`, `DatePicker`, `DateTimePicker`, `TimePicker`, `Menu` e `Popover`, e a dica do `Tooltip`, ficavam parados onde abriram, soltos do campo, quando rolava um contêiner que o envolve: a área rolável do `DataGrid`, o corpo de um `Dialog` ou `Drawer`, ou o leiaute da aplicação. Agora fecham.
- O painel do `Select` e do `ComboBox` passa a ter largura mínima de 180px, como o do `Menu` e o do `Popover`. Antes ele tinha a largura do campo, e num campo estreito as opções quebravam ou eram cortadas.

## [0.5.2] — 2026-11-02

### Adicionado

- `DataGrid`: `height="fill"` ocupa a altura imposta pelo contêiner, como a célula de uma grade CSS com `grid-row: span`. Sem altura imposta, a área rolável mantém os 480px. `height` continua aceitando número, e o padrão não muda.

### Corrigido

- Gráficos com `height="fill"` (`ChartBar`, `ChartLine`, `ChartArea`, `ChartCombo`, `ChartScatter`, `ChartWaterfall`, `ChartHeatmap`, `ChartPie`, `ChartDonut`, `ChartRadial`, `ChartSankey`, `ChartSunburst`, `ChartTreemap`, `ChartGauge` e `ChartMap`) paravam em 160px, qualquer que fosse a altura disponível. Passam a ocupar a altura que o contêiner impõe, inclusive abaixo de 160px, e, com a legenda ao lado, a altura dela, quando é maior. O piso de 160px vale só quando nada dá altura ao gráfico. A legenda nunca é cortada: numa altura menor que ela, é ela que manda. Dentro de um `Card`, o corpo do cartão ainda não repassa altura, e o gráfico continua com o piso.

## [0.5.1] — 2026-11-01

### Adicionado

- `ButtonIcon`: `tooltipPlacement`, o lado da dica, com `top` por padrão. Numa coluna de ações de tabela, `left` ou `right` não cobre a linha de cima.
- `nearestPaletteColor(cor)`: a cor que `createPalette` aceita mais próxima da pedida, na mesma matiz, ou a própria cor quando já é aceita. Serve a cor que vem de fora do código, como a escolhida pelo usuário: `createPalette(nearestPaletteColor(cor))`. A recusa de `createPalette` continua.

## [0.5.0] — 2026-10-28

### Incompatível

- `Select` sem `label` nomeia a lista aberta pelo `aria-label` do gatilho; antes ela se chamava "Selecione", o texto de espera. Quem buscava a lista por esse nome, como `getByRole('listbox', { name: 'Selecione' })`, passa a buscá-la pelo `aria-label` do gatilho.

### Adicionado

- `DataGrid`: grade com colunas como dados, tipos de coluna, ordenação simples e empilhada, busca global, paginação no cliente e modo servidor por `onQueryChange`, seleção única e múltipla, janela virtual, teclado em dois modos e retrato do estado por `initialState` e `onStateChange`. Partes `DataGrid.Toolbar`, `DataGrid.Search` e `DataGrid.TableMenu`.
- `DataGrid`, master-detail: `renderDetail` e `rowHasDetail`, expansão pelo trio `expandedIds`, `defaultExpandedIds` e `onExpandedIdsChange`, `expandMode` e `rowClickAction` com `onRowActivate`. O detalhe é uma linha de largura total; uma `DataGrid` dentro dele fica aninhada, sem rolagem própria, em quantos níveis houver. O estado do detalhe, por `state` e `setState`, e o das grades aninhadas sobrevivem à rolagem e a recolher. Parte `DataGrid.DetailLayout`, com conteúdo lateral ao lado ou em diálogo.
- `DataGrid`, colunas: menu de cada título para ordenar, filtrar, fixar à esquerda ou à direita, ajustar a largura ao conteúdo, mover e ocultar; borda do título que redimensiona, clique duplo que ajusta; arrastar o título move a coluna; `Ctrl+Enter` abre o menu e `Ctrl+Shift` com as setas move. Colunas fixas dos dois lados, com a divisa só quando há conteúdo rolado por baixo. Fatia `columnState`, com `defaultColumnState` e `onColumnStateChange`, que entra no retrato; `pinned` na coluna.
- `DataGrid`, grupos de cabeçalho: um item de `columns` com `children` é um grupo, em quantos níveis houver, desenhado em caixas acima dos títulos. Com `collapsible`, a seta do grupo esconde as colunas marcadas com `hideWhenCollapsed`, e o grupo recolhido entra em `columnState`. A coluna só se move dentro do próprio grupo. Tipos `DataGridColumnGroup` e `DataGridColumnDefinition`.
- `DataGrid`, menu da tabela: ícone de ajustes na ponta direita da barra, com os submenus Colunas e Densidade, expandir 10 linhas e recolher todas, Exportar, limpar filtros, tela cheia e restaurar o padrão. Densidade pelo trio `density`, `defaultDensity` e `onDensityChange`, no retrato. A célula com texto cortado mostra o texto inteiro ao passar o ponteiro.
- `DataGrid`, filtros: funil no título das colunas que filtram, que abre o filtro do tipo num painel: texto, número, data, booleano e conjunto de valores com busca, até duas condições por coluna, combinadas por E ou OU. `Alt+↓` no título abre o filtro, e o menu da coluna também. Fatia `filter`, com `defaultFilter` e `onFilterChange`: condições em grupos E/OU, serializáveis, no retrato e na consulta do servidor. `filterApplyMode="button"` só filtra no Aplicar. Na coluna, `filter` escolhe o tipo ou tira o funil, `filterOperators` troca os operadores e `filterOptions` dá os valores do conjunto no servidor. Operadores de fábrica em `dataGridFilterOperators`. A grade vazia por filtro oferece limpar. Tipos `DataGridFilter`, `DataGridFilterCondition`, `DataGridFilterKind`, `DataGridFilterLogic`, `DataGridFilterOperand`, `DataGridFilterOperator` e `DataGridFilterApplyMode`.
- `DataGrid`, sumarização: `summary` na coluna, `'sum'`, `'avg'`, `'count'`, `'min'`, `'max'` ou um agregador próprio, desenha a linha de totais presa ao rodapé, sobre as linhas filtradas de todas as páginas, alcançada pelo teclado. No servidor, a consulta traz `summaries` e `summaryValues` recebe a resposta. Agregadores de fábrica em `dataGridAggregators`. Tipos `DataGridAggregator` e `DataGridAggregatorId`.
- `DataGrid`, árvore: `getChildren` põe os filhos de cada linha na mesma grade, recuados, com `aria-level`, `aria-posinset` e `aria-setsize`, abertos e recolhidos pelo mesmo `expandedIds` do detalhe. A busca e o filtro mantêm o caminho até quem atende; a ordem vale entre irmãos; a paginação e o total são pelas raízes. Filhos `undefined` ainda não carregaram: com `rowHasChildren`, a linha aberta fica em carga até o produto trazê-los. Não se combina com `renderDetail`.
- `DataGrid`, exportação: o menu da tabela exporta as colunas na ordem da tela e as linhas filtradas na ordem atual, com os totais, ou só as selecionadas, ou só a página. O CSV vem no núcleo, `dataGridCsvExporter`, em UTF-8 com BOM e separador `;`; na árvore, com os ramos abertos e o nível na primeira coluna. Outros formatos entram por `exporters`, cada um um `{ id, label, export(model) }` que recebe o modelo com o texto exibido e o valor cru de cada célula. Tipos `DataGridExporter`, `DataGridExportModel`, `DataGridExportScope`, `DataGridExportColumn`, `DataGridExportRow` e `DataGridExportCell`.
- `Menu`: submenu, pelo `items` no próprio item. Abre ao lado, pela seta para a direita, pelo Enter ou ao passar o ponteiro, e a seta para a esquerda ou o Esc voltam ao item pai.
- `Pagination`: seletor de itens por página, com `pageSizeOptions` e o trio `pageSize`, `defaultPageSize` e `onPageSizeChange`. Ao trocar o tamanho, a página passa à que contém o primeiro item da atual. Com o seletor, o componente fica na tela mesmo com uma página só.
- `Pagination`: `showFirstLast`, os passos para a primeira e a última página.
- Ícones curados `IconSliders`, `IconChevronBarLeft` e `IconChevronBarRight`.
- `ChartArea` e `ChartLine`: `showGrid`, como no `ChartTimeline`; `false` tira as linhas de referência e a do zero. O `CardMetric.Chart` desenha sem elas.
- `ChartTooltip`: `total: false` na coluna calculada deixa a linha de total sem ela, como o percentual de uma soma com negativos.
- `CardMetric`, o cartão de um indicador. O produto o monta com o `Card.Header` e as partes `CardMetric.Body`, `CardMetric.Value`, `CardMetric.Trend`, `CardMetric.Bar` e `CardMetric.Chart`, e põe no cabeçalho as ações que quiser.
  - `onActivate` cobre o cartão com um botão nomeado "Abrir detalhes de" e o título, abaixo dos controles de dentro: o clique num controle não abre o detalhe.
  - `loading`, `updating` e `error` chegam às partes: esqueleto em cada uma, a linha de atualização no topo, ou a mensagem no lugar do valor.
  - `Value` desce na escala tipográfica oficial até o valor caber inteiro, sem breakpoint próprio. Com `formatTooltipValue`, o valor que aparece pode sair compacto, e o exato vai para o balão e para a impressão.
  - `Trend` mostra a primeira comparação no selo e todas no balão, com a cor pelo sinal e pela `polarity`. `change` é fração, a unidade do `formatPercent`.
  - `Bar` mostra a composição de um total, horizontal ou vertical, com `palette`, `paletteOrder` e o agrupamento dos positivos pequenos no balão. O negativo ocupa a magnitude, tracejado.
  - `Chart` desenha área ou linha sem eixos no espaço que sobra no cartão, com `showTooltip` e `onPointClick` do gráfico.
  - `Body` com `orientation="horizontal"` põe as partes lado a lado.
- `Card`: `size="sm"`, com menos respiro, o título até a terceira linha e a descrição até a segunda, em largura inteira e abaixo do `trailing`.
- `Card.Header`: `trailingWhenNarrow`, para o `trailing` que não cabe ao lado do título numa linha. `keep`, o padrão, mantém a disposição de sempre; `wrap` o desce para baixo do título; `hide` o esconde também do leitor de tela e do Tab, e por isso serve só a informação repetida em outro lugar, nunca à única via de uma ação.
- As partes do `Card` aceitam as propriedades nativas, o `ref` e a `className`, como pede a convenção de API.

### Alterado

- `Pagination`: `pageCount` deixa de ser obrigatório; sem ele, o total de páginas sai de `totalItems` e do tamanho da página.
- Os formatadores de número, moeda, percentual, data e hora reaproveitam o `Intl` de cada localidade e opção, em vez de montar um a cada chamada.

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
