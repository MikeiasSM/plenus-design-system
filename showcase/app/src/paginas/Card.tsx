import { Badge, Button, Card, type CardHeadingLevel } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const NIVEIS = ['2', '3', '4', '5', '6'] as const;

const playground = definirPlayground({
  inicial: {
    cabecalho: true,
    title: 'Membros da equipe',
    description: 'Gerencie quem tem acesso ao espaço de trabalho.',
    headingLevel: '3',
    badge: true,
    trailing: true,
    flush: false,
    rodape: true,
  },
  controles: [
    { tipo: 'booleano', nome: 'cabecalho' },
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'opcoes', nome: 'headingLevel', opcoes: NIVEIS },
    { tipo: 'booleano', nome: 'badge' },
    { tipo: 'booleano', nome: 'trailing' },
    { tipo: 'booleano', nome: 'flush' },
    { tipo: 'booleano', nome: 'rodape' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <Card>
        {valores.cabecalho && (
          <Card.Header
            badge={valores.badge ? <Badge>12</Badge> : undefined}
            description={valores.description || undefined}
            headingLevel={Number(valores.headingLevel) as CardHeadingLevel}
            title={valores.title}
            trailing={valores.trailing ? <Button onClick={() => registrar('Convidar: onClick')} size="sm">Convidar</Button> : undefined}
          />
        )}
        <Card.Body flush={valores.flush}>
          {valores.flush ? <p style={{ margin: 0 }}>Conteúdo encostado nas bordas, como uma tabela.</p> : 'Doze pessoas com acesso, três delas administradoras.'}
        </Card.Body>
        {valores.rodape && (
          <Card.Footer>
            <span>Atualizado há 5 minutos</span>
            <Button onClick={() => registrar('Ver todos: onClick')} size="sm" variant="secondary">Ver todos</Button>
          </Card.Footer>
        )}
      </Card>
    </div>
  ),
  codigo: (valores) => {
    const cabecalho =
      valores.cabecalho &&
      gerarJsx('Card.Header', [
        ['title', valores.title],
        ['description', valores.description || undefined],
        ['headingLevel', Number(valores.headingLevel), 3],
        ['badge', valores.badge ? expr('<Badge>12</Badge>') : undefined],
        ['trailing', valores.trailing ? expr('<Button size="sm">Convidar</Button>') : undefined],
      ]);
    const corpo = gerarJsx('Card.Body', [['flush', valores.flush, false]], 'Conteúdo');
    const rodape = valores.rodape && gerarJsx('Card.Footer', [], '…');

    return gerarJsx('Card', [], [cabecalho, corpo, rodape].filter(Boolean).join('\n'));
  },
  verificar: (valores) => {
    const titulo = valores.title.trim();
    const verificacoes: Verificacao[] = [];

    if (!valores.cabecalho) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Sem região nomeada',
        detalhe: 'Sem Card.Header, o section fica sem nome e não vira região. Se houver título fora, use aria-labelledby.',
      });
    } else if (!titulo) {
      verificacoes.push({ nivel: 'falha', titulo: 'Título vazio', detalhe: 'O título nomeia a região e o cabeçalho; vazio, os dois ficam mudos.' });
    } else {
      verificacoes.push({ nivel: 'ok', titulo: 'Região nomeada', detalhe: `"${titulo}", pelo título em h${valores.headingLevel}.` });
    }

    if (valores.cabecalho && valores.headingLevel !== '3') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Nível de título', detalhe: 'Confira se o nível segue a hierarquia dos títulos da página.' });
    }

    return verificacoes;
  },
});

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Sem cabeçalho</h3>
        <Card>
          <Card.Body>Somente conteúdo, sem nome de região.</Card.Body>
        </Card>
        <p className="note">
          O <code>section</code> só ganha <code>aria-labelledby</code> enquanto houver <code>Card.Header</code>. Se o cabeçalho
          sair da tela, o nome sai junto, em vez de apontar para um id que não existe.
        </p>
      </div>
      <div className="subsection">
        <h3>Corpo sem respiro</h3>
        <Card>
          <Card.Header description="O corpo encosta nas bordas." title="Arquivos" />
          <Card.Body flush>
            <p style={{ margin: 0 }}>Uma tabela ou uma lista entraria aqui, de borda a borda.</p>
          </Card.Body>
        </Card>
        <p className="note">
          Com <code>flush</code>, o cabeçalho se separa do corpo por uma linha. É o modo para envolver uma Table, que não desenha
          contorno próprio.
        </p>
      </div>
      <div className="subsection">
        <h3>Nome vindo de fora</h3>
        <h4 id="resumo-de-fora" style={{ margin: 0 }}>Resumo do mês</h4>
        <Card aria-labelledby="resumo-de-fora">
          <Card.Body>Faturamento, conversão e pedidos.</Card.Body>
        </Card>
        <p className="note">
          O <code>aria-labelledby</code> do consumidor vence o título do cabeçalho.
        </p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Indicador',
      descricao: 'Título, descrição e um número no corpo.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <Card>
            <Card.Header description="Últimos 30 dias" title="Faturamento" />
            <Card.Body>
              <strong style={{ fontSize: 28 }}>R$ 63.000,00</strong>
            </Card.Body>
          </Card>
        </div>
      ),
      codigo: '<Card>\n  <Card.Header title="Faturamento" description="Últimos 30 dias" />\n  <Card.Body>\n    <strong>R$ 63.000,00</strong>\n  </Card.Body>\n</Card>',
    },
    {
      titulo: 'Cabeçalho com contagem e ação',
      descricao: 'badge ao lado do título, trailing à direita, e o rodapé para as ações do conjunto.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Card>
            <Card.Header
              badge={<Badge>4</Badge>}
              description="Gerencie quem tem acesso ao espaço de trabalho."
              title="Membros da equipe"
              trailing={<Button size="sm">Convidar</Button>}
            />
            <Card.Body>Ana, Bruno, Célia e Diego.</Card.Body>
            <Card.Footer>
              <span>4 pessoas</span>
              <Button size="sm" variant="secondary">Gerenciar</Button>
            </Card.Footer>
          </Card>
        </div>
      ),
      codigo:
        '<Card>\n  <Card.Header\n    title="Membros da equipe"\n    description="Gerencie quem tem acesso ao espaço de trabalho."\n    badge={<Badge>4</Badge>}\n    trailing={<Button size="sm">Convidar</Button>}\n  />\n  <Card.Body>Ana, Bruno, Célia e Diego.</Card.Body>\n  <Card.Footer>\n    <span>4 pessoas</span>\n    <Button size="sm" variant="secondary">Gerenciar</Button>\n  </Card.Footer>\n</Card>',
    },
    {
      titulo: 'Título de seção da página',
      descricao: 'Quando o cartão abre uma seção logo abaixo do h1, o título sobe para h2.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Card>
            <Card.Header headingLevel={2} title="Resumo" />
            <Card.Body>Três módulos ativos e um pendente.</Card.Body>
          </Card>
        </div>
      ),
      codigo: '<Card>\n  <Card.Header headingLevel={2} title="Resumo" />\n  <Card.Body>Três módulos ativos e um pendente.</Card.Body>\n</Card>',
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Região nomeada', como: <>O <code>section</code> é nomeado pelo título do cabeçalho, em <code>h3</code> por padrão.</>, teste: 'Card.test.tsx' },
    { garantia: 'Sem nome inventado', como: 'Sem cabeçalho, não há região; se ele sair, o nome sai junto.', teste: 'Card.test.tsx' },
    { garantia: 'Nome de fora', como: <>O <code>aria-labelledby</code> do consumidor prevalece.</>, teste: 'Card.test.tsx' },
    { garantia: 'Nível de título', como: <><code>headingLevel</code> escolhe de h2 a h6.</>, teste: 'Card.test.tsx' },
  ],
  notaDaApi: 'O Card aceita as propriedades nativas de <section> e o ref. As partes só existem dentro dele.',
  api: [
    { nome: 'Card children', tipo: 'ReactNode', descricao: 'Obrigatório. As partes do cartão.' },
    { nome: 'Card aria-labelledby', tipo: 'string', descricao: 'Nome vindo de fora; vence o título do cabeçalho.' },
    { nome: 'Card.Header title', tipo: 'string', descricao: 'Obrigatório. Título e nome da região.' },
    { nome: 'Card.Header description', tipo: 'ReactNode', descricao: 'Texto de apoio abaixo do título.' },
    { nome: 'Card.Header badge', tipo: 'ReactNode', descricao: 'Ao lado do título, como uma contagem.' },
    { nome: 'Card.Header trailing', tipo: 'ReactNode', descricao: 'À direita do cabeçalho, como uma ação.' },
    { nome: 'Card.Header headingLevel', tipo: '2 | 3 | 4 | 5 | 6', padrao: '3', descricao: 'Nível do título.' },
    { nome: 'Card.Body children', tipo: 'ReactNode', descricao: 'Obrigatório. O conteúdo.' },
    { nome: 'Card.Body flush', tipo: 'boolean', padrao: 'false', descricao: 'Encosta o conteúdo nas bordas.' },
    { nome: 'Card.Footer children', tipo: 'ReactNode', descricao: 'Obrigatório. Rodapé, com os itens nas pontas.' },
  ],
};
