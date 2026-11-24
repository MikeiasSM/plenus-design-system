import { Card, CardMetric, Sparkline, formatCurrency, type SparklineVariant } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

/** Serie pseudoaleatoria e estavel entre recargas, para a previa nao mudar a cada visita. */
function serie(semente: number, quantidade: number, inicio: number, deriva: number) {
  let valor = inicio;
  let estado = semente;

  return Array.from({ length: quantidade }, () => {
    estado = (estado * 9301 + 49297) % 233280;
    valor += deriva + (estado / 233280 - 0.5) * inicio * 0.08;
    return Math.round(Math.max(1, valor));
  });
}

const VENDAS = serie(3, 30, 18200, 70);
const PEDIDOS = serie(7, 30, 640, -3);
const TICKET = serie(11, 30, 182, 0.6);
const LOJAS = [
  { nome: 'Centro', dados: serie(5, 30, 41200, 120) },
  { nome: 'Shopping Norte', dados: serie(9, 30, 38900, -90) },
  { nome: 'Aeroporto', dados: serie(13, 30, 22100, 60) },
  { nome: 'Rodoviária', dados: serie(17, 30, 15400, -40) },
];
const MOEDA: Intl.NumberFormatOptions = { currency: 'BRL', maximumFractionDigits: 0, style: 'currency' };

const ultimo = (dados: readonly number[]) => dados[dados.length - 1];
const moeda = (valor: number) => formatCurrency(valor, { decimals: 0 });
const moedaCompacta = (valor: number) => formatCurrency(valor, { compact: 'symbol' });

const playground = definirPlayground({
  inicial: {
    label: 'Vendas nos últimos 30 dias',
    variant: 'line',
    pontos: 30,
    height: 24,
    largura: 160,
    lacuna: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'variant', opcoes: ['line', 'bar'] },
    { tipo: 'numero', nome: 'pontos', min: 0, max: 30 },
    { tipo: 'numero', nome: 'height', min: 12, max: 64, passo: 4 },
    { tipo: 'numero', nome: 'largura', min: 0, max: 480, passo: 20 },
    { tipo: 'booleano', nome: 'lacuna' },
  ],
  renderizar: (valores) => {
    const dados = VENDAS.slice(0, valores.pontos).map((valor, indice) => (valores.lacuna && indice === 12 ? Number.NaN : valor));

    return (
      <Sparkline
        data={dados}
        height={valores.height}
        label={valores.label || undefined}
        variant={valores.variant as SparklineVariant}
        width={valores.largura || undefined}
      />
    );
  },
  codigo: (valores) =>
    gerarJsx('Sparkline', [
      ['data', expr('vendas')],
      ['label', valores.label || undefined],
      ['variant', valores.variant, 'line'],
      ['height', valores.height, 24],
      ['width', valores.largura || undefined],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: 'A imagem é nomeada pelo label seguido da tendência, do primeiro ao último valor.' }
        : { nivel: 'atencao', titulo: 'Sem label', detalhe: 'O nome fica só com a tendência, sem dizer do que ela é. Prefira um label, a menos que o contexto já o diga.' },
    ];

    if (valores.pontos < 2) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: valores.pontos === 0 ? 'Sem dados' : 'Um valor só',
        detalhe: valores.pontos === 0 ? 'Nada é desenhado e o nome diz "sem dados".' : 'Sem tendência: o nome traz só o valor.',
      });
    }

    if (valores.lacuna) {
      verificacoes.push({ nivel: 'ok', titulo: 'Valor ausente', detalhe: 'O NaN abre um vão na linha e fica sem barra; a tendência usa os valores válidos.' });
    }

    if (valores.height > 32) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Alto para uma sparkline', detalhe: 'Acima da altura de uma linha de texto, o CardMetric.Chart ou um gráfico completo comunicam melhor.' });
    }

    return verificacoes;
  },
});

function CartoesComSparkline() {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', width: '100%' }}>
      <CardMetric>
        <Card.Header title="Vendas" description="Últimos 30 dias" />
        <CardMetric.Body orientation="horizontal">
          <CardMetric.Value value={ultimo(VENDAS)} formatValue={moedaCompacta} formatTooltipValue={moeda} />
          <Sparkline data={VENDAS} format={MOEDA} label="Vendas nos últimos 30 dias" />
        </CardMetric.Body>
      </CardMetric>
      <CardMetric>
        <Card.Header title="Pedidos" description="Últimos 30 dias" />
        <CardMetric.Body orientation="horizontal">
          <CardMetric.Value value={ultimo(PEDIDOS)} />
          <Sparkline data={PEDIDOS} label="Pedidos nos últimos 30 dias" variant="bar" />
        </CardMetric.Body>
      </CardMetric>
      <CardMetric loading>
        <Card.Header title="Ticket médio" description="Últimos 30 dias" />
        <CardMetric.Body orientation="horizontal">
          <CardMetric.Value value={ultimo(TICKET)} formatValue={moeda} />
          <Sparkline data={TICKET} label="Ticket médio nos últimos 30 dias" />
        </CardMetric.Body>
      </CardMetric>
    </div>
  );
}

const celula = { borderBottom: '1px solid var(--pl-color-border)', padding: '8px 10px', textAlign: 'left' as const };
const numero = { ...celula, fontVariantNumeric: 'tabular-nums', textAlign: 'right' as const };

function TabelaComSparkline() {
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
      <thead>
        <tr>
          <th style={celula} scope="col">Loja</th>
          <th style={numero} scope="col">Vendas</th>
          <th style={celula} scope="col">30 dias</th>
        </tr>
      </thead>
      <tbody>
        {LOJAS.map((loja) => (
          <tr key={loja.nome}>
            <td style={celula}>{loja.nome}</td>
            <td style={numero}>{moedaCompacta(ultimo(loja.dados))}</td>
            <td style={{ ...celula, width: 120 }}>
              <Sparkline data={loja.dados} height={20} label={`Vendas de ${loja.nome} nos últimos 30 dias`} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Uma imagem só</dt>
        <dd>
          O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>label</code> seguido da tendência: direção,
          variação e o trecho do primeiro ao último valor. Não há leitura ponto a ponto, balão nem foco; quem precisa dos
          valores usa o gráfico completo ou a visão em tabela dele.
        </dd>
        <dt>A tendência</dt>
        <dd>
          Compara o primeiro e o último valor válido. Uma variação que arredonda para 0% é estável. Com o primeiro valor
          zero, não há porcentagem: fica só a direção.
        </dd>
        <dt>Cor</dt>
        <dd>
          A da primeira série dos gráficos, sem tom de status: subir não é bom por si só, e quem diz se é o texto ao lado.
          Em cores forçadas, vira <code>CanvasText</code>.
        </dd>
        <dt>Linha e barras</dt>
        <dd>
          A linha ocupa a altura entre o menor e o maior valor e marca o último ponto. As barras partem do zero, e o
          negativo desce dele.
        </dd>
        <dt>No CardMetric</dt>
        <dd>
          Entra no <code>CardMetric.Body</code> como as partes, sem prop nova. Lê o estado da moldura: carregando vira
          esqueleto da mesma altura; com erro, sai.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <Sparkline data={[]} label="Vendas nos últimos 30 dias" width={120} />
        <p className="note">Sem valores válidos, nada é desenhado e o nome diz &quot;Vendas nos últimos 30 dias: sem dados&quot;.</p>
        <VerCodigo codigo={`<Sparkline data={[]} label="Vendas nos últimos 30 dias" width={120} />`} />
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'No CardMetric',
      descricao: 'Ao lado do valor, no Body horizontal. O terceiro cartão carrega: a sparkline acompanha a moldura e vira esqueleto.',
      largo: true,
      Previa: CartoesComSparkline,
      codigo: `<CardMetric>
  <Card.Header title="Vendas" description="Últimos 30 dias" />
  <CardMetric.Body orientation="horizontal">
    <CardMetric.Value value={ultima} formatValue={moedaCompacta} formatTooltipValue={moeda} />
    <Sparkline
      data={vendas}
      label="Vendas nos últimos 30 dias"
      format={{ style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }}
    />
  </CardMetric.Body>
</CardMetric>

<CardMetric>
  <Card.Header title="Pedidos" description="Últimos 30 dias" />
  <CardMetric.Body orientation="horizontal">
    <CardMetric.Value value={ultimo} />
    <Sparkline data={pedidos} label="Pedidos nos últimos 30 dias" variant="bar" />
  </CardMetric.Body>
</CardMetric>`,
    },
    {
      titulo: 'Numa célula de tabela',
      descricao: 'Na altura de uma linha de texto, com a largura da coluna. Cada célula nomeia a própria loja.',
      largo: true,
      Previa: TabelaComSparkline,
      codigo: `<td>
  <Sparkline data={loja.vendas} height={20} label={\`Vendas de \${loja.nome} nos últimos 30 dias\`} />
</td>`,
    },
    {
      titulo: 'Outra localidade',
      descricao: 'O format leva as opções do Intl.NumberFormat; locale e labels traduzem a frase.',
      Previa: () => (
        <Sparkline
          data={[1200, 1350, 1280, 1500]}
          format={{ currency: 'USD', maximumFractionDigits: 0, style: 'currency' }}
          label="Sales, last 4 weeks"
          labels={{ down: 'down', empty: 'no data', range: (first, last) => `from ${first} to ${last}`, stable: 'flat', up: 'up' }}
          locale="en-US"
          width={160}
        />
      ),
      codigo: `<Sparkline
  data={[1200, 1350, 1280, 1500]}
  label="Sales, last 4 weeks"
  locale="en-US"
  format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
  labels={{ up: 'up', down: 'down', stable: 'flat', empty: 'no data', range: (first, last) => \`from \${first} to \${last}\` }}
  width={160}
/>
// "Sales, last 4 weeks: up 25%, from $1,200 to $1,500"`,
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Nome acessível', como: <>Uma imagem, <code>role=&quot;img&quot;</code>, nomeada pelo <code>label</code> e pela tendência calculada.</>, teste: 'Sparkline.test.tsx' },
    { garantia: 'Sem leitura ponto a ponto', como: 'Nenhuma marca tem nome, título ou foco.', teste: 'Sparkline.test.tsx' },
    { garantia: 'Número inválido', como: 'NaN e infinito abrem um vão na linha e ficam sem barra; a tendência usa os válidos.', teste: 'Sparkline.test.tsx' },
    { garantia: 'Barras do zero', como: 'As barras partem do zero, e o negativo desce dele.', teste: 'Sparkline.test.tsx' },
    { garantia: 'Traço sem distorção', como: 'O desenho estica na horizontal, mas o traço e o ponto final mantêm a espessura, por vector-effect.', teste: 'Sparkline.test.tsx' },
    { garantia: 'Movimento reduzido', como: 'A entrada da esquerda para a direita sai.', teste: 'Sparkline.test.tsx' },
    { garantia: 'Cores forçadas', como: <>O desenho fica em <code>CanvasText</code>.</>, teste: 'Sparkline.test.tsx' },
    { garantia: 'Estados do CardMetric', como: 'Dentro da moldura, carregando vira esqueleto e, com erro, sai.', teste: 'Sparkline.test.tsx' },
  ],
  api: [
    { nome: 'data', tipo: 'readonly number[]', descricao: 'Os valores, na ordem do tempo. Um valor que não é número abre um vão.' },
    { nome: 'variant', tipo: "'line' | 'bar'", padrao: "'line'", descricao: 'Linha com o último ponto marcado, ou barras a partir do zero.' },
    { nome: 'label', tipo: 'string', descricao: 'Abre o nome acessível, antes da tendência: "Vendas nos últimos 30 dias".' },
    { nome: 'labels', tipo: 'Partial<SparklineLabels>', descricao: <><code>{'{ up, down, stable, empty, range(first, last) }'}</code>. Padrão: sobe, cai, estável, sem dados e &quot;de … a …&quot;.</> },
    { nome: 'format', tipo: 'Intl.NumberFormatOptions', padrao: "{ notation: 'compact', maximumFractionDigits: 1 }", descricao: 'Formato do primeiro e do último valor no nome.' },
    { nome: 'locale', tipo: 'string', padrao: "'pt-BR'", descricao: 'Localidade dos números e da porcentagem.' },
    { nome: 'height', tipo: 'number', padrao: '24', descricao: 'Altura em pixels.' },
    { nome: 'width', tipo: 'number | string', padrao: "'100%'", descricao: 'Largura em pixels ou qualquer medida CSS.' },
    { nome: 'aria-label', tipo: 'string', descricao: 'Substitui o nome calculado inteiro.' },
  ],
};
