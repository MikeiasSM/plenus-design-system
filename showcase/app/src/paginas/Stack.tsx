import type { ReactNode } from 'react';
import { Button, InputText, Stack, type StackAlign, type StackGap, type StackJustify } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const ALINHAMENTOS = ['', 'start', 'center', 'end', 'stretch', 'baseline'] as const;
const DISTRIBUICOES = ['', 'start', 'center', 'end', 'between'] as const;

function Bloco({ altura = 32, children }: { altura?: number; children: ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--pl-color-primary-container)',
        borderRadius: 'var(--pl-radius-md)',
        boxSizing: 'border-box',
        color: 'var(--pl-color-on-primary-container)',
        minHeight: altura,
        padding: '4px 12px',
      }}
    >
      {children}
    </div>
  );
}

function Tres({ altura }: { altura?: number }) {
  return (
    <>
      <Bloco altura={altura}>Rascunho</Bloco>
      <Bloco altura={altura && altura * 1.5}>Em análise</Bloco>
      <Bloco altura={altura}>Aprovado</Bloco>
    </>
  );
}

const playground = definirPlayground({
  inicial: { direction: 'vertical', gap: 4, align: '', justify: '', wrap: false },
  controles: [
    { tipo: 'opcoes', nome: 'direction', opcoes: ['vertical', 'horizontal'] },
    { tipo: 'numero', nome: 'gap', min: 1, max: 7 },
    { tipo: 'opcoes', nome: 'align', opcoes: ALINHAMENTOS },
    { tipo: 'opcoes', nome: 'justify', opcoes: DISTRIBUICOES },
    { tipo: 'booleano', nome: 'wrap' },
  ],
  renderizar: (valores) => (
    <div style={{ width: '100%' }}>
      <Stack
        align={(valores.align || undefined) as StackAlign | undefined}
        direction={valores.direction as 'vertical' | 'horizontal'}
        gap={valores.gap as StackGap}
        justify={(valores.justify || undefined) as StackJustify | undefined}
        wrap={Boolean(valores.wrap)}
      >
        <Tres />
        <Bloco>Publicado</Bloco>
        <Bloco>Arquivado</Bloco>
      </Stack>
    </div>
  ),
  codigo: (valores) =>
    gerarJsx(
      'Stack',
      [
        ['direction', valores.direction, 'vertical'],
        ['gap', valores.gap, 4],
        ['align', valores.align || undefined],
        ['justify', valores.justify || undefined],
        ['wrap', valores.wrap || undefined],
      ],
      '<Card>…Rascunho…</Card>\n<Card>…Em análise…</Card>\n<Card>…Aprovado…</Card>\n<Card>…Publicado…</Card>\n<Card>…Arquivado…</Card>',
    ),
});

function Variantes() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Vertical e horizontal</h3>
        <div style={{ display: 'grid', gap: 16, width: '100%' }}>
          <Stack>
            <Tres />
          </Stack>
          <Stack direction="horizontal">
            <Tres />
          </Stack>
        </div>
        <p className="note">Na vertical, que é o padrão, os filhos descem e se esticam na largura. Na horizontal, ficam em linha.</p>
        <VerCodigo
          codigo={`<Stack>
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
</Stack>

<Stack direction="horizontal">
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
</Stack>`}
        />
      </div>
      <div className="subsection">
        <h3>Espaço entre os filhos</h3>
        <div style={{ display: 'grid', gap: 16, width: '100%' }}>
          {([1, 4, 7] as const).map((gap) => (
            <Stack direction="horizontal" gap={gap} key={gap}>
              <Tres />
            </Stack>
          ))}
        </div>
        <p className="note">
          O <code>gap</code> é o passo de <code>--pl-space-N</code>, de 1 a 7. O padrão é 4. Aqui, 1, 4 e 7.
        </p>
        <VerCodigo
          codigo={`<Stack direction="horizontal" gap={1}>
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
</Stack>

<Stack direction="horizontal">
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
</Stack>

<Stack direction="horizontal" gap={7}>
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
</Stack>`}
        />
      </div>
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Alinhamento e distribuição</h3>
        <div style={{ display: 'grid', gap: 16, width: '100%' }}>
          <Stack align="center" direction="horizontal" justify="between">
            <Tres altura={32} />
          </Stack>
          <Stack align="end" direction="horizontal" justify="end">
            <Tres altura={32} />
          </Stack>
        </div>
        <p className="note">
          O <code>align</code> age no eixo transversal; o <code>justify</code>, no principal. Com <code>between</code>, o espaço que sobra vai
          entre os filhos.
        </p>
        <VerCodigo
          codigo={`<Stack align="center" direction="horizontal" justify="between">
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
</Stack>

<Stack align="end" direction="horizontal" justify="end">
  <Card>…Rascunho…</Card>
  <Card>…Em análise…</Card>
  <Card>…Aprovado…</Card>
</Stack>`}
        />
      </div>
      <div className="subsection">
        <h3>Quebra de linha</h3>
        <div style={{ maxWidth: 320, width: '100%' }}>
          <Stack direction="horizontal" gap={2} wrap>
            <Button>Rascunho</Button>
            <Button>Em análise</Button>
            <Button>Aprovado</Button>
            <Button>Publicado</Button>
          </Stack>
        </div>
        <p className="note">Com <code>wrap</code>, o que não cabe desce para uma nova linha.</p>
        <VerCodigo
          codigo={`<Stack direction="horizontal" gap={2} wrap>
  <Button>Rascunho</Button>
  <Button>Em análise</Button>
  <Button>Aprovado</Button>
  <Button>Publicado</Button>
</Stack>`}
        />
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Campos em coluna',
      descricao: 'Blocos de um formulário, um abaixo do outro, com o espaço do sistema.',
      largo: true,
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Stack gap={3}>
            <InputText label="Nome" />
            <InputText label="E-mail" />
            <InputText label="Telefone" />
          </Stack>
        </div>
      ),
      codigo: `<Stack gap={3}>
  <InputText label="Nome" />
  <InputText label="E-mail" />
  <InputText label="Telefone" />
</Stack>`,
    },
    {
      titulo: 'Ações à direita',
      descricao: 'Botões em linha, empurrados para o fim.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Stack direction="horizontal" gap={2} justify="end">
            <Button variant="secondary">Cancelar</Button>
            <Button>Salvar</Button>
          </Stack>
        </div>
      ),
      codigo: `<Stack direction="horizontal" gap={2} justify="end">
  <Button variant="secondary">Cancelar</Button>
  <Button>Salvar</Button>
</Stack>`,
    },
    {
      titulo: 'Lista semântica',
      descricao: 'O as troca o elemento da raiz, para a lista ser uma lista.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Stack as="ul" gap={2} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li>Conciliação</li>
            <li>Extrato</li>
          </Stack>
        </div>
      ),
      codigo: `<Stack as="ul" gap={2} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
  <li>Conciliação</li>
  <li>Extrato</li>
</Stack>`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Stack direction="horizontal" gap={2} wrap>
          <Button>Rascunho</Button>
          <Button>Em análise</Button>
          <Button>Aprovado</Button>
          <Button>Publicado</Button>
        </Stack>
      </div>
    ),
    texto: 'Uma pilha para espaçar poucos filhos num único eixo, com wrap quando a linha pode ficar curta.',
    codigo: `<Stack direction="horizontal" gap={2} wrap>
  <Button>Rascunho</Button>
  <Button>Em análise</Button>
  <Button>Aprovado</Button>
  <Button>Publicado</Button>
</Stack>`,
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Stack direction="horizontal" gap={3}>
          <Bloco>Pedido 1042</Bloco>
          <Bloco>Pedido 1043</Bloco>
          <Bloco>Pedido 1044</Bloco>
          <Bloco>Pedido 1045</Bloco>
        </Stack>
      </div>
    ),
    texto: (
      <>
        Usar a <code>Stack</code> horizontal para uma grade de cartões. Sem <code>wrap</code> os itens se espremem; para colunas iguais que
        se adaptam à largura, o certo é a <code>Grid</code>.
      </>
    ),
    codigo: `<Stack direction="horizontal" gap={3}>
  <Card>…Pedido 1042…</Card>
  <Card>…Pedido 1043…</Card>
  <Card>…Pedido 1044…</Card>
  <Card>…Pedido 1045…</Card>
</Stack>`,
  },
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Padrão', como: <>Sem propriedades, empilha na vertical com o espaço 4.</>, teste: 'Stack.test.tsx' },
    { garantia: 'Eixo e espaço', como: <><code>direction</code>, <code>gap</code>, <code>align</code>, <code>justify</code> e <code>wrap</code> chegam à raiz, e cada valor tem a sua regra de estilo.</>, teste: 'Stack.test.tsx' },
    { garantia: 'Elemento da raiz', como: <>O <code>as</code> troca o <code>div</code> por outro elemento, como <code>ul</code>.</>, teste: 'Stack.test.tsx' },
    { garantia: 'Propriedades nativas', como: <>Recebe as de <code>div</code>, <code>className</code> e o ref na raiz.</>, teste: 'Stack.test.tsx' },
    { garantia: 'Sem estouro', como: <>Os filhos diretos têm <code>min-width: 0</code>, sem especificidade: o conteúdo longo encolhe em vez de passar da largura, e a largura mínima que o próprio filho declara vence.</>, teste: 'Stack.test.tsx' },
  ],
  notaDaApi: (
    <>
      <code>Stack</code> recebe as propriedades nativas de <code>div</code>, inclusive o ref, e não acrescenta papel nem rótulo: a semântica é
      do conteúdo, ou do elemento escolhido em <code>as</code>.
    </>
  ),
  api: [
    { nome: 'direction', tipo: "'vertical' | 'horizontal'", padrao: "'vertical'", descricao: 'O eixo da pilha.' },
    { nome: 'gap', tipo: '1 | 2 | 3 | 4 | 5 | 6 | 7', padrao: '4', descricao: 'O passo de --pl-space-N entre os filhos.' },
    { nome: 'align', tipo: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", descricao: 'Alinhamento no eixo transversal.' },
    { nome: 'justify', tipo: "'start' | 'center' | 'end' | 'between'", descricao: 'Distribuição no eixo principal.' },
    { nome: 'wrap', tipo: 'boolean', padrao: 'false', descricao: 'Quebra os filhos em novas linhas quando faltar espaço.' },
    { nome: 'as', tipo: 'ElementType', padrao: "'div'", descricao: 'O elemento ou componente da raiz.' },
  ],
};
