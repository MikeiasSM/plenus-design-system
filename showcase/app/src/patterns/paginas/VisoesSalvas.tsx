import { codigoDe, type Pattern } from '../tipos';
import { VisoesSalvas } from '../exemplos/VisoesSalvas';
import fonte from '../exemplos/VisoesSalvas.tsx?raw';

export const pattern: Pattern = {
  id: 'visoes-salvas',
  nome: 'Visões salvas',
  resumo: 'Abas sobre a mesma lista, uma para cada recorte que a equipe usa sempre, com a contagem no rótulo.',
  problema: (
    <>
      A mesma lista é lida sempre pelos mesmos ângulos: todas, as em aberto, as atrasadas. Cada ângulo vira uma aba, com a quantidade à vista,
      em vez de um filtro que a pessoa refaz a cada visita.
    </>
  ),
  quando: [
    <>Quando há poucos recortes da mesma lista, usados com frequência, e a quantidade de cada um importa.</>,
    <>Abas que são conteúdos diferentes não são este pattern: aqui o corpo é sempre a mesma lista.</>,
  ],
  componentes: [
    { nome: 'Card', papel: 'A superfície que agrupa as abas e a lista.' },
    { nome: 'Tabs', papel: <>As visões: cada aba é um recorte, com o <code>label</code> do conjunto. Trocam o painel na mesma página, com as setas entre as abas.</> },
    { nome: 'Table', papel: 'A mesma lista, em cada painel, com os itens do recorte.' },
  ],
  exemplos: [
    {
      titulo: 'Tarefas por visão',
      descricao: 'Troque de aba, com o clique ou com as setas: a lista mostra só o recorte, e a contagem de cada aba sai dos mesmos dados.',
      Componente: VisoesSalvas,
      codigo: codigoDe(fonte),
    },
  ],
  tela: { id: 'pedidos', nome: 'Lista com tabela e filtros' },
  acessibilidade: [
    <>As abas seguem o padrão de abas do WAI-ARIA: um ponto de tabulação na lista e as setas entre as abas. O <code>label</code> dá nome ao conjunto.</>,
    <>A contagem vai no texto da aba, e não num selo à parte: ela faz parte do nome, e o leitor de tela a lê junto.</>,
    <>Cada tabela leva um <code>label</code> próprio, com o nome da visão, para o painel ativo ser identificado.</>,
  ],
  comportamento: [
    <>As contagens e as listas saem da mesma fonte: a contagem nunca fica diferente do que a aba mostra.</>,
    <>A visão é um recorte, e a busca e os filtros da barra da tabela continuam valendo dentro dela.</>,
    <>As <code>Tabs</code> trocam o painel sem mudar o endereço: recarregar leva à primeira aba.</>,
  ],
  variacoes: [
    <>A barra da tabela dentro do painel de cada aba, como na tela de Pedidos: veja Barra da tabela.</>,
    <>Com cada visão num endereço próprio, que sobrevive ao recarregar e ao voltar do navegador, a faixa é o <code>TabsNav</code>.</>,
    <>A aba atual guardada pelo produto, com <code>selectedKey</code> e <code>onSelectedKeyChange</code>, quando a visão precisa sobreviver a outra interação.</>,
  ],
  evitar: [
    <>Abas que não são recortes da mesma lista: o conteúdo que muda de natureza é outra página.</>,
    <>Dezenas de abas: o que passa de poucos recortes vira filtro, como no pattern Painel de filtros.</>,
    <>A contagem calculada à parte, que se desatualiza da lista.</>,
  ],
};
