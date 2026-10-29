import { useState } from 'react';
import { Button, Dialog, Menu, type MenuItem } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const ITENS: readonly MenuItem[] = [
  { key: 'editar', label: 'Editar' },
  { key: 'duplicar', label: 'Duplicar' },
  { key: 'arquivar', label: 'Arquivar', disabled: true },
  { key: 'excluir', label: 'Excluir' },
];

interface ValoresDoAtalho {
  atalhoDuplicar: string;
  shortcutKeys: string;
}

function atalhoDoPlayground({ atalhoDuplicar, shortcutKeys }: ValoresDoAtalho): Partial<MenuItem> {
  return {
    shortcut: atalhoDuplicar.trim() || undefined,
    shortcutKeys: shortcutKeys.trim() || undefined,
  };
}

function codigoDoAtalho({ atalhoDuplicar, shortcutKeys }: ValoresDoAtalho) {
  const atalho = atalhoDuplicar.trim() ? ` shortcut: '${atalhoDuplicar.trim()}',` : '';
  return atalho + (shortcutKeys.trim() ? ` shortcutKeys: '${shortcutKeys.trim()}',` : '');
}

const playground = definirPlayground({
  inicial: { label: 'Ações do módulo', gatilho: 'Ações', arquivarDesabilitado: true, atalhoDuplicar: 'Ctrl+Shift+D', shortcutKeys: '' },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'gatilho' },
    { tipo: 'booleano', nome: 'arquivarDesabilitado' },
    { tipo: 'texto', nome: 'atalhoDuplicar' },
    { tipo: 'texto', nome: 'shortcutKeys' },
  ],
  renderizar: (valores, registrar) => (
    <Menu
      items={ITENS.map((item) => ({
        ...item,
        disabled: item.key === 'arquivar' && valores.arquivarDesabilitado,
        ...(item.key === 'duplicar' ? atalhoDoPlayground(valores) : {}),
        onSelect: () => registrar(`onSelect: ${item.key}`),
      }))}
      label={valores.label}
      onOpenChange={(aberto) => registrar(`onOpenChange: ${aberto}`)}
    >
      <Button variant="secondary">{valores.gatilho}</Button>
    </Menu>
  ),
  codigo: (valores) =>
    [
      'const acoes: MenuItem[] = [',
      "  { key: 'editar', label: 'Editar', onSelect: editar },",
      `  { key: 'duplicar', label: 'Duplicar',${codigoDoAtalho(valores)} onSelect: duplicar },`,
      `  { key: 'arquivar', label: 'Arquivar',${valores.arquivarDesabilitado ? ' disabled: true,' : ''} onSelect: arquivar },`,
      "  { key: 'excluir', label: 'Excluir', onSelect: excluir },",
      '];',
      '',
      gerarJsx(
        'Menu',
        [
          ['label', valores.label],
          ['items', expr('acoes')],
          ['onOpenChange', expr('mudarAbertura')],
        ],
        `<Button variant="secondary">${valores.gatilho}</Button>`,
      ),
    ].join('\n'),
  verificar: (valores) => {
    const nome = valores.label.trim();
    const verificacoes: Verificacao[] = [
      nome
        ? { nivel: 'ok', titulo: 'Nome do menu', detalhe: `"${nome}", no aria-label da lista.` }
        : { nivel: 'falha', titulo: 'Menu sem nome', detalhe: 'label nomeia o role="menu" para o leitor de tela.' },
      valores.gatilho.trim()
        ? { nivel: 'ok', titulo: 'Popup anunciado', detalhe: 'O gatilho recebe aria-haspopup="menu" e aria-expanded.' }
        : { nivel: 'falha', titulo: 'Gatilho sem nome', detalhe: 'O botão que abre o menu precisa de texto.' },
    ];

    if (valores.atalhoDuplicar.trim()) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Atalho anunciado',
        detalhe: valores.shortcutKeys.trim()
          ? `aria-keyshortcuts="${valores.shortcutKeys.trim()}", como escrito em shortcutKeys.`
          : 'O texto vira os nomes de tecla da ARIA em aria-keyshortcuts: Ctrl → Control, ⌘ → Meta, Esc → Escape.',
      });
    }

    if (valores.arquivarDesabilitado) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Item desabilitado',
        detalhe: 'As setas e a busca pulam o item. Diga em outro lugar por que a ação não está disponível.',
      });
    }

    return verificacoes;
  },
});

function UltimaAcao() {
  const [ultima, setUltima] = useState('nenhuma');

  return (
    <>
      <Menu items={ITENS.map((item) => ({ ...item, onSelect: () => setUltima(item.label) }))} label="Ações do módulo">
        <Button variant="secondary">Ações</Button>
      </Menu>
      <span className="note" style={{ margin: 0 }}>Última ação: {ultima}</span>
    </>
  );
}

function Exibicao() {
  const [densidade, setDensidade] = useState('Padrão');

  return (
    <Menu
      items={[
        {
          key: 'densidade',
          label: 'Densidade',
          items: ['Compacta', 'Padrão', 'Confortável'].map((opcao) => ({
            key: opcao,
            label: opcao,
            checked: densidade === opcao,
            onSelect: () => setDensidade(opcao),
          })),
        },
        {
          key: 'exportar',
          label: 'Exportar',
          items: [
            { key: 'csv', label: 'CSV' },
            { key: 'pdf', label: 'PDF' },
          ],
        },
        { key: 'restaurar', label: 'Restaurar o padrão', onSelect: () => setDensidade('Padrão') },
      ]}
      label="Opções da exibição"
    >
      <Button variant="secondary">Exibição</Button>
    </Menu>
  );
}

function ExcluirComConfirmacao() {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <Menu
        items={[
          { key: 'renomear', label: 'Renomear' },
          { key: 'excluir', label: 'Excluir', onSelect: () => setConfirmando(true) },
        ]}
        label="Ações do documento"
      >
        <Button variant="secondary">Documento</Button>
      </Menu>
      <Dialog
        footer={
          <>
            <Button onClick={() => setConfirmando(false)} variant="secondary">Cancelar</Button>
            <Button onClick={() => setConfirmando(false)} variant="danger">Excluir</Button>
          </>
        }
        onOpenChange={setConfirmando}
        open={confirmando}
        role="alertdialog"
        size="sm"
        title="Excluir documento"
      >
        Esta ação não pode ser desfeita.
      </Dialog>
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Não controlado</dt>
      <dd>
        O padrão. O menu guarda a própria abertura; <code>defaultOpen</code> abre na primeira renderização e{' '}
        <code>onOpenChange</code> avisa cada mudança.
      </dd>
      <dt>Controlado</dt>
      <dd>
        Com <code>open</code>, o menu pede a mudança por <code>onOpenChange</code> e espera o consumidor. O foco volta ao
        gatilho no pedido de fechar.
      </dd>
      <dt>Item desabilitado</dt>
      <dd>Fica visível, mas as setas e a busca o pulam e o clique não dispara <code>onSelect</code>.</dd>
      <dt>Escolher</dt>
      <dd>
        Fecha o menu e devolve o foco ao gatilho antes do <code>onSelect</code>: um Dialog aberto por ele devolve o foco ao
        lugar certo ao fechar.
      </dd>
      <dt>Clique fora</dt>
      <dd>Fecha sem devolver o foco, que fica com o que foi clicado.</dd>
      <dt>Submenu</dt>
      <dd>
        Um item com <code>items</code> abre outro menu ao lado, com os mesmos itens e grupos, e o <code>onSelect</code> dele não
        é chamado. Abre pelo teclado ou ao passar o ponteiro, com uma espera curta: atravessar na diagonal não o fecha.
        Escolher no submenu fecha tudo e devolve o foco ao gatilho.
      </dd>
      <dt>Lista longa</dt>
      <dd>A altura para em 360px, ou no espaço disponível, e a lista rola.</dd>
      <dt>Gatilho</dt>
      <dd>
        Um único elemento, que mantém o próprio <code>ref</code>, <code>onClick</code> e <code>onKeyDown</code>. O painel não
        recebe <code>id</code> nem <code>data-*</code>, por decisão: a raiz é o gatilho.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Ações de um registro',
      descricao: 'Cada item chama o seu onSelect. Arquivar está desabilitado e é pulado pelas setas.',
      Previa: UltimaAcao,
      codigo:
        "const acoes: MenuItem[] = [\n  { key: 'editar', label: 'Editar', onSelect: editar },\n  { key: 'duplicar', label: 'Duplicar', onSelect: duplicar },\n  { key: 'arquivar', label: 'Arquivar', disabled: true },\n  { key: 'excluir', label: 'Excluir', onSelect: excluir },\n];\n\n<Menu label=\"Ações do módulo\" items={acoes}>\n  <Button variant=\"secondary\">Ações</Button>\n</Menu>",
    },
    {
      titulo: 'Submenus',
      descricao: 'Densidade e Exportar abrem ao lado. Escolher uma densidade fecha o menu inteiro.',
      Previa: Exibicao,
      codigo:
        "<Menu\n  label=\"Opções da exibição\"\n  items={[\n    {\n      key: 'densidade',\n      label: 'Densidade',\n      items: densidades.map((d) => ({ key: d, label: d, checked: d === atual, onSelect: () => setAtual(d) })),\n    },\n    { key: 'exportar', label: 'Exportar', items: [{ key: 'csv', label: 'CSV' }, { key: 'pdf', label: 'PDF' }] },\n  ]}\n>\n  <Button variant=\"secondary\">Exibição</Button>\n</Menu>",
    },
    {
      titulo: 'Item que abre uma confirmação',
      descricao: 'O foco volta ao gatilho antes do onSelect; ao fechar o Dialog, ele retorna ao gatilho.',
      Previa: ExcluirComConfirmacao,
      codigo:
        "<Menu\n  label=\"Ações do documento\"\n  items={[\n    { key: 'renomear', label: 'Renomear', onSelect: renomear },\n    { key: 'excluir', label: 'Excluir', onSelect: () => setConfirmando(true) },\n  ]}\n>\n  <Button variant=\"secondary\">Documento</Button>\n</Menu>\n<Dialog\n  open={confirmando}\n  onOpenChange={setConfirmando}\n  role=\"alertdialog\"\n  size=\"sm\"\n  title=\"Excluir documento\"\n  footer={...}\n>\n  Esta ação não pode ser desfeita.\n</Dialog>",
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Enter', 'Espaço'], acao: 'No gatilho, abre o menu na primeira opção; num item, aciona e fecha.' },
    { teclas: ['↓'], acao: 'No gatilho, abre na primeira opção; no menu, vai à próxima, pulando as desabilitadas.' },
    { teclas: ['↑'], acao: 'No gatilho, abre na última opção; no menu, vai à anterior, pulando as desabilitadas.' },
    { teclas: ['Home', 'End'], acao: 'Primeira e última opção habilitada.' },
    { teclas: ['→'], acao: 'Num item com submenu, abre o submenu na primeira opção.' },
    { teclas: ['←'], acao: 'No submenu, fecha ele e volta ao item que o abriu.' },
    { teclas: ['Letra'], acao: 'Leva à próxima opção que começa por ela.' },
    { teclas: ['Esc'], acao: 'Fecha o menu e devolve o foco ao gatilho; no submenu, volta ao item que o abriu.' },
    { teclas: ['Tab'], acao: 'Fecha o menu, com os submenus, e devolve o foco ao gatilho.' },
  ],
  garantias: [
    {
      garantia: 'Popup anunciado',
      como: <>O gatilho recebe <code>aria-haspopup=&quot;menu&quot;</code> e <code>aria-expanded</code>.</>,
      teste: 'Menu.test.tsx',
    },
    { garantia: 'Foco nos itens', como: 'Foco real na primeira opção ao abrir; as setas pulam as desabilitadas.', teste: 'Menu.test.tsx' },
    { garantia: 'Busca por digitação', como: 'Uma letra leva à opção que começa por ela.', teste: 'Menu.test.tsx' },
    { garantia: 'Foco devolvido', como: 'Escape fecha e devolve o foco ao gatilho, antes do onSelect na escolha.', teste: 'Menu.test.tsx' },
    {
      garantia: 'Submenu anunciado',
      como: 'O item pai tem aria-haspopup="menu" e aria-expanded; o foco volta a ele ao fechar o submenu.',
      teste: 'Menu.test.tsx',
    },
    { garantia: 'Abertura controlada', como: 'Com open, o menu só pede a mudança, sem decidir por conta própria.', teste: 'Menu.test.tsx' },
    {
      garantia: 'Atalho anunciado',
      como: 'O texto do shortcut vira os nomes de tecla de aria-keyshortcuts; shortcutKeys substitui a conversão.',
      teste: 'keyShortcuts.test.ts',
    },
    { garantia: 'Gatilho preservado', como: 'Mantém o ref, o onClick e o onKeyDown de quem o escreveu.', teste: 'aninhados.test.tsx' },
    { garantia: 'Dentro de Dialog', como: 'Camada de cima, visível ao leitor de tela.', teste: 'aninhados.test.tsx' },
    { garantia: 'Servidor', como: 'Aberto na renderização do servidor, não quebra.', teste: 'servidor.test.tsx' },
  ],
  notaDaApi: (
    <>
      Cada item é um <code>MenuItem</code>: <code>{'{ key: string; label: string; disabled?: boolean; onSelect?: () => void }'}</code>.
      O <code>shortcut</code> é o texto à direita, como <code>Ctrl+Shift+D</code> ou <code>⌘⇧D</code>, convertido nos nomes de
      tecla de <code>aria-keyshortcuts</code> (<code>Control+Shift+D</code>, <code>Meta+Shift+D</code>); vários atalhos vão
      separados por vírgula. Quando a conversão não basta, <code>shortcutKeys</code> vai direto ao atributo, como{' '}
      <code>Control+D Meta+D</code>.
    </>
  ),
  api: [
    { nome: 'children', tipo: 'ReactElement', descricao: 'Obrigatória. O gatilho: um único elemento focável.' },
    { nome: 'items', tipo: 'readonly MenuItem[]', descricao: 'Obrigatória. As ações, na ordem em que aparecem.' },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatória. Nome acessível da lista.' },
    { nome: 'open', tipo: 'boolean', descricao: 'Controla a abertura; sem ele, o menu guarda o próprio estado.' },
    { nome: 'defaultOpen', tipo: 'boolean', padrao: 'false', descricao: 'Abertura inicial no modo não controlado.' },
    { nome: 'onOpenChange', tipo: '(open: boolean) => void', descricao: 'Avisa cada abertura e fechamento pedidos.' },
  ],
};
