import { codigoDe, type Pattern } from '../tipos';
import { ControleDoUsuario } from '../exemplos/ControleDoUsuario';
import fonte from '../exemplos/ControleDoUsuario.tsx?raw';

export const pattern: Pattern = {
  id: 'controle-do-usuario',
  nome: 'Controle do usuário',
  resumo: 'A conta da pessoa na navegação: o avatar no trilho, quando o submenu está recolhido, e o painel da conta no pé do submenu.',
  problema: (
    <>
      A pessoa precisa de um lugar fixo para a própria conta, com o perfil, as preferências e a saída, nos dois estados da navegação: com o
      submenu aberto e com ele recolhido. As duas entradas devem mostrar a mesma conta.
    </>
  ),
  quando: [
    <>Em toda aplicação com a <code>Sidebar</code> em que a pessoa tem uma conta própria.</>,
  ],
  componentes: [
    { nome: 'AppShell', papel: 'A moldura que abriga a Sidebar.' },
    { nome: 'Sidebar.Rail', papel: <>O trilho; o grupo fixo do pé (<code>footer</code>) recebe a conta.</> },
    { nome: 'Sidebar.RailAccount', papel: 'O avatar da conta no trilho. Só aparece com o submenu recolhido e abre o submenu já na conta.' },
    { nome: 'Sidebar.Panel', papel: <>O submenu; a conta entra na propriedade <code>account</code>.</> },
    { nome: 'Sidebar.Account', papel: 'O bloco da conta no pé do submenu, com avatar, nome e descrição, e o cartão com as opções.' },
    { nome: 'Sidebar.Item', papel: 'As opções da conta: links com href, ou botões, como "Sair".' },
    { nome: 'Avatar', papel: 'A representação da pessoa, nos dois lugares.' },
  ],
  exemplos: [
    {
      titulo: 'Conta no trilho e no submenu',
      descricao: 'Abra a conta no pé do submenu; recolha o submenu e use o avatar do trilho. O nome e a empresa vêm de um só objeto. "Sair" encerra a sessão do exemplo.',
      Componente: ControleDoUsuario,
      codigo: codigoDe(fonte),
      altura: 420,
    },
  ],
  tela: { id: 'inicio', nome: 'Tela inicial' },
  acessibilidade: [
    <>O avatar do trilho é um botão cujo nome acessível e dica é o <code>label</code>, que deve dizer quem é e a conta: o avatar dentro dele é decorativo.</>,
    <>O botão da conta indica <code>aria-expanded</code> e <code>aria-controls</code>; as opções ficam numa navegação nomeada, "Conta", e inertes enquanto fechadas.</>,
    <>O Esc fecha a conta e devolve o foco ao botão que a abriu; escolher uma opção também a fecha.</>,
  ],
  comportamento: [
    <>O nome, a empresa e o avatar vêm de uma só fonte de dados, e o <code>label</code> do trilho é escrito a partir dela: as duas entradas nunca divergem.</>,
    <>Com o submenu aberto, a conta fica no pé dele; recolhido, o avatar no trilho a abre.</>,
    <>As opções da conta são da pessoa (perfil, preferências, sair), e não do módulo atual: o que é do módulo fica nos itens do submenu.</>,
    <>"Sair" é uma operação, então é botão (<code>onClick</code>); as opções que levam a outra tela são links (<code>href</code>).</>,
  ],
  variacoes: [
    <>A conta cobrindo a lista do módulo, com <code>accountMode="cover"</code> no <code>Sidebar.Panel</code>, e o bloco com avatar e nome no alto do cartão.</>,
    <>O avatar com foto, em <code>src</code>, e o ponto de aviso no trilho, que é do produto.</>,
    <>Um módulo sem lista: o submenu fica só como o lugar da conta.</>,
  ],
  evitar: [
    <>Escrever o nome e a empresa em dois lugares: um muda e o outro fica para trás.</>,
    <>O <code>Sidebar.RailAccount</code> com um <code>label</code> genérico, como "Conta": o leitor não sabe de quem.</>,
    <>Opções do módulo dentro da conta, ou da conta entre os itens do módulo.</>,
  ],
};
