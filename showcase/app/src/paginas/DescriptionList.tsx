import { Card, DescriptionList, type DescriptionListLayout } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const playground = definirPlayground({
  inicial: { layout: 'stacked', destaque: false },
  controles: [
    { tipo: 'opcoes', nome: 'layout', opcoes: ['stacked', 'inline'] },
    { tipo: 'booleano', nome: 'destaque' },
  ],
  renderizar: (valores) => (
    <DescriptionList layout={valores.layout as DescriptionListLayout} style={{ width: '100%' }}>
      <DescriptionList.Item term="Cliente">Ana Prado</DescriptionList.Item>
      <DescriptionList.Item term="Entrega">12/11/2026</DescriptionList.Item>
      <DescriptionList.Item emphasis={Boolean(valores.destaque)} term="Total">
        R$ 1.250,00
      </DescriptionList.Item>
    </DescriptionList>
  ),
  codigo: (valores) =>
    gerarJsx(
      'DescriptionList',
      [['layout', valores.layout, 'stacked']],
      [
        gerarJsx('DescriptionList.Item', [['term', 'Cliente']], 'Ana Prado'),
        gerarJsx('DescriptionList.Item', [['term', 'Entrega']], '12/11/2026'),
        gerarJsx('DescriptionList.Item', [['term', 'Total'], ['emphasis', valores.destaque, false]], 'R$ 1.250,00'),
      ].join('\n'),
    ),
});

function Modos() {
  return (
    <div className="subsection">
      <h3>Empilhado e em linha</h3>
      <div className="stack" style={{ width: '100%' }}>
        <DescriptionList aria-label="Empilhado">
          <DescriptionList.Item term="Cliente">Ana Prado</DescriptionList.Item>
          <DescriptionList.Item term="Entrega">12/11/2026</DescriptionList.Item>
        </DescriptionList>
        <DescriptionList aria-label="Em linha" layout="inline">
          <DescriptionList.Item term="Subtotal">R$ 1.200,00</DescriptionList.Item>
          <DescriptionList.Item term="Frete">R$ 50,00</DescriptionList.Item>
        </DescriptionList>
      </div>
      <p className="note">
        Empilhado, o termo fica em cima, discreto, e a descrição embaixo: serve para detalhes de um registro. Em linha, o termo fica à
        esquerda e a descrição à direita, com algarismos tabulares: serve para valores que se comparam.
      </p>
      <VerCodigo
        codigo={`<DescriptionList aria-label="Empilhado">
  <DescriptionList.Item term="Cliente">Ana Prado</DescriptionList.Item>
  <DescriptionList.Item term="Entrega">12/11/2026</DescriptionList.Item>
</DescriptionList>
<DescriptionList aria-label="Em linha" layout="inline">
  <DescriptionList.Item term="Subtotal">R$ 1.200,00</DescriptionList.Item>
  <DescriptionList.Item term="Frete">R$ 50,00</DescriptionList.Item>
</DescriptionList>`}
      />
      <h3>Destaque</h3>
      <div style={{ width: '100%' }}>
        <DescriptionList aria-label="Totais" layout="inline">
          <DescriptionList.Item term="Subtotal">R$ 1.200,00</DescriptionList.Item>
          <DescriptionList.Item term="Frete">R$ 50,00</DescriptionList.Item>
          <DescriptionList.Item emphasis term="Total">
            R$ 1.250,00
          </DescriptionList.Item>
        </DescriptionList>
      </div>
      <p className="note">
        <code>emphasis</code> é a forma de marcar o total: linha separadora acima e peso de rótulo. É um desvio pequeno do padrão do
        Polaris e do Ant Design, que não têm linha de total; use só para a linha que fecha a soma, uma por lista.
      </p>
      <VerCodigo
        codigo={`<DescriptionList aria-label="Totais" layout="inline">
  <DescriptionList.Item term="Subtotal">R$ 1.200,00</DescriptionList.Item>
  <DescriptionList.Item term="Frete">R$ 50,00</DescriptionList.Item>
  <DescriptionList.Item term="Total" emphasis>R$ 1.250,00</DescriptionList.Item>
</DescriptionList>`}
      />
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Detalhes de um pedido',
      descricao: 'Empilhado, dentro de um cartão: o dado de cada campo logo abaixo do nome dele.',
      Previa: () => (
        <Card style={{ width: '100%' }}>
          <Card.Header headingLevel={2} title="Detalhes" />
          <Card.Body>
            <DescriptionList>
              <DescriptionList.Item term="Número">PD-2041</DescriptionList.Item>
              <DescriptionList.Item term="Cliente">Comércio Aurora</DescriptionList.Item>
              <DescriptionList.Item term="Entrega">12/11/2026</DescriptionList.Item>
            </DescriptionList>
          </Card.Body>
        </Card>
      ),
      codigo:
        '<Card>\n  <Card.Header headingLevel={2} title="Detalhes" />\n  <Card.Body>\n    <DescriptionList>\n      <DescriptionList.Item term="Número">PD-2041</DescriptionList.Item>\n      <DescriptionList.Item term="Cliente">Comércio Aurora</DescriptionList.Item>\n      <DescriptionList.Item term="Entrega">12/11/2026</DescriptionList.Item>\n    </DescriptionList>\n  </Card.Body>\n</Card>',
    },
    {
      titulo: 'Resumo com total',
      descricao: 'Em linha, com o total destacado na última linha.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <DescriptionList aria-label="Resumo" layout="inline">
            <DescriptionList.Item term="Itens (3)">R$ 1.200,00</DescriptionList.Item>
            <DescriptionList.Item term="Desconto">- R$ 100,00</DescriptionList.Item>
            <DescriptionList.Item term="Frete">R$ 50,00</DescriptionList.Item>
            <DescriptionList.Item emphasis term="Total">
              R$ 1.150,00
            </DescriptionList.Item>
          </DescriptionList>
        </div>
      ),
      codigo:
        '<DescriptionList aria-label="Resumo" layout="inline">\n  <DescriptionList.Item term="Itens (3)">R$ 1.200,00</DescriptionList.Item>\n  <DescriptionList.Item term="Desconto">- R$ 100,00</DescriptionList.Item>\n  <DescriptionList.Item term="Frete">R$ 50,00</DescriptionList.Item>\n  <DescriptionList.Item term="Total" emphasis>R$ 1.150,00</DescriptionList.Item>\n</DescriptionList>',
    },
  ],
  faca: {
    Previa: () => (
      <DescriptionList style={{ width: '100%' }}>
        <DescriptionList.Item term="Cliente">Ana Prado</DescriptionList.Item>
        <DescriptionList.Item term="Entrega">12/11/2026</DescriptionList.Item>
      </DescriptionList>
    ),
    texto: 'DescriptionList para pares de nome e valor: a lista de descrição dá ao leitor de tela a relação entre o termo e o dado.',
    codigo: `<DescriptionList>
  <DescriptionList.Item term="Cliente">Ana Prado</DescriptionList.Item>
  <DescriptionList.Item term="Entrega">12/11/2026</DescriptionList.Item>
</DescriptionList>`,
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <div className="stack">
          <div>
            <b>Cliente:</b> Ana Prado
          </div>
          <div>
            <b>Entrega:</b> 12/11/2026
          </div>
        </div>
      </div>
    ),
    texto: 'Montar pares de nome e valor com div e negrito: sem a lista de descrição, o leitor de tela não relaciona o nome ao valor.',
    codigo: `<div>
  <b>Cliente:</b> Ana Prado
</div>
<div>
  <b>Entrega:</b> 12/11/2026
</div>`,
  },
  Modos,
  teclado: [{ teclas: ['Tab'], acao: 'A lista é estática e não tem teclado próprio: o foco passa direto pelo que houver dentro das descrições.' }],
  garantias: [
    { garantia: 'HTML válido', como: <>A lista é uma <code>dl</code> e cada par, uma <code>div</code> com <code>dt</code> e <code>dd</code>.</>, teste: 'DescriptionList.test.tsx' },
    { garantia: 'Layout', como: <><code>layout</code> fica na raiz, e o estilo o leva aos itens dela, sem vazar para uma lista aninhada; o padrão é <code>stacked</code>.</>, teste: 'DescriptionList.test.tsx' },
    { garantia: 'Destaque', como: <><code>emphasis</code> marca só o item que o recebe.</>, teste: 'DescriptionList.test.tsx' },
    { garantia: 'Props nativas', como: <>Lista e item repassam ref, <code>className</code> e atributos nativos.</>, teste: 'DescriptionList.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <dl> e o ref na lista; as de <div> e o ref, no item.',
  api: [
    { nome: 'layout', tipo: "'stacked' | 'inline'", padrao: "'stacked'", descricao: 'Termo em cima da descrição, ou termo à esquerda e descrição à direita.' },
    { nome: 'DescriptionList.Item', tipo: 'term: ReactNode', descricao: 'Um par. O termo vai no dt; os filhos, no dd.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'A descrição do termo.' },
    { nome: 'emphasis', tipo: 'boolean', padrao: 'false', descricao: 'Destaca a linha, como a de um total: separador acima e peso de rótulo.' },
  ],
};
