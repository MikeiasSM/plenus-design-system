# Componentes

Esta pasta contém os componentes oficiais do Plenustech Design System.

## Regra de estrutura

Cada componente deve ser autocontido e seguir o padrão:

```text
Button/
├── Button.tsx
└── Button.module.css
```

Quando houver arquivos auxiliares, eles permanecem dentro da pasta do próprio componente.

## Dependências

```text
styles/tokens.css
        ↓
componentes
        ↓
showcase / aplicações consumidoras
```

Componentes podem consumir os tokens e estilos globais necessários, mas não devem depender do `showcase`.

## Categorias

- `actions/` — ações e controles primários.
- `data-display/` — apresentação de informações.
- `forms/` — campos e controles de formulário.
- `feedback/` — estados, alertas e progresso.
- `navigation/` — navegação e organização de conteúdo.
- `overlays/` — elementos sobrepostos, como modal e tooltip.
