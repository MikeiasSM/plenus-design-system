import { codigoDe, type Pattern } from '../tipos';
import { MenuDeAcoesDoCabecalho } from '../exemplos/MenuDeAcoesDoCabecalho';
import fonte from '../exemplos/MenuDeAcoesDoCabecalho.tsx?raw';

export const pattern: Pattern = {
  id: 'menu-de-acoes-do-cabecalho',
  nome: 'Menu de ações do cabeçalho',
  resumo: 'As ações da página no cabeçalho: o excedente num menu, até duas secundárias e a principal por último.',
  problema: (
    <>
      Uma página de registro tem várias ações, e nem todas cabem à vista. O cabeçalho precisa dizer qual é a principal, mostrar as
      secundárias mais usadas e guardar o resto num menu, sem que a ação que só leva a outra tela se confunda com a que muda um dado.
    </>
  ),
  quando: [
    <>Em páginas de detalhe ou de edição, com mais ações do que cabem em duas secundárias e uma principal.</>,
    <>Com duas ações ou menos, o menu é desnecessário: elas ficam à vista.</>,
  ],
  componentes: [
    { nome: 'PageHeader', papel: 'O cabeçalho da página, com o título e os selos.' },
    { nome: 'PageHeader.Actions', papel: 'As ações da página, à direita. A principal vai por último.' },
    { nome: 'Menu', papel: 'O excedente: uma lista de ações disparada por um gatilho, com o tom de perigo na que destrói.' },
    { nome: 'ButtonIcon', papel: <>O gatilho do menu, com o ícone <code>IconMore</code> e o nome em <code>label</code>.</> },
    { nome: 'Button', papel: <>As secundárias (<code>variant="secondary"</code>) e a principal. Com <code>href</code>, a ação que leva a outra página é um link.</> },
    { nome: 'Badge', papel: 'A situação do registro, em PageHeader.Badges, que muda com as ações.' },
    { nome: 'Dialog', papel: <>A confirmação da ação que destrói, com <code>role="alertdialog"</code>.</> },
    { nome: 'Toast', papel: <>O retorno das operações do menu, como "PDF gerado", por <code>showToast</code>.</> },
  ],
  exemplos: [
    {
      titulo: 'Ações de um pedido',
      descricao: 'Aprove o pedido e a situação muda; use o menu para duplicar, exportar ou cancelar. "Editar" é um link.',
      Componente: MenuDeAcoesDoCabecalho,
      codigo: codigoDe(fonte),
    },
  ],
  tela: { id: 'pedido', nome: 'Detalhe de registro' },
  acessibilidade: [
    <>O gatilho é um botão só de ícone, e o <code>label</code> ("Mais ações") é obrigatório: o leitor o ouve, e a dica o mostra. O <code>label</code> do <code>Menu</code> repete esse nome.</>,
    <>O <code>Menu</code> leva o foco à primeira opção ao abrir, as setas pulam as desabilitadas, e o Esc devolve o foco ao gatilho.</>,
    <>O <code>Button</code> com <code>href</code> é um link de verdade: o leitor anuncia "link", abre em outra aba e o endereço é copiável.</>,
    <>O retorno de uma operação sai num aviso, que o leitor de tela anuncia, e não num texto trocado na página.</>,
    <>A ação que fica desabilitada depois de usada passa o foco à ação ao lado: o foco não cai no começo da página.</>,
  ],
  comportamento: [
    <>A ação principal fica à direita, por último, e é uma só. Antes dela vão até duas secundárias, e o excedente vai no menu. O sistema não impõe o limite.</>,
    <>A ação que leva a outra página é link, com <code>href</code>; a operação que muda dados é botão.</>,
    <>A ação que destrói leva <code>tone="danger"</code> no item do menu, e deve pedir confirmação, como no pattern Bloco de ajustes.</>,
    <>A ação que não vale no momento fica desabilitada, no mesmo lugar, e a situação no selo diz por quê.</>,
  ],
  variacoes: [
    <>Só o menu e a principal, quando não há secundárias.</>,
    <>O menu com seções e títulos, quando as ações se agrupam, e com ícone e atalho nos itens.</>,
    <>O voltar acima do título, com <code>PageHeader.Back</code>, e a busca da página em <code>PageHeader.Search</code>.</>,
  ],
  evitar: [
    <>Mais de uma ação principal no cabeçalho.</>,
    <>A principal escondida no menu, ou a ação que destrói como a principal.</>,
    <>Um botão com <code>onClick</code> que só troca o endereço: o que navega é link.</>,
    <>Um menu com uma ação só, ou um gatilho sem <code>label</code>.</>,
  ],
};
