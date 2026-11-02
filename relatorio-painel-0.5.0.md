# Resposta ao relatório de desencontros da 0.5.0

- **Relatório analisado:** "Desencontros do `@plenustech/design-system` 0.5.0 encontrados pelo Painel", de 01/11/2026.
- **Base da análise:** o texto do relatório, confrontado com o código da `main` (`8f21231`, a 0.5.0 publicada) e com o corpus normativo. Nenhum código do produto foi consultado.
- **Critério:** cada item é avaliado pelo problema que descreve, não pela correção sugerida. A solução tem de servir a qualquer produto e caber nas regras da biblioteca; nenhuma regra de produto entra nela.
- **Medição:** os comportamentos de leiaute foram reproduzidos no Chrome, sem interface gráfica, com o CSS de `Card.module.css` e o `dist/design-system.css` publicado na 0.5.0.

Documento não normativo. Os itens 2 e 3 estão implementados para a 0.5.1. Os itens 1 e 4 mudam a tela de todos os consumidores e estão no `ROADMAP-0.6.md`.

## Resumo

| # | Componente | O problema existe? | Decisão | Versão |
|---|---|---|---|---|
| 1 | `Card.Header` | Sim, mas não onde o relatório aponta | Corrigir os modos de fluxo; recusar a proposta | 0.6.0, por ser incompatível |
| 2 | `ButtonIcon` | Sim | Corrigido com `tooltipPlacement`; recusada a alternativa por contexto | 0.5.1 |
| 3 | `createPalette` | Sim | Corrigido com `nearestPaletteColor`; recusado `adjust` | 0.5.1 |
| 4 | `Pagination` | É decisão de desenho, não defeito | Não corrigir agora; levar a decisão para a 0.6.0 | 0.6.0, se adotado |

## 1. `Card.Header`: descrição afastada do título

### O que o código faz

O cabeçalho tem duas disposições.

- **Grade**, no modo padrão (`trailingWhenNarrow="keep"`, tamanho `md`). Com descrição, as linhas são `auto 1fr`, e o `trailing` ocupa as duas. Pela especificação do CSS Grid, um item que atravessa uma faixa flexível não entra no dimensionamento das faixas intrínsecas: a primeira linha fica com a altura do título, e o que o `trailing` tem a mais vai para a segunda. A descrição fica colada ao título.
- **Fluxo**, em `size="sm"`, `trailingWhenNarrow="wrap"` e `"hide"`. É um flex com quebra de linha: o título e o `trailing` dividem a primeira linha, e a descrição, com `flex: 1 0 100%`, vai para a linha seguinte. A primeira linha tem a altura do item mais alto.

### Medição

`trailing` de 62px de altura ao lado de um título de uma linha:

| Disposição | Regra | Vão entre título e descrição |
|---|---|---|
| Grade (`keep`) | atual, `auto 1fr` | 4px, o `gap` previsto |
| Grade (`keep`) | proposta, `auto auto` | 38px |
| Fluxo (`sm`) | atual | 42px |
| Fluxo (`wrap`, `hide`), `trailing` ao lado do título | atual | 42px |

### Leitura

- **A regra citada no relatório está correta.** É a única disposição em que o problema não ocorre, em todas as larguras medidas.
- **A proposta cria o defeito que descreve.** Com duas faixas `auto`, a altura do `trailing` é repartida entre elas, e a descrição desce para o meio. Por isso a proposta é recusada.
- **O defeito existe nos modos de fluxo.** O registro da revisão da 0.5.0 (`PROGRESS.md`, "Revisao final antes da publicacao") firma que o cabeçalho não afasta a descrição do título quando o `trailing` é alto. Os modos de fluxo descumprem isso sempre que o `trailing` cabe ao lado do título.
- **No `sm` há uma contradição de documentação.** O tipo `CardSize` diz "descrição em largura inteira abaixo do título"; o `CHANGELOG.md` da 0.5.0 diz "em largura inteira e abaixo do `trailing`". Com `trailing` alto, as duas frases descrevem telas diferentes.

### O que será corrigido

Nos três modos de fluxo, a descrição fica logo abaixo do título enquanto o `trailing` estiver ao lado dele. Quando o `trailing` desce de linha, a ordem continua título, `trailing` e descrição, como hoje.

**Sugestão de implementação.** Agrupar título e descrição numa só coluna do fluxo, com o `trailing` como o outro item da linha. A quebra continua decidida pela largura do título numa linha, como hoje: a coluna recebe a base de largura do título, e não a da descrição, para que uma descrição longa não force a quebra. O `useTrailingWrapped`, que já mede a quebra para o `hide`, serve de base se a quebra precisar ser lida no React.

**Decisão a tomar antes:** a frase que vale para o `sm`. A recomendação é a do tipo `CardSize`, "abaixo do título": é a que cumpre a regra firmada na revisão. O `CHANGELOG.md` da versão nova registra a correção.

**Versão.** A correção restaura o comportamento firmado sem mudar a API, mas muda a posição e a largura da descrição na tela. O `CONTRIBUTING.md` §11 conta medida visual que muda como incompatível, e mudança incompatível não sai numa versão de correção. Entra na 0.6.0, no grupo **Incompatível**, com o teste visual no Showcase (`CONTRIBUTING.md` §9) e o caso de `trailing` alto na página do `Card`. Está no `ROADMAP-0.6.md`, item 1.

## 2. `ButtonIcon`: dica sempre acima do botão

### O que o código faz

`ButtonIcon` envolve o `Button` num `Tooltip` sem repassar `placement` (`src/components/actions/ButtonIcon/ButtonIcon.tsx`). O `Tooltip` usa `top` por padrão e só inverte o lado quando falta espaço na janela, pelo `useOverlayPosition`. Numa tabela, sempre há espaço acima: a dica cobre a linha de cima e, na primeira linha, o cabeçalho.

O catálogo prevê o caso: o `ButtonIcon` existe para "a ação de uma linha" (`COMPONENTS-CATALOG.md`). A única saída hoje é montar `Button` com `Tooltip` à mão e repetir o nome acessível que o `ButtonIcon` garante, o que duplica conhecimento da biblioteca (mandamento 6).

### O que será corrigido

`tooltipPlacement?: TooltipPlacement` no `ButtonIcon`, repassado ao `Tooltip`, com `top` como padrão.

- Pelo `COMPONENTS.md` §4, é **modo**, não parte: não acrescenta estrutura e altera só onde a dica aparece. Tem quatro estados, e por isso é uma propriedade nomeada, não um booleano.
- Reaproveita o tipo `TooltipPlacement`, já público.
- Adição compatível, 0.5.1 (`CONTRIBUTING.md` §11). Entram o controle e a linha de API na página do Showcase e a entrada no `CHANGELOG.md`.

### O que não será feito

**Dica de lado por padrão dentro de célula de `Table` ou `DataGrid`.** O componente mudaria de comportamento conforme onde é montado, sem que quem lê o código veja por quê (mandamento 7). Além disso, nem toda coluna de ações está na ponta: numa coluna do meio, a dica de lado cobriria a célula vizinha.

### Observação no próprio código

A ajuda do título de coluna da `Table` (`help`, em `Table.tsx`) usa o mesmo `Tooltip` com `top`. No título, a dica sai acima da tabela e cobre o que estiver sobre ela. Não está no relatório. Fica registrado para avaliação à parte, sem entrar nesta correção.

## 3. `createPalette`: tom aceito só na mensagem do erro

### O que o código faz

`createPalette` lança `RangeError` quando a cor mede menos de 1,5:1 contra a superfície clara. O tom aceito mais próximo é calculado por `nearestAccepted`, interna, e só aparece no texto da mensagem (`src/utils/palette/createPalette.ts`). A regra está em `TOKENS-REFERENCE-COLORS.md`, "Paleta própria".

Quando a cor vem de fora do código, como de uma escolha do usuário, o consumidor precisa de uma cor aceita. Hoje, ou lê o texto do erro, que não é contrato, ou reimplementa a medição de contraste, que é da biblioteca.

### O que será corrigido

Exportar a função que devolve o tom aceito, `nearestPaletteColor(cor): string`:

- devolve a própria cor, normalizada, quando ela já é aceita;
- devolve o tom aceito mais próximo, na mesma matiz e croma, quando não é;
- lança `TypeError` para cor que não é hexadecimal, como `createPalette`.

`createPalette` continua recusando. Quem quer ajustar escreve isso no próprio código, `createPalette(nearestPaletteColor(cor))`, no mesmo espírito do `onSolid`: a decisão fica registrada no consumidor, e a medição continua num só lugar.

**Aprovação necessária.** A função acrescenta uma linha à seção "Paleta própria" de `TOKENS-REFERENCE-COLORS.md`, que é normativo. A linha complementa a regra, sem alterá-la.

**Versão.** Adição compatível, 0.5.1.

### O que não será feito

**`createPalette(cor, { adjust: true })`.** Troca "a função recusa", que está na norma, por "a função aceita ajustando", e esconde a substituição dentro da criação: o consumidor recebe uma paleta de outra cor sem que a chamada diga isso. Um erro com o tom em propriedade, como `error.nearest`, também fica de fora: obriga o consumidor a usar exceção como fluxo normal.

## 4. `Pagination`: posição do seletor de itens por página

### O que o código faz

A ordem é intervalo, seletor e passos (`Pagination.tsx`). O intervalo ocupa a sobra da linha, com `flex: 1 0 auto`, e o seletor fica ao lado dos passos, à direita.

### Leitura

Não é defeito: nenhum comportamento falha, e a ordem atual é uma escolha de desenho. O relatório o diz. O pedido parte da disposição de um produto, e a biblioteca não adota uma ordem por esse motivo (`PROGRESS.md`, "A biblioteca nao se molda a uma aplicacao").

A questão de desenho, por outro lado, existe e vale para qualquer consumidor: o seletor muda o tamanho da página e, por consequência, o intervalo; os passos navegam. Hoje o seletor fica entre o intervalo e a navegação, colado aos passos.

### O que não será corrigido agora, e por quê

- Mudar a ordem padrão altera a disposição de todos os consumidores. Pelo `CONTRIBUTING.md` §11, mudança de leiaute é **incompatível** e só sai numa versão menor, a 0.6.0.
- Propriedade de posição está fora: o próprio relatório não a propõe, e ela seria uma variação de leiaute sem necessidade de nenhuma estrutura nova.

### Sugestão

Decidir a ordem para a 0.6.0 pelas referências do projeto, não pelo produto:

- **AG Grid**, referência do `DataGrid`, que usa a `Pagination` no rodapé: tamanho da página, intervalo e navegação, nessa ordem. A verificar no código da referência antes de decidir.
- **Untitled UI**, base visual: conferir se a referência de paginação traz o seletor e em que posição.

Se a ordem mudar, a entrada vai para o grupo **Incompatível** do `CHANGELOG.md`, com o que o consumidor precisa conferir na tela. Se não mudar, a decisão e o porquê entram no `PROGRESS.md`, para não ser reaberta sem motivo novo.

## O que o Painel pode fazer enquanto isso

- **Item 1.** Não aplicar `grid-template-rows: auto auto`: medido, piora o caso. Se o vão aparecer com o cabeçalho padrão, enviar o modo do `Card.Header` (`size`, `trailingWhenNarrow`), o navegador e uma captura: com a grade, o vão não se reproduziu em nenhuma largura.
- **Item 2.** Usar `tooltipPlacement` a partir da 0.5.1.
- **Item 3.** Usar `createPalette(nearestPaletteColor(cor))` a partir da 0.5.1, no lugar de ler a mensagem do erro.
- **Item 4.** Manter a ordem atual até a decisão da 0.6.0.

## Próximos passos

1. Publicar a 0.5.1 com os itens 2 e 3.
2. Item 1: decidir a frase do `sm` e implementar na 0.6.0.
3. Item 4: conferir as referências e decidir para a 0.6.0.
