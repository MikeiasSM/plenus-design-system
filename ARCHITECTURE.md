# Arquitetura

Este documento descreve as decisões arquiteturais e os limites do Plenustech Design System.

O objetivo é garantir que o Design System permaneça reutilizável, previsível e independente das regras de negócio dos produtos consumidores.

## 1. Visão geral

O repositório possui duas responsabilidades distintas:

```text
┌──────────────────────────────────────┐
│          Design System               │
│                                      │
│  Tokens                               │
│  Estilos                              │
│  Hooks                                │
│  Utilitários                          │
│  Componentes                          │
└──────────────────┬───────────────────┘
                   │
                   │ consumo
                   ▼
┌──────────────────────────────────────┐
│             Showcase                 │
│                                      │
│  Demonstração                         │
│  Documentação visual                  │
│  Validação de integração              │
└──────────────────┬───────────────────┘
                   │
                   │ mesmo modelo
                   ▼
┌──────────────────────────────────────┐
│       Produtos consumidores           │
└──────────────────────────────────────┘
```

O Design System não depende do Showcase.

## 2. Fluxo de dependências

A dependência interna segue uma direção previsível:

```text
Tokens
  │
  ▼
Estilos e Temas
  │
  ▼
Hooks e Utilitários
  │
  ▼
Componentes
  │
  ├──────────────► Showcase
  │
  └──────────────► Produtos consumidores
```

### Regras

- `src/tokens` não depende de outras camadas do Design System.
- `src/styles` pode consumir tokens.
- `src/hooks` não depende de componentes visuais.
- `src/utils` não depende de componentes visuais.
- `src/components` pode consumir tokens, estilos, hooks e utilitários.
- `showcase/` consome o Design System.
- O Design System nunca importa código de `showcase/`.
- Regras de negócio das aplicações não devem ser incorporadas ao Design System.

## 3. Tokens

Os tokens são a base da linguagem visual.

A estrutura recomendada é:

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

### Tokens primitivos

Representam valores fundamentais:

- cores
- espaçamentos
- tipografia
- raios
- elevação
- duração
- curvas de animação
- breakpoints

Exemplo conceitual:

```text
blue500
gray900
spacing4
radiusMedium
durationFast
```

### Tokens semânticos

Representam a função do valor na interface:

- `cor-texto-principal`
- `cor-texto-secundario`
- `cor-superficie-principal`
- `cor-borda-padrao`
- `cor-acao-principal`

Componentes devem preferencialmente consumir tokens semânticos, e não depender diretamente de valores primitivos.

Isso permite alterar a aparência de um tema sem alterar individualmente os componentes.

## 4. Estilos

Os estilos são divididos em duas responsabilidades.

### Estilos globais

`src/styles/` contém apenas estilos que precisam existir globalmente:

- Reset.
- Normalização.
- Variáveis CSS.
- Temas.
- Regras fundamentais do documento.
- Animações globais reutilizáveis, quando necessário.

O CSS global não deve conter estilos específicos de componentes.

### Estilos de componentes

Cada componente possui seu próprio módulo:

```text
Button/
├── Button.tsx
├── Button.module.css
├── Button.test.tsx
└── index.ts
```

O CSS Modules deve garantir isolamento entre componentes.

## 5. Temas

Os temas são construídos a partir de tokens semânticos.

Exemplo:

```css
:root {
  --cor-superficie-principal: ...;
  --cor-texto-principal: ...;
  --cor-borda-padrao: ...;
}

[data-theme='dark'] {
  --cor-superficie-principal: ...;
  --cor-texto-principal: ...;
  --cor-borda-padrao: ...;
}
```

Os componentes não devem definir cores absolutas diretamente quando o valor representa uma decisão da linguagem visual.

## 6. Componentes

Os componentes são classificados em três níveis.

### 6.1 Componentes primitivos

São componentes de baixa complexidade, focados em uma responsabilidade visual e semântica bem definida.

Exemplos:

- Button
- Badge
- Input
- Avatar
- Label

Devem possuir APIs simples e previsíveis.

### 6.2 Componentes compostos

São componentes formados por múltiplas partes semanticamente relacionadas.

O padrão de composição é preferível a uma API excessivamente condicionada.

Em vez de:

```tsx
<Select
  searchable
  multiple
  clearable
  hasFooter
  hasCheckbox
/>
```

pode-se utilizar uma API composta:

```tsx
<Select>
  <Select.Trigger />
  <Select.Content>
    <Select.Search />
    <Select.Options>
      <Select.Option />
    </Select.Options>
  </Select.Content>
</Select>
```

A composição permite que a estrutura seja expressa pela própria API do componente.

### 6.3 Componentes complexos

São componentes que possuem grande quantidade de estados, cálculos, transições ou regras comportamentais.

Exemplos possíveis:

- Tabelas avançadas.
- Seletores complexos.
- Comboboxes.
- Editores.
- Componentes de seleção múltipla.
- Interfaces com navegação por teclado avançada.

Esses componentes devem separar o estado e a lógica operacional da representação visual.

## 7. State Motor

Um State Motor, também chamado de State Engine ou State Machine, é o cérebro operacional de um componente complexo.

Trata-se de um módulo JavaScript/TypeScript cuja responsabilidade é gerenciar:

- Estado.
- Transições.
- Regras de comportamento.
- Cálculos.
- Dados derivados.
- Eventos.
- Regras de negócio específicas do próprio componente.

O State Motor não conhece a representação visual.

Ele não deve depender de:

- JSX.
- HTML.
- CSS.
- Componentes visuais específicos.

A relação pode ser representada assim:

```text
              ┌──────────────────────┐
              │     State Motor      │
              │                      │
              │ estado               │
              │ transições           │
              │ cálculos             │
              │ regras               │
              │ eventos              │
              └──────────┬───────────┘
                         │
                         │ estado / ações
                         ▼
              ┌──────────────────────┐
              │      Interface       │
              │                      │
              │ JSX                  │
              │ HTML                 │
              │ CSS                  │
              │ acessibilidade       │
              └──────────────────────┘
```

Essa separação permite que a mesma lógica operacional seja testada e reutilizada independentemente da camada visual.

O State Motor não deve ser utilizado para retirar toda e qualquer lógica de um componente. Ele é recomendado quando a complexidade de estado e comportamento justifica uma separação explícita.

## 8. Hooks

Hooks devem encapsular comportamentos reutilizáveis de interface.

Exemplos:

- `useDisclosure`
- `useClickOutside`
- `useBreakpoint`
- `useControllableState`

Hooks podem utilizar APIs do navegador e abstrações comportamentais, mas não devem conter regras de negócio específicas de uma aplicação.

Quando um comportamento pertence exclusivamente a um componente, ele pode permanecer dentro do próprio componente em vez de ser artificialmente extraído para um hook.

## 9. Utilitários

Os utilitários são divididos conceitualmente em duas categorias.

### 9.1 Utilitários de apresentação

São permitidos no Design System quando sua responsabilidade é padronizar a apresentação de dados.

Exemplos:

- `formatarMoeda()`
- `formatarNumero()`
- `formatarPercentual()`
- `formatarData()`
- `formatarHora()`

Esses utilitários devem receber dados e configurações suficientes para produzir uma representação consistente.

Exemplo:

```ts
formatarMoeda(1500.5, {
  moeda: 'BRL',
  localidade: 'pt-BR',
});
```

### 9.2 Regras de domínio

Não pertencem ao Design System.

Exemplos:

- `calcularLimiteDeCredito()`
- `determinarStatusDaFatura()`
- `calcularComissaoDoVendedor()`
- `validarRegraDeAprovacao()`

Essas regras pertencem às aplicações ou aos respectivos módulos de domínio.

### Internacionalização

O Design System pode fornecer mecanismos auxiliares para apresentação internacionalizada, mas não deve assumir a responsabilidade pela infraestrutura de internacionalização da aplicação.

A aplicação continua responsável por:

- Carregamento de traduções.
- Catálogos.
- Contexto de idioma.
- Seleção de localidade do produto.
- Regras específicas de tradução.

O Design System pode consumir essas configurações para realizar a apresentação.

## 10. Acessibilidade

Acessibilidade é responsabilidade do componente.

Componentes devem considerar:

- HTML semântico.
- Navegação por teclado.
- Foco.
- Estados acessíveis.
- Atributos ARIA quando necessários.
- Leitores de tela.
- Contraste.
- Redução de movimento quando aplicável.

A lógica de acessibilidade não precisa necessariamente estar em hooks separados. Ela deve estar no local arquitetural mais apropriado ao componente.

## 11. Navegação

Componentes de navegação devem evitar acoplamento a um roteador específico.

Quando necessário, a aplicação pode fornecer uma abstração de link:

```tsx
<NavigationLink as={Link} href="/clientes">
  Clientes
</NavigationLink>
```

O Design System permanece responsável pela apresentação e acessibilidade, enquanto a aplicação permanece responsável pelo roteamento.

## 12. Ícones

A biblioteca oficial de ícones deve ser exposta pelo Design System.

Aplicações consumidoras devem utilizar a biblioteca oficial sempre que houver um ícone correspondente.

A inclusão de uma biblioteca externa deve ser uma decisão explícita e justificada, não uma dependência casual de uma aplicação.

## 13. API pública

Somente as exportações do ponto de entrada oficial fazem parte da API pública:

- `src/index.ts`

Estruturas internas não devem ser tratadas como API pública.

Exemplo recomendado:

```ts
import { Button } from '@plenustech/design-system';
```

Evitar:

```ts
import Button from '@plenustech/design-system/src/components/actions/Button';
```

Isso permite reorganizar internamente o projeto sem criar acoplamento desnecessário com sua estrutura de arquivos.

## 14. Showcase

O Showcase deve se comportar como uma aplicação consumidora.

Ele pode:

- Importar componentes.
- Alterar propriedades.
- Demonstrar estados.
- Testar diferentes temas.
- Demonstrar acessibilidade.
- Simular cenários de uso.

Ele não deve:

- Implementar componentes oficiais.
- Corrigir componentes localmente.
- Definir tokens paralelos.
- Criar estilos que deveriam existir no Design System.
- Conter regras de negócio do Design System.

Quando uma demonstração precisa de uma correção no componente, a correção deve acontecer no Design System.

## 15. Independência de domínio

O Design System fornece infraestrutura de interface.

Ele não deve conhecer conceitos específicos dos produtos.

Por exemplo, um componente:

```tsx
<DataTable />
```

pode fornecer ordenação, paginação, seleção e estados visuais.

Mas não deve conhecer:

- Cliente
- Contrato
- Fatura
- Pedido
- Usuário
- Produto

Esses conceitos pertencem às aplicações consumidoras.

## 16. Princípio arquitetural

- Tokens definem a linguagem visual.
- Estilos implementam fundamentos globais.
- Hooks abstraem comportamentos reutilizáveis.
- Utilitários padronizam apresentação.
- State Motors isolam lógica operacional complexa.
- Componentes materializam a interface.
- Showcase demonstra e valida.
- Aplicações implementam o domínio.