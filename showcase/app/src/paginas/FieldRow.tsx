import { Button, Card, FieldRow, InputNumber, SegmentedControl, Select, Switch } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const CONTROLES = ['Switch', 'InputNumber', 'Select', 'Button'] as const;
type Controle = (typeof CONTROLES)[number];

const PERIODOS = [
  { label: 'Diário', value: 'diario' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Mensal', value: 'mensal' },
];

function ControleDaLinha({ controle, describedBy, id }: { controle: Controle; describedBy?: string; id?: string }) {
  switch (controle) {
    case 'Switch':
      return <Switch aria-describedby={describedBy} defaultChecked id={id} />;
    case 'InputNumber':
      return (
        <>
          <InputNumber aria-describedby={describedBy} defaultValue={5} id={id} style={{ width: 80 }} />
          <span>%</span>
        </>
      );
    case 'Select':
      return <Select aria-describedby={describedBy} defaultValue="semanal" id={id} options={PERIODOS} style={{ width: 160 }} />;
    case 'Button':
      return (
        <Button aria-describedby={describedBy} size="sm" variant="dangerSoft">
          Desligar aprovação
        </Button>
      );
  }
}

const playground = definirPlayground({
  inicial: {
    label: 'Desconto sem aprovação',
    description: 'Até este valor, o pedido segue direto para separação.',
    controle: 'InputNumber' as Controle,
    largura: 640,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'opcoes', nome: 'controle', opcoes: CONTROLES },
    { tipo: 'numero', nome: 'largura', min: 200, max: 720, passo: 20 },
  ],
  renderizar: (valores) => (
    <div style={{ maxWidth: '100%', width: valores.largura }}>
      <Card>
        <Card.Body flush>
          <FieldRow description={valores.description || undefined} label={valores.label}>
            {(wiring) =>
              valores.controle === 'Button' ? (
                <ControleDaLinha controle="Button" describedBy={wiring.describedBy} />
              ) : (
                <ControleDaLinha controle={valores.controle} describedBy={wiring.describedBy} id={wiring.id} />
              )
            }
          </FieldRow>
        </Card.Body>
      </Card>
    </div>
  ),
  codigo: (valores) =>
    gerarJsx(
      'FieldRow',
      [
        ['label', valores.label],
        ['description', valores.description || undefined],
      ],
      valores.controle === 'Button'
        ? `{({ describedBy }) => (\n  <Button aria-describedby={describedBy}>…</Button>\n)}`
        : `{({ describedBy, id }) => (\n  <${valores.controle} aria-describedby={describedBy} id={id} />\n)}`,
    ),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Controle nomeado', detalhe: `"${valores.label.trim()}", pelo rótulo da linha ligado ao id do controle.` }
        : { nivel: 'falha', titulo: 'Linha sem rótulo', detalhe: 'O rótulo é o nome do controle; sem ele, o leitor de tela não diz o que a linha ajusta.' },
    ];

    if (valores.controle === 'Button') {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Botão com o próprio nome',
        detalhe: 'O botão não usa o id: a explicação o descreve, e o texto dele segue sendo o nome.',
      });
    }

    return verificacoes;
  },
});

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Grupo de opções</h3>
        <Card>
          <Card.Body flush>
            <FieldRow description="Quando o resumo chega." label="Frequência dos resumos">
              {({ describedBy, labelId }) => (
                <SegmentedControl aria-describedby={describedBy} aria-labelledby={labelId} defaultValue="semanal" items={PERIODOS} />
              )}
            </FieldRow>
          </Card.Body>
        </Card>
        <VerCodigo codigo={`<FieldRow label="Frequência dos resumos" description="Quando o resumo chega.">
  {({ describedBy, labelId }) => (
    <SegmentedControl aria-labelledby={labelId} aria-describedby={describedBy} items={periodos} />
  )}
</FieldRow>`} />
        <p className="note">O grupo de opções é um <code>div</code>, e o rótulo não o nomeia por <code>htmlFor</code>: o controle recebe o <code>labelId</code> em <code>aria-labelledby</code>, sem repetir o rótulo.</p>
      </div>
      <div className="subsection">
        <h3>Várias linhas</h3>
        <Card>
          <Card.Body flush>
            <FieldRow description="Assim que o pedido entra na fila." label="Avisar o aprovador por e-mail">
              {({ describedBy, id }) => <Switch aria-describedby={describedBy} defaultChecked id={id} />}
            </FieldRow>
            <FieldRow description="Às 18h, os pedidos aprovados e recusados no dia." label="Resumo diário para a gerência">
              {({ describedBy, id }) => <Switch aria-describedby={describedBy} id={id} />}
            </FieldRow>
          </Card.Body>
        </Card>
        <p className="note">Linhas seguidas se separam por uma linha fina. O corpo do cartão vai sem respiro (<code>flush</code>): a linha já traz o dela.</p>
        <VerCodigo
          codigo={`<Card>
  <Card.Body flush>
    <FieldRow
      label="Avisar o aprovador por e-mail"
      description="Assim que o pedido entra na fila."
    >
      {({ describedBy, id }) => (
        <Switch id={id} aria-describedby={describedBy} defaultChecked />
      )}
    </FieldRow>
    <FieldRow
      label="Resumo diário para a gerência"
      description="Às 18h, os pedidos aprovados e recusados no dia."
    >
      {({ describedBy, id }) => (
        <Switch id={id} aria-describedby={describedBy} />
      )}
    </FieldRow>
  </Card.Body>
</Card>`}
        />
      </div>
      <div className="subsection">
        <h3>Largura estreita</h3>
        <div style={{ maxWidth: 300 }}>
          <Card>
            <Card.Body flush>
              <FieldRow description="Quando o pedido muda de situação." label="Frequência dos avisos">
                {({ describedBy, id }) => <Select aria-describedby={describedBy} defaultValue="diario" id={id} options={PERIODOS} />}
              </FieldRow>
            </Card.Body>
          </Card>
        </div>
        <p className="note">
          A medida é a da linha, não a da janela. Com menos de 560px por dentro da linha, todo controle desce para sob a
          explicação, e as linhas de uma lista descem juntas. Acima disso, desce só o controle que não cabe ao lado de 260px de texto.
        </p>
        <VerCodigo
          codigo={`<Card>
  <Card.Body flush>
    <FieldRow
      label="Frequência dos avisos"
      description="Quando o pedido muda de situação."
    >
      {({ describedBy, id }) => (
        <Select
          id={id}
          aria-describedby={describedBy}
          options={periodos}
          defaultValue="diario"
        />
      )}
    </FieldRow>
  </Card.Body>
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
      titulo: 'Ajustes de um cartão',
      descricao: 'Chave, número e botão na mesma lista de linhas.',
      largo: true,
      Previa: () => (
        <div style={{ width: '100%' }}>
        <Card>
          <Card.Header description="Até onde o vendedor concede sozinho." title="Limites" />
          <Card.Body flush>
            <FieldRow description="Até este valor, o pedido segue direto para separação." label="Desconto sem aprovação">
              {({ describedBy, id }) => <ControleDaLinha controle="InputNumber" describedBy={describedBy} id={id} />}
            </FieldRow>
            <FieldRow description="Cada carteira define os próprios limites." label="Limites por carteira">
              {({ describedBy, id }) => <ControleDaLinha controle="Switch" describedBy={describedBy} id={id} />}
            </FieldRow>
            <FieldRow description="Os 14 pedidos na fila seguem com o desconto que têm." label="Pedidos na fila">
              {({ describedBy }) => <ControleDaLinha controle="Button" describedBy={describedBy} />}
            </FieldRow>
          </Card.Body>
        </Card>
        </div>
      ),
      codigo:
        '<Card>\n  <Card.Header title="Limites" description="Até onde o vendedor concede sozinho." />\n  <Card.Body flush>\n    <FieldRow label="Desconto sem aprovação" description="Até este valor, o pedido segue direto.">\n      {({ describedBy, id }) => (\n        <InputNumber id={id} aria-describedby={describedBy} />\n      )}\n    </FieldRow>\n    <FieldRow label="Limites por carteira" description="Cada carteira define os próprios limites.">\n      {({ describedBy, id }) => (\n        <Switch id={id} aria-describedby={describedBy} />\n      )}\n    </FieldRow>\n  </Card.Body>\n</Card>',
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Rótulo ligado ao controle', como: <>O rótulo aponta para o <code>id</code> entregue; clicar nele aciona o controle.</>, teste: 'FieldRow.test.tsx' },
    { garantia: 'Explicação anunciada', como: <><code>describedBy</code> liga a explicação por <code>aria-describedby</code>; sem explicação, fica indefinido.</>, teste: 'FieldRow.test.tsx' },
    { garantia: 'Grupo nomeado pela linha', como: <>O <code>labelId</code> vai ao <code>aria-labelledby</code> do <code>SegmentedControl</code>, do <code>RadioGroup</code> e do <code>CheckboxGroup</code>, que não têm rótulo próprio na tela: o nome é o da linha, uma vez só.</>, teste: 'FieldRow.test.tsx' },
    { garantia: 'Botão com nome próprio', como: <>Quem se nomeia pelo conteúdo usa só <code>describedBy</code>.</>, teste: 'FieldRow.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Rótulo da linha, ligado ao controle.' },
    { nome: 'description', tipo: 'ReactNode', descricao: 'Explicação sob o rótulo; descreve o controle.' },
    {
      nome: 'children',
      tipo: 'ReactNode | ((wiring: FieldRowWiring) => ReactNode)',
      descricao: <>O controle. A função recebe <code>{'{ id, describedBy, labelId }'}</code>.</>,
    },
    { nome: 'id', tipo: 'string', padrao: 'gerado', descricao: 'Id do controle, para o consumidor manter o próprio.' },
  ],
};

