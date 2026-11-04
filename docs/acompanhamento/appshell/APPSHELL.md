# AppShell e padrões de composição

Modelo decidido pelo mantenedor em 02/11/2026 e pendente de implementação. Documento não normativo, de acompanhamento: reúne o contexto que o implementador precisa. As normas já registram o que foi decidido; em caso de divergência, vale o `COMPONENTS-CATALOG.md` e o `TOKENS.md`.

## Situação

- **Fora do roadmap por enquanto.** Entra na 0.6.0 se a integração com o Painel não exigir nada de imediato dessa versão; se exigir, vai provavelmente para a 0.7.0.
- **Já registrado nas normas:**
  - `COMPONENTS-CATALOG.md`: `AppShell` e `PageHeader` (seção 8), `SidePanel` (seção 9), `FieldRow` e `SaveBar` (seção 3), todos como previstos. O parágrafo do `AppShell` descreve o modelo, e a frase do `Drawer` aponta o `SidePanel`.
  - `TOKENS.md` §5: o token `--pl-shell-gap`.
- **Já no código:** `--pl-shell-gap: 6px`, em `src/tokens/semantic/shell.css`, importado por `src/styles/tokens.css`. Nenhum componente o consome ainda.
- **Primeiro consumidor:** o Painel. A navegação atual dele já é próxima do modelo e pede só ajustes.

## Protótipos

Os quatro estão em [`prototipos/`](prototipos/), em HTML autocontido; abrem no navegador sem build. São referência de comportamento e de visual, não código para copiar: usam cores literais no lugar dos tokens e dados de exemplo.

| Arquivo | O que mostra | Publicado |
| --- | --- | --- |
| [`appshell.html`](prototipos/appshell.html) | O modelo genérico: tema, recolher, celular, camadas explodidas e as três alternativas de terceiro nível | [link](https://claude.ai/artifact/Pa88d1uK1mGUjWpXaKachk) |
| [`painel.html`](prototipos/painel.html) | O modelo numa tela real do Painel, a Base de Clientes: cards, gráficos, filtros no painel lateral, conta do usuário e aviso da conta | [link](https://claude.ai/artifact/9ku9qsTpz8SN5KJM9UGWse) |
| [`configuracoes.html`](prototipos/configuracoes.html) | Página com seções internas: índice de configurações e uma seção nos três arranjos | [link](https://claude.ai/artifact/HPkziNGL6DXwFkZbjej9ab) |
| [`composicoes.html`](prototipos/composicoes.html) | O aplicativo navegável com todas as composições de tela e as últimas decisões da moldura: marca no submenu, conta em cartão, avatar do trilho só recolhido, dica acima da página | [link](https://claude.ai/artifact/XE4hr38JF5bzaFZQnwvQeX) |

Os links publicados são privados do mantenedor. Também ficam com ele o canvas [Padrões de composição](https://claude.ai/artifact/Nsv3D8NFSmLp75Bm23KF2r), com 11 telas de referência (início, índices, detalhe, formulários, assistente, configurações, vazio), e o documento vivo das decisões, [AppShell e padrões de composição](https://claude.ai/artifact/X7rVMjNrKeC31RUiLC25n2), de onde este saiu.

Os números de Estado, Bairro, Tipo de Pessoa, Regime, Conceito e das métricas do `painel.html` vêm de capturas da instalação de demonstração do Painel. Rotas, atividades e os itens dos outros módulos são inventados.

## O modelo

### Camadas e moldura

- **Três camadas.** A base é o fundo da aplicação (`--pl-color-background`). O trilho de módulos e a página são folhas no mesmo nível: superfície, borda e `--pl-sh-1`. O submenu do módulo fica direto na base, entre as duas, sem folha própria. Só o item ativo do submenu sobe ao nível de folha.
- **Janela inteira.** A moldura ocupa a viewport; não há rolagem de página. Rolam só o corpo da página, a lista do submenu e os painéis laterais.
- **Rolagem discreta.** Fina, sem trilho e sem setas; o polegar aparece só com o ponteiro sobre a área que rola. No protótipo: `scrollbar-width: thin` e `scrollbar-color` transparente, revelado em `:hover`.
- **Raio único.** Todas as peças usam `--pl-radius-md`, da moldura aos itens.
- **Respiro.** `--pl-shell-gap` entre as folhas e entre elas e a borda da janela.

### Trilho de módulos

- No topo, a marca; depois os módulos, só com ícone; embaixo, um grupo fixo (no Painel: celular, modo escuro, Configurações) e o avatar.
- Sem rótulo visível, cada módulo tem nome acessível e dica.
- Clicar no módulo ativo alterna o submenu.

### Submenu

- Cabeçalho com o nome do módulo e o botão de recolher.
- Itens com ícone e rótulo; grupos com título; link externo com o ícone ao fim.
- **Abrir empurra a página**, sem sobreposição, véu nem foco preso. Recolher devolve a largura, e o botão de abrir aparece na barra da página.
- **Módulo sem submenu:** a página encosta no trilho.
- **Terceiro nível, em duas formas:**
  - *Expandir no lugar* (padrão): o item abre os filhos com recuo e linha-guia. Recolhido, o pai marca o caminho em destaque, sem fundo.
  - *Pilha*: o painel troca pelo nível de baixo, com o caminho de volta (`‹ Painéis`).
- Mais fundo que três níveis: o restante vai para o `TabsNav` na página.
- **Descartado:** submenu flutuante ao lado do item. Briga com o empurrar e não funciona por toque.

### Conta do usuário

- O gatilho é o bloco da conta, no rodapé do submenu, com uma seta que gira. Com o submenu recolhido, o avatar do trilho abre o submenu já na conta.
- Abre dentro do submenu, de baixo para cima, sem popover. **Duas formas:**
  - *Na altura das opções* (padrão): cresce acima do rodapé e empurra a lista do módulo para cima; a lista encolhe e rola, mas continua visível.
  - *Cobrindo a lista*: ocupa o submenu inteiro, com um cabeçalho da conta.
- Fecha ao clicar no bloco de novo, com Escape ou ao escolher uma opção; o foco volta ao bloco.
- **Aviso da conta** (no Painel, "Instalação de demonstração"): cartão em tom de aviso acima do rodapé. Com o submenu recolhido, vira um ponto no avatar, com o texto no nome acessível e na dica.
- As opções da conta são do produto.

### Celular

- Abaixo de 900px (`--pl-bp-sm`), a página ocupa a tela. Um botão de menu na barra da página abre uma gaveta com o trilho e o submenu juntos, nas mesmas camadas.
- A gaveta tem a interação do `Drawer`: véu, foco preso e Escape. Escolher um item, tocar num módulo sem submenu ou no véu fecha a gaveta, e o foco volta ao botão de menu.
- O protótipo não prende o foco na gaveta; o componente prende.

### Destaque

- A cor da paleta do produto em dois níveis. Passar o ponteiro: fundo no tom 10, ícone na cor. Selecionado: fundo no tom 20, linha no 30, texto no 80.
- No escuro, os tons saem da mistura da cor com a superfície, como o `--pl-color-primary-container`.
- **A resolver na implementação:** o tom 10 e o 30 já têm semântico (`--pl-color-primary-container`, `--pl-color-primary-line`), o 20 não. Decidir entre usar `--pl-palette-20` ou criar o semântico, conforme `TOKENS.md` §10.

### Medidas

| Medida | Valor |
| --- | --- |
| Respiro | `--pl-shell-gap` (6px) |
| Trilho | 56px |
| Submenu | 220 a 232px |
| Item do submenu | 34px; filho, 30px |
| Botão do trilho | 38px |
| Barra da página | 46px |

### Página

- **Barra da página:** o botão de abrir o submenu (ou o de menu, no celular), o caminho, o favorito, a hora da atualização e as ações globais da tela.
- **Cabeçalho (`PageHeader`):** título, descrição e selos ou chips de situação, separados do conteúdo por uma linha de borda a borda da folha. O texto usa a largura toda. Uma busca pode ocupar o lado direito. Fixar ou compactar ao rolar é do produto.
- **Painel lateral (`SidePanel`):** componente próprio, não peça do `AppShell`. Abre de qualquer lado e em qualquer situação, fica na base e empurra a página como o submenu. No celular, vira gaveta. No protótipo do Painel, os filtros.

## Padrões de composição

A página com seções internas usa o submenu do `AppShell` como navegação secundária. A página não repete a lista.

| Padrão | Regra |
| --- | --- |
| Três larguras | Total para índice e painel de dados; larga, 1120px, para índice de configurações, detalhe e formulário; estreita, 760px, para ajuste e etapa. O cabeçalho acompanha a coluna |
| Tudo em cartão | O conteúdo fica em cartões; o cabeçalho do cartão leva título, explicação e a ação local |
| Linha de ajuste (`FieldRow`) | Rótulo e explicação à esquerda, controle à direita; em largura estreita, o controle desce |
| Salvar por cartão | Cada cartão de ajustes tem Descartar e Salvar, ativos só com alteração pendente, e a situação ("Alterações não salvas", "Salvo agora") |
| Barra de não salvo (`SaveBar`) | Para o formulário inteiro, no lugar do salvar por cartão |
| Zona de perigo | A ação destrutiva fica num cartão próprio no fim, com borda e botão no tom de perigo |
| Índice de configurações | Grupos em cartão, cada item com nome e estado; o estado que pede ação aparece em tom de perigo |

**Arranjo da seção.** Os três valem, nesta ordem de prioridade; na dúvida, o anotado:

1. **Anotado (trilho)**, 1120px: título e explicação à esquerda, o cartão à direita, linha a linha.
2. **Empilhado**, 760px: cartões em coluna, cada um com seu título.
3. **Com índice**, 1000px: cartões em coluna e a lista *Nesta página* ao lado, acompanhando a rolagem.

Abaixo de 820px de folha, os três viram coluna única, e o índice lateral some. A largura é medida pela folha (container query), não pela janela.

## Showcase

Uma seção própria de composição, com os padrões de tela montados com os componentes reais: a moldura, as três larguras, o cabeçalho, o salvar por cartão, a zona de perigo e os três arranjos. Depende dos componentes acima.

## Para o implementador

- **Nomes a confirmar** com o mantenedor antes de implementar: `SidePanel`, `PageHeader`, `FieldRow` e `SaveBar`. `AppShell` está confirmado.
- **API composta** (rascunho, a desenhar antes): `AppShell.Rail`, `AppShell.RailItem`, `AppShell.Panel`, `AppShell.PanelItem`, `AppShell.Page`. O estado do submenu vem no trio `open`, `defaultOpen` e `onOpenChange` (`CONTRIBUTING.md` §10). O link é o da aplicação, recebido como no `Breadcrumb`. Os módulos, o roteamento e o conteúdo da conta são do produto.
- **Reaproveitar:** a gaveta do celular usa a mecânica do `Drawer` (`DialogFrame`); o terceiro nível *abas na página* é o `TabsNav`.
- **Acessibilidade:** trilho e submenu em `nav` com nome; `aria-current="page"` no item atual; `aria-expanded` e `aria-controls` no recolher, nos itens com filhos e no gatilho da conta; o submenu recolhido e a gaveta fechada ficam `inert`; o foco volta ao gatilho ao fechar.
- **Referências:** base visual no Untitled UI; comportamento por primitivos do React Aria só onde o HTML nativo não resolve, conforme `CLAUDE.md`.
- **Versão:** é adição compatível (A), mas o token já existe no pacote. Se a integração empurrar o `AppShell` para a 0.7.0, avaliar com o mantenedor se o token fica até lá.
