import { codigoDe, type Pattern } from '../tipos';
import { ColunaDeAcaoDeLinha } from '../exemplos/ColunaDeAcaoDeLinha';
import fonte from '../exemplos/ColunaDeAcaoDeLinha.tsx?raw';

export const pattern: Pattern = {
  id: 'coluna-de-acao-de-linha',
  nome: 'Coluna de ação de linha',
  resumo: 'A coluna sem título visível, à direita, com um botão só de ícone cujo nome diz de qual linha ele é.',
  problema: (
    <>
      Quando cada linha da tabela tem uma ação própria, como remover ou editar, a ação cabe num ícone, mas o ícone sozinho não tem nome, e uma
      coluna sem título não é anunciada. A montagem dá nome à coluna e a cada botão, linha a linha.
    </>
  ),
  quando: [
    <>Quando a ação é de uma linha e é conhecida de quem usa a tela, e o texto repetiria o que o contexto já diz.</>,
    <>Havendo espaço para o texto, o <code>Button</code> com texto é a escolha: ícone sozinho pede que a pessoa adivinhe.</>,
  ],
  componentes: [
    { nome: 'Table.Column', papel: <><code>align="end"</code> e largura fixa: a coluna fica à direita, com o tamanho do botão.</> },
    { nome: 'VisuallyHidden', papel: 'O título da coluna, que só o leitor de tela lê.' },
    { nome: 'ButtonIcon', papel: <><code>size="sm"</code> e <code>variant="ghost"</code>, com o nome da linha em <code>label</code>, que o leitor ouve e a dica mostra.</> },
    { nome: 'AvatarItem', papel: 'A pessoa da linha, na primeira coluna, sem estourar a largura.' },
    { nome: 'Table.Body', papel: <>O vazio da própria tabela, com <code>emptyTitle</code> e <code>emptyDescription</code>, quando a última linha é removida.</> },
  ],
  exemplos: [
    {
      titulo: 'Remover um membro da equipe',
      descricao: 'Cada botão se chama "Remover" e o nome da pessoa. Remova todos para ver o vazio.',
      Componente: ColunaDeAcaoDeLinha,
      codigo: codigoDe(fonte),
    },
  ],
  tela: { id: 'novo-pedido', nome: 'Formulário com SaveBar' },
  acessibilidade: [
    <>O <code>VisuallyHidden</code> dá a coluna um título para o leitor de tela, sem mostrá-lo: o cabeçalho não fica vazio.</>,
    <>O <code>label</code> é único por linha, como "Remover Ana Ribeiro". "Remover", repetido, produz uma lista de botões iguais que ninguém distingue.</>,
    <>O <code>label</code> também é a dica de quem passa o ponteiro ou chega pelo teclado.</>,
  ],
  comportamento: [
    <>A coluna fica à direita e ocupa só o tamanho do botão; a primeira coluna fica com o espaço que sobra.</>,
    <>A ação de remover reflete na hora; quando ela não se desfaz, a confirmação é a do pattern Bloco de ajustes.</>,
    <>Quando a lista esvazia, o vazio da tabela assume o lugar das linhas, com o cabeçalho à vista.</>,
    <>Ao remover uma linha, o foco passa ao botão da linha que tomou o lugar dela, ou ao da linha de cima: não cai no começo da página.</>,
  ],
  variacoes: [
    <>Mais de uma ação por linha: um <code>Menu</code> com o gatilho <code>ButtonIcon</code> (<code>IconMore</code>), nomeado também pela linha.</>,
    <>Ação que leva a outra página: o <code>ButtonIcon</code> com <code>href</code>, que vira link de verdade.</>,
    <>Ação em texto, com <code>Button size="sm"</code>, quando há espaço, como "Aceitar" na conciliação.</>,
  ],
  evitar: [
    <>O mesmo <code>label</code> em todas as linhas.</>,
    <>Uma coluna de botões sem título nem texto oculto: o cabeçalho vazio não é anunciado.</>,
    <>Ações destrutivas com o tom <code>danger</code> em todas as linhas: o vermelho repetido deixa de avisar.</>,
  ],
};
