import { codigoDe, type Pattern } from '../tipos';
import { PainelDeFiltros } from '../exemplos/PainelDeFiltros';
import fonte from '../exemplos/PainelDeFiltros.tsx?raw';

export const pattern: Pattern = {
  id: 'painel-de-filtros',
  nome: 'Painel de filtros',
  resumo: 'O botão Filtros, com a contagem, abre um painel ao lado; os filtros ativos ficam à vista como etiquetas.',
  problema: (
    <>
      Uma lista com mais de um critério de filtro não cabe numa linha de campos, e esconder o resultado enquanto a pessoa filtra a faz
      trabalhar às cegas. O painel guarda os campos fora do caminho, ao lado da página, e o resultado muda diante dela.
    </>
  ),
  quando: [
    <>Quando a lista tem dois ou mais critérios e a pessoa precisa ver o resultado mudar enquanto escolhe.</>,
    <>Com um critério só, o painel é exagero: um campo ao lado da busca resolve.</>,
  ],
  componentes: [
    { nome: 'Button', papel: <>O gatilho "Filtros", <code>secondary</code>, com o ícone de filtro e <code>aria-expanded</code> espelhando o painel.</> },
    { nome: 'Badge', papel: 'A contagem dos filtros fora do padrão, dentro do botão; some quando não há nenhum.' },
    { nome: 'SidePanel', papel: 'O painel não modal: irmão da página dentro do AppShell, abre ao lado e empurra o conteúdo. Leva os campos e o rodapé com Limpar e Concluir.' },
    { nome: 'Select', papel: 'Um campo por critério, dentro do painel.' },
    { nome: 'Tag', papel: <>Um filtro ativo, com o nome do campo, e <code>onRemove</code> para desfazer só ele.</> },
    { nome: 'EmptyState', papel: 'O resultado vazio, com a ação de limpar os filtros.' },
  ],
  exemplos: [
    {
      titulo: 'Filtros de uma lista de chamados',
      descricao: 'Abra Filtros e escolha uma situação ou um responsável: a lista muda na hora, o botão mostra a contagem e cada filtro vira uma etiqueta que se remove.',
      Componente: PainelDeFiltros,
      codigo: codigoDe(fonte),
      altura: 480,
    },
  ],
  tela: { id: 'clientes-base', nome: 'Painel de dados com filtros' },
  acessibilidade: [
    <>O botão leva <code>aria-expanded</code>, e a contagem é lida junto, com um texto oculto: "Filtros 2 aplicados".</>,
    <>O <code>SidePanel</code> é não modal e nomeado pelo título: o foco vai ao painel ao abrir, e não há foco preso nem fundo inerte. O Esc e o botão de fechar do painel devolvem o foco ao botão que o abriu; o "Concluir", que é do produto, o devolve com <code>ref</code> e <code>focus()</code>.</>,
    <>O botão de remover da <code>Tag</code> se chama "Remover" seguido do texto da etiqueta, por isso a etiqueta nomeia o campo e o valor: "Situação: Aberto". Removida a etiqueta, o foco vai ao botão "Filtros".</>,
    <>Em largura estreita o painel passa a se comportar como o <code>Drawer</code>, com a interação dele.</>,
  ],
  comportamento: [
    <>O filtro se aplica ao mudar o campo: "Concluir" só fecha o painel, e "Limpar" volta ao padrão sem fechá-lo.</>,
    <>A contagem soma só os filtros fora do padrão; sem nenhum, não há selo.</>,
    <>Cada filtro ativo aparece como etiqueta fora do painel, para a pessoa ver o que filtra sem abri-lo. Remover a etiqueta desfaz só aquele filtro.</>,
    <>Sem resultado, o <code>EmptyState</code> ocupa o lugar da lista e oferece limpar os filtros.</>,
  ],
  variacoes: [
    <>O painel pela esquerda, com <code>side="left"</code>, e o tamanho em <code>size</code>.</>,
    <>O botão nas ações do <code>PageHeader</code>, quando a página é um painel de dados e não uma tabela.</>,
    <>O botão ao lado da busca, na barra da tabela: veja Barra da tabela.</>,
  ],
  evitar: [
    <>Filtros num <code>Drawer</code> ou num <code>Dialog</code>: o modal tira o resultado do alcance, e é ele que a pessoa quer ver mudar.</>,
    <>O <code>SidePanel</code> dentro do corpo da página: ele é irmão da página, na linha da moldura.</>,
    <>Contar também os filtros que estão no padrão.</>,
    <>Etiquetas sem o nome do campo: "Aberto" sozinho não diz o que filtra.</>,
  ],
};
