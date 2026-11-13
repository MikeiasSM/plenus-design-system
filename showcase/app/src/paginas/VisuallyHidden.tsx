import { Button, ButtonIcon, Card, IconTrash, Table, VisuallyHidden } from '@plenustech/design-system';
import { definirPlayground, type Pagina } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const lancamentos = [
  { id: 'l1', descricao: 'Aluguel do galpão', valor: 'R$ 4.800,00' },
  { id: 'l2', descricao: 'Frete de outubro', valor: 'R$ 1.260,00' },
];

/** A coluna de ações não leva rótulo na tela: o botão de cada linha já mostra o que faz. */
function TabelaComAcoes({ cabecalho }: { cabecalho: string }) {
  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Card.Body flush>
          <Table label="Lançamentos" size="sm">
            <Table.Header>
              <Table.Column id="descricao">Descrição</Table.Column>
              <Table.Column id="valor" numeric>Valor</Table.Column>
              <Table.Column id="acoes">
                <VisuallyHidden>{cabecalho}</VisuallyHidden>
              </Table.Column>
            </Table.Header>
            <Table.Body items={lancamentos}>
              {(lancamento) => (
                <Table.Row id={lancamento.id}>
                  <Table.Cell>{lancamento.descricao}</Table.Cell>
                  <Table.Cell>{lancamento.valor}</Table.Cell>
                  <Table.Cell>
                    <ButtonIcon icon={<IconTrash />} label={`Excluir ${lancamento.descricao}`} size="sm" variant="ghost" />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

const codigoDaTabela = (cabecalho: string) => `const lancamentos = [
  { id: 'l1', descricao: 'Aluguel do galpão', valor: 'R$ 4.800,00' },
  { id: 'l2', descricao: 'Frete de outubro', valor: 'R$ 1.260,00' },
];

<Card>
  <Card.Body flush>
    <Table label="Lançamentos" size="sm">
      <Table.Header>
        <Table.Column id="descricao">Descrição</Table.Column>
        <Table.Column id="valor" numeric>Valor</Table.Column>
        <Table.Column id="acoes">
          <VisuallyHidden>${cabecalho}</VisuallyHidden>
        </Table.Column>
      </Table.Header>
      <Table.Body items={lancamentos}>
        {(lancamento) => (
          <Table.Row id={lancamento.id}>
            <Table.Cell>{lancamento.descricao}</Table.Cell>
            <Table.Cell>{lancamento.valor}</Table.Cell>
            <Table.Cell>
              <ButtonIcon icon={<IconTrash />} label={\`Excluir \${lancamento.descricao}\`} size="sm" variant="ghost" />
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  </Card.Body>
</Card>`;

const playground = definirPlayground({
  inicial: { texto: 'Ações' },
  controles: [{ tipo: 'texto', nome: 'texto' }],
  renderizar: (valores) => (
    <div className="stack" style={{ width: '100%' }}>
      <TabelaComAcoes cabecalho={String(valores.texto)} />
      <p className="note">
        A última coluna não mostra rótulo. O cabeçalho &quot;{String(valores.texto)}&quot; está no <code>VisuallyHidden</code>: o leitor
        de tela o anuncia ao entrar na coluna.
      </p>
    </div>
  ),
  codigo: (valores) => codigoDaTabela(String(valores.texto)),
});

function Modos() {
  return (
    <div className="subsection">
      <h3>Elemento</h3>
      <p>
        Saldo em conta: R$ 1.200,00
        <VisuallyHidden as="strong"> (positivo)</VisuallyHidden>
      </p>
      <p className="note">
        O padrão é <code>span</code>; <code>as</code> troca o elemento quando a semântica pede outro. O texto oculto acima,
        &quot;(positivo)&quot;, só o leitor de tela ouve.
      </p>
      <VerCodigo
        codigo={`<p>
  Saldo em conta: R$ 1.200,00
  <VisuallyHidden as="strong"> (positivo)</VisuallyHidden>
</p>`}
      />
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Cabeçalho da coluna de ações',
      descricao: 'A coluna dos botões não leva rótulo na tela, mas a tabela continua com todas as colunas nomeadas.',
      largo: true,
      Previa: () => (
        <div className="stack" style={{ width: '100%' }}>
          <TabelaComAcoes cabecalho="Remover" />
          <p className="note">Texto oculto: &quot;Remover&quot;, o nome da última coluna.</p>
        </div>
      ),
      codigo: codigoDaTabela('Remover'),
    },
    {
      titulo: 'Contexto para o leitor de tela',
      descricao: 'Completa um dado que a tela mostra só pela cor.',
      Previa: () => (
        <div className="stack">
          <p>
            Situação: <span style={{ color: 'var(--pl-color-danger-text)' }}>Vencida</span>
            <VisuallyHidden>, atenção: pagamento em atraso</VisuallyHidden>
          </p>
          <p className="note">Texto oculto: &quot;, atenção: pagamento em atraso&quot;.</p>
        </div>
      ),
      codigo: `<p>
  Situação: <span style={{ color: 'var(--pl-color-danger-text)' }}>Vencida</span>
  <VisuallyHidden>, atenção: pagamento em atraso</VisuallyHidden>
</p>`,
    },
  ],
  faca: {
    Previa: () => <TabelaComAcoes cabecalho="Remover" />,
    texto: (
      <>
        <code>VisuallyHidden</code> no cabeçalho de uma coluna que a tela não rotula, como a de ações: o leitor de tela sabe em que
        coluna está, e a tela não repete um rótulo que o botão já mostra.
      </>
    ),
    codigo: codigoDaTabela('Remover'),
  },
  evite: {
    Previa: () => (
      <div className="stack">
        <Button size="sm" variant="ghost">
          <IconTrash aria-hidden />
          <VisuallyHidden>Excluir lançamento</VisuallyHidden>
        </Button>
        <p className="note">Texto oculto: &quot;Excluir lançamento&quot;. O nome chega ao leitor de tela, mas o botão fica sem a dica.</p>
      </div>
    ),
    texto: (
      <>
        <code>VisuallyHidden</code> para nomear um botão só com ícone. O <code>ButtonIcon</code> faz isso pelo <code>label</code>, que vira
        o nome do botão e a dica que quem enxerga vê ao passar o ponteiro ou chegar pelo teclado.
      </>
    ),
    codigo: `<Button size="sm" variant="ghost">
  <IconTrash aria-hidden />
  <VisuallyHidden>Excluir lançamento</VisuallyHidden>
</Button>`,
  },
  Modos,
  garantias: [
    {
      garantia: 'Fora da vista, dentro da árvore',
      como: <>A regra do React Aria e do Radix tira o texto da vista e do fluxo; ele continua no nome acessível do elemento pai.</>,
      teste: 'VisuallyHidden.test.tsx',
    },
    { garantia: 'Elemento', como: <>Renderiza um <code>span</code> e troca por <code>as</code>.</>, teste: 'VisuallyHidden.test.tsx' },
    { garantia: 'Props nativas', como: <>Repassa ref, <code>className</code> e atributos nativos.</>, teste: 'VisuallyHidden.test.tsx' },
  ],
  notaDaApi: 'Além desta, as propriedades nativas de <span> (ou do elemento de as) e o ref.',
  api: [{ nome: 'as', tipo: 'ElementType', padrao: "'span'", descricao: 'Elemento ou componente renderizado.' }],
};
