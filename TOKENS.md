# Tokens

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

- `cor-texto-principal`
- `cor-texto-secundario`
- `cor-superficie-principal`
- `cor-superficie-secundaria`
- `cor-borda-padrao`
- `cor-acao-principal`
- `cor-acao-principal-hover`
- `cor-erro`
- `cor-sucesso`

Um token semântico pode apontar para diferentes valores primitivos dependendo do tema.

## 4. Temas

Temas alteram os valores semânticos sem exigir alterações nos componentes.

Exemplo:

```css
:root {
  --cor-superficie-principal: var(--cinza-50);
  --cor-texto-principal: var(--cinza-900);
}

[data-theme='dark'] {
  --cor-superficie-principal: var(--cinza-900);
  --cor-texto-principal: var(--cinza-50);
}
```

O componente utiliza:

```css
color: var(--cor-texto-principal);
background: var(--cor-superficie-principal);
```

e não precisa conhecer a implementação do tema.

## 5. Espaçamento

Componentes devem utilizar a escala oficial de espaçamento.

Exemplo:

- `xs`
- `sm`
- `md`
- `lg`
- `xl`
- `2xl`

A escala real deve ser definida em:

- `src/tokens/spacing.ts`

Evitar valores arbitrários quando existir um token equivalente.

## 6. Tipografia

A tipografia deve centralizar:

- Famílias.
- Pesos.
- Tamanhos.
- Alturas de linha.
- Espaçamento entre caracteres quando aplicável.

Componentes devem utilizar os valores definidos pelo sistema.

## 7. Raios e elevação

Raios e sombras fazem parte da linguagem visual e devem ser centralizados.

Exemplo:

- `raio-sm`
- `raio-md`
- `raio-lg`
- `elevacao-sm`
- `elevacao-md`
- `elevacao-lg`

## 8. Motion

Motion deve possuir tokens para:

- Duração.
- Curvas de aceleração.
- Transições recorrentes.

Exemplo:

- `duracao-rapida`
- `duracao-normal`
- `duracao-lenta`
- `curva-padrao`
- `curva-entrada`
- `curva-saida`

Componentes não devem criar tempos arbitrários sem justificativa.

## 9. Breakpoints

Breakpoints devem ser centralizados.

Exemplo:

- `sm`
- `md`
- `lg`
- `xl`

Aplicações e componentes não devem criar escalas paralelas de responsividade.

## 10. Uso em componentes

Um componente deve consumir tokens semânticos sempre que possível:

```css
.card {
  background: var(--cor-superficie-principal);
  color: var(--cor-texto-principal);
  border-color: var(--cor-borda-padrao);
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