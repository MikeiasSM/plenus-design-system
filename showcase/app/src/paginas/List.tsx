import { useState } from 'react';
import { List, Select, type ListItem, type ListSelectionMode } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { ESTADOS } from '../dadosDeExemplo';

const REGISTROS = Array.from({ length: 10000 }, (_, indice) => ({
  value: String(indice),
  label: 'Registro ' + String(indice + 1).padStart(5, '0'),
}));

const COLECOES = { estados: ESTADOS, registros: REGISTROS };

function resumir(itens: readonly ListItem[]) {
  const nomes = itens.slice(0, 3).map((item) => item.label).join(', ');

  return `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}${nomes ? ': ' + nomes : ''}${itens.length > 3 ? '…' : ''}`;
}

const playground = definirPlayground({
  inicial: {
    label: 'Estados',
    selectionMode: 'none',
    items: 'estados',
    busca: true,
    marcarTodos: false,
    height: 240,
    loading: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'selectionMode', opcoes: ['none', 'single', 'multiple'] },
    { tipo: 'opcoes', nome: 'items', opcoes: ['estados', 'registros'] },
    { tipo: 'booleano', nome: 'busca' },
    { tipo: 'booleano', nome: 'marcarTodos' },
    { tipo: 'numero', nome: 'height', min: 0, max: 600, passo: 40 },
    { tipo: 'booleano', nome: 'loading' },
  ],
  renderizar: (valores, registrar) => (
    <List
      items={COLECOES[valores.items as keyof typeof COLECOES]}
      key={`${valores.selectionMode}-${valores.items}`}
      label={valores.label || undefined}
      loading={valores.loading}
      onSelectionChange={(itens) => registrar('onSelectionChange: ' + resumir(itens))}
      selectionMode={valores.selectionMode as ListSelectionMode}
      style={{ width: '100%' }}
    >
      {valores.busca && <List.Search placeholder="Buscar" />}
      {valores.marcarTodos && <List.SelectAll />}
      <List.Options height={valores.height || undefined} />
      <List.Empty>Nenhum resultado</List.Empty>
    </List>
  ),
  codigo: (valores) =>
    gerarJsx(
      'List',
      [
        ['items', expr(valores.items)],
        ['label', valores.label || undefined],
        ['selectionMode', valores.selectionMode, 'none'],
        ['loading', valores.loading, false],
        ['onSelectionChange', valores.selectionMode === 'none' ? undefined : expr('setEscolhidos')],
      ],
      [
        valores.busca && '<List.Search placeholder="Buscar" />',
        valores.marcarTodos && '<List.SelectAll />',
        gerarJsx('List.Options', [['height', valores.height || undefined]]),
        '<List.Empty>Nenhum resultado</List.Empty>',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  verificar: (valores) => {
    const comSelecao = valores.selectionMode !== 'none';
    const verificacoes: Verificacao[] = [];

    if (comSelecao) {
      verificacoes.push(
        valores.label.trim()
          ? { nivel: 'ok', titulo: 'Listbox nomeado', detalhe: `"${valores.label.trim()}", em aria-label; a busca vira "Buscar em ${valores.label.trim()}".` }
          : { nivel: 'falha', titulo: 'Listbox sem nome', detalhe: 'Com seleção, a lista é um listbox e precisa de label.' },
      );
    } else {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Lista nativa',
        detalhe: 'Sem seleção, a marcação é ul e li, sem papel de listbox e sem navegação por teclado.',
      });
    }

    if (valores.items === 'registros' && !valores.height) {
      verificacoes.push({
        nivel: 'falha',
        titulo: 'Sem virtualização',
        detalhe: 'Sem height em List.Options, as 10.000 opções vão todas ao DOM.',
      });
    } else if (valores.items === 'registros') {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Virtualizada',
        detalhe: comSelecao
          ? 'Só a faixa visível existe no DOM, e cada opção declara a posição e o total.'
          : 'Só a faixa visível existe no DOM.',
      });
    }

    if (valores.marcarTodos && valores.selectionMode !== 'multiple') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'List.SelectAll oculto',
        detalhe: 'O marcar todos só existe na seleção múltipla; nos outros modos, não aparece.',
      });
    }

    return verificacoes;
  },
});

function SelecaoUnica() {
  const [origem, setOrigem] = useState<readonly ListItem[]>([]);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <List items={ESTADOS} label="Estado de origem" onSelectionChange={setOrigem} selectionMode="single" value={origem}>
        <List.Search placeholder="Buscar estado" />
        <List.Options height={200} />
        <List.Empty>Nenhum estado encontrado</List.Empty>
      </List>
      <p className="note">Escolhido: {origem[0]?.label ?? 'nenhum'}</p>
    </div>
  );
}

function SelecaoMultipla() {
  const [atendidos, setAtendidos] = useState<readonly ListItem[]>([]);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <List
        items={ESTADOS}
        label="Estados atendidos"
        onSelectionChange={setAtendidos}
        selectionMode="multiple"
        value={atendidos}
      >
        <List.Search placeholder="Buscar estado" />
        <List.SelectAll label="Selecionar todos os estados" />
        <List.Options height={200} />
        <List.Empty>Nenhum estado encontrado</List.Empty>
      </List>
      <p className="note">{atendidos.length} de {ESTADOS.length} estados</p>
    </div>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      {(['none', 'single', 'multiple'] as const).map((modo) => (
        <div className="stack" key={modo}>
          <code>{modo}</code>
          <List
            defaultValue={modo === 'none' ? undefined : [ESTADOS[1]]}
            items={ESTADOS.slice(0, 6)}
            label={`Estados, ${modo}`}
            selectionMode={modo}
          >
            <List.SelectAll />
            <List.Options height={180} />
          </List>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>selectionMode</code></dt>
      <dd>
        <code>none</code> é uma lista nativa, <code>ul</code> e <code>li</code>, sem foco nem teclado.{' '}
        <code>single</code> e <code>multiple</code> viram listbox; na múltipla, cada item tem uma caixa de marcação
        apenas visual, e quem comunica a escolha é o próprio item.
      </dd>
      <dt>Itens, não chaves</dt>
      <dd>
        <code>value</code>, <code>defaultValue</code> e <code>onSelectionChange</code> trabalham com os itens escolhidos,
        e não com chaves: com busca no servidor, o escolhido pode não estar na coleção carregada, e sem o rótulo não há
        como exibi-lo.
      </dd>
      <dt>Partes</dt>
      <dd>
        <code>List.Search</code>, <code>List.SelectAll</code>, <code>List.Options</code> e <code>List.Empty</code> entram
        por composição, na ordem que o produto escrever. Os itens entram por propriedade, porque a virtualização decide
        quais deles existem no DOM.
      </dd>
      <dt>Selecionados durante a busca</dt>
      <dd>
        Na seleção múltipla, o que foi escolhido e saiu do resultado aparece num grupo "Selecionados" no topo. Fora da
        busca, os itens ficam no lugar, para não pularem no instante da escolha.
      </dd>
      <dt>Faixa com Shift</dt>
      <dd>
        Na múltipla, Shift com clique, ou com as setas, marca do último item escolhido até o alvo, somando ao que já
        estava marcado e pulando os desabilitados.
      </dd>
      <dt><code>onSearch</code> e <code>loading</code></dt>
      <dd>
        Com <code>onSearch</code>, a lista não filtra: avisa o termo e recebe os itens prontos. Durante{' '}
        <code>loading</code>, anuncia o carregamento em vez do vazio.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Listagem simples com busca',
      descricao: 'Sem seleção. Digite "goias" ou "sao": a busca ignora caixa e acento.',
      Previa: () => (
        <List items={ESTADOS} label="Estados" style={{ width: '100%' }}>
          <List.Search placeholder="Buscar estado" />
          <List.Options height={200} />
          <List.Empty>Nenhum estado encontrado</List.Empty>
        </List>
      ),
      codigo:
        '<List items={estados} label="Estados">\n  <List.Search placeholder="Buscar estado" />\n  <List.Options height={200} />\n  <List.Empty>Nenhum estado encontrado</List.Empty>\n</List>',
    },
    {
      titulo: 'Seleção única',
      descricao: 'Com seleção, a lista vira listbox: setas percorrem e Enter escolhe.',
      Previa: SelecaoUnica,
      codigo:
        '<List\n  items={estados}\n  label="Estado de origem"\n  selectionMode="single"\n  value={origem}\n  onSelectionChange={setOrigem}\n>\n  <List.Search placeholder="Buscar estado" />\n  <List.Options height={200} />\n  <List.Empty>Nenhum estado encontrado</List.Empty>\n</List>',
    },
    {
      titulo: 'Seleção múltipla',
      descricao: 'Marque um estado e busque outro: o marcado fica no topo. Shift com clique marca a faixa.',
      Previa: SelecaoMultipla,
      codigo:
        '<List\n  items={estados}\n  label="Estados atendidos"\n  selectionMode="multiple"\n  value={atendidos}\n  onSelectionChange={setAtendidos}\n>\n  <List.Search placeholder="Buscar estado" />\n  <List.SelectAll label="Selecionar todos os estados" />\n  <List.Options height={200} />\n  <List.Empty>Nenhum estado encontrado</List.Empty>\n</List>',
    },
    {
      titulo: 'Dez mil registros',
      descricao: 'Com height, só a faixa visível existe no DOM, e cada item declara posição e total.',
      Previa: () => (
        <List items={REGISTROS} label="Registros" selectionMode="multiple" style={{ width: '100%' }}>
          <List.Search placeholder="Buscar registro" />
          <List.SelectAll label="Selecionar todos os registros" />
          <List.Options height={240} />
          <List.Empty>Nenhum registro encontrado</List.Empty>
        </List>
      ),
      codigo:
        '<List items={registros} label="Registros" selectionMode="multiple">\n  <List.Search placeholder="Buscar registro" />\n  <List.SelectAll label="Selecionar todos os registros" />\n  <List.Options height={240} />\n  <List.Empty>Nenhum registro encontrado</List.Empty>\n</List>',
    },
  ],
  faca: {
    Previa: () => (
      <List items={ESTADOS} label="Estados atendidos" selectionMode="multiple" style={{ width: '100%' }}>
        <List.Search placeholder="Buscar estado" />
        <List.Options height={160} />
      </List>
    ),
    texto: 'List quando a listagem ocupa espaço na tela e permanece visível, e selecionar é a própria tarefa.',
  },
  evite: {
    Previa: () => (
      <div className="stack" style={{ width: '100%' }}>
        <List
          items={[
            { label: 'Mensal', value: 'mensal' },
            { label: 'Anual', value: 'anual' },
          ]}
          label="Periodicidade"
          selectionMode="single"
        >
          <List.Options />
        </List>
        <Select
          label="Periodicidade"
          options={[
            { label: 'Mensal', value: 'mensal' },
            { label: 'Anual', value: 'anual' },
          ]}
        />
      </div>
    ),
    texto: 'Uma List como campo de formulário, para escolha única numa lista curta. Esse papel é do Select, como o de baixo.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['↑', '↓'], acao: 'Item anterior ou seguinte, pulando os desabilitados. Só com seleção.' },
    { teclas: ['Home', 'End'], acao: 'Primeiro ou último item. No campo de busca, editam o texto.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Escolhe o item ativo. No campo de busca, Espaço digita.' },
    { teclas: ['Shift', '↑', '↓'], acao: 'Na seleção múltipla, estende a escolha a partir da âncora.' },
    { teclas: ['Tab'], acao: 'Passa pela busca e pelo marcar todos; sem busca, a lista com seleção recebe o foco.' },
  ],
  garantias: [
    {
      garantia: 'Papel conforme o modo',
      como: <>Sem seleção, <code>ul</code> e <code>li</code>; com seleção, <code>role="listbox"</code> nomeado, com <code>aria-multiselectable</code> na múltipla.</>,
      teste: 'List.test.tsx',
    },
    {
      garantia: 'Posição e total',
      como: <><code>aria-posinset</code> e <code>aria-setsize</code> em cada opção, inclusive virtualizada.</>,
      teste: 'List.test.tsx',
    },
    {
      garantia: 'Opção ativa',
      como: <>Com a busca, o foco fica no campo e a opção ativa em <code>aria-activedescendant</code>.</>,
      teste: 'List.test.tsx',
    },
    { garantia: 'Carregamento', como: <><code>aria-busy</code> e a mensagem de carregamento no lugar do vazio.</>, teste: 'List.test.tsx' },
    {
      garantia: 'Marcar todos',
      como: 'Checkbox fora do listbox, indeterminado na escolha parcial, só sobre os habilitados.',
      teste: 'List.test.tsx',
    },
    { garantia: 'Virtualização', como: 'A janela mede o passo entre itens e monta só o que cabe na altura.', teste: 'useVirtualWindow.test.ts' },
    { garantia: 'Busca assíncrona', como: 'A escolha feita numa consulta anterior não se perde na seguinte.', teste: 'busca-assincrona.test.tsx' },
  ],
  notaDaApi: (
    <>
      As demais propriedades nativas de <code>&lt;div&gt;</code> e o ref vão ao contêiner. Um item é{' '}
      <code>{'{ label: string; value: string; disabled?: boolean }'}</code>.
    </>
  ),
  api: [
    { nome: 'items', tipo: 'ListItem[]', descricao: 'A coleção. Por propriedade, para a virtualização decidir o que monta.' },
    { nome: 'label', tipo: 'string', descricao: 'Nome da lista; com seleção, do listbox.' },
    { nome: 'selectionMode', tipo: "'none' | 'single' | 'multiple'", padrao: "'none'", descricao: 'Sem seleção, simples ou múltipla.' },
    { nome: 'value', tipo: 'ListItem[]', descricao: 'Itens escolhidos, no modo controlado.' },
    { nome: 'defaultValue', tipo: 'ListItem[]', descricao: 'Itens escolhidos de início, no modo não controlado.' },
    { nome: 'onSelectionChange', tipo: '(items: ListItem[]) => void', descricao: 'Avisa os itens escolhidos.' },
    { nome: 'onSearch', tipo: '(term: string) => void', descricao: 'Busca externa: avisa o termo e desliga o filtro local.' },
    { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Espera da busca externa.' },
    { nome: 'loadingMessage', tipo: 'string', padrao: "'Carregando'", descricao: 'Texto do carregamento.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'As partes: Search, SelectAll, Options e Empty.' },
    { nome: 'List.Search › placeholder', tipo: 'string', padrao: "'Buscar'", descricao: 'Campo de busca da lista.' },
    { nome: 'List.SelectAll › label', tipo: 'string', padrao: "'Selecionar todos'", descricao: 'Marcar todos, só na seleção múltipla.' },
    { nome: 'List.Options › height', tipo: 'number', descricao: 'Altura em pixels; com ela, a lista é virtualizada.' },
    { nome: 'List.Empty › children', tipo: 'ReactNode', descricao: 'Mensagem da lista vazia, fora do carregamento.' },
  ],
};
