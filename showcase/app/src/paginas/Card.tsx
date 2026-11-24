import { Badge, Button, Card, IconFile, type CardHeadingLevel, type CardSize, type CardTrailingWhenNarrow } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

// Ilustracoes neutras, geradas aqui, para nao depender de rede nem de foto real.
const ilustracao = (fundo: string, forma: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90"><rect width="160" height="90" fill="${fundo}"/>` +
      `<circle cx="58" cy="40" r="18" fill="${forma}"/><path d="M0 90l52-34 30 20 28-18 50 32z" fill="${forma}"/></svg>`,
  );
const IMAGEM_A = ilustracao('#7c9cbf', '#e9eef5');
const IMAGEM_B = ilustracao('#8fb3a0', '#eef5f0');

const NIVEIS = ['1', '2', '3', '4', '5', '6'] as const;
const TAMANHOS = ['md', 'sm'] as const;
const ESTREITO = ['keep', 'wrap', 'hide'] as const;

const playground = definirPlayground({
  inicial: {
    cabecalho: true,
    title: 'Membros da equipe',
    description: 'Gerencie quem tem acesso ao espaço de trabalho.',
    headingLevel: '3',
    size: 'md' as CardSize,
    trailingWhenNarrow: 'keep' as CardTrailingWhenNarrow,
    badge: true,
    trailing: true,
    flush: false,
    rodape: true,
    icon: false,
    href: false,
  },
  controles: [
    { tipo: 'booleano', nome: 'cabecalho' },
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'opcoes', nome: 'headingLevel', opcoes: NIVEIS },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'opcoes', nome: 'trailingWhenNarrow', opcoes: ESTREITO },
    { tipo: 'booleano', nome: 'badge' },
    { tipo: 'booleano', nome: 'trailing' },
    { tipo: 'booleano', nome: 'flush' },
    { tipo: 'booleano', nome: 'rodape' },
    { tipo: 'booleano', nome: 'icon' },
    { tipo: 'booleano', nome: 'href' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <Card size={valores.size}>
        {valores.cabecalho && (
          <Card.Header
            badge={valores.badge ? <Badge>12</Badge> : undefined}
            description={valores.description || undefined}
            headingLevel={Number(valores.headingLevel) as CardHeadingLevel}
            href={valores.href ? '#membros' : undefined}
            icon={valores.icon ? <IconFile /> : undefined}
            linkProps={
              valores.href
                ? {
                    onClick: (evento: { preventDefault: () => void }) => {
                      evento.preventDefault();
                      registrar('título: navegar para #membros');
                    },
                  }
                : undefined
            }
            title={valores.title}
            trailing={valores.trailing ? <Button onClick={() => registrar('Convidar: onClick')} size="sm">Convidar</Button> : undefined}
            trailingWhenNarrow={valores.trailingWhenNarrow}
          />
        )}
        <Card.Body flush={valores.flush}>
          {valores.flush ? <p style={{ margin: 0 }}>Conteúdo encostado nas bordas, como uma tabela.</p> : 'Doze pessoas com acesso, três delas administradoras.'}
        </Card.Body>
        {valores.rodape && (
          <Card.Footer start={<span>Atualizado há 5 minutos</span>}>
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
        ['icon', valores.icon ? expr('<IconFile />') : undefined],
        ['href', valores.href ? '/membros' : undefined],
        ['badge', valores.badge ? expr('<Badge>12</Badge>') : undefined],
        ['trailing', valores.trailing ? expr('<Button size="sm">Convidar</Button>') : undefined],
        ['trailingWhenNarrow', valores.trailingWhenNarrow, 'keep'],
      ]);
    const corpo = gerarJsx('Card.Body', [['flush', valores.flush, false]], 'Conteúdo');
    const rodape = valores.rodape && gerarJsx('Card.Footer', [], '…');

    return gerarJsx('Card', [['size', valores.size, 'md']], [cabecalho, corpo, rodape].filter(Boolean).join('\n'));
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
        <VerCodigo
          codigo={`<Card>
  <Card.Body>Somente conteúdo, sem nome de região.</Card.Body>
</Card>`}
        />
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
        <VerCodigo
          codigo={`<Card>
  <Card.Header title="Arquivos" description="O corpo encosta nas bordas." />
  <Card.Body flush>
    <p>Uma tabela ou uma lista entraria aqui, de borda a borda.</p>
  </Card.Body>
</Card>`}
        />
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
        <VerCodigo
          codigo={`<h4 id="resumo-de-fora">Resumo do mês</h4>
<Card aria-labelledby="resumo-de-fora">
  <Card.Body>Faturamento, conversão e pedidos.</Card.Body>
</Card>`}
        />
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
      titulo: 'Ícone e título que leva à página',
      descricao: 'icon põe um ícone decorativo num ladrilho tonal antes do título; href faz do título um link, e só ele: o cartão não vira clicável.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 360 }}>
          <Card>
            <Card.Header
              description="Últimos 30 dias"
              href="#notas"
              icon={<IconFile />}
              linkProps={{ onClick: (evento: { preventDefault: () => void }) => evento.preventDefault() }}
              title="Notas emitidas"
            />
            <Card.Body>
              <strong style={{ fontSize: 28 }}>128</strong>
            </Card.Body>
          </Card>
        </div>
      ),
      codigo: `<Card>
  <Card.Header
    as={Link}
    icon={<IconFile />}
    linkProps={{ to: '/notas' }}
    title="Notas emitidas"
    description="Últimos 30 dias"
  />
  <Card.Body>
    <strong>128</strong>
  </Card.Body>
</Card>`,
    },
    {
      titulo: 'Imagem no topo',
      descricao: 'Card.Media antes do cabeçalho ocupa a largura toda, em 16:9 por padrão, e cobre a área sem distorcer. Sem src, ou se a imagem falhar, o cartão fica como sem imagem.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 320 }}>
          <Card>
            <Card.Media alt="" src={IMAGEM_A} />
            <Card.Header description="Categoria A" title="Produto A" />
            <Card.Body>Descrição curta do produto, em duas linhas no máximo.</Card.Body>
            <Card.Footer>
              <Button size="sm" variant="secondary">Ver detalhes</Button>
            </Card.Footer>
          </Card>
        </div>
      ),
      codigo:
        `<Card>
  <Card.Media alt="" src={produto.imagem} />
  <Card.Header title="Produto A" description="Categoria A" />
  <Card.Body>Descrição curta do produto, em duas linhas no máximo.</Card.Body>
  <Card.Footer>
    <Button size="sm" variant="secondary">Ver detalhes</Button>
  </Card.Footer>
</Card>`,
    },
    {
      titulo: 'Imagem ao fim, com cabeçalho e rodapé',
      descricao:
        'Com placement="end", a imagem fica ao lado de uma coluna com o cabeçalho, o corpo e o rodapé, que continuam empilhados. O rodapé fica na largura da coluna, e em dir="rtl" a imagem vai para a esquerda. --pl-card-media-size troca a largura.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Card>
            <Card.Header description="Categoria B" title="Produto B" />
            <Card.Body>Descrição curta, ao lado da imagem quadrada.</Card.Body>
            <Card.Footer start={<span>Atualizado há 5 minutos</span>}>
              <Button size="sm" variant="secondary">Editar</Button>
            </Card.Footer>
            <Card.Media alt="" placement="end" src={IMAGEM_B} />
          </Card>
        </div>
      ),
      codigo:
        `<Card>
  <Card.Header title="Produto B" description="Categoria B" />
  <Card.Body>Descrição curta, ao lado da imagem quadrada.</Card.Body>
  <Card.Footer start={<span>Atualizado há 5 minutos</span>}>
    <Button size="sm" variant="secondary">Editar</Button>
  </Card.Footer>
  <Card.Media alt="" placement="end" src={produto.imagem} />
</Card>`,
    },
    {
      titulo: 'Ganchos de folha',
      descricao: 'O produto define --pl-sheet-shadow, --pl-sheet-radius e --pl-sheet-border num ancestral, e os cartões, a grade, a folha da página e o trilho os seguem.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 360, ['--pl-sheet-shadow' as string]: 'none', ['--pl-sheet-radius' as string]: '12px' }}>
          <Card>
            <Card.Header title="Sem sombra, canto maior" />
            <Card.Body>Mesmo cartão, com os ganchos definidos no envoltório.</Card.Body>
          </Card>
        </div>
      ),
      codigo: `<div style={{ '--pl-sheet-shadow': 'none', '--pl-sheet-radius': '12px' }}>
  <Card>…</Card>
</div>`,
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
    {
      titulo: 'Cartão compacto, com a descrição sob o título',
      descricao: 'Em size="sm", a descrição fica logo abaixo do título, na coluna dele, com o trailing ao lado. Se o trailing descer de linha, desce abaixo da descrição.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 360 }}>
          <Card size="sm">
            <Card.Header
              description="Comparado ao mês anterior"
              title="Valor total de compras"
              trailing={<Badge tone="success">+14,6%</Badge>}
              trailingWhenNarrow="wrap"
            />
            <Card.Body>
              <strong style={{ fontSize: 24 }}>R$ 18.420,00</strong>
            </Card.Body>
          </Card>
        </div>
      ),
      codigo:
        '<Card size="sm">\n  <Card.Header\n    title="Valor total de compras"\n    description="Comparado ao mês anterior"\n    trailing={<Badge tone="success">+14,6%</Badge>}\n    trailingWhenNarrow="wrap"\n  />\n  <Card.Body>\n    <strong>R$ 18.420,00</strong>\n  </Card.Body>\n</Card>',
    },
    {
      titulo: 'Rodapé com uma ação só',
      descricao: 'Com um filho só, o rodapé o leva ao fim da linha, como as ações do Dialog. Com dois ou mais, ficam nas pontas.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 360 }}>
          <Card>
            <Card.Header title="Pedidos recentes" />
            <Card.Body>Doze pedidos nos últimos sete dias.</Card.Body>
            <Card.Footer>
              <Button size="sm" variant="secondary">Ver todos</Button>
            </Card.Footer>
          </Card>
        </div>
      ),
      codigo:
        '<Card>\n  <Card.Header title="Pedidos recentes" />\n  <Card.Body>Doze pedidos nos últimos sete dias.</Card.Body>\n  <Card.Footer>\n    <Button size="sm" variant="secondary">Ver todos</Button>\n  </Card.Footer>\n</Card>',
    },
    {
      titulo: 'Rodapé com conteúdo à esquerda',
      descricao: 'O start leva uma ação ou a situação para a esquerda; os filhos ficam juntos, à direita.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Card>
            <Card.Header title="Conciliação" />
            <Card.Body>Confira os lançamentos do período antes de concluir.</Card.Body>
            <Card.Footer start={<Button size="sm" variant="ghost">Salvar e sair</Button>}>
              <Button size="sm" variant="secondary">Voltar</Button>
              <Button size="sm">Próximo</Button>
            </Card.Footer>
          </Card>
        </div>
      ),
      codigo:
        '<Card>\n  <Card.Header title="Conciliação" />\n  <Card.Body>Confira os lançamentos do período antes de concluir.</Card.Body>\n  <Card.Footer start={<Button size="sm" variant="ghost">Salvar e sair</Button>}>\n    <Button size="sm" variant="secondary">Voltar</Button>\n    <Button size="sm">Próximo</Button>\n  </Card.Footer>\n</Card>',
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Região nomeada', como: <>O <code>section</code> é nomeado pelo título do cabeçalho, em <code>h3</code> por padrão.</>, teste: 'Card.test.tsx' },
    { garantia: 'Sem nome inventado', como: 'Sem cabeçalho, não há região; se ele sair, o nome sai junto.', teste: 'Card.test.tsx' },
    { garantia: 'Nome de fora', como: <>O <code>aria-labelledby</code> do consumidor prevalece.</>, teste: 'Card.test.tsx' },
    { garantia: 'Nível de título', como: <><code>headingLevel</code> escolhe de h2 a h6.</>, teste: 'Card.test.tsx' },
    { garantia: 'Imagem sem buraco', como: <>Sem <code>src</code>, ou se a imagem falhar, inclusive antes da hidratação, o <code>Card.Media</code> não é desenhado.</>, teste: 'CardMedia.test.tsx' },
    { garantia: 'Imagem ao fim', como: 'Cabeçalho, corpo e rodapé ficam empilhados numa coluna, ao lado da imagem.', teste: 'CardMedia.test.tsx' },
    { garantia: 'Rodapé com start', como: <>O <code>start</code> fica à esquerda e os filhos num bloco à direita; sem ele, os filhos seguem diretos no rodapé, e o filho único vai ao fim.</>, teste: 'Card.test.tsx' },
  ],
  notaDaApi:
    'O Card e cada parte aceitam as propriedades nativas do próprio elemento, o ref e a className. As partes só existem dentro do Card.',
  api: [
    { nome: 'Card children', tipo: 'ReactNode', descricao: 'Obrigatório. As partes do cartão.' },
    { nome: 'Card aria-labelledby', tipo: 'string', descricao: 'Nome vindo de fora; vence o título do cabeçalho.' },
    {
      nome: 'Card size',
      tipo: "'md' | 'sm'",
      padrao: "'md'",
      descricao: 'sm: menos respiro, título até a terceira linha, descrição até a segunda, abaixo do título.',
    },
    { nome: 'Card.Header title', tipo: 'string', descricao: 'Obrigatório. Título e nome da região.' },
    { nome: 'Card.Header description', tipo: 'ReactNode', descricao: 'Texto de apoio abaixo do título.' },
    { nome: 'Card.Header badge', tipo: 'ReactNode', descricao: 'Ao lado do título, como uma contagem.' },
    { nome: 'Card.Header trailing', tipo: 'ReactNode', descricao: 'À direita do cabeçalho, como uma ação.' },
    { nome: 'Card.Header headingLevel', tipo: '1 | 2 | 3 | 4 | 5 | 6', padrao: '3', descricao: 'Nível do título; o 1 serve ao cartão que é a própria página.' },
    { nome: 'Card.Header icon', tipo: 'ReactNode', descricao: 'Ícone decorativo num ladrilho tonal de 28px, à esquerda do título; fora do nome.' },
    { nome: 'Card.Header href', tipo: 'string', descricao: 'Faz do título um link; o cartão inteiro não vira clicável.' },
    { nome: 'Card.Header as', tipo: 'ElementType', padrao: "'a'", descricao: 'Componente de link da aplicação para o título.' },
    { nome: 'Card.Header linkProps', tipo: 'Record<string, unknown>', descricao: <>Entregues inteiras ao link do título, como <code>to</code>.</> },
    { nome: '--card-gap', tipo: 'variável CSS', padrao: '24px, ou 16px no sm', descricao: 'Respiro interno do cartão; redefinido no próprio cartão, pelo style ou por uma classe mais específica.' },
    {
      nome: 'Card.Header trailingWhenNarrow',
      tipo: "'keep' | 'wrap' | 'hide'",
      padrao: "'keep'",
      descricao:
        'O trailing que não cabe ao lado do título numa linha: keep o mantém ao lado, wrap o desce, hide o esconde também do leitor de tela e do Tab, e por isso serve só a informação repetida, nunca a única via de uma ação.',
    },
    { nome: 'Card.Body children', tipo: 'ReactNode', descricao: 'Obrigatório. O conteúdo.' },
    { nome: 'Card.Body flush', tipo: 'boolean', padrao: 'false', descricao: 'Encosta o conteúdo nas bordas.' },
    { nome: 'Card.Footer start', tipo: 'ReactNode', descricao: 'Conteúdo à esquerda do rodapé, como uma ação secundária ou a situação do salvamento. Os filhos ficam à direita.' },
    { nome: 'Card.Media alt', tipo: 'string', descricao: 'Obrigatório. Vazio quando a imagem só ilustra o texto ao lado.' },
    { nome: 'Card.Media src', tipo: 'string | null', descricao: 'Endereço da imagem. Sem ele, ou se a imagem falhar, o Card.Media não é desenhado.' },
    {
      nome: 'Card.Media placement',
      tipo: "'top' | 'end'",
      padrao: "'top'",
      descricao: 'top: largura toda, antes do cabeçalho. end: ao lado da coluna com cabeçalho, corpo e rodapé; precisa ser filho direto do Card.',
    },
    { nome: 'Card.Media ratio', tipo: "'1:1' | '4:3' | '16:9'", padrao: "'16:9' no topo, '1:1' ao fim", descricao: 'Proporção da área; a imagem a cobre sem distorcer.' },
    { nome: '--pl-card-media-size', tipo: 'variável CSS', padrao: '88px', descricao: 'Largura da imagem ao fim; o produto a define em qualquer ancestral.' },
    { nome: 'Card.Footer children', tipo: 'ReactNode', descricao: 'Rodapé, com os itens nas pontas; um filho só vai ao fim. Com start, ficam juntos à direita e podem faltar.' },
  ],
};
