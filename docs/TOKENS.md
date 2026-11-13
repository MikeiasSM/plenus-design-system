# Tokens

Este documento é para quem cria componentes ou tokens do design system. Quem usa o pacote parte do `README.md` e do `docs/COMPONENTS-CATALOG.md`.

Os tokens são a fonte oficial da linguagem visual do Plenustech Design System.

Eles transformam decisões visuais em valores reutilizáveis e permitem que componentes compartilhem a mesma base visual.

## Referências especializadas

Para especificações detalhadas, consulte:

- [TOKENS-REFERENCE-COLORS.md](TOKENS-REFERENCE-COLORS.md) — identidades de marca, escalas tonais, neutros, estados funcionais e temas de cor.
- [TOKENS-REFERENCE-TYPOGRAPHY.md](TOKENS-REFERENCE-TYPOGRAPHY.md) — famílias tipográficas, pesos, escala, papéis e regras de uso.

## 1. Hierarquia

A arquitetura de tokens segue:

```text
Tokens primitivos
       │
       ▼
Tokens semânticos
       │
       ▼
Temas
       │
       ▼
Componentes
```

## 2. Tokens primitivos

Tokens primitivos representam valores fundamentais.

Exemplos:

- Cores
- Espaçamentos
- Tipografia
- Raios
- Elevação
- Motion
- Breakpoints

Exemplo conceitual:

```ts
export const cores = {
  azul500: '#...',
  cinza900: '#...',
};

export const espacamentos = {
  xs: '...',
  sm: '...',
  md: '...',
};
```

Tokens primitivos não devem carregar significado específico de componente.

Evitar:

```ts
corBotaoPrincipal
```

como token primitivo.

Preferir:

```ts
azul500
```

e definir o significado posteriormente por meio de um token semântico.

## 3. Tokens semânticos

Tokens semânticos representam o papel de um valor.

Exemplos:

- `--pl-color-text`
- `--pl-color-text-secondary`
- `--pl-color-surface`
- `--pl-color-surface-muted`
- `--pl-color-border`
- `--pl-color-primary`
- `--pl-color-primary-hover`
- `--pl-color-danger`
- `--pl-color-success`

Um token semântico pode apontar para diferentes valores primitivos dependendo do tema.

## 4. Temas

Temas alteram os valores semânticos sem exigir alterações nos componentes.

Exemplo:

```css
:root {
  --pl-color-surface: var(--pl-neutral-white);
  --pl-color-text: var(--pl-neutral-graphite);
}

[data-theme='dark'] {
  --pl-color-surface: #1B1D20;
  --pl-color-text: #E9EAEB;
}
```

O componente utiliza:

```css
color: var(--pl-color-text);
background: var(--pl-color-surface);
```

e não precisa conhecer a implementação do tema.

### Escopo do tema

O tema vale por subárvore, como a paleta:

- `data-theme="dark"` e `data-theme="light"` em qualquer elemento aplicam o tema àquele elemento e a tudo o que ele contém: um painel escuro numa página clara, ou o inverso.
- Sem `data-theme` em lugar nenhum, o tema segue `prefers-color-scheme` do sistema. `data-theme="light"` força o claro mesmo com o sistema escuro.
- `color-scheme` acompanha o tema no mesmo escopo, e os controles nativos e as barras de rolagem o seguem.
- Uma variável CSS derivada de outra, seja por `var()` ou por `color-mix`, é calculada onde é declarada e não se recalcula nos descendentes. Por isso o token derivado de cor é declarado também no seletor de cada escopo de tema (`:root, [data-theme]`) e de paleta (`[data-palette]`). Onde a escolha depende do tema e da paleta ao mesmo tempo, como a cor primária, o valor usa `light-dark()`, que se resolve pelo `color-scheme` de quem usa o token.
- Pela mesma razão, o produto que ajusta um tema redefine os tokens de base no elemento que leva o `data-theme`, com especificidade maior, como `html[data-theme="dark"]`. Redefinidos num descendente, como o `body`, eles não chegam aos derivados, que já foram calculados acima.
- Os seletores são `[data-theme="light"]` e `[data-theme="dark"]`, mais `:root:not([data-theme])` dentro de `@media (prefers-color-scheme: dark)`. O seletor `:root[data-theme="dark"]` das versões anteriores à 0.6.0 deixou de existir.

### Camadas em portal

Os overlays em portal (`Dialog`, `Drawer`, `Popover`, `Tooltip`, `Menu`, `Toolbar`, `ChartTooltip` e os painéis dos campos) são renderizados no `body`, fora da subárvore do gatilho. Herdam, portanto, o tema do documento e não o do gatilho: o CSS herda pela árvore de elementos, e o destino do portal decide. A regra é a mesma que já vale para o `data-palette`. Para um overlay seguir o tema ou a paleta de uma subárvore, o destino do portal deve estar dentro dela. Pelo `PortalProvider`, o produto indica o elemento da subárvore uma vez, e todos os overlays abaixo dele vão para lá; a propriedade `portalContainer` de um overlay vale sobre o provider. Sem nenhum dos dois, o destino é o `document.body`.

## 5. Espaçamento

Componentes devem utilizar a escala oficial de espaçamento, em `src/tokens/primitive/space.css`: de `--pl-space-1` a `--pl-space-7`.

Evitar valores arbitrários quando existir um token equivalente.

A altura dos campos de formulário também é token, em `src/tokens/semantic/control.css`: `--pl-control-height-sm`, `--pl-control-height-md` e `--pl-control-height-lg`. O pequeno e o médio são as alturas do `Button` pequeno e médio, e é por eles que uma peça montada pelo produto alinha com os campos numa barra, sem copiar o número. O respiro vertical dos campos e desses botões é calculado a partir do token, e não escrito à parte. O grande, de 56px, é o do campo de destaque, como a busca principal de uma página. Quando o ponteiro principal é o dedo (`@media (pointer: coarse)`), o pequeno e o médio sobem para 44px, a referência da Apple, e a fonte dos campos de texto passa a 16px, pelo token `--pl-control-font-size-touch`, o piso que evita o zoom de foco do iOS; isso vale sozinho, sem opção de desligar.

O respiro da moldura de tela é token próprio, em `src/tokens/semantic/shell.css`: `--pl-shell-gap`, de 6px, separa as folhas do `AppShell` entre si e da borda da janela. É a única medida de espaçamento fora da escala de 4px, por decisão do mantenedor: 4px apaga a leitura das camadas, e 8px afasta demais as folhas. No mesmo arquivo, `--pl-safe-top`, `--pl-safe-right`, `--pl-safe-bottom` e `--pl-safe-left` guardam `env(safe-area-inset-*, 0px)`, o recorte da janela. O `AppShell` os zera para o que está dentro dele, porque a moldura já soma o inset ao próprio respiro. O `--pl-shell-height` é a altura da moldura e não é declarado em `shell.css`: sem valor, ela ocupa a janela (`100dvh`), e quem a embute numa caixa o redefine, por exemplo para `100%`.

No mesmo arquivo dos controles ficam os dois estados de interação deles. `--pl-control-border-hover` é a borda sob o ponteiro, metade do traço primário sobre a borda forte do tema, para o hover não se confundir com o foco. `--pl-control-focus-halo` é o halo do foco, em volta da borda primária. Os dois derivam do traço primário, `--pl-color-primary-strong`, e são recalculados em cada escopo de `data-palette`, como a cor primária; a paleta ativa está em `TOKENS-REFERENCE-COLORS.md`.

## 6. Tipografia

A tipografia deve centralizar:

- Famílias.
- Pesos.
- Tamanhos.
- Alturas de linha.
- Espaçamento entre caracteres quando aplicável.

Componentes devem utilizar os valores definidos pelo sistema.

## 7. Raios e elevação

Raios e sombras fazem parte da linguagem visual e devem ser centralizados:

- Raios, em `src/tokens/primitive/radius.css`: `--pl-radius-sm`, `--pl-radius-md` e `--pl-radius-full`.
- Elevação, em `src/tokens/semantic/elevation.css`: `--pl-sh-1`, `--pl-sh-2` e `--pl-sh-3`, mais `--pl-sh-up`, a sombra em degradê que sobe de uma superfície ancorada na base, como o cartão da conta da `Sidebar`.

A ordem das camadas fixas também é token, em `src/tokens/semantic/layer.css`: `--pl-z-fullscreen` (90, o `DataGrid` em tela cheia), `--pl-z-modal` (100, o fundo do `Dialog` e do `Drawer`), `--pl-z-toast` (110), `--pl-z-tooltip` (120, a dica dos gráficos) e `--pl-z-skip-link` (120). Um produto com escala própria redefine esses tokens no `:root` para encaixar a biblioteca, sem sobrescrever classes. Os painéis posicionados pelo React Aria (`Popover`, `Select`, `ComboBox`, os seletores de data e hora, `Menu`, `Tooltip` e a `Toolbar` ancorada) recebem `z-index: 100000` inline e não dependem de token: ficam acima de qualquer escala do produto abaixo desse valor. O `z-index` interno da pilha de um componente, como o da `Toolbar` fixa e o das células do `DataGrid`, continua local.

A barra de rolagem fina dos contêineres que rolam também tem token, em `src/tokens/semantic/scroll.css`: `--pl-scrollbar-thumb`, a cor do polegar quando o ponteiro paira sobre o contêiner ou o foco está dentro dele, a cor do texto do tema a 54%, o menor valor que dá ao polegar ao menos 3:1 contra `--pl-color-background` e `--pl-color-surface` (o fundo do `Dialog`), nos dois temas e nas paletas; o laudo `check:contraste` mede os pares. Em repouso o polegar é transparente. O token é derivado da cor do texto e por isso é declarado em `:root` e em cada `[data-theme]`, como os demais derivados.

## 8. Motion

Motion deve possuir tokens para:

- Duração.
- Curvas de aceleração.
- Transições recorrentes.

Os tokens ficam em `src/tokens/primitive/motion.css`: `--pl-speed-1` e `--pl-speed-2` para a duração, e `--pl-ease` para a curva.

Componentes não devem criar tempos arbitrários sem justificativa.

## 9. Breakpoints

Breakpoints devem ser centralizados. Os tokens ficam em `src/tokens/primitive/layout.css`:

- `--pl-bp-sm`: 900px.
- `--pl-bp-md`: 1180px.
- `--pl-bp-lg`: 1280px.
- `--pl-container`: 1600px, a largura máxima do conteúdo.

Nenhum deles é aplicado por padrão: a aplicação os usa se quiser alinhar o próprio leiaute aos pontos do sistema. Os componentes repetem esses valores nas próprias media queries, porque variável CSS não funciona em `@media`; redefinir um token não muda o comportamento de um componente.

Aplicações e componentes não devem criar escalas paralelas de responsividade.

## 10. Uso em componentes

Um componente deve consumir tokens semânticos sempre que possível:

```css
.card {
  background: var(--pl-color-surface);
  color: var(--pl-color-text);
  border-color: var(--pl-color-border);
}
```

Isso é preferível a:

```css
.card {
  background: #ffffff;
  color: #1a1a1a;
  border-color: #dddddd;
}
```

## 11. Valores técnicos

Nem todo valor numérico precisa obrigatoriamente ser um token.

Valores técnicos pequenos e específicos da implementação podem permanecer locais quando não representam uma decisão visual compartilhada.

Exemplo:

```css
outline-offset: 2px;
```

A regra é evitar duplicação de decisões de design, não eliminar todos os números do CSS.

## 12. Evolução

Alterações nos tokens possuem potencial de impacto amplo.

Antes de alterar um token compartilhado:

- Identificar consumidores.
- Avaliar impacto visual.
- Verificar temas.
- Atualizar documentação.
- Executar testes.
- Validar o Showcase.

Alterações de tokens devem ser tratadas como alterações da linguagem visual do produto.