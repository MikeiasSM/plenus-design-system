import { codigoDe, type Pattern } from '../tipos';
import { FolhaDePagina } from '../exemplos/FolhaDePagina';
import fonte from '../exemplos/FolhaDePagina.tsx?raw';

export const pattern: Pattern = {
  id: 'folha-de-pagina',
  nome: 'Folha de página',
  resumo: 'A barra com o caminho, o corpo que rola, o cabeçalho e o conteúdo na mesma coluna e, quando há, o rodapé fixo.',
  problema: (
    <>
      Toda tela da aplicação precisa da mesma folha: a barra com o caminho, um corpo que rola sozinho, o cabeçalho e o conteúdo alinhados na
      mesma coluna e, quando a tela salva, a situação e as ações sempre à vista. Montar cada peça por conta própria faz as telas se
      desencontrarem em largura, em respiro e em onde rola.
    </>
  ),
  quando: [
    <>Em toda página que vai dentro do <code>AppShell</code>: formulário, detalhe, índice ou painel.</>,
    <>Quando a tela salva, com o rodapé fixo (<code>AppShell.PageFooter</code>) ou o aviso de alteração por salvar (<code>SaveBar</code>).</>,
  ],
  componentes: [
    { nome: 'AppShell', papel: 'A moldura da aplicação: ocupa o espaço que o pai lhe dá, e só as áreas internas rolam.' },
    { nome: 'Sidebar', papel: 'A navegação, ao lado da folha. No exemplo ela é mínima e fica recolhida, para dar espaço à página.' },
    { nome: 'AppShell.Page', papel: 'A folha da página, o <main> da tela.' },
    { nome: 'AppShell.PageBar', papel: 'A barra de 46px no topo, com o botão de abrir o submenu e o que o produto puser ao lado.' },
    { nome: 'Breadcrumb', papel: 'O caminho percorrido até a página, dentro da barra.' },
    { nome: 'AppShell.PageBody', papel: 'O corpo: a única área da página que rola.' },
    { nome: 'PageHeader', papel: 'Título, descrição, selos e ações, com a largura da coluna em maxWidth.' },
    { nome: 'Container', papel: 'A coluna do conteúdo, centrada, com a mesma largura do cabeçalho.' },
    { nome: 'AppShell.PageFooter', papel: 'O rodapé fixo, fora da área que rola: a situação à esquerda e as ações à direita. A SaveBar é a alternativa quando a ação só faz sentido com alteração.' },
  ],
  exemplos: [
    {
      titulo: 'Formulário com rodapé fixo',
      descricao: 'A Sidebar do exemplo é mínima e recolhida. Edite o nome: o rodapé passa a Alterações não salvas e habilita Descartar e Salvar. O cabeçalho e o cartão têm 760px e alinham na mesma borda.',
      Componente: FolhaDePagina,
      codigo: codigoDe(fonte),
      altura: 460,
    },
  ],
  tela: { id: 'pedido', nome: 'Detalhe de registro' },
  acessibilidade: [
    <>O <code>AppShell.Page</code> é o <code>&lt;main&gt;</code>: uma só por tela, e o atalho de pular para o conteúdo leva até ele.</>,
    <>O título do <code>PageHeader</code> é o <code>h1</code>; os cartões abaixo dele abrem em <code>h2</code>, com <code>headingLevel</code>.</>,
    <>O rodapé já é a região de status da página: a situação posta em <code>status</code> é anunciada, e não se cria outra região em volta dela.</>,
    <>O <code>Breadcrumb</code> é uma navegação nomeada. O botão de abrir o submenu, na barra, aparece com o submenu recolhido, e a gaveta, no celular.</>,
    <>Salvar ou descartar desabilita os dois botões do rodapé, e o produto devolve o foco ao campo editado, como pede a <code>SaveBar</code>.</>,
  ],
  comportamento: [
    <>O <code>maxWidth</code> do <code>PageHeader</code> e o do <code>Container</code> são o mesmo: com o mesmo valor, os dois alinham na borda. As composições usam 760px, 1120px e a largura total, e a escolha é da tela.</>,
    <>O respiro vertical é de quem usa o <code>Container</code>, que só cuida do lateral: o <code>paddingBlock</code> com um espaçamento dos tokens.</>,
    <>Só o corpo rola. A barra e o rodapé ficam à vista, e por isso a moldura precisa de um pai com altura.</>,
    <>O rodapé fica sempre lá; a <code>SaveBar</code> aparece quando há alteração por salvar. Escolha um dos dois para a mesma tela.</>,
  ],
  variacoes: [
    <>Largura total, sem <code>maxWidth</code>, para índices e painéis com grade.</>,
    <>Voltar acima do título, com <code>PageHeader.Back</code>, quando a página é um detalhe de outra.</>,
    <>Duas colunas com o <code>Columns</code>, ou seções com a <code>AnnotatedSection</code>, no lugar do cartão único.</>,
    <>A <code>SaveBar</code> no lugar do rodapé, para o formulário que só pede ação quando algo mudou.</>,
  ],
  evitar: [
    <>Cabeçalho e conteúdo com larguras diferentes: as bordas deixam de alinhar.</>,
    <>O respiro vertical em margens soltas, ou no cabeçalho, em vez de no <code>Container</code>.</>,
    <>A moldura num pai sem altura: a página inteira passa a rolar, e a barra e o rodapé saem de vista.</>,
    <>Rodapé e <code>SaveBar</code> juntos, avisando a mesma coisa duas vezes.</>,
  ],
};
