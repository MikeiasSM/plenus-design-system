import type { ReactNode } from 'react';
import { Card, CardMetric, formatCurrency, type CardTrailingWhenNarrow } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina } from '../estrutura/tipos';

const moeda = (valor: number) => formatCurrency(valor);
const moedaCompacta = (valor: number) => formatCurrency(valor, { compact: 'symbol' });

const DIAS = Array.from({ length: 30 }, (_, indice) => `${String(indice + 1).padStart(2, '0')}/10`);
const TICKET = [
  172, 168, 175, 181, 177, 169, 166, 174, 183, 188, 179, 176, 185, 191, 186, 180, 178, 189, 195, 192, 184, 182, 190, 198,
  193, 187, 191, 199, 196, 187.4,
];
const TITULOS = [
  { label: 'A vencer', value: 820000 },
  { label: 'Vencido até 30 dias', value: 190000 },
  { label: 'Vencido há mais de 30 dias', value: 45000 },
  { label: 'Vencido há mais de 90 dias', value: 18000 },
  { label: 'Créditos a compensar', value: -30000 },
];
const COMPARACOES = [
  { label: 'vs. mês anterior', change: 0.124, value: 168000, formatValue: moedaCompacta },
  { label: 'vs. mesmo mês do ano anterior', change: -0.031, value: -48600, formatValue: moedaCompacta },
];

const ESTADOS = ['normal', 'loading', 'updating', 'error'] as const;
const QUEBRAS = ['keep', 'wrap', 'hide'] as const;
const PARTES = ['nenhuma', 'Bar', 'Chart area', 'Chart line'] as const;
const POSICOES = ['abaixo', 'acima', 'ao lado'] as const;

/** Uma linha de cartoes do mesmo tamanho: a altura igual e do grid, e o valor fica ancorado no rodape. */
function Linha({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', width: '100%' }}>
      {children}
    </div>
  );
}

const playground = definirPlayground({
  inicial: {
    title: 'Valor Total de Compras',
    description: 'Valor total comprado no período analisado.',
    estado: 'normal',
    onActivate: true,
    compacto: false,
    trend: true,
    trailingWhenNarrow: 'keep',
    parte: 'nenhuma',
    posicao: 'abaixo',
    largura: 300,
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'opcoes', nome: 'estado', opcoes: ESTADOS },
    { tipo: 'booleano', nome: 'onActivate' },
    { tipo: 'booleano', nome: 'compacto' },
    { tipo: 'booleano', nome: 'trend' },
    { tipo: 'opcoes', nome: 'trailingWhenNarrow', opcoes: QUEBRAS },
    { tipo: 'opcoes', nome: 'parte', opcoes: PARTES },
    { tipo: 'opcoes', nome: 'posicao', opcoes: POSICOES },
    { tipo: 'numero', nome: 'largura', min: 180, max: 520, passo: 10 },
  ],
  renderizar: (valores, registrar) => {
    const valor = (
      <CardMetric.Value
        formatTooltipValue={valores.compacto ? moeda : undefined}
        formatValue={valores.compacto ? moedaCompacta : moeda}
        value={1523400.5}
      />
    );
    const extra =
      valores.parte === 'Bar' ? (
        <CardMetric.Bar formatValue={moeda} segments={TITULOS} title="Situação dos títulos" />
      ) : valores.parte === 'nenhuma' ? null : (
        <CardMetric.Chart
          categories={DIAS}
          formatValue={moeda}
          showTooltip
          title="Valor diário"
          type={valores.parte === 'Chart line' ? 'line' : 'area'}
          values={TICKET}
        />
      );

    return (
      <div style={{ maxWidth: '100%', width: Number(valores.largura) }}>
        <CardMetric
          error={valores.estado === 'error' ? 'Não foi possível carregar o valor.' : undefined}
          loading={valores.estado === 'loading'}
          onActivate={valores.onActivate ? () => registrar('onActivate') : undefined}
          updating={valores.estado === 'updating'}
        >
          <Card.Header
            description={valores.description || undefined}
            title={valores.title}
            trailing={valores.trend ? <CardMetric.Trend comparisons={COMPARACOES} /> : undefined}
            trailingWhenNarrow={valores.trailingWhenNarrow as CardTrailingWhenNarrow}
          />
          <CardMetric.Body orientation={valores.posicao === 'ao lado' && extra ? 'horizontal' : 'vertical'}>
            {valores.posicao === 'acima' ? extra : valor}
            {valores.posicao === 'acima' ? valor : extra}
          </CardMetric.Body>
        </CardMetric>
      </div>
    );
  },
  codigo: (valores) => {
    const cabecalho = gerarJsx('Card.Header', [
      ['title', valores.title],
      ['description', valores.description || undefined],
      ['trailing', valores.trend ? expr('<CardMetric.Trend comparisons={comparacoes} />') : undefined],
      ['trailingWhenNarrow', valores.trailingWhenNarrow, 'keep'],
    ]);
    const valor = gerarJsx('CardMetric.Value', [
      ['value', expr('valor')],
      ['formatValue', expr(valores.compacto ? 'moedaCompacta' : 'moeda')],
      ['formatTooltipValue', valores.compacto ? expr('moeda') : undefined],
    ]);
    const extra =
      valores.parte === 'Bar'
        ? gerarJsx('CardMetric.Bar', [['segments', expr('titulos')], ['title', 'Situação dos títulos'], ['formatValue', expr('moeda')]])
        : valores.parte === 'nenhuma'
          ? ''
          : gerarJsx('CardMetric.Chart', [
              ['type', valores.parte === 'Chart line' ? 'line' : 'area', 'area'],
              ['title', 'Valor diário'],
              ['categories', expr('dias')],
              ['values', expr('valoresPorDia')],
              ['showTooltip', true, false],
            ]);
    const partes = valores.posicao === 'acima' ? [extra, valor] : [valor, extra];
    const corpo = gerarJsx(
      'CardMetric.Body',
      [['orientation', valores.posicao === 'ao lado' && extra ? 'horizontal' : 'vertical', 'vertical']],
      partes.filter(Boolean).join('\n'),
    );

    return gerarJsx(
      'CardMetric',
      [
        ['onActivate', valores.onActivate ? expr('abrirDetalhe') : undefined],
        ['loading', valores.estado === 'loading', false],
        ['updating', valores.estado === 'updating', false],
        ['error', valores.estado === 'error' ? 'Não foi possível carregar o valor.' : undefined],
      ],
      `${cabecalho}\n${corpo}`,
    );
  },
});

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Uma linha de cartões</h3>
        <Linha>
          <CardMetric onActivate={() => undefined}>
            <Card.Header
              description="Vendas faturadas no período"
              title="Faturamento"
              trailing={<CardMetric.Trend comparisons={COMPARACOES} />}
            />
            <CardMetric.Body>
              <CardMetric.Value formatTooltipValue={moeda} formatValue={moedaCompacta} value={1523400.5} />
            </CardMetric.Body>
          </CardMetric>
          <CardMetric>
            <Card.Header description="Dias entre a venda e o recebimento" title="Prazo médio de recebimento" />
            <CardMetric.Body>
              <CardMetric.Value formatValue={(dias) => `${dias} dias`} value={38} />
              <CardMetric.Trend comparisons={[{ change: -0.08, label: 'vs. mês anterior', polarity: 'lowerIsBetter' }]} />
            </CardMetric.Body>
          </CardMetric>
          <CardMetric onActivate={() => undefined}>
            <Card.Header title="Contas a receber" trailing={<CardMetric.Trend comparisons={[{ change: 0.052, label: 'vs. mês anterior', polarity: 'lowerIsBetter' }]} />} />
            <CardMetric.Body>
              <CardMetric.Value formatTooltipValue={moeda} formatValue={moedaCompacta} label="Total em aberto" value={1043000} />
              <CardMetric.Bar formatValue={moeda} segments={TITULOS} title="Situação dos títulos" />
            </CardMetric.Body>
          </CardMetric>
          <CardMetric onActivate={() => undefined}>
            <Card.Header description="Por venda, nos últimos 30 dias" title="Ticket médio" />
            <CardMetric.Body orientation="horizontal">
              <CardMetric.Value formatValue={moeda} value={187.4} />
              <CardMetric.Chart categories={DIAS} formatValue={moeda} showTooltip title="Ticket médio diário" values={TICKET} />
            </CardMetric.Body>
          </CardMetric>
        </Linha>
        <p className="note">
          Os cartões de uma linha têm a mesma altura, e o valor fica ancorado no rodapé. O gráfico ocupa o que sobra; a
          tendência vai no cabeçalho ou junto do valor, como o produto montar.
        </p>
      </div>
      <div className="subsection">
        <h3>Barra vertical</h3>
        <div style={{ maxWidth: 320 }}>
          <CardMetric>
            <Card.Header description="Saldo atual em caixa e nas contas bancárias." title="Caixa e Banco Agora" />
            <CardMetric.Body>
              <CardMetric.Value formatTooltipValue={moeda} formatValue={moedaCompacta} value={51346.19} />
              <CardMetric.Bar
                formatValue={moeda}
                orientation="vertical"
                palette={{ base: '#67BD50' }}
                paletteOrder="byValue"
                segments={[
                  { label: 'C C SICREDI - 930-0', value: 47269.82 },
                  { label: 'C C BCO BRASIL - 11.212-7', value: 2636.48 },
                  { label: 'DINHEIRO (CAIXA)', value: 1218.69 },
                  { label: 'DINHEIRO (RETAGUARDA)', value: 221.2 },
                ]}
                smallSegmentThreshold={0.05}
                title="Composição do saldo"
              />
            </CardMetric.Body>
          </CardMetric>
        </div>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Passa pelo cartão ativável e, dentro dele, pelas ações do produto, a tendência, o valor compacto, a barra e o gráfico com pontos clicáveis.' },
    { teclas: ['Enter', 'Espaço'], acao: 'No cartão, chama onActivate.' },
    { teclas: ['Esc'], acao: 'Fecha o balão aberto pelo foco.' },
    { teclas: ['←', '→'], acao: 'No gráfico com onPointClick, percorre os pontos.' },
  ],
  garantias: [
    { garantia: 'Ativação sem botão aninhado', como: 'Um botão cobre o cartão, abaixo dos controles; o clique num controle não chama onActivate.', teste: 'CardMetric.test.tsx' },
    { garantia: 'Nome da ativação', como: '"Abrir detalhes de" e o título do Card.Header.', teste: 'CardMetric.test.tsx' },
    { garantia: 'Estados', como: <>Carregando e atualizando marcam <code>aria-busy</code>; o erro vira alerta no lugar do valor.</>, teste: 'CardMetric.test.tsx' },
    { garantia: 'Tendência lida como frase', como: '"Alta de 12,4%, vs. mês anterior", com todas as comparações.', teste: 'CardMetric.test.tsx' },
    { garantia: 'Cor pela polaridade', como: <>Sinal e <code>polarity</code> decidem o tom; <code>tone</code> e <code>direction</code> o forçam.</>, teste: 'comparisonTone.test.ts' },
    { garantia: 'Barra como imagem nomeada', como: 'Cada segmento e o total no nome, uma parada de Tab que abre o balão.', teste: 'CardMetricBar.test.tsx' },
    { garantia: 'Negativo fora de Outros', como: 'Só os positivos pequenos se reúnem no balão.', teste: 'CardMetricBar.test.tsx' },
  ],
  notaDaApi: 'Cada parte aceita as propriedades nativas da sua raiz, o ref e a className. As partes só existem dentro do CardMetric; o cabeçalho é o Card.Header.',
  api: [
    { nome: 'CardMetric onActivate', tipo: '() => void', descricao: 'Abre o detalhe. Com ele, um botão cobre o cartão.' },
    { nome: 'CardMetric activateLabel', tipo: 'string', descricao: 'Nome do botão. Padrão: "Abrir detalhes de" e o título.' },
    { nome: 'CardMetric loading', tipo: 'boolean', padrao: 'false', descricao: 'Esqueleto em cada parte; o título continua.' },
    { nome: 'CardMetric updating', tipo: 'boolean', padrao: 'false', descricao: 'Dados na tela e uma linha no topo enquanto os novos chegam.' },
    { nome: 'CardMetric error', tipo: 'string', descricao: 'Mensagem no lugar do valor; as demais partes saem.' },
    { nome: 'Card.Header trailingWhenNarrow', tipo: "'keep' | 'wrap' | 'hide'", padrao: "'keep'", descricao: 'O que o trailing faz quando o título numa linha não cabe ao lado dele.' },
    { nome: 'CardMetric.Body orientation', tipo: "'vertical' | 'horizontal'", padrao: "'vertical'", descricao: 'Em horizontal, as partes dividem a largura.' },
    { nome: 'CardMetric.Value value', tipo: 'number | null', descricao: 'Obrigatório. Nulo mostra o emptyValue.' },
    { nome: 'CardMetric.Value label', tipo: 'string', descricao: 'Rótulo acima do valor.' },
    { nome: 'CardMetric.Value emptyValue', tipo: 'string', padrao: "'—'", descricao: 'O que aparece sem valor.' },
    { nome: 'CardMetric.Value formatValue', tipo: '(value: number) => string', padrao: 'formatNumber', descricao: 'O que aparece, que pode sair compacto.' },
    { nome: 'CardMetric.Value formatTooltipValue', tipo: '(value: number) => string', descricao: 'Valor exato no balão e na impressão.' },
    { nome: 'CardMetric.Trend comparisons', tipo: 'CardMetricComparison[]', descricao: 'Obrigatório. O selo mostra a primeira; o balão, todas. change é fração.' },
    { nome: 'CardMetric.Trend formatPercent', tipo: '(ratio: number) => string', descricao: 'Formato do percentual. Padrão: uma casa decimal.' },
    { nome: 'CardMetric.Bar segments', tipo: 'CardMetricSegment[]', descricao: 'Obrigatório. Negativos ocupam a magnitude, tracejados.' },
    { nome: 'CardMetric.Bar title', tipo: 'string', descricao: 'Obrigatório. Nomeia a imagem e o balão.' },
    { nome: 'CardMetric.Bar total', tipo: 'number', descricao: 'Total do balão. Padrão: a soma com sinal.' },
    { nome: 'CardMetric.Bar orientation', tipo: "'horizontal' | 'vertical'", padrao: "'horizontal'", descricao: 'Vertical fica à esquerda das outras partes.' },
    { nome: 'CardMetric.Bar palette', tipo: 'ChartPalette', descricao: 'Lista em rotação ou { base }, que gera os tons.' },
    { nome: 'CardMetric.Bar paletteOrder', tipo: "'byIndex' | 'byValue'", padrao: "'byIndex'", descricao: 'byValue dá a primeira cor ao maior segmento.' },
    { nome: 'CardMetric.Bar smallSegmentThreshold', tipo: 'number', padrao: '0.02', descricao: 'Fração abaixo da qual os positivos se reúnem no balão; 0 desliga.' },
    { nome: 'CardMetric.Bar otherLabel', tipo: 'string', padrao: "'Outros'", descricao: 'Nome da linha reunida.' },
    { nome: 'CardMetric.Bar showPercent', tipo: 'boolean', padrao: 'true', descricao: 'Coluna de percentual no balão e no nome.' },
    { nome: 'CardMetric.Chart type', tipo: "'area' | 'line'", padrao: "'area'", descricao: 'ChartArea ou ChartLine, sem eixos, legenda nem pontos.' },
    { nome: 'CardMetric.Chart title', tipo: 'string', descricao: 'Obrigatório. Nome do gráfico e título do balão.' },
    { nome: 'CardMetric.Chart categories / values', tipo: 'string[] / (number | null)[]', descricao: 'Obrigatórios. Uma série só.' },
    { nome: 'CardMetric.Chart showTooltip', tipo: 'boolean', padrao: 'false', descricao: 'Balão no ponteiro; o clique ainda abre o cartão.' },
    { nome: 'CardMetric.Chart onPointClick', tipo: '(point: ChartMarkClick) => void', descricao: 'Pontos viram botões; o clique no gráfico deixa de abrir o cartão.' },
    { nome: 'CardMetric.Chart minHeight', tipo: 'number', padrao: '48', descricao: 'Piso da altura, em pixels.' },
  ],
};
