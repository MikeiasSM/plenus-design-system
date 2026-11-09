import { AnnotatedSection, Button, Card, FieldRow, InputNumber, InputText, Select, Switch, Textarea } from '@plenustech/design-system';
import type { AnnotatedSectionProps } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const NIVEIS = ['2', '3', '4', '5', '6'] as const;

const PRAZOS = [
  { label: 'À vista', value: 'vista' },
  { label: '14 dias', value: '14' },
  { label: '28 dias', value: '28' },
];

function CartaoDeAjustes() {
  return (
    <Card>
      <Card.Body flush>
        <FieldRow description="Até este valor, o pedido segue direto para separação." label="Desconto sem aprovação (%)">
          {({ describedBy, id }) => <InputNumber aria-describedby={describedBy} defaultValue={5} id={id} style={{ width: 80 }} />}
        </FieldRow>
        <FieldRow description="Cada carteira define os próprios limites." label="Limites por carteira">
          {({ describedBy, id }) => <Switch aria-describedby={describedBy} defaultChecked id={id} />}
        </FieldRow>
      </Card.Body>
    </Card>
  );
}

const playground = definirPlayground({
  inicial: {
    title: 'Limites',
    description: 'Até onde o vendedor concede sozinho, e o teto com aprovação.',
    action: true,
    headingLevel: '2',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'booleano', nome: 'action' },
    { tipo: 'opcoes', nome: 'headingLevel', opcoes: NIVEIS },
  ],
  renderizar: (valores, registrar) => (
    <AnnotatedSection
      action={
        valores.action ? (
          <Button onClick={() => registrar('Adicionar limite: onClick')} size="sm" variant="ghost">
            Adicionar limite
          </Button>
        ) : undefined
      }
      description={valores.description || undefined}
      headingLevel={Number(valores.headingLevel) as NonNullable<AnnotatedSectionProps['headingLevel']>}
      title={valores.title}
    >
      <CartaoDeAjustes />
    </AnnotatedSection>
  ),
  codigo: (valores) =>
    gerarJsx(
      'AnnotatedSection',
      [
        ['title', valores.title],
        ['description', valores.description || undefined],
        ['action', valores.action ? expr('<Button size="sm" variant="ghost">Adicionar limite</Button>') : undefined],
        ['headingLevel', Number(valores.headingLevel), 2],
      ],
      '<Card>…</Card>',
    ),
  verificar: (valores) =>
    [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Região nomeada', detalhe: `A seção se chama "${valores.title.trim()}", pelo título em h${valores.headingLevel}.` }
        : { nivel: 'falha', titulo: 'Seção sem título', detalhe: 'O título nomeia a região; sem ele, o leitor de tela não a distingue das vizinhas.' },
    ] satisfies Verificacao[],
});

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Duas colunas</h3>
        <div style={{ width: '100%' }}>
          <AnnotatedSection description="Quem fica sabendo de cada pedido em aprovação." title="Avisos">
            <CartaoDeAjustes />
          </AnnotatedSection>
        </div>
        <p className="note">
          Com 900px ou mais de largura própria, o título e a explicação ficam num trilho de 200 a 300px à esquerda, e o conteúdo ocupa o resto.
          900px é o <code>--pl-bp-sm</code>.
        </p>
      </div>
      <div className="subsection">
        <h3>Uma coluna</h3>
        <div style={{ maxWidth: 420 }}>
          <AnnotatedSection description="Quem fica sabendo de cada pedido em aprovação." title="Avisos">
            <CartaoDeAjustes />
          </AnnotatedSection>
        </div>
        <p className="note">
          A medida é a da própria seção, e não a da janela: abaixo de 900px, o trilho sobe para acima do conteúdo, e a ação segue abaixo da
          explicação.
        </p>
      </div>
      <div className="subsection">
        <h3>Seções vizinhas</h3>
        <div style={{ width: '100%' }}>
          <AnnotatedSection description="Até onde o vendedor concede sozinho." title="Limites">
            <CartaoDeAjustes />
          </AnnotatedSection>
          <AnnotatedSection description="Quem fica sabendo de cada pedido em aprovação." title="Avisos">
            <CartaoDeAjustes />
          </AnnotatedSection>
        </div>
        <p className="note">Seções irmãs se separam por uma linha fina, e a primeira dispensa o respiro de cima.</p>
      </div>
    </div>
  );
}

function TelaDeConfiguracao() {
  return (
    <div style={{ width: '100%' }}>
      <AnnotatedSection
        action={
          <Button size="sm" variant="ghost">
            Adicionar limite
          </Button>
        }
        description="Até onde o vendedor concede sozinho, e o teto com aprovação."
        title="Limites"
      >
        <CartaoDeAjustes />
      </AnnotatedSection>
      <AnnotatedSection description="Quem fica sabendo de cada pedido em aprovação." title="Avisos">
        <Card>
          <Card.Body flush>
            <FieldRow description="Assim que o pedido entra na fila." label="Avisar o aprovador por e-mail">
              {({ describedBy, id }) => <Switch aria-describedby={describedBy} defaultChecked id={id} />}
            </FieldRow>
          </Card.Body>
        </Card>
      </AnnotatedSection>
    </div>
  );
}

function FormularioPorAssunto() {
  return (
    <div style={{ width: '100%' }}>
      <AnnotatedSection description="Como o cliente aparece nos pedidos e nas notas fiscais." title="Identificação">
        <Card>
          <Card.Body>
            <div style={{ display: 'grid', gap: 16 }}>
              <InputText label="CNPJ" required />
              <InputText label="Razão social" required />
            </div>
          </Card.Body>
        </Card>
      </AnnotatedSection>
      <AnnotatedSection description="Prazo e observações que valem para os próximos pedidos." title="Condições comerciais">
        <Card>
          <Card.Body>
            <div style={{ display: 'grid', gap: 16 }}>
              <Select label="Prazo padrão" options={PRAZOS} />
              <Textarea label="Observações" />
            </div>
          </Card.Body>
        </Card>
      </AnnotatedSection>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Tela de configuração',
      descricao: 'Linhas de ajuste dentro de um cartão sem respiro, com uma ação no trilho.',
      largo: true,
      Previa: TelaDeConfiguracao,
      codigo:
        '<AnnotatedSection\n  title="Limites"\n  description="Até onde o vendedor concede sozinho, e o teto com aprovação."\n  action={<Button size="sm" variant="ghost">Adicionar limite</Button>}\n>\n  <Card>\n    <Card.Body flush>\n      <FieldRow label="Desconto sem aprovação (%)" description="Até este valor, o pedido segue direto.">\n        {({ describedBy, id }) => (\n          <InputNumber id={id} aria-describedby={describedBy} />\n        )}\n      </FieldRow>\n    </Card.Body>\n  </Card>\n</AnnotatedSection>',
    },
    {
      titulo: 'Formulário por assunto',
      descricao: 'Cada assunto do cadastro numa seção, com os campos no cartão.',
      largo: true,
      Previa: FormularioPorAssunto,
      codigo:
        '<AnnotatedSection title="Identificação" description="Como o cliente aparece nos pedidos e nas notas fiscais.">\n  <Card>\n    <Card.Body>\n      <InputText label="CNPJ" required />\n      <InputText label="Razão social" required />\n    </Card.Body>\n  </Card>\n</AnnotatedSection>\n<AnnotatedSection title="Condições comerciais" description="Prazo e observações.">\n  <Card>…</Card>\n</AnnotatedSection>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <AnnotatedSection description="Até onde o vendedor concede sozinho." title="Limites">
          <CartaoDeAjustes />
        </AnnotatedSection>
      </div>
    ),
    texto: 'Uma seção por assunto, com um título que diga o que ela ajusta e o conteúdo em um cartão.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <AnnotatedSection title="Limites">
          <Card>
            <Card.Header title="Limites" />
            <Card.Body>Conteúdo</Card.Body>
          </Card>
        </AnnotatedSection>
      </div>
    ),
    texto: 'Repetir o título no cabeçalho do cartão. Quem nomeia a seção é o título dela; o cartão leva só o conteúdo.',
  },
  Modos,
  teclado: [{ teclas: ['Tab'], acao: 'A seção não é interativa: o foco segue direto para a ação e para os controles do conteúdo.' }],
  garantias: [
    { garantia: 'Região nomeada', como: <>A <code>section</code> aponta para o título por <code>aria-labelledby</code>.</>, teste: 'AnnotatedSection.test.tsx' },
    { garantia: 'Nível do título', como: <><code>h2</code> por padrão; <code>headingLevel</code> escolhe de <code>h2</code> a <code>h6</code>.</>, teste: 'AnnotatedSection.test.tsx' },
    { garantia: 'Explicação e ação', como: <>Aparecem abaixo do título, só quando informadas.</>, teste: 'AnnotatedSection.test.tsx' },
    { garantia: 'Propriedades nativas', como: <>As propriedades nativas, o <code>className</code> e o ref vão à <code>section</code>.</>, teste: 'AnnotatedSection.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <section> e o ref. O que vai em cada parte é do produto.',
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título da seção, que nomeia a região.' },
    { nome: 'description', tipo: 'ReactNode', descricao: 'Explicação abaixo do título.' },
    { nome: 'action', tipo: 'ReactNode', descricao: 'Ação opcional, abaixo da explicação.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'Conteúdo livre: cartão, campos ou tabela.' },
    { nome: 'headingLevel', tipo: '2 | 3 | 4 | 5 | 6', padrao: '2', descricao: 'Nível do título na hierarquia da página.' },
  ],
};
