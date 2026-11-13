import { codigoDe, type Pattern } from '../tipos';
import { SalvarPorCartao } from '../exemplos/SalvarPorCartao';
import fonte from '../exemplos/SalvarPorCartao.tsx?raw';

export const pattern: Pattern = {
  id: 'salvar-por-cartao',
  nome: 'Salvar por cartão',
  resumo: 'Cada cartão de ajustes salva por si: a situação à esquerda do rodapé e Descartar e Salvar ativos só com alteração.',
  problema: (
    <>
      Numa página de ajustes com vários cartões independentes, um só botão de salvar no fim obriga a pessoa a lembrar o que mudou e onde. Com
      o salvar no rodapé de cada cartão, a ação fica junto do que ela alterou, e a situação diz se há algo por salvar.
    </>
  ),
  quando: [
    <>Quando os cartões da página se salvam de forma independente, como os ajustes de uma configuração.</>,
    <>Quando a página inteira salva de uma vez, a montagem é o rodapé fixo da página ou a <code>SaveBar</code>: veja Folha de página.</>,
  ],
  componentes: [
    { nome: 'Card', papel: 'O cartão de ajustes, com o cabeçalho que o nomeia.' },
    { nome: 'Card.Footer', papel: <>Com <code>start</code> para a situação do salvamento, e os botões à direita.</> },
    { nome: 'SaveStatus', papel: 'O texto curto da situação (sem alterações, não salvas, salvando, salvas, erro), com o indicador do estado.' },
    { nome: 'Button', papel: <>"Descartar" (<code>secondary</code>) e "Salvar", ambos <code>size="sm"</code>; o salvar leva <code>loading</code> enquanto grava.</> },
    { nome: 'InputText', papel: 'Os campos do cartão, aqui em uma Stack.' },
  ],
  exemplos: [
    {
      titulo: 'Dados de uma loja',
      descricao: 'Edite um campo: a situação passa a Alterações não salvas e os botões se habilitam. Salvar mostra Salvando… e depois Alterações salvas; Descartar volta ao último valor salvo.',
      Componente: SalvarPorCartao,
      codigo: codigoDe(fonte),
    },
  ],
  tela: { id: 'configuracao-anotada', nome: 'Seção de configuração, anotada' },
  acessibilidade: [
    <>O <code>SaveStatus</code> fica numa região <code>role="status"</code> sempre montada: a mudança do texto é lida sem tirar o foco do campo.</>,
    <>O texto da situação é sempre escrito: o indicador sozinho não diz a situação a quem não o vê, ou não distingue a cor.</>,
    <>Enquanto grava, o <code>Salvar</code> com <code>loading</code> continua no lugar, marcado com <code>aria-busy</code> e sem acionar de novo; os campos ficam desabilitados.</>,
    <>Salvo ou descartado, os botões desabilitam, e o produto devolve o foco ao primeiro campo do cartão.</>,
  ],
  comportamento: [
    <>"Descartar" e "Salvar" só ficam ativos quando há alteração, comparada com o último valor salvo, e não com o inicial.</>,
    <>Depois de salvar, a situação diz "salvas" até a próxima edição, que volta a "não salvas".</>,
    <>Na falha, a situação é <code>error</code>, com o texto do que houve e o que fazer, e as alterações continuam no cartão.</>,
    <>No produto, a requisição acontece em "Salvar"; o <code>SaveStatus</code> só mostra a situação e quem salva é o produto.</>,
  ],
  variacoes: [
    <>Só o "Salvar", sem "Descartar", para um cartão de um campo que se refaz com facilidade.</>,
    <>O mesmo rodapé em cartões com linhas de ajuste, com <code>FieldRow</code>: veja Bloco de ajustes.</>,
    <>O rascunho salvo sozinho, sem botão de descartar, que só mostra "Salvando…" e "Salvo às 10:42".</>,
  ],
  evitar: [
    <>Um "Salvar" da página e um por cartão ao mesmo tempo: a pessoa não sabe qual grava o quê.</>,
    <>Botões sempre ativos, que gravam sem nada para gravar.</>,
    <>O <code>SaveStatus</code> sem texto.</>,
    <>Descartar sem voltar ao último valor salvo.</>,
  ],
};
