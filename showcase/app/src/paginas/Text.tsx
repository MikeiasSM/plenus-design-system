import { Text, type TextTone, type TextVariant } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const VARIANTES = ['body', 'label', 'caption', 'micro', 'title', 'code'] as const;
const TONS = ['default', 'secondary', 'tertiary', 'danger'] as const;

const playground = definirPlayground({
  inicial: { variant: 'body', tone: 'default', truncate: false, numeric: false, texto: 'Pagamento de fornecedor, parcela 3 de 12' },
  controles: [
    { tipo: 'opcoes', nome: 'variant', opcoes: VARIANTES },
    { tipo: 'opcoes', nome: 'tone', opcoes: TONS },
    { tipo: 'booleano', nome: 'truncate' },
    { tipo: 'booleano', nome: 'numeric' },
    { tipo: 'texto', nome: 'texto' },
  ],
  renderizar: (valores) => (
    <div style={{ width: 240 }}>
      <Text
        numeric={Boolean(valores.numeric)}
        tone={valores.tone as TextTone}
        truncate={Boolean(valores.truncate)}
        variant={valores.variant as TextVariant}
      >
        {String(valores.texto)}
      </Text>
    </div>
  ),
  codigo: (valores) =>
    gerarJsx(
      'Text',
      [
        ['variant', valores.variant, 'body'],
        ['tone', valores.tone, 'default'],
        ['truncate', valores.truncate, false],
        ['numeric', valores.numeric, false],
      ],
      String(valores.texto),
    ),
});

function Variantes() {
  return (
    <div className="subsection">
      <h3>Papéis e tons</h3>
      <div className="stack">
        {VARIANTES.map((variante) => (
          <Text as="div" key={variante} variant={variante}>
            {variante}: Conciliação bancária de novembro
          </Text>
        ))}
        {TONS.map((tom) => (
          <Text as="div" key={tom} tone={tom}>
            {tom}: Conciliação bancária de novembro
          </Text>
        ))}
      </div>
      <p className="note">
        Cada papel traz tamanho, entrelinha e peso dos tokens de tipografia. O tom troca só a cor: padrão, secundário, terciário e
        o de erro, os que existem como cor de texto.
      </p>
      <VerCodigo
        codigo={`<Text as="div" variant="body">body: Conciliação bancária de novembro</Text>
<Text as="div" variant="label">label: Conciliação bancária de novembro</Text>
<Text as="div" variant="caption">caption: Conciliação bancária de novembro</Text>
<Text as="div" variant="micro">micro: Conciliação bancária de novembro</Text>
<Text as="div" variant="title">title: Conciliação bancária de novembro</Text>
<Text as="div" variant="code">code: Conciliação bancária de novembro</Text>
<Text as="div" tone="default">default: Conciliação bancária de novembro</Text>
<Text as="div" tone="secondary">secondary: Conciliação bancária de novembro</Text>
<Text as="div" tone="tertiary">tertiary: Conciliação bancária de novembro</Text>
<Text as="div" tone="danger">danger: Conciliação bancária de novembro</Text>`}
      />
    </div>
  );
}

function Modos() {
  return (
    <div className="subsection">
      <h3>Truncar e alinhar números</h3>
      <div className="stack" style={{ width: 260 }}>
        <Text truncate>Pagamento de fornecedor referente à parcela 3 de 12 do contrato</Text>
        <Text as="div" numeric>
          1.111,11
          <br />
          8.888,88
        </Text>
      </div>
      <p className="note">
        <code>truncate</code> corta em uma linha, com reticências, na largura que o pai der. <code>numeric</code> usa algarismos
        tabulares: os dígitos têm a mesma largura e as colunas de valores se alinham.
      </p>
      <VerCodigo
        codigo={`<Text truncate>Pagamento de fornecedor referente à parcela 3 de 12 do contrato</Text>
<Text as="div" numeric>
  1.111,11
  <br />
  8.888,88
</Text>`}
      />
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Linha secundária na célula',
      descricao: 'O detalhe abaixo do valor principal: caption, cor terciária, em linha própria.',
      Previa: () => (
        <div>
          <Text as="div">Aluguel do escritório</Text>
          <Text as="div" tone="tertiary" variant="caption">
            Vence em 10/12
          </Text>
        </div>
      ),
      codigo: `<Text as="div">Aluguel do escritório</Text>
<Text as="div" tone="tertiary" variant="caption">
  Vence em 10/12
</Text>`,
    },
    {
      titulo: 'Mensagem de erro',
      descricao: 'Texto no tom de erro, em parágrafo próprio.',
      Previa: () => (
        <Text as="p" tone="danger" variant="caption">
          Informe um valor maior que zero.
        </Text>
      ),
      codigo: `<Text as="p" tone="danger" variant="caption">
  Informe um valor maior que zero.
</Text>`,
    },
  ],
  faca: {
    Previa: () => (
      <Text as="div" tone="tertiary" variant="caption">
        Vence em 10/12
      </Text>
    ),
    texto: 'Text com variant e tone para o texto de apoio, em vez de repetir tamanho e cor em cada tela.',
    codigo: `<Text as="div" tone="tertiary" variant="caption">
  Vence em 10/12
</Text>`,
  },
  evite: {
    Previa: () => <span style={{ color: '#6E7175', fontSize: 12, lineHeight: '16px' }}>Vence em 10/12</span>,
    texto: 'Escrever à mão o tamanho e a cor do texto de apoio: o valor deixa de seguir os tokens e não acompanha o tema escuro.',
    codigo: `<span style={{ color: '#6E7175', fontSize: 12, lineHeight: '16px' }}>
  Vence em 10/12
</span>`,
  },
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Elemento', como: <>Renderiza um <code>span</code> e troca por <code>as</code>.</>, teste: 'Text.test.tsx' },
    { garantia: 'Papel, tom e modos', como: <><code>variant</code>, <code>tone</code>, <code>truncate</code> e <code>numeric</code> chegam ao elemento.</>, teste: 'Text.test.tsx' },
    { garantia: 'Props nativas', como: <>Repassa ref, <code>className</code> e atributos nativos.</>, teste: 'Text.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <span> (ou do elemento de as) e o ref.',
  api: [
    { nome: 'variant', tipo: "'body' | 'label' | 'caption' | 'micro' | 'title' | 'code'", padrao: "'body'", descricao: 'Papel tipográfico: tamanho, entrelinha e peso dos tokens.' },
    { nome: 'tone', tipo: "'default' | 'secondary' | 'tertiary' | 'danger'", padrao: "'default'", descricao: 'Cor do texto.' },
    { nome: 'truncate', tipo: 'boolean', padrao: 'false', descricao: 'Uma linha só, com reticências no excesso. O pai limita a largura.' },
    { nome: 'numeric', tipo: 'boolean', padrao: 'false', descricao: 'Algarismos tabulares, para alinhar valores em coluna.' },
    { nome: 'as', tipo: 'ElementType', padrao: "'span'", descricao: <>Elemento ou componente renderizado. <code>span</code> é inline: use <code>p</code> ou <code>div</code> para linha própria.</> },
  ],
};
