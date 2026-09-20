# Progresso de implementacao

Este documento acompanha a implementacao do Plenustech Design System em relacao a documentacao oficial do repositorio.

Ele nao substitui, interpreta ou altera `README.md`, `ARCHITECTURE.md`, `COMPONENTS.md`, `TOKENS.md` ou `CONTRIBUTING.md`. Esses documentos sao a fonte normativa do projeto.

## Estado atual

### Definido

- Arquitetura e limites do Design System.
- Separacao entre Design System, Showcase e aplicacoes consumidoras.
- Principios de composicao, acessibilidade e independencia de dominio.
- Organizacao conceitual de tokens primitivos, semanticos e temas.
- Convencoes para componentes, CSS Modules, testes e API publica.
- Referencia de cores em `TOKENS-REFERENCE-COLORS.md`.
- Referencia tipografica em `TOKENS-REFERENCE-TYPOGRAPHY.md`.
- `TOKENS.md` atualizado com links para as referencias especializadas.
- Remocao do README local de `src/components/`, mantendo apenas a documentacao Markdown da raiz.
- Stack inicial definida: React, TypeScript, Vite, npm e Node 20 LTS.
- Estrutura inicial de pacote, TypeScript, build e Vitest criada.
- Ponto de entrada `src/index.ts` criado para os estilos globais.
- Teste de fumaça da fundacao criado.
- Camadas iniciais de tokens de marca, neutros, status, cores semanticas e tipografia criadas.
- Cores e fontes oficiais conectadas aos aliases legados durante a migracao.
- Showcase atualizado para carregar apenas os pesos tipograficos definidos.
- Primeiro componente oficial `Button` implementado com CSS Module, variantes, tamanhos, loading e testes.
- `Button` exportado pelo ponto de entrada publico `src/index.ts`.
- Componente primitivo `Label` implementado com CSS Module, associacao nativa, indicador obrigatorio e testes.
- `Label` exportado pelo ponto de entrada publico `src/index.ts`.
- Componente primitivo `Input` implementado com CSS Module, label, hint, erro, tamanhos e testes de acessibilidade.
- `Input` exportado pelo ponto de entrada publico `src/index.ts`.
- `Input` ampliado com `maxLength`, `showCharacterCount`, contagem controlada/nao controlada e anuncio acessivel.
- Formatter `formatDecimalInput` criado para normalizacao de inteiros e decimais com virgula e escala configuravel.
- Componente `NumberInput` implementado para inteiros e decimais com controle de casas, testes e exportacao publica.
- `NumberInput` integrado ao Showcase com exemplos de quantidade inteira e decimal.
- Componente `PasswordInput` implementado como componente independente, com toggle de visibilidade, autocomplete, erro e contador.
- `PasswordInput` exportado e documentado no Showcase.
- `PasswordInput` bloqueia copia e corte por padrao, permite opt-in com `allowCopy` e preserva colagem/autofill.
- Limite de seguranca do navegador documentado: extensoes e scripts privilegiados nao podem ser impedidos pelo componente.
- `PasswordInput` fornece `validate`, `validateOnBlur` e `onValidationChange` para regras de produto sem politica fixa embutida.
- Formatter `formatCurrencyInput` criado para moeda, milhares e duas casas decimais.
- Componente `CurrencyInput` implementado com edicao bruta, formatacao no blur e valor interno separado.
- `CurrencyInput` exportado e documentado no Showcase.
- Componente `Avatar` implementado com tamanhos, imagem, fallback por iniciais e tratamento de falha.
- `Avatar` exportado e documentado no Showcase.
- `Label` e `Input` integrados ao Showcase React com exemplos de associacao, ajuda, erro, disabled e tamanho compacto.
- Componente primitivo `Badge` implementado com CSS Module, tons semanticos, dot, outline e testes.
- `Badge` exportado pelo ponto de entrada publico `src/index.ts`.
- Showcase React reorganizado como documentacao por categorias.
- Cada componente documentado possui demonstracoes funcionais, tipos/variantes/estados e exemplo de implementacao.
- Button, Input e Badge organizados nas categorias Acoes, Formularios e Data display.
- Entrada React inicial do Showcase criada em `showcase/app/`.
- Showcase React configurado para consumir o Button pelo alias local `@plenus`.
- Scripts `dev:showcase`, `build:showcase` e `preview:showcase` adicionados.
- Tokens visuais iniciais em `src/styles/tokens.css`.
- Estilos globais iniciais em `src/styles/globals.css`.

### Em construcao

- Showcase visual derivado de um mock de implementacao anterior.
- Migracao gradual do Showcase estatico para componentes oficiais.
- Consolidacao da nomenclatura definitiva dos tokens entre a documentacao e a implementacao.
- Validacao tecnica das escalas tonais, contraste e combinacoes de temas.
- Validacao da carga das familias e pesos tipograficos definidos.
- Criacao da estrutura de componentes em `src/components/`.
- Migracao do Showcase para React + Vite.
- Expansao do Showcase React para os proximos componentes oficiais.

### Ainda nao implementado

- API publica de componentes e exportacoes definitivas em `src/index.ts`.
- Estrutura de tokens primitivos e semanticos conforme a arquitetura.
- Hooks reutilizaveis.
- Utilitarios de apresentacao.
- Componentes React oficiais.
- CSS Modules por componente.
- State Motors para componentes complexos.
- Testes automatizados de componentes, acessibilidade e comportamento.
- Pipeline de build, validacao e publicacao do pacote.
- Showcase consumindo o pacote como aplicacao externa.

## Pendencias de correcao identificadas no review

- Corrigir o comportamento controlled do `CurrencyInput` quando o valor externo muda durante o foco.
- Corrigir o tratamento de `decimalScale={0}` no formatter monetario.
- Definir e corrigir o contrato de `NumberInput.onChange`, evitando divergencia entre o evento recebido e o valor exibido.
- Corrigir o estado disabled do `PasswordInput`, incluindo o botao de mostrar/ocultar.
- Definir o comportamento de `validateOnBlur={false}` e garantir que a validacao customizada sempre tenha um ciclo previsivel.
- Configurar `main`, `module`, `exports` e `types` para consumo externo do pacote quando a publicacao for preparada.
- Exportar os formatadores pela API publica quando fizerem parte do contrato de consumo.
- Consolidar os tokens antigos e novos, removendo ambiguidades entre `tokens.css` e as camadas primitivas/semanticas.
- Definir qual Showcase e a referencia oficial e evitar divergencia entre a entrada estatica e a entrada React.
- Ampliar testes para controlled inputs, temas dark, limites de escala, acessibilidade e importacao do pacote construido.

## Contexto para implementacoes futuras

### Campos numericos e monetarios

- `Input` generico nao deve formatar valores.
- `NumberInput` deve separar claramente valor bruto, valor exibido, parser e formatter.
- O modo inteiro nao aceita virgula ou ponto e nao aplica casas decimais.
- O modo decimal usa virgula como separador e respeita `decimalScale`.
- `CurrencyInput` deve manter a edicao bruta durante o foco e aplicar a formatacao monetaria no blur.
- Mudancas externas em componentes controlled devem ser refletidas mesmo durante o foco, conforme o contrato definido.
- `onChange` e callbacks de valor normalizado precisam ter responsabilidades distintas e documentadas.

### PasswordInput

- A senha inicia mascarada e a revelacao exige acao explicita.
- Copia e corte sao bloqueados por padrao, mas colagem e autocomplete permanecem permitidos.
- O botao de visibilidade deve respeitar o estado disabled do campo.
- Validacoes de produto devem ser configuraveis, sem transformar regras como maiuscula, minuscula, numero ou caractere especial em variantes visuais.
- A API deve definir claramente quando validar, como expor a mensagem e como informar o resultado ao produto.
- Forca da senha, quando necessaria, deve ser um mecanismo ou componente separado da entrada basica.

### Distribuicao e API publica

- O pacote documentado para consumidores precisa possuir entrypoint, exports e declaracoes TypeScript configurados.
- Utilitarios reutilizaveis so devem ser considerados parte da API publica quando forem exportados por `src/index.ts`.
- O Showcase deve consumir componentes oficiais e possuir uma fonte de entrada claramente definida.

## Ordem de implementacao

1. **Fundacao do projeto**
   - Definir stack, `package.json`, TypeScript, build e estrategia de testes.
   - Criar o ponto de entrada publico.

2. **Tokens e estilos globais**
   - Organizar tokens primitivos e semanticos.
   - Consolidar temas, tipografia, espacamento, raios, sombras, motion e breakpoints.
   - Manter `globals.css` restrito ao escopo definido na arquitetura.

3. **Componentes primitivos**
   - Implementar primeiro componentes de baixa complexidade, como Button, Badge, Input, Label e Avatar.
   - Criar testes e exportacoes publicas junto com cada componente.

4. **Componentes de formulario e feedback**
   - Implementar Select, Checkbox, Radio, Switch, Textarea, Alert, Progress e Spinner.
   - Validar teclado, foco, estados acessiveis e temas.

5. **Componentes compostos e overlays**
   - Implementar Accordion, Tabs, Menu, Tooltip, Dialog/Modal e componentes relacionados.
   - Definir composicao, gerenciamento de foco e comportamento de fechamento.

6. **Componentes complexos e State Motors**
   - Implementar DatePicker, TimePicker, DateTimePicker, tabelas e seletores complexos.
   - Separar estado e transicoes quando a complexidade justificar.

7. **Showcase como consumidor**
   - Substituir gradualmente os blocos estaticos por componentes oficiais.
   - Preservar o Showcase como demonstracao, validacao visual e ambiente de integracao.

8. **Integracao e distribuicao**
   - Validar build, testes, acessibilidade, responsividade e temas.
   - Documentar o fluxo de consumo e preparar a publicacao do pacote.

## Ordem recomendada de leitura da documentacao

1. `README.md` — visao geral, objetivo, limites e estrutura do projeto.
2. `ARCHITECTURE.md` — dependencias, camadas e decisoes arquiteturais.
3. `TOKENS.md` — linguagem visual, temas e regras de valores compartilhados.
   - `TOKENS-REFERENCE-COLORS.md` — referencia detalhada de cores e temas.
   - `TOKENS-REFERENCE-TYPOGRAPHY.md` — referencia detalhada de tipografia.
4. `COMPONENTS.md` — classificacao, APIs, composicao e acessibilidade dos componentes.
5. `CONTRIBUTING.md` — processo pratico para implementar e revisar alteracoes.
6. `showcase/` — referencia visual e validacao pratica da implementacao.
7. `PROGRESS.md` — estado atual da implementacao e proximas etapas.

A ordem segue do geral para o especifico: primeiro o contrato do projeto, depois a arquitetura, os fundamentos visuais, os componentes, o processo de contribuicao e, por fim, o estado concreto da implementacao.

## Regra de manutencao

Alteracoes nos documentos normativos devem ocorrer somente quando houver uma decisao arquitetural ou de produto que justifique a mudanca e mediante aprovacao. Atualizacoes rotineiras de andamento devem ser feitas neste arquivo.
