import { useRef, useState, type MouseEvent } from 'react';
import {
  Button,
  ButtonIcon,
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconBold,
  IconItalic,
  IconLink,
  IconMore,
  IconPlus,
  IconTrash,
  IconUpload,
  Menu,
  Toolbar,
  type ToolbarAppearance,
  type ToolbarOrientation,
} from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const ORIENTACOES = ['horizontal', 'vertical'] as const;
const APARENCIAS = ['floating', 'flat'] as const;
const ALINHAMENTOS = [
  { chave: 'esquerda', rotulo: 'Alinhar à esquerda', icone: <IconAlignLeft /> },
  { chave: 'centro', rotulo: 'Centralizar', icone: <IconAlignCenter /> },
  { chave: 'direita', rotulo: 'Alinhar à direita', icone: <IconAlignRight /> },
];

// O sistema ainda não tem ícone de negrito e itálico: a letra formatada faz o papel.
const NEGRITO = <IconBold />;
const ITALICO = <IconItalic />;

// No editor, o clique na barra não tira o cursor do texto.
const segurarOFoco = (evento: MouseEvent) => evento.preventDefault();

interface BarraDoBlocoProps {
  appearance?: ToolbarAppearance;
  label?: string;
  orientation?: ToolbarOrientation;
  registrar?: (evento: string) => void;
}

function BarraDoBloco({ appearance, label = 'Bloco', orientation, registrar = () => undefined }: BarraDoBlocoProps) {
  const [negrito, setNegrito] = useState(false);
  const [italico, setItalico] = useState(false);
  const [alinhamento, setAlinhamento] = useState('esquerda');

  return (
    <Toolbar appearance={appearance} label={label} orientation={orientation}>
      <Toolbar.Group>
        <ButtonIcon
          aria-pressed={negrito}
          icon={NEGRITO}
          label="Negrito"
          onClick={() => {
            registrar('Negrito');
            setNegrito(!negrito);
          }}
          size="sm"
          variant="ghost"
        />
        <ButtonIcon
          aria-pressed={italico}
          icon={ITALICO}
          label="Itálico"
          onClick={() => {
            registrar('Itálico');
            setItalico(!italico);
          }}
          size="sm"
          variant="ghost"
        />
        <ButtonIcon icon={<IconLink />} label="Link" onClick={() => registrar('Link')} size="sm" variant="ghost" />
      </Toolbar.Group>
      <Toolbar.Group label="Alinhamento">
        {ALINHAMENTOS.map((item) => (
          <ButtonIcon
            aria-pressed={alinhamento === item.chave}
            icon={item.icone}
            key={item.chave}
            label={item.rotulo}
            onClick={() => {
              registrar(item.rotulo);
              setAlinhamento(item.chave);
            }}
            size="sm"
            variant="ghost"
          />
        ))}
      </Toolbar.Group>
      <Toolbar.Group>
        <Menu
          items={[
            { key: 'riscado', label: 'Riscado', onSelect: () => registrar('Riscado') },
            { key: 'codigo', label: 'Código em linha', onSelect: () => registrar('Código em linha') },
            { key: 'limpar', label: 'Limpar formatação', onSelect: () => registrar('Limpar formatação') },
          ]}
          label="Mais formatação"
        >
          <ButtonIcon icon={<IconMore />} label="Mais formatação" size="sm" variant="ghost" />
        </Menu>
      </Toolbar.Group>
    </Toolbar>
  );
}

const playground = definirPlayground({
  inicial: { label: 'Bloco', orientation: 'horizontal', appearance: 'floating' },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'orientation', opcoes: ORIENTACOES },
    { tipo: 'opcoes', nome: 'appearance', opcoes: APARENCIAS },
  ],
  renderizar: (valores, registrar) => (
    <BarraDoBloco
      appearance={valores.appearance as ToolbarAppearance}
      label={valores.label}
      orientation={valores.orientation as ToolbarOrientation}
      registrar={(acao) => registrar(`onClick: ${acao}`)}
    />
  ),
  codigo: (valores) =>
    gerarJsx(
      'Toolbar',
      [
        ['label', valores.label],
        ['orientation', valores.orientation, 'horizontal'],
        ['appearance', valores.appearance, 'floating'],
      ],
      [
        '<Toolbar.Group>',
        '  <ButtonIcon icon={<IconBold />} label="Negrito" aria-pressed={negrito} size="sm" variant="ghost" />',
        '  <ButtonIcon icon={<IconItalic />} label="Itálico" aria-pressed={italico} size="sm" variant="ghost" />',
        '  <ButtonIcon icon={<IconLink />} label="Link" size="sm" variant="ghost" />',
        '</Toolbar.Group>',
        '<Toolbar.Group label="Alinhamento">',
        '  <ButtonIcon icon={<IconAlignLeft />} label="Alinhar à esquerda" aria-pressed size="sm" variant="ghost" />',
        '  …',
        '</Toolbar.Group>',
        '<Toolbar.Group>',
        '  <Menu label="Mais formatação" items={mais}>',
        '    <ButtonIcon icon={<IconMore />} label="Mais formatação" size="sm" variant="ghost" />',
        '  </Menu>',
        '</Toolbar.Group>',
      ].join('\n'),
    ),
  verificar: (valores) => {
    const nome = valores.label.trim();
    const verificacoes: Verificacao[] = [
      nome
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${nome}", no aria-label da barra.` }
        : { nivel: 'falha', titulo: 'Barra sem nome', detalhe: 'label é obrigatório: o leitor de tela anuncia a barra por ele.' },
      {
        nivel: 'ok',
        titulo: 'Uma parada de Tab',
        detalhe: `As setas ${valores.orientation === 'vertical' ? 'para cima e para baixo' : 'para os lados'} percorrem os itens.`,
      },
    ];

    return verificacoes;
  },
});

const PARAGRAFOS = [
  'A barra aparece sobre o parágrafo em que o cursor está, sem tirá-lo do texto.',
  'Clique em outro parágrafo: a barra acompanha. Os botões não roubam o foco ao clique.',
  'Pelo teclado, o produto leva o foco à barra com um atalho, como Alt+F10, focando a própria barra.',
];

function EditorComBarraAncorada() {
  const ancora = useRef<HTMLElement | null>(null);
  const barra = useRef<HTMLDivElement>(null);
  const [selecionado, setSelecionado] = useState<number>();

  return (
    <div className="demo-box stack" style={{ width: '100%', paddingTop: 64 }}>
      {PARAGRAFOS.map((texto, indice) => (
        <p
          contentEditable
          key={texto}
          onFocus={(evento) => {
            ancora.current = evento.currentTarget;
            setSelecionado(indice);
          }}
          onKeyDown={(evento) => {
            if (evento.altKey && evento.key === 'F10') {
              evento.preventDefault();
              barra.current?.focus();
            }
          }}
          style={{ margin: 0 }}
          suppressContentEditableWarning
        >
          {texto}
        </p>
      ))}
      {selecionado !== undefined && (
        <Toolbar anchorRef={ancora} label="Bloco" onMouseDown={segurarOFoco} placement="top start" ref={barra}>
          <Toolbar.Group>
            <ButtonIcon icon={NEGRITO} label="Negrito" size="sm" variant="ghost" />
            <ButtonIcon icon={ITALICO} label="Itálico" size="sm" variant="ghost" />
            <ButtonIcon icon={<IconLink />} label="Link" size="sm" variant="ghost" />
          </Toolbar.Group>
          <Toolbar.Group label="Alinhamento">
            {ALINHAMENTOS.map((item) => (
              <ButtonIcon icon={item.icone} key={item.chave} label={item.rotulo} size="sm" variant="ghost" />
            ))}
          </Toolbar.Group>
        </Toolbar>
      )}
    </div>
  );
}

function BarraDeAcoesFixa() {
  return (
    <div style={{ width: '100%', maxHeight: 180, overflowY: 'auto', border: '1px solid var(--pl-color-border)', borderRadius: 8 }}>
      <Toolbar appearance="flat" label="Ações dos pedidos" sticky style={{ display: 'flex', padding: 8 }}>
        <Toolbar.Group>
          <Button size="sm">
            <IconPlus />
            Novo pedido
          </Button>
          <Button size="sm" variant="secondary">
            <IconUpload />
            Importar
          </Button>
        </Toolbar.Group>
        <Toolbar.Group>
          <ButtonIcon icon={<IconTrash />} label="Excluir selecionados" size="sm" variant="ghost" />
        </Toolbar.Group>
      </Toolbar>
      <ul style={{ margin: 0, padding: '8px 24px' }}>
        {Array.from({ length: 12 }, (_, indice) => (
          <li key={indice} style={{ padding: '6px 0' }}>Pedido {4810 + indice}</li>
        ))}
      </ul>
    </div>
  );
}

function Variantes() {
  return (
    <div className="matrix">
      <div className="matrix-row matrix-head">
        <span>appearance</span>
        {ORIENTACOES.map((orientacao) => (
          <span key={orientacao}>{orientacao}</span>
        ))}
      </div>
      {APARENCIAS.map((aparencia) => (
        <div className="matrix-row" key={aparencia}>
          <code>{aparencia}</code>
          {ORIENTACOES.map((orientacao) => (
            <span key={orientacao}>
              <Toolbar appearance={aparencia} label={`Alinhamento, ${aparencia}, ${orientacao}`} orientation={orientacao}>
                <Toolbar.Group>
                  <ButtonIcon icon={NEGRITO} label="Negrito" size="sm" variant="ghost" />
                  <ButtonIcon icon={ITALICO} label="Itálico" size="sm" variant="ghost" />
                </Toolbar.Group>
                <Toolbar.Group>
                  <ButtonIcon icon={<IconAlignLeft />} label="Alinhar à esquerda" size="sm" variant="ghost" />
                  <ButtonIcon icon={<IconAlignCenter />} label="Centralizar" size="sm" variant="ghost" />
                </Toolbar.Group>
              </Toolbar>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Foco itinerante</dt>
      <dd>
        A barra é uma só parada de Tab. Ela descobre os itens focáveis dentro dela, desabilitados de fora, e marca o
        <code> tabindex</code>: o item ativo fica em 0, os demais em -1. Voltar à barra devolve o foco ao último item usado.
      </dd>
      <dt>Setas que já têm dono</dt>
      <dd>
        Um item que trata a seta, com <code>preventDefault</code>, fica com ela. Campos de texto e listas nativas também: neles
        a seta move o cursor, e não a barra.
      </dd>
      <dt><code>anchorRef</code> e <code>placement</code></dt>
      <dd>
        A barra flutua num portal, ancorada ao elemento, como camada de cima. Não puxa o foco ao aparecer: o cursor segue no
        texto. Para o clique também não tirá-lo, o produto passa <code>onMouseDown</code> com <code>preventDefault</code>.
        Para o teclado, o produto foca a própria barra, por <code>ref</code>, e o foco vai ao item ativo.
      </dd>
      <dt><code>sticky</code></dt>
      <dd>Sem âncora, a barra fica no fluxo e pode grudar no topo da área que rola.</dd>
      <dt>Botão que alterna</dt>
      <dd>
        Com <code>aria-pressed</code>, o botão mostra o estado ligado dentro da barra, como o negrito ou o alinhamento atual.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Barra do bloco de um editor',
      descricao: 'Formatação, alinhamento e mais opções, em grupos com divisor. Setas percorrem; Tab sai da barra.',
      Previa: () => <BarraDoBloco />,
      codigo:
        '<Toolbar label="Bloco">\n  <Toolbar.Group>\n    <ButtonIcon icon={<IconBold />} label="Negrito" aria-pressed={negrito} size="sm" variant="ghost" />\n    <ButtonIcon icon={<IconItalic />} label="Itálico" aria-pressed={italico} size="sm" variant="ghost" />\n    <ButtonIcon icon={<IconLink />} label="Link" size="sm" variant="ghost" />\n  </Toolbar.Group>\n  <Toolbar.Group label="Alinhamento">\n    <ButtonIcon icon={<IconAlignLeft />} label="Alinhar à esquerda" aria-pressed size="sm" variant="ghost" />\n    <ButtonIcon icon={<IconAlignCenter />} label="Centralizar" size="sm" variant="ghost" />\n    <ButtonIcon icon={<IconAlignRight />} label="Alinhar à direita" size="sm" variant="ghost" />\n  </Toolbar.Group>\n  <Toolbar.Group>\n    <Menu label="Mais formatação" items={mais}>\n      <ButtonIcon icon={<IconMore />} label="Mais formatação" size="sm" variant="ghost" />\n    </Menu>\n  </Toolbar.Group>\n</Toolbar>',
    },
    {
      titulo: 'Ancorada ao parágrafo selecionado',
      descricao: 'Clique num parágrafo: a barra aparece sobre ele e o cursor continua no texto. Alt+F10 leva o foco à barra.',
      Previa: EditorComBarraAncorada,
      codigo:
        'const ancora = useRef<HTMLElement | null>(null);\nconst barra = useRef<HTMLDivElement>(null);\n\n<p contentEditable onFocus={(e) => (ancora.current = e.currentTarget)}>…</p>\n\n<Toolbar\n  anchorRef={ancora}\n  placement="top start"\n  label="Bloco"\n  ref={barra}\n  onMouseDown={(e) => e.preventDefault()}\n>\n  …\n</Toolbar>\n\n// Alt+F10 no texto: barra.current?.focus()',
    },
    {
      titulo: 'Ações de uma tela, fixas no topo',
      descricao: 'flat e sticky: a barra acompanha a rolagem da lista sem moldura própria.',
      Previa: BarraDeAcoesFixa,
      codigo:
        '<Toolbar appearance="flat" sticky label="Ações dos pedidos">\n  <Toolbar.Group>\n    <Button size="sm"><IconPlus />Novo pedido</Button>\n    <Button size="sm" variant="secondary"><IconUpload />Importar</Button>\n  </Toolbar.Group>\n  <Toolbar.Group>\n    <ButtonIcon icon={<IconTrash />} label="Excluir selecionados" size="sm" variant="ghost" />\n  </Toolbar.Group>\n</Toolbar>',
    },
  ],
  faca: {
    Previa: () => (
      <Toolbar label="Formatação">
        <Toolbar.Group>
          <ButtonIcon icon={NEGRITO} label="Negrito" size="sm" variant="ghost" />
          <ButtonIcon icon={ITALICO} label="Itálico" size="sm" variant="ghost" />
        </Toolbar.Group>
        <Toolbar.Group label="Alinhamento">
          <ButtonIcon icon={<IconAlignLeft />} label="Alinhar à esquerda" size="sm" variant="ghost" />
          <ButtonIcon icon={<IconAlignCenter />} label="Centralizar" size="sm" variant="ghost" />
        </Toolbar.Group>
      </Toolbar>
    ),
    texto: 'Ações do mesmo objeto, agrupadas pelo que fazem. A barra se chama pelo que controla.',
  },
  evite: {
    Previa: () => (
      <Toolbar appearance="flat" label="Navegação">
        <Button size="sm" variant="ghost">Início</Button>
        <Button size="sm" variant="ghost">Pedidos</Button>
        <Button size="sm" variant="ghost">Relatórios</Button>
      </Toolbar>
    ),
    texto: 'Usar a barra para navegar entre páginas. Navegação é Tabs ou links num nav; a barra é para ações.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Entra na barra pelo item ativo e sai dela de uma vez.' },
    { teclas: ['→', '←'], acao: 'Na horizontal, o próximo e o anterior, em círculo.' },
    { teclas: ['↓', '↑'], acao: 'Na vertical, o próximo e o anterior, em círculo.' },
    { teclas: ['Home', 'End'], acao: 'O primeiro e o último item.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona o item focado.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <><code>role=&quot;toolbar&quot;</code> com o <code>label</code> obrigatório.</>, teste: 'Toolbar.test.tsx' },
    { garantia: 'Foco itinerante', como: 'Uma parada de Tab; setas, Home e End movem o foco, pulando desabilitados.', teste: 'Toolbar.test.tsx' },
    { garantia: 'Parada sempre alcançável', como: 'O item ativo que se desabilita passa a parada ao seguinte.', teste: 'Toolbar.test.tsx' },
    { garantia: 'Setas com dono', como: 'Campos de texto e itens que tratam a seta ficam com ela.', teste: 'Toolbar.test.tsx' },
    { garantia: 'Foco preservado', como: 'A barra ancorada aparece sem tirar o foco de quem o tem.', teste: 'Toolbar.test.tsx' },
    { garantia: 'Camada de cima', como: <>Ancorada, vive no <code>body</code> com <code>data-react-aria-top-layer</code>.</>, teste: 'Toolbar.test.tsx' },
  ],
  notaDaApi:
    'Além destas, as propriedades nativas de <div> e o ref, exceto role e aria-label. Toolbar.Group recebe label?, que nomeia o grupo, e as propriedades nativas de <div>.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Obrigatória. Nome da barra, no aria-label.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Obrigatória. Toolbar.Group, Button, ButtonIcon ou qualquer elemento focável.' },
    { nome: 'orientation', tipo: "'horizontal' | 'vertical'", padrao: "'horizontal'", descricao: 'Direção da barra e das setas que a percorrem.' },
    { nome: 'appearance', tipo: "'floating' | 'flat'", padrao: "'floating'", descricao: 'Cartão com sombra, ou sem moldura.' },
    { nome: 'anchorRef', tipo: 'RefObject<HTMLElement | null>', descricao: 'Ancora a barra flutuante ao elemento, sem tirar o foco dele.' },
    {
      nome: 'placement',
      tipo: "'top' | 'top start' | 'top end' | 'bottom' | 'bottom start' | 'bottom end' | 'left' | 'right'",
      padrao: "'top start'",
      descricao: 'Lado da âncora, com anchorRef.',
    },
    { nome: 'sticky', tipo: 'boolean', padrao: 'false', descricao: 'Gruda no topo da área que rola. Sem anchorRef.' },
  ],
};
