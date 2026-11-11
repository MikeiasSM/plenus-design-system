import { codigoDe, type Pattern } from '../tipos';
import { BarraDaTabela } from '../exemplos/BarraDaTabela';
import fonte from '../exemplos/BarraDaTabela.tsx?raw';

export const pattern: Pattern = {
  id: 'barra-da-tabela',
  nome: 'Barra da tabela',
  resumo: 'Um cartão com a busca e os filtros acima da tabela e, no rodapé, a situação ou a seleção e a paginação.',
  problema: (
    <>
      Uma tabela com busca, filtro, seleção e paginação precisa de uma moldura única. Sem ela, cada tela espaça, alinha e ordena essas peças de
      um jeito, e a barra de busca acaba fora do alinhamento da primeira coluna.
    </>
  ),
  quando: [
    <>Em listas de registros que se busca, se filtra e se pagina, como a de uma tela de índice.</>,
    <>Para uma grade completa, com virtualização, a escolha é a <code>DataGrid</code>; este pattern monta a <code>Table</code> básica.</>,
  ],
  componentes: [
    { nome: 'Card', papel: 'A superfície que agrupa a barra, a tabela e o rodapé.' },
    { nome: 'Card.Body', papel: <>Com <code>flush</code>, para a barra e a tabela irem até as bordas do cartão.</> },
    { nome: 'Table.Toolbar', papel: 'A barra acima da tabela: um grupo rotulado com a busca e as ações dela. O primeiro filho cresce, os demais ficam ao lado, e o respiro lateral alinha com a primeira coluna.' },
    { nome: 'InputText', papel: <>A busca: <code>type="search"</code>, o ícone de lupa e o nome acessível em <code>aria-label</code>.</> },
    { nome: 'Button', papel: 'O "Filtros", que abre o painel do pattern Painel de filtros, com a contagem do que está aplicado.' },
    { nome: 'Tag', papel: <>O filtro ativo, à vista na barra, com <code>onRemove</code> para desfazer só ele.</> },
    { nome: 'Table', papel: 'A tabela, com a seleção múltipla quando as linhas se operam em conjunto.' },
    { nome: 'Card.Footer', papel: <>Com <code>start</code> para a situação da lista, ou a seleção, e a paginação à direita.</> },
    { nome: 'Pagination', papel: 'A navegação entre páginas do resultado.' },
    { nome: 'EmptyState', papel: 'No lugar da tabela, quando a busca ou o filtro não acham nada.' },
  ],
  exemplos: [
    {
      titulo: 'Contratos com busca, filtro, seleção e paginação',
      descricao: 'Busque por um cliente, filtre pela situação, marque linhas e troque de página: o rodapé diz quantos resultados há, ou quantos estão selecionados.',
      Componente: BarraDaTabela,
      codigo: codigoDe(fonte),
      altura: 620,
    },
  ],
  tela: { id: 'pedidos', nome: 'Lista com tabela e filtros' },
  acessibilidade: [
    <>A barra é um grupo rotulado (<code>role="group"</code> com <code>label</code>), e não <code>role="toolbar"</code>: esse papel pediria navegação por setas entre os controles, e o campo de busca a impediria.</>,
    <>A busca não tem rótulo visível, então leva <code>aria-label</code>; o placeholder não é o nome.</>,
    <>A tabela tem <code>label</code>, e cada linha selecionável tem um nome próprio: "Selecionar o contrato de Transportes Rota Sul".</>,
    <>O botão "Filtros" leva <code>aria-expanded</code>, como no pattern Painel de filtros.</>,
  ],
  comportamento: [
    <>Buscar ou filtrar volta à primeira página, e a página atual nunca passa do total do resultado.</>,
    <>A barra continua visível com o resultado vazio: a pessoa muda a busca sem precisar limpar antes.</>,
    <>O rodapé mostra a seleção quando há, e a quantidade de resultados quando não há.</>,
    <>O vazio traz uma ação para limpar a busca e os filtros, no lugar da tabela.</>,
  ],
  variacoes: [
    <>Ordenação por coluna, com <code>sortable</code> nas colunas e <code>onSortChange</code> na tabela, como na tela de Pedidos.</>,
    <>Sem seleção, omitindo <code>selectionMode</code>, e então o rodapé fica só com a situação e a paginação.</>,
    <>O rodapé só quando há seleção ou mais de uma página, como a tela de Pedidos faz.</>,
    <>As visões salvas sobre a mesma lista: veja Visões salvas.</>,
  ],
  evitar: [
    <>A tabela solta, sem o cartão, com a busca e a paginação noutro arranjo a cada tela.</>,
    <>Um <code>role="toolbar"</code> próprio na barra de busca.</>,
    <>Esconder a barra quando o resultado é vazio.</>,
    <>A paginação fora do cartão, longe da tabela que ela navega.</>,
  ],
};
