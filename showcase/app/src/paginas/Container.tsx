import type { ReactNode } from 'react';
import { Container, PageHeader } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

function Folha({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: 'var(--pl-color-surface-muted)', borderRadius: 'var(--pl-radius-md)', overflow: 'hidden', width: '100%' }}>
      {children}
    </div>
  );
}

function Conteudo() {
  return (
    <div
      style={{
        background: 'var(--pl-color-primary-container)',
        borderRadius: 'var(--pl-radius-md)',
        color: 'var(--pl-color-on-primary-container)',
        padding: 12,
      }}
    >
      Conteúdo da página
    </div>
  );
}

function Coluna({ maxWidth }: { maxWidth?: number | string }) {
  return (
    <Folha>
      <Container maxWidth={maxWidth}>
        <Conteudo />
      </Container>
    </Folha>
  );
}

function CabecalhoComColuna({ maxWidth }: { maxWidth: number }) {
  return (
    <Folha>
      <PageHeader maxWidth={maxWidth}>
        <PageHeader.Title>Pedidos</PageHeader.Title>
      </PageHeader>
      <Container maxWidth={maxWidth} style={{ paddingBlock: 16 }}>
        <Conteudo />
      </Container>
    </Folha>
  );
}

const playground = definirPlayground({
  inicial: { maxWidth: 480 },
  controles: [{ tipo: 'numero', nome: 'maxWidth', min: 0, max: 1200, passo: 40 }],
  renderizar: (valores) => <Coluna maxWidth={Number(valores.maxWidth) || undefined} />,
  codigo: (valores) => gerarJsx('Container', [['maxWidth', Number(valores.maxWidth) || undefined]], '{conteudo}'),
});

function Variantes() {
  return (
    <div className="subsection">
      <h3>Largura máxima</h3>
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        <Coluna />
        <Coluna maxWidth={600} />
        <Coluna maxWidth="30rem" />
      </div>
      <p className="note">
        Sem <code>maxWidth</code>, usa a largura toda. Com ele, a coluna fica centrada. Número é em px; um texto vale como CSS, como{' '}
        <code>30rem</code>.
      </p>
      <VerCodigo
        codigo={`<Container>
  {conteudo}
</Container>

<Container maxWidth={600}>
  {conteudo}
</Container>

<Container maxWidth="30rem">
  {conteudo}
</Container>`}
      />
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Coluna de leitura',
      descricao: 'O conteúdo numa coluna estreita e centrada.',
      largo: true,
      Previa: () => <Coluna maxWidth={480} />,
      codigo: `<Container maxWidth={480}>
  {conteudo}
</Container>`,
    },
    {
      titulo: 'Alinhado ao cabeçalho',
      descricao: 'O PageHeader e o Container com o mesmo maxWidth têm a mesma borda de conteúdo.',
      largo: true,
      Previa: () => <CabecalhoComColuna maxWidth={480} />,
      codigo: `<PageHeader maxWidth={480}>
  <PageHeader.Title>Pedidos</PageHeader.Title>
</PageHeader>
<Container maxWidth={480}>
  {conteudo}
</Container>`,
    },
  ],
  faca: {
    Previa: () => <CabecalhoComColuna maxWidth={480} />,
    texto: 'O mesmo maxWidth no PageHeader e no Container, para o título e o conteúdo começarem na mesma borda.',
    codigo: `<PageHeader maxWidth={480}>
  <PageHeader.Title>Pedidos</PageHeader.Title>
</PageHeader>
<Container maxWidth={480}>
  {conteudo}
</Container>`,
  },
  evite: {
    Previa: () => (
      <Folha>
        <PageHeader maxWidth={480}>
          <PageHeader.Title>Pedidos</PageHeader.Title>
        </PageHeader>
        <Container maxWidth={800} style={{ paddingBlock: 16 }}>
          <Conteudo />
        </Container>
      </Folha>
    ),
    texto: (
      <>
        Larguras diferentes no <code>PageHeader</code> e no <code>Container</code>: o título e o conteúdo deixam de começar na mesma borda.
      </>
    ),
    codigo: `<PageHeader maxWidth={480}>
  <PageHeader.Title>Pedidos</PageHeader.Title>
</PageHeader>
<Container maxWidth={800}>
  {conteudo}
</Container>`,
  },
  Variantes,
  garantias: [
    { garantia: 'Largura total', como: <>Ocupa a largura do pai, também num pai flex em coluna, como a <code>Stack</code>; sem <code>maxWidth</code>, não tem limite.</>, teste: 'Container.test.tsx' },
    { garantia: 'Largura máxima', como: <>O <code>maxWidth</code> mede o conteúdo, em px quando é número ou como CSS quando é texto; a caixa soma a ele os dois respiros de <code>--pl-space-5</code>.</>, teste: 'Container.test.tsx' },
    { garantia: 'Alinhada ao PageHeader', como: <>O respiro lateral é o <code>--pl-space-5</code> do <code>PageHeader</code> e o <code>maxWidth</code> mede o conteúdo nos dois: com o mesmo valor, a borda do conteúdo é a mesma, no largo e no estreito.</>, teste: 'Container.test.tsx' },
    { garantia: 'Propriedades nativas', como: <>Recebe as de <code>div</code>, <code>className</code>, <code>style</code> e o ref na raiz.</>, teste: 'Container.test.tsx' },
  ],
  notaDaApi: (
    <>
      <code>Container</code> recebe as propriedades nativas de <code>div</code>, inclusive o ref. Só tem respiro lateral: o vertical é de quem
      usa, com padding ou com uma <code>Stack</code>.
    </>
  ),
  api: [{ nome: 'maxWidth', tipo: 'string | number', descricao: 'A largura máxima do conteúdo; número é em px. Sem ela, a largura toda.' }],
};
