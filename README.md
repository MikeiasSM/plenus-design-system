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

Para conhecer as decisões arquiteturais em detalhes, consulte [ARCHITECTURE.md](ARCHITECTURE.md).

## Instalação

O Design System deve ser consumido como um pacote pela aplicação.

Exemplo:

```bash
npm install @plenustech/design-system
```

O nome e o mecanismo de publicação podem variar de acordo com a infraestrutura de distribuição adotada pela empresa.

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

## Estrutura

```text
plenus-design-system/
├── src/
│   ├── tokens/
│   │   ├── primitive/
│   │   └── semantic/
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── reset.css
│   │   └── themes/
│   │
│   ├── hooks/
│   │
│   ├── utils/
│   │   └── formatters/
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
├── .editorconfig
├── .gitignore
├── ARCHITECTURE.md
├── COMPONENTS.md
├── COMPONENTS-CATALOG.md
├── CONTRIBUTING.md
├── TOKENS.md
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

- [ARCHITECTURE.md](ARCHITECTURE.md) — princípios e decisões arquiteturais.
- [COMPONENTS.md](COMPONENTS.md) — padrões para criação e organização de componentes.
- [COMPONENTS-CATALOG.md](COMPONENTS-CATALOG.md) — escopo de componentes, papel de cada um e fronteiras.
- [TOKENS.md](TOKENS.md) — padrões para criação e gerencia de tokens visuais.
- [CONTRIBUTING.md](CONTRIBUTING.md) — processo de desenvolvimento e contribuição.

## Princípio central

> O Design System define. O Showcase demonstra. As aplicações consomem.