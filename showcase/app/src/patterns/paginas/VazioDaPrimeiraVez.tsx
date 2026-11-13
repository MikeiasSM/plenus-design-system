import { codigoDe, type Pattern } from '../tipos';
import { VazioDaPrimeiraVez } from '../exemplos/VazioDaPrimeiraVez';
import fonte from '../exemplos/VazioDaPrimeiraVez.tsx?raw';

export const pattern: Pattern = {
  id: 'vazio-da-primeira-vez',
  nome: 'Vazio da primeira vez',
  resumo: 'Quando ainda não há nada, um cartão que explica o ganho, oferece até duas ações e mostra os primeiros passos.',
  problema: (
    <>
      A primeira visita a uma tela ainda sem registros não deve ser uma tabela vazia. A pessoa precisa saber para que serve o que vai
      cadastrar, o que fazer agora e como o processo segue.
    </>
  ),
  quando: [
    <>Na primeira vez em que uma lista é aberta, quando ainda não existe nenhum registro.</>,
    <>O vazio por busca ou filtro é outro caso: lá o <code>EmptyState</code> pequeno só oferece limpar o que a pessoa aplicou.</>,
  ],
  componentes: [
    { nome: 'Card', papel: 'A superfície que ocupa o lugar da lista e, depois, a leva.' },
    { nome: 'EmptyState', papel: 'O vazio: ícone, título, a explicação do ganho e até duas ações, a secundária antes da principal.' },
    { nome: 'NumberedList', papel: <>Os primeiros passos, em <code>layout="grid"</code>: uma sequência numerada, sem etapa atual.</> },
    { nome: 'Button', papel: 'As ações do vazio: a principal registra o primeiro item, e a secundária traz vários de uma vez.' },
    { nome: 'Table', papel: 'A lista que substitui o vazio assim que há um registro.' },
  ],
  exemplos: [
    {
      titulo: 'Clientes, antes do primeiro cadastro',
      descricao: 'Cadastre o primeiro cliente, ou importe vários, e o cartão passa à lista. Remova todos para ver o vazio de novo.',
      Componente: VazioDaPrimeiraVez,
      codigo: codigoDe(fonte),
    },
  ],
  tela: { id: 'contas', nome: 'Estado vazio da primeira vez' },
  acessibilidade: [
    <>O <code>EmptyState</code> neutro não é um alerta: é conteúdo da página, lido na ordem dela, sem região viva.</>,
    <>A <code>NumberedList</code> é uma lista ordenada (<code>ol</code>) e recebe o <code>aria-label</code> que a nomeia, como "Como começar".</>,
    <>As ações são botões nomeados pelo próprio texto, e a principal é a última.</>,
  ],
  comportamento: [
    <>A descrição diz o ganho ("com clientes cadastrados, você cria pedidos…") e não só que a lista está vazia.</>,
    <>No máximo duas ações, com a secundária antes da principal.</>,
    <>Os passos mostram como a funcionalidade segue depois do primeiro registro.</>,
    <>Na tela, a ação de "novo" do cabeçalho da página só aparece quando a lista tem itens, para não repetir a do vazio.</>,
    <>Ao remover uma linha, o foco passa à linha vizinha; ao remover a última, à ação principal do vazio, que volta ao lugar da tabela.</>,
  ],
  variacoes: [
    <>Os passos em <code>layout="list"</code>, numa coluna estreita.</>,
    <>Uma só ação, quando não há outra maneira de começar.</>,
    <>Em vez do cartão, o vazio de uma falha ao carregar: <code>EmptyState</code> com <code>tone="danger"</code>.</>,
  ],
  evitar: [
    <>O vazio da primeira vez sem nenhuma ação.</>,
    <>Mais de duas ações no vazio.</>,
    <>Um <code>Alert</code> no lugar do vazio: o alerta acompanha o conteúdo, e aqui o conteúdo é que falta.</>,
    <>O <code>Steps</code> para os primeiros passos: ele tem etapa atual, e os passos aqui só explicam.</>,
  ],
};
