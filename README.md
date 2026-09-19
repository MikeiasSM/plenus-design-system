# Plenustech Design System

Design System centralizado para os produtos web da Plenustech, com foco em consistência visual, reutilização e manutenção de longo prazo (LTS).

## Objetivo

Este repositório é a **fonte oficial dos componentes e fundamentos visuais** do Design System.

O projeto possui duas responsabilidades distintas:

```text
Design System
└── src/
    ├── components/   # componentes reutilizáveis
    └── styles/       # tokens e estilos globais mínimos

Aplicação de exemplo
└── showcase/         # aplicação que demonstra os componentes
```

O `showcase` é uma aplicação de exemplo. Ele não é a implementação dos componentes e não deve se tornar uma fonte de estilos ou componentes para o Design System.

## Arquitetura

```text
                    ┌──────────────────────┐
                    │   Design Tokens      │
                    │   src/styles/        │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │   CSS Global Mínimo  │
                    │   globals.css        │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │    Components        │
                    │    src/components/   │
                    │  *.module.css        │
                    └──────────┬───────────┘
                               ↓
             ┌─────────────────┴─────────────────┐
             ↓                                   ↓
   ┌──────────────────────┐           ┌──────────────────────┐
   │      Showcase        │           │ Produtos consumidores│
   │   aplicação exemplo  │           │       da empresa     │
   └──────────────────────┘           └──────────────────────┘
```

### Direção das dependências

- `src/styles` não depende de componentes ou do `showcase`.
- `src/components` pode consumir `src/styles`.
- `showcase` consome o Design System.
- O Design System nunca deve depender do `showcase`.

## Estrutura do projeto

```text
plenus-design-system/
├── src/
│   ├── components/
│   │   ├── actions/
│   │   ├── data-display/
│   │   ├── forms/
│   │   ├── feedback/
│   │   ├── navigation/
│   │   └── overlays/
│   │
│   └── styles/
│       ├── globals.css
│       └── tokens.css
│
├── showcase/
│   ├── index.html
│   └── showcase.css
│
├── .editorconfig
├── .gitignore
└── README.md
```

As categorias em `src/components` são apenas organizacionais. O componente deve permanecer completo dentro da própria pasta.

## Componentes

Os componentes serão adicionados gradualmente ao Design System. Alguns já são demonstrados no `showcase`, e sua implementação oficial deve existir em `src/components` antes de ser considerada parte reutilizável do sistema.

Exemplo:

```text
src/components/actions/Button/
├── Button.tsx
└── Button.module.css
```

Um componente não deve ter seu CSS principal declarado diretamente no `showcase` ou em `globals.css`.

## CSS

A estratégia oficial é híbrida:

### `tokens.css`

Fonte da verdade para valores visuais compartilhados:

- cores;
- espaçamentos;
- tipografia;
- raios;
- sombras;
- dimensões e demais tokens do sistema.

### `globals.css`

CSS global mínimo:

- reset e normalização;
- configuração base de `html` e `body`;
- tipografia base;
- regras realmente globais.

### CSS Modules

O estilo específico de cada componente deve ficar junto da implementação:

```text
Button/
├── Button.tsx
└── Button.module.css
```

Isso mantém o escopo previsível e reduz colisões entre componentes.

## Regras de arquitetura

1. Componentes reutilizáveis pertencem a `src/components`.
2. Cada componente deve encapsular seus próprios estilos com CSS Modules.
3. Valores visuais compartilhados devem usar tokens.
4. `globals.css` deve permanecer pequeno e genérico.
5. O `showcase` demonstra e testa o Design System; não define sua arquitetura.
6. Um componente não pode importar código do `showcase`.
7. Evitar duplicação de componentes ou estilos entre o Design System e aplicações consumidoras.
8. Mudanças visuais compartilhadas devem ser feitas na origem correta: token para valores, componente para comportamento visual local.

## Showcase

O `showcase/` é a **aplicação de exemplo e documentação visual** do Design System.

Ele terá todos os componentes do sistema e receberá novos componentes ao longo do projeto.

A implementação atual do showcase pode conter demonstrações locais e código ainda não migrado para os componentes oficiais. Isso não altera a regra arquitetural: a evolução do projeto deve fazer o `showcase` consumir os componentes existentes em `src/components`, sem mover sua implementação para dentro dele.

## Versionamento

O repositório deve evoluir com versões do Design System. Alterações que modificam componentes ou tokens devem ser tratadas como mudanças do produto compartilhado, pois podem afetar múltiplas aplicações consumidoras.

A convenção de versão pode seguir Semantic Versioning (`MAJOR.MINOR.PATCH`) quando o processo de publicação do pacote for definido.

## Princípio central

> **O Design System define. O Showcase demonstra. As aplicações consomem.**
