# Diretrizes Tipograficas e Arquitetura de Fontes

Este documento define a referencia tipografica do Plenustech Design System.

Ele complementa `TOKENS.md` detalhando as familias de fontes, os papeis tipograficos, a escala de tamanhos, os pesos permitidos e as regras de conformidade. Os componentes devem consumir tokens tipograficos e nao definir familias ou pesos arbitrarios.

## Principio

O Design System utiliza tres familias tipograficas com separacao estrita de papeis:

```text
Poppins          -> Display e headings
Montserrat       -> UI e conteudo
JetBrains Mono   -> Dados tecnicos e codigo
```

Nenhuma familia deve ser utilizada fora da categoria definida neste documento.

## Familias e papeis

| Familia tipografica | Variacoes permitidas | Pesos importados | Papel exclusivo na interface |
| --- | --- | --- | --- |
| `Poppins` | Display e headings | `600` SemiBold | Titulos de paginas, cabecalhos principais e KPIs de grande impacto |
| `Montserrat` | UI, body, label e title | `400` Regular, `600` SemiBold | Corpo do sistema, rotulos, formularios, botoes, modais e cards |
| `JetBrains Mono` | Dados tecnicos e codigo | `500` Medium | Tabelas financeiras, valores numericos, UUIDs, chaves, logs e codigo |

## Hierarquia de uso

### Display e headings: Poppins

Poppins deve ser utilizada somente em areas de grande destaque e na hierarquia principal de navegacao.

| Token | Tamanho | Line-height | Peso | Uso de referencia |
| --- | --- | --- | --- | --- |
| `type.display-large` | `36px` | `44px` | `600` | Valor total em dashboards e KPIs |
| `type.headline-large` | `32px` | `40px` | `600` | Titulo principal de modulo ou tela |
| `type.headline-medium` | `24px` | `32px` | `600` | Titulo de secao ou cabecalho de modal |

Poppins nao deve ser utilizada em paragrafos, inputs, botoes ou outros elementos de leitura cotidiana.

### UI e conteudo: Montserrat

Montserrat e a familia obrigatoria para a navegacao cotidiana e a leitura densa da aplicacao.

| Token | Tamanho | Line-height | Peso | Uso de referencia |
| --- | --- | --- | --- | --- |
| `type.title` | `16px` | `24px` | `600` | Titulos de cards e tabelas |
| `type.body` | `14px` | `20px` | `400` | Textos descritivos e campos de formulario |
| `type.label` | `14px` | `20px` | `600` | Texto de botoes, abas e badges |
| `type.caption` | `12px` | `16px` | `400` | Dicas de validacao e legendas de campos |

### Dados tecnicos e codigo: JetBrains Mono

JetBrains Mono deve ser utilizada somente quando o alinhamento monoespacado ou a natureza estruturada do valor for relevante.

| Token | Tamanho | Line-height | Peso | Uso de referencia |
| --- | --- | --- | --- | --- |
| `type.data-value` | `14px` | `20px` | `500` | Valores monetarios, percentuais e totais em tabelas |
| `type.code` | `12px` | `16px` | `500` | Chaves PIX, UUIDs, codigos de barras, logs e codigo |

## Tokens globais

As familias devem ser expostas por tokens globais:

```css
:root {
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Montserrat', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Regras base

```css
h1, h2, h3, .text-display {
  font-family: var(--font-heading);
}

body, input, select, button, textarea {
  font-family: var(--font-body);
}

.font-mono, .data-number, table .col-currency {
  font-family: var(--font-mono);
}
```

Os nomes acima representam a camada CSS global. Os tokens semanticos de tipografia devem ser utilizados pelos componentes para aplicar tamanho, line-height, peso e familia de forma consistente.

## Tokens semanticos

Componentes devem consumir tokens semanticos de tipografia, em vez de repetir valores diretamente:

```text
type.display-large
type.headline-large
type.headline-medium
type.title
type.body
type.label
type.caption
type.data-value
type.code
```

Cada token tipografico deve definir, no minimo:

- Familia tipografica.
- Tamanho.
- Line-height.
- Peso.
- Contexto de uso permitido.

Uma implementacao CSS pode expor esses valores como propriedades customizadas agrupadas por funcao:

```css
:root {
  --type-display-large-family: var(--font-heading);
  --type-display-large-size: 36px;
  --type-display-large-line-height: 44px;
  --type-display-large-weight: 600;

  --type-body-family: var(--font-body);
  --type-body-size: 14px;
  --type-body-line-height: 20px;
  --type-body-weight: 400;

  --type-code-family: var(--font-mono);
  --type-code-size: 12px;
  --type-code-line-height: 16px;
  --type-code-weight: 500;
}
```

## Importacao das fontes

A importacao deve carregar somente os pesos definidos neste documento:

```text
Poppins: 600
Montserrat: 400, 600
JetBrains Mono: 500
```

Pesos adicionais nao devem ser carregados sem uma decisao formal, pois aumentam o custo de carregamento e a superficie tipografica do sistema.

Exemplo de importacao web:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&family=Montserrat:wght@400;600&family=Poppins:wght@600&display=swap" rel="stylesheet">
```

A estrategia definitiva de carregamento pode variar conforme a infraestrutura da aplicacao, mas deve preservar a lista estrita de familias e pesos aprovados.

## Regras de conformidade

### Nao utilizar Poppins no corpo da interface

Poppins nao deve ser utilizada em paragrafos, inputs, botoes, labels, modais ou cards. Seu uso e restrito a display e headings.

### Nao utilizar Montserrat para dados tecnicos

Valores numericos estruturados, valores financeiros, identificadores, UUIDs, chaves, logs e codigos devem utilizar JetBrains Mono quando o alinhamento ou a leitura tecnica for relevante.

### Nao carregar pesos adicionais

A importacao deve permanecer restrita a:

- Poppins `600`.
- Montserrat `400` e `600`.
- JetBrains Mono `500`.

### Nao criar escalas paralelas

Aplicacoes consumidoras e componentes nao devem criar tamanhos, pesos ou line-heights fora da escala oficial sem justificativa e avaliacao do Design System.

## Performance

A separacao de familias e pesos reduz o volume de fontes carregadas e torna o comportamento tipografico previsivel.

O carregamento das fontes deve ser acompanhado durante a implementacao para preservar a meta de performance definida pelo produto, incluindo a referencia de First Contentful Paint inferior a `100ms` quando essa meta for aplicavel ao ambiente.

A meta de performance nao justifica remover estados de fallback, prejudicar legibilidade ou impedir a exibicao inicial de conteudo.

## Fallbacks

Cada familia deve possuir uma pilha de fallback coerente:

```css
:root {
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Montserrat', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

Os fallbacks nao substituem a familia oficial como decisao de design. Eles garantem uma degradacao aceitavel quando a fonte nao estiver disponivel.

## Relação com `TOKENS.md`

`TOKENS.md` define a politica geral de tokens primitivos, semanticos, temas, espacamento, cores, raios, elevacao, motion e breakpoints.

Este documento detalha exclusivamente a arquitetura tipografica, as familias de fontes, os pesos permitidos e a escala de uso.

A regra permanece:

```text
Familia tipografica -> Papel definido -> Token semantico -> Componente
```
