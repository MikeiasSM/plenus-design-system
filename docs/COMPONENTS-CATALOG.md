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
| `SplitButton` | Ação principal à vista, com as variações dela num menu colado ao lado. | Disponível |
| `ButtonTile` | Ação em ladrilho, com ícone acima do nome, para paletas de inserção. | Disponível |
| `Toolbar` | Agrupa controles de uma mesma superfície, com navegação por setas. | Disponível |

O `ButtonIcon` existe para quando o texto não cabe ou repetiria o que o contexto já diz: o filtro ao lado da busca, o fechar, a ação de uma linha. O nome é obrigatório e vai em `label`, que o leitor de tela ouve e a dica mostra a quem passa o ponteiro ou chega pelo teclado. Havendo espaço para o texto, o `Button` com texto é a escolha: ícone sozinho pede que a pessoa adivinhe.

Quando a ação leva a outra página, `Button` e `ButtonIcon` recebem o destino em `href` (ou o componente de link da aplicação em `as`, com `linkProps`) e viram link de verdade, com o mesmo visual: abrem em outra aba, têm o endereço copiável e o leitor de tela anuncia "link". Operação que muda dados continua sendo botão.
O `Button` leva o ícone como filho, antes do texto: `<Button><IconPlus />Novo pedido</Button>`.

Além das variantes de peso (`primary`, `secondary`, `soft`, `ghost`) e das de perigo, o `Button` tem duas de uso próprio. `variant="neutral"` é o tonal sem a cor da marca: fundo `--pl-color-surface-muted`, borda transparente na mesma medida e texto `--pl-color-text`, um passo mais escuro no hover e o `--pl-color-border-strong` pressionado, sem sombra. `variant="link"` é a ação no meio de um texto: fica em linha, sem respiro nem borda, herda a fonte de quem o cerca (e ignora `size`), na cor `--pl-color-primary-active`, sempre sublinhado, sem sombra no hover, e o foco é um contorno que acompanha a quebra de linha, e não o halo. As duas valem também como link, com `href` ou `as`.

O botão que alterna, com `aria-pressed="true"`, mostra o estado ligado em qualquer variante, no tonal da marca: fundo `--pl-color-primary-container`, borda `--pl-color-primary-line` e texto `--pl-color-on-primary-container`. A `Toolbar` não desenha esse estado: ele é do `Button` e do `ButtonIcon`, dentro ou fora da barra.

A ação que não vale no momento diz por quê com `disabledReason`, junto de `disabled`. O botão deixa o `disabled` nativo e fica com `aria-disabled="true"`: continua na tabulação, não responde a clique, Enter nem Espaço, e o motivo, num texto oculto ao lado, o descreve por `aria-describedby`, somado ao do consumidor. Como link, ele perde o destino como antes, mas volta à tabulação. No `ButtonIcon`, a dica mostra "`label` — motivo". Sem `disabledReason`, o desabilitado é o de sempre, fora da tabulação.

A aparência do `Button` e do `ButtonIcon` aceita ganchos, lidos com o valor da variante como reserva e nunca declarados pela biblioteca: o produto os define no próprio botão, pela `className` ou pelo `style`, ou num ancestral. São `--pl-button-bg`, `--pl-button-fg` e `--pl-button-border` (repouso), `--pl-button-bg-hover`, `--pl-button-bg-active` (pressionado) e `--pl-button-bg-pressed` (ligado, com `aria-pressed`). O botão primário pinta o hover e o pressionado com `--pl-color-primary-fill-hover` e `--pl-color-primary-fill-active`, que seguem o texto sobre a cor da paleta (`TOKENS-REFERENCE-COLORS.md`).

O `ButtonIcon` tem o tamanho `xs`, só dele (`ButtonIconSize`): um quadrado de 24px com ícone de 14px e raio `--pl-radius-sm`, para a ação numa linha densa ou dentro de um campo; com o dedo como ponteiro, cresce como os demais. `count` põe o selo de contagem no canto superior direito, o mesmo do `Badge variant="count"`, fora da leitura; o nome do botão passa a ser `countLabel(count)`, por padrão "`label`, n". Zero ou ausente, sem selo. A dica do `ButtonIcon` repete o `label` e por isso não o descreve: o nome é anunciado uma vez.

O realce de hover vale só onde há ponteiro que paira (`@media (hover: hover)`), em todos os componentes, para não ficar preso depois de um toque. Os controles interativos — `Button`, `ButtonIcon`, `ButtonTile`, os itens de `Menu`, de `List`, de `Tabs`, de `Pagination` e do `SegmentedControl`, os itens do trilho e do submenu da `Sidebar`, o `CardMetric` com `onActivate` e as linhas clicáveis do `DataGrid` e do `SortableList` — mostram o estado pressionado (`:active`) em qualquer ponteiro, um passo mais forte que o hover: o fundo `--pl-color-primary-active` no botão primário; nos itens da `Sidebar`, o fundo leve do item atual (`--pl-color-primary-tint`), sem valer no item atual nem no desabilitado; e o fundo selecionado ou o neutro mais escuro nos demais. O texto sobre o fundo pressionado mantém 4,5:1, medido por `npm run check:contraste`. O que só aparece no hover, como as ações do título de coluna do `DataGrid`, o eixo `onHover` do `ChartTimeline` e os rótulos `onHover` do `ChartGauge`, fica sempre visível onde não há hover.

Numa ação assíncrona, o produto liga `loading` de forma síncrona no próprio handler do `onClick`, antes de esperar a resposta, e o desliga quando ela termina, com sucesso ou falha; na `SaveBar`, faz o mesmo com `saving`. Com `loading`, o botão mostra o indicador, mantém o foco e ignora o clique seguinte. O `Button` não lê o valor que o `onClick` devolve. O resto também é do produto: descartar a resposta que chega fora de ordem, como na busca remota do `ComboBox`, e tornar a operação idempotente no servidor, pois há reenvio por timeout e duas abas.

O `ButtonTile` é o botão de uma paleta — os blocos que um editor insere, os tipos de registro que uma tela cria. Ícone e nome ficam visíveis, e uma descrição curta é opcional. Com `selected`, ele alterna e expõe `aria-pressed`. Com `hideLabel`, só o ícone aparece: o rótulo segue como nome do botão e abre a dica, antes da descrição, que continua sendo a única descrição ligada ao botão; o ladrilho guarda a mesma medida. O rótulo visível quebra entre palavras e hifeniza a palavra que não cabe, pelo `lang` do documento. Fora de uma grade de opções equivalentes, a escolha é o `Button`.

O `SplitButton` é a ação principal com as variações dela: "Salvar" à vista, e "Salvar como rascunho" e "Salvar uma cópia" no menu. São dois botões colados num grupo com o nome da ação. O primeiro aciona `onAction`. O segundo é um `ButtonIcon` com o nome "Mais opções de <label em minúsculas>" (`menuLabel`) e abre o `Menu`, com os mesmos `items`: atalho, grupos com divisor, item desabilitado, tom de perigo e submenu. `onMenuAction` recebe o `key` escolhido. A ação principal não troca para a última escolha do menu: mudar o rótulo sem a pessoa pedir faz errar o clique seguinte. Há as variantes `primary`, com um fio de 1px na cor do texto a 25% entre as partes, e `secondary`, com a borda dividida, nos tamanhos do `Button` e com os cantos de dentro retos. `disabled` trava as duas partes; um item desabilitado no menu não trava a principal. Ações sem relação com a principal ficam num `Menu` à parte, e não no menu do `SplitButton`.

A `Toolbar` agrupa os controles de uma superfície, como a barra de formatação de um editor: um único ponto de tabulação e as setas percorrendo os controles, conforme o padrão de barra de ferramentas do WAI-ARIA. Ela pode ficar fixa no fluxo, presa ao topo ao rolar, ou flutuar ancorada a um elemento. Os controles são os do próprio catálogo. Um conjunto solto de botões sem relação entre si não é barra de ferramentas.

## 3. Formulários

| Componente | Papel | Situação |
| --- | --- | --- |
| `Field` | Cromo de campo: rótulo, ajuda, erro, contador e a fiação entre eles. | Disponível |
| `Label` | Rótulo associado a um controle. | Disponível |
| `InputText` | Entrada de texto de linha única. | Disponível |
| `InputNumber` | Entrada numérica, inteira ou decimal. | Disponível |
| `InputPassword` | Entrada de senha, com revelação explícita. | Disponível |
| `PinInput` | Código de verificação em caixas, digitado ou colado de uma vez. | Disponível |
| `InputCurrency` | Entrada monetária. | Disponível |
| `Textarea` | Entrada de texto de múltiplas linhas. | Disponível |
| `Checkbox` | Escolha binária independente. | Disponível |
| `CheckboxGroup` | Escolha múltipla entre opções sempre visíveis. | Disponível |
| `RadioGroup` com `Radio` | Escolha única entre opções sempre visíveis. | Disponível |
| `Switch` | Alternância de um estado ativo. | Disponível |
| `SegmentedControl` | Escolha única entre poucos segmentos lado a lado. | Disponível |
| `Slider` | Ajuste de um valor num intervalo, por arrasto ou teclado. | Disponível |
| `RangeSlider` | Ajuste de uma faixa com dois polegares, que não se cruzam. | Disponível |
| `DatePicker` | Entrada de data, digitada ou escolhida em calendário. | Disponível |
| `DatePickerRange` | Escolha de um intervalo de datas em calendário, com atalhos definidos pelo produto. | Disponível |
| `Calendar` | Calendário solto na página, para ver a disponibilidade e escolher uma data ou um intervalo. | Disponível |
| `TimePicker` | Entrada de hora. | Disponível |
| `DateTimePicker` | Entrada de data e hora combinadas. | Disponível |
| `ColorPicker` | Escolha de cor entre amostras definidas pelo produto. | Disponível |
| `FileUpload` | Seleção de arquivos, por clique ou arrasto, com a lista dos envios. | Disponível |
| `FieldRow` | Linha de ajuste: rótulo e explicação de um lado, o controle do outro. | Disponível |
| `SaveBar` | Barra de alterações não salvas, com descartar e salvar. | Disponível |
| `SaveStatus` | Texto curto da situação do salvamento, com o indicador do estado. | Disponível |

`Field` é a moldura que os campos deste catálogo já usam por dentro, exposta para quem precisa montar um campo que o Design System não entrega — uma máscara de documento, um seletor de arquivo, um autocompletar de endereço. Ele recebe uma função e devolve o `id`, a descrição acessível já montada, o estado de inválido e a classe com o visual dos campos do sistema, no tamanho pedido; o controle continua sendo de quem o escreve, e a classe própria dele, somada à entregue, vence.

A fronteira com `Label` é de alcance: `Label` nomeia **um** controle; `Field` cuida do conjunto — rótulo, ajuda, erro e contador — e da amarração entre eles, que é a parte que mais se erra. Um campo do próprio catálogo nunca deve ser envolvido por `Field`: ele já tem o seu.

O `Field` aceita duas fendas. `labelAddon` vai ao lado do rótulo, fora do `<label>`, numa linha de cabeçalho: um selo de "Opcional", uma dica ou um link como "Esqueci a senha". Ele não entra no nome do campo e pode ser interativo. `aside` divide a linha com o controle, como o botão que completa o campo; o rótulo fica acima dos dois, a mensagem e o contador abaixo dos dois, com o topo do `aside` alinhado ao do controle, e ele fica fora da descrição do campo. `InputText`, `InputPassword`, `Textarea`, `Select` e `ComboBox` repassam as duas propriedades ao `Field` que usam por dentro.

O `InputText` aceita um ícone decorativo à frente do texto, como a lupa de uma busca. O nome do campo continua no rótulo. `mask` formata o que se digita ou cola, por um padrão (`0` dígito, `a` letra, `*` letra ou dígito, o resto literal) ou por uma função; o campo, o `onValueChange` e o `name` ficam com o texto formatado, e `onRawValueChange` entrega o cru. É mecanismo: a biblioteca não traz máscara de CPF, CNPJ ou telefone, que são do produto.

O fim do `InputText` aceita controles. `end` é uma fenda dentro da borda, depois da `unit`, que não é decorativa: aceita um botão, que precisa do próprio nome. `clearable` põe um botão de limpar, com o nome `clearLabel` ("Limpar" por padrão), só quando há texto e o campo não está desabilitado nem somente leitura: ele esvazia o campo pelo evento `input` nativo, o que chama `onChange` e `onValueChange('')` também no campo não controlado, e devolve o foco ao campo. `loading` põe um `Spinner` decorativo ao fim e anuncia o `loadingLabel` ("Carregando" por padrão) numa região `role="status"` oculta, montada enquanto a propriedade existir: passe `loading={false}` desde o início, para a região já estar lá quando ligar. O campo não recebe `aria-busy`. Com qualquer uma das três, o invólucro passa a desenhar a borda, o fundo e o foco, por `:focus-within`, e o `<input>` fica sem borda; a altura, os estados de erro, desabilitado e somente leitura e o recuo do texto e do ícone não mudam. A `className` continua indo ao `<input>`: a largura do campo vem do lugar em que ele é montado. A cor do ícone inicial lê `--pl-input-icon-color`, com o terciário como padrão.

`SegmentedControl` e `RadioGroup` fazem a mesma escolha única, e a fronteira é a forma: o `RadioGroup` é a lista de opções de um formulário, com legenda, ajuda e erro; o `SegmentedControl` é um controle compacto, de poucas opções curtas, que muda o que a tela mostra — o período de um painel, a lista ou os cartões. Por baixo ele também é rádio nativo. Com mais de cinco opções, ou opções longas, a escolha é `Select`. A fronteira com `Tabs` é o painel: a aba troca o conteúdo que ela controla; o segmento muda um valor.

Cada item do `SegmentedControl` aceita `className`, somada à do segmento; `trailing`, conteúdo visível depois do rótulo, como uma contagem, decorativo e fora do nome (`aria-hidden`); e `description`, texto oculto ligado ao rádio por `aria-describedby`. O segmento leva `data-selected` quando é o escolhido e `data-disabled` quando está desabilitado, para o produto estilizá-lo. Quando o trilho não cabe e rola, o escolhido entra na vista ao montar e a cada troca, pela rolagem do próprio controle, sem rolar a página nem outros ancestrais.

`Slider` e `RangeSlider` ajustam um valor ou uma faixa num intervalo contínuo, como raio de entrega, volume ou faixa de preço; quando o número exato importa mais que a posição, a escolha é `InputNumber`. O valor fica escrito à direita do rótulo, formatado por `format` (as opções do `Intl.NumberFormat`), e o mesmo texto vai ao `aria-valuetext` de cada polegar; não há balão sobre o polegar, que o dedo cobriria. As `marks` só mostram: o encaixe é sempre o `step`. Os polegares do `RangeSlider` não se cruzam, `minDistance` mantém um intervalo mínimo, e arrastar entre eles move a faixa inteira com a mesma largura; pelo teclado, cada polegar anda sozinho. `onValueChange` acompanha o arrasto e `onValueCommit` chega ao soltar, para o filtro que consulta o servidor só no fim. O trilho fica na borda de controle a 3:1 (`--pl-control-border`), e o preenchimento, a borda do polegar e o anel de foco, em `--pl-color-primary-hover`.

`CheckboxGroup` está para o `Checkbox` como o `RadioGroup` está para o `Radio`: a legenda, a ajuda, o erro e o valor do conjunto ficam no grupo, e cada `Checkbox` com `value` dentro dele lê o próprio estado dali. A fronteira com o `RadioGroup` é a quantidade: lá a escolha é uma só; aqui são quantas a pessoa quiser. Com lista longa ou que pede busca, a escolha é o `ComboBox` múltiplo.

O `RadioGroup` e o `CheckboxGroup` aceitam `orientation`: na vertical, o padrão, uma opção por linha; na horizontal, lado a lado e com quebra de linha quando não couberem, para poucas opções curtas.

Com `variant="card"`, o `RadioGroup` e o `CheckboxGroup` põem cada opção num cartão: borda forte, raio médio e respiro de 12px; a opção escolhida ganha a borda e o anel interno da marca sobre o fundo `--pl-color-primary-container`. O cartão inteiro é o `<label>` da opção, então qualquer ponto dele marca o controle, que continua rádio ou caixa nativa, com as mesmas setas, tabulação e envio. O foco acende o cartão, e não só o controle. Nada interativo vai dentro do cartão.

`labelAddon`, no `RadioGroup` e no `CheckboxGroup`, põe um conteúdo ao lado do texto da legenda, como um botão de ajuda ou um selo. Com ele, o texto da legenda ganha um id e o grupo passa a se nomear por `aria-labelledby` a esse texto, então o complemento fica fora do nome: o grupo continua "Forma de pagamento", e não "Forma de pagamento Saiba mais". Um complemento interativo continua dentro da `<legend>`, entra na tabulação antes das opções e se anuncia pelo próprio nome; o `aria-labelledby` ou o `aria-label` que o consumidor passar vence. Sem `labelAddon`, a legenda nomeia o grupo como antes.

`Checkbox`, `Radio` e `Switch` aceitam `description`, um texto secundário abaixo do rótulo, no tamanho de legenda e no tom secundário. Ele fica dentro do `<label>`, na área clicável, e descreve o controle pelo `aria-describedby`, somado ao do consumidor e antes da ajuda e do erro; o nome passa a vir só do texto do rótulo, por `aria-labelledby`. Por estar na área clicável, a descrição é só texto. Sem rótulo visível, ela fica fora do `<label>` e descreve o controle do mesmo jeito. O `Switch` aceita também `labelAddon`, ao lado do rótulo e fora do `<label>`: não entra no nome nem liga a chave, e só aparece com `label`.

A marca do `Checkbox`, o visto e o traço do indeterminado, tem a cor de `--pl-color-on-primary`, o texto sobre a cor da marca: com uma paleta própria de cor clara, ela sai escura. A caixa marcada ou indeterminada e desabilitada guarda o fundo e a borda da marca, apagados pela opacidade do desabilitado; só a desmarcada desabilitada fica no fundo `--pl-color-surface-muted`. As caixas de seleção do `DataGrid` e da `Table` seguem o mesmo desenho.

O `InputNumber` aceita `unit`, a unidade ou o sufixo ao fim do campo — `%`, `kg`, `dias`. Ela fica fora do rótulo e do valor, e o leitor de tela a ouve como descrição do campo.

O `InputPassword` entrega o texto a cada mudança por `onValueChange`, ao lado do `onChange` nativo, como os outros campos de texto. Sem o botão de mostrar (`showToggle={false}`), o texto não reserva mais o espaço dele no fim.

O `PinInput` é o campo do código de verificação, de confirmação ou de retirada. As caixas são só desenho, fora da árvore acessível, sobre um único `<input>` transparente: o leitor de tela ouve um campo com rótulo e ajuda, colar entra de uma vez e o preenchimento automático do código recebido por mensagem (`autocomplete="one-time-code"`, no tipo numérico) chega inteiro. O cursor fica sempre no fim, e a caixa da vez ganha o foco e um cursor que pisca, parado com movimento reduzido. `type="numeric"`, o padrão, aceita dígitos, com o teclado numérico no celular; `"alphanumeric"` aceita letras e dígitos e escreve as letras em maiúsculas. O que se digita ou cola passa pelo tipo e é cortado em `length` (6 por padrão): "482-913" vira "482913", e o caractere que não vale não chama `onChange`. `onComplete` é chamado uma vez quando o código enche e não envia nada: verificar na hora ou num botão é escolha do produto. `mask` mostra pontos no lugar dos caracteres, só na tela. `groups`, como `[3, 3]`, desenha um traço entre os grupos, e o valor continua sem separador. A fronteira com o `InputText` com `mask` é a forma: lá, um texto formatado numa linha; aqui, um código curto de comprimento fixo, caractere por caixa.

`DatePickerRange` é um componente à parte do `DatePicker`, e não um modo dele, porque o valor é outro, `{ start, end }` em ISO, e o campo é um gatilho que abre o painel, sem texto a digitar. O nome segue o tipo e depois a especialização. O primeiro clique no calendário marca o início e o segundo o fim, trocando as pontas se vier antes; só `Aplicar` grava o valor, e `Limpar` o esvazia. Os atalhos, como "Últimos 7 dias" e "Este mês", são do produto: `shortcuts` recebe `{ label, range }`, e `range` é uma função, chamada com o painel aberto, para que "Hoje" valha o dia da escolha. Sem a propriedade não há atalho. `defaultDateRangeShortcuts` é uma lista pronta e opcional (Hoje, Ontem, Últimos 7 dias, Últimos 30 dias, Este mês e Mês passado) que o produto passa inteira, filtra ou substitui. O atalho cujo intervalo sai de `min` e `max` fica desabilitado. Os dois aceitam `granularity="month"` ou `"year"` para escolher a competência ou o exercício, sem peça nova. O painel mostra uma grade de 3 por 4, com os doze meses do ano ou doze anos por página, e as setas do cabeçalho trocam o ano ou a página. Na grade, `←` e `→` andam um, `↑` e `↓` andam três, `Home` e `End` vão ao começo e ao fim da linha, e passar da borda vira o ano ou a página. Não há troca de nível clicando no título. O valor é o primeiro dia do período, `2026-06-01` ou `2026-01-01`, no mesmo texto ISO de sempre, e no intervalo as duas pontas seguem a regra. No `DatePicker`, a máscara vira `mm/aaaa` ou `aaaa`, e `+` e `-` andam um mês ou um ano; no gatilho do `DatePickerRange`, as setas deslocam o intervalo um período ou três. O mês ou o ano atual fica em negrito e sublinhado, como o dia de hoje. `min` e `max` recusam só o período que não toca a faixa, e `isDateUnavailable` recebe o primeiro dia do período. O padrão é `"day"`. Nos dois, o dia recusado por `isDateUnavailable` fica riscado e se anuncia com ", indisponível".

`Calendar` é o miolo do painel do `DatePicker` solto na página, sem borda nem fundo próprios: quem quer moldura o põe num `Card`. Mostra um mês por vez e escolhe uma data, com `selectionMode="single"`, o padrão, ou um intervalo, com `"range"`, em que o primeiro clique marca o início e o segundo, o fim, trocando as pontas se vier antes. O valor tem o formato dos seletores: texto ISO, ou `{ start, end }` no intervalo, controlado por `value` e `onChange` ou não controlado por `defaultValue`, e a escolha vale na hora, sem rascunho nem Aplicar. `minValue` e `maxValue` apagam os dias fora da faixa. O dia recusado por `isDateUnavailable` também fica riscado, além de apagado, e se anuncia com ", indisponível", para a cor não ser o único sinal; os dois continuam focáveis e não se escolhem. O grupo tem o nome de `aria-label`, e a grade, o do mês. Marcar eventos ou contagens nos dias fica fora do escopo.

`DatePicker`, `TimePicker` e `DateTimePicker` aceitam números e os separadores: a `/` da data, os `:` da hora e, no `DateTimePicker`, o espaço entre as duas. Sem separador digitado, a máscara o insere quando chega o dígito do grupo seguinte: `2105` mostra `21/05`. O separador digitado fecha o grupo em andamento: o grupo de um dígito ganha o zero à esquerda e o cursor passa ao seguinte, então `1/3` mostra `01/3` e `8:3` mostra `08:3`. O separador no começo do campo, logo depois de outro, fora do grupo em que cabe ou depois do último grupo não faz nada. O espaço só fecha a data com o ano de 2 ou 4 dígitos; antes disso, é ignorado. O texto colado é lido do mesmo jeito, `1/3/2026` como 01/03/2026, e a data em ISO, como `2026-03-09`, continua aceita. Os separadores ficam no texto, e reescrever um grupo no meio, como o dia de 09/03/2026, preserva o resto. Os campos têm teclas de atalho que não aparecem no campo: `H` ou `h`, `+` e `-`, inclusive os do teclado numérico. O valor inteiro e válido grava na hora, e no `DateTimePicker` isso pede a data e a hora completas; durante a digitação o valor nunca se apaga, e só esvaziar o campo por inteiro passa `onValueChange(null)`. Ao confirmar com Enter ou sair do campo, o que foi digitado pela metade é completado e validado: sem separador digitado, pelos dígitos; com ele, por grupo. Quando um atalho troca o valor, o novo é anunciado numa região de status oculta: a data por extenso, "22 de novembro de 2026", a hora, "14:37", ou as duas, "22 de novembro de 2026, 14:37". A digitação comum não é anunciada.

| Campo | `H` | `+` e `-` | Completa ao sair |
|---|---|---|---|
| `DatePicker` | Hoje, no lugar do que houver. | Um dia; vazio parte de hoje, e texto inválido, do último valor válido. | `1` é o dia 1 do mês e ano atuais, `215` é 21/05, `112` é 11/02, `2105` é 21/05 e `260326` é 26/03/2026. Seis dígitos têm ano 20xx. Cinco ou sete dígitos e data inexistente são inválidos. Com a barra digitada, `1/3` é 01/03, `1/12` é 01/12 e `1/3/26` é 01/03/2026; o ano precisa ter 2 ou 4 dígitos, e `1/3/2` e `1/3/202` são inválidos. |
| `TimePicker` | A hora atual exata, sem arredondar para `step`. | Uma hora com o cursor na hora, um minuto com o cursor no minuto, com a virada de relógio; vazio parte da hora atual. | `8` é 08:00, `14` é 14:00, `830` é 08:30 e `1430` é 14:30. Com os dois pontos digitados, o dígito único depois deles é a dezena do minuto: `8:` é 08:00 e `8:3` é 08:30. `25`, `1275` e cinco dígitos ou mais são inválidos. |
| `DateTimePicker` | Data e hora atuais. | Um dia, uma hora ou um minuto, conforme o cursor, e a virada passa para a data. | A data como no `DatePicker` e a hora, depois do espaço, como no `TimePicker`; sem espaço, o texto é só a data, e a hora é 00:00, gravada só ao confirmar ou sair. `1/3/2026 8:3` é 01/03/2026 08:30. |

O valor inválido, incluindo o que cai fora de `min` e `max`, não muda o valor nem chama `onValueChange`: o texto fica no campo, para a pessoa corrigir, o campo recebe `aria-invalid` e mostra a mensagem do componente no lugar do erro, como "Data inválida." ou "Data fora do intervalo permitido.", e "Hora inválida." e "Hora fora do intervalo permitido." na hora. O `error` do produto prevalece sobre ela, e a mensagem some quando o valor fica válido. `onInvalidText(text, reason)` recebe o texto inválido ao confirmar ou sair do campo, com o motivo: `'invalid'` para o texto que não é data ou hora, e `'outOfRange'` para o que cai fora de `min` e `max` ou num dia barrado por `isDateUnavailable`. O `onInvalid` nativo continua indo ao `<input>`.

No `DatePickerRange`, com o painel fechado, `H` marca hoje como início e fim, e as setas deslocam o intervalo inteiro: `←` e `→` um dia, `↑` e `↓` sete, e sem intervalo partem de hoje. A seta que levaria o intervalo para fora de `min` e `max` não faz nada, e cada deslocamento chama `onValueChange` e é anunciado numa região de status oculta, no formato do gatilho, "10/11/2026 – 16/11/2026". O painel abre com Enter, Espaço ou Alt+`↓`.

O `ColorPicker` escolhe entre amostras que o produto define, cada uma com nome — a cor de uma etiqueta, o destaque de um bloco. Não é seletor livre de cor: não há espectro nem campo hexadecimal. Por baixo são rádios nativos, e o nome de cada amostra é o que o leitor de tela ouve. Uma opção "Padrão", sem cor, é opcional.

O tamanho das amostras e o espaço entre elas vêm do `size`, e o produto os ajusta por duas variáveis definidas em qualquer ancestral: `--pl-color-picker-size`, o diâmetro da amostra (20, 28 ou 36px por padrão), e `--pl-color-picker-gap`, o espaço entre elas (`--pl-space-2` no `sm`, `--pl-space-3` no `md` e no `lg`). O componente só as lê, com o valor do `size` como padrão. Com o dedo como ponteiro, o espaço continua crescendo para a área de toque de 44px.

O `FileUpload` cuida da escolha dos arquivos e da lista que mostra o andamento, e não envia nada: o produto recebe os arquivos aceitos, faz o envio e informa a cada item o progresso, a conclusão ou o erro. Tipo e tamanho são conferidos na escolha, e o que for recusado volta ao produto com o motivo. Quem não arrasta escolhe pelo seletor de arquivos nativo, que é o que recebe o foco.

Com `acceptPaste`, o `FileUpload` recebe também o arquivo colado, como uma captura de tela copiada, pela mesma conferência de tipo e tamanho. Só o colar com o foco dentro do componente chega a ele, e o `onPaste` do consumidor continua sendo chamado. `labels` troca os textos da zona, `instruction` e `button`. `hideLabel` tira o rótulo da vista, e ele continua nomeando o seletor. `showRestrictions={false}` tira da vista a linha dos tipos e do limite, que segue na descrição do seletor. Em cada item, `statusLabel` vence "Enviando" e "Enviado", como "Processando"; enviando, ele também nomeia a barra de progresso, que fica indeterminada sem `progress`.

Com o dedo como ponteiro principal (`@media (pointer: coarse)`), os formulários se ajustam sozinhos, sem opção de desligar: os campos de texto passam a 16px, para o iOS não dar zoom ao focar; as alturas pequena e média sobem a 44px, e o `Button` grande, o `ButtonIcon` grande e o `SegmentedControl` grande, a 48px; os números e as setas da `Pagination` passam a 44px; e `Checkbox`, `Radio`, `Switch` e as amostras do `ColorPicker` ganham área de toque de 44px sem mudar o desenho. Para isso, os itens de um grupo de `Checkbox` ou `Radio` ficam sem espaço entre as linhas, as opções lado a lado mantêm o espaço entre si, e as amostras de cor se afastam. O computador não muda.

O `FieldRow` é a linha de uma lista de ajustes: o rótulo e a explicação à esquerda, o controle à direita, descendo para sob o texto quando a linha estreita. Ele rotula e descreve um controle só, o que o `Field` também faz, e a fronteira é o desenho: o `Field` empilha rótulo, controle e mensagem, para formulário; o `FieldRow` alinha em linha, para ajustes que valem na hora, como chaves e limites, em cartão sem respiro. A `SaveBar` serve ao formulário inteiro, no lugar do salvar por cartão: o produto diz quando há alteração pendente, e ela oferece descartar e salvar, presa ao topo ou ao pé da área de rolagem em que for montada, conforme o `placement`. Fora do `AppShell`, presa à borda da janela, ela respeita a safe area (`--pl-safe-top` e `--pl-safe-bottom`); dentro dele, que já a respeita, o deslocamento é zero. O que ela não faz é guardar o estado do formulário ou saber o que mudou. Fechada, ela tira os botões do foco, e o foco que estava num deles cai no `body`: ao salvar ou descartar, o produto o devolve a um ponto do formulário, como o campo editado.

O `SaveStatus` é o texto curto da situação do salvamento, no lugar do texto montado à mão num rodapé ou numa barra: o `status` (`idle`, `dirty`, `saving`, `saved` ou `error`) escolhe o indicador e o produto escreve o texto, como "Rascunho salvo às 10:42". `saving` mostra o `Spinner` pequeno, `saved` o sinal de pronto no tom de sucesso e `error` o de erro no tom de perigo; `idle` e `dirty` ficam só com o texto, porque a alteração pendente não é erro nem aviso e o texto já a diz sem depender de cor. O texto tem o tamanho de legenda, em tom terciário, numa região `role="status"` sempre montada, para a mudança ser lida sem tirar o foco. Na situação do `AppShell.PageFooter`, que já é uma região de status, ela não cria a sua, e o texto é lido uma vez só. A fronteira com a `SaveBar` é a ação: a `SaveStatus` só informa e não tem botão, e cabe no `start` do `Card.Footer` ou no rodapé da página. Quem salva, e quando, é do produto.

O controle do `FieldRow` vem como função filha, que recebe `{ id, describedBy, labelId }`. O `id` e o `describedBy` vão ao controle um a um, como `id={id}` e `aria-describedby={describedBy}`, e não espalhados nele:

```tsx
<FieldRow label="Desconto sem aprovação" description="Até este valor, o pedido segue direto.">
  {({ describedBy, id }) => <InputNumber id={id} aria-describedby={describedBy} />}
</FieldRow>
```

O `SegmentedControl`, o `RadioGroup` e o `CheckboxGroup` são grupos, não campos: o `<label for>` não nomeia o `div` ou o `fieldset`. Para eles, a função entrega o `labelId`, o id do rótulo da linha, que vai ao `aria-labelledby` do grupo; o `label` do grupo fica de fora, e a linha o nomeia uma vez só, sem a legenda repetida. O `labelId` não lido não põe id no rótulo. Sem `label`, `aria-labelledby` nem `aria-label`, o grupo avisa no console em desenvolvimento.

```tsx
<FieldRow label="Frequência">
  {({ labelId }) => <SegmentedControl aria-labelledby={labelId} items={periodos} />}
</FieldRow>
```

O controle que se nomeia pelo conteúdo, como um `Button`, usa só `describedBy`.

O título do `FieldRow` só é `<label>` quando há controle a apontar: quando a função não lê o `id`, ou o filho direto vem sem `id` informado, ele é um `<span>` com o mesmo desenho, e continua nomeando o grupo pelo `labelId`. `labelAddon` vai ao lado do título, fora do rótulo, como um selo, e não entra no nome do controle. `align` alinha o texto e o controle ao centro, o padrão, ou ao topo, com `start`, para o controle alto, como um `Textarea`. Numa lista de linhas, `--pl-field-row-label-width`, definida pelo produto num ancestral, dá a todos os textos a mesma largura (`flex: 0 0` nela) e o resto ao controle (`flex: 1 1 0`); quando a linha estreita, o controle continua descendo para sob o texto. Indefinida, a linha fica como sempre foi.

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

A opção do `Select` também aceita `group`, com o mesmo comportamento: as opções seguidas de um mesmo grupo aparecem juntas, sob o título, e as setas passam de um grupo ao outro. O gatilho fechado mostra só o rótulo.

Busca no servidor e listas longas. No `ComboBox`, `loading` troca as opções por uma linha "Carregando", com o indicador, e marca a lista com `aria-busy`; as opções antigas somem, porque resultado velho sob texto novo confunde. Uma região de status oculta anuncia a espera uma vez e a contagem quando o resultado chega. No `ComboBox` e no `Select`, `onLoadMore` com `hasMore` pede a próxima página quando a rolagem chega a três opções do fim, ou quando a seta desce da última, uma vez por página; "Carregando mais" aparece no rodapé sem tirar o foco nem mover a rolagem, e a contagem é anunciada ao chegar. Acima de 200 opções, as duas listas desenham só as linhas visíveis, sem propriedade a ligar, e cada opção diz a posição no total por `aria-setsize` e `aria-posinset`.

Na seleção múltipla, o `ComboBox` pode ter rodapé no painel. `selectAll` marca os itens habilitados do resultado da busca, sem desmarcar o resto; `clearable` desmarca tudo, inclusive o que a busca esconde. `confirmSelection` torna a marcação um rascunho: `onValueChange` é chamado uma vez, em "Aplicar", e Cancelar, Escape ou sair do campo descartam o que foi marcado. `labels` troca os textos do rodapé (`selectAll`, `clear`, `apply` e `cancel`) e, nos dois modos, os da espera (`loading`, `loadingMore` e `results`). Pelo teclado, o Tab do campo vai aos botões do rodapé, o Shift+Tab no primeiro volta ao campo, e o Tab no último devolve o foco ao campo e fecha o painel; Enter e Espaço no campo continuam marcando a opção em foco. Uma região de status anuncia a contagem a cada mudança. Sem as três propriedades o painel não tem rodapé.

## 5. Dados

| Componente | Papel | Situação |
| --- | --- | --- |
| `Avatar` | Representação visual de uma pessoa ou entidade. | Disponível |
| `AvatarItem` | Avatar ao lado de um título e uma descrição, numa linha que não estoura a largura. | Disponível |
| `AvatarGroup` | Avatares sobrepostos de quem participa, com o "+N" dos que não couberam. | Disponível |
| `Card` | Superfície que agrupa conteúdo, com cabeçalho, rodapé e imagem próprios. | Disponível |
| `CardMetric` | Indicador num cartão: valor, tendência, composição ou evolução, com ativação para o detalhe. | Disponível |
| `Badge` | Rótulo curto de estado ou categoria. | Disponível |
| `Tag` | Etiqueta operada: removível, como o filtro ativo, ou de alternar. | Disponível |
| `Kbd` | Tecla ou combinação de teclas, no texto, na dica, no botão ou no menu. | Disponível |
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

A altura da área rolável do `DataGrid` vem de `height`. Em pixels, a calha da barra vertical fica reservada (`scrollbar-gutter: stable`), e as colunas flexíveis não mudam de largura quando as linhas passam da altura. Com `fill`, a grade ocupa a altura imposta pelo contêiner. Com `auto`, ela cresce com as linhas até o `maxHeight`, em pixels, e só então rola; sem `maxHeight`, mostra todas as linhas, e a página é que rola. As colunas flexíveis dividem a largura útil da tela, medida fracionada e arredondada para baixo, e a soma delas nunca passa da tela, nem por fração de pixel.

O `Table` não desenha contorno externo. O contorno pertence a quem o envolve, normalmente um `Card`. Fora de um contêiner com borda, a tabela fica solta na página: a faixa do cabeçalho não tem linha em cima. A dica do `help` do título abre embaixo dele, onde cobre só o respiro da primeira linha, e não os filtros e o cabeçalho de página que costumam ficar em cima da tabela; sem espaço embaixo, ela inverte sozinha. A `Table` não rola na vertical: com muitas linhas em altura limitada, como o corpo de um `Card` de altura imposta, o excesso é cortado. Para esse caso, use o `DataGrid` com `height="fill"`. A coluna com `hideBelow` sai quando a largura da própria tabela, a do envoltório que rola e que vem do elemento pai, chega ao breakpoint do sistema que ele nomeia, medido por container query e não na janela: `sm` é 900px, `md` é 1180px e `lg` é 1280px. Uma tabela de 745px numa janela de 1280px esconde a coluna `lg`. O envoltório é o contêiner da medida, então uma `Table` dentro de um pai que se ajusta ao conteúdo, como uma coluna `auto` de `grid` ou um item flex sem largura, encolhe a zero: dê ao pai a largura, como `width: 100%` ou `flex: 1` com `min-width: 0` no item flex. O HTML sai com a coluna escondida pelo CSS, sem JavaScript, no servidor e na hidratação. O `hideBelow` também aceita uma largura em pixels, como `hideBelow={640}`, para a coluna sair numa medida que não é breakpoint do sistema: a regra `@container (max-width: 640px)` vai num `<style>` com `href` e `precedence` do React 19, que sobe ao `<head>` uma vez por valor, por mais colunas e tabelas que o usem, e sai no HTML do servidor antes da tabela, então a coluna também nasce escondida sem JavaScript. A coluna e as células levam o valor em `data-hide-below`, como os breakpoints.

O fundo da `Table` é o `--pl-color-surface`, o do `Card`. Sobre outra superfície, como uma faixa em `--pl-color-surface-muted` ou um painel com fundo próprio, `surface="inherit"` tira o fundo da tabela e deixa o do cabeçalho translúcido, um véu de 4% da cor do texto, que escurece no tema claro e clareia no escuro sobre qualquer fundo. Com `stickyHeader`, o cabeçalho que gruda passa por cima das linhas: o véu fica sobre a cor opaca de `--table-surface`, que o produto define com a cor da superfície em volta, num ancestral ou na `className` da tabela; sem ela, o cabeçalho continua translúcido.

A `Table.Toolbar` é a barra acima da tabela, com a busca e as ações dela. Ela pode vir como irmã antes da `Table` ou como filha dela; como filha, a `Table` a desenha antes do `<table>`, no mesmo contêiner, e o HTML segue válido; nos dois casos, ela fica parada quando a tabela rola de lado. É um grupo rotulado (`label`), e não `role="toolbar"`, que pede navegação por setas entre os controles e impede o uso do campo de texto da busca. O primeiro filho, em geral a busca, cresce até 360px; os demais ficam ao lado, e tudo quebra de linha quando falta espaço. Os itens se alinham pela base, para o campo com rótulo visível não esticar os controles ao lado. O respiro lateral é o da margem da tabela, para a busca alinhar com a primeira coluna.

O `Card.Header` nomeia o cartão, que é uma região com o nome do título. O título sai em `h3`, e `headingLevel` escolhe outro nível, de 1 a 6; o 1 serve ao cartão que é a própria página, como o de entrar. `icon` põe um ícone decorativo (`aria-hidden`, fora do nome) num ladrilho tonal de 28px, no fundo `--pl-color-primary-container` com o ícone em `--pl-color-on-primary-container` e o raio `--pl-radius-sm`, à esquerda do título e centrado na primeira linha dele, sem mudar a altura do cabeçalho; a descrição continua abaixo, na largura inteira. Com `href`, `linkProps` ou `as`, o título vira link, recebido conforme a seção "Link da aplicação", dentro do cabeçalho de título: só o título leva à página, e o cartão inteiro não vira clicável, para os controles do corpo e do `trailing` continuarem alcançáveis. O respiro interno do cartão é a variável pública `--card-gap` (24px, ou 16px no `size="sm"`), que o cabeçalho, o corpo e o rodapé leem; ela é declarada em cada cartão, para o `sm` de fora não chegar a um cartão aninhado, e por isso o produto a redefine no próprio cartão, pelo `style` ou por uma classe mais específica que a do cartão.

O `Card.Footer` leva à esquerda o que vier no `start`, como uma ação secundária ou a `SaveStatus`, e à direita os filhos, juntos, que podem faltar. Com `start`, o rodapé quebra a linha quando o `start` e os filhos não cabem juntos, e os filhos descem para a direita. Sem `start`, o rodapé não quebra e os filhos ficam nas pontas, e só um filho sozinho vai ao fim; para o texto à esquerda ao lado de uma `Pagination`, use o `start`.

O `Card`, e por ele o `CardMetric`, a raiz do `DataGrid`, a folha do `AppShell.Page` e o trilho da `Sidebar` leem os ganchos de folha `--pl-sheet-border`, `--pl-sheet-radius` e `--pl-sheet-shadow`, e as linhas da casca (a folha da página, o trilho, a `AppShell.PageBar` e o `PageHeader`) leem `--pl-shell-border`. O produto os define em qualquer ancestral, como o `:root`, e sem eles nada muda; a lista e os padrões estão em `docs/TOKENS.md`, "Ganchos de aparência".

O `CardMetric` é o `Card` de um indicador. O produto o monta com o `Card.Header` e as partes `Body`, `Value`, `Trend`, `Bar` e `Chart`, e põe no cabeçalho as ações que quiser; o componente não conhece nenhuma delas. Vários indicadores cabem num cartão só, um `CardMetric.Body` para cada, com o `label` do `Value` nomeando o indicador: os corpos seguidos se separam por uma linha e se empilham a partir do topo. A `Bar` mostra a composição de um total, e o `Chart`, a evolução, só em área ou linha: outros gráficos não se leem nesse tamanho. Um painel de gráfico com eixos e legenda é um `Card` com o gráfico no corpo.

O `Accordion` tem três aparências: `divided`, o padrão, é um contorno com divisor entre as seções; `plain` não tem contorno; `separated` é um cartão por seção, com vão entre eles. Sem `appearance`, vale o `divider` de antes, em que `false` é `plain`. O `indicator` é o `chevron`, que gira ao abrir, ou o `plus`, que vira o sinal de menos. Com `headerStyle="compact"`, o cabeçalho é menor e denso, em texto de legenda, peso de rótulo e cor secundária, com a inicial maiúscula e sem caixa alta. Cada item pode trazer `icon`, antes do rótulo, e `end`, ao fim do cabeçalho e antes do indicador, os dois decorativos (`aria-hidden`); o `end` fica dentro do botão e nunca é interativo, e o que ele diz entra no nome do cabeçalho por `endLabel`. O `overline` é o texto pequeno acima do rótulo, com a inicial maiúscula, e também entra no nome. O item da seção aberta leva `data-expanded`, como contrato para o produto estilizar. As variáveis `--accordion-header-surface` e `--accordion-panel-surface` trocam o fundo do cabeçalho e do painel; o componente só as lê, com o valor do sistema de reserva, e o produto as define em qualquer ancestral.

A fronteira entre `Badge` e `Tag` é o controle. O `Badge` só rotula um estado ou uma categoria e não responde a nada. A `Tag` é operada: removida, como o filtro ativo de uma busca, ou ligada e desligada, como o papel escolhido entre vários.

O `Kbd` mostra uma tecla ou uma combinação: `<Kbd>Esc</Kbd>` ou `<Kbd keys={['Mod', 'K']} />`. Cada tecla é um `<kbd>` dentro do `<kbd>` da combinação, como o HTML recomenda. A tecla herda a cor do texto em volta, com a borda e o fundo misturados dessa cor, e o tamanho dele, em `em`; por isso não há variante por fundo nem propriedade de tamanho, e a mesma peça vale no parágrafo, na legenda, dentro de uma dica escura e dentro de um botão. O `+` entre as teclas tem `aria-hidden`, e entre elas vai um espaço oculto: o leitor de tela ouve "Control K", nunca "mais". Os símbolos (⌘, ⇧, ⌥, ↵ e as setas) também ficam ocultos, com o nome falado em texto oculto. Os nomes falados vêm em português e se trocam por `labels`. `Mod` é a tecla de comando da plataforma: Ctrl por padrão, e ⌘ só quando o produto pede, com `platform="mac"` ou `platform="auto"`, que descobre a plataforma no navegador; na renderização no servidor, `auto` mostra Ctrl até montar. No macOS, as teclas ficam lado a lado, sem o `+`, como o sistema mostra. O `Kbd` só mostra: registrar o atalho e ouvir o teclado ficam com o produto. Onde só cabe texto, como o `shortcut` do `Menu`, `formatShortcut(keys, platform)` devolve o mesmo atalho como string; o `Menu` continua mostrando o atalho como texto simples.

O `Badge variant="count"` é o selo de contagem, solto: um círculo de 18px que alarga com os algarismos, fundo `--pl-color-primary`, texto `--pl-color-on-primary`, algarismos tabulares, "99+" acima de 99 quando o filho é número, e um anel de 2px na cor da superfície. Ele ignora `tone`, `size`, `dot` e `outline`, e não tem papel: o produto dá o contexto, como o rótulo ao lado ou o nome do controle que ele acompanha. O fundo de qualquer `Badge` aceita o gancho `--pl-badge-surface`, lido com o fundo do tom como reserva.

Na `Tag` de alternar, a área de clique do botão cobre a pílula inteira, com o respiro, e o botão de remover fica acima dela. O nome do botão de remover é o `removeLabel`, "Remover" por padrão, seguido do texto da etiqueta. Em `appearance="outline"`, o padrão, a etiqueta tem contorno sobre a superfície; em `filled`, fundo neutro (`--pl-color-surface-muted`), sem contorno, e o texto principal. A raiz leva `data-selected` quando a etiqueta de alternar está ligada e `data-disabled` quando desabilitada, como contrato para o produto estilizar. As variáveis `--pl-tag-radius`, `--pl-tag-bg` e `--pl-tag-shadow` trocam o raio, o fundo e a sombra; o componente só as lê, com o valor do sistema de reserva, e o produto as define em qualquer ancestral. A etiqueta ligada mantém o fundo de selecionada.

O `CodeBlock` exibe código e não o edita: um editor de documento mantém a própria superfície de edição e usa o `CodeBlock` para mostrar o bloco. O realce de sintaxe é léxico e do próprio Design System, para Java, JavaScript, TypeScript, JSX, TSX, SQL, JSON, Shell e Delphi: ele colore o que ajuda a ler o trecho, sem analisar a linguagem como uma IDE. Uma linguagem fora dessa lista aparece numa cor só, com o rótulo que o produto informar.

A `Timeline` mostra por onde um registro passou — criado, enviado, aprovado — com a data de cada estado. A fronteira com `Steps` é o tempo: as etapas indicam onde se está num processo a cumprir, e a pessoa pode navegar entre elas; a linha do tempo registra o que já aconteceu e não é navegável.

O `ActivityFeed` registra o que aconteceu, do mais recente ao mais antigo: quem fez o quê, quando, e os comentários deixados no caminho. A fronteira com a `Timeline` é o estado: a linha do tempo mostra por quais estados um registro passou e destaca o atual; o feed lista acontecimentos, sem estado atual, e cada um pode trazer um comentário citado. Cada `ActivityFeed.Item` recebe o texto do acontecimento, o momento em `time`, com `dateTime` para a data legível por máquina, e o comentário em `comment`, quando houver. A ordem é a que o produto passar.

A `NumberedList` explica uma sequência, como os passos de uma primeira vez: cada `NumberedList.Item` traz o número, o título e uma descrição opcional. Em `layout="list"`, o padrão, os passos descem um abaixo do outro; em `layout="grid"`, viram ladrilhos numa grade que se ajusta à largura. A fronteira com `Steps` é o estado: as etapas indicam onde se está num processo e podem navegar; a lista numerada só explica, sem etapa atual.

A `SortableList` existe para a ordem: as seções de um documento, as colunas de um relatório. Arrastar reordena, e pelo teclado `Alt` com as setas faz o mesmo, com o anúncio da nova posição. A fronteira com a `List` é a tarefa: na `List` a pessoa escolhe itens; na `SortableList`, ela os ordena. Como cada linha pode trazer ações próprias, a marcação é de grade, com uma célula por linha, e não de `listbox`, que não admite controles dentro das opções.

O `DescriptionList` mostra pares de termo e descrição na marcação semântica de lista de descrição, sem o produto repetir `dl`, `dt` e `dd`: cada `DescriptionList.Item` recebe o `term` e, como filhos, a descrição. Em `layout="stacked"`, o padrão, o termo fica em cima, em texto de apoio, e a descrição embaixo, como nos dados de um cliente ou de uma entrega; em `layout="inline"`, o termo fica à esquerda e a descrição à direita, na mesma linha, com algarismos tabulares, como nos totais de um pedido. O destaque de total é `emphasis` no item: a linha ganha um separador acima e o peso de rótulo, e é a forma de marcar o total de uma lista de valores.

O `AvatarGroup` mostra quem participa num espaço curto: os responsáveis de um registro, quem o visualizou, quem está editando. É um grupo com nome, e o total entra nele: `label="Responsáveis"` com sete pessoas é lido como "Responsáveis, 7 pessoas", e cada avatar visível mantém o nome próprio. `people` recebe o `name`, o `src` e as `initials` de cada um, como o `Avatar`, e a ordem é a da lista: destacar quem está online ou quem é o dono fica com o produto, que ordena antes de passar. `max` conta o "+N", e a linha nunca passa dele: com `max={4}` e sete pessoas, aparecem três avatares e "+4". Sem `overflow`, o "+N" é texto, com o nome "e mais 4", fora da ordem do Tab. Com `overflow="popover"`, ele vira o botão "Ver mais 4 pessoas", que abre um `Popover` com a lista dos que não couberam, cada um com avatar e nome; o foco entra no painel, e o Esc o fecha e devolve o foco ao botão. Os círculos se sobrepõem em um quarto do tamanho, com um anel de 2px na cor da superfície; sobre outro fundo, `--pl-avatar-group-ring`, definida em qualquer ancestral, troca a cor do anel. Os tamanhos são os do `Avatar`. `labels` troca os textos `count`, `more`, `showMore` e `list`, cada um uma função da quantidade, para o plural.

O `AvatarItem` é a linha de uma pessoa ou entidade: o `avatar`, normalmente um `Avatar`, à esquerda, o `title` e, abaixo dele, a `description` opcional. Texto longo vira reticências em vez de estourar a largura, e a linha mantém a altura do avatar. Serve a células de tabela, listas de membros e cabeçalhos de contato; o `AvatarItem` não é um controle e não responde a clique. O título já mostra o nome, então o `Avatar` passado em `avatar` entra decorativo e o leitor de tela lê o nome uma vez só; com `decorative={false}` no `Avatar`, ele continua nomeado, para quando o título não é o nome.

O `Avatar` mostra a foto de `src` ou, sem ela ou quando ela falha, as iniciais das duas primeiras palavras do `name`, ou as que vierem em `initials`, como a sigla de uma entidade. O fundo é só das iniciais; a foto não tem fundo e ganha um contorno sutil para dentro, que a separa da superfície sem mudar a medida. Os tamanhos são `xs` (24px, na fonte micro), `sm` (32px), `md` (40px) e `lg` (56px). O `name` é o nome acessível, no `alt` da foto ou no `aria-label` das iniciais; com `decorative`, o avatar sai da árvore de acessibilidade, com `alt=""` na foto e `aria-hidden` nas iniciais, para quando o nome já está escrito ao lado. As variáveis `--pl-avatar-bg` e `--pl-avatar-fg` trocam o fundo e o texto das iniciais; o componente só as lê, com o valor do sistema de reserva, e o produto as define em qualquer ancestral.

O `Card.Media` é a imagem do cartão. Com `placement="top"`, o padrão, ocupa a largura toda antes do cabeçalho, em 16:9; com `placement="end"`, o cartão vira linha de duas peças: uma coluna com o cabeçalho, o corpo e o rodapé, que continuam empilhados entre si como sem imagem, e a imagem ao fim, ao lado da coluna inteira, quadrada e com `--pl-card-media-size` de largura (88px por padrão), como num item de lista. O rodapé, com a linha de cima, fica na largura da coluna, e a imagem segue a direção do texto: em `dir="rtl"`, vai para a esquerda. Para ir ao fim, o `Card.Media` precisa ser filho direto do `Card`, em qualquer posição entre os filhos. `ratio` aceita `1:1`, `4:3` e `16:9`, e a imagem cobre a área sem distorcer. Sem `src`, ou se a imagem não carregar, o `Card.Media` não é desenhado e o cartão fica como sem imagem, sem buraco. `alt` é obrigatório e vazio quando a imagem só ilustra o texto ao lado.

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
| `Sparkline` | Tendência compacta ao lado de um número, sem eixo, numa linha de texto. | Disponível |
| `ChartTooltip` | Leitura das medidas sob o ponteiro, em lista. | Disponível |

`ChartCombo` desenha barras e linhas sobre o mesmo eixo de categorias, e é a escolha quando uma categoria carrega duas leituras de naturezas diferentes — o volume em barra, a taxa em linha. Com um único tipo de marca, `ChartBar` e `ChartLine` continuam sendo os componentes certos.

Cada série do `ChartCombo`, do `ChartLine`, do `ChartArea` e do `ChartBar` vertical declara a que eixo de valor pertence, e é essa declaração que cria o eixo direito. O gráfico nunca parte a escala por conta própria: um segundo eixo que aparece sozinho transforma o ponto de cruzamento entre as séries em artefato da escala escolhida, e não em fato do dado. Sem nenhuma série à direita, o domínio é único. Com os dois eixos, o zero fica na mesma altura nos dois, e as barras de cada eixo crescem da mesma base: cada domínio se estende só do lado que precisa, com a mesma folga nos dois. A pilha junta só as séries do mesmo eixo, porque somar grandezas de escalas diferentes não tem leitura. No `ChartBar` horizontal o eixo de valor fica embaixo, e o eixo da série é ignorado.

`ChartTooltip` é a leitura no ponteiro: título, subtítulo opcional, uma linha por medida com marcador e colunas numéricas, uma coluna calculada e um totalizador com operador por coluna. Ele acompanha o cursor e sai a qualquer outra interação — ponteiro fora, rolagem ou tecla.

Os gráficos já trazem o `ChartTooltip` montado, ligado por padrão em `showTooltip`: as séries da categoria sob o ponteiro, cada uma com a sua cor e no formato do seu eixo; a fatia com a parte do total; o caminho até o nó; na cascata, a variação do passo e o acumulado. Os números do balão seguem `formatTooltipValue` e, sem ele, o `formatValue` do gráfico: o eixo pode sair compacto — `500 mil` ou `500 k`, pelo `formatNumber` — e o balão, exato. Quem precisa de outras colunas, de um campo calculado ou de um totalizador próprio desliga o integrado e monta o seu pela costura.

A fronteira com `Tooltip` é o conteúdo, não o gráfico: `Tooltip` descreve **um** elemento em uma frase curta e nomeia esse elemento para quem usa leitor de tela; `ChartTooltip` exibe **várias** medidas em forma de grade e é decorativo, porque uma grade que some a qualquer interação não é leitura acessível.

Cada marca carrega a própria descrição em `aria-label`. Com o balão desligado e sem costura, a mesma descrição vai também no `<title>` da marca, que o navegador mostra quando o ponteiro repousa sobre ela; com balão, integrado ou montado pela costura, o `<title>` fica de fora, porque seria um segundo balão sobre o `ChartTooltip`. `ChartScatter`, `ChartRadial` e `ChartSankey` têm balão integrado, mas não costura: o ponto com as medidas nomeadas, o anel com valor, meta e quanto foi atingido, e a ligação com o fluxo e a parte dele na saída da origem.

Todo gráfico com marca traz o botão "Ver como tabela", que troca o desenho pela leitura medida a medida, e `showTableToggle` (ligado por padrão) o tira. A tabela é a mesma leitura do desenho, sem o filtro da legenda: a série desligada continua nela, e a legenda, que liga e desliga só o desenho, sai enquanto a tabela está aberta. Nos cartesianos, uma linha por categoria e uma coluna por série, no formato do eixo dela; na cascata, a variação com sinal e o acumulado; na dispersão, um ponto por linha; no anel, o valor e a parte do total; no `ChartRadial`, o valor, a meta e quanto foi atingido; no `ChartTreemap` e no `ChartSunburst`, um nó por linha, com o caminho do grupo até ele e a parte do total da raiz; no `ChartSankey`, uma ligação por linha, com o fluxo e a parte da saída da origem. `ChartMap`, `ChartTimeline` e `ChartHeatmap` têm a tabela do seu dado, com busca e ordenação no mapa. O `ChartGauge` fica sem ela: o medidor já diz o valor, a faixa e a meta no texto. A estrutura é do core, `ChartTable`, e cada gráfico só monta as linhas. A tabela é a alternativa acessível ao desenho, para quem não o enxerga ou prefere ler os números: deixe o botão ligado onde o gráfico é a leitura principal, e desligue só onde a mesma informação já está em tabela ou texto ao lado, ou onde o espaço é curto demais para o botão. Para desligar em todo o produto, o `ChartsProvider` recebe `showTableToggle={false}` e vale para os gráficos da árvore, sem repetir a prop em cada um; o provider mais próximo vale, e o `showTableToggle` do gráfico, `true` ou `false`, vale mais que ele. Sem provider, o botão fica ligado. O `CardMetric.Chart` não traz o botão em caso algum.

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

`Sparkline` é a tendência na altura de uma linha de texto, ao lado do número que ela explica, num `CardMetric` ou numa célula de tabela. Não tem eixo, grade, legenda, balão nem visão em tabela: é uma imagem só, cujo nome diz a tendência do primeiro ao último valor, como "Vendas nos últimos 30 dias: sobe 12%, de 18,2 mil a 20,4 mil". Quem precisa dos valores usa o gráfico completo. A cor é a da primeira série e não diz se subir é bom: em custo, subir é ruim, e quem diz isso é o texto ao lado. Entra no `CardMetric.Body` como as outras partes, sem prop nova, e acompanha o carregando e o erro da moldura. Quando o desenho precisa de mais altura ou de balão, a escolha é o `CardMetric.Chart`.

`references`, em `ChartBar`, `ChartLine`, `ChartArea` e `ChartCombo`, desenha metas e faixas no eixo dos valores: `{ type: 'line', value, label, tone? }` vira uma linha tracejada com o rótulo e o valor na ponta direita, e `{ type: 'band', from, to, label, tone? }` um fundo leve no tom de status, atrás das marcas. O rótulo é obrigatório. As referências entram na legenda, no nome acessível ("… com Meta de 80 e Faixa aceitável de 60 a 95") e na visão em tabela, que ganha uma coluna por referência com o "acima", "dentro" ou "abaixo" de cada ponto (o total da pilha, quando empilhado). A escala se estende para incluí-las.

Com `exportable`, o cabeçalho dos gráficos da moldura comum ganha o menu "Opções do gráfico <título>", com "Baixar PNG" e "Baixar SVG", desabilitados na visão em tabela. O arquivo leva o título, o `subtitle` e a legenda, no tema claro e com fundo branco, seja qual for o tema da tela. Para pôr o botão em outro lugar, `exportChart(ref.current, { format: 'png' | 'svg', fileName? })` faz o mesmo a partir da `ref` do gráfico, como os exportadores do `DataGrid`. O nome do arquivo segue o título, sem acento nem espaço. `ChartGauge`, `ChartMap` e `ChartTimeline` têm moldura própria e ficam sem `exportable`.

O Design System entrega os gráficos. A tradução entre o manifesto de um dashboard e as propriedades de cada gráfico pertence à aplicação, conforme `ARCHITECTURE.md` §15.

Em todos os gráficos, `hideTitle` esconde o título e o deixa só para o leitor de tela, quando o contêiner já o mostra. `ChartBar`, `ChartLine`, `ChartArea` e `ChartCombo`, que têm eixo à direita, aceitam `formatRightValue`: o formato do eixo da direita, dos rótulos e do balão das séries dele; sem ele, vale o `formatValue`. O `height` é a altura do desenho, em pixels, ou `fill` para o contêiner decidir: o cabeçalho e a legenda ficam fora dela.

## 7. Feedback

| Componente | Papel | Situação |
| --- | --- | --- |
| `Alert` | Mensagem de estado dirigida ao usuário. | Disponível |
| `Progress` | Progresso de uma operação, determinado ou não. | Disponível |
| `Meter` | Medida dentro de uma faixa conhecida, com o tom pela faixa em que o valor cai. | Disponível |
| `Spinner` | Indicação de atividade em curso. | Disponível |
| `EmptyState` | Ocupa o lugar do conteúdo que não há: sem registros, sem resultado ou falha ao carregar. | Disponível |
| `Skeleton` | Lugar de um conteúdo que ainda carrega, na forma do que vai chegar. | Disponível |
| `Toast` | Aviso flutuante sobre uma operação que acabou de acontecer. | Disponível |

O `Alert` anuncia pela urgência: `warning` e `danger` saem com `role="alert"`, `info` e `success` com `role="status"`, e `neutral`, o contexto sem urgência em fundo neutro (`--pl-color-surface-muted`), texto secundário e contorno forte, sai sem papel vivo, lido no fluxo da página. O `role` informado vence o do tom. O `title` aceita conteúdo rico. O `icon` vem antes do texto e é decorativo (`aria-hidden`); não há ícone padrão por tom, e `false` equivale a não passar. A `action` é a ação ligada à mensagem, dentro dela: fica ao lado do texto quando a própria mensagem tem 480px ou mais e abaixo dele quando é mais estreita, medido por container query. Com `action`, a mensagem é o contêiner da medida, então dentro de um pai que se ajusta ao conteúdo ela encolhe a zero: dê a largura ao pai. Sem `icon` nem `action`, a marcação e o desenho são os de antes.

A fronteira entre `EmptyState` e `Alert` é o lugar. O `Alert` acompanha o conteúdo e fala de uma operação; o `EmptyState` está no lugar do conteúdo que faltou e diz por que ele não está ali e o que fazer. Por isso a falha ao carregar uma lista é `EmptyState` em tom de erro, e a falha ao salvar um formulário é `Alert`.

O título do `EmptyState` é um parágrafo, porque o vazio costuma ficar dentro de um cartão ou de uma tabela que já tem o seu título. Quando o vazio ocupa sozinho uma seção da página, como uma página nova sem registros, `headingLevel` (de 1 a 6) faz do título um cabeçalho desse nível, com o mesmo desenho, para ele entrar na estrutura de títulos que o leitor de tela percorre.

Tabela, lista e gráficos usam o `EmptyState` no próprio vazio. O `ComboBox` mantém a frase curta, porque a lista dele é um painel que acompanha o campo e não comporta um bloco.

A fronteira entre `Skeleton`, `Spinner` e `Progress` é o que se sabe do resultado. O `Skeleton` desenha a forma do conteúdo que vai chegar, e serve quando essa forma é conhecida — linhas de uma tabela, um cartão. O `Spinner` diz só que há atividade; o `Progress`, quanto falta. O `Skeleton` é decorativo: quem o envolve anuncia o carregamento.

A fronteira entre `Meter` e `Progress` é o tempo. O `Progress` acompanha uma operação que avança até terminar, como um envio; o `Meter` mostra uma medida parada numa faixa conhecida, como o espaço ocupado ou uma nota, em que nada está acontecendo. `low`, `high` e `optimum` seguem o `<meter>` do HTML: a faixa do ideal fica em sucesso, a vizinha em atenção e a oposta em perigo; sem eles, a cor da marca. O valor sai sempre escrito, de `valueLabel` ou em porcentagem do intervalo, e vai ao `aria-valuetext`. Para um valor contra uma meta com faixas desenhadas no arco, vale o `ChartGauge`.

A fronteira entre `Toast` e `Alert` é o lugar e a duração. O `Alert` fica junto do conteúdo de que fala, até a situação mudar. O `Toast` aparece no canto da tela, fala de algo que acabou de acontecer — salvo, publicado, falhou — e sai sozinho, exceto o erro, que espera ser fechado. É exibido pelo `ToastRegion`, montado uma vez na raiz da aplicação, e disparado por `showToast` de qualquer lugar. Quando duas aplicações dividem a página, ou cada teste precisa do próprio estado, o `ToastProvider` dá à árvore o estado próprio: o `ToastRegion` dentro dele mostra só os avisos disparados por `useToast()` na mesma árvore, e o `showToast` solto continua indo ao estado global. O provider não renderiza o canto; ele é só o estado, e o `ToastRegion` continua sendo posto pelo produto. Com `portalContainer` no `ToastRegion`, ou o `PortalProvider` acima dele, o canto é renderizado dentro de um elemento escolhido, e herda o tema dele. O canto respeita a safe area da janela (`env(safe-area-inset-right)` e `-bottom`), que só vale com `viewport-fit=cover`. Ao acionar uma ação de um aviso, ou fechá-lo, o foco passa ao próximo aviso e, se não houver, volta ao elemento que o tinha antes de entrar no canto, desde que ainda esteja na página. Com um `Dialog` ou `Drawer` aberto, o canto é camada de cima (`data-react-aria-top-layer`): continua visível ao leitor de tela, o foco entra nos avisos sem o diálogo puxá-lo de volta, e clicar num aviso não fecha o diálogo.

Para uma operação que leva tempo, `showToast.promise(promessa, { loading, success, error })` usa um aviso só do começo ao fim: o carregando fica sem tempo, sem ações e sem anúncio até a promessa terminar, e então o mesmo aviso vira sucesso ou erro, que se anunciam como os demais. O texto de sucesso e o de erro podem ser função do valor e do motivo. A chamada devolve a mesma promessa, com a rejeição já tratada, e pode ser esperada. No `useToast`, a mesma função se chama `promiseToast`. Não serve para progresso com porcentagem: aí vale o `Progress` junto do conteúdo.

O aviso aceita até duas ações em `actions`, na ordem dada, como "Desfazer" e "Ver detalhes"; a terceira em diante não aparece, porque o aviso é breve e não é lugar de menu. Acionar qualquer uma fecha o aviso. `action`, a forma de uma ação só, continua valendo.

## 8. Navegação

| Componente | Papel | Situação |
| --- | --- | --- |
| `Breadcrumb` | Caminho percorrido até a posição atual. | Disponível |
| `Pagination` | Navegação entre páginas de um conjunto. | Disponível |
| `Tabs` | Alternância entre painéis de conteúdo. | Disponível |
| `TabsNav` | Faixa de abas em que cada aba é um endereço, ou uma seção da página que a barra acompanha. | Disponível |
| `Steps` | Etapas de um processo, com a atual destacada e as anteriores concluídas. | Disponível |
| `AppShell` | Moldura de tela em camadas: a navegação da `Sidebar` e a página. | Disponível |
| `Sidebar` | Navegação da aplicação: trilho de módulos, submenu do módulo com grupos e níveis, conta e gaveta no celular. | Disponível |
| `PageHeader` | Cabeçalho de página: título, descrição, selos de situação e ações. | Disponível |
| `LinkList` | Lista de links em que cada item leva a uma página, em linhas ou em grade. | Disponível |

O `Breadcrumb` é a trilha do caminho até a página atual, numa `nav` nomeada ("Trilha de navegação", ou `label`) com uma lista ordenada. Só o último nível é a página atual, com `aria-current="page"` e o peso de rótulo; um nível intermediário sem `href` nem `linkProps` é texto da trilha, na cor secundária, sem link e sem o destaque de atual. Com `compact`, para a barra estreita, a trilha fica numa linha só: o primeiro nível, os intermediários recolhidos num botão "…" e o último, cortado com reticências quando não cabe. O botão abre um `Menu` com os intermediários, e escolher um aciona o link da aplicação dele, com o mesmo `as`; o nível sem destino aparece desabilitado. O nome do botão traz os níveis recolhidos, "Níveis intermediários: Pedidos, Pedido 1042", e assim o leitor de tela ouve a trilha inteira sem abrir o menu; `compactLabel` troca o começo do nome. Com dois níveis, não há o que recolher, e `compact` não muda nada.

`Steps` é o indicador do processo, não o processo: o conteúdo de cada etapa e os botões de avançar e voltar pertencem ao produto. Com navegação livre, cada etapa vira botão. A fronteira com `Tabs` é a ordem: as abas são painéis equivalentes; as etapas têm sequência, e as anteriores à atual contam como concluídas.

O `Steps` tem duas formas em `layout`: `stacked`, o padrão, com o marcador acima do nome, e `inline`, a compacta, com o número num círculo de 22px ao lado do nome e uma linha de 1px que ocupa o espaço até a próxima etapa; as concluídas levam o visto, e a semântica é a mesma. A forma em linha não empilha no celular. `showPosition` mostra a posição da etapa atual antes das etapas, como `Etapa 2 de 3`, em texto só de leitura, e `formatPosition(current, total)`, contados de 1, troca esse texto.

A `Pagination` também serve de rodapé de tabela: oferece o seletor de itens por página e os passos para a primeira e a última página. Ao trocar o tamanho, a página passa à que contém o primeiro item da atual, para não perder o lugar de quem lia.

Com uma página só, a `Pagination` some, como antes. Com `hideOnSinglePage={false}`, ela fica, com o intervalo e as setas, todas com `aria-disabled` e sem números, para o rodapé não mudar de altura quando o resultado cabe numa página. O texto padrão do intervalo, `1.201–1.250 de 4.380`, sai de `formatPaginationRange(range)`, exportada para quem mostra o mesmo intervalo fora da paginação.

A `Pagination` mede a largura do contêiner e mantém os passos numa linha só: primeiro tira as páginas vizinhas da atual, até `siblings=0`, e, se ainda não couber, vira o modo compacto, com anterior, o texto `3 de 12` e próxima. O texto traz `aria-current="page"`, e `formatCompact` o traduz. Sem largura nem para o texto compacto, sobram só as setas, anterior e próxima, e o `3 de 12` (ou o `formatCompact`) fica só para o leitor de tela. `compact` força o modo compacto. No servidor, o HTML inicial mostra a forma completa, e a hidratação a ajusta à largura; sem servidor, a forma ajustada já sai na primeira pintura. A medida vem de uma cópia invisível das formas, e não da largura do próprio `nav`: ele encolhe no pai flex e no `Card.Footer`, e volta a crescer quando o pai alarga, sem exigir contêiner de largura própria. Com `totalItems`, só o intervalo é anunciado, e o `3 de 12` fica visível fora da região viva, ou só para o leitor de tela quando restam as setas.

`Tabs` e `TabsNav` têm o mesmo desenho, e a fronteira é o endereço. As `Tabs` trocam o painel na mesma página, com as setas entre as abas, como pede o padrão de abas do WAI-ARIA. No `TabsNav` cada aba é um link para uma página própria: recarregar ou abrir em outra guia leva à mesma aba, e voltar no navegador volta à anterior. Por isso ele é navegação, com `aria-current="page"` na aba atual e o Tab passando por todas, e não `role="tab"`, que prometeria as setas e um painel. O link é o da aplicação, recebido conforme a seção "Link da aplicação", abaixo.

As duas aceitam `count` no item, um selo depois do rótulo: o selo é decorativo, e a contagem entra no nome da aba por texto oculto, como "Em aberto, 24". `actions` põe ações ao lado das abas, como um botão de criar, num envoltório que leva a linha da faixa e fica fora do `tablist` (na `TabsNav`, fora da lista de links); as setas continuam só entre as abas. Sem `actions`, o DOM é o de antes. `appearance="segmented"` troca a faixa pelo trilho do `SegmentedControl` — fundo `--pl-color-surface-muted` com borda `--pl-color-border`, e a aba ativa em `--pl-color-surface` com `--pl-sh-1` — sem mudar a semântica: as `Tabs` continuam `tab` e `tabpanel`, com as setas, e a `TabsNav` continua navegação, com `aria-current="page"`. Nas `Tabs`, `muted` no item dá à aba menor peso, em texto terciário, com `data-muted`; ela continua focável e selecionável. No segmentado, a aba `muted` fica no texto secundário, porque o terciário não chega a 4,5:1 sobre o trilho. Na `TabsNav`, `icon` no item põe um ícone decorativo, com `aria-hidden`, antes do rótulo, e a `className` e o `aria-current` do `linkProps` somam aos da biblioteca: a classe vem junto das da aba, e a aba atual continua com `aria-current="page"`. Com `fillHeight`, o painel ocupa a altura que sobra e rola por dentro também na vertical. Só nas `Tabs`, `overflow` trata as abas que não cabem na largura: `"menu"` mede a faixa e leva as que sobram ao botão "Mais (N)", fora do `tablist`, que abre um `Menu`; `"scroll"` faz a faixa rolar até a aba escolhida. A escolhida fica sempre à vista e, vinda do menu, toma o lugar da última visível. Vale só na horizontal e sem `fitted`. `closable` no item, com `onClose` nas `Tabs`, fecha a aba pelo ×, que fica fora da árvore de acessibilidade e da ordem do Tab, ou pelo Delete, que a aba anuncia como "Delete para fechar". Quem remove a aba é quem usa, tirando-a de `items`; o foco vai à vizinha da direita ou, na última, à da esquerda, e a escolha vai junto quando a fechada era a escolhida.

O `PageHeader` é o cabeçalho da página, não de um cartão: o título é o `h1`, e a linha que o separa do conteúdo vai de borda a borda do elemento que o contém. Voltar é um link da aplicação, recebido conforme a seção "Link da aplicação", abaixo, posto acima do título, com a seta e o texto visível; o `label` é o nome acessível e deve conter esse texto; a trilha do caminho continua sendo o `Breadcrumb`, e o cabeçalho de um cartão, o `Card.Header`. A ação principal fica à direita, com até duas secundárias antes dela, e o excedente num `Menu`; o sistema não impõe o limite. Fixar ou compactar ao rolar é do produto.

O `AppShell` é a moldura da aplicação e ocupa a janela inteira; só as áreas internas rolam. A moldura ocupa a janela sozinha: o `body` precisa de margem zero, que o `reset.css` já zera, e quem embute a moldura numa caixa redefine `--pl-shell-height`, por exemplo `100%`, nela ou num ancestral. Na janela com recorte, como um celular com entalhe ou barra de gestos, a moldura soma `env(safe-area-inset-*)` ao respiro da borda; isso só tem efeito quando o produto declara `viewport-fit=cover` na meta `viewport`, e sem isso o inset vale 0 e nada muda. Ele tem três camadas: a base é o fundo da aplicação, o trilho de módulos e a página são folhas no mesmo nível, e o submenu do módulo fica na base, entre as duas. A navegação é a `Sidebar`, e a página é o `AppShell.Page`, com a barra (`PageBar`), o corpo (`PageBody`), a única área da página que rola, e, quando a tela pede, o rodapé fixo (`PageFooter`). O rodapé fica sempre à vista, fora da área que rola: a situação à esquerda (`status`), como a do rascunho salvo sozinho, anunciada ao leitor de tela, e as ações à direita. A fronteira com a `SaveBar` é o momento: a `SaveBar` aparece quando há alteração por salvar, e o rodapé fica sempre lá. O estado da navegação fica no `SidebarProvider`, que o `AppShell` monta por dentro, ou usa o de fora quando já existe um. A barra da página já traz o botão de abrir o submenu e a gaveta, e o produto não acrescenta outro: o `Sidebar.Trigger` avulso é só de quem monta a própria moldura. A barra tem 46px de altura mínima e cresce com o conteúdo, como uma trilha que quebra em duas linhas.

Na impressão (`@media print`), a moldura sai no fluxo do documento: sem altura fixa, sem rolagem interna e sem o respiro da borda, e a folha da página perde a borda e a sombra, para o corpo sair inteiro em quantas folhas de papel precisar. A navegação da `Sidebar`, o `SidePanel` e o botão de abrir da barra não saem, e a barra fica só com a trilha (o `Breadcrumb`, ou o que tiver uma `nav`); sem trilha, a barra não sai. Nada disso muda a tela. Um `DataGrid` com `height` fixo, que desenha só a janela de linhas à vista, imprime só essas linhas; para o conjunto inteiro no papel, a tela usa uma `Table` ou a exportação da grade.

A moldura é montada uma vez, na raiz da aplicação, e a página entra como filha: cada rota renderiza o seu próprio `AppShell.Page`, com a `PageBar`, o `PageBody` e, quando houver, o `PageFooter`. O `SidePanel` é irmão do `AppShell.Page`, dentro do `AppShell`.

```tsx
import { useState, type ReactNode } from 'react';
import { AppShell, Breadcrumb, Button, IconFile, IconStructure, Sidebar, SidePanel } from '@plenustech/design-system';

function Moldura({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Sidebar>
        <Sidebar.Rail brand={<Sidebar.Brand logo={<IconStructure size={20} />} name="Gestor" />}>
          <Sidebar.RailItem current href="/vendas" icon={<IconFile size={20} />} label="Vendas" />
        </Sidebar.Rail>
        <Sidebar.Panel brand={<Sidebar.Brand description="by Plenustech" name="Gestor" />} label="Vendas">
          <Sidebar.Group label="Pedidos">
            <Sidebar.Item current href="/vendas/pedidos" icon={<IconFile size={18} />} label="Todos os pedidos" />
            <Sidebar.Item href="/vendas/devolucoes" icon={<IconFile size={18} />} label="Devoluções" />
          </Sidebar.Group>
        </Sidebar.Panel>
      </Sidebar>
      {children}
    </AppShell>
  );
}

function PaginaDePedidos() {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  return (
    <>
      <AppShell.Page>
        <AppShell.PageBar>
          <Breadcrumb items={[{ label: 'Vendas' }, { label: 'Pedidos' }]} />
        </AppShell.PageBar>
        <AppShell.PageBody>
          <Button onClick={() => setFiltrosAbertos(true)} variant="secondary">
            Filtros
          </Button>
        </AppShell.PageBody>
        <AppShell.PageFooter status="Rascunho salvo">
          <Button>Concluir</Button>
        </AppShell.PageFooter>
      </AppShell.Page>
      <SidePanel onOpenChange={setFiltrosAbertos} open={filtrosAbertos} title="Filtros">
        Campos dos filtros
      </SidePanel>
    </>
  );
}

function Aplicacao() {
  return (
    <Moldura>
      <PaginaDePedidos />
    </Moldura>
  );
}
```

A `Sidebar` reúne todas as formas de navegação da aplicação. O trilho traz os módulos, só com ícone e dica, e um grupo fixo no pé para os itens de sistema e a conta. O submenu é a lista do módulo: itens com ícone, complemento ao fim da linha, como uma contagem, e links que saem da aplicação, em grupos com título. Abrir o submenu empurra a página, sem sobrepô-la, e recolher devolve a largura; a largura do submenu é do produto, pelo `width` do `Sidebar.Panel`, e todos os painéis devem usar o mesmo valor para a página não mudar de largura ao trocar de módulo; o módulo atual no trilho também alterna o submenu, e um módulo sem lista deixa o submenu só como lugar da conta. O terceiro nível tem duas formas: expandir os filhos no lugar, que é o padrão, ou trocar o painel pelo nível de baixo, com o caminho de volta. A conta do usuário abre dentro do submenu, também em duas formas: na altura das opções, que é o padrão, em um cartão que surge por cima da lista, sem empurrá-la nem encolhê-la, com sombra em degradê que sobe do cartão e fecha ao clicar fora dele, dentro do submenu, sem acionar o que está embaixo, ou cobrindo a lista do módulo, com as opções no mesmo desenho e na mesma grade dos itens do submenu, sem cartão; com o submenu recolhido, o avatar no trilho a abre. As medidas da `Sidebar` são variáveis CSS que o produto redefine no `:root`, no mesmo padrão do `--sidebar-panel-width`: `--sidebar-rail-width` (largura do trilho, 56px), `--sidebar-row` (altura da linha da grade, 34px, ou 42px quando o ponteiro é o dedo, para o item do trilho, o item do submenu, o subnível e a linha do título de grupo; o intervalo segue em 2px e o passo é a linha mais o intervalo, 36px ou 44px no toque), `--sidebar-icon-size` (ícone do item do submenu, 18px), `--sidebar-rail-icon-size` (ícone do trilho, 20px), `--sidebar-brand-size` (quadrado da marca e altura do cabeçalho do submenu, 36px, ou 44px no toque, sem mudar o quadrado da marca), `--sidebar-avatar-size` (avatar da conta no rodapé, 40px) e `--sidebar-drawer-width` (largura da gaveta no celular, que por padrão se ajusta ao trilho e ao submenu); um valor do produto vale em qualquer ponteiro, e só o padrão muda no toque; a marca e o cabeçalho seguem alinhados, e o espaço de 24px até o conteúdo se mantém, com qualquer valor. A marca do produto fica no alto do trilho e do submenu, com o `Sidebar.Brand`: no trilho, só o símbolo, num quadrado na cor principal ou puro; no submenu, o nome e a descrição, ou o logotipo de cada tema, claro e escuro; com `href`, leva ao início da aplicação. Em largura estreita, o trilho e o submenu passam a uma gaveta com a interação do `Drawer`, que soma a safe area ao respiro no topo, no pé e na borda em que se prende. A `Sidebar` funciona dentro do `AppShell` ou de um `SidebarProvider`: quem monta a própria moldura usa o provider, o `useSidebar()` para ler e mudar o estado e o `Sidebar.Trigger` como botão de abrir. O resto da `Sidebar` também é do produto, no `SidebarProvider` ou, quando é o `AppShell` que o monta, nas mesmas propriedades do `AppShell`: `labels` troca os nomes acessíveis dos botões (`openMenu`, `openSubmenu`, `closeMenu` e `collapseSubmenu`) e os nomes da gaveta (`menu`), da navegação do trilho (`modules`) e da conta (`account`), em português por padrão, e só os passados mudam, com a propriedade de cada peça (`menuLabel`, e `label` do `Sidebar.Rail` e do `Sidebar.Account`) valendo mais que o `labels`; a gaveta do celular e a conta são controláveis, como o submenu, por `menuOpen`, `defaultMenuOpen` e `onMenuOpenChange` e por `accountOpen`, `defaultAccountOpen` e `onAccountOpenChange`; `narrowBelow` é a largura, em pixels, abaixo da qual a navegação vira gaveta (900 por padrão), e o `AppShell` segue o mesmo valor; `side` põe o trilho e o submenu à esquerda ou à direita da página, com a gaveta, as dicas, a barra do item atual e a entrada do terceiro nível em pilha espelhadas, e o recuo e a guia do subnível no início do texto; o lado é físico, também com `dir="rtl"`, e nessa escrita o chevron, o ícone de link externo e a seta de voltar espelham e a barra do item atual fica junto do trilho; `useSidebar()` devolve `open`, `setOpen`, `openMobile`, `setOpenMobile`, `isMobile`, `toggleSidebar`, `accountOpen` e `setAccountOpen`, e abrir a conta pelo código abre o submenu (ou a gaveta) e leva o foco à primeira opção, como o clique no bloco, menos com o foco num campo editável; `icons` troca os ícones de abrir, recolher, fechar, voltar, link externo e seta da conta, e só os passados mudam; `tooltipDelay` é a espera, em milissegundos, das dicas do trilho e da marca (150 por padrão); e `shortcut`, desligado por padrão, liga um atalho como `"mod+b"`, que alterna o submenu, ou a gaveta em largura estreita, e é ignorado enquanto o foco está num campo editável. Os módulos, os links e o conteúdo da conta são do produto; o link é o da aplicação, recebido conforme a seção "Link da aplicação", abaixo.

Na pilha (`nestedMode="stack"`), cada ramo pode ter ramos dentro: entrar num ramo troca a lista pelos filhos dele, e o voltar sobe um nível, com o nome do nível de cima (o do ramo pai, ou o do módulo no primeiro nível) e o foco de volta ao item de onde se entrou. O `defaultExpanded` num ramo de baixo abre a cadeia inteira até ele. O caminho da pilha é controlável, no `Sidebar.Panel`, por `enteredPath`, `defaultEnteredPath` e `onEnteredPathChange`: a lista dos `value` dos ramos em que se entrou, do mais alto ao mais fundo; o `value` do `Sidebar.Item` é a identidade estável do ramo, e o modo controlado o exige em cada ramo. Mudar o caminho pelo código não move o foco. Com `followCurrent`, desligado por padrão, o caminho vai ao ramo pai do item `current` sempre que ele muda, e também na montagem. Trocar de módulo (o `label` do painel) volta o caminho não controlado ao início; o controlado é do produto. A conta tem a própria pilha, que troca as opções pelos filhos do ramo, com o nome da conta no voltar, e recomeça das opções a cada vez que abre; abrir um ramo ou voltar dele não fecha a conta, e escolher uma opção, sim. Cobrindo a lista (`accountMode="cover"`), a conta entra com o mesmo movimento da pilha, parado quando o sistema pede menos movimento, e fecha quando o módulo muda.

O `Sidebar.Panel` aceita `header`, entre a marca e a lista, fora da rolagem, como um campo de busca, que some com a conta cobrindo a lista; o `Sidebar.Rail` aceita `header`, simétrico ao `footer`: um grupo de `Sidebar.RailItem` abaixo da marca e antes dos módulos. O módulo atual no trilho que alterna o submenu expõe `aria-expanded` e `aria-controls`; com `toggleSubmenu={false}` no `Sidebar.RailItem`, ele navega como os outros. O `aria-current` passado ao `Sidebar.Item` e ao `Sidebar.RailItem` vale quando o item não é o atual; o atual leva `page`. A `Sidebar` recebe `className`, `style`, os atributos nativos e o `ref`, que vão ao elemento que reúne o trilho e o submenu e, na largura estreita, à superfície da gaveta. O `SidebarProvider` expõe no contexto o `narrowBelow` recebido, para as peças que seguem o mesmo ponto de virada.

As subpartes levam `data-part`, contrato público para o estilo do produto: `list` na lista do submenu e na das opções da conta, `group` e `group-title` no grupo e no título dele (também o título do nível na pilha), `branch` no item com filhos, `item` em cada item que navega ou abre filhos e `back` no voltar da pilha. A aparência dos itens também vem de variáveis lidas com reserva no ponto de uso, que o produto define em qualquer ancestral: `--sidebar-icon-color` (cor do ícone do item, que segue a do texto por padrão; o item atual mantém a cor da marca), `--sidebar-item-weight` (peso do texto do item, o de rótulo por padrão), `--sidebar-branch-weight` (peso do item com filhos, que segue o do item no primeiro nível e o de corpo dentro de um ramo expandido) e `--sidebar-stack-offset` (deslocamento da entrada do nível na pilha e da conta cobrindo a lista, 16px).

Para a cor própria só na navegação, sem mudar a da página, o `createPalette` vai à raiz: `<Sidebar {...createPalette(cor)}>`. A paleta vale no trilho, no submenu e na gaveta do celular, que recebe os mesmos atributos. As dicas do trilho saem em portal para o `document.body`; para levarem a mesma cor, o `PortalProvider` em volta da `Sidebar` as manda a um elemento com a mesma paleta, como `<div {...createPalette(cor)} ref={setDestino} />`. Para uma cor escolhida pelo usuário, que pode não ter contraste, `nearestPaletteColor(cor)` dá o tom mais próximo aceito antes do `createPalette`.

A `LinkList` é a lista de destinos de uma tela, como as pendências que levam aonde cada uma se resolve ou os atalhos de um índice de configurações. Cada item é um link inteiro, recebido conforme a seção "Link da aplicação", abaixo, com título, descrição opcional, ícone e um complemento ao fim, como uma contagem. Em `layout="list"`, o padrão, os itens são linhas separadas por uma divisória, com a seta ao fim; em `layout="grid"`, são células numa grade que se ajusta à largura, sem seta. `tone="danger"` marca o item que pede atenção. Escolher itens é papel da `List`, e uma ação que não navega continua sendo botão.

Com `followScroll`, as abas da `TabsNav` são seções da mesma página (`href="#id"`), como as partes de uma página de configurações ou de documentação. A barra fica presa ao topo da área que rola, a página ou um contêiner como o corpo do `AppShell`, sobre a superfície. A seção atual é a última cujo topo chegou à borda de baixo da barra, medida na própria barra; no fim da rolagem, é a última seção, mesmo curta. A aba atual vem para o meio da faixa, sem animação para quem pede menos movimento, e `onCurrentChange` avisa a chave só quando a seção muda. Sem `current`, a barra guarda a seção sozinha, a partir de `defaultCurrent`; com `current`, o produto controla e precisa atualizá-lo em `onCurrentChange`. `stickyOffset` é a altura do que fica preso acima da barra na mesma área que rola, em pixels, e vira o `top` do sticky; um `top` em `style` vence. Tocar numa aba leva à seção pelo próprio link, e a seção recebe um `scroll-margin-top` com a altura da barra para o título não ficar por baixo dela; numa página aberta direto no `#id`, a margem é do produto. Continua sendo navegação, e não `tablist`: a aba atual leva `aria-current="location"`.

### Link da aplicação

Os componentes de navegação não conhecem o roteador: a aplicação entrega o componente de link, e o sistema cuida da aparência e da acessibilidade.

- Nas coleções, `Breadcrumb`, `TabsNav` e `LinkList`, o `as` fica na raiz e vale para todos os itens. Cada item leva o próprio `href` ou `linkProps`.
- Nos elementos avulsos, o `as` fica no próprio elemento, com `href` ou `linkProps`: `Button`, `ButtonIcon`, `PageHeader.Back`, `Sidebar.Item`, `Sidebar.RailItem` e `Sidebar.Brand`. `AppShell.RailItem` e `AppShell.PanelItem` são apelidos antigos, obsoletos até a 0.8.0, de `Sidebar.RailItem` e `Sidebar.Item`.
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

<Button as={Link} linkProps={{ to: '/pedidos/novo' }}>
  Novo pedido
</Button>
```

## 9. Sobreposições

| Componente | Papel | Situação |
| --- | --- | --- |
| `Dialog` | Interação modal que interrompe o fluxo. | Disponível |
| `Drawer` | Painel modal preso à lateral ou à base da tela. | Disponível |
| `SidePanel` | Painel não modal ao lado do conteúdo, de qualquer lado, que empurra a página. | Disponível |
| `Popover` | Conteúdo ancorado a um gatilho, sem bloquear a página. | Disponível |
| `Tooltip` | Descrição curta de um elemento, exibida no ponteiro ou no foco. | Disponível |
| `Menu` | Lista de ações disparada por um gatilho. | Disponível |
| `Tour` | Tour guiado de uma tela, em passos curtos que apontam seus elementos. | Disponível |

`Drawer` e `Dialog` são a mesma interação modal — fundo oculto à tecnologia assistiva, com o foco preso, e Escape fecha — e dividem a mecânica. Ao abrir, o foco vai ao primeiro elemento focável, que, com `title`, é o botão Fechar do cabeçalho; para começar num campo, dê `autoFocus` a ele. Ao fechar, o foco volta a quem abriu. O `Dialog` mantém em volta do cartão um respiro de 16px ou a safe area, o que for maior, limita a altura a `100dvh` menos esse respiro, e acompanha a barra do navegador e o teclado virtual no celular; o `Drawer` respeita a safe area na borda em que se prende, no topo e no pé. A fronteira é a tarefa: o `Dialog` interrompe para uma decisão ou um formulário curto; o `Drawer` abre ao lado da página para editar ou detalhar um item sem sair da página, e comporta conteúdo longo. Um painel que fica ao lado do conteúdo sem bloquear a página não é `Drawer`: é o `SidePanel`. Ele abre de qualquer lado e empurra o conteúdo, que continua usável, sem foco preso nem fundo inerte. Em largura estreita, abaixo de 900px, onde não há espaço para empurrar, o `SidePanel` passa a ser modal, como o `Drawer`: foco preso, fundo inerte, Escape fecha e a página não rola. Dentro de um `SidebarProvider` ou de um `AppShell`, o ponto de virada é o `narrowBelow` deles, para o painel e a navegação mudarem de forma na mesma largura; o `narrowBelow` do próprio `SidePanel` vale sobre os dois. As propriedades (`id`, `className`, `data-*`, `aria-*` e as demais) chegam ao elemento do painel nas duas larguras.

O `Dialog` sem `title` não tem cabeçalho, e o nome vem do `aria-label`, que passa a ser obrigatório. Serve ao diálogo em que o próprio conteúdo é a tarefa, como a paleta de busca do `Ctrl+K`; a saída é o Esc ou o clique fora.

O `Dialog` tem os tamanhos `sm`, `md`, `lg` e `xl`, de até 1040px, para formulários e conteúdos largos. `title` e `description` aceitam um nó, para uma ênfase ou um link na descrição; o título é o conteúdo do `h2` e o nome do diálogo, e não leva nada interativo. O corpo que rola, quando ganha foco, é nomeado "Conteúdo de" seguido do título, por `aria-labelledby`, também com o título em nó. `help` põe ao lado do título, fora do `h2` e do nome do diálogo, o ícone de ajuda da convenção do `help` da `Table`: focável, com a dica no ponteiro e no foco de teclado, e nomeado pelo próprio texto; o foco inicial continua no botão Fechar. `flush` tira o respiro interno do corpo, como no `Drawer`. `placement="top"` prende o cartão perto do topo, a 12% da altura da janela, com a altura máxima descontada dessa margem, para o diálogo cuja altura muda com o conteúdo, como uma busca, não pular a cada resultado; o padrão é `center`. `onBeforeClose` deixa o produto impedir o fechamento, como quando há alterações não salvas: devolve `boolean` ou `Promise<boolean>`, e `false` mantém aberto. É consultado por Esc, pelo clique no véu e pelo botão Fechar, uma consulta por vez, e não quando o produto muda `open`, que é decisão dele. A resposta de uma consulta antiga é descartada se o diálogo foi fechado e reaberto, e a consulta que falha conta como não fechar. Não recebe o motivo do fechamento, porque a confirmação não difere pela via; se um produto precisar, a assinatura ganha um argumento sem quebrar. O `Drawer` recebe o mesmo `onBeforeClose`, pois divide a mecânica com o `Dialog` e é onde mais se edita um item com alterações a perder.

O `Drawer` com `side="bottom"` sobe da base da tela: é o painel do celular, para o detalhe de um item ou uma escolha curta. Tem a altura do conteúdo até o teto do `size` (`sm` 50%, `md` 75% e `lg` 90% da tela), cantos de cima arredondados e a área segura de baixo. A mecânica é a do `Dialog` (padrão Dialog Modal do WAI-ARIA): foco preso, Esc fecha, toque fora fecha, e o foco volta a quem abriu. Não tem alça: a alça convida a arrastar, e o painel não se arrasta. Como no `Dialog` e nas laterais, o botão Fechar fica no cabeçalho e só aparece com `title`. Sem `title`, o produto põe o próprio botão de fechar, no rodapé ou no corpo: no celular, com leitor de tela, não há Esc, e o toque fora não é um controle que se alcance. No computador, o painel fica centralizado, com até 640px de largura.

O `Drawer` sem `title` segue o `Dialog`: sem cabeçalho, nomeado pelo `aria-label` obrigatório. O `title`, a `description` e o `help` do `Drawer` seguem os do `Dialog`. Com `flush`, o corpo perde o respiro interno, para o conteúdo que desenha a própria margem; a rolagem do meio continua.

O `Tooltip` abre no ponteiro e no foco por teclado; o foco que vem do clique ou de `focus()` programático não o abre. Aberta, a dica acompanha a âncora que se move numa transição ou animação. O balão leva `data-origin` com a origem da abertura. Aberto pelo ponteiro (`data-origin="pointer"`), aceita o ponteiro, que pode ir do gatilho até ele sem fechá-lo (WCAG 1.4.13). Aberto pelo foco de teclado (`data-origin="focus"`), não é alvo do ponteiro (`pointer-events: none`), e o primeiro `pointerdown` fora do gatilho o fecha, para a dica não ficar sobre o que a pessoa foi clicar. Aberto só pelo produto, com `open` ou `defaultOpen` antes de foco ou ponteiro, ou com `anchorRef`, o balão não leva `data-origin`.

O `Menu` admite submenu: o item com itens próprios abre outra lista ao lado, pela seta para a direita, pelo Enter ou ao passar o ponteiro, e a seta para a esquerda volta ao item pai. Escolher em qualquer nível fecha o menu inteiro. O submenu serve para agrupar escolhas de um mesmo assunto, como densidade ou formato de exportação.

Rolar a página não fecha o `Menu`: o painel acompanha a página. Rolar um contêiner interno que contém o gatilho, como o corpo de um `Dialog` ou a área da página no `AppShell`, fecha o menu e devolve o foco ao gatilho, porque o painel ficaria solto dele; rolar o menu de fora fecha só o submenu. As setas movem o foco sem rolar a página nem os contêineres em volta: só o painel rola, o bastante para o item focado ficar à vista. O Esc fecha o menu e avisa `onOpenChange(false)` uma vez. Os outros painéis ancorados (`Popover`, `Select`, `ComboBox` e os seletores de data e hora) continuam fechando também quando a página rola.

O item do `Menu` com `href` ou `linkProps` é um link, `<a role="menuitem">`, recebido conforme a seção "Link da aplicação", acima, na forma das coleções: o `as` fica no `Menu` e vale para todos os itens, e cada item leva o próprio `href` ou `linkProps`. O teclado percorre o link como os outros itens, e o Enter e o Espaço o acionam; o menu fecha logo depois do clique, para o navegador seguir o `href`, e o `onSelect`, se houver, roda antes. O item com submenu, o de marcar e o desabilitado continuam botões. `detail` escreve um valor curto à direita do texto, como a escolha atual de um submenu, e entra no nome do item depois de uma vírgula: "Tema, Escuro". `header` põe um bloco no topo do painel, fora do `role="menu"`, como a conta de quem está conectado; ele descreve o menu por `aria-describedby`, não é focável e não deve ter nada interativo, e com ele rola só a lista, embaixo do bloco.

`placement` define o lado e o alinhamento do painel em relação ao gatilho, com os mesmos nomes do `Popover`: `bottom start`, `bottom`, `bottom end`, `top`, `top start`, `top end`, `left` e `right`. O padrão é `bottom start`, e o submenu abre sempre à direita do item pai.

O `Popover` é um diálogo não modal: ao abrir, o foco entra nele, e volta ao gatilho ao fechar. Como não prende o foco, o Esc fecha o painel também com o foco fora dele, num campo da página, por exemplo, e aí o foco fica onde está; com um painel aberto de dentro de outro, fecha o de cima, e o menu ou a lista aberta de dentro do painel fecha antes dele. Ele não serve de painel para um campo em que a pessoa continua digitando, porque o foco precisa ficar no campo. Esse caso tem dois caminhos. Quando o painel é uma lista de resultados ou sugestões, é o `ComboBox`, com a opção composta e os grupos: o foco fica no campo, e as setas percorrem as opções por `aria-activedescendant`. Quando não é uma lista, como uma prévia ou uma dica sobre o que se digita, o painel fica no fluxo da página, logo abaixo do campo, e não sobreposto: o campo o aponta por `aria-controls`, e a mudança que precisa ser ouvida sai numa região viva, com `role="status"`.

No `Dialog`, no `Drawer` e no `Popover`, os manipuladores do produto no elemento do painel (`onKeyDown`, `onKeyUp`, `onFocus` e `onBlur`) somam-se aos do overlay: rodam antes deles, e o Esc continua fechando.

Os overlays em portal vão ao `document.body`, e por isso herdam o tema e a paleta do documento, e não os da subárvore do gatilho. Para herdá-los, o produto indica o elemento de destino. O `PortalProvider` recebe o elemento em `container` e vale para todos os overlays abaixo dele: `Dialog`, `Drawer`, `Popover`, `Tooltip`, `Menu` e seus submenus, `Toolbar` ancorada, `ChartTooltip`, os painéis de `Select`, `ComboBox`, `DatePicker`, `DateTimePicker` e `TimePicker`, e o canto do `ToastRegion` quando o destino foi escolhido. Cada um aceita também `portalContainer`, que vale sobre o provider. O elemento chega por `ref` em estado (`useState` e `ref={setContainer}`), porque o provider precisa dele depois da montagem; com `null`, o destino é o `document.body`. Um destino com `transform` ou `contain` cria o bloco de contenção dos elementos de posição fixa, e a posição do overlay passa a contar a partir dele. Os painéis ancorados (`Popover`, `Menu`, `Toolbar` ancorada e os painéis de `Select`, `ComboBox`, `DatePicker`, `DatePickerRange`, `DateTimePicker` e `TimePicker`) ficam na camada `--pl-z-popover` (130), acima do `Dialog` (`--pl-z-modal`, 100) e do canto de avisos (`--pl-z-toast`, 110); a dica do `Tooltip` fica no maior entre `--pl-z-tooltip` e `--pl-z-popover`, e nunca embaixo de um painel. Essa ordem só vale entre elementos do mesmo contexto de empilhamento: o destino do portal não pode ficar dentro de um elemento que crie outro contexto, como um com `transform`, `filter`, `opacity` menor que 1, `isolation: isolate` ou `z-index` posicionado, senão os painéis ficam presos à camada desse elemento.

O `Tour` apresenta uma tela em passos curtos, quando a pessoa pede: ele nunca abre sozinho, e o produto o oferece num botão de ajuda ou por `useTour().start(id)`. Não é `Popover` nem `Tooltip`: é uma sequência com começo e fim, e cada passo é um diálogo nomeado pelo título, com o texto e o "Passo N de M" na descrição. O recorte no fundo não chega ao leitor de tela, e por isso o texto diz qual é o elemento apontado. Modal por padrão: o resto da página fica oculto à tecnologia assistiva, o Tab circula no painel e o clique não chega à página, para o painel nunca cobrir o foco. Com `modal={false}`, a página continua usável e o painel não cobre o alvo. O passo que espera uma ação (`advanceOn: 'click'`) é sempre não modal: o foco vai ao alvo, que ganha a descrição do passo, e o tour segue quando a pessoa o usa. O Esc e o Fechar encerram o tour inteiro, e o clique no fundo não fecha. Até 5 passos, e de preferência 3: acima disso, o tour avisa em desenvolvimento. O que é do produto fica com ele: o texto, quando e a quem oferecer, onde guardar o "já visto" (o `storage` do `TourProvider`, de preferência no servidor, por usuário), o limite de repetição e o destino dos eventos. O painel fica na camada `--pl-z-popover`, e o fundo usa `--pl-tour-scrim`, com `--pl-color-scrim` como reserva.

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

Os componentes de acessibilidade existem para quem não usa a tela como ela é vista: quem ouve o leitor de tela ou navega só pelo teclado. O `VisuallyHidden` tira o conteúdo da vista e o mantém na árvore de acessibilidade, para o leitor de tela ler o que a interface mostra só por ícone ou posição, como o rótulo de uma coluna de ações. Não serve para esconder o que ninguém deve ler: para isso, o conteúdo sai da página. O `SkipLink` é o primeiro destino do Tab, que leva direto ao conteúdo principal, sem passar pela navegação. Ao ser escolhido, ele leva o foco ao elemento do `id` do `href` (que ganha `tabindex="-1"` quando não é focável) e rola até ele, porque o salto nativo da âncora rola a página sem mover o foco em todos os navegadores; sem esse elemento na página, o link segue o comportamento nativo. O `onClick` do produto roda antes e, com `preventDefault`, cancela o salto.

Todo contêiner que rola dentro de um componente do pacote segue o mesmo padrão de barra: fina (`scrollbar-width: thin`) e com o polegar transparente em repouso, que aparece quando o ponteiro paira sobre o contêiner (`@media (hover: hover)`) ou quando o foco está dentro dele, para quem usa teclado, na cor do token `--pl-scrollbar-thumb`, nos temas claro e escuro. A rolagem continua por roda, toque e teclado, e onde não há ponteiro que paire a barra fica escondida, como nas barras de sobreposição dos sistemas de toque. Valem o padrão a `Table`, o `DataGrid` e o filtro de valores dele, o `CodeBlock`, a `List` e as listas de opções do `Select` e do `ComboBox`, o `Menu`, o `Popover`, o corpo do `Dialog`, do `Drawer` e do `SidePanel`, as `Tabs`, a `TabsNav`, o `SegmentedControl`, a legenda lateral dos gráficos, as tabelas de leitura dos gráficos, a área rolável do `ChartTimeline`, o corpo do `AppShell` e o submenu e a conta da `Sidebar`. A barra da página inteira (`html` e `body`) é do produto. Para um contêiner que rola e é do produto, a barra do `reset.css` (`::-webkit-scrollbar`) segue valendo, e o produto pode adotar o mesmo padrão com os dois `scrollbar-*` e o token.

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

As montagens que se repetem sem pedir componente próprio, como o painel de filtros, o menu de ações do cabeçalho e o controle do usuário, são patterns (`COMPONENTS.md` §16). Elas respeitam os papéis e as fronteiras deste catálogo. Cada pattern abaixo diz o que resolve, os componentes que monta e a regra principal.

- **Folha de página.** A folha de toda tela da aplicação: a barra com o caminho, o corpo que rola, o cabeçalho e o conteúdo na mesma coluna e, quando a tela salva, o rodapé fixo. Monta `AppShell`, `Sidebar`, `AppShell.Page`, `AppShell.PageBar`, `Breadcrumb`, `AppShell.PageBody`, `PageHeader`, `Container` e `AppShell.PageFooter`. Regra: o `maxWidth` do `PageHeader` e o do `Container` são o mesmo, para alinharem na borda; só o corpo rola; o rodapé fixo e a `SaveBar` são alternativas, e a tela escolhe uma.
- **Painel de filtros.** Uma lista com mais de um critério, em que a pessoa vê o resultado mudar enquanto escolhe. Monta `Button` (gatilho "Filtros"), `Badge` (a contagem), `SidePanel`, `Select`, `Tag` e `EmptyState`. Regra: o filtro se aplica na hora, ao mudar o campo; "Concluir" só fecha o painel e "Limpar" volta ao padrão sem fechá-lo; o `SidePanel` é irmão da página dentro do `AppShell`, e cada filtro ativo fica à vista como etiqueta com o nome do campo.
- **Barra da tabela.** Uma tabela com busca, filtro, seleção e paginação numa moldura só. Monta `Card`, `Card.Body` com `flush`, `Table.Toolbar`, `InputText`, `Button`, `Tag`, `Table`, `Card.Footer`, `Pagination` e `EmptyState`. Regra: buscar ou filtrar volta à primeira página; a barra continua à vista com o resultado vazio; o rodapé mostra a seleção quando há e a quantidade de resultados quando não há. Para uma grade completa, com virtualização, a escolha é a `DataGrid`.
- **Visões salvas.** A mesma lista lida pelos recortes que a equipe usa sempre, como todas, em aberto e atrasadas, cada um numa aba com a contagem no rótulo. Monta `Card`, `Tabs` e `Table`. Regra: o corpo é sempre a mesma lista, e as contagens e as listas saem da mesma fonte; abas de conteúdos diferentes não são este pattern.
- **Salvar por cartão.** Numa página de ajustes com cartões independentes, cada cartão salva por si. Monta `Card`, `Card.Footer`, `SaveStatus`, `Button`, `InputText` e `Stack`. Regra: "Descartar" e "Salvar" só ficam ativos com alteração em relação ao último valor salvo; a situação vai em `start` do rodapé, sempre escrita, e o `Salvar` leva `loading` enquanto grava.
- **Bloco de ajustes.** Título e explicação, linhas de rótulo e controle, uma ação do bloco e, no fim, o cartão de perigo. Monta `Card.Header`, `AnnotatedSection`, `Card.Body` com `flush`, `FieldRow`, `InputNumber`, `Switch`, `Button` e `Dialog`. Regra: a ação do bloco fica no cabeçalho (`trailing` ou `action`), e não dentro das linhas; o cartão de perigo vai por último, e a ação destrutiva sempre pede confirmação, num `alertdialog`.
- **Coluna de ação de linha.** A ação própria de cada linha da tabela, como remover ou editar, num botão só de ícone numa coluna sem título visível, à direita. Monta `Table.Column` com `align="end"`, `VisuallyHidden`, `ButtonIcon`, `AvatarItem` e `Table.Body`. Regra: o `label` de cada botão é único e diz a linha, como "Remover Ana Ribeiro"; ao remover, o foco passa ao botão da linha que tomou o lugar, e a lista vazia mostra o vazio da própria tabela.
- **Totais no rodapé.** O subtotal, os ajustes e o total no rodapé do cartão dos itens, como num pedido, numa fatura ou numa proposta. Monta `Card`, `Table`, `InputNumber`, `Card.Footer`, `DescriptionList` com `layout="inline"` e `DescriptionList.Item`. Regra: o resumo é calculado dos mesmos dados da tabela, nunca guardado à parte; a ordem é a da conta, com o total por último, e só ele leva `emphasis`; os valores usam `formatCurrency` e `formatPercent`.
- **Assistente.** Um processo em etapas, com ordem, dentro de um cartão: o indicador no alto, o título da etapa, o corpo e, no rodapé, voltar e avançar. Monta `Card`, `Steps`, `Card.Header`, `Card.Body`, `Card.Footer`, `EmptyState`, `InputText` e `RadioGroup`. Regra: "Próximo" fica desabilitado enquanto a etapa não tem o que precisa, e "Voltar" desabilita na primeira, sem sumir; na última etapa o botão diz a ação concreta; voltar não perde o que foi preenchido, e "Salvar e sair" guarda o rascunho. Painéis equivalentes e sem ordem são `Tabs`.
- **Vazio da primeira vez.** A primeira visita a uma lista ainda sem registros, que explica o ganho e mostra os primeiros passos em vez de uma tabela vazia. Monta `Card`, `EmptyState`, `NumberedList` com `layout="grid"`, `Button` e `Table`. Regra: a descrição diz o ganho, e não só que está vazio; no máximo duas ações, a secundária antes da principal; a ação de "novo" do cabeçalho só aparece quando a lista tem itens. O vazio por busca ou filtro é outro caso, do `EmptyState` pequeno.
- **Controle do usuário.** A conta da pessoa na navegação, com o avatar no trilho quando o submenu está recolhido e o painel da conta no pé do submenu. Monta `AppShell`, `Sidebar.Rail`, `Sidebar.RailAccount`, `Sidebar.Panel`, `Sidebar.Account`, `Sidebar.Item` e `Avatar`. Regra: o nome, a empresa e o avatar vêm de uma só fonte, e as duas entradas nunca divergem; as opções são da pessoa, e não do módulo; "Sair" é operação e vai em `onClick`, e as opções que levam a outra tela são links, com `href`.
- **Menu de ações do cabeçalho.** As ações da página no cabeçalho: a principal por último, até duas secundárias antes dela e o excedente num menu. Monta `PageHeader`, `PageHeader.Actions`, `PageHeader.Badges`, `Menu`, `ButtonIcon`, `Button`, `Badge`, `Dialog` e `showToast`. Regra: a principal é uma só; a ação que leva a outra página é link, com `href`, e a que muda dados é botão; a que destrói leva `tone="danger"` no item do menu e pede confirmação; a que não vale no momento fica desabilitada no mesmo lugar, e o selo diz por quê.

## 15. Fora do escopo

O Design System não cobre, conforme `ARCHITECTURE.md` seções 9.2, 11 e 15:

- Componentes que codificam conceitos de produto, como cliente, contrato, fatura, pedido ou usuário.
- Regras de negócio e transformação de dados de domínio.
- Infraestrutura de internacionalização, como catálogos, carregamento de traduções e contexto de idioma.
- Roteamento. Componentes de navegação recebem a abstração de link da aplicação.

Uma necessidade que caia em qualquer um desses casos permanece na aplicação consumidora.

## 16. Hooks

| Hook | Papel | Situação |
| --- | --- | --- |
| `useColorScheme` | Escolha do esquema de cor da aplicação: claro, escuro ou o do sistema. | Disponível |

O `useColorScheme` dá e troca a escolha entre `'light'`, `'dark'` e `'system'`, e é a forma de o produto oferecer o seletor de tema. Devolve `colorScheme`, o que a pessoa escolheu; `resolvedColorScheme`, o que vale na tela (`'light'` ou `'dark'`, que em `'system'` é o do sistema e acompanha o `prefers-color-scheme` quando ele muda); e `setColorScheme`. As opções são `defaultColorScheme`, a escolha de quem nunca escolheu (`'system'` por padrão), e `storageKey`, a chave do `localStorage` onde a escolha fica guardada (`'pl-color-scheme'` por padrão). A escolha guardada vale na visita seguinte e nas outras abas abertas, que a seguem pelo evento `storage`. Sem acesso ao `localStorage`, ela vale até a página fechar.

O hook aplica o atributo de tema que o pacote já documenta no `README.md`: `data-theme="light"` ou `data-theme="dark"` no `<html>`, e nenhum atributo em `'system'`, para o `prefers-color-scheme` decidir pela folha de estilo. O atributo posto à mão num elemento interno continua valendo sobre o do `<html>` naquela subárvore. No servidor, a escolha é a `defaultColorScheme` e `resolvedColorScheme` é `'light'`, e a hidratação corrige o que a pessoa guardou.

```tsx
import { SegmentedControl, useColorScheme, type ColorScheme } from '@plenustech/design-system';

function SeletorDeTema() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <SegmentedControl
      items={[
        { label: 'Claro', value: 'light' },
        { label: 'Escuro', value: 'dark' },
        { label: 'Sistema', value: 'system' },
      ]}
      label="Tema"
      onValueChange={(valor) => setColorScheme(valor as ColorScheme)}
      value={colorScheme}
    />
  );
}
```

O hook só roda depois da hidratação, e a página pintada antes dele sairia no tema do sistema, piscando para quem escolheu o outro. Para isso não acontecer, o `<head>` leva um script curto e síncrono, antes da folha de estilo e do corpo, que põe o atributo da escolha guardada. Em `'system'` não há o que fazer, porque a folha de estilo já segue o sistema. Quem muda a `storageKey` troca a chave também no script, e quem passa `defaultColorScheme` `'light'` ou `'dark'` aplica esse valor quando nada foi guardado, ou a primeira visita pisca:

```html
<script>
  try {
    var tema = localStorage.getItem('pl-color-scheme');
    if (tema === 'light' || tema === 'dark') document.documentElement.setAttribute('data-theme', tema);
  } catch (erro) {}
</script>
```
