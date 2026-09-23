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
- Diretrizes primarias de programacao definidas em `CLAUDE.md`, subordinadas ao corpus normativo.
- Regra de idioma definida: componentes, hooks e tokens em ingles; formatadores e utilitarios de apresentacao em portugues.
- Nomenclatura dos tokens confirmada como conforme aos documentos de referencia de cores e tipografia, que prescrevem ingles.
- Formatadores renomeados para `formatarEntradaDecimal` e `formatarEntradaMonetaria`, preservando `formatarMoeda` para a formatacao de apresentacao prevista na arquitetura.
- Formatadores passam a converter valores numericos para a convencao decimal brasileira e a preservar o sinal negativo.
- `formatarEntradaMonetaria` deixa de emitir virgula orfa quando nao ha casas decimais.
- `Input`, `NumberInput`, `CurrencyInput` e `PasswordInput` passam a derivar o valor exibido em vez de espelhar estado, eliminando os efeitos de sincronizacao.
- `CurrencyInput` reflete mudancas externas de valor mesmo durante o foco.
- `NumberInput` deixa de expor `onChange`, restando `onValueChange` como canal unico do valor normalizado.
- `PasswordInput` desabilita o botao de visibilidade junto com o campo.
- `validateOnBlur` passa a escolher o gatilho da validacao: blur por padrao, mudanca quando desativado.
- Preferencia de movimento reduzido respeitada globalmente em `globals.css`.
- Variantes de texto das cores funcionais criadas conforme `TOKENS-REFERENCE-COLORS.md`, que ja as previa: `on-primary-container`, `on-success-container`, `on-warning-container`, `on-danger-container`, `on-info-container` e `danger-text`.
- Neutro terciario recalibrado para `#6E7175` no claro e `#8E9297` no escuro, corrigindo hints, placeholders e contadores.
- `primary` deixa de ser usado como texto sobre fundo claro em Button secundario, toggle de senha e links, cedendo lugar a `primary-active`.
- Convencao de nomenclatura definida como tipo seguido de especializacao, registrada em `CLAUDE.md`.
- `COMPONENTS.md` secao 12 atualizada: `DataTable` era nomenclatura antiga e deu lugar a `Table` para o componente basico e `DataGrid` para o completo.
- Bibliotecas de referencia do projeto registradas em `CLAUDE.md`: Untitled UI, React Aria, Radix UI, shadcn/ui, AG Grid e D3.
- `Button` em carregamento deixa de usar `disabled` e passa a usar `aria-disabled` com `aria-busy`, preservando o foco e o anuncio do estado. O clique e bloqueado no handler.
- `aria-live` removido dos contadores de caractere de `InputText` e `InputPassword`, que anunciavam a cada tecla. A contagem permanece acessivel por `aria-describedby`.
- Decidido que o React Aria entra apenas como primitivo de comportamento sem estado. Maquinas de colecao, selecao e navegacao permanecem como State Motors proprios, conforme `ARCHITECTURE.md` secao 7.
- Descartados `react-aria-components`, `react-stately` e os hooks do `react-aria` que recebem estado de colecao. Radix, shadcn/ui e Tailwind descartados como fundacao, por cederem DOM e estado e por conflitarem com o CSS Modules exigido em `ARCHITECTURE.md` secao 4.
- Componentes de formulario renomeados para `InputText`, `InputNumber`, `InputPassword` e `InputCurrency`, com diretorios, arquivos, tipos, testes, API publica e Showcase alinhados.
- `Button` variante `danger` solida passa a consumir `--pl-color-danger-solid`, em 6.95:1 no claro e 5.44:1 no escuro.
- Ultima referencia a token primitivo dentro de componente removida, com a criacao de `--pl-color-on-danger`.
- Contraste validado em WCAG AA em todas as combinacoes de texto e de componente, exceto as excecoes aceitas registradas adiante.
- Emissao de `vite.config.js` eliminada, encerrando o sombreamento do arquivo de configuracao.
- Componente interno `Field` extraido com o cromo de campo: envoltorio, rotulo, mensagem de ajuda ou erro, contador e fiacao de `id` e `aria-describedby`. Nao e exportado pela API publica.
- `InputText` e `InputPassword` passam a consumir `Field`, eliminando a duplicacao que havia exigido a mesma correcao de `aria-live` em dois lugares.
- Componente `Textarea` implementado sobre `Field`, com tamanhos, contador, redimensionamento vertical, testes, exportacao publica e documentacao no Showcase.
- Ultimo token legado consumido por componente eliminado: `--pl-danger-soft` deu lugar a `--pl-color-danger-container` no anel de foco de erro.
- Componentes `Checkbox`, `RadioGroup` com `Radio`, e `Switch` implementados sobre controles nativos com `appearance: none`, incluindo estado indeterminado, propagacao de desabilitado e semantica de grupo por `fieldset` e `legend`.
- Componentes `Alert`, `Progress` e `Spinner` implementados em `src/components/feedback/`.
- `Alert` define a urgencia pelo tom: aviso e erro usam `role="alert"`, informacao e sucesso usam `role="status"`.
- `Progress` suporta modo indeterminado, omitindo `aria-valuenow`, e limita o valor a faixa declarada.
- `Spinner` extraido do `Button`, que passou a consumi-lo. Fica decorativo sem rotulo e assume `role="status"` quando recebe um.
- `Spinner` redesenhado como trilho cinza com arco colorido, parametrizado por `--spinner-arc` e `--spinner-track`. O `Button` sobrescreve os dois para manter o indicador na cor da variante.
- Todos os seis componentes documentados no Showcase e exportados pela API publica.
- Contraste dos novos componentes validado: preenchimento do `Progress`, marca do `Checkbox`, polegar do `Switch` e textos do `Alert`.
- Borda dos controles de formulario mantem o neutro `--pl-color-border-strong` em repouso e passa a `--pl-color-primary` no hover, unico estado que altera a borda. Antes o hover usava o cinza escuro `--pl-color-text-tertiary`.
- Hover dos controles ganha elevacao discreta com `--pl-sh-1`, acompanhando o padrao ja existente no `Button`. Campos em erro recebem a mesma sombra sem perder a borda de perigo.
- Foco dos campos mantido como borda em `--pl-color-primary` mais halo de `primary-container`. O `outline` deslocado chegou a ser adotado e foi revertido por decisao visual: produzia borda dupla.
- Sinal visivel do foco passa a ser a troca da borda, em 3.03:1 no claro e 5.57:1 no escuro. O halo e decorativo, em 1.08:1.
- Corrigida a precedencia do hover sobre o estado de erro, que antes pintava de laranja a borda de um campo invalido.
- Preenchimento do `Progress` clareado de `primary-active` para `primary-hover`, o tom mais claro que ainda alcanca o minimo de 3:1 contra o trilho.
- Borda de campo no hover alcanca 3.03:1 no claro e 5.57:1 no escuro. Em repouso segue como excecao aceita.

### Em construcao

- Showcase visual derivado de um mock de implementacao anterior.
- Migracao gradual do Showcase estatico para componentes oficiais.
- Expansao do Showcase React para os proximos componentes oficiais.
- Consolidacao do bloco legado de `tokens.css` com as camadas primitiva e semantica.
- Validacao da carga das familias e pesos tipograficos definidos.

### Ainda nao implementado

- Componentes das etapas 6 a 9 da ordem de implementacao.
- Hooks reutilizaveis em `src/hooks/`.
- Utilitarios de apresentacao previstos em `ARCHITECTURE.md` secao 9.1, como `formatarMoeda` e `formatarData`.
- State Motors para componentes complexos.
- Biblioteca oficial de icones, prevista em `ARCHITECTURE.md` secao 12.
- Temas alternativos de marca, previstos em `TOKENS-REFERENCE-COLORS.md`.
- Testes de tema escuro, de importacao do pacote construido e verificacao automatizada de contraste.
- Pipeline de validacao e publicacao do pacote.
- Showcase consumindo o pacote como aplicacao externa, em vez do alias local.

## Pendencias de correcao identificadas no review

- Validar o contraste antes de publicar um tema ou expor os tokens como API publica, conforme exige `TOKENS-REFERENCE-COLORS.md`. As excecoes aceitas abaixo precisam ser revistas ou formalizadas nesse momento.
- Avaliar Untitled UI, React Aria, Radix UI, AG Grid e D3 como referencia ao especificar cada novo componente, sem transforma-las em dependencia sem a justificativa do mandamento 13.
- Definir o idioma dos tokens de raio, espacamento e motion na consolidacao de `tokens.css`. Nenhum documento de referencia os cobre, e `TOKENS.md` secoes 7 e 8 os exemplifica em portugues.
- Promover as decisoes arquiteturais registradas no cabecalho de `tokens.css` para o documento normativo adequado, antes de enxugar o comentario.
- Corrigir o contador do `InputText` e do `InputPassword` nao controlados apos reset de formulario.
- Evitar que o `Avatar` espalhe propriedades de imagem no elemento de fallback.
- Configurar `main`, `module`, `exports` e `types` para consumo externo do pacote quando a publicacao for preparada.
- Exportar os formatadores pela API publica quando fizerem parte do contrato de consumo.
- Consolidar os tokens antigos e novos, removendo ambiguidades entre `tokens.css` e as camadas primitivas/semanticas.
- Definir qual Showcase e a referencia oficial e evitar divergencia entre a entrada estatica e a entrada React.
- Ampliar testes para controlled inputs, temas dark, limites de escala, acessibilidade e importacao do pacote construido.

## Excecoes de contraste aceitas

Falhas conhecidas, mantidas por decisao visual do mantenedor apos comparacao lado a lado das alternativas.

- `Button` variante `primary` solida: texto branco sobre `brand.orange.50` em 3.03:1, contra o minimo de 4.5:1. Mantido o laranja de marca.
- `Button` variante `primary` solida, contorno contra o fundo da pagina: 2.83:1 no tema claro, contra o minimo de 3:1. Passa em 6.03:1 no tema escuro.
- `--pl-color-border-strong` como contorno de campo em repouso: 1.33:1 no claro e 1.57:1 no escuro, contra o minimo de 3:1. Mantida a borda discreta. No hover e no foco a borda alcanca 3.03:1 e 5.57:1.
- Halo de foco em `primary-container`: 1.08:1, decorativo. O sinal acessivel do foco e a troca da borda, nao o halo. Consequencia: com ponteiro, foco e hover ficam visualmente iguais. Quem depende do indicador de foco navega por teclado e nao dispara hover.

As demais combinacoes de texto e de componente passam em AA nos dois temas.

## Contexto para implementacoes futuras

### Formatadores e localidade

Os formatadores de entrada assumem a convencao pt-BR no codigo: virgula como decimal, ponto como milhar. Isso e escopo adequado ao momento, nao defeito, pelo mandamento 9.

A localidade deve entrar quando o formatador de apresentacao previsto em `ARCHITECTURE.md` secao 9.1 for construido, com a assinatura que o documento ja define. Nesse momento, `Intl.NumberFormat` resolve separadores, simbolo e agrupamento sem dependencia externa, e vale revisar se as mascaras de entrada devem derivar os separadores da mesma fonte.

Atencao a um detalhe de compatibilidade: `Intl.NumberFormat` usa espaco nao separavel entre o simbolo da moeda e o numero, diferente do espaco comum usado hoje.

### Campos numericos e monetarios

- `InputText` generico nao deve formatar valores.
- `InputNumber` deve separar claramente valor bruto, valor exibido, parser e formatter.
- O modo inteiro nao aceita virgula ou ponto e nao aplica casas decimais.
- O modo decimal usa virgula como separador e respeita `decimalScale`.
- `InputCurrency` deve manter a edicao bruta durante o foco e aplicar a formatacao monetaria no blur.
- Mudancas externas em componentes controlled devem ser refletidas mesmo durante o foco, conforme o contrato definido.
- `onChange` e callbacks de valor normalizado precisam ter responsabilidades distintas e documentadas.

### InputPassword

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

1. **Fundacao do projeto** — concluida
   - Stack, `package.json`, TypeScript, build e estrategia de testes definidos.
   - Ponto de entrada publico criado.

2. **Tokens e estilos globais** — em andamento
   - Camadas primitiva e semantica organizadas. Contraste validado em AA, com as excecoes aceitas registradas.
   - Pendente: consolidar o bloco legado de `tokens.css` e definir o idioma dos tokens de raio, espacamento e motion.

3. **Componentes primitivos** — concluida
   - `Button`, `Label`, `InputText`, `InputNumber`, `InputPassword`, `InputCurrency`, `Badge` e `Avatar`, com testes e exportacao publica.

4. **Campo compartilhado e Textarea** — concluida
   - Componente interno `Field` concentra rotulo, ajuda, mensagem de erro, contador e fiacao de `id` e `aria-describedby`.
   - `InputText`, `InputPassword` e `Textarea` consomem `Field`. O valor da contagem permanece em cada controle, que e quem detem o valor.

5. **Controles de selecao e feedback** — concluida
   - `Checkbox`, `RadioGroup` com `Radio`, `Switch`, `Alert`, `Progress` e `Spinner` implementados sobre HTML nativo, sem overlay e sem State Motor.
   - `Button` consome `Spinner` em vez do indicador proprio.

6. **State Motor de selecao**
   - Construir o motor compartilhado de colecao, selecao, chave focada e typeahead, independente de JSX e testado isoladamente, conforme `ARCHITECTURE.md` secao 7.
   - Antecede a etapa 7 porque define a forma de `Select`, `ComboBox`, `Menu`, `ListBox` e `Table`.

7. **Familia de overlays**
   - Implementar `Dialog`, `Popover`, `Tooltip`, `Menu`, `Select` e `ComboBox` juntos, compartilhando os primitivos de foco, posicionamento e trava de rolagem.
   - Primeiro uso dos primitivos do React Aria admitidos em `CLAUDE.md`.

8. **Navegacao e composicao**
   - Implementar `Tabs`, `Accordion`, `Breadcrumb` e `Pagination`.
   - Definir composicao, gerenciamento de foco e comportamento de fechamento.

9. **Tabelas e datas**
   - Implementar `Table` basico em HTML nativo, com ordenacao e selecao. `DataGrid` fica em decisao propria, com AG Grid como referencia.
   - Implementar `DatePicker`, `TimePicker` e `DateTimePicker` sobre `@internationalized/date`, junto com o formatador de apresentacao previsto em `ARCHITECTURE.md` secao 9.1.

10. **Showcase como consumidor**
   - Definir a entrada oficial unica e substituir os blocos estaticos por componentes oficiais.
   - Preservar o Showcase como demonstracao, validacao visual e ambiente de integracao.

11. **Integracao e distribuicao**
   - Configurar `main`, `module`, `exports` e `types`, emitir declaracoes e validar o pacote construido.
   - Revisar as excecoes de contraste aceitas, conforme exige `TOKENS-REFERENCE-COLORS.md`.

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
