# Token Reference Colors

Este documento define a referencia de cores para os tokens do Plenustech Design System.

Ele complementa `TOKENS.md` detalhando as identidades de marca, as escalas tonais, os neutros e as cores funcionais. Os componentes nao devem consumir diretamente as cores deste documento. Devem consumir tokens semanticos definidos pelo tema ativo.

## Principio

O Design System oferece identidades de marca alternativas. Cada produto ou aplicacao seleciona uma identidade principal.

As identidades nao devem ser combinadas automaticamente na mesma interface:

```text
Produto A -> Tema Orange
Produto B -> Tema Blue
Produto C -> Tema Purple
```

A identidade selecionada alimenta os tokens semanticos de acao principal:

```text
Tema Orange -> color.primary = brand.orange.50
Tema Blue   -> color.primary = brand.blue.50
Tema Purple -> color.primary = brand.purple.50
```

Os componentes permanecem os mesmos. Apenas os valores resolvidos pelo tema mudam.

## Hierarquia

```text
Brand Colors
      |
      v
Uma identidade selecionada
      |
      v
Tema de marca + modo de aparencia
      |
      v
Tokens semanticos
      |
      v
Componentes
```

O modo de aparencia, como `light` ou `dark`, e uma dimensao separada da identidade de marca. O sistema deve permitir, por exemplo, `orange-light`, `orange-dark`, `blue-light` e `purple-dark`.

## Cores de marca

As tres cores abaixo sao identidades alternativas. A cor laranja e a identidade principal atual da marca.

| Identidade | Nome | Hex base | Papel |
| --- | --- | --- | --- |
| `brand.orange` | Laranja Plenustech | `#F26B35` | Identidade principal |
| `brand.blue` | Azul Oceano | `#49619C` | Identidade alternativa |
| `brand.purple` | Roxo Plenustech | `#6E2A92` | Identidade alternativa |

### Regra de uso

- `brand.orange`, `brand.blue` e `brand.purple` sao primitivas de identidade.
- Uma aplicacao seleciona uma identidade principal por tema.
- Componentes nao devem consumir `brand.*` diretamente.
- A identidade selecionada alimenta `color.primary` e seus estados derivados.
- Uma cor de marca nao recebe significado funcional automaticamente.

## Escalas tonais

As escalas abaixo sao uma referencia inicial para os temas. O nivel `50` preserva a cor oficial informada para cada identidade.

Os niveis claros sao destinados principalmente a superficies, fundos e containers. Os niveis escuros sao destinados principalmente a texto, bordas fortes e estados de interacao. A aplicacao final deve validar contraste antes de disponibilizar cada combinacao.

### Orange

Cor oficial: `#F26B35`

| Token | Hex | Uso de referencia |
| --- | --- | --- |
| `brand.orange.10` | `#FFF4EE` | Fundo muito sutil |
| `brand.orange.20` | `#FFE5D8` | Container claro |
| `brand.orange.30` | `#FFC4AA` | Borda clara |
| `brand.orange.40` | `#FA9870` | Estado intermediario |
| `brand.orange.50` | `#F26B35` | Cor principal da identidade |
| `brand.orange.60` | `#D95522` | Hover |
| `brand.orange.70` | `#B9441A` | Active |
| `brand.orange.80` | `#8F3418` | Borda escura ou texto |
| `brand.orange.90` | `#642615` | Texto em superficie clara |
| `brand.orange.100` | `#3A160D` | Maior profundidade |

### Blue

Cor oficial: `#49619C`

| Token | Hex | Uso de referencia |
| --- | --- | --- |
| `brand.blue.10` | `#F2F5FC` | Fundo muito sutil |
| `brand.blue.20` | `#E1E7F5` | Container claro |
| `brand.blue.30` | `#C1CDE9` | Borda clara |
| `brand.blue.40` | `#8EA2D0` | Estado intermediario |
| `brand.blue.50` | `#49619C` | Cor principal da identidade |
| `brand.blue.60` | `#3C5184` | Hover |
| `brand.blue.70` | `#30416A` | Active |
| `brand.blue.80` | `#263353` | Borda escura ou texto |
| `brand.blue.90` | `#1B253D` | Texto em superficie clara |
| `brand.blue.100` | `#101624` | Maior profundidade |

### Purple

Cor oficial: `#6E2A92`

| Token | Hex | Uso de referencia |
| --- | --- | --- |
| `brand.purple.10` | `#F8F1FB` | Fundo muito sutil |
| `brand.purple.20` | `#EBDCF3` | Container claro |
| `brand.purple.30` | `#D6B9E3` | Borda clara |
| `brand.purple.40` | `#A97AC0` | Estado intermediario |
| `brand.purple.50` | `#6E2A92` | Cor principal da identidade |
| `brand.purple.60` | `#5E237D` | Hover |
| `brand.purple.70` | `#4D1D67` | Active |
| `brand.purple.80` | `#3B164F` | Borda escura ou texto |
| `brand.purple.90` | `#291038` | Texto em superficie clara |
| `brand.purple.100` | `#17091F` | Maior profundidade |

## Neutros

Neutros nao representam identidades de marca. Eles sustentam superficies, textos, bordas e estados desabilitados.

| Nome | Hex | Papel inicial |
| --- | --- | --- |
| `neutral.graphite` | `#373435` | Texto forte e superficies escuras |
| `neutral.gray` | `#606062` | Texto secundario e metadados |
| `neutral.white` | `#FFFFFF` | Superficie clara e texto sobre cores escuras |
| `neutral.black` | `#000000` | Referencia tecnica e scrim |

Os neutros deverao receber uma escala propria antes da implementacao definitiva dos temas claro e escuro.

## Cores funcionais

As cores abaixo representam estados da interface, nao identidades de marca:

| Token primitivo | Hex | Token semantico inicial |
| --- | --- | --- |
| `status.green` | `#67BD50` | `color.success` |
| `status.red` | `#ED3237` | `color.danger` |
| `status.yellow` | `#FCB52F` | `color.warning` |

`color.info` deve possuir uma definicao semantica propria. A existencia da identidade azul nao obriga o sistema a usar azul como informacao.

As cores funcionais deverao receber variantes de fundo, borda, hover e texto durante a implementacao dos componentes de feedback. Essas variantes precisam ser validadas por contraste.

## Tokens semanticos

Os componentes devem consumir tokens semanticos, nunca a paleta de marca diretamente:

```css
.component {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-color: var(--color-border);
}
```

Exemplos de tokens semanticos relacionados a marca:

```text
color.primary
color.primary-hover
color.primary-active
color.primary-container
color.on-primary
```

Exemplos independentes da identidade escolhida:

```text
color.background
color.surface
color.text
color.text-secondary
color.border
color.success
color.warning
color.info
color.danger
```

## Mapeamento do tema principal

O tema laranja e o tema principal inicial da marca:

```text
color.primary        -> brand.orange.50
color.primary-hover  -> brand.orange.60
color.primary-active -> brand.orange.70
color.primary-container -> brand.orange.10
```

Temas alternativos podem trocar apenas a identidade de marca:

```text
Tema Blue:
color.primary -> brand.blue.50

Tema Purple:
color.primary -> brand.purple.50
```

O mapeamento completo de cada tema devera definir tambem `on-primary`, containers, bordas, foco e estados para os modos claro e escuro.

## Contraste e validacao

Nenhuma escala tonal deve ser considerada definitiva apenas por sua aparencia visual. Cada tema deve validar:

- Texto normal e texto grande.
- Texto sobre `primary`.
- Botoes e controles interativos.
- Estados hover, active, disabled e focus.
- Bordas necessarias para identificar controles.
- Mensagens de sucesso, alerta, informacao e erro.
- Combinacoes dos modos claro e escuro.

A validacao deve ocorrer antes da publicacao de um tema ou da exposicao de seus tokens como parte da API publica.

## Relacao com `TOKENS.md`

`TOKENS.md` define a politica geral de tokens primitivos, semanticos, temas, espacamento, tipografia, raios, elevacao, motion e breakpoints.

Este documento detalha exclusivamente a arquitetura de cores e o relacionamento entre identidades de marca, temas e tokens semanticos.

A regra permanece:

```text
Brand Color != Semantic Meaning
```
