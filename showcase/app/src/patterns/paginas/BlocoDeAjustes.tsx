import { codigoDe, type Pattern } from '../tipos';
import { BlocoDeAjustes } from '../exemplos/BlocoDeAjustes';
import { BlocoDeAjustesAnotado } from '../exemplos/BlocoDeAjustesAnotado';
import fonte from '../exemplos/BlocoDeAjustes.tsx?raw';
import fonteAnotada from '../exemplos/BlocoDeAjustesAnotado.tsx?raw';

export const pattern: Pattern = {
  id: 'bloco-de-ajustes',
  nome: 'Bloco de ajustes',
  resumo: 'Título e explicação, linhas de rótulo e controle, uma ação do bloco e, no fim, o cartão de perigo.',
  problema: (
    <>
      Telas de configuração repetem o mesmo bloco: um título com a explicação, linhas em que o rótulo e o controle ficam lado a lado, às vezes
      uma ação do bloco todo e, por último, a ação que destrói algo. Sem uma montagem, cada tela organiza isso de um jeito, e o perigo se
      mistura aos ajustes comuns.
    </>
  ),
  quando: [
    <>Em telas de configuração e formulários por assunto, com ajustes que se leem como "rótulo, explicação e controle".</>,
    <>Para um formulário de campos de entrada comuns, com rótulo acima, os campos já se montam com os componentes de formulário.</>,
  ],
  componentes: [
    { nome: 'Card.Header', papel: <>O título e a explicação do bloco em <code>h2</code>, e a ação do bloco em <code>trailing</code>.</> },
    { nome: 'AnnotatedSection', papel: <>A alternativa em que o título e a explicação ficam num trilho à esquerda e o cartão à direita; a ação do bloco vai em <code>action</code>.</> },
    { nome: 'Card.Body', papel: <>Com <code>flush</code>, para as linhas irem até as bordas.</> },
    { nome: 'FieldRow', papel: 'A linha de ajuste: rótulo e explicação de um lado, o controle do outro. Liga o rótulo e a explicação ao controle.' },
    { nome: 'InputNumber', papel: <>Valor numérico, com a unidade em <code>unit</code>.</> },
    { nome: 'Switch', papel: 'Liga ou desliga um ajuste.' },
    { nome: 'Button', papel: <>A ação do bloco, <code>ghost</code> e pequena; no cartão de perigo, <code>variant="danger"</code>.</> },
    { nome: 'Dialog', papel: <>A confirmação da ação destrutiva, com <code>role="alertdialog"</code>.</> },
  ],
  exemplos: [
    {
      titulo: 'Cartões com título',
      descricao: 'Os ajustes mudam de verdade, e "Restaurar padrões", a ação do bloco, volta aos valores iniciais. A exclusão, no cartão de perigo ao fim, pede confirmação.',
      Componente: BlocoDeAjustes,
      codigo: codigoDe(fonte),
    },
    {
      titulo: 'Com a AnnotatedSection',
      descricao: 'O mesmo conteúdo com o título e a explicação num trilho à esquerda. Abaixo de 900px de largura própria, o trilho passa para cima do cartão.',
      Componente: BlocoDeAjustesAnotado,
      codigo: codigoDe(fonteAnotada),
    },
  ],
  tela: { id: 'configuracao-empilhada', nome: 'Seção de configuração, empilhada' },
  acessibilidade: [
    <>O <code>FieldRow</code> liga o rótulo (<code>htmlFor</code>) e a explicação (<code>aria-describedby</code>) ao controle pela função de filhos: <code>id</code> e <code>describedBy</code> vão para o controle.</>,
    <>O controle que se nomeia pelo próprio conteúdo, como o botão de perigo, usa só o <code>describedBy</code>.</>,
    <>O título do bloco é um <code>h2</code> (<code>headingLevel</code> troca o nível) e nomeia a região: cartões vizinhos têm títulos distintos.</>,
    <>A confirmação é um <code>alertdialog</code>, que interrompe e pede resposta, e descreve o que será apagado.</>,
  ],
  comportamento: [
    <>A ação do bloco fica no cabeçalho, no <code>trailing</code> ou em <code>action</code>, e não dentro das linhas.</>,
    <>O cartão de perigo vai por último, separado dos ajustes comuns, e a ação destrutiva sempre pede confirmação.</>,
    <>O controle desce abaixo do rótulo quando a linha estreita, sem mudar a ordem de leitura.</>,
    <>A <code>AnnotatedSection</code> separa as seções vizinhas por uma linha.</>,
  ],
  variacoes: [
    <>Três arranjos para a mesma seção, como nas composições: anotada, com a <code>AnnotatedSection</code>; empilhada, em cartões; ou com o índice "Nesta página", pelo <code>Columns.Index</code>.</>,
    <>Salvar no rodapé de cada cartão, como no pattern Salvar por cartão.</>,
    <>Linhas com outros controles, como <code>Select</code>, no lugar do <code>InputNumber</code> e do <code>Switch</code>.</>,
  ],
  evitar: [
    <>O cartão de perigo no meio dos ajustes, ou com um botão <code>primary</code>.</>,
    <>A ação destrutiva sem confirmação, ou com uma confirmação que não diz o que será apagado.</>,
    <>Um controle dentro do <code>FieldRow</code> sem a fiação do <code>id</code> e do <code>describedBy</code>: a linha deixa de nomear o controle.</>,
    <>A ação do bloco como uma linha a mais no meio dos ajustes.</>,
  ],
};
