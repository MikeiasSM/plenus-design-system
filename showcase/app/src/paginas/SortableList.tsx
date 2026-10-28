import { useState, type ReactNode } from 'react';
import {
  ButtonIcon,
  IconAlignLeft,
  IconFile,
  IconStructure,
  IconTrash,
  SortableList,
  type SortableListItem,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

interface Bloco {
  id: string;
  icone: ReactNode;
  nivel: number;
  tipo: string;
  trecho: string;
}

const BLOCOS_DO_DOCUMENTO: Bloco[] = [
  { id: 'b1', icone: <IconStructure />, nivel: 1, tipo: 'Título', trecho: 'Guia de integração do faturamento' },
  { id: 'b2', icone: <IconAlignLeft />, nivel: 1, tipo: 'Parágrafo', trecho: 'Este guia descreve como o sistema de faturamento conversa com o estoque.' },
  { id: 'b3', icone: <IconStructure />, nivel: 1, tipo: 'Seção', trecho: 'Configuração inicial' },
  { id: 'b4', icone: <IconAlignLeft />, nivel: 2, tipo: 'Parágrafo', trecho: 'Antes de começar, gere a chave de acesso no painel administrativo.' },
  { id: 'b5', icone: <IconFile />, nivel: 2, tipo: 'Anexo', trecho: 'chave-de-acesso.pdf' },
  { id: 'b6', icone: <IconAlignLeft />, nivel: 1, tipo: 'Parágrafo', trecho: 'Dúvidas vão para o canal de suporte.' },
];

function moverBloco(blocos: readonly Bloco[], de: number, para: number) {
  const copia = [...blocos];
  const [bloco] = copia.splice(de, 1);
  copia.splice(para, 0, bloco);
  return copia;
}

interface OpcoesDaEstrutura {
  acoes: boolean;
  aninhado: boolean;
  icones: boolean;
  trechos: boolean;
}

function itensDe(blocos: readonly Bloco[], opcoes: OpcoesDaEstrutura, excluir: (id: string) => void): SortableListItem[] {
  return blocos.map((bloco) => ({
    key: bloco.id,
    title: bloco.tipo,
    excerpt: opcoes.trechos ? bloco.trecho : undefined,
    icon: opcoes.icones ? bloco.icone : undefined,
    level: opcoes.aninhado ? bloco.nivel : undefined,
    actions: opcoes.acoes ? (
      <ButtonIcon icon={<IconTrash />} label={`Excluir ${bloco.tipo}`} onClick={() => excluir(bloco.id)} size="sm" variant="dangerGhost" />
    ) : undefined,
  }));
}

function EstruturaDoDocumento({
  label = 'Estrutura do documento',
  opcoes = { acoes: true, aninhado: true, icones: true, trechos: true },
  registrar,
}: {
  label?: string;
  opcoes?: OpcoesDaEstrutura;
  registrar?: (evento: string) => void;
}) {
  const [blocos, setBlocos] = useState(BLOCOS_DO_DOCUMENTO);
  const [escolhido, setEscolhido] = useState<string | null>('b2');

  function excluir(id: string) {
    registrar?.(`excluir: ${id}`);
    setBlocos((atuais) => atuais.filter((bloco) => bloco.id !== id));
  }

  return (
    <div style={{ width: 340 }}>
      <SortableList
        items={itensDe(blocos, opcoes, excluir)}
        label={label}
        onReorder={(de, para) => {
          registrar?.(`onReorder: ${de} → ${para}`);
          setBlocos((atuais) => moverBloco(atuais, de, para));
        }}
        onSelectionChange={(chave) => {
          registrar?.(`onSelectionChange: ${chave}`);
          setEscolhido(chave);
        }}
        selectedKey={escolhido}
      />
    </div>
  );
}

const playground = definirPlayground({
  inicial: { label: 'Estrutura do documento', trechos: true, icones: true, acoes: true, aninhado: true },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'booleano', nome: 'trechos' },
    { tipo: 'booleano', nome: 'icones' },
    { tipo: 'booleano', nome: 'acoes' },
    { tipo: 'booleano', nome: 'aninhado' },
  ],
  renderizar: (valores, registrar) => (
    <EstruturaDoDocumento
      label={valores.label}
      opcoes={{ acoes: valores.acoes, aninhado: valores.aninhado, icones: valores.icones, trechos: valores.trechos }}
      registrar={registrar}
    />
  ),
  codigo: (valores) =>
    gerarJsx('SortableList', [
      ['label', valores.label],
      ['items', expr('blocos')],
      ['selectedKey', expr('escolhido')],
      ['onSelectionChange', expr('setEscolhido')],
      ['onReorder', expr('(de, para) => setBlocos(mover(blocos, de, para))')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Lista nomeada', detalhe: `role="grid" com aria-label="${valores.label.trim()}".` }
        : { nivel: 'falha', titulo: 'Lista sem nome', detalhe: 'label é obrigatório: diz ao leitor de tela do que é a lista.' },
      { nivel: 'ok', titulo: 'Alça nomeada', detalhe: 'Cada alça se chama "Reordenar <título>" e explica o atalho de teclado.' },
      { nivel: 'ok', titulo: 'Movimento anunciado', detalhe: 'Cada reordenação diz a nova posição numa região viva.' },
    ];

    if (valores.acoes) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Ações fora do Tab',
        detalhe: 'A lista é uma parada só; as setas para os lados chegam à alça e às ações da linha.',
      });
    }

    return verificacoes;
  },
});

function Variantes() {
  const variantes: { opcoes: OpcoesDaEstrutura; titulo: string }[] = [
    { titulo: 'Só títulos', opcoes: { acoes: false, aninhado: false, icones: false, trechos: false } },
    { titulo: 'Com trecho e ícone', opcoes: { acoes: false, aninhado: false, icones: true, trechos: true } },
    { titulo: 'Aninhada, com ações', opcoes: { acoes: true, aninhado: true, icones: true, trechos: true } },
  ];

  return (
    <div>
      {variantes.map(({ opcoes, titulo }) => (
        <div className="subsection" key={titulo}>
          <h3>{titulo}</h3>
          <EstruturaDoDocumento label={`Estrutura, ${titulo.toLowerCase()}`} opcoes={opcoes} />
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Reordenação avisada</dt>
      <dd>
        A lista não reordena sozinha: avisa <code>onReorder(fromIndex, toIndex)</code>, e o produto, dono dos itens,
        aplica a mudança.
      </dd>
      <dt>Escolha controlada ou não</dt>
      <dd>
        <code>selectedKey</code> com <code>onSelectionChange</code>, ou só <code>defaultSelectedKey</code>.{' '}
        <code>selectedKey={'{null}'}</code> deixa a lista controlada sem nenhum item escolhido.
      </dd>
      <dt>Arrasto</dt>
      <dd>Pela alça, com mouse, caneta ou toque. Uma linha mostra onde o item vai cair; Esc cancela.</dd>
      <dt>Recuo</dt>
      <dd>
        <code>level</code> recua a linha, para blocos aninhados. Mover continua sendo na lista plana: quem decide o que
        muda de pai é o produto.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Estrutura do documento',
      descricao: 'Reordene pela alça ou com Alt e as setas; o estado é do exemplo, que move e exclui os blocos de verdade.',
      Previa: () => <EstruturaDoDocumento />,
      codigo:
        "const [blocos, setBlocos] = useState(blocosDoDocumento);\n\n<SortableList\n  label=\"Estrutura do documento\"\n  items={blocos.map((bloco) => ({\n    key: bloco.id,\n    title: bloco.tipo,\n    excerpt: bloco.trecho,\n    icon: bloco.icone,\n    level: bloco.nivel,\n    actions: <ButtonIcon icon={<IconTrash />} label={`Excluir ${bloco.tipo}`} size=\"sm\" variant=\"dangerGhost\" onClick={() => excluir(bloco.id)} />,\n  }))}\n  selectedKey={escolhido}\n  onSelectionChange={setEscolhido}\n  onReorder={(de, para) => setBlocos(mover(blocos, de, para))}\n/>",
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Entra na lista pela linha escolhida e sai dela: a lista é uma parada só.' },
    { teclas: ['↑', '↓'], acao: 'Vai à linha anterior ou seguinte, e a escolhe.' },
    { teclas: ['Home', 'End'], acao: 'Vai à primeira ou à última linha, e a escolhe.' },
    { teclas: ['Alt + ↑', 'Alt + ↓'], acao: 'Move o item uma posição e anuncia a nova posição.' },
    { teclas: ['←', '→'], acao: 'Percorre a alça e as ações da linha, e volta à linha.' },
    { teclas: ['Espaço', 'Enter'], acao: 'Escolhe a linha em foco.' },
    { teclas: ['Esc'], acao: 'Durante o arrasto, cancela sem mover.' },
  ],
  garantias: [
    {
      garantia: 'Uma parada de Tab',
      como: <>Só a linha escolhida tem <code>tabIndex=0</code>; alça e ações ficam com -1.</>,
      teste: 'SortableList.test.tsx',
    },
    { garantia: 'Escolha segue o foco', como: 'Setas, Home e End movem o foco e avisam onSelectionChange.', teste: 'SortableList.test.tsx' },
    { garantia: 'Controlada', como: <>Com <code>selectedKey</code>, a escolha só muda quando o produto aceita.</>, teste: 'SortableList.test.tsx' },
    { garantia: 'Ação não escolhe', como: 'O clique num controle da linha é do controle.', teste: 'SortableList.test.tsx' },
    {
      garantia: 'Reordenar pelo teclado',
      como: 'Alt com as setas avisa onReorder, anuncia "Movido para a posição 3 de 4" e mantém o foco no item.',
      teste: 'SortableList.test.tsx',
    },
    { garantia: 'Arrasto', como: 'Indicador de soltura, onReorder ao soltar e Esc que cancela.', teste: 'SortableList.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref, exceto children e onKeyDown.',
  api: [
    {
      nome: 'items',
      tipo: 'readonly SortableListItem[]',
      descricao: (
        <>
          Cada linha: <code>key</code>, <code>title</code>, <code>excerpt</code>, <code>icon</code>, <code>level</code> e{' '}
          <code>actions</code>.
        </>
      ),
    },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Nome da lista, para o leitor de tela.' },
    { nome: 'onReorder', tipo: '(fromIndex: number, toIndex: number) => void', descricao: 'Obrigatória. Pede a mudança de posição; quem reordena é o produto.' },
    { nome: 'selectedKey', tipo: 'string | null', descricao: 'Linha escolhida, no modo controlado. null para nenhuma.' },
    { nome: 'defaultSelectedKey', tipo: 'string', descricao: 'Linha escolhida no início, no modo não controlado.' },
    { nome: 'onSelectionChange', tipo: '(key: string) => void', descricao: 'Avisa a linha escolhida.' },
  ],
};
