import { useState } from 'react';
import {
  ChartBar,
  ChartSunburst,
  ChartTooltip,
  formatCurrency,
  resolveSeriesColors,
  type ChartHoveredNode,
  type ChartTooltipTotal,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import {
  COMPOSICAO,
  DESPESAS,
  FATURAMENTO,
  FORMAS_DE_PAGAMENTO,
  MESES,
  TOTAL_DE_DESPESAS,
  formatarCompacto,
} from '../dadosDosGraficos';

const INICIAL = {
  title: 'Distribuição em',
  subtitle: '',
  colunas: 'quantidade e valor',
  computed: 'percentual',
  showTotal: true,
  totalLabel: 'Total',
  totalDaQuantidade: 'sum',
  destaque: true,
};

type ValoresDoBalao = typeof INICIAL;

const CORES_DAS_FORMAS = resolveSeriesColors(FORMAS_DE_PAGAMENTO.map(() => ({})));

function BalaoDoPlayground({ registrar, valores }: { registrar: (evento: string) => void; valores: ValoresDoBalao }) {
  const [faixa, setFaixa] = useState<number | null>(null);
  const duasColunas = valores.colunas === 'quantidade e valor';
  const maior = faixa === null ? 0 : Math.max(...FORMAS_DE_PAGAMENTO.map((forma) => forma.valores[faixa]));

  function focar(indice: number | null) {
    setFaixa(indice);
    registrar(`onHoverCategory: ${indice}`);
  }

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={
          duasColunas
            ? [{ total: valores.totalDaQuantidade as ChartTooltipTotal }, { format: formatCurrency }]
            : [{ format: formatCurrency }]
        }
        computed={valores.computed === 'none' ? 'none' : undefined}
        rows={
          faixa === null
            ? []
            : FORMAS_DE_PAGAMENTO.map((forma, indice) => ({
                color: CORES_DAS_FORMAS[indice],
                emphasis: valores.destaque && forma.valores[faixa] === maior,
                label: forma.label,
                values: duasColunas ? [forma.quantidades[faixa], forma.valores[faixa]] : [forma.valores[faixa]],
              }))
        }
        showTotal={valores.showTotal}
        subtitle={valores.subtitle || undefined}
        title={faixa === null ? '' : `${valores.title} ${MESES[faixa]}`.trim()}
        totalLabel={valores.totalLabel}
      >
        <ChartBar
          showTooltip={false}
          categories={MESES}
          formatValue={formatarCompacto}
          onHoverCategory={focar}
          series={FORMAS_DE_PAGAMENTO.map((forma) => ({ label: forma.label, values: forma.valores }))}
          stacked
          title="Faturamento por forma de pagamento"
        />
      </ChartTooltip>
    </div>
  );
}

const playground = definirPlayground({
  inicial: INICIAL,
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'subtitle' },
    { tipo: 'opcoes', nome: 'colunas', opcoes: ['valor', 'quantidade e valor'] },
    { tipo: 'opcoes', nome: 'computed', opcoes: ['percentual', 'none'] },
    { tipo: 'booleano', nome: 'showTotal' },
    { tipo: 'texto', nome: 'totalLabel' },
    { tipo: 'opcoes', nome: 'totalDaQuantidade', opcoes: ['sum', 'average', 'none'] },
    { tipo: 'booleano', nome: 'destaque' },
  ],
  renderizar: (valores, registrar) => <BalaoDoPlayground registrar={registrar} valores={valores} />,
  codigo: (valores) =>
    gerarJsx(
      'ChartTooltip',
      [
        ['title', expr(`faixa === null ? '' : \`${valores.title} \${meses[faixa]}\``)],
        ['subtitle', valores.subtitle || undefined],
        [
          'columns',
          expr(
            valores.colunas === 'quantidade e valor'
              ? `[${valores.totalDaQuantidade === 'sum' ? '{}' : `{ total: '${valores.totalDaQuantidade}' }`}, { format: formatCurrency }]`
              : '[{ format: formatCurrency }]',
          ),
        ],
        ['computed', valores.computed === 'none' ? 'none' : undefined],
        ['rows', expr('linhas')],
        ['showTotal', valores.showTotal, false],
        ['totalLabel', valores.totalLabel, 'Total'],
      ],
      '<ChartBar ... onHoverCategory={setFaixa} />',
    ),
  verificar: (valores) => {
    const duasColunas = valores.colunas === 'quantidade e valor';
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Decorativo', detalhe: 'O balão é aria-hidden; a leitura acessível é o aria-label de cada marca.' },
    ];

    if (!valores.title.trim()) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Sem título', detalhe: 'O balão mostra só o mês, sem dizer o que as medidas distribuem.' });
    }

    if (valores.computed === 'percentual') {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Percentual sobre o valor',
        detalhe: duasColunas
          ? 'A coluna calculada parte da última coluna, a do valor, e não da quantidade.'
          : 'A coluna calculada é a parte de cada linha no total da coluna de valor.',
      });
    }

    if (valores.showTotal && !valores.totalLabel.trim()) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Total sem rótulo', detalhe: 'A linha de total fica sem dizer o que soma.' });
    }

    if (valores.showTotal && duasColunas && valores.totalDaQuantidade === 'average') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Operadores diferentes', detalhe: `Média na quantidade e soma no valor, sob o mesmo "${valores.totalLabel}".` });
    }

    return verificacoes;
  },
});

function MediaNoTotal() {
  const [faixa, setFaixa] = useState<number | null>(null);
  const cores = resolveSeriesColors(COMPOSICAO);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatCurrency, total: 'average' }]}
        computed="none"
        rows={faixa === null ? [] : COMPOSICAO.map((serie, indice) => ({ color: cores[indice], label: serie.label, values: [serie.values[faixa]] }))}
        showTotal
        title={faixa === null ? '' : MESES[faixa]}
        totalLabel="Média por linha"
      >
        <ChartBar showTooltip={false} categories={MESES} formatValue={formatarCompacto} onHoverCategory={setFaixa} series={COMPOSICAO} title="Faturamento por linha" />
      </ChartTooltip>
    </div>
  );
}

function CaminhoNoAnel() {
  const [caminho, setCaminho] = useState<readonly ChartHoveredNode[] | null>(null);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatCurrency }]}
        computed={{ compute: (valor) => valor / TOTAL_DE_DESPESAS }}
        rows={(caminho ?? []).map((nivel, indice, niveis) => ({
          emphasis: indice === niveis.length - 1,
          label: nivel.label,
          values: [nivel.value],
        }))}
        subtitle="Valor e fatia do total de despesas"
        title={caminho?.at(-1)?.label}
      >
        <ChartSunburst showTooltip={false} formatValue={formatarCompacto} height={300} nodes={DESPESAS} onHoverNode={setCaminho} title="Estrutura de despesas" />
      </ChartTooltip>
    </div>
  );
}

function ForaDoGrafico() {
  return (
    <ChartTooltip
      columns={[{ format: formatCurrency }]}
      rows={MESES.map((mes, indice) => ({ label: mes, values: [FATURAMENTO[indice]] }))}
      showTotal
      title="Faturamento por mês"
    >
      <div className="demo-box">
        <p className="note">Faturamento do semestre</p>
        <strong>{formatCurrency(FATURAMENTO.reduce((soma, valor) => soma + valor, 0))}</strong>
      </div>
    </ChartTooltip>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Abertura</dt>
        <dd>
          Abre com o ponteiro sobre a área e ao menos uma linha. Acompanha o cursor, adiante dele, e vira para o lado oposto
          ao encostar na borda da janela.
        </dd>
        <dt>Saída</dt>
        <dd>Sai a qualquer outra interação: ponteiro fora da área, rolagem, tecla ou a janela mudando de tamanho.</dd>
        <dt><code>computed</code></dt>
        <dd>
          Coluna ao fim. Por padrão é o percentual de cada linha sobre o total da última coluna, a de valor. <code>column</code>{' '}
          troca a base, <code>compute</code> troca o cálculo, <code>format</code> o formato, e <code>none</code> a dispensa.
          Sem coluna de onde derivar, ela não aparece.
        </dd>
        <dt><code>total</code> da coluna</dt>
        <dd>
          Cada coluna declara o próprio operador, porque somar quantidade faz sentido e somar um percentual médio não:{' '}
          <code>sum</code>, <code>average</code>, uma função própria ou <code>none</code>, que deixa a célula vazia.
        </dd>
        <dt><code>emphasis</code></dt>
        <dd>Realça a linha, como a de maior valor ou a do nó sob o ponteiro; as demais continuam legíveis.</dd>
        <dt>Cor da linha</dt>
        <dd>
          Para o marcador bater com a marca desenhada, a cor sai de <code>resolveSeriesColors</code>, o mesmo utilitário que o
          gráfico usa, com a mesma cor de tema.
        </dd>
      </dl>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Média no totalizador',
      descricao: 'A linha de total não é fixa em soma: aqui ela mostra a média das três linhas no mês.',
      Previa: MediaNoTotal,
      codigo: `<ChartTooltip
  title={faixa === null ? '' : meses[faixa]}
  columns={[{ format: formatCurrency, total: 'average' }]}
  computed="none"
  rows={faixa === null ? [] : series.map((serie, indice) => ({
    color: cores[indice],
    label: serie.label,
    values: [serie.values[faixa]],
  }))}
  showTotal
  totalLabel="Média por linha"
>
  <ChartBar showTooltip={false} title="Faturamento por linha" categories={meses} series={series} onHoverCategory={setFaixa} />
</ChartTooltip>`,
    },
    {
      titulo: 'Caminho até o nó',
      descricao: 'Nos hierárquicos, uma linha por nível, e a coluna calculada com a parte do total de despesas.',
      Previa: CaminhoNoAnel,
      codigo: `<ChartTooltip
  title={caminho?.at(-1)?.label}
  subtitle="Valor e fatia do total de despesas"
  columns={[{ format: formatCurrency }]}
  computed={{ compute: (valor) => valor / totalDeDespesas }}
  rows={(caminho ?? []).map((nivel, indice, niveis) => ({
    emphasis: indice === niveis.length - 1,
    label: nivel.label,
    values: [nivel.value],
  }))}
>
  <ChartSunburst showTooltip={false} title="Estrutura de despesas" nodes={despesas} onHoverNode={setCaminho} />
</ChartTooltip>`,
    },
    {
      titulo: 'Fora de um gráfico',
      descricao: 'Ele não conhece gráfico algum: num cartão de indicador, abre o detalhe do número.',
      Previa: ForaDoGrafico,
      codigo: `<ChartTooltip
  title="Faturamento por mês"
  columns={[{ format: formatCurrency }]}
  rows={meses.map((mes, indice) => ({ label: mes, values: [faturamento[indice]] }))}
  showTotal
>
  <div className="indicador">...</div>
</ChartTooltip>`,
    },
  ],
  faca: {
    Previa: ForaDoGrafico,
    texto: 'Várias medidas em grade, como apoio visual ao ponteiro. A leitura acessível continua na marca e no texto da página.',
  },
  evite: {
    Previa: () => (
      <ChartTooltip rows={[{ label: 'Excluir o registro selecionado', values: [] }]}>
        <div className="demo-box">Excluir</div>
      </ChartTooltip>
    ),
    texto: 'Uma frase curta que descreve um elemento: isso é Tooltip, que nomeia o elemento para o leitor de tela. O ChartTooltip é decorativo.',
  },
  Modos,
  teclado: [{ teclas: ['Qualquer tecla'], acao: 'Fecha o balão, que não recebe foco nem é anunciado.' }],
  garantias: [
    { garantia: 'Decorativo', como: <>O balão é <code>aria-hidden</code>: uma grade que some a qualquer interação não é leitura acessível.</>, teste: 'ChartTooltip.test.tsx' },
    { garantia: 'Saída previsível', como: 'Sai com o ponteiro fora da área, na rolagem e no teclado.', teste: 'ChartTooltip.test.tsx' },
    { garantia: 'Sem balão vazio', como: 'Sem linha alguma, não abre.', teste: 'ChartTooltip.test.tsx' },
    { garantia: 'Cursor livre', como: 'Abre adiante do ponteiro e vira ao encostar na borda da janela.', teste: 'ChartTooltip.test.tsx' },
    { garantia: 'Percentual correto', como: 'Calculado sobre a última coluna, e não sobre a primeira.', teste: 'ChartTooltip.test.tsx' },
    { garantia: 'Total por coluna', como: 'Cada coluna é totalizada pelo próprio operador, ou fica de fora.', teste: 'ChartTooltip.test.tsx' },
  ],
  api: [
    { nome: 'children', tipo: 'ReactNode', descricao: 'A área que o ponteiro percorre, em geral o gráfico.' },
    { nome: 'rows', tipo: 'readonly ChartTooltipRow[]', descricao: <><code>{'{ label, values, color?, emphasis? }'}</code>, uma por medida.</> },
    { nome: 'columns', tipo: 'readonly ChartTooltipColumn[]', descricao: <><code>{'{ format?, total? }'}</code> por coluna. Sem ela, uma por valor, em <code>formatNumber</code>.</> },
    {
      nome: 'computed',
      tipo: "ChartTooltipComputed | 'none'",
      padrao: 'percentual',
      descricao: <><code>{'{ column?, compute?, format? }'}</code> da coluna calculada; <code>none</code> a dispensa.</>,
    },
    { nome: 'showTotal', tipo: 'boolean', padrao: 'false', descricao: 'Linha de total, com o operador de cada coluna.' },
    { nome: 'totalLabel', tipo: 'string', padrao: "'Total'", descricao: 'Rótulo da linha de total.' },
    { nome: 'title', tipo: 'string', descricao: 'Título do balão, como a categoria sob o ponteiro.' },
    { nome: 'subtitle', tipo: 'string', descricao: 'Linha de apoio sob o título.' },
  ],
};
