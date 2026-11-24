import type { ComponentPropsWithoutRef, MouseEvent } from 'react';
import { Breadcrumb, type BreadcrumbItem } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

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
  inicial: { profundidade: 4, label: 'Trilha de navegação', compact: false },
  controles: [
    { tipo: 'numero', nome: 'profundidade', min: 1, max: CAMINHO.length },
    { tipo: 'texto', nome: 'label' },
    { tipo: 'booleano', nome: 'compact' },
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
      compact={valores.compact}
      label={valores.label}
    />
  ),
  codigo: (valores) =>
    gerarJsx('Breadcrumb', [
      ['items', expr('trilha')],
      ['compact', valores.compact, false],
      ['label', valores.label, 'Trilha de navegação'],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Navegação nomeada', detalhe: `<nav aria-label="${valores.label.trim()}">.` }
        : { nivel: 'falha', titulo: 'Navegação sem nome', detalhe: 'Com label vazio, a região não se distingue das outras <nav>.' },
      { nivel: 'ok', titulo: 'Página atual', detalhe: 'O último item não é link e leva aria-current="page".' },
    ];

    if (valores.compact && valores.profundidade > 2) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Trilha inteira no leitor de tela',
        detalhe: 'O botão "…" tem no nome os níveis recolhidos, e o menu que ele abre leva a cada um.',
      });
    }

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
          Um item do meio sem <code>href</code> nem <code>linkProps</code> vira texto da trilha, na cor secundária e sem o
          peso da página atual: uma seção que não tem página própria. Só o último nível tem o destaque de atual.
        </p>
        <VerCodigo
          codigo={`<Breadcrumb
  as={Link}
  items={[{ label: 'Início', href: '/' }, { label: 'Relatórios' }, { label: 'Fechamento de março' }]}
/>`}
        />
      </div>
      <div className="subsection">
        <h3>Compacta</h3>
        <div style={{ maxWidth: 360 }}>
          <Breadcrumb as={LinkDaDemonstracao} compact items={[...CAMINHO, { label: 'Item 3 de um pedido com descrição comprida' }]} />
        </div>
        <p className="note">
          Para a barra estreita: o primeiro nível, os intermediários num botão "…" que abre um menu com eles, e o último
          cortado com reticências. O nome do botão traz os níveis recolhidos, e o leitor de tela ouve a trilha inteira.
        </p>
        <VerCodigo codigo={`<Breadcrumb as={Link} compact items={trilha} />`} />
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
    { teclas: ['Enter', 'Espaço'], acao: 'No botão "…" da trilha compacta, abre o menu dos níveis recolhidos.' },
    { teclas: ['↓', '↑'], acao: 'No menu dos níveis, passa de um nível ao outro; Enter segue o link do nível.' },
  ],
  garantias: [
    { garantia: 'Região nomeada', como: <><code>&lt;nav&gt;</code> com <code>aria-label</code> e a trilha numa lista ordenada.</>, teste: 'Breadcrumb.test.tsx' },
    {
      garantia: 'Página atual',
      como: <>O último item não vira link e leva <code>aria-current=&quot;page&quot;</code>.</>,
      teste: 'Breadcrumb.test.tsx',
    },
    { garantia: 'Link da aplicação', como: <><code>as</code> e <code>linkProps</code> chegam ao link, sem roteador embutido.</>, teste: 'Breadcrumb.test.tsx' },
    {
      garantia: 'Só o último é atual',
      como: <>O nível do meio sem destino é texto da trilha, sem <code>aria-current</code> nem o peso de atual.</>,
      teste: 'Breadcrumb.test.tsx',
    },
    {
      garantia: 'Trilha compacta inteira',
      como: <>Continua <code>&lt;nav&gt;</code> com <code>&lt;ol&gt;</code>; o botão "…" diz no nome os níveis recolhidos e abre um <code>Menu</code> com eles.</>,
      teste: 'Breadcrumb.test.tsx',
    },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <nav> e o ref.',
  api: [
    { nome: 'items', tipo: 'readonly BreadcrumbItem[]', descricao: <>Cada item: <code>label</code>, <code>href</code> e <code>linkProps</code>.</> },
    { nome: 'as', tipo: 'ElementType', padrao: "'a'", descricao: 'Componente de link da aplicação.' },
    { nome: 'label', tipo: 'string', padrao: "'Trilha de navegação'", descricao: 'Nome da região de navegação.' },
    { nome: 'compact', tipo: 'boolean', padrao: 'false', descricao: 'Uma linha só: primeiro nível, intermediários num menu "…" e o último com reticências. Vale com três níveis ou mais.' },
    { nome: 'compactLabel', tipo: 'string', padrao: "'Níveis intermediários'", descricao: 'Começo do nome do botão "…", seguido dos níveis recolhidos, e nome do menu.' },
    { nome: 'items[].linkProps', tipo: 'Record<string, unknown>', descricao: <>Entregues inteiras ao link, como <code>to</code>.</> },
  ],
};
