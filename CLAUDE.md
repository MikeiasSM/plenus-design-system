# Os Mandamentos do Código

Estas regras orientam a escrita, evolução e manutenção do código do projeto. Devem ser aplicadas de forma consistente em toda implementação, independentemente de quem a desenvolva, incluindo código produzido ou assistido por Inteligência Artificial.

### 1. Respeite a documentação e a arquitetura

Arquivos de documentação e decisões arquiteturais não devem ser alterados arbitrariamente.

Toda alteração deve complementar, esclarecer ou evoluir o que já existe, sem limitar ou impor regras sem justificativa.

Toda decisão deve fazer sentido para o projeto e preservar sua coerência arquitetural.

### 2. Escreva código simples, claro e coeso

Prefira a solução mais simples que resolva corretamente o problema.

O código deve ser compreensível por sua própria estrutura, sem depender de conhecimento implícito ou explicações externas.

Boas práticas de programação e princípios de Clean Code devem orientar toda implementação.

### 3. Diga muito falando pouco

Use nomes claros e precisos para arquivos, componentes, funções, variáveis, propriedades e eventos.

Evite nomes genéricos quando um nome específico for possível.

O código deve revelar sua intenção sem exigir interpretação.

### 4. Uma responsabilidade por vez

Funções, hooks, componentes e módulos devem possuir responsabilidades claras e coesas.

Não misture responsabilidades diferentes apenas por conveniência.

Separe somente quando essa separação melhorar efetivamente a compreensão, manutenção ou reutilização.

### 5. Prefira fluxo simples e previsível

Evite aninhamentos excessivos, condições desnecessariamente complexas e funções extensas.

Prefira fluxo linear, retornos antecipados e pequenas funções com propósito definido.

### 6. Não duplique conhecimento

Evite duplicar regras, comportamentos ou decisões que deveriam existir em um único lugar.

Extraia uma abstração quando existir reutilização ou uma responsabilidade claramente compartilhada.

Não transforme qualquer semelhança em uma abstração.

### 7. Não esconda comportamento

O código deve deixar claro o que acontece.

Evite efeitos colaterais inesperados, funções que fazem mais do que seus nomes indicam e abstrações que dificultem localizar a lógica.

Uma abstração deve simplificar o código, nunca esconder sua complexidade.

### 8. Evite Overengineering

Não crie camadas, abstrações, padrões, serviços, factories, adapters, providers, hooks ou outros mecanismos sem necessidade real.

A complexidade da solução deve ser proporcional à complexidade do problema.

Antes de criar uma nova camada, pergunte:

> Existe um problema concreto que essa camada resolve agora?

Se a resposta for não, ela provavelmente não deve existir.

Prefira uma implementação direta e simples quando ela atender ao requisito atual.

### 9. Não antecipe problemas hipotéticos

Não construa soluções para cenários que ainda não existem apenas porque podem existir no futuro.

Evolua a arquitetura conforme necessidades reais surgirem.

Flexibilidade é importante; complexidade preventiva não.

### 10. Use o mínimo necessário de abstrações

Cada abstração possui custo de entendimento, manutenção e integração.

Uma abstração deve existir quando proporcionar benefício concreto, como reutilização real, isolamento de complexidade ou redução significativa de acoplamento.

Quanto menor a necessidade, menor deve ser a abstração.

### 11. Use comentários somente quando forem necessários

A premissa é simples:

> O código deve ser claro o suficiente para não precisar ser comentado.

Comentários soltos sobre métodos ou espalhados pelo código devem ser evitados e, quando realmente necessários, limitados a no máximo duas linhas.

Um breve comentário no topo de classes principais é permitido quando ajudar a explicar sua finalidade.

Não use comentários para justificar código confuso que poderia ser melhor estruturado.

### 12. Mantenha arquivos coesos

Cada arquivo deve possuir uma finalidade clara.

Evite concentrar componentes, hooks, utilitários e responsabilidades sem relação direta no mesmo arquivo.

Organização deve facilitar a descoberta do código, não criar uma hierarquia excessivamente fragmentada.

### 13. Dependências devem ser justificadas

Bibliotecas, frameworks e demais dependências devem ser maduras, mantidas e adequadas ao projeto.

Existe preferência por soluções open source.

Evite adicionar uma dependência para resolver problemas pequenos que podem ser resolvidos de forma simples pelo próprio projeto.

Toda nova dependência representa custo de atualização, compatibilidade, segurança e manutenção.

### 14. Teste o que realmente precisa de teste

Testes devem proteger comportamentos relevantes e reduzir riscos reais.

Não crie testes apenas para aumentar cobertura ou para validar código trivial.

Priorize testes sobre lógica, comportamentos, estados e componentes onde uma regressão possa gerar impacto significativo.

A quantidade de testes deve ser proporcional à complexidade e ao risco.

### 15. Contexto e processamento são recursos técnicos

O projeto deve evitar desperdício de processamento, código e contexto, especialmente durante desenvolvimento assistido por IA.

Solicitações, análises e implementações devem ser objetivas.

Não gere arquivos, abstrações, documentação, testes ou código adicional que não sejam necessários para resolver o problema.

Antes de implementar, compreenda o escopo. Depois, altere somente o necessário.

**Mais código não significa mais qualidade. Mais contexto não significa mais inteligência. A solução deve ser suficiente, não excessiva.**

### 16. Código preparado para mudança, não para qualquer mudança

O código deve ser fácil de evoluir, mas não precisa antecipar todas as possibilidades.

Busque baixo acoplamento, responsabilidades claras e contratos estáveis.

Não sacrifique simplicidade atual em nome de uma flexibilidade hipotética.

### 17. Revise antes de concluir

Antes de considerar uma implementação concluída, verifique:

* Existe código desnecessário?
* Alguma abstração pode ser removida?
* Alguma parte ficou mais complexa do que o problema exige?
* Há duplicação real?
* Os nomes estão claros?
* Existe algum comentário que poderia ser eliminado?
* Foram criados arquivos, testes ou camadas sem necessidade?

A última etapa da implementação deve ser reduzir, não aumentar.

## Princípio geral

> **Faça o necessário, da forma mais simples, clara e coesa possível.**
>
> **Toda complexidade deve possuir uma razão concreta para existir.**

## Versionamento

Nenhum commit, merge ou pull request deve conter linha de coautoria, assinatura de ferramenta ou qualquer marca de geração assistida. A autoria registrada é a do repositório.

Merge é executado somente em ambiente local. O `push` é feito exclusivamente pelo mantenedor do repositório.

## Idioma

Terminologia em português, no alcance que o corpus normativo já define:

| Elemento | Idioma | Norma |
| --- | --- | --- |
| Componentes | Inglês | `COMPONENTS.md` §12 |
| Hooks | Inglês | `ARCHITECTURE.md` §8 |
| Tokens primitivos, semânticos e tipográficos | Inglês | `TOKENS-REFERENCE-COLORS.md`, `TOKENS-REFERENCE-TYPOGRAPHY.md` |
| Formatadores e utilitários de apresentação | Português | `ARCHITECTURE.md` §9.1, `CONTRIBUTING.md` §8 |

`TOKENS.md` §3 e `ARCHITECTURE.md` §3 e §5 ilustram tokens com exemplos conceituais em português. Para cor e tipografia prevalecem os documentos de referência especializados, aos quais `TOKENS.md` delega o detalhamento.

Identificadores internos seguem a língua do módulo: o módulo de formatadores em português, os módulos de componente em inglês. Cada arquivo de teste segue a língua do módulo que testa.

Comunicação, comentários, mensagens de commit, documentação e Showcase: português.

## Nomenclatura de componentes

Componentes de uma mesma família são nomeados como **tipo seguido de especialização**: `InputText`, `InputNumber`, `InputPassword`, `InputCurrency`.

A ordem agrupa a família pelo prefixo, mantém a listagem do diretório e do autocompletar ordenada por tipo, e preserva a regra de `COMPONENTS.md` §12 — o nome continua representando a função, sem se prender a um produto.

Componentes de conceito único mantêm o nome simples: `Button`, `Badge`, `Avatar`, `Label`.
## Referências externas

Bibliotecas usadas como **referência de projeto**, não como dependências. Consultar conforme a necessidade, ao definir API, comportamento, acessibilidade ou base visual de um componente.

| Referência | Papel | Endereço |
| --- | --- | --- |
| Untitled UI | Base visual, exceto gráficos | https://www.untitledui.com/react/docs/introduction |
| React Aria | Comportamento e acessibilidade | https://react-aria.adobe.com/ |
| Radix UI | Composição e primitivos | https://www.radix-ui.com/ |
| shadcn/ui | Composição, desenho de API e base visual dos gráficos | https://ui.shadcn.com/ |
| Metabase | Base visual de `ChartPie`, `ChartDonut` e `ChartSankey` | https://www.metabase.com/ |
| AG Grid | Referência do `DataGrid` | https://www.ag-grid.com/ |
| D3.js | Núcleo de gráficos | https://d3js.org/ |

Consultar uma referência não autoriza instalá-la. Adotar qualquer uma como dependência real continua sujeito ao mandamento 13.

### Como cada referência entra

- **Comportamento** — React Aria entra **apenas como primitivo sem estado**: foco, posicionamento, rolagem, ponteiro e internacionalização. Onde o HTML nativo resolve, não entra.
- **Estado** — máquinas de coleção, seleção e navegação são State Motors do Design System, conforme `ARCHITECTURE.md` §7. Não se adota `react-stately`, nem os hooks do `react-aria` que recebem um objeto de estado de coleção: `useSelect`, `useListBox`, `useMenu`, `useComboBox`, `useTable`, `useCalendar`, `useDatePicker`. Também não se adota `react-aria-components`.
- **Visual** — Untitled UI sempre que houver referência correspondente, exceto nos gráficos.
- **Visual dos gráficos** — base híbrida: shadcn/ui na maioria da família, Metabase em `ChartPie`, `ChartDonut` e `ChartSankey`, Untitled UI onde nenhum dos dois tiver correspondente. Abrir o código da referência, não apenas a página: decisões de desenho que a documentação não traz vivem nele.
- **Estrutura, marcação e API pública** — sempre do Design System. Nenhuma referência define a árvore de elementos nem as propriedades públicas de um componente.

Primitivos admitidos: `FocusScope`, `useOverlay`, `useOverlayPosition`, `usePreventScroll`, `DismissButton`, `usePress`, `useHover`, `useFocusRing`, `useKeyboard`, `useId`, `mergeProps`, `VisuallyHidden`, `useFilter`, `useCollator`, `useDateFormatter` e o pacote `@internationalized/date`, que não possui acoplamento com React.

A adoção é por componente, nunca global. Usar um primitivo em `Select` não obriga a usá-lo em `Tabs`.

O React Aria entra **por trás da API do componente, nunca através dela**: nenhum tipo ou conceito dele aparece em propriedade pública. Se um primitivo não couber atrás da API desenhada, o sinal é abandoná-lo naquele componente, não dobrar a API.


## Corpus normativo e precedência

Este documento é operacional e **subordinado** ao corpus normativo do projeto.

Ordem de precedência: `README.md` → `ARCHITECTURE.md` → `TOKENS.md` (+ `TOKENS-REFERENCE-COLORS.md`, `TOKENS-REFERENCE-TYPOGRAPHY.md`) → `COMPONENTS.md` (+ `COMPONENTS-CATALOG.md`) → `CONTRIBUTING.md`.

Não normativos: `PROGRESS.md` (acompanhamento) e `showcase/` (demonstração).

Se um mandamento divergir de um documento normativo, o documento prevalece e a divergência deve ser sinalizada antes da implementação. Alterar um documento normativo exige decisão arquitetural aprovada.

### Fronteiras firmadas

**Composição não é overengineering.** `COMPONENTS.md` §3–§4 exige API composta quando a estrutura possui partes com controle independente. Os mandamentos 8 e 10 não autorizam colapsá-la em propriedades booleanas. O limite já está no §4: booleanos servem a variações simples.

**Acessibilidade não é camada opcional.** `ARCHITECTURE.md` §10 e `COMPONENTS.md` §7 e §11 colocam semântica, teclado, foco, ARIA e os testes correspondentes dentro da implementação do componente. Os mandamentos 8 e 14 não se aplicam contra eles.

**O mandamento 9 posterga, não proíbe.** Hooks e utilitários previstos em `ARCHITECTURE.md` §8 e §9 nascem quando um componente real os exigir. É a existência do problema concreto, no momento da correção, que autoriza a extração.
