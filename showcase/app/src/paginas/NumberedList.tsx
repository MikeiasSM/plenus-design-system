import { Card, NumberedList, Steps, type NumberedListLayout } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const PASSOS = [
  { titulo: 'Registre a conta', descricao: 'Banco, agência e número.' },
  { titulo: 'Envie o extrato', descricao: 'Arquivo OFX do internet banking.' },
  { titulo: 'Concilie', descricao: 'O sistema sugere os pares.' },
  { titulo: 'Acompanhe o saldo', descricao: 'Ele aparece no fluxo de caixa.' },
  { titulo: 'Repita todo mês', descricao: 'Um extrato novo por período.' },
];

const playground = definirPlayground({
  inicial: { layout: 'list', itens: 3, descricao: true },
  controles: [
    { tipo: 'opcoes', nome: 'layout', opcoes: ['list', 'grid'] },
    { tipo: 'numero', nome: 'itens', min: 1, max: 5 },
    { tipo: 'booleano', nome: 'descricao' },
  ],
  renderizar: (valores) => (
    <NumberedList aria-label="Passos" layout={valores.layout as NumberedListLayout} style={{ width: '100%' }}>
      {PASSOS.slice(0, Number(valores.itens)).map((passo) => (
        <NumberedList.Item description={valores.descricao ? passo.descricao : undefined} key={passo.titulo} title={passo.titulo} />
      ))}
    </NumberedList>
  ),
  codigo: (valores) =>
    gerarJsx(
      'NumberedList',
      [['layout', valores.layout, 'list']],
      gerarJsx('NumberedList.Item', [
        ['title', PASSOS[0].titulo],
        ['description', valores.descricao ? PASSOS[0].descricao : undefined],
      ]),
    ),
});

function Modos() {
  return (
    <div className="subsection">
      <h3>Lista e grade</h3>
      <div className="stack" style={{ width: '100%' }}>
        <NumberedList aria-label="Em lista">
          {PASSOS.slice(0, 3).map((passo) => (
            <NumberedList.Item description={passo.descricao} key={passo.titulo} title={passo.titulo} />
          ))}
        </NumberedList>
        <NumberedList aria-label="Em grade" layout="grid">
          {PASSOS.slice(0, 3).map((passo) => (
            <NumberedList.Item description={passo.descricao} key={passo.titulo} title={passo.titulo} />
          ))}
        </NumberedList>
      </div>
      <p className="note">Em lista, os passos descem um abaixo do outro. Em grade, viram ladrilhos que se ajustam à largura.</p>
      <VerCodigo
        codigo={`<NumberedList aria-label="Em lista">
  <NumberedList.Item title="Registre a conta" description="Banco, agência e número." />
  <NumberedList.Item title="Envie o extrato" description="Arquivo OFX do internet banking." />
  <NumberedList.Item title="Concilie" description="O sistema sugere os pares." />
</NumberedList>
<NumberedList aria-label="Em grade" layout="grid">
  <NumberedList.Item title="Registre a conta" description="Banco, agência e número." />
  <NumberedList.Item title="Envie o extrato" description="Arquivo OFX do internet banking." />
  <NumberedList.Item title="Concilie" description="O sistema sugere os pares." />
</NumberedList>`}
      />
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Passos da primeira vez',
      descricao: 'Em grade, dentro de um cartão: explica o que acontece depois da primeira conta.',
      largo: true,
      Previa: () => (
        <Card style={{ width: '100%' }}>
          <Card.Header description="O que acontece depois que a primeira conta existe." headingLevel={2} title="Como funciona" />
          <Card.Body>
            <NumberedList aria-label="Como funciona" layout="grid">
              {PASSOS.slice(0, 3).map((passo) => (
                <NumberedList.Item description={passo.descricao} key={passo.titulo} title={passo.titulo} />
              ))}
            </NumberedList>
          </Card.Body>
        </Card>
      ),
      codigo:
        '<Card>\n  <Card.Header title="Como funciona" />\n  <Card.Body>\n    <NumberedList aria-label="Como funciona" layout="grid">\n      <NumberedList.Item title="Registre a conta" description="Banco, agência e número." />\n      <NumberedList.Item title="Envie o extrato" description="Arquivo OFX do internet banking." />\n      <NumberedList.Item title="Concilie" description="O sistema sugere os pares." />\n    </NumberedList>\n  </Card.Body>\n</Card>',
    },
    {
      titulo: 'Instruções',
      descricao: 'Em lista, os passos de uma tarefa que a pessoa executa na ordem.',
      Previa: () => (
        <NumberedList aria-label="Importar o extrato" style={{ width: '100%' }}>
          <NumberedList.Item description="No internet banking, em Extratos." title="Baixe o arquivo OFX" />
          <NumberedList.Item description="Arraste o arquivo ou escolha no computador." title="Envie na tela de importação" />
          <NumberedList.Item title="Confira os lançamentos" />
        </NumberedList>
      ),
      codigo:
        '<NumberedList aria-label="Importar o extrato">\n  <NumberedList.Item title="Baixe o arquivo OFX" description="No internet banking, em Extratos." />\n  <NumberedList.Item title="Envie na tela de importação" />\n  <NumberedList.Item title="Confira os lançamentos" />\n</NumberedList>',
    },
  ],
  faca: {
    Previa: () => (
      <NumberedList aria-label="Como funciona" style={{ width: '100%' }}>
        <NumberedList.Item description="Banco, agência e número." title="Registre a conta" />
        <NumberedList.Item description="O sistema sugere os pares." title="Concilie" />
      </NumberedList>
    ),
    texto: 'NumberedList para explicar uma sequência, sem marcar onde a pessoa está.',
    codigo: `<NumberedList aria-label="Como funciona">
  <NumberedList.Item title="Registre a conta" description="Banco, agência e número." />
  <NumberedList.Item title="Concilie" description="O sistema sugere os pares." />
</NumberedList>`,
  },
  evite: {
    Previa: () => (
      <Steps
        items={[
          { key: 'dados', label: 'Dados' },
          { key: 'revisao', label: 'Revisão' },
        ]}
        label="Progresso"
      />
    ),
    texto: 'NumberedList para mostrar em que etapa de um processo a pessoa está: isso é o Steps, que tem etapa atual.',
    codigo: `<Steps
  label="Progresso"
  items={[
    { key: 'dados', label: 'Dados' },
    { key: 'revisao', label: 'Revisão' },
  ]}
/>`,
  },
  Modos,
  teclado: [{ teclas: ['Tab'], acao: 'A lista é estática e não tem teclado próprio: o foco passa direto pelo que houver dentro dos itens.' }],
  garantias: [
    { garantia: 'Lista ordenada', como: <>A lista é uma <code>ol</code> real, com um <code>li</code> por passo, na ordem de escrita.</>, teste: 'NumberedList.test.tsx' },
    { garantia: 'Layout', como: <><code>layout</code> chega à lista e aos itens.</>, teste: 'NumberedList.test.tsx' },
    { garantia: 'Props nativas', como: <>Lista e item repassam ref, <code>className</code> e atributos nativos.</>, teste: 'NumberedList.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <ol> e o ref na lista; as de <li> e o ref, no item.',
  api: [
    { nome: 'layout', tipo: "'list' | 'grid'", padrao: "'list'", descricao: 'Passos um abaixo do outro, ou ladrilhos numa grade que se ajusta à largura.' },
    { nome: 'NumberedList.Item', tipo: 'title: ReactNode', descricao: 'Um passo. O número vem da posição.' },
    { nome: 'description', tipo: 'ReactNode', descricao: 'Explicação abaixo do título.' },
  ],
};
