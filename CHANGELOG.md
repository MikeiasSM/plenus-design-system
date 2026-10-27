# Changelog

Mudanças de cada versão publicada de `@plenustech/design-system`, da mais recente para a mais antiga.

A política de versão está em `CONTRIBUTING.md` §11. Cada versão tem uma seção `## [X.Y.Z] — AAAA-MM-DD`, com os grupos que se aplicarem, nesta ordem: **Incompatível**, **Adicionado**, **Alterado**, **Corrigido** e **Removido**. Mudanças ainda não publicadas ficam em `## [Não publicado]`.

## [Não publicado]

### Alterado

- O pacote passa de `UNLICENSED` para licença proprietária, descrita em `LICENSE`: o uso fica restrito aos produtos da Plenustech.
- O pacote publicado leva o `CHANGELOG.md`.

### Corrigido

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
