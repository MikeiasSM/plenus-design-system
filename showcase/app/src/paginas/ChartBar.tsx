import { useState } from 'react';
import {
  Button,
  ChartBar,
  ChartTooltip,
  formatCurrency,
  formatPercent,
  resolveSeriesColors,
  type AxisVisibility,
  type ChartBarOrientation,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type MarkVisibility,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';
import {
  COMPOSICAO,
  CONVERSAO,
  FATURAMENTO,
  FORMAS_DE_PAGAMENTO,
  MESES,
  OPCOES_DE_ACCENT,
  accentDa,
  formatarCompacto, FORMATOS, VISIBILIDADES } from '../dadosDosGraficos';
import { DecomposicaoDoBar } from '../estrutura/decomposicao';

const LADOS_DA_LEGENDA = ['top', 'right', 'bottom', 'left', 'none'] as const;
const ALINHAMENTOS = ['left', 'center', 'right'] as const;

const CLIENTES = ['Plenus Tecnologia', 'CDCE da Escola', 'S. P Ind. Com.', 'S M de Oliveira', 'Três D Comércio'];
const FATURAMENTO_POR_CLIENTE = [26500, 18900, 16400, 14200, 10500];

const DRE = [
  { label: 'Receita', values: [300000, 210000], intent: 'positive' as const },
  { label: 'Deduções', values: [179000, 96000], intent: 'warning' as const },
  { label: 'Despesas', values: [50200, 8000], intent: 'negative' as const },
];

const playground = definirPlayground({
  inicial: {
    title: 'Composição do faturamento',
    series: 2,
    orientation: 'vertical',
    stacked: false,
    showDataLabels: 'hidden',
    legend: 'bottom',
    legendAlign: 'center',
    xAxis: 'visible',
    yAxis: 'visible',
    yAxisRight: 'hidden',
    accent: 'nenhuma',
    formatValue: 'compacto',
    formatTooltipValue: 'igual',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'numero', nome: 'series', min: 0, max: 3 },
    { tipo: 'opcoes', nome: 'orientation', opcoes: ['vertical', 'horizontal'] },
    { tipo: 'booleano', nome: 'stacked' },
    { tipo: 'opcoes', nome: 'showDataLabels', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'legend', opcoes: LADOS_DA_LEGENDA },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ALINHAMENTOS },
    { tipo: 'opcoes', nome: 'xAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'yAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'yAxisRight', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
    { tipo: 'opcoes', nome: 'formatValue', opcoes: Object.keys(FORMATOS) },
    { tipo: 'opcoes', nome: 'formatTooltipValue', opcoes: ['igual', ...Object.keys(FORMATOS)] },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartBar
        accent={accentDa(valores.accent)}
        categories={MESES}
        formatTooltipValue={FORMATOS[valores.formatTooltipValue]?.formatar}
        formatValue={FORMATOS[valores.formatValue].formatar}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        onHiddenChange={(ocultas) => registrar(`onHiddenChange: [${ocultas.join(', ')}]`)}
        onHover={(categoria) => registrar(`onHover: ${categoria ? `${categoria.category} (${categoria.index})` : null}`)}
        orientation={valores.orientation as ChartBarOrientation}
        series={COMPOSICAO.slice(0, valores.series)}
        showDataLabels={valores.showDataLabels as MarkVisibility}
        stacked={valores.stacked}
        title={valores.title}
        xAxis={valores.xAxis as AxisVisibility}
        yAxis={valores.yAxis as AxisVisibility}
        yAxisRight={valores.yAxisRight as AxisVisibility}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartBar', [
      ['title', valores.title],
      ['categories', expr('meses')],
      ['series', expr('series')],
      ['orientation', valores.orientation, 'vertical'],
      ['stacked', valores.stacked, false],
      ['showDataLabels', valores.showDataLabels, 'hidden'],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['xAxis', valores.xAxis, 'visible'],
      ['yAxis', valores.yAxis, 'visible'],
      ['yAxisRight', valores.yAxisRight, 'hidden'],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr(FORMATOS[valores.formatValue].codigo)],
      ['formatTooltipValue', FORMATOS[valores.formatTooltipValue] && expr(FORMATOS[valores.formatTooltipValue].codigo)],
      ['onHover', expr('(categoria) => setFaixa(categoria?.index ?? null)')],
    ]),
  verificar: (valores) => {
    const vertical = valores.orientation === 'vertical';
    const eixosDeValor = vertical ? [valores.yAxis, valores.yAxisRight] : [valores.xAxis];
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
    ];

    if (valores.series === 0) {
      verificacoes.push({ nivel: 'ok', titulo: 'Estado vazio', detalhe: 'Sem séries, o gráfico anuncia a ausência em vez de desenhar eixos vazios.' });
    }

    if (valores.series === 1) {
      verificacoes.push({ nivel: 'ok', titulo: 'Legenda dispensada', detalhe: 'Uma série só: o título já a nomeia, e a legenda aparece a partir de duas.' });
    }

    if (valores.series === 1 && valores.stacked) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Pilha de uma série', detalhe: 'Empilhar uma série só desenha as mesmas barras.' });
    }

    if (!vertical && (valores.legend === 'left' || valores.legend === 'right')) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Legenda vai para baixo',
        detalhe: 'Nas barras horizontais a largura é o próprio desenho: a legenda lateral cai para baixo.',
      });
    }

    if (eixosDeValor.every((eixo) => eixo === 'hidden') && valores.showDataLabels === 'hidden') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Valor sem leitura',
        detalhe: 'Sem eixo de valor e sem showDataLabels, a altura da barra não se traduz em número na tela.',
      });
    }

    if (accentDa(valores.accent)) {
      verificacoes.push({ nivel: 'ok', titulo: 'Cor de tema', detalhe: 'A primeira série categórica abre com ela; as demais seguem a paleta.' });
    }

    return verificacoes;
  },
});

function LeituraNoPonteiro() {
  const [faixa, setFaixa] = useState<number | null>(null);
  const cores = resolveSeriesColors(FORMAS_DE_PAGAMENTO.map(() => ({})));
  const maior = faixa === null ? 0 : Math.max(...FORMAS_DE_PAGAMENTO.map((forma) => forma.valores[faixa]));

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{}, { format: formatCurrency }]}
        rows={
          faixa === null
            ? []
            : FORMAS_DE_PAGAMENTO.map((forma, indice) => ({
                color: cores[indice],
                emphasis: forma.valores[faixa] === maior,
                label: forma.label,
                values: [forma.quantidades[faixa], forma.valores[faixa]],
              }))
        }
        showTotal
        title={faixa === null ? '' : `Distribuição em ${MESES[faixa]}`}
      >
        <ChartBar
          showTooltip={false}
          categories={MESES}
          formatValue={formatarCompacto}
          onHover={(categoria) => setFaixa(categoria?.index ?? null)}
          series={FORMAS_DE_PAGAMENTO.map((forma) => ({ label: forma.label, values: forma.valores }))}
          stacked
          title="Faturamento por forma de pagamento"
        />
      </ChartTooltip>
    </div>
  );
}

function SeriesControladas() {
  const [ocultas, setOcultas] = useState<readonly string[]>(['Assinaturas']);

  return (
    <div style={{ width: '100%' }}>
      <ChartBar
        categories={MESES}
        formatValue={formatarCompacto}
        hidden={ocultas}
        onHiddenChange={setOcultas}
        series={COMPOSICAO}
        title="Composição do faturamento"
      />
      <div className="demo-row">
        <Button disabled={ocultas.length === 0} onClick={() => setOcultas([])} size="sm" variant="secondary">
          Mostrar todas
        </Button>
        <span className="note">Ocultas: {ocultas.length ? ocultas.join(', ') : 'nenhuma'}</span>
      </div>
    </div>
  );
}

const CODIGO_DAS_VARIANTES = `<ChartBar title="Composição do faturamento" categories={meses} series={series} orientation="vertical" />
<ChartBar title="Composição do faturamento" categories={meses} series={series} orientation="horizontal" />

<ChartBar title="Composição do faturamento" categories={meses} series={series} stacked={false} />
<ChartBar title="Composição do faturamento" categories={meses} series={series} stacked />`;

function Variantes() {
  const combinacoes = [
    { orientation: 'vertical', stacked: false },
    { orientation: 'vertical', stacked: true },
    { orientation: 'horizontal', stacked: false },
    { orientation: 'horizontal', stacked: true },
  ] as const;

  return (
    <>
      <div className="demo-grid">
        {combinacoes.map(({ orientation, stacked }) => (
          <div className="demo-box" key={`${orientation}-${stacked}`}>
            <ChartBar
              categories={MESES.slice(0, 4)}
              formatValue={formatarCompacto}
              height={200}
              orientation={orientation}
              series={COMPOSICAO.slice(0, 2)}
              stacked={stacked}
              title={`${orientation}${stacked ? ', stacked' : ''}`}
            />
          </div>
        ))}
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

const CODIGO_DAS_SERIES_CONTROLADAS = `<ChartBar
  title="Composição do faturamento"
  categories={meses}
  series={series}
  hidden={ocultas}
  onHiddenChange={setOcultas}
  formatValue={formatarCompacto}
/>
<Button variant="secondary" size="sm" disabled={ocultas.length === 0} onClick={() => setOcultas([])}>
  Mostrar todas
</Button>`;

const CODIGO_DA_ALTURA_DO_CONTEINER = `<div style={{ height: 320 }}>
  <ChartBar
    title="Faturamento mensal"
    categories={meses}
    series={[{ label: 'Faturamento', values: faturamento }]}
    height="fill"
    formatValue={formatarCompacto}
  />
</div>`;

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt><code>xAxis</code>, <code>yAxis</code>, <code>yAxisRight</code></dt>
        <dd>
          Em <code>onHover</code> o desenho ocupa o espaço todo. Depois de um instante com o ponteiro sobre o gráfico,
          ele encolhe numa transição e o eixo surge na calha que se abriu; ao sair, volta a ocupar tudo. Em{' '}
          <code>hidden</code> o eixo não aparece nunca. O eixo da direita espelha a escala da esquerda.
        </dd>
        <dt><code>legendAlign</code></dt>
        <dd>
          Escolhe onde a legenda horizontal se apoia na largura. A legenda lateral ignora o alinhamento: cada entrada
          ocupa a linha inteira.
        </dd>
        <dt><code>labelAngle</code></dt>
        <dd>
          Em <code>auto</code> o ângulo sai da medida do texto contra o passo entre categorias: deitado enquanto dois
          rótulos vizinhos não se tocam, depois a 45 graus, e em pé quando nem a diagonal os separa.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Séries controladas</h3>
        <SeriesControladas />
        <p className="note">
          Sem <code>hidden</code> o componente guarda o que está oculto; com ele, obedece ao produto. Nos dois casos
          avisa a mudança por <code>onHiddenChange</code>. A série recolhe em movimento e as demais repartem a faixa.
        </p>
        <VerCodigo codigo={CODIGO_DAS_SERIES_CONTROLADAS} />
      </div>
      <div className="subsection">
        <h3>Altura do contêiner</h3>
        <div className="demo-box" style={{ height: 320, overflow: 'auto', resize: 'vertical' }}>
          <ChartBar
            categories={MESES}
            formatValue={formatarCompacto}
            height="fill"
            series={[{ label: 'Faturamento', values: FATURAMENTO }]}
            title="Faturamento mensal"
          />
        </div>
        <p className="note">
          Com <code>height=&quot;fill&quot;</code> a altura vem de quem envolve. Arraste o canto inferior da caixa.
        </p>
        <VerCodigo codigo={CODIGO_DA_ALTURA_DO_CONTEINER} />
      </div>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartBar categories={[]} series={[]} title="Faturamento por vendedor" />
        <p className="note">
          Sem dados, o gráfico anuncia a ausência com <code>emptyMessage</code> em vez de desenhar eixos vazios.
        </p>
        <VerCodigo codigo={'<ChartBar title="Faturamento por vendedor" categories={[]} series={[]} />'} />
      </div>
    </div>
  );
}

const VISIBILIDADE = "'visible' | 'hidden' | 'onHover'";

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Decomposição por encaixe',
      descricao: 'Arraste o canto da caixa. Sem espaço, o gráfico retira a legenda, o título dos eixos, os rótulos do eixo de valor, os eixos e, por fim, a grade, os pontos e os rótulos de dado, em vez de encolher tudo. A leitura continua pelo aria-label de cada marca e pela visão em tabela; o que se perde é o controle da legenda.',
      largo: true,
      Previa: DecomposicaoDoBar,
      codigo: `<div style={{ height: 240, overflow: 'hidden', resize: 'both' }}>
  <ChartBar height="fill" title="..." /* dados */ />
</div>`,
    },
    {
      titulo: 'Eixos com título e contagem inteira',
      descricao: 'O passo mínimo 1 impede marcas fracionárias em pedidos; os títulos dizem o que cada eixo mede.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartBar
            categories={['Seg', 'Ter', 'Qua']}
            height={220}
            minTickStep={1}
            series={[{ label: 'Pedidos', values: [1, 2, 2] }]}
            title="Pedidos por dia"
            xAxisTitle="Dia da semana"
            yAxisTitle="Pedidos"
          />
        </div>
      ),
      codigo: `<ChartBar
  title="Pedidos por dia"
  categories={['Seg', 'Ter', 'Qua']}
  series={[{ label: 'Pedidos', values: [1, 2, 2] }]}
  minTickStep={1}
  xAxisTitle="Dia da semana"
  yAxisTitle="Pedidos"
  height={220}
/>`,
    },
    {
      titulo: 'Faturamento e conversão em eixos separados',
      descricao: 'Cada série declara o seu eixo, e as barras dividem a faixa. Só na vertical: na horizontal, axis é ignorado e o console avisa em desenvolvimento.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartBar
            categories={MESES}
            formatRightValue={(valor) => formatPercent(valor / 100, { decimals: 1 })}
            formatValue={formatarCompacto}
            series={[
              { label: 'Faturamento', values: FATURAMENTO },
              { axis: 'right', label: 'Conversão', values: CONVERSAO },
            ]}
            title="Faturamento e conversão"
          />
        </div>
      ),
      codigo: `<ChartBar
  title="Faturamento e conversão"
  categories={meses}
  series={[
    { label: 'Faturamento', values: faturamento },
    { label: 'Conversão', values: conversao, axis: 'right' },
  ]}
  formatValue={formatarCompacto}
  formatRightValue={(valor) => formatPercent(valor / 100, { decimals: 1 })}
/>`,
    },
    {
      titulo: 'Nomes longos na horizontal',
      descricao: 'A coluna de nomes tem teto: o excedente vira reticências, e o nome inteiro segue no balão e no rótulo da marca. O rótulo de dado da ponta tem a sua reserva.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartBar
            categories={['Distribuidora Nacional de Alimentos e Bebidas do Centro-Oeste Ltda.', 'Comercial de Eletrodomésticos e Móveis Planejados Vale do Sul', 'Sul', 'Norte']}
            formatValue={formatarCompacto}
            orientation="horizontal"
            series={[{ label: 'Vendas', values: [215000, 180000, 90000, 40000] }]}
            showDataLabels="visible"
            title="Vendas por cliente"
          />
        </div>
      ),
      codigo: `<ChartBar
  title="Vendas por cliente"
  orientation="horizontal"
  categories={clientes}
  series={[{ label: 'Vendas', values: [215000, 180000, 90000, 40000] }]}
  showDataLabels="visible"
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Intenção semântica',
      descricao: 'Com intent, a cor carrega significado e ignora a cor de tema: despesa continua vermelha para qualquer usuário.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartBar
            accent="#F26B35"
            categories={['08/2026', '09/2026']}
            formatValue={formatarCompacto}
            series={DRE}
            title="Receita × Deduções × Despesas"
          />
        </div>
      ),
      codigo: `<ChartBar
  title="Receita × Deduções × Despesas"
  categories={['08/2026', '09/2026']}
  series={[
    { label: 'Receita', values: [300000, 210000], intent: 'positive' },
    { label: 'Deduções', values: [179000, 96000], intent: 'warning' },
    { label: 'Despesas', values: [50200, 8000], intent: 'negative' },
  ]}
  accent={corDoUsuario}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Horizontal, com valores na ponta',
      descricao: 'Nomes longos vão para o eixo da esquerda, cuja calha é medida pelo rótulo mais largo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartBar
            categories={CLIENTES}
            formatValue={formatarCompacto}
            height={220}
            orientation="horizontal"
            series={[{ label: 'Faturamento', values: FATURAMENTO_POR_CLIENTE }]}
            showDataLabels="visible"
            title="Faturamento por cliente"
          />
        </div>
      ),
      codigo: `<ChartBar
  title="Faturamento por cliente"
  categories={clientes}
  series={[{ label: 'Faturamento', values: [26500, 18900, 16400, 14200, 10500] }]}
  orientation="horizontal"
  showDataLabels="visible"
  height={220}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Empilhadas, com o total',
      descricao: 'Empilhada, showDataLabels escreve o total da categoria além da ponta da pilha.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartBar
            categories={MESES}
            formatValue={formatarCompacto}
            series={COMPOSICAO.slice(0, 2)}
            showDataLabels="visible"
            stacked
            title="Evolução do faturamento"
          />
        </div>
      ),
      codigo: `<ChartBar
  title="Evolução do faturamento"
  categories={meses}
  series={[
    { label: 'Serviços', values: servicos },
    { label: 'Produtos', values: produtos },
  ]}
  stacked
  showDataLabels="visible"
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Leitura no ponteiro',
      descricao: 'onHover avisa a categoria, e o ChartTooltip monta quantidade, valor, percentual e total.',
      Previa: LeituraNoPonteiro,
      codigo: `const [faixa, setFaixa] = useState<number | null>(null);
const cores = resolveSeriesColors(formas.map(() => ({})));

<ChartTooltip
  title={faixa === null ? '' : \`Distribuição em \${meses[faixa]}\`}
  columns={[{}, { format: formatCurrency }]}
  rows={faixa === null ? [] : formas.map((forma, indice) => ({
    color: cores[indice],
    label: forma.label,
    values: [forma.quantidades[faixa], forma.valores[faixa]],
  }))}
  showTotal
>
  <ChartBar
    showTooltip={false}
    title="Faturamento por forma de pagamento"
    categories={meses}
    series={formas.map((forma) => ({ label: forma.label, values: forma.valores }))}
    stacked
    onHover={(categoria) => setFaixa(categoria?.index ?? null)}
  />
</ChartTooltip>`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartBar accent="#49619C" categories={['08/2026', '09/2026']} formatValue={formatarCompacto} height={180} series={DRE} title="Resultado" />
      </div>
    ),
    texto: 'Receita e despesa com intent: a cor diz o que a barra significa, igual para todo usuário.',
    codigo: `<ChartBar
  title="Resultado"
  categories={['08/2026', '09/2026']}
  series={[
    { label: 'Receita', values: [300000, 210000], intent: 'positive' },
    { label: 'Deduções', values: [179000, 96000], intent: 'warning' },
    { label: 'Despesas', values: [50200, 8000], intent: 'negative' },
  ]}
  accent="#49619C"
  height={180}
  formatValue={formatarCompacto}
/>`,
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartBar
          accent="#49619C"
          categories={['08/2026', '09/2026']}
          formatValue={formatarCompacto}
          height={180}
          series={DRE.map(({ label, values }) => ({ label, values }))}
          title="Resultado"
        />
      </div>
    ),
    texto: 'As mesmas séries na paleta categórica: a cor de tema pinta a receita e o sentido muda a cada usuário.',
    codigo: `<ChartBar
  title="Resultado"
  categories={['08/2026', '09/2026']}
  series={[
    { label: 'Receita', values: [300000, 210000] },
    { label: 'Deduções', values: [179000, 96000] },
    { label: 'Despesas', values: [50200, 8000] },
  ]}
  accent="#49619C"
  height={180}
  formatValue={formatarCompacto}
/>`,
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões a partir de duas séries. O desenho não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga a série da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Visão em tabela', como: <>O botão <code>Ver como tabela</code> troca o desenho pela leitura completa; <code>showTableToggle={'{false}'}</code> o tira.</>, teste: 'visao-em-tabela.test.tsx' },
    { garantia: 'Toque', como: 'O primeiro toque fixa o realce e o balão; tocar na marca fixada ativa onMarkClick; tocar fora ou rolar solta. A rolagem da página não é afetada.', teste: 'toque.test.tsx' },
    { garantia: 'Decomposição por encaixe', como: 'Sem espaço, as partes saem na ordem da família e a leitura segue pelo aria-label das marcas.', teste: 'decomposicao.test.tsx' },
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartBar.test.tsx' },
    { garantia: 'Descrição da marca', como: <>Cada barra tem <code>aria-label</code> com série, categoria e valor no formato do consumidor.</>, teste: 'ChartBar.test.tsx' },
    { garantia: 'Significado da cor', como: 'A série com intent mantém a cor de status, com ou sem cor de tema.', teste: 'ChartBar.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem séries ou categorias, um EmptyState no lugar do desenho.', teste: 'ChartBar.test.tsx' },
    { garantia: 'Número inválido', como: 'NaN ou infinito não vira geometria: a barra não é desenhada.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Menos movimento', como: <>Com <code>prefers-reduced-motion</code>, os valores saltam ao alvo em vez de caminhar.</>, teste: 'motion.test.tsx' },
  ],
  api: [
    { nome: 'showTableToggle', tipo: 'boolean', padrao: 'true', descricao: 'Botão "Ver como tabela". Com a tabela aberta, a legenda sai. Desligado, fica só o desenho.' },
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'categories', tipo: 'readonly string[]', descricao: 'Categorias do eixo, uma faixa cada.' },
    { nome: 'series', tipo: 'readonly ChartBarSeries[]', descricao: <><code>{'{ label, values, axis?, color?, intent? }'}</code>, uma por série. <code>axis</code> padrão <code>'left'</code>; com série em <code>'right'</code>, o eixo da direita ganha escala própria e fica visível. Só na vertical.</> },
    { nome: 'orientation', tipo: "'vertical' | 'horizontal'", padrao: "'vertical'", descricao: 'Barras em pé ou deitadas.' },
    { nome: 'stacked', tipo: 'boolean', padrao: 'false', descricao: 'Empilha as séries; sinais mistos divergem a partir do zero. Só entre séries do mesmo eixo: cada eixo tem a sua pilha, lado a lado na faixa.' },
    { nome: 'showDataLabels', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'hidden'", descricao: 'Valor além da ponta; empilhada, o total da categoria. Em onHover, os da série da barra sob o ponteiro.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatNumber', descricao: 'Formato do eixo, dos rótulos e das descrições.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato dos valores no balão: o eixo pode sair compacto e o balão, exato.' },
    { nome: 'formatRightValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato do eixo da direita, dos rótulos e do balão das séries dele.' },
    { nome: 'minRightTickStep', tipo: "number", descricao: 'O mesmo passo mínimo, para o eixo da direita.' },
    { nome: 'yAxisRightTitle', tipo: "string", descricao: 'Título do eixo de valor da direita, só na vertical.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '260', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda, que aparece a partir de duas séries.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'xAxis', tipo: VISIBILIDADE, padrao: "'visible'", descricao: 'Eixo de baixo.' },
    { nome: 'yAxis', tipo: VISIBILIDADE, padrao: "'visible'", descricao: 'Eixo da esquerda.' },
    { nome: 'yAxisRight', tipo: VISIBILIDADE, padrao: "'hidden'", descricao: 'Eixo da direita: espelho da esquerda, ou escala própria das séries com axis \'right\'. Sem valor, com série nele, segue o yAxis.' },
    { nome: 'labelAngle', tipo: "0 | 45 | 90 | 'auto'", padrao: "'auto'", descricao: 'Ângulo dos rótulos do eixo de baixo.' },
    { nome: 'hidden', tipo: 'readonly string[]', descricao: 'Séries ocultas, pelo rótulo, no modo controlado.' },
    { nome: 'hiddenSeries', tipo: 'readonly string[]', descricao: <>Obsoleto até a 0.7.0: use <code>hidden</code>. Com os dois, vale o novo.</> },
    { nome: 'defaultHidden', tipo: 'readonly string[]', descricao: 'Séries ocultas de início, no modo não controlado.' },
    { nome: 'defaultHiddenSeries', tipo: 'readonly string[]', descricao: <>Obsoleto até a 0.7.0: use <code>defaultHidden</code>. Com os dois, vale o novo.</> },
    { nome: 'onHiddenChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'onHiddenSeriesChange', tipo: '(hidden: readonly string[]) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onHiddenChange</code>. Com os dois, os dois avisam.</> },
    { nome: 'onHover', tipo: '(category: ChartCategoryHover | null) => void', descricao: 'Categoria sob o ponteiro; costura para o ChartTooltip.' },
    { nome: 'onHoverCategory', tipo: '(index: number | null) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onHover</code>. Com os dois, os dois avisam.</> },
    { nome: 'xAxisTitle', tipo: "string", descricao: <>Título do eixo de baixo, como o <code>xAxis</code>: as categorias na vertical, o valor na horizontal. O espaço sai da área de desenho; com o eixo em onHover, o título aparece e some com ele.</> },
    { nome: 'yAxisTitle', tipo: "string", descricao: <>Título do eixo da esquerda, como o <code>yAxis</code>: o valor na vertical, as categorias na horizontal. O texto é decorativo para leitor de tela; o nome do gráfico continua sendo o <code>title</code>.</> },
    { nome: 'minTickStep', tipo: "number", descricao: 'Passo mínimo entre as marcas do eixo de valor, na unidade do dado. Com 1, uma contagem de 0 a 2 marca 0, 1 e 2, e não 0, 0,2 … 1,8.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
    { nome: 'palette', tipo: 'ChartPalette', descricao: <>Lista de cores em rotação, ou <code>{'{ base }'}</code>, que gera os tons. Vence o <code>accent</code>.</> },
    { nome: 'onMarkClick', tipo: '(mark: ChartMarkClick) => void', descricao: 'Torna as barras botões, percorridos pelas setas; o balão abre no foco.' },
    { nome: 'onBarClick', tipo: '(bar: ChartMarkClick) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onMarkClick</code>. Com os dois, os dois avisam.</> },
  ],
};
