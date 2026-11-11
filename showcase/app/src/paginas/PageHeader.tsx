import type { ComponentPropsWithoutRef } from 'react';
import { Badge, Button, InputText, Menu, PageHeader, IconMore, IconSearch } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const LARGURAS = ['total', '760px', '1120px'] as const;
const ACOES = ['nenhuma', 'principal', 'principal e secundária', 'com menu de mais ações'] as const;

/** Faz o papel do link do roteador: aqui, um href de verdade trocaria a página do Showcase. */
function LinkDaDemonstracao(props: ComponentPropsWithoutRef<'a'>) {
  return <a {...props} onClick={(evento) => evento.preventDefault()} />;
}

const MAIS_ACOES = [
  { key: 'duplicar', label: 'Duplicar pedido' },
  { key: 'exportar', label: 'Exportar em PDF' },
  { key: 'cancelar', label: 'Cancelar pedido', tone: 'danger' as const },
];

function Acoes({ modo, registrar }: { modo: (typeof ACOES)[number]; registrar: (evento: string) => void }) {
  if (modo === 'nenhuma') {
    return null;
  }

  return (
    <PageHeader.Actions>
      {modo === 'com menu de mais ações' && (
        <Menu items={MAIS_ACOES.map((item) => ({ ...item, onSelect: () => registrar(`${item.key}: onSelect`) }))} label="Mais ações">
          <Button aria-label="Mais ações" variant="secondary">
            <IconMore />
          </Button>
        </Menu>
      )}
      {modo !== 'principal' && <Button variant="secondary">Imprimir</Button>}
      <Button onClick={() => registrar('Aprovar: onClick')}>Aprovar pedido</Button>
    </PageHeader.Actions>
  );
}

const playground = definirPlayground({
  inicial: {
    back: true,
    title: 'Pedido 1042',
    badges: true,
    description: 'Itens, entrega e pagamento do pedido de Ana Ribeiro.',
    context: true,
    actions: 'principal e secundária' as (typeof ACOES)[number],
    search: false,
    maxWidth: 'total' as (typeof LARGURAS)[number],
  },
  controles: [
    { tipo: 'booleano', nome: 'back' },
    { tipo: 'texto', nome: 'title' },
    { tipo: 'booleano', nome: 'badges' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'booleano', nome: 'context' },
    { tipo: 'opcoes', nome: 'actions', opcoes: ACOES },
    { tipo: 'booleano', nome: 'search' },
    { tipo: 'opcoes', nome: 'maxWidth', opcoes: LARGURAS },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <PageHeader maxWidth={valores.maxWidth === 'total' ? undefined : valores.maxWidth}>
        {valores.back && <PageHeader.Back as={LinkDaDemonstracao} href="/pedidos" label="Voltar para Pedidos">Pedidos</PageHeader.Back>}
        <PageHeader.Title>{valores.title}</PageHeader.Title>
        {valores.badges && (
          <PageHeader.Badges>
            <Badge tone="success">Pago</Badge>
            <Badge tone="warning">Entrega atrasada</Badge>
          </PageHeader.Badges>
        )}
        {valores.description && <PageHeader.Description>{valores.description}</PageHeader.Description>}
        {valores.context && (
          <PageHeader.Context>
            <span>Criado por Rui Teixeira</span>
            <span>Atualizado há 5 minutos</span>
          </PageHeader.Context>
        )}
        <Acoes modo={valores.actions} registrar={registrar} />
        {valores.search && (
          <PageHeader.Search>
            <InputText aria-label="Buscar nos itens" icon={<IconSearch />} placeholder="Buscar nos itens" />
          </PageHeader.Search>
        )}
      </PageHeader>
    </div>
  ),
  codigo: (valores) => {
    const filhos = [
      valores.back && gerarJsx('PageHeader.Back', [['as', expr('Link')], ['href', '/pedidos'], ['label', 'Voltar para Pedidos']], 'Pedidos'),
      gerarJsx('PageHeader.Title', [], valores.title),
      valores.badges && gerarJsx('PageHeader.Badges', [], '<Badge tone="success">Pago</Badge>'),
      valores.description && gerarJsx('PageHeader.Description', [], valores.description),
      valores.context && gerarJsx('PageHeader.Context', [], '<span>Criado por Rui Teixeira</span>'),
      valores.actions !== 'nenhuma' && gerarJsx('PageHeader.Actions', [], '<Button>Aprovar pedido</Button>'),
      valores.search && gerarJsx('PageHeader.Search', [], '<InputText aria-label="Buscar nos itens" />'),
    ];

    return gerarJsx('PageHeader', [['maxWidth', valores.maxWidth === 'total' ? undefined : valores.maxWidth]], filhos.filter(Boolean).join('\n'));
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Título da página', detalhe: `h1 "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Página sem título', detalhe: 'O h1 vazio deixa a página sem nome para o leitor de tela.' },
    ];

    if (valores.back) {
      verificacoes.push({ nivel: 'ok', titulo: 'Voltar nomeado', detalhe: 'O link mostra a seta e o texto visível; o nome acessível vem de label e contém esse texto.' });
    }

    return verificacoes;
  },
});

const CODIGO_DE_MAIS_DE_DUAS_ACOES = `<PageHeader>
  <PageHeader.Title>Pedido 1042</PageHeader.Title>
  <PageHeader.Actions>
    <Menu label="Mais ações" items={maisAcoes}>
      <Button aria-label="Mais ações" variant="secondary">
        <IconMore />
      </Button>
    </Menu>
    <Button variant="secondary">Imprimir</Button>
    <Button>Aprovar pedido</Button>
  </PageHeader.Actions>
</PageHeader>`;

const CODIGO_DA_LARGURA_ESTREITA = `<PageHeader>
  <PageHeader.Back as={Link} href="/pedidos" label="Voltar para Pedidos">Pedidos</PageHeader.Back>
  <PageHeader.Title>Pedido 1042</PageHeader.Title>
  <PageHeader.Badges>
    <Badge tone="success">Pago</Badge>
  </PageHeader.Badges>
  <PageHeader.Description>Itens, entrega e pagamento do pedido de Ana Ribeiro.</PageHeader.Description>
  <PageHeader.Actions>
    <Button variant="secondary">Imprimir</Button>
    <Button>Aprovar pedido</Button>
  </PageHeader.Actions>
</PageHeader>`;

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Mais de duas ações</h3>
        <PageHeader>
          <PageHeader.Title>Pedido 1042</PageHeader.Title>
          <PageHeader.Actions>
            <Menu items={MAIS_ACOES} label="Mais ações">
              <Button aria-label="Mais ações" variant="secondary">
                <IconMore />
              </Button>
            </Menu>
            <Button variant="secondary">Imprimir</Button>
            <Button>Aprovar pedido</Button>
          </PageHeader.Actions>
        </PageHeader>
        <p className="note">
          A ação principal vai por último, à direita, com até duas secundárias antes dela. O que passar disso cabe num{' '}
          <code>Menu</code> de “Mais ações”. O sistema não impõe o limite; a composição o facilita.
        </p>
        <VerCodigo codigo={CODIGO_DE_MAIS_DE_DUAS_ACOES} />
      </div>
      <div className="subsection">
        <h3>Largura estreita</h3>
        <div style={{ maxWidth: 420 }}>
          <PageHeader>
            <PageHeader.Back as={LinkDaDemonstracao} href="/pedidos" label="Voltar para Pedidos">Pedidos</PageHeader.Back>
            <PageHeader.Title>Pedido 1042</PageHeader.Title>
            <PageHeader.Badges>
              <Badge tone="success">Pago</Badge>
            </PageHeader.Badges>
            <PageHeader.Description>Itens, entrega e pagamento do pedido de Ana Ribeiro.</PageHeader.Description>
            <PageHeader.Actions>
              <Button variant="secondary">Imprimir</Button>
              <Button>Aprovar pedido</Button>
            </PageHeader.Actions>
          </PageHeader>
        </div>
        <p className="note">
          A medida é a do próprio cabeçalho, e não a da janela: abaixo de 640px, as ações e a busca descem para sob o texto.
        </p>
        <VerCodigo codigo={CODIGO_DA_LARGURA_ESTREITA} />
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Detalhe de um registro',
      descricao: 'Voltar, título, selos de situação, contexto e as ações da página.',
      largo: true,
      Previa: () => (
        <div style={{ width: '100%' }}>
        <PageHeader>
          <PageHeader.Back as={LinkDaDemonstracao} href="/pedidos" label="Voltar para Pedidos">Pedidos</PageHeader.Back>
          <PageHeader.Title>Pedido 1042</PageHeader.Title>
          <PageHeader.Badges>
            <Badge tone="success">Pago</Badge>
          </PageHeader.Badges>
          <PageHeader.Context>
            <span>Criado por Rui Teixeira</span>
            <span>Atualizado há 5 minutos</span>
          </PageHeader.Context>
          <PageHeader.Actions>
            <Button variant="secondary">Imprimir</Button>
            <Button>Aprovar pedido</Button>
          </PageHeader.Actions>
        </PageHeader>
        </div>
      ),
      codigo:
        '<PageHeader>\n  <PageHeader.Back as={Link} href="/pedidos" label="Voltar para Pedidos">Pedidos</PageHeader.Back>\n  <PageHeader.Title>Pedido 1042</PageHeader.Title>\n  <PageHeader.Badges>\n    <Badge tone="success">Pago</Badge>\n  </PageHeader.Badges>\n  <PageHeader.Context>\n    <span>Criado por Rui Teixeira</span>\n    <span>Atualizado há 5 minutos</span>\n  </PageHeader.Context>\n  <PageHeader.Actions>\n    <Button variant="secondary">Imprimir</Button>\n    <Button>Aprovar pedido</Button>\n  </PageHeader.Actions>\n</PageHeader>',
    },
    {
      titulo: 'Listagem com busca',
      descricao: 'Título, descrição e a busca no lado direito, na coluna de 1120px.',
      largo: true,
      Previa: () => (
        <div style={{ width: '100%' }}>
        <PageHeader maxWidth="1120px">
          <PageHeader.Title>Clientes</PageHeader.Title>
          <PageHeader.Description>Quem compra, quanto e desde quando.</PageHeader.Description>
          <PageHeader.Search>
            <InputText aria-label="Buscar clientes" icon={<IconSearch />} placeholder="Buscar clientes" />
          </PageHeader.Search>
        </PageHeader>
        </div>
      ),
      codigo:
        '<PageHeader maxWidth="1120px">\n  <PageHeader.Title>Clientes</PageHeader.Title>\n  <PageHeader.Description>Quem compra, quanto e desde quando.</PageHeader.Description>\n  <PageHeader.Search>\n    <InputText aria-label="Buscar clientes" icon={<IconSearch />} />\n  </PageHeader.Search>\n</PageHeader>',
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Título da página', como: <><code>PageHeader.Title</code> é o <code>h1</code>.</>, teste: 'PageHeader.test.tsx' },
    { garantia: 'Voltar é link', como: <>Um <code>a</code> nomeado por <code>label</code>; <code>as</code> e <code>linkProps</code> chegam ao link da aplicação.</>, teste: 'PageHeader.test.tsx' },
    { garantia: 'Largura da coluna', como: <><code>maxWidth</code> alinha o texto à coluna do conteúdo; a linha continua de borda a borda.</>, teste: 'PageHeader.test.tsx' },
  ],
  notaDaApi: (
    <>
      As partes são <code>PageHeader.Back</code>, <code>Title</code>, <code>Badges</code>, <code>Description</code>,{' '}
      <code>Context</code>, <code>Actions</code> e <code>Search</code>, em qualquer ordem: a posição vem da grade, não da
      ordem. Cada uma recebe as propriedades nativas do seu elemento e o ref. O fixar ou compactar ao rolar é do produto.
    </>
  ),
  api: [
    { nome: 'maxWidth', tipo: 'CSSProperties["maxWidth"]', descricao: <>Largura da coluna do texto, para acompanhar a do conteúdo (<code>760px</code>, <code>1120px</code>). Sem ela, usa a largura toda.</> },
    { nome: 'PageHeader.Back', tipo: 'children?: ReactNode; label: string; as?: ElementType; linkProps?: Record<string, unknown>', descricao: 'Link de voltar acima do título, com a seta e o texto visível (children; sem eles, o label). O label é o nome acessível e deve conter o texto visível, como children "Pedidos" e label "Voltar para Pedidos".' },
    { nome: 'PageHeader.Title', tipo: "ComponentPropsWithRef<'h1'>", descricao: 'O título da página.' },
    { nome: 'PageHeader.Badges', tipo: "ComponentPropsWithRef<'div'>", descricao: <>Selos de situação ao lado do título, por exemplo <code>Badge</code>.</> },
    { nome: 'PageHeader.Description', tipo: "ComponentPropsWithRef<'p'>", descricao: 'Descrição, na largura toda.' },
    { nome: 'PageHeader.Context', tipo: "ComponentPropsWithRef<'div'>", descricao: 'Linha de contexto sob a descrição.' },
    { nome: 'PageHeader.Actions', tipo: "ComponentPropsWithRef<'div'>", descricao: 'Ações à direita; a principal por último.' },
    { nome: 'PageHeader.Search', tipo: "ComponentPropsWithRef<'div'>", descricao: 'Espaço da busca, à direita. O campo é do produto.' },
  ],
};
