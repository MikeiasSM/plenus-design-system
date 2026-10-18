import { useState, type ComponentPropsWithoutRef, type MouseEvent } from 'react';
import { Tabs, TabsNav, type TabsNavItem } from '@plenustech/design-system';
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

function Modos() {
  return (
    <dl className="modes">
      <dt><code>current</code></dt>
      <dd>
        A chave da aba do endereço atual. Quem a calcula é a aplicação, a partir da rota: o componente não guarda estado.
      </dd>
      <dt><code>as</code> e <code>linkProps</code></dt>
      <dd>
        O link da aplicação, como no <code>Breadcrumb</code>. Para o roteador que pede <code>to</code>, ele vai em{' '}
        <code>linkProps</code>.
      </dd>
      <dt><code>fitted</code></dt>
      <dd>As abas dividem a largura em partes iguais.</dd>
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
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <TabsNav as={LinkDaDemonstracao} current="papeis" items={SISTEMA.slice(0, 3)} label="Sistema" />
      </div>
    ),
    texto: 'TabsNav quando cada aba é uma página, com endereço próprio.',
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
    { garantia: 'Link da aplicação', como: <><code>as</code> e <code>linkProps</code> chegam ao link, sem roteador embutido.</>, teste: 'TabsNav.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <nav> e o ref.',
  api: [
    { nome: 'items', tipo: 'readonly TabsNavItem[]', descricao: <>Cada aba: <code>key</code>, <code>label</code>, <code>href</code> e <code>linkProps</code>.</> },
    { nome: 'current', tipo: 'string', descricao: 'Obrigatória. Chave da aba do endereço atual.' },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatória. Nome da região de navegação.' },
    { nome: 'as', tipo: 'ElementType', padrao: "'a'", descricao: 'Componente de link da aplicação.' },
    { nome: 'fitted', tipo: 'boolean', padrao: 'false', descricao: 'Abas em partes iguais da largura.' },
    { nome: 'items[].linkProps', tipo: 'Record<string, unknown>', descricao: <>Entregues inteiras ao link, como <code>to</code>.</> },
  ],
};
