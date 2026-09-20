# Contribuindo

Este documento descreve o processo para desenvolvimento, alteração e manutenção do Plenustech Design System.

## 1. Antes de começar

Antes de implementar uma alteração, identifique se ela pertence ao Design System.

Pergunte:

- É um padrão compartilhado?
- Será utilizado por mais de uma aplicação?
- A API pode ser generalizada?
- Existe um componente ou token semelhante?
- A alteração introduz uma dependência desnecessária?

Evite incorporar regras específicas de produto.

## 2. Estrutura de um componente

Um componente normalmente deve seguir:

```text
Component/
├── Component.tsx
├── Component.module.css
├── Component.test.tsx
└── index.ts
```

Dependendo da complexidade, arquivos adicionais podem ser utilizados:

```text
Component/
├── Component.tsx
├── Component.module.css
├── Component.test.tsx
├── Component.types.ts
├── Component.state.ts
└── index.ts
```

O arquivo de estado deve ser utilizado apenas quando houver uma necessidade arquitetural clara.

## 3. Criando um componente

Antes de implementar:

- Verifique componentes existentes.
- Verifique tokens existentes.
- Verifique hooks existentes.
- Defina a responsabilidade do componente.
- Defina a API pública.
- Defina o comportamento acessível.
- Defina os estados visuais.
- Defina os testes necessários.

## 4. Estilos

Utilize CSS Modules:

```css
Component.module.css
```

Evite estilos globais específicos de componentes.

Utilize tokens para decisões visuais:

```css
.component {
  color: var(--cor-texto-principal);
  background: var(--cor-superficie-principal);
}
```

Evite:

```css
.component {
  color: #222;
  background: #fff;
}
```

## 5. Testes

Todo componente relevante deve possuir testes.

Os testes devem cobrir principalmente:

- Renderização.
- Interação.
- Estados.
- Eventos.
- Acessibilidade.
- Casos limites relevantes.

Quando um componente possui um State Motor, a lógica do motor deve possuir testes independentes da interface.

## 6. State Motor

Para componentes complexos, considere separar a lógica operacional:

```text
Component/
├── Component.tsx
├── Component.state.ts
├── Component.module.css
├── Component.test.tsx
└── index.ts
```

O State Motor:

- Não deve importar JSX.
- Não deve depender de CSS.
- Não deve depender da árvore visual.
- Deve poder ser testado isoladamente.
- Deve concentrar estado, transições e cálculos relacionados ao componente.

A extração não deve ser feita apenas por convenção. Componentes simples não precisam de State Motor.

## 7. Tokens

Antes de adicionar um valor visual, procure um token existente.

Se não existir um token adequado:

- Avalie se o valor representa uma decisão visual reutilizável.
- Se representar, proponha um novo token.
- Defina sua finalidade.
- Avalie impacto em temas.
- Atualize a documentação quando necessário.

Não crie tokens apenas para evitar um valor local que possui significado puramente técnico.

## 8. Utilitários de apresentação

Novos formatadores podem ser adicionados quando padronizam uma necessidade recorrente de apresentação.

Exemplos:

- `formatarMoeda`
- `formatarNumero`
- `formatarPercentual`
- `formatarData`
- `formatarHora`

Esses utilitários não devem conter regras de negócio.

Evitar:

- `formatarStatusDaFatura()`
- `calcularValorDaComissao()`
- `determinarNivelDoCliente()`

Essas responsabilidades pertencem ao domínio da aplicação.

## 9. Showcase

Toda alteração visual relevante deve ser demonstrada no Showcase.

O Showcase deve apenas consumir o Design System.

Não adicionar:

- Componentes alternativos.
- Tokens locais.
- Correções específicas.
- CSS que deveria pertencer ao Design System.
- Regras de negócio do Design System.

Se algo precisa ser corrigido no Showcase porque o componente não suporta determinado comportamento, a alteração deve ser avaliada no Design System.

## 10. API pública

Novos componentes e funcionalidades públicas devem ser exportados pelo ponto de entrada oficial:

- `src/index.ts`

Não considere caminhos internos como parte da API pública.

## 11. Compatibilidade

Alterações em componentes públicos devem considerar:

- Compatibilidade de propriedades.
- Alterações de comportamento.
- Alterações visuais.
- Tokens utilizados.
- Temas.
- Acessibilidade.
- Consumidores existentes.

Alterações incompatíveis devem ser documentadas.

## 12. Checklist

Antes de abrir uma alteração:

- O componente pertence ao Design System.
- Não existe uma implementação equivalente.
- A API está definida.
- Tokens existentes foram reutilizados.
- Não existem estilos globais desnecessários.
- Acessibilidade foi considerada.
- Testes foram adicionados ou atualizados.
- O Showcase foi atualizado quando necessário.
- A API pública foi atualizada quando necessário.
- Não foram introduzidas regras de negócio de uma aplicação.

## 13. Revisão

Alterações devem ser avaliadas considerando:

### Arquitetura

- A alteração respeita as dependências e limites do Design System?

### API

- A API é previsível e sustentável?

### Acessibilidade

- O comportamento funciona com teclado e tecnologias assistivas quando aplicável?

### Temas

- A alteração funciona nos temas suportados?

### Responsividade

- O comportamento é adequado às diferentes dimensões suportadas?

### Reutilização

- A abstração representa um padrão real ou apenas uma necessidade específica?

### Manutenção

- A implementação continuará compreensível para quem mantiver o componente no futuro?

## 14. Princípio de contribuição

Uma contribuição para o Design System deve aumentar a capacidade de reutilização do ecossistema sem aumentar desnecessariamente seu acoplamento.

```text
Padrão compartilhado
        ↓
Design System
        ↓
Showcase demonstra
        ↓
Aplicações consomem
```