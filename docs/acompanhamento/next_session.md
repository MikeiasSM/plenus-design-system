# Próxima sessão

Passagem de contexto entre máquinas, em 28/10/2026. Não normativo; o acompanhamento completo está em `PROGRESS.md`.

## Estado

- **Publicado:** 0.5.0 no npm, pela tag `v0.5.0` na `main`, em 28/10/2026: `DataGrid` completo (fases 1 a 6), `CardMetric` e o `Card` com `size` e `trailingWhenNarrow`, submenu no `Menu`, `Pagination` com itens por página e `showGrid` no `ChartArea` e no `ChartLine`. Incompatível: o nome acessível da lista do `Select` sem `label`.
- **Antes da publicação:** revisão independente de tudo desde a 0.4.0 e da `feature/card-metric`, com as correções registradas no `PROGRESS.md`, seções "Revisao final antes da publicacao".
- **Showcase:** menu lateral por módulos recolhíveis e controles booleanos alinhados à faixa dos controles.

## A discutir

O levantamento do que resta está na conversa de 28/10/2026: fila aprovada do relatório do Painel (`ToastProvider` e `portalContainer`, teste do pacote num app real, visão em tabela nos gráficos, ícones por módulo, recursos genéricos, tema por subárvore, tokens), decisões do mantenedor (valor numérico do `InputNumber` e do `InputCurrency`, toque nos gráficos, API comum dos gráficos, `d3-sankey`, ícones de interface geral, XLSX/PDF) e o que ficou sob demanda.

## Próximos passos do DataGrid

1. **Lançado na 0.5.0.** O teste no NVDA está feito; o resultado está no `PROGRESS.md`, seção "DataGrid: teste no NVDA". Ficam para decisão: o adaptador opcional de XLSX e PDF, que traz dependência, e o que o plano deixou sob demanda (virtualização de colunas, edição de célula, agrupar por coluna, linhas fixas no topo, copiar, construtor de filtros).

A fase 6, exportação, está feita: modelo de exportação, CSV no núcleo e outros formatos por `exporters`. Decisões no `PROGRESS.md`, seção "DataGrid: fase 6, exportacao".

A fase 5, árvore, está feita: `getChildren`, recuo, carga sob demanda por `rowHasChildren`, ordem entre irmãos e filtro que mantém os ancestrais. Decisões no `PROGRESS.md`, seção "DataGrid: fase 5, arvore".

A fase 4, filtros e sumarização, está feita: filtro como dado, com grupos E/OU, funil no título com o filtro do tipo, `Alt+↓`, conjunto com busca, aplicar no botão como opção, linha de totais presa ao rodapé e agregados do servidor. Decisões no `PROGRESS.md`, seção "DataGrid: fase 4, filtros e sumarizacao".

A fase 3, colunas e menus, está feita: menu do título, colunas fixas dos dois lados, redimensionar, ajustar, mover, ocultar, grupos de cabeçalho recolhíveis, menu da tabela com densidade, tela cheia e restaurar. Decisões no `PROGRESS.md`, seção "DataGrid: fase 3, colunas".

O medidor da prova de virtualização já rodou no navegador do mantenedor, sem problema.

- Pesquisa e plano: https://claude.ai/artifact/Gk9TR3yiRtQ6ir49qQLQmM
- Protótipo de interação: https://claude.ai/artifact/YSBhYGrUFVkAzYWa68cy7o
- Prova de virtualização, com medidor: https://claude.ai/artifact/TKR59WipNY13aKAwMGKJJ9

## O que a prova ensinou para o componente

- Uma rolagem só; as grades aninhadas não rolam e são recortadas pela tela da grade de fora.
- Alturas medidas e guardadas pelo caminho da linha; posições em cache, recalculadas só quando uma altura muda; rolagem por busca binária.
- Rolagem corrigida por ancoragem num lugar só, com a âncora registrada no instante em que a altura muda e a correção só quando a posição de rolagem é a mesma do registro.
- Estado do detalhe fora do componente, entregue por `state` e `setState`.

## Ambiente

- Publicação: tag `vX.Y.Z` na `main`; o Actions confere versão, seção do CHANGELOG, tipos, testes, build, pacote e contraste, e publica o pacote conferido.
- Agents de uso geral rodam em Sonnet; Opus só para revisão.
