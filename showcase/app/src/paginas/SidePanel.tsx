import { useState, type ReactNode } from 'react';
import { Button, Checkbox, SidePanel, type SidePanelSide, type SidePanelSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const LADOS = ['right', 'left'] as const;
const TAMANHOS = ['sm', 'md', 'lg'] as const;
const LARGURAS: Record<SidePanelSize, string> = { sm: '240px', md: '272px', lg: '360px' };
const RODAPE = '<Button onClick={aplicar}>Aplicar filtros</Button>';

function Filtros() {
  return (
    <div className="stack">
      <Checkbox defaultChecked label="Somente ativos" />
      <Checkbox label="Com pendência" />
      <Checkbox label="Criados este mês" />
    </div>
  );
}

interface LinhaProps {
  aberto: boolean;
  acao?: string;
  alternar: () => void;
  corpo?: ReactNode;
  gatilho?: string;
  lado: SidePanelSide;
  onOpenChange: (aberto: boolean) => void;
  rodape?: boolean;
  tamanho: SidePanelSize;
  titulo: string;
}

/** A página e o painel lado a lado, numa linha flex: o painel ocupa a largura e a página cede. */
function Linha({
  aberto,
  acao = 'Aplicar filtros',
  alternar,
  corpo = <Filtros />,
  gatilho = 'Filtros',
  lado,
  onOpenChange,
  rodape = true,
  tamanho,
  titulo,
}: LinhaProps) {
  const painel = (
    <SidePanel
      footer={rodape ? <Button onClick={() => onOpenChange(false)}>{acao}</Button> : undefined}
      onOpenChange={onOpenChange}
      open={aberto}
      side={lado}
      size={tamanho}
      title={titulo}
    >
      {corpo}
    </SidePanel>
  );

  return (
    <div
      style={{
        display: 'flex',
        height: 340,
        padding: 6,
        overflow: 'hidden',
        border: '1px solid var(--pl-color-border)',
        borderRadius: 'var(--pl-radius-md)',
        background: 'var(--pl-color-background)',
      }}
    >
      {lado === 'left' && painel}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: 16,
          border: '1px solid var(--pl-color-border)',
          borderRadius: 'var(--pl-radius-md)',
          background: 'var(--pl-color-surface)',
        }}
      >
        <Button aria-expanded={aberto} onClick={alternar} variant="secondary">{gatilho}</Button>
        <p style={{ color: 'var(--pl-color-text-secondary)' }}>A página continua usável com o painel aberto.</p>
      </div>
      {lado === 'right' && painel}
    </div>
  );
}

function PainelDoPlayground({ registrar, valores }: { registrar: (evento: string) => void; valores: Record<string, string | number | boolean> }) {
  const [aberto, setAberto] = useState(true);

  return (
    <Linha
      aberto={aberto}
      alternar={() => setAberto(!aberto)}
      lado={valores.side as SidePanelSide}
      onOpenChange={(valor) => {
        registrar(`onOpenChange: ${valor}`);
        setAberto(valor);
      }}
      rodape={Boolean(valores.rodape)}
      tamanho={valores.size as SidePanelSize}
      titulo={String(valores.title)}
    />
  );
}

const playground = definirPlayground({
  inicial: { title: 'Filtros', side: 'right', size: 'md', rodape: true },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'opcoes', nome: 'side', opcoes: LADOS },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'rodape' },
  ],
  renderizar: (valores, registrar) => <PainelDoPlayground registrar={registrar} valores={valores} />,
  codigo: (valores) =>
    [
      '<Button onClick={alternar}>Filtros</Button>',
      gerarJsx(
        'SidePanel',
        [
          ['open', expr('aberto')],
          ['onOpenChange', expr('setAberto')],
          ['title', valores.title],
          ['side', valores.side, 'right'],
          ['size', valores.size, 'md'],
          ['footer', valores.rodape ? expr(RODAPE) : undefined],
        ],
        '<Checkbox defaultChecked label="Somente ativos" />\n<Checkbox label="Com pendência" />',
      ),
    ].join('\n'),
  verificar: (valores) => {
    const titulo = valores.title.trim();

    return [
      titulo
        ? ({ nivel: 'ok', titulo: 'Região nomeada', detalhe: `"${titulo}", pelo título, ligado por aria-labelledby.` } as Verificacao)
        : ({ nivel: 'falha', titulo: 'Sem título', detalhe: 'O título é o nome da região para o leitor de tela.' } as Verificacao),
      { nivel: 'ok', titulo: 'Não modal', detalhe: 'Sem foco preso nem fundo inerte; fechado, o painel fica inerte.' },
    ];
  },
});

function ExemploDeFiltros() {
  const [aberto, setAberto] = useState(true);

  return <Linha aberto={aberto} alternar={() => setAberto(!aberto)} lado="right" onOpenChange={setAberto} tamanho="md" titulo="Filtros" />;
}

function ExemploAEsquerda() {
  const [aberto, setAberto] = useState(true);

  return <Linha aberto={aberto} alternar={() => setAberto(!aberto)} lado="left" onOpenChange={setAberto} rodape={false} tamanho="sm" titulo="Pastas" />;
}

/** Na coluna estreita do Faça e do Evite não cabem a página e o painel abertos: a prévia começa fechada. */
function FiltrosFechados() {
  const [aberto, setAberto] = useState(false);

  return <Linha aberto={aberto} alternar={() => setAberto(!aberto)} lado="right" onOpenChange={setAberto} tamanho="sm" titulo="Filtros" />;
}

function ConfirmacaoNoPainel() {
  const [aberto, setAberto] = useState(false);

  return (
    <Linha
      aberto={aberto}
      acao="Excluir"
      alternar={() => setAberto(!aberto)}
      corpo={<p>Os 3 clientes selecionados serão excluídos.</p>}
      gatilho="Excluir clientes"
      lado="right"
      onOpenChange={setAberto}
      tamanho="sm"
      titulo="Excluir clientes?"
    />
  );
}

function Variantes() {
  const [tamanho, setTamanho] = useState<SidePanelSize>('md');

  return (
    <div className="stack">
      <div className="subsection">
        <h3>size</h3>
        <div className="demo-row">
          {TAMANHOS.map((valor) => (
            <Button key={valor} onClick={() => setTamanho(valor)} variant={valor === tamanho ? 'primary' : 'secondary'}>
              {valor} · {LARGURAS[valor]}
            </Button>
          ))}
        </div>
      </div>
      <Linha aberto alternar={() => undefined} lado="right" onOpenChange={() => undefined} tamanho={tamanho} titulo="Filtros" />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>open</code>, <code>defaultOpen</code> e <code>onOpenChange</code></dt>
      <dd>
        Controlado, o botão de fechar e o Escape chamam <code>onOpenChange(false)</code> e quem abriu decide. Fechado, o painel sai da largura e fica inerte.
      </dd>
      <dt><code>side</code></dt>
      <dd>O lado da página em que o painel fica. Ele vive numa linha flex, ao lado da página, e a página cede a largura.</dd>
      <dt>Foco</dt>
      <dd>Ao abrir, o foco vai ao painel; ao fechar a partir de dentro, volta a quem abriu. Sem foco preso: a página continua usável.</dd>
      <dt>Celular</dt>
      <dd>Abaixo de 900px não há espaço para empurrar: o painel passa a se comportar como o <code>Drawer</code>.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Filtros ao lado da página',
      descricao: 'À direita, empurrando a página, com as ações no rodapé.',
      largo: true,
      Previa: ExemploDeFiltros,
      codigo:
        '<div style={{ display: \'flex\' }}>\n  <Pagina />\n  <SidePanel\n    open={aberto}\n    onOpenChange={setAberto}\n    title="Filtros"\n    footer={<Button onClick={aplicar}>Aplicar filtros</Button>}\n  >\n    <Checkbox defaultChecked label="Somente ativos" />\n  </SidePanel>\n</div>',
    },
    {
      titulo: 'À esquerda, estreito',
      descricao: 'side="left" e size="sm", sem rodapé.',
      largo: true,
      Previa: ExemploAEsquerda,
      codigo: '<SidePanel open={aberto} onOpenChange={setAberto} side="left" size="sm" title="Pastas">\n  …\n</SidePanel>',
    },
  ],
  faca: {
    Previa: FiltrosFechados,
    texto: 'SidePanel para filtros, detalhes ou ajuda que acompanham a página sem tirar o usuário dela.',
  },
  evite: {
    Previa: ConfirmacaoNoPainel,
    texto: (
      <>
        Uma decisão que precisa de resposta. Quem interrompe o fluxo é <code>Dialog</code>; um painel que bloqueia a página é <code>Drawer</code>.
      </>
    ),
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre o painel e a página: o foco não fica preso.' },
    { teclas: ['Esc'], acao: 'Fecha o painel e devolve o foco a quem abriu.' },
  ],
  garantias: [
    { garantia: 'Região nomeada', como: <>Um <code>aside</code> nomeado pelo título, sem <code>aria-modal</code>.</>, teste: 'SidePanel.test.tsx' },
    { garantia: 'Fechado, inerte', como: 'O painel fechado não recebe foco nem leitura.', teste: 'SidePanel.test.tsx' },
    { garantia: 'Foco', como: 'Vai ao painel ao abrir e volta a quem abriu ao fechar de dentro.', teste: 'SidePanel.test.tsx' },
    { garantia: 'Celular', como: 'Em largura estreita, passa a se comportar como o Drawer.', teste: 'SidePanel.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <aside> e o ref vão ao elemento do painel; o className soma ao do sistema.',
  api: [
    { nome: 'open', tipo: 'boolean', descricao: 'Aberto, no modo controlado.' },
    { nome: 'defaultOpen', tipo: 'boolean', padrao: 'false', descricao: 'Aberto no início, no modo não controlado.' },
    { nome: 'onOpenChange', tipo: '(open: boolean) => void', descricao: 'Recebe false no pedido de fechar: botão de fechar ou Escape.' },
    { nome: 'title', tipo: 'string', descricao: 'Obrigatória. Título visível e nome acessível.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Corpo, que rola quando passa da altura.' },
    { nome: 'footer', tipo: 'ReactNode', descricao: 'Rodapé fixo, com as ações.' },
    { nome: 'side', tipo: "'left' | 'right'", padrao: "'right'", descricao: 'Lado da página em que fica.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Largura de 240, 272 ou 360px.' },
  ],
};
