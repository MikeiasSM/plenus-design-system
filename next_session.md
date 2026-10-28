# Próxima sessão

Passagem de contexto entre máquinas, em 27/10/2026. Não normativo; o acompanhamento completo está em `PROGRESS.md`.

## Feito

- **0.2.6 publicada**: licença proprietária, `CHANGELOG.md`, política de versão (`CONTRIBUTING.md` §10 e §11), `'use client'`, CI em PR e push na `main`, propriedades nativas, `ref` e `hideTitle` nos gráficos, hover mais suave e halo de foco (`--pl-control-border-hover`, `--pl-control-focus-halo`).
- **0.2.7 publicada**: `ChartHeatmap`, e a escala de cor e a legenda em barra extraídas do `ChartMap` para o núcleo dos gráficos (`ChartColorScale`, `ChartColorCategory`; os nomes antigos saem na 0.4.0).
- Relatório de compatibilidade do Painel avaliado; as decisões do mantenedor estão em `PROGRESS.md`, seção "Relatorio de compatibilidade com o Painel".
- Resposta ao time do Painel: https://claude.ai/artifact/QHZyQy1JBCPtMaZbc9PN9a

## Regra de processo

Componente visual novo passa por um artefato de referência aprovado pelo mantenedor **antes** da implementação. O `ChartHeatmap` não passou e ainda não foi visto em navegador real: conferir em `npm run dev:showcase`.

## Próximo: DataGrid

Vem logo depois do heatmap, por decisão do mantenedor. Antes do código, fechar com ele:

1. Artefato de referência do visual e da interação.
2. Modo servidor por um caminho só: recomendado `onQueryChange`, em vez de um evento por fatia.
3. Tecla que entra no detalhe sem disputar a seta entre células: sugerido `Alt+↓` para entrar e `Esc` para voltar à linha.
4. Fase 1 sem seleção entre páginas nem modo servidor completo.

Começa pelo State Motor (`ARCHITECTURE.md` §7) e segue o escopo de `PROGRESS.md`, "Familia de tabela".

## Fila depois do DataGrid

- Tema por subárvore e por `prefers-color-scheme`. Cuidado: variável definida no ancestral que referencia variável do descendente fica inválida; os tokens calculados em `:root` precisam ser redeclarados no escopo do tema.
- Guarda de `prefers-reduced-motion` nos dezoito módulos que animam; `base.css` restrito à biblioteca.
- `ToastProvider` por árvore, mantendo `showToast`, e `portalContainer` nos overlays.
- Teste do pacote construído em app real (Vite, Next com Server Components, CommonJS), axe e navegador real.
- Visão em tabela nos gráficos, depois `onPointClick` e `onSliceClick`.
- Ícones em um módulo por ícone, em `icons/*`.
- Recursos genéricos pedidos pelo Painel (`PROGRESS.md`).
- Receita com react-hook-form.
- **0.3.0**: migração para a convenção de API, CSS por componente, formatadores em inglês com apelidos obsoletos.
- Por último: cor de marca em tempo de execução (gerador livre ou os oito temas institucionais).

## Pendência de publicação

`npm publish --ignore-scripts` ainda roda o `prepare` no Actions: o pacote sai reconstruído, não o conferido. Corrigir em `.github/workflows/publicar.yml` publicando o tarball de `npm pack`.

## Ambiente

- Publicação: tag `vX.Y.Z` na `main`; o Actions confere versão, seção do CHANGELOG, tipos, testes, build, pacote e contraste.
- Push só pelo mantenedor ou com autorização explícita dele.
