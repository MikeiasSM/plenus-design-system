import type { ReactNode } from 'react';
import { Button, Grid, InputText, type GridGap } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const NOMES = ['Rascunho', 'Em análise', 'Aprovado', 'Publicado', 'Arquivado', 'Cancelado', 'Revisado', 'Enviado'];

function Bloco({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--pl-color-primary-container)',
        borderRadius: 'var(--pl-radius-md)',
        boxSizing: 'border-box',
        color: 'var(--pl-color-on-primary-container)',
        padding: '12px',
      }}
    >
      {children}
    </div>
  );
}

/** Caixa que o leitor estreita pelo canto, para ver a grade perder colunas. */
function Estreitavel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        border: '1px dashed var(--pl-color-border-strong)',
        boxSizing: 'border-box',
        maxWidth: '100%',
        minWidth: 160,
        overflow: 'auto',
        padding: 8,
        resize: 'horizontal',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
}

function Blocos({ quantidade }: { quantidade: number }) {
  return (
    <>
      {NOMES.slice(0, quantidade).map((nome) => (
        <Bloco key={nome}>{nome}</Bloco>
      ))}
    </>
  );
}

const playground = definirPlayground({
  inicial: { columns: 0, minColumnWidth: 160, gap: 4, itens: 6 },
  controles: [
    { tipo: 'numero', nome: 'columns', min: 0, max: 6 },
    { tipo: 'numero', nome: 'minColumnWidth', min: 80, max: 400, passo: 20 },
    { tipo: 'numero', nome: 'gap', min: 1, max: 7 },
    { tipo: 'numero', nome: 'itens', min: 1, max: 8 },
  ],
  renderizar: (valores) => (
    <Estreitavel>
      <Grid
        columns={Number(valores.columns) || undefined}
        gap={valores.gap as GridGap}
        minColumnWidth={Number(valores.minColumnWidth)}
      >
        <Blocos quantidade={Number(valores.itens)} />
      </Grid>
    </Estreitavel>
  ),
  codigo: (valores) =>
    gerarJsx(
      'Grid',
      [
        ['columns', Number(valores.columns) || undefined],
        ['minColumnWidth', Number(valores.minColumnWidth), 240],
        ['gap', valores.gap, 4],
      ],
      NOMES.slice(0, Number(valores.itens)).map((nome) => `<Card>…${nome}…</Card>`).join('\n'),
    ),
});

function Painel() {
  return (
    <div style={{ width: '100%' }}>
      <Estreitavel>
        <Grid columns={4} minColumnWidth={120}>
          <Grid.Item span={2}>
            <Bloco>Receita (ocupa 2)</Bloco>
          </Grid.Item>
          <Grid.Item span={2}>
            <Bloco>Despesa (ocupa 2)</Bloco>
          </Grid.Item>
          <Bloco>Saldo</Bloco>
          <Bloco>Pendente</Bloco>
          <Bloco>Vencido</Bloco>
          <Bloco>A vencer</Bloco>
        </Grid>
      </Estreitavel>
    </div>
  );
}

function Formulario({ colunas }: { colunas: 2 | 3 }) {
  return (
    <div style={{ width: '100%' }}>
      <Estreitavel>
        <Grid columns={colunas} minColumnWidth={160}>
          <InputText label="Nome" />
          <InputText label="Sobrenome" />
          <InputText label="E-mail" />
          <InputText label="Telefone" />
          <InputText label="Cidade" />
          <InputText label="Estado" />
        </Grid>
      </Estreitavel>
    </div>
  );
}

function Variantes() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Quantas couberem</h3>
        <div style={{ width: '100%' }}>
          <Estreitavel>
            <Grid minColumnWidth={140}>
              <Blocos quantidade={6} />
            </Grid>
          </Estreitavel>
        </div>
        <p className="note">
          Sem <code>columns</code>, entram quantas colunas couberem, cada uma com ao menos <code>minColumnWidth</code>. Estreite a caixa pelo
          canto: a grade perde colunas até chegar a uma.
        </p>
        <VerCodigo
          codigo={`<Grid minColumnWidth={140}>
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
  <Card>…Publicado…</Card>
  <Card>…Arquivado…</Card>
  <Card>…Cancelado…</Card>
</Grid>`}
        />
      </div>
      <div className="subsection">
        <h3>Com limite de colunas</h3>
        <div style={{ width: '100%' }}>
          <Estreitavel>
            <Grid columns={3} minColumnWidth={140}>
              <Blocos quantidade={6} />
            </Grid>
          </Estreitavel>
        </div>
        <p className="note">
          Com <code>columns</code>, a grade nunca passa desse número, por mais larga que fique, e perde colunas ao estreitar.
        </p>
        <VerCodigo
          codigo={`<Grid columns={3} minColumnWidth={140}>
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
  <Card>…Publicado…</Card>
  <Card>…Arquivado…</Card>
  <Card>…Cancelado…</Card>
</Grid>`}
        />
      </div>
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Células de várias colunas</h3>
        <Painel />
        <p className="note">
          Com 4 colunas, as duas primeiras células ocupam metade da linha. Com menos de 2 colunas, passam a ocupar a linha inteira. A grade
          nunca cria uma coluna a mais.
        </p>
        <VerCodigo
          codigo={`<Grid columns={4} minColumnWidth={120}>
  <Grid.Item span={2}>
    <Card>…Receita…</Card>
  </Grid.Item>
  <Grid.Item span={2}>
    <Card>…Despesa…</Card>
  </Grid.Item>
  <Card>…Saldo…</Card>
  <Card>…Pendente…</Card>
  <Card>…Vencido…</Card>
  <Card>…A vencer…</Card>
</Grid>`}
        />
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Campos em duas colunas',
      descricao: 'Campos de formulário lado a lado, que viram uma coluna quando a largura aperta.',
      largo: true,
      Previa: () => <Formulario colunas={2} />,
      codigo: `<Grid columns={2} minColumnWidth={160}>
  <InputText label="Nome" />
  <InputText label="Sobrenome" />
  <InputText label="E-mail" />
  <InputText label="Telefone" />
  <InputText label="Cidade" />
  <InputText label="Estado" />
</Grid>`,
    },
    {
      titulo: 'Campos em três colunas',
      descricao: 'O mesmo formulário com até três colunas.',
      largo: true,
      Previa: () => <Formulario colunas={3} />,
      codigo: `<Grid columns={3} minColumnWidth={160}>
  <InputText label="Nome" />
  <InputText label="Sobrenome" />
  <InputText label="E-mail" />
  <InputText label="Telefone" />
  <InputText label="Cidade" />
  <InputText label="Estado" />
</Grid>`,
    },
    {
      titulo: 'Grade de cartões',
      descricao: 'Quantos cartões couberem, de no mínimo 300px cada.',
      largo: true,
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Estreitavel>
            <Grid minColumnWidth={300}>
              <Blocos quantidade={5} />
            </Grid>
          </Estreitavel>
        </div>
      ),
      codigo: `<Grid minColumnWidth={300}>
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
  <Card>…Publicado…</Card>
  <Card>…Arquivado…</Card>
</Grid>`,
    },
    {
      titulo: 'Painel de quatro colunas',
      descricao: 'Células de duas colunas entre as de uma. Com menos de quatro colunas, as de duas podem deixar espaço vazio na linha: aí, uma Grid para cada grupo.',
      largo: true,
      Previa: Painel,
      codigo: `<Grid columns={4} minColumnWidth={120}>
  <Grid.Item span={2}>
    <Card>…Receita…</Card>
  </Grid.Item>
  <Grid.Item span={2}>
    <Card>…Despesa…</Card>
  </Grid.Item>
  <Card>…Saldo…</Card>
  <Card>…Pendente…</Card>
  <Card>…Vencido…</Card>
  <Card>…A vencer…</Card>
</Grid>`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Grid columns={3} minColumnWidth={140}>
          <Blocos quantidade={3} />
        </Grid>
      </div>
    ),
    texto: 'Uma grade para itens de mesmo peso que se repetem e devem se ajustar à largura disponível, com minColumnWidth que caiba o conteúdo.',
    codigo: `<Grid columns={3} minColumnWidth={140}>
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
</Grid>`,
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Grid columns={2} minColumnWidth={80}>
          <Button>Cancelar</Button>
          <Button>Salvar</Button>
        </Grid>
      </div>
    ),
    texto: (
      <>
        Usar a <code>Grid</code> para uma fileira de poucos itens que não precisam de colunas iguais, como botões: eles se esticam até
        encher a célula. Para isso, a <code>Stack</code> horizontal.
      </>
    ),
    codigo: `<Grid columns={2} minColumnWidth={80}>
  <Button>Cancelar</Button>
  <Button>Salvar</Button>
</Grid>`,
  },
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Quantas couberem', como: <>Sem <code>columns</code>, as colunas seguem a largura da própria grade, cada uma com ao menos <code>minColumnWidth</code>.</>, teste: 'Grid.test.tsx' },
    { garantia: 'Limite de colunas', como: <>Com <code>columns</code>, a grade nunca passa desse número de colunas.</>, teste: 'Grid.test.tsx' },
    { garantia: 'Espaço e alinhamento', como: <><code>gap</code> e <code>align</code> chegam à raiz, e cada valor tem a sua regra de estilo; o padrão do espaço é 4.</>, teste: 'Grid.test.tsx' },
    { garantia: 'Células largas', como: <><code>Grid.Item span</code> ocupa <code>span</code> colunas quando a grade tem esse tanto; com menos, ocupa a linha inteira.</>, teste: 'Grid.test.tsx' },
    { garantia: 'Sem coluna implícita', como: <>Enquanto o número de colunas não é conhecido, a célula não define a coluna.</>, teste: 'Grid.test.tsx' },
    { garantia: 'Propriedades nativas', como: <>A raiz e o <code>Grid.Item</code> recebem as de <code>div</code>, <code>className</code> e o ref.</>, teste: 'Grid.test.tsx' },
    { garantia: 'Sem estouro', como: <>O <code>Grid.Item</code> tem <code>min-width: 0</code>, e a coluna nunca passa da largura da grade, mesmo mais estreita que <code>minColumnWidth</code>.</>, teste: 'Grid.test.tsx' },
  ],
  notaDaApi: (
    <>
      <code>Grid</code> e <code>Grid.Item</code> recebem as propriedades nativas de <code>div</code>, inclusive o ref. A largura mínima padrão
      é 240px: cabe um campo de texto ou um cartão curto, e dá duas colunas a partir de 496px e três a partir de 752px (com o espaço 4).
      A medida é a da própria grade, e não a da janela.
    </>
  ),
  api: [
    { nome: 'columns', tipo: 'number', descricao: 'O máximo de colunas. Sem ele, entram quantas couberem.' },
    { nome: 'minColumnWidth', tipo: 'string | number', padrao: '240', descricao: 'A largura mínima de cada coluna; número é em px.' },
    { nome: 'gap', tipo: '1 | 2 | 3 | 4 | 5 | 6 | 7', padrao: '4', descricao: 'O passo de --pl-space-N entre as células.' },
    { nome: 'align', tipo: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", descricao: 'Alinhamento vertical das células na linha.' },
    { nome: 'Grid.Item', tipo: "ComponentPropsWithRef<'div'> & { span?: number }", descricao: 'Célula que pode ocupar mais de uma coluna.' },
    { nome: 'span', tipo: 'number', descricao: 'Colunas ocupadas, quando a grade tem esse tanto; com menos, a linha inteira. Quando o número de colunas não é múltiplo do span, sobra espaço vazio na linha: para larguras diferentes, use uma Grid para cada grupo.' },
  ],
};
