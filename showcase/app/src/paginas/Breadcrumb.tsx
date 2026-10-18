import type { ComponentPropsWithoutRef, MouseEvent } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const CAMINHO: BreadcrumbItem[] = [
  { label: 'Início', href: '/' },
  { label: 'Módulos', href: '/modulos' },
  { label: 'Faturamento', href: '/modulos/faturamento' },
  { label: 'Nota 4512', href: '/modulos/faturamento/4512' },
  { label: 'Itens', href: '/modulos/faturamento/4512/itens' },
];

/** Faz o papel do link do roteador: aqui, um href de verdade trocaria a página do Showcase. */
function LinkDaDemonstracao(props: ComponentPropsWithoutRef<'a'>) {
  return <a {...props} onClick={(evento) => evento.preventDefault()} />;
}


const playground = definirPlayground({
  inicial: { profundidade: 4, label: 'Trilha de navegação' },
  controles: [
    { tipo: 'numero', nome: 'profundidade', min: 1, max: CAMINHO.length },
    { tipo: 'texto', nome: 'label' },
  ],
  renderizar: (valores, registrar) => (
    <Breadcrumb
      items={CAMINHO.slice(0, valores.profundidade).map((item) => ({
        ...item,
        linkProps: {
          onClick: (evento: MouseEvent) => {
            evento.preventDefault();
            registrar(`navegar: ${item.href}`);
          },
        },
      }))}
      label={valores.label}
    />
  ),
  codigo: (valores) =>
    gerarJsx('Breadcrumb', [
      ['items', expr('trilha')],
      ['label', valores.label, 'Trilha de navegação'],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Navegação nomeada', detalhe: `<nav aria-label="${valores.label.trim()}">.` }
        : { nivel: 'falha', titulo: 'Navegação sem nome', detalhe: 'Com label vazio, a região não se distingue das outras <nav>.' },
      { nivel: 'ok', titulo: 'Página atual', detalhe: 'O último item não é link e leva aria-current="page".' },
    ];

    return verificacoes;
  },
});

function Modos() {
  return (
    <>
      <div className="subsection">
        <h3>Item sem endereço</h3>
        <Breadcrumb
          as={LinkDaDemonstracao}
          items={[{ label: 'Início', href: '/' }, { label: 'Relatórios' }, { label: 'Fechamento de março' }]}
        />
        <p className="note">
          Um item do meio sem <code>href</code> nem <code>linkProps</code> vira texto: uma seção que não tem página
          própria.
        </p>
      </div>
      <div className="subsection">
        <h3>Roteador</h3>
        <p className="note">
          <code>as</code> recebe o componente de link da aplicação, sem acoplar o sistema a um roteador. Para o que pede{' '}
          <code>to</code> em vez de <code>href</code>, <code>linkProps</code> vai inteiro ao link e basta para o item virar
          link.
        </p>
      </div>
    </>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Detalhe de um registro',
      descricao: 'O caminho até a nota; o último item é a página atual.',
      Previa: () => <Breadcrumb as={LinkDaDemonstracao} items={CAMINHO.slice(0, 4)} />,
      codigo:
        "<Breadcrumb\n  as={Link}\n  items={[\n    { label: 'Início', href: '/' },\n    { label: 'Módulos', href: '/modulos' },\n    { label: 'Faturamento', href: '/modulos/faturamento' },\n    { label: 'Nota 4512' },\n  ]}\n/>",
    },
    {
      titulo: 'React Router',
      descricao: 'O Link do React Router pede to: linkProps leva a propriedade inteira.',
      Previa: () => (
        <Breadcrumb
          as={LinkDaDemonstracao}
          items={[{ label: 'Início', linkProps: { href: '/' } }, { label: 'Clientes' }]}
        />
      ),
      codigo: "<Breadcrumb\n  as={Link}\n  items={[{ label: 'Início', linkProps: { to: '/' } }, { label: 'Clientes' }]}\n/>",
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre os links da trilha; o item atual não recebe foco.' },
    { teclas: ['Enter'], acao: 'Segue o link.' },
  ],
  garantias: [
    { garantia: 'Região nomeada', como: <><code>&lt;nav&gt;</code> com <code>aria-label</code> e a trilha numa lista ordenada.</>, teste: 'Breadcrumb.test.tsx' },
    {
      garantia: 'Página atual',
      como: <>O último item não vira link e leva <code>aria-current=&quot;page&quot;</code>.</>,
      teste: 'Breadcrumb.test.tsx',
    },
    { garantia: 'Link da aplicação', como: <><code>as</code> e <code>linkProps</code> chegam ao link, sem roteador embutido.</>, teste: 'Breadcrumb.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <nav> e o ref.',
  api: [
    { nome: 'items', tipo: 'readonly BreadcrumbItem[]', descricao: <>Cada item: <code>label</code>, <code>href</code> e <code>linkProps</code>.</> },
    { nome: 'as', tipo: 'ElementType', padrao: "'a'", descricao: 'Componente de link da aplicação.' },
    { nome: 'label', tipo: 'string', padrao: "'Trilha de navegação'", descricao: 'Nome da região de navegação.' },
    { nome: 'items[].linkProps', tipo: 'Record<string, unknown>', descricao: <>Entregues inteiras ao link, como <code>to</code>.</> },
  ],
};
