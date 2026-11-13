import { codigoDe, type Pattern } from '../tipos';
import { TotaisNoRodape } from '../exemplos/TotaisNoRodape';
import fonte from '../exemplos/TotaisNoRodape.tsx?raw';

export const pattern: Pattern = {
  id: 'totais-no-rodape',
  nome: 'Totais no rodapé',
  resumo: 'O subtotal, os ajustes e o total no rodapé do cartão dos itens, com o total em destaque.',
  problema: (
    <>
      O resumo do valor de um registro, com subtotal, desconto, frete e total, se lê no pé da lista dos itens, na ordem em que a conta se faz.
      Misturar essas linhas às dos itens, ou formatá-las à mão, as desalinha e esconde qual é o total.
    </>
  ),
  quando: [
    <>Em listas de itens que somam um valor, como um pedido, uma fatura ou uma proposta.</>,
    <>Em um resumo isolado numa coluna lateral, a mesma montagem vale sem a tabela.</>,
  ],
  componentes: [
    { nome: 'Card', papel: 'A superfície dos itens e do resumo.' },
    { nome: 'Table', papel: 'Os itens, dentro do Card.Body com flush.' },
    { nome: 'InputNumber', papel: 'A quantidade editável de cada item, nomeada pelo produto da linha.' },
    { nome: 'Card.Footer', papel: 'O rodapé do cartão, onde fica o resumo.' },
    { nome: 'DescriptionList', papel: <>Com <code>layout="inline"</code>: o termo à esquerda e o valor à direita, com algarismos tabulares.</> },
    { nome: 'DescriptionList.Item', papel: <>Uma linha do resumo; o <code>emphasis</code> destaca o total, com separador acima e peso de rótulo.</> },
  ],
  exemplos: [
    {
      titulo: 'Itens de um pedido com o resumo',
      descricao: 'Mude uma quantidade: o total do item, o subtotal, o desconto e o total do rodapé se recalculam.',
      Componente: TotaisNoRodape,
      codigo: codigoDe(fonte),
    },
  ],
  tela: { id: 'pedido', nome: 'Detalhe de registro' },
  acessibilidade: [
    <>A <code>DescriptionList</code> é uma lista de definição (<code>dl</code>): o leitor de tela liga cada termo ao seu valor.</>,
    <>O total é a última linha e leva o destaque visual, mas não depende dele: o termo "Total" o nomeia.</>,
    <>Cada quantidade editável tem um nome acessível que diz de qual produto ela é.</>,
  ],
  comportamento: [
    <>O resumo é calculado dos mesmos dados da tabela: nunca é guardado à parte, e por isso nunca desencontra.</>,
    <>A ordem é a da conta: subtotal, o que reduz, o que acrescenta e o total por último, e só o total leva <code>emphasis</code>.</>,
    <>Os valores usam os formatadores da biblioteca (<code>formatCurrency</code>, <code>formatPercent</code>), e não texto montado à mão.</>,
  ],
  variacoes: [
    <>Numa coluna lateral "Resumo", com o campo do desconto acima e os totais no rodapé do mesmo cartão, como no Novo pedido.</>,
    <>Sem edição: a quantidade como texto simples, como no detalhe do pedido.</>,
  ],
  evitar: [
    <>Uma linha de total dentro da <code>Table</code>, misturada aos itens.</>,
    <>Destacar mais de uma linha: o destaque deixa de apontar o total.</>,
    <>Os valores formatados à mão, que perdem o separador e o idioma.</>,
  ],
};
