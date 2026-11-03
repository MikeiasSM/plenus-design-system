# Plenustech Design System

Design System centralizado para os produtos web da Plenustech.

O projeto fornece a fonte oficial de componentes de interface, tokens visuais, padrões de comportamento, acessibilidade e diretrizes de integração de UI utilizadas pelos produtos da empresa.

> O Design System define. O Showcase demonstra. As aplicações consomem.

## Objetivo

Este repositório é a fonte oficial da verdade para a interface e a experiência de usuário dos produtos web da Plenustech.

O pacote fornece:

- Tokens visuais e semânticos.
- Temas e estilos globais.
- Componentes de interface reutilizáveis.
- Hooks de comportamento reutilizável.
- Utilitários de apresentação de dados.
- Abstrações de acessibilidade.
- Componentes complexos baseados em composição.
- Padrões oficiais de integração de UI.

O Design System não contém regras de negócio específicas das aplicações consumidoras.

## Arquitetura

O repositório possui duas partes principais:

### Design System

```text
└── src/
    ├── tokens/
    ├── styles/
    ├── hooks/
    ├── utils/
    └── components/
```

### Aplicação de Demonstração

```text
└── showcase/
```

O `src/` contém exclusivamente o código que pertence ao Design System e que pode ser distribuído como pacote.

O `showcase/` é uma aplicação consumidora utilizada para demonstração, documentação visual e validação de integração.

O Showcase não define componentes oficiais, não contém regras de negócio do Design System e não fornece código que seja importado pela biblioteca.

Para conhecer as decisões arquiteturais em detalhes, consulte [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Instalação

O Design System deve ser consumido como um pacote pela aplicação.

Exemplo:

```bash
npm install @plenustech/design-system
```

O pacote é publicado no npm a cada tag `vX.Y.Z` na `main`. As mudanças de cada versão estão em [CHANGELOG.md](docs/CHANGELOG.md).

Requer React 19 e React DOM 19. Os componentes recebem `ref` como propriedade comum, o que o React 18 não entrega sem `forwardRef`.

## Uso

Os componentes públicos devem ser importados pelo ponto de entrada oficial do pacote:

```tsx
import { Button } from '@plenustech/design-system';

export function Example() {
  return <Button>Continuar</Button>;
}
```

A folha de estilo do Design System acompanha o pacote e deve ser importada uma vez, no ponto de entrada da aplicação. Ela carrega os tokens e o estilo de todos os componentes:

```ts
import '@plenustech/design-system/styles.css';
```

Sem essa importação os componentes são renderizados sem estilo.

Há uma segunda folha, **opcional**, com a base de página do sistema — tipografia do corpo, títulos, links, controles nativos e barra de rolagem:

```ts
import '@plenustech/design-system/reset.css';
```

Uma aplicação nova ganha a aparência completa do sistema importando as duas. Uma aplicação existente, que já tem a própria base, importa apenas a primeira: os componentes não dependem do reset.

Não é recomendado importar arquivos internos diretamente:

```tsx
// Evitar
import Button from '@plenustech/design-system/src/components/actions/Button';
```

A API pública do Design System é definida pelas exportações do ponto de entrada:

- `src/index.ts`

Isso permite alterar a organização interna do projeto sem transformar a estrutura de arquivos em uma API pública.

### Tema e paleta

O tema segue `prefers-color-scheme` do sistema. `data-theme="dark"` e `data-theme="light"` fixam o tema em qualquer elemento, valem para toda a subárvore e podem se aninhar, como um painel escuro numa página clara:

```html
<html data-theme="dark">...</html>

<aside data-theme="dark">...</aside>
```

`data-theme="light"` força o claro mesmo com o sistema escuro. Os overlays em portal (`Dialog`, `Popover`, `Tooltip` e os painéis dos campos) vão para o `body` e seguem o tema do documento, não o da subárvore do gatilho.

A identidade de marca vem de uma paleta. O laranja é o padrão; `data-palette="blue"` e `data-palette="purple"` trocam a paleta em qualquer elemento, inclusive numa parte da página. Uma paleta própria é gerada e medida a partir de uma cor:

```tsx
import { createPalette, nearestPaletteColor } from '@plenustech/design-system';

<div {...createPalette('#67BD50')}>...</div>

// Cor que vem de fora do código, como a escolhida pelo usuário
<div {...createPalette(nearestPaletteColor(cor))}>...</div>
```

As regras da paleta própria estão em [TOKENS-REFERENCE-COLORS.md](docs/TOKENS-REFERENCE-COLORS.md).

### Ícones

Os ícones de interface vêm do ponto de entrada principal. A suíte completa do Bootstrap Icons, com os 2.050 desenhos pelo nome de cada um, tem entrada própria, e o bundle leva só os importados:

```tsx
import { IconFolder, IconTruck } from '@plenustech/design-system/icons';
```

### Fontes

Os componentes usam três famílias, nos pesos definidos em [TOKENS-REFERENCE-TYPOGRAPHY.md](docs/TOKENS-REFERENCE-TYPOGRAPHY.md): Poppins 600, Montserrat 400 e 600 e JetBrains Mono 500.

O pacote declara as famílias, mas **não carrega os arquivos de fonte**: o carregamento é da aplicação, conforme a infraestrutura dela. Sem ele, o texto cai nas famílias de reserva do navegador, `sans-serif` e `monospace`.

Exemplo com o Google Fonts, no `<head>` da aplicação:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500&family=Montserrat:wght@400;600&family=Poppins:wght@600&display=swap" rel="stylesheet">
```

Qualquer outra estratégia, como servir os arquivos da própria aplicação, deve carregar exatamente essas famílias e esses pesos.

## Showcase

O `showcase/` é a aplicação oficial de demonstração do Design System.

Ele é utilizado para:

- Demonstrar componentes.
- Documentar estados e variações.
- Validar comportamento visual.
- Validar integração entre componentes.
- Exercitar temas.
- Verificar responsividade.
- Facilitar inspeção manual de acessibilidade.
- Servir como ambiente de desenvolvimento visual.

O Showcase consome o Design System como consumidor externo e não deve ser utilizado como fonte de componentes ou estilos.

## Desenvolvimento

```bash
npm install
npm run dev:showcase      # Showcase com a biblioteca em desenvolvimento
npm test                  # suíte do Vitest
npm run build:pacote      # pacote em dist/
npm run check:pacote      # confere o pacote construído
npm run check:contraste   # mede o contraste dos tokens nos dois temas
```

A publicação repete essas conferências antes de enviar o pacote ao npm. O processo de contribuição está em [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Estrutura

```text
plenus-design-system/
├── src/
│   ├── tokens/
│   │   ├── primitive/
│   │   └── semantic/
│   │
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   └── reset.css
│   │
│   ├── hooks/
│   │
│   ├── utils/
│   │   ├── formatters/
│   │   ├── palette/
│   │   └── textSearch/
│   │
│   ├── components/
│   │   ├── actions/
│   │   ├── charts/
│   │   ├── data-display/
│   │   ├── forms/
│   │   ├── feedback/
│   │   ├── icons/
│   │   ├── navigation/
│   │   └── overlays/
│   │
│   └── index.ts
│
├── showcase/
├── scripts/                  conferências do pacote e do contraste, geração dos ícones
├── docs/
│   ├── ARCHITECTURE.md
│   ├── TOKENS.md
│   ├── TOKENS-REFERENCE-COLORS.md
│   ├── TOKENS-REFERENCE-TYPOGRAPHY.md
│   ├── COMPONENTS.md
│   ├── COMPONENTS-CATALOG.md
│   ├── CONTRIBUTING.md
│   ├── CHANGELOG.md
│   ├── acompanhamento/
│   │   └── PROGRESS.md
│   └── roadmap/
│       └── X.Y.0.md
├── .claude/CLAUDE.md         diretrizes operacionais de código
├── LICENSE
└── README.md
```

## Princípios

O Design System segue alguns princípios fundamentais:

### Fonte única da verdade

Decisões visuais e comportamentais compartilhadas devem ser implementadas no Design System e reutilizadas pelos produtos.

### Composição

Componentes complexos devem priorizar composição e APIs semânticas em vez de acumular propriedades condicionais.

### Encapsulamento

Cada componente deve encapsular sua implementação, estilos e testes.

### Tokens

Valores pertencentes à linguagem visual devem ser representados por tokens, evitando valores arbitrários espalhados pelo código.

### Acessibilidade

Acessibilidade faz parte da implementação do componente e não deve ser tratada como uma etapa posterior.

### Independência de domínio

O Design System fornece infraestrutura de interface, comportamento e apresentação, mas não implementa regras de negócio específicas de um produto.

### Separação entre apresentação e domínio

Formatadores de apresentação podem fazer parte do Design System. Regras de negócio, transformação de dados de domínio e decisões específicas de produto devem permanecer nas aplicações consumidoras.

## Documentação

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — princípios e decisões arquiteturais.
- [COMPONENTS.md](docs/COMPONENTS.md) — padrões para criação e organização de componentes.
- [COMPONENTS-CATALOG.md](docs/COMPONENTS-CATALOG.md) — escopo de componentes, papel de cada um e fronteiras.
- [TOKENS.md](docs/TOKENS.md) — padrões para criação e gerencia de tokens visuais.
- [TOKENS-REFERENCE-COLORS.md](docs/TOKENS-REFERENCE-COLORS.md) e [TOKENS-REFERENCE-TYPOGRAPHY.md](docs/TOKENS-REFERENCE-TYPOGRAPHY.md) — referência de cores, paletas e tipografia.
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) — processo de desenvolvimento e contribuição.
- [CHANGELOG.md](docs/CHANGELOG.md) — mudanças de cada versão publicada.
- [PROGRESS.md](docs/acompanhamento/PROGRESS.md) — estado da implementação e decisões tomadas.
- [roadmap/](docs/roadmap/) — o que cada versão menor planeja levar.

Os documentos normativos ficam na raiz de `docs/`; o acompanhamento, em `docs/acompanhamento/`; o roadmap de cada versão menor, em `docs/roadmap/`.

## Licença

Uso restrito aos produtos da Plenustech, conforme [LICENSE](LICENSE). Estar publicado no npm não concede licença de uso.

## Princípio central

> O Design System define. O Showcase demonstra. As aplicações consomem.