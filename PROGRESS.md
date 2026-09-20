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
