import { codigoDe, type Pattern } from '../tipos';
import { Assistente } from '../exemplos/Assistente';
import fonte from '../exemplos/Assistente.tsx?raw';

export const pattern: Pattern = {
  id: 'assistente',
  nome: 'Assistente',
  resumo: 'Um processo em etapas dentro de um cartão: o indicador no alto, o título da etapa, o corpo e, no rodapé, voltar e avançar.',
  problema: (
    <>
      Alguns processos pedem uma ordem: cada etapa depende da anterior, e a pessoa precisa saber em que ponto está, voltar sem perder o que
      preencheu e sair guardando o rascunho. O <code>Steps</code> é só o indicador; a montagem completa dá a ele o conteúdo e os botões.
    </>
  ),
  quando: [
    <>Em processos com sequência, como um cadastro longo, uma importação ou uma conciliação, em que as etapas têm ordem.</>,
    <>Quando os painéis são equivalentes e sem ordem, a escolha é <code>Tabs</code>.</>,
  ],
  componentes: [
    { nome: 'Card', papel: 'A superfície do processo inteiro.' },
    { nome: 'Steps', papel: 'O indicador no alto: a etapa atual destacada e as anteriores concluídas. Sem onCurrentChange, ele só mostra o ponto; quem move são os botões do rodapé.' },
    { nome: 'Card.Header', papel: 'O título e a explicação da etapa atual, em h2.' },
    { nome: 'Card.Body', papel: 'O conteúdo da etapa: campos, uma tabela ou o resumo.' },
    { nome: 'Card.Footer', papel: <>Com <code>start</code> para "Salvar e sair" e, à direita, "Voltar" e "Próximo".</> },
    { nome: 'EmptyState', papel: 'O sucesso no fim, no lugar do cartão do processo, com o que fazer em seguida.' },
    { nome: 'InputText', papel: 'Os campos da etapa, como o nome do projeto.' },
    { nome: 'RadioGroup', papel: <>Uma escolha entre poucas opções, aqui com <code>orientation="horizontal"</code>.</> },
  ],
  exemplos: [
    {
      titulo: 'Criar um projeto em três etapas',
      descricao: 'O "Próximo" só habilita com o nome preenchido. Volte pelo "Voltar", saia guardando o rascunho ou conclua para ver o sucesso.',
      Componente: Assistente,
      codigo: codigoDe(fonte),
    },
  ],
  tela: { id: 'conciliacao', nome: 'Assistente em etapas' },
  acessibilidade: [
    <>O <code>Steps</code> é uma navegação nomeada (<code>label</code>) e marca a etapa atual com <code>aria-current="step"</code>.</>,
    <>Sem <code>onCurrentChange</code>, o indicador não tem botões: nenhuma etapa promete um clique que não acontece, e só se vai adiante pelo "Próximo", que valida.</>,
    <>Os botões ficam sempre no mesmo lugar do rodapé, então o foco que estava no "Próximo" continua num controle útil na etapa seguinte.</>,
    <>O título de cada etapa é um <code>h2</code>. Ao voltar à primeira etapa, o "Voltar" desabilita, e o foco passa ao "Próximo".</>,
    <>O sucesso e o rascunho salvo ocupam o lugar do cartão do processo, e o foco vai à ação deles: não cai no começo da página.</>,
  ],
  comportamento: [
    <>O "Próximo" fica desabilitado enquanto a etapa não tem o que precisa, e "Voltar" desabilita na primeira etapa, sem sumir.</>,
    <>Na última etapa, o botão passa a dizer a ação concreta, como "Criar projeto", em vez de "Próximo".</>,
    <>Voltar não perde o que foi preenchido: o estado fica acima das etapas.</>,
    <>"Salvar e sair" guarda o rascunho e oferece retomar de onde parou.</>,
    <>O sucesso ocupa o lugar do processo e oferece o passo seguinte.</>,
  ],
  variacoes: [
    <>Com <code>onCurrentChange</code>, cada etapa vira botão, para o processo em que se pode ir e voltar livremente; o produto decide quais etapas aceitam o clique.</>,
    <>Uma etapa de tabela, com <code>Card.Body flush</code> e <code>Table size="sm"</code>, como a conferência da conciliação.</>,
    <>Um <code>Alert</code> no resumo, para avisar o que não trava a conclusão.</>,
  ],
  evitar: [
    <>O <code>Steps</code> como abas: as etapas têm ordem, e os painéis das abas são equivalentes.</>,
    <>Liberar o clique numa etapa adiante sem validar a anterior: ela chegaria vazia.</>,
    <>Trocar os botões de lugar de uma etapa para outra, ou escondê-los.</>,
    <>Nomear o último botão de "Próximo": a pessoa não sabe que o processo acaba ali.</>,
  ],
};
