# Contexto de sessão — descartável

Arquivo temporário para retomar o trabalho em outra sessão. **Não versionado, não normativo.**
Apague quando não precisar mais.

O estado do projeto está no `PROGRESS.md`. Aqui fica só o que ficou na conversa e não coube lá:
decisões pendentes do mantenedor e o material bruto que ele forneceu.

---

## Onde paramos

**O catálogo está fechado, menos o `DataGrid`.** Todos os demais componentes constam como
*Disponível* em `COMPONENTS-CATALOG.md`, implementados, testados, exportados e demonstrados no
Showcase. A família de gráficos está completa: o `ChartCombo` fechou os doze.

Suíte em **535 testes, 66 arquivos**. Build da biblioteca e do Showcase validados. O `main` está
**6 commits à frente do `origin/main`** — o `push` é do mantenedor.

Para ver: `npm run dev:showcase`. O **seletor de tema escuro** fica no topo da barra lateral.

**Nada desta sessão foi verificado em navegador real.** O jsdom não tem layout nem quadro a quadro:
geometria é aferida por atributo, e o movimento é testado com `matchMedia` e `requestAnimationFrame`
simulados.

---

## O que a sessão anterior entregou

Em ordem cronológica, com o commit de cada etapa:

1. `e47efaf` — moldura cartesiana extraída, `d3-shape` como cálculo, escala de raio.
2. `5b8efcc` — família cartesiana: `ChartLine`, `ChartArea`, `ChartScatter`, `ChartWaterfall`.
3. `a2a6acf` — fim das medidas fixas: margens derivadas dos rótulos, angulação automática, eixos em
   três estados nos dois lados, legenda posicionável, altura pelo contêiner, realce por faixa.
4. `27af62e` — os seis restantes: `ChartPie`, `ChartDonut`, `ChartRadial`, `ChartTreemap`,
   `ChartSunburst`, `ChartSankey`; movimento em toda a família e legenda que desliga série.
5. `a7cb0ea`, `0b1b83d`, `a82a755`, `c288189`, `ebb9d44`, `2518957`, `6739cf4`, `cfcbb3d`,
   `33c4800`, `bd5dfea`, `7688119` — as correções pedidas por você, gráfico a gráfico.
6. `d303b92` — alternância de tema no Showcase.
7. `509c4be` — `formatarMoeda`, `formatarNumero`, `formatarPercentual`.
8. `0d47a41` — medidas de espaço dos gráficos num lugar só.
9. `508a4c5` — biblioteca oficial de ícones, sobre Bootstrap Icons.
10. `b74e4ad` — revisão: três molduras viraram uma, testes no componente certo.

---

## O que esta sessão entregou

1. `5f3490a` — cores de dados no `TOKENS-REFERENCE-COLORS.md`: paleta de séries, intenções, cromo do
   gráfico e o critério de validação com simulação de daltonismo.
2. `d88a963` — referência visual híbrida dos gráficos na tabela do `CLAUDE.md`, com o Metabase
   nomeado.
3. `dfb1c82` — `charts/` na estrutura do `README.md`.
4. `2a030cf` — decisões registradas no `PROGRESS.md`; seis pendências de review baixadas.
5. `8957811` — traço da linha, marcador e repartição da faixa reunidos no núcleo, ao virarem
   duplicata com a chegada do combo.
6. `4a0f33f` — `ChartCombo`, com eixo declarado por série.
7. `bf3bee1` — alinhamento da legenda horizontal, centrada por padrão.
8. `5453e3b`, `e45cd69`, `30da012` — pacote pronto para consumo externo: `exports`, declarações,
   peer dependencies, folha de estilo documentada, `private` removido e `prepare` construindo na
   instalação.
9. `2e87110`, `e09b88e` — `ChartTooltip`, com `onHoverCategory` em dois cartesianos.
10. `a9df04c` — Showcase estático removido; a entrada React passa a ser a oficial.
11. `fa3df32`, `dcc0dcf`, `95f89a2`, `0a1af55`, `0af5141` — as etapas 1 a 3 do plano dos nove
    pontos: coluna calculada sem base, `useHoveredBand` e `BandCursor` no núcleo, `onHoverStep` no
    `ChartWaterfall`, e os dois scripts de conferência.

Decisões que você fechou nesta sessão: manter `paletteWithAccent`, `resolveSeriesColors` e
`seriesColors` na API pública; `Table` em mono no conteúdo inteiro; eixo duplo explícito por série.

---

## Decisões que dependem do mantenedor

1. **Tooltip de gráfico por portal.** Adiado por você. Os doze ficaram com `<title>` por marca. É o
   maior item pendente da família e é o `ListTooltip` que você descreveu.
2. **`DataGrid`** — escopo levantado a partir do AG Grid, sem data. Você quer conversar no momento
   certo.
3. **`--pl-chart-series-4` reprova em contraste no tema claro**, com 2,55:1 contra o piso de 3:1
   da WCAG 1.4.11. O `npm run check:contraste` falha por causa disso. A troca tem custo:
   `brand.blue.60` levaria a série a 7,77:1, mas a separação dela para a série 1 cairia de 2,37:1
   para 1,29:1 — as duas ficariam quase iguais. Mexer aqui altera o `TOKENS-REFERENCE-COLORS.md`.
4. **Registro de publicação.** O pacote já é publicável, mas nada obriga a publicar: a instalação
   direta do repositório privado foi validada e resolve o consumo em outra máquina. Publicar no npm
   só se passar a haver mais de um consumidor ou necessidade de versão fixada. O `README.md`
   descreve o mecanismo como variável.
5. **Qual Showcase é o oficial** — existem duas entradas, a estática e a React. A divergência está
   registrada como pendência.
6. **Editor em blocos** — adiado. Você já tem implementação funcional em outro projeto.

---

## O que olhar no navegador antes de seguir

Nesta ordem, que é a de risco:

- **Ícones.** Os dez componentes que desenhavam SVG próprio trocaram traço de 24×24 por preenchido
  de 16×16. Ficam mais sólidos. Olhe principalmente o calendário e o relógio dentro dos campos de
  data e hora — preenchidos podem pesar ali.
- **Forma compacta dos números.** Onde você via `42k` agora lê `42 mil`, que é o correto para pt-BR.
  Se preferir `42k`, é decisão de produto e muda a abordagem.
- **Tema escuro.** O `color-mix` do sunburst clareia no claro e escurece no escuro — funciona
  conceitualmente, mas a direção inverte. Veja também o separador das fatias e os halos, todos em
  `--pl-color-surface`.
- **Movimento ao clicar na legenda** — a série recolhendo, as demais repartindo a faixa, o eixo
  reescalando junto.
- **Alinhamento da legenda.** A legenda passou de encostada à esquerda para centrada em todos os doze.
  A seção do `ChartBar` tem seletor para as três opções.
- **`ChartCombo`.** Seção nova no Showcase. Ver se a linha sobre as barras lê bem com a curva suave,
  e se o eixo direito aparecendo sozinho — sem ninguém pedir — incomoda quando a série é uma só.
- **Sankey com cruzamento.** Na seção dele, trocar `nodeAlign` entre `justify` e `left`: desconfio
  que `left` lê melhor no fluxo com desvio. E ver quantos valores de ligação a supressão descarta.

---

## Ajustes que você anunciou e ainda não listou

Você disse que ia anotar pontos e revisar um a um. Até aqui vieram e foram atendidos: raio da pilha,
centro do anel, força da linha base, realce do sunburst, rótulos do sunburst, hover do sankey,
rótulo do sankey, valor da ligação. A lista maior ainda não chegou.

---

## O pipeline de dados do produto (contexto dele)

Nenhum cálculo de negócio no front: o backend em Delphi agrega tudo. O front pede a
`/api/dashboards/:id`, com polling para cenários assíncronos, e recebe um **manifest JSON** — uma
árvore de blocos que monta um grid por `rowSpan`/`colSpan`, onde cada elemento traz preferências de
renderização.

Os dados chegam em três matrizes complementares:

- `datasets` — séries tradicionais, para barras, linhas e pizzas.
- `points` — pontos hierárquicos com `level` e `parentKey`, para sunburst e cascata.
- `flows` — arestas `source`/`target`/`value`, exclusivas do Sankey.

**Fronteira acordada:** o Design System entrega os componentes; uma **classe intermediária na
aplicação** faz a ponte entre o manifest e as propriedades do gráfico. O DS não conhece manifest,
grid de dashboard nem polling. Consequência prática: a API dos componentes precisa ser inteiramente
explícita e com tipos exportados, porque quem a preenche é código, não uma pessoa escrevendo JSX.

O `height="fill"` dos gráficos foi feito para esse grid: a altura vem da célula.

---

## As cores institucionais e o que foi medido

Oito cores, impostas por normativa da empresa, com pouca margem de mudança. Já estavam nos tokens
primitivos com papéis atribuídos: três de marca com rampa completa, dois neutros, três de status.

| Cor | Papel nos tokens |
| --- | --- |
| `#F26B35` laranja | marca, rampa 10→100 |
| `#49619C` azul | marca, rampa 10→100 |
| `#6E2A92` roxo | marca, rampa 10→100 |
| `#373435` grafite | neutro |
| `#606062` cinza médio | neutro |
| `#67BD50` verde | status |
| `#ED3237` vermelho | status |
| `#FCB52F` amarelo | status |

Medidas das oito em conjunto, que explicam a tensão relatada entre temas: separação de **3,6** no par
laranja e verde sob deuteranopia; **9,7** no par cinza e azul para visão plena, contra piso de 15;
contraste abaixo de 3:1 em amarelo, verde e laranja no tema claro, e em grafite, roxo, cinza e azul no
escuro. A paleta de séries adotada leva o pior par de 3,6 para **20,6**.

A aplicação permite que o **usuário escolha uma dessas cores como tema**, e todos os dashboards a
assumem. O mecanismo atual gera as demais séries variando saturação — foi isso que se substituiu.

Artefato com as combinações, simulação de daltonismo e as medições:
https://claude.ai/artifact/VfQJHhi9JQpsNgzrvLN3qV

---

## Inventário dos gráficos, como o mantenedor descreveu

Especificação original. Tudo concluído, menos o mapa.

- **Mapa** — necessário em algum momento, sem definição.

Pontos da especificação original que ficaram de fora dos concluídos, por não terem sido pedidos de
novo: calha do eixo Y que *expande* (a nossa reserva a calha e desliza o eixo para dentro dela, para
o desenho não se mexer sob o ponteiro), rótulo no meio da barra empilhada, rodapé de tendência,
coluna esquerda opcional de categorias nas barras horizontais, rótulo dentro da barra, e a área de
clique invisível do radial — esta última só faz sentido junto do tooltip.

---

## Armadilhas que já custaram caro

- **Nenhum teste da suíte toca o pacote construído.** O bundle CommonJS saiu como `.cjs.js` e,
  com `type: module`, o Node o leu como ESM — carregava sem erro e exportava **zero** símbolos. Só
  a instalação real num projeto separado pegou isso. Vale repetir a instalação a cada mudança no
  formato de saída.
- **`grep -c` conta linhas, não ocorrências.** No CSS minificado, que é uma linha só, quase todo
  token parece aparecer uma vez. Contar ocorrências, não linhas.
- **O duplo eixo é declarado, nunca inferido.** No `ChartCombo` a série diz a que eixo pertence. A
  divisão automática de escala — o `Split y-axis when necessary` do Metabase — é o que o
  `PROGRESS.md` §192 condena, e continua proibida.
- **As imagens que ele cita nem sempre chegam.** Nesta sessão chegaram as barras horizontais, o
  painel com dois donuts, o sunburst, dois do sankey e o sankey do Metabase. As do Metabase para o
  pie, que ele mencionou primeiro, não chegaram. Confirmar antes de assumir.
- **A referência visual dos gráficos é híbrida.** shadcn/ui na maioria, Metabase no pie, donut e
  sankey. A tabela do `CLAUDE.md` aponta para o Untitled UI e custou uma consulta errada.
- **Conferir o `TOKENS-REFERENCE-TYPOGRAPHY.md` antes de definir qualquer tipografia.** Três defeitos
  seguidos vieram de assumir em vez de ler: `type.title` é Montserrat e não Poppins; valores de tabela
  são JetBrains Mono; campo de formulário nunca é mono.
- **Abrir o código da referência, não só a descrição.** O seletor de hora foi refeito duas vezes por
  isso. Nos gráficos, o código do shadcn deu quatro decisões que a página não trazia, e a
  documentação do Metabase mostrou que ele **não oferece** escolha de posição de rótulo no sankey —
  o que invalidou uma regra que eu tinha inventado.
- **Converter `CalendarDate` com o fuso local, nunca com UTC.** Com UTC, o cabeçalho do calendário
  exibe o mês anterior em qualquer fuso negativo.
- **Validar paleta com o script, não a olho.** O gerador por rotação de matiz parecia correto e media
  3,1 em deuteranopia — pior que a paleta que substituiria.
- **O Showcase está sob typecheck** desde `tsconfig.showcase.json`.
- **Classe de CSS Module não atravessa arquivo.** O que precisa cruzar usa `composes`; o resto usa
  seletor de elemento, como `svg:hover`.
- **Teste que compara caminho de SVG pode passar por coincidência.** Área empilhada e não empilhada
  produziram o mesmo `d` porque as proporções coincidiam. Medir o que a decisão afirma.
- **`transition-delay` no estado de hover, e zero no repouso**, dá entrada com atraso e saída
  imediata sem nenhum temporizador em JavaScript.
- **Geometria em SVG não lê variável CSS.** Raio e fonte são lidos do elemento por
  `useChartMetrics`; o resto das medidas vive em `core/spacing.ts`.
- **Utilitário sem consumidor não fica.** O `wrapToWidth` nasceu e saiu na mesma sessão, como o
  `sanitizeSelection` antes dele.
