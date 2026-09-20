# Componentes

Este documento define as convenções para criação, organização e evolução dos componentes do Plenustech Design System.

## 1. Princípio geral

Um componente deve possuir uma responsabilidade clara, uma API previsível e comportamento consistente com os padrões do Design System.

A complexidade deve estar no lugar apropriado.

- Visual simples → Componente primitivo
- Estrutura composta → Componente composto
- Estado e comportamento complexos → Componente complexo + State Motor

## 2. Componentes primitivos

Componentes primitivos representam unidades fundamentais de interface.

Exemplos:

- Button
- Badge
- Input
- Avatar
- Label

Características:

- API pequena.
- Responsabilidade única.
- Consumo direto de tokens.
- HTML semântico.
- Acessibilidade incorporada.
- Baixa quantidade de estado interno.

Estrutura:

```text
Button/
├── Button.tsx
├── Button.module.css
├── Button.test.tsx
└── index.ts
```

## 3. Componentes compostos

Componentes compostos representam estruturas formadas por partes relacionadas.

Exemplos:

```text
Select
├── Select.Trigger
├── Select.Content
├── Select.Search
├── Select.Option
└── Select.Empty
```

ou:

```text
Accordion
├── Accordion.Item
├── Accordion.Header
└── Accordion.Content
```

A composição deve ser preferida quando a estrutura possui diferentes partes que podem precisar de controle independente.

## 4. Evitar excesso de propriedades condicionais

Evitar APIs que acumulam estados estruturais:

```tsx
<Component
  searchable
  multiple
  clearable
  selectable
  hasFooter
  hasHeader
  showIcon
  showCheckbox
/>
```

Quando a complexidade estrutural cresce, avaliar composição:

```tsx
<Component>
  <Component.Header />
  <Component.Search />
  <Component.Content />
  <Component.Footer />
</Component>
```

Isso não significa que propriedades booleanas sejam proibidas. Elas são apropriadas para variações simples.

## 5. Componentes complexos

Componentes complexos devem separar, quando necessário:

```text
Estado e comportamento
        │
        ▼
State Motor
        │
        ▼
Componente visual
```

O State Motor deve ser independente da interface.

Exemplo conceitual:

```ts
const state = createSelectState({
  options,
  multiple: true,
});
```

A interface utiliza o estado produzido:

```tsx
<Select>
  <Select.Trigger />
  <Select.Options />
</Select>
```

O motor não conhece JSX, HTML ou CSS.

## 6. Estado controlado e não controlado

Componentes que possuem estado devem definir claramente se suportam:

- Estado interno.
- Estado controlado.
- Estado não controlado.
- Valor inicial.
- Callback de alteração.

Quando houver suporte a ambos os modelos, a API deve manter comportamento previsível.

## 7. Acessibilidade

Cada componente deve definir seu comportamento acessível.

### Botões

- Utilizar elemento semântico apropriado.
- Suportar foco.
- Expor estado quando necessário.
- Evitar substituir elementos nativos sem justificativa.

### Diálogos

- Gerenciar foco.
- Permitir fechamento apropriado.
- Expor nome acessível.
- Respeitar navegação por teclado.

### Componentes de seleção

- Definir corretamente estados.
- Permitir navegação por teclado.
- Expor relações semânticas.
- Utilizar ARIA somente quando necessário.

## 8. Tokens

Componentes devem consumir tokens para decisões visuais.

Exemplo:

```css
.button {
  padding: var(--spacing-button-padding);
  border-radius: var(--radius-button);
  color: var(--color-button-primary-text);
  background: var(--color-button-primary-background);
}
```

Evitar:

```css
.button {
  padding: 13px;
  color: #ffffff;
  background: #0057ff;
}
```

Valores técnicos que não representam decisões da linguagem visual podem permanecer locais quando não houver um token apropriado.

## 9. Responsividade

Componentes devem utilizar os breakpoints definidos pelo Design System.

Quando o comportamento depende do ambiente de execução, hooks podem ser utilizados:

```ts
const isMobile = useBreakpoint('md');
```

O componente não deve criar sua própria escala de breakpoints.

## 10. Motion

Animações devem utilizar os tokens de duração e curvas definidos pelo Design System.

Além disso, componentes que possuem animação devem considerar preferências de redução de movimento quando aplicável.

## 11. Testes

Componentes devem possuir testes para comportamentos relevantes.

Os testes devem priorizar:

- Comportamento.
- Interação.
- Acessibilidade.
- Estados.
- Eventos.
- Casos extremos relevantes.

Testes não devem depender excessivamente da implementação interna.

## 12. Nomenclatura

Nomes devem representar a função do componente.

Preferir:

- Button
- Dialog
- Select
- DataTable
- Pagination

Evitar nomes excessivamente específicos de produto:

- CustomerButton
- InvoiceDialog
- SalesTable

O componente pode ser utilizado por produtos diferentes.

## 13. Exportação

Cada componente deve possuir um ponto de exportação local:

```text
Button/
├── Button.tsx
├── Button.module.css
├── Button.test.tsx
└── index.ts
```

A exportação também deve ser registrada no ponto de entrada público quando fizer parte da API oficial:

```ts
export { Button } from './components/actions/Button';
```

## 14. Quando criar um novo componente

Antes de criar um componente, verificar:

- O comportamento já existe em outro componente?
- A necessidade é realmente compartilhada?
- A API pode ser generalizada sem criar abstração artificial?
- O componente possui uma responsabilidade clara?
- O comportamento pertence ao Design System ou ao domínio da aplicação?

Um componente não deve ser criado apenas para evitar algumas linhas de código em uma aplicação.

## 15. Quando não criar um componente

Evitar transformar automaticamente toda combinação de elementos em um componente oficial.

Exemplo:

```tsx
<div>
  <Typography />
  <Button />
</div>
```

não necessariamente precisa virar:

```tsx
<ActionCardHeader />
```

Componentes oficiais devem representar padrões reutilizáveis e relevantes para o ecossistema.

## 16. Regra final

Antes de adicionar um componente, a pergunta principal deve ser:

> Este comportamento representa um padrão de interface da Plenustech ou uma necessidade específica de uma aplicação?

Se for uma necessidade específica, a implementação deve permanecer na aplicação consumidora.

Se representar um padrão compartilhado, o Design System é o local apropriado.