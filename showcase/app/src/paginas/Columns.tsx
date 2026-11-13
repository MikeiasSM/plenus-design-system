import { Badge, Card, Columns } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const PARTES = ['coluna lateral', 'índice'] as const;

const pilha = { display: 'grid', gap: 16 } as const;

function CartaoDeTexto({ id, titulo }: { id?: string; titulo: string }) {
  return (
    <Card id={id}>
      <Card.Header headingLevel={3} title={titulo} />
      <Card.Body>Doze pessoas com acesso, três delas administradoras. Cada uma vê só o que a carteira permite.</Card.Body>
    </Card>
  );
}

function ResumoLateral() {
  return (
    <Card>
      <Card.Header badge={<Badge tone="success">Pago</Badge>} headingLevel={3} title="Resumo" />
      <Card.Body>Total de R$ 1.280,00 em 3 itens, com entrega prevista para sexta-feira.</Card.Body>
    </Card>
  );
}

function PrincipalComLateral() {
  return (
    <div style={{ width: '100%' }}>
      <Columns>
        <Columns.Main style={pilha}>
          <CartaoDeTexto titulo="Itens do pedido" />
          <CartaoDeTexto titulo="Entrega" />
        </Columns.Main>
        <Columns.Aside>
          <ResumoLateral />
        </Columns.Aside>
      </Columns>
    </div>
  );
}

function PrincipalComIndice({ prefixo, rotulo }: { prefixo: string; rotulo?: string }) {
  const secoes = [
    { id: `${prefixo}-geral`, label: 'Geral' },
    { id: `${prefixo}-equipe`, label: 'Equipe' },
    { id: `${prefixo}-avisos`, label: 'Avisos' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Columns>
        <Columns.Main style={pilha}>
          {secoes.map(({ id, label }) => (
            <CartaoDeTexto id={id} key={id} titulo={label} />
          ))}
        </Columns.Main>
        <Columns.Index items={secoes} label={rotulo || undefined} />
      </Columns>
    </div>
  );
}

const playground = definirPlayground({
  inicial: {
    parte: 'coluna lateral' as (typeof PARTES)[number],
    label: 'Nesta página',
  },
  controles: [
    { tipo: 'opcoes', nome: 'parte', opcoes: PARTES },
    { tipo: 'texto', nome: 'label' },
  ],
  renderizar: (valores) =>
    valores.parte === 'índice' ? <PrincipalComIndice prefixo="jogo" rotulo={valores.label} /> : <PrincipalComLateral />,
  codigo: (valores) =>
    valores.parte === 'índice'
      ? gerarJsx(
          'Columns',
          [],
          `<Columns.Main>…</Columns.Main>\n${gerarJsx('Columns.Index', [
            ['items', [{ id: 'geral', label: 'Geral' }]],
            ['label', valores.label, 'Nesta página'],
          ])}`,
        )
      : gerarJsx('Columns', [], '<Columns.Main>…</Columns.Main>\n<Columns.Aside>…</Columns.Aside>'),
  verificar: (valores) => {
    if (valores.parte === 'coluna lateral') {
      return [{ nivel: 'ok', titulo: 'Complemento', detalhe: 'O Columns.Aside é um aside, a coluna de complemento do conteúdo.' }] satisfies Verificacao[];
    }

    return [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Índice nomeado', detalhe: `A navegação se chama "${valores.label.trim()}".` }
        : { nivel: 'ok', titulo: 'Nome padrão', detalhe: 'Sem label, a navegação se chama "Nesta página".' },
    ] satisfies Verificacao[];
  },
});

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Duas colunas</h3>
        <PrincipalComLateral />
        <p className="note">
          Com 900px ou mais de largura própria, a coluna lateral ocupa um terço, e o conteúdo principal, dois. 900px é o{' '}
          <code>--pl-bp-sm</code>.
        </p>
        <VerCodigo
          codigo={`<Columns>
  <Columns.Main>
    <Card>…Itens do pedido…</Card>
    <Card>…Entrega…</Card>
  </Columns.Main>
  <Columns.Aside>
    <Card>…Resumo…</Card>
  </Columns.Aside>
</Columns>`}
        />
      </div>
      <div className="subsection">
        <h3>Uma coluna</h3>
        <div style={{ maxWidth: 420 }}>
          <PrincipalComLateral />
        </div>
        <p className="note">
          A medida é a do próprio Columns, e não a da janela: abaixo de 900px, a coluna lateral desce para baixo do conteúdo e o índice some.
        </p>
        <VerCodigo
          codigo={`<Columns>
  <Columns.Main>
    <Card>…Itens do pedido…</Card>
    <Card>…Entrega…</Card>
  </Columns.Main>
  <Columns.Aside>
    <Card>…Resumo…</Card>
  </Columns.Aside>
</Columns>`}
        />
      </div>
      <div className="subsection">
        <h3>Índice acompanhando a rolagem</h3>
        <PrincipalComIndice prefixo="modo" />
        <p className="note">
          O índice acompanha a rolagem do corpo da página, não a da janela: a seção que cruza a linha, um pouco abaixo do topo do índice, fica
          marcada. Em uma coluna, o índice some.
        </p>
        <VerCodigo
          codigo={`<Columns>
  <Columns.Main>
    <Card id="geral">…</Card>
    <Card id="equipe">…</Card>
    <Card id="avisos">…</Card>
  </Columns.Main>
  <Columns.Index items={secoes} />
</Columns>`}
        />
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Coluna lateral',
      descricao: 'Cartões no conteúdo principal e um resumo na coluna de complemento.',
      largo: true,
      Previa: PrincipalComLateral,
      codigo:
        '<Columns>\n  <Columns.Main>\n    <Card>…Itens do pedido…</Card>\n    <Card>…Entrega…</Card>\n  </Columns.Main>\n  <Columns.Aside>\n    <Card>…Resumo…</Card>\n  </Columns.Aside>\n</Columns>',
    },
    {
      titulo: 'Índice da página',
      descricao: 'Seções com id e um índice que leva a cada uma.',
      largo: true,
      Previa: () => <PrincipalComIndice prefixo="exemplo" />,
      codigo:
        "<Columns>\n  <Columns.Main>\n    <Card id=\"geral\">…</Card>\n    <Card id=\"equipe\">…</Card>\n    <Card id=\"avisos\">…</Card>\n  </Columns.Main>\n  <Columns.Index\n    items={[\n      { id: 'geral', label: 'Geral' },\n      { id: 'equipe', label: 'Equipe' },\n      { id: 'avisos', label: 'Avisos' },\n    ]}\n  />\n</Columns>",
    },
  ],
  faca: {
    Previa: PrincipalComLateral,
    texto: 'Uma coluna lateral para o que complementa o conteúdo, como um resumo, ou o índice para uma página longa em seções.',
    codigo: `<Columns>
  <Columns.Main>
    <Card>…Itens do pedido…</Card>
    <Card>…Entrega…</Card>
  </Columns.Main>
  <Columns.Aside>
    <Card>…Resumo…</Card>
  </Columns.Aside>
</Columns>`,
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Columns>
          <Columns.Main style={pilha}>
            <CartaoDeTexto titulo="Itens do pedido" />
          </Columns.Main>
          <Columns.Aside>
            <CartaoDeTexto titulo="Menu da aplicação" />
          </Columns.Aside>
        </Columns>
      </div>
    ),
    texto: (
      <>
        Usar a coluna lateral como navegação da aplicação. Isso é da <code>Sidebar</code>; o <code>Columns</code> arranja o conteúdo da página.
      </>
    ),
    codigo: `<Columns>
  <Columns.Main>
    <Card>…Itens do pedido…</Card>
  </Columns.Main>
  <Columns.Aside>
    <Card>…Menu da aplicação…</Card>
  </Columns.Aside>
</Columns>`,
  },
  Modos,
  teclado: [
    { teclas: ['Tab', 'Shift+Tab'], acao: 'Percorre os links do índice, na ordem das seções.' },
    { teclas: ['Enter'], acao: 'Rola até a seção, leva o foco para ela e não altera o endereço.' },
  ],
  garantias: [
    { garantia: 'Coluna lateral', como: <><code>Columns.Aside</code> é um <code>aside</code>, e <code>Columns.Main</code> leva o conteúdo.</>, teste: 'Columns.test.tsx' },
    { garantia: 'Índice nomeado', como: <>A <code>nav</code> se chama “Nesta página”, ou pelo <code>label</code>.</>, teste: 'Columns.test.tsx' },
    { garantia: 'Links por id', como: <>Cada link aponta para <code>#id</code> da seção; o primeiro começa marcado.</>, teste: 'Columns.test.tsx' },
    { garantia: 'Rolar e focar', como: <>Escolher um link rola até a seção, leva o foco para ela e não altera o endereço.</>, teste: 'Columns.test.tsx' },
    { garantia: 'Menos movimento', como: <>Com <code>prefers-reduced-motion</code>, a rolagem é sem animação.</>, teste: 'Columns.test.tsx' },
    { garantia: 'Seção à vista', como: <>A seção que cruza a linha de referência fica com <code>aria-current</code>.</>, teste: 'Columns.test.tsx' },
  ],
  notaDaApi: (
    <>
      <code>Columns</code> e <code>Columns.Main</code> recebem as propriedades nativas de <code>div</code>; <code>Columns.Aside</code>, as de{' '}
      <code>aside</code>; <code>Columns.Index</code>, as de <code>nav</code>. Todos recebem o ref. Ao lado do <code>Columns.Main</code> vai o{' '}
      <code>Columns.Aside</code> ou o <code>Columns.Index</code>.
    </>
  ),
  api: [
    { nome: 'Columns', tipo: "ComponentPropsWithRef<'div'>", descricao: 'A raiz, que mede a própria largura.' },
    { nome: 'Columns.Main', tipo: "ComponentPropsWithRef<'div'>", descricao: 'O conteúdo principal.' },
    { nome: 'Columns.Aside', tipo: "ComponentPropsWithRef<'aside'>", descricao: 'A coluna de complemento, como um resumo.' },
    { nome: 'Columns.Index', tipo: 'items: readonly ColumnsIndexItem[]; label?: string', descricao: 'O índice da página: um link por seção, pelo id dela.' },
    { nome: 'ColumnsIndexItem', tipo: '{ id: string; label: string }', descricao: 'Uma seção do índice: o id do elemento e o texto do link.' },
    { nome: 'label', tipo: 'string', padrao: "'Nesta página'", descricao: 'Nome visível do índice.' },
  ],
};
