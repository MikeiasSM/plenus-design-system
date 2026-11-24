import { useRef, useState, type ComponentPropsWithoutRef, type MouseEvent } from 'react';
import { Button, IconLightning, IconLink, IconPlus, IconStructure, Tabs, TabsNav, type TabsNavItem } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const SISTEMA: TabsNavItem[] = [
  { key: 'usuarios', label: 'Usuários', href: '/sistema/usuarios' },
  { key: 'papeis', label: 'Papéis', href: '/sistema/papeis' },
  { key: 'tokens', label: 'Tokens', href: '/sistema/tokens' },
  { key: 'alertas', label: 'Alertas', href: '/sistema/alertas' },
  { key: 'auditoria', label: 'Auditoria', href: '/sistema/auditoria' },
];

/** Faz o papel do link do roteador: aqui, um href de verdade trocaria a página do Showcase. */
function LinkDaDemonstracao(props: ComponentPropsWithoutRef<'a'>) {
  return <a {...props} onClick={(evento) => evento.preventDefault()} />;
}

const playground = definirPlayground({
  inicial: { label: 'Sistema', fitted: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'booleano', nome: 'fitted' },
  ],
  renderizar: (valores, registrar) => <SistemaNavegavel fitted={valores.fitted} label={valores.label} registrar={registrar} />,
  codigo: (valores) =>
    gerarJsx('TabsNav', [
      ['as', expr('Link')],
      ['current', expr('atual')],
      ['fitted', valores.fitted, false],
      ['items', expr('abas')],
      ['label', valores.label],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Navegação nomeada', detalhe: `<nav aria-label="${valores.label.trim()}">.` }
        : { nivel: 'falha', titulo: 'Navegação sem nome', detalhe: 'Com label vazio, a região não se distingue das outras <nav>.' },
      { nivel: 'ok', titulo: 'Página atual', detalhe: 'A aba do endereço atual leva aria-current="page".' },
      { nivel: 'ok', titulo: 'Links, não abas', detalhe: 'Sem role="tab": cada aba é um link, e o Tab percorre todas.' },
    ];

    return verificacoes;
  },
});

function SistemaNavegavel({
  fitted,
  label,
  registrar,
}: {
  fitted: boolean;
  label: string;
  registrar: (evento: string) => void;
}) {
  const [atual, setAtual] = useState('papeis');

  return (
    <div style={{ width: '100%' }}>
      <TabsNav
        current={atual}
        fitted={fitted}
        items={SISTEMA.map((aba) => ({
          ...aba,
          linkProps: {
            onClick: (evento: MouseEvent) => {
              evento.preventDefault();
              setAtual(aba.key);
              registrar(`navegar: ${aba.href}`);
            },
          },
        }))}
        label={label}
      />
    </div>
  );
}

const SISTEMA_COM_ICONES: TabsNavItem[] = [
  { key: 'usuarios', label: 'Usuários', href: '/sistema/usuarios', icon: <IconStructure />, count: 48 },
  { key: 'papeis', label: 'Papéis', href: '/sistema/papeis', icon: <IconLink />, count: 6 },
  { key: 'alertas', label: 'Alertas', href: '/sistema/alertas', icon: <IconLightning /> },
];

const SECOES: TabsNavItem[] = [
  { key: 'geral', label: 'Geral', href: '#tabsnav-geral' },
  { key: 'perfil', label: 'Perfil', href: '#tabsnav-perfil' },
  { key: 'avisos', label: 'Avisos', href: '#tabsnav-avisos' },
  { key: 'acesso', label: 'Acesso', href: '#tabsnav-acesso' },
  { key: 'integracoes', label: 'Integrações', href: '#tabsnav-integracoes' },
  { key: 'sobre', label: 'Sobre', href: '#tabsnav-sobre' },
];

/**
 * Uma página de configurações que rola por dentro, como o corpo do AppShell. O Showcase usa o endereço para as rotas,
 * então o clique rola a área à mão em vez de trocar o `#`; a margem que a TabsNav põe na seção vale do mesmo jeito.
 */
function SecoesDaPagina() {
  const areaRef = useRef<HTMLDivElement>(null);

  function irPara(evento: MouseEvent, href: string) {
    evento.preventDefault();
    const area = areaRef.current;
    const secao = document.getElementById(href.slice(1));

    if (!area || !secao) {
      return;
    }

    const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const margem = Number.parseFloat(getComputedStyle(secao).scrollMarginTop) || 0;
    area.scrollTo({ behavior: calmo ? 'auto' : 'smooth', top: secao.offsetTop - margem });
  }

  return (
    <div ref={areaRef} style={{ position: 'relative', width: '100%', maxWidth: 420, height: 280, overflowY: 'auto' }}>
      <TabsNav
        defaultCurrent="geral"
        followScroll
        items={SECOES.map((secao) => ({ ...secao, linkProps: { onClick: (evento: MouseEvent) => irPara(evento, secao.href ?? '') } }))}
        label="Seções das configurações"
      />
      {SECOES.map((secao, indice) => (
        <section id={secao.href?.slice(1)} key={secao.key} style={{ padding: 'var(--pl-space-4) var(--pl-space-3)' }}>
          <h3 style={{ margin: 0 }}>{secao.label}</h3>
          {/* A última é curta de propósito: no fim da rolagem, ela vira a atual mesmo sem chegar à barra. */}
          <p style={{ minHeight: indice === SECOES.length - 1 ? 0 : 160 }}>Opções de exemplo da seção {secao.label}.</p>
        </section>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>current</code></dt>
      <dd>
        A chave da aba do endereço atual. Quem a calcula é a aplicação, a partir da rota. Só com <code>followScroll</code> e
        sem <code>current</code> o componente guarda a aba sozinho.
      </dd>
      <dt><code>as</code> e <code>linkProps</code></dt>
      <dd>
        O link da aplicação: <code>as</code> fica na raiz e vale para todas as abas. Para o roteador que pede <code>to</code>, ele vai em{' '}
        <code>linkProps</code>.
      </dd>
      <dt><code>fitted</code></dt>
      <dd>As abas dividem a largura em partes iguais.</dd>
      <dt><code>appearance</code></dt>
      <dd>
        <code>segmented</code> desenha o trilho do <code>SegmentedControl</code>; continua navegação, com{' '}
        <code>aria-current=&quot;page&quot;</code> na aba atual.
      </dd>
      <dt><code>actions</code></dt>
      <dd>Ficam ao lado das abas, fora da lista de links, com a linha da faixa correndo sob elas.</dd>
      <dt><code>followScroll</code></dt>
      <dd>
        As abas são seções da mesma página (<code>href=&quot;#id&quot;</code>). A barra fica presa ao topo da área que rola e
        a seção atual é a que chegou à borda de baixo dela; no fim da rolagem, a última. Sem <code>current</code>, a barra
        guarda a seção sozinha, a partir de <code>defaultCurrent</code>; com <code>current</code>, atualize-o em{' '}
        <code>onCurrentChange</code>.
      </dd>
      <dt>Muitas abas</dt>
      <dd>A faixa rola de lado, como a das <code>Tabs</code>.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Telas de sistema',
      descricao: 'Cada aba é um endereço: recarregar a página ou abrir em outra guia leva à mesma aba.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <TabsNav as={LinkDaDemonstracao} current="usuarios" items={SISTEMA} label="Sistema" />
        </div>
      ),
      codigo:
        "<TabsNav\n  as={Link}\n  label=\"Sistema\"\n  current={rotaAtual}\n  items={[\n    { key: 'usuarios', label: 'Usuários', linkProps: { to: '/sistema/usuarios' } },\n    { key: 'papeis', label: 'Papéis', linkProps: { to: '/sistema/papeis' } },\n  ]}\n/>",
    },
    {
      titulo: 'Com ícone, contagem e ações',
      descricao: 'O ícone é decorativo; a contagem entra no nome do link, como "Usuários, 48". A ação fica fora da lista.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <TabsNav
            actions={
              <Button size="sm" variant="secondary">
                <IconPlus /> Convidar
              </Button>
            }
            as={LinkDaDemonstracao}
            current="usuarios"
            items={SISTEMA_COM_ICONES}
            label="Sistema"
          />
        </div>
      ),
      codigo: `<TabsNav
  as={Link}
  label="Sistema"
  current={rotaAtual}
  actions={<Button size="sm" variant="secondary">Convidar</Button>}
  items={[
    { key: 'usuarios', label: 'Usuários', icon: <IconStructure />, count: 48, linkProps: { to: '/sistema/usuarios' } },
    { key: 'papeis', label: 'Papéis', icon: <IconLink />, count: 6, linkProps: { to: '/sistema/papeis' } },
  ]}
/>`,
    },
    {
      titulo: 'Seções que a barra acompanha',
      descricao:
        'Com followScroll, a barra fica presa no topo da área que rola e marca a seção que chegou à borda de baixo dela. A aba atual vem para o meio da faixa e leva aria-current="location".',
      Previa: SecoesDaPagina,
      codigo: `<TabsNav
  followScroll
  defaultCurrent="geral"
  label="Seções das configurações"
  items={[
    { key: 'geral', label: 'Geral', href: '#geral' },
    { key: 'perfil', label: 'Perfil', href: '#perfil' },
    { key: 'avisos', label: 'Avisos', href: '#avisos' },
  ]}
/>
<section id="geral">…</section>
<section id="perfil">…</section>
<section id="avisos">…</section>`,
    },
    {
      titulo: 'Segmentado',
      descricao: 'O desenho do SegmentedControl, com a semântica de navegação: a aba atual leva aria-current="page".',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <TabsNav appearance="segmented" as={LinkDaDemonstracao} current="papeis" items={SISTEMA.slice(0, 3)} label="Sistema" />
        </div>
      ),
      codigo: '<TabsNav\n  appearance="segmented"\n  as={Link}\n  label="Sistema"\n  current="papeis"\n  items={abas}\n/>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <TabsNav as={LinkDaDemonstracao} current="papeis" items={SISTEMA.slice(0, 3)} label="Sistema" />
      </div>
    ),
    texto: 'TabsNav quando cada aba é uma página, com endereço próprio.',
    codigo: `<TabsNav
  as={Link}
  label="Sistema"
  current="papeis"
  items={[
    { key: 'usuarios', label: 'Usuários', linkProps: { to: '/sistema/usuarios' } },
    { key: 'papeis', label: 'Papéis', linkProps: { to: '/sistema/papeis' } },
    { key: 'tokens', label: 'Tokens', linkProps: { to: '/sistema/tokens' } },
  ]}
/>`,
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Tabs
          items={SISTEMA.slice(0, 3).map((aba) => ({ key: aba.key, label: aba.label, content: `Tela de ${aba.label}` }))}
          label="Sistema"
        />
      </div>
    ),
    texto: 'Tabs para trocar de página: a aba de painel não muda o endereço, e voltar no navegador sai da tela.',
    codigo: `<Tabs
  label="Sistema"
  items={[
    { key: 'usuarios', label: 'Usuários', content: 'Tela de Usuários' },
    { key: 'papeis', label: 'Papéis', content: 'Tela de Papéis' },
    { key: 'tokens', label: 'Tokens', content: 'Tela de Tokens' },
  ]}
/>`,
  },
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre as abas, uma a uma: são links.' },
    { teclas: ['Enter'], acao: 'Segue o link.' },
  ],
  garantias: [
    { garantia: 'Região nomeada', como: <><code>&lt;nav&gt;</code> com <code>aria-label</code> e os links numa lista.</>, teste: 'TabsNav.test.tsx' },
    { garantia: 'Página atual', como: <>Só a aba atual leva <code>aria-current=&quot;page&quot;</code>.</>, teste: 'TabsNav.test.tsx' },
    { garantia: 'Links, não abas', como: <>Sem <code>role=&quot;tab&quot;</code>, que prometeria setas e painel.</>, teste: 'TabsNav.test.tsx' },
    { garantia: 'Seção atual', como: <>Com <code>followScroll</code>, a aba da seção visível leva <code>aria-current=&quot;location&quot;</code>, medida pela borda da barra.</>, teste: 'TabsNav.test.tsx' },
    { garantia: 'Link da aplicação', como: <><code>as</code> e <code>linkProps</code> chegam ao link, sem roteador embutido.</>, teste: 'TabsNav.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <nav> e o ref.',
  api: [
    { nome: 'items', tipo: 'readonly TabsNavItem[]', descricao: <>Cada aba: <code>key</code>, <code>label</code>, <code>href</code> e <code>linkProps</code>.</> },
    { nome: 'current', tipo: 'string', descricao: 'Chave da aba do endereço atual. Com followScroll, controla a seção atual: atualize-a em onCurrentChange.' },
    { nome: 'defaultCurrent', tipo: 'string', descricao: 'Sem current, a aba atual no início. Por padrão, a primeira.' },
    { nome: 'followScroll', tipo: 'boolean', padrao: 'false', descricao: <>Abas que são seções da página (<code>#id</code>): a barra fica presa e acompanha a rolagem.</> },
    { nome: 'onCurrentChange', tipo: '(key: string) => void', descricao: 'Com followScroll, avisa a seção que virou a atual.' },
    { nome: 'stickyOffset', tipo: 'number', padrao: '0', descricao: <>Altura do que fica preso acima da barra na área que rola; vira o <code>top</code>, e um <code>top</code> em <code>style</code> vence.</> },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatória. Nome da região de navegação.' },
    { nome: 'as', tipo: 'ElementType', padrao: "'a'", descricao: 'Componente de link da aplicação.' },
    { nome: 'fitted', tipo: 'boolean', padrao: 'false', descricao: 'Abas em partes iguais da largura.' },
    { nome: 'appearance', tipo: "'underline' | 'segmented'", padrao: "'underline'", descricao: 'Faixa com traço sob a atual, ou trilho segmentado.' },
    { nome: 'actions', tipo: 'ReactNode', descricao: 'Ações ao lado das abas, fora da lista de links.' },
    { nome: 'items[].icon', tipo: 'ReactNode', descricao: <>Ícone antes do rótulo, com <code>aria-hidden</code>.</> },
    { nome: 'items[].count', tipo: 'number', descricao: 'Selo depois do rótulo; entra no nome como "Rótulo, N".' },
    { nome: 'items[].linkProps', tipo: 'Record<string, unknown>', descricao: <>Entregues ao link, como <code>to</code>. A <code>className</code> soma às da aba, e o <code>aria-current</code> não apaga o da aba atual.</> },
  ],
};
