import type { ComponentPropsWithoutRef, MouseEvent } from 'react';
import { Badge, Card, IconClock, IconExclamationTriangle, IconFile, LinkList, type LinkListLayout, type LinkListTone } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';

/** Faz o papel do link do roteador: aqui, um href de verdade trocaria a página do Showcase. */
function LinkDaDemonstracao(props: ComponentPropsWithoutRef<'a'>) {
  return <a {...props} onClick={(evento) => evento.preventDefault()} />;
}

const playground = definirPlayground({
  inicial: { layout: 'list', tom: 'neutral', icone: true, descricao: true, complemento: true },
  controles: [
    { tipo: 'opcoes', nome: 'layout', opcoes: ['list', 'grid'] },
    { tipo: 'opcoes', nome: 'tom', opcoes: ['neutral', 'danger'] },
    { tipo: 'booleano', nome: 'icone' },
    { tipo: 'booleano', nome: 'descricao' },
    { tipo: 'booleano', nome: 'complemento' },
  ],
  renderizar: (valores, registrar) => {
    const navegar = (destino: string) => (evento: MouseEvent) => {
      evento.preventDefault();
      registrar(`navegar: ${destino}`);
    };

    return (
      <LinkList aria-label="Destinos" layout={valores.layout as LinkListLayout} style={{ width: '100%' }}>
        <LinkList.Item
          description={valores.descricao ? 'Passaram da data prometida' : undefined}
          href="/pedidos"
          icon={valores.icone ? <IconClock /> : undefined}
          onClick={navegar('/pedidos')}
          title="Pedidos atrasados"
          tone={valores.tom as LinkListTone}
          trailing={valores.complemento ? <Badge tone="danger">4</Badge> : undefined}
        />
        <LinkList.Item
          description={valores.descricao ? 'Extrato de outubro' : undefined}
          href="/conciliacao"
          icon={valores.icone ? <IconFile /> : undefined}
          onClick={navegar('/conciliacao')}
          title="Lançamentos para conciliar"
          trailing={valores.complemento ? <Badge>112</Badge> : undefined}
        />
        <LinkList.Item
          description={valores.descricao ? 'Reponha antes de faltar' : undefined}
          href="/produtos"
          icon={valores.icone ? <IconFile /> : undefined}
          onClick={navegar('/produtos')}
          title="Produtos abaixo do mínimo"
          trailing={valores.complemento ? <Badge>7</Badge> : undefined}
        />
      </LinkList>
    );
  },
  codigo: (valores) =>
    gerarJsx(
      'LinkList',
      [['layout', valores.layout, 'list']],
      gerarJsx('LinkList.Item', [
        ['href', '/pedidos'],
        ['title', 'Pedidos atrasados'],
        ['description', valores.descricao ? 'Passaram da data prometida' : undefined],
        ['tone', valores.tom, 'neutral'],
      ]),
    ),
});

function Modos() {
  return (
    <>
      <div className="subsection">
        <h3>Linhas e grade</h3>
        <div className="stack" style={{ width: '100%' }}>
          <Card>
            <Card.Body flush>
              <LinkList aria-label="Em linhas" as={LinkDaDemonstracao}>
                <LinkList.Item description="Parados na fila do gerente" href="/a" icon={<IconClock />} title="Pedidos aguardando aprovação" trailing={<Badge>3</Badge>} />
                <LinkList.Item description="Extrato de outubro" href="/b" icon={<IconFile />} title="Lançamentos para conciliar" trailing={<Badge>112</Badge>} />
              </LinkList>
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <LinkList aria-label="Em grade" as={LinkDaDemonstracao} layout="grid">
                <LinkList.Item description="Razão social, CNPJ e logotipo" href="/a" title="Dados da empresa" />
                <LinkList.Item description="12 usuários, 4 perfis" href="/b" title="Usuários e permissões" />
                <LinkList.Item description="Matriz e 4 lojas" href="/c" title="Filiais" />
              </LinkList>
            </Card.Body>
          </Card>
        </div>
        <p className="note">
          Em linhas, a seta ao fim e a divisória entre os itens. Em grade, as células se ajustam à largura e não levam seta.
        </p>
      </div>
      <div className="subsection">
        <h3>Tom</h3>
        <Card>
          <Card.Body flush>
            <LinkList aria-label="Tom" as={LinkDaDemonstracao}>
              <LinkList.Item description="Reponha antes de faltar" href="/a" icon={<IconFile />} title="Estoque baixo" />
              <LinkList.Item
                description="Renove para não parar a emissão"
                href="/b"
                icon={<IconExclamationTriangle />}
                title="Certificado digital vence em 18 dias"
                tone="danger"
                trailing={<Badge tone="danger">1</Badge>}
              />
            </LinkList>
          </Card.Body>
        </Card>
        <p className="note">
          <code>tone=&quot;danger&quot;</code> pinta o ícone e a descrição; o nome acessível continua sendo o texto do item.
        </p>
      </div>
    </>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Pendências',
      descricao: 'Cada linha leva à tela onde a pendência se resolve, com a contagem ao fim.',
      largo: true,
      Previa: () => (
        <Card style={{ width: '100%' }}>
          <Card.Header headingLevel={2} title="O que pede ação hoje" />
          <Card.Body flush>
            <LinkList aria-label="Pendências" as={LinkDaDemonstracao}>
              <LinkList.Item description="Parados na fila do gerente" href="/pedidos" icon={<IconClock />} title="Pedidos aguardando aprovação" trailing={<Badge>3</Badge>} />
              <LinkList.Item
                description="Passaram da data prometida"
                href="/atrasados"
                icon={<IconExclamationTriangle />}
                title="Pedidos atrasados"
                tone="danger"
                trailing={<Badge tone="danger">4</Badge>}
              />
              <LinkList.Item description="Extrato de outubro" href="/conciliacao" icon={<IconFile />} title="Lançamentos para conciliar" trailing={<Badge>112</Badge>} />
            </LinkList>
          </Card.Body>
        </Card>
      ),
      codigo:
        '<Card>\n  <Card.Header title="O que pede ação hoje" />\n  <Card.Body flush>\n    <LinkList as={Link} aria-label="Pendências">\n      <LinkList.Item\n        href="/atrasados"\n        icon={<IconExclamationTriangle />}\n        title="Pedidos atrasados"\n        description="Passaram da data prometida"\n        tone="danger"\n        trailing={<Badge tone="danger">4</Badge>}\n      />\n    </LinkList>\n  </Card.Body>\n</Card>',
    },
    {
      titulo: 'Índice de configurações',
      descricao: 'Em grade, cada célula leva a uma configuração e mostra o estado dela.',
      largo: true,
      Previa: () => (
        <Card style={{ width: '100%' }}>
          <Card.Header headingLevel={2} title="Empresa" />
          <Card.Body flush>
            <LinkList aria-label="Empresa" as={LinkDaDemonstracao} layout="grid">
              <LinkList.Item description="Razão social, CNPJ e logotipo" href="/dados" title="Dados da empresa" />
              <LinkList.Item description="12 usuários, 4 perfis" href="/usuarios" title="Usuários e permissões" />
              <LinkList.Item description="Certificado vence em 18 dias" href="/certificado" title="Certificado digital" tone="danger" />
            </LinkList>
          </Card.Body>
        </Card>
      ),
      codigo:
        '<Card>\n  <Card.Header title="Empresa" />\n  <Card.Body flush>\n    <LinkList as={Link} aria-label="Empresa" layout="grid">\n      <LinkList.Item href="/dados" title="Dados da empresa" description="Razão social, CNPJ e logotipo" />\n      <LinkList.Item href="/certificado" title="Certificado digital" description="Certificado vence em 18 dias" tone="danger" />\n    </LinkList>\n  </Card.Body>\n</Card>',
    },
  ],
  faca: {
    Previa: () => (
      <LinkList aria-label="Destinos" as={LinkDaDemonstracao} style={{ width: '100%' }}>
        <LinkList.Item description="Onde cada pendência se resolve" href="/pedidos" title="Pedidos" />
        <LinkList.Item description="Ajustes da empresa" href="/configuracoes" title="Configurações" />
      </LinkList>
    ),
    texto: 'LinkList para os destinos de uma tela: cada item leva a uma página.',
  },
  evite: {
    Previa: () => (
      <LinkList aria-label="Ações" as={LinkDaDemonstracao} style={{ width: '100%' }}>
        <LinkList.Item href="#" title="Excluir pedido" />
        <LinkList.Item href="#" title="Aprovar todos" />
      </LinkList>
    ),
    texto: 'LinkList para escolher itens, que é o papel da List, ou para ações que não navegam, que continuam sendo botão.',
  },
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre os links, um por item.' },
    { teclas: ['Enter'], acao: 'Abre o destino do item em foco.' },
  ],
  garantias: [
    { garantia: 'Item é link', como: <>Cada item é um link com nome e endereço, e o item inteiro é a área de clique.</>, teste: 'LinkList.test.tsx' },
    { garantia: 'Link da aplicação', como: <><code>as</code>, <code>href</code> e <code>linkProps</code> chegam ao link, sem roteador embutido.</>, teste: 'LinkList.test.tsx' },
    { garantia: 'Seta decorativa', como: <>A seta existe só em linhas e fica escondida da acessibilidade.</>, teste: 'LinkList.test.tsx' },
    { garantia: 'Tom sem custo', como: <><code>tone</code> muda a cor, não o nome acessível.</>, teste: 'LinkList.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <ul> e o ref na lista; as de <a> e o ref, no item.',
  api: [
    { nome: 'layout', tipo: "'list' | 'grid'", padrao: "'list'", descricao: 'Linhas com divisória e seta, ou células numa grade que se ajusta à largura.' },
    { nome: 'as', tipo: 'ElementType', padrao: "'a'", descricao: 'Componente de link da aplicação.' },
    { nome: 'LinkList.Item', tipo: 'title: string; href?: string; linkProps?: Record<string, unknown>', descricao: <>Um destino. <code>linkProps</code> vai inteiro ao link, como <code>to</code>.</> },
    { nome: 'description', tipo: 'ReactNode', descricao: 'Explicação abaixo do título.' },
    { nome: 'icon', tipo: 'ReactNode', descricao: 'Ícone no início da linha.' },
    { nome: 'trailing', tipo: 'ReactNode', descricao: 'Complemento ao fim da linha, como uma contagem.' },
    { nome: 'tone', tipo: "'neutral' | 'danger'", padrao: "'neutral'", descricao: 'danger marca o item que pede atenção.' },
  ],
};
