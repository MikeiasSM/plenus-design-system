import { useState } from 'react';
import {
  ChartDonut,
  ChartTooltip,
  formatCurrency,
  groupSmallSlices,
  resolveSeriesColors,
  type ChartDonutSlice,
  type ChartHoverDetails,
  type ChartLegendAlign,
  type ChartLegendPosition,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';
import { DESPESAS_POR_TIPO, OPCOES_DE_ACCENT, RECEITA, accentDa, formatarCompacto, FORMATOS } from '../dadosDosGraficos';
import { DecomposicaoDoDonut } from '../estrutura/decomposicao';

const CUSTOS = [
  { label: 'Devoluções de vendas', value: 400000 },
  { label: 'CMV - Custo das mercadorias', value: 6300000 },
];

const playground = definirPlayground({
  inicial: {
    title: 'Estrutura de despesas',
    thickness: 0.38,
    showCenter: true,
    centerLabel: 'Total',
    showLegendValues: true,
    smallSliceThreshold: 0.02,
    legend: 'right',
    legendAlign: 'center',
    accent: 'nenhuma',
    formatValue: 'compacto',
    formatTooltipValue: 'igual',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'numero', nome: 'thickness', min: 0, max: 1, passo: 0.02 },
    { tipo: 'booleano', nome: 'showCenter' },
    { tipo: 'texto', nome: 'centerLabel' },
    { tipo: 'booleano', nome: 'showLegendValues' },
    { tipo: 'numero', nome: 'smallSliceThreshold', min: 0, max: 0.2, passo: 0.01 },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
    { tipo: 'opcoes', nome: 'formatValue', opcoes: Object.keys(FORMATOS) },
    { tipo: 'opcoes', nome: 'formatTooltipValue', opcoes: ['igual', ...Object.keys(FORMATOS)] },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartDonut
        accent={accentDa(valores.accent)}
        centerLabel={valores.centerLabel}
        formatTooltipValue={FORMATOS[valores.formatTooltipValue]?.formatar}
        formatValue={FORMATOS[valores.formatValue].formatar}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        onHiddenChange={(ocultas) => registrar(`onHiddenChange: [${ocultas.join(', ')}]`)}
        onHover={(fatia) => registrar(`onHover: ${fatia ? fatia.label : null}`)}
        showCenter={valores.showCenter}
        showLegendValues={valores.showLegendValues}
        slices={DESPESAS_POR_TIPO}
        smallSliceThreshold={valores.smallSliceThreshold}
        thickness={valores.thickness}
        title={valores.title}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartDonut', [
      ['title', valores.title],
      ['slices', expr('despesas')],
      ['thickness', valores.thickness, 0.38],
      ['showCenter', valores.showCenter, true],
      ['centerLabel', valores.centerLabel, 'Total'],
      ['showLegendValues', valores.showLegendValues, true],
      ['smallSliceThreshold', valores.smallSliceThreshold, 0.02],
      ['legend', valores.legend, 'right'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr(FORMATOS[valores.formatValue].codigo)],
      ['formatTooltipValue', FORMATOS[valores.formatTooltipValue] && expr(FORMATOS[valores.formatTooltipValue].codigo)],
      ['onHover', expr('setFatia')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
    ];

    if (valores.thickness <= 0) {
      verificacoes.push({ nivel: 'falha', titulo: 'Anel sem espessura', detalhe: 'A espessura é fração do raio: em zero, nenhuma fatia aparece.' });
    } else if (valores.thickness >= 0.9) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Centro quase fechado', detalhe: 'Sem espaço para o valor central, o anel vira pizza: use ChartPie.' });
    }

    if (!valores.showCenter) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Sem valor central',
        detalhe: 'O anel existe para abrigar um valor no centro. Sem ele, ChartPie é o componente certo.',
      });
    }

    if (valores.showCenter && !valores.centerLabel.trim()) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Centro sem rótulo', detalhe: 'O valor do centro fica sem dizer o que mede.' });
    }

    return verificacoes;
  },
});

function FatiaNoPonteiro() {
  const [fatia, setFatia] = useState<ChartDonutSlice | null>(null);
  const cores = resolveSeriesColors(RECEITA);
  const cor = fatia ? cores[RECEITA.findIndex((item) => item.label === fatia.label)] : undefined;

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatCurrency }]}
        computed="none"
        rows={fatia ? [{ color: cor, label: fatia.label, values: [fatia.value] }] : []}
        title={fatia?.label}
      >
        <ChartDonut showTooltip={false} formatValue={formatarCompacto} height={240} onHover={setFatia} slices={RECEITA} title="Composição da receita" />
      </ChartTooltip>
    </div>
  );
}

function DetalheDoOutros() {
  const [alvo, setAlvo] = useState<{ details?: ChartHoverDetails; slice: ChartDonutSlice } | null>(null);
  const fatia = alvo?.slice;
  const linhas = fatia?.grouped ?? (fatia ? [fatia] : []);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        anchor={alvo?.details?.anchor}
        columns={[{ format: formatCurrency }]}
        computed="none"
        rows={linhas.map((item) => ({ color: alvo?.details?.color, label: item.label, values: [item.value] }))}
        showTotal={fatia?.grouped !== undefined}
        title={fatia?.label}
      >
        <ChartDonut
          formatValue={formatarCompacto}
          height={240}
          onHover={(slice, details) => setAlvo(slice && { details, slice })}
          showTooltip={false}
          slices={DESPESAS_POR_TIPO}
          title="Estrutura de despesas"
        />
      </ChartTooltip>
    </div>
  );
}

const SITUACAO_DO_ESTOQUE: ChartDonutSlice[] = [
  { label: 'Ruptura', value: 64 },
  { label: 'Saudável', value: 307 },
  { label: 'Atenção', value: 84 },
  { label: 'Descontinuado', value: 4 },
  { label: 'Em trânsito', value: 3 },
];

function Distribuicao() {
  const [alvo, setAlvo] = useState<{ details?: ChartHoverDetails; slice: ChartDonutSlice } | null>(null);
  const desenhadas = groupSmallSlices(SITUACAO_DO_ESTOQUE);
  const cores = resolveSeriesColors(desenhadas);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        anchor={alvo?.details?.anchor}
        rows={alvo ? desenhadas.map((item, indice) => ({
          color: cores[indice],
          emphasis: item.label === alvo.slice.label,
          label: item.label,
          values: [item.value],
        })) : []}
        showTotal
        title="Distribuição"
      >
        <ChartDonut
          height={240}
          onHover={(slice, details) => setAlvo(slice && { details, slice })}
          showTooltip={false}
          slices={SITUACAO_DO_ESTOQUE}
          title="Situação do estoque"
        />
      </ChartTooltip>
    </div>
  );
}

const CODIGO_DAS_VARIANTES = `<ChartDonut title="Receita" slices={receita} thickness={0.22} legend="none" />
<ChartDonut title="Receita" slices={receita} thickness={0.38} legend="none" />
<ChartDonut title="Receita" slices={receita} thickness={0.6} legend="none" />`;

function Variantes() {
  return (
    <>
      <div className="demo-grid">
        {[0.22, 0.38, 0.6].map((espessura) => (
          <div className="demo-box" key={espessura}>
            <ChartDonut
              formatValue={formatarCompacto}
              height={180}
              legend="none"
              slices={RECEITA}
              thickness={espessura}
              title={`thickness ${espessura}`}
            />
          </div>
        ))}
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Centro</dt>
        <dd>
          Mostra o total, com <code>centerLabel</code> abaixo. Com o ponteiro sobre uma fatia, passa a mostrar o valor e o
          rótulo dela. O texto se ajusta ao vazio do anel.
        </dd>
        <dt><code>smallSliceThreshold</code></dt>
        <dd>
          Duas ou mais fatias abaixo do limiar viram uma, com o rótulo de <code>otherLabel</code> e intenção neutra, para
          não disputar a paleta. Ela entra no lugar da primeira pequena.
        </dd>
        <dt>Legenda</dt>
        <dd>
          Em lista à direita, com o percentual alinhado numa coluna. Clicar desliga a fatia, e o anel se reparte entre as
          demais em movimento.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartDonut slices={[]} title="Estrutura de custos" />
        <p className="note">Sem fatia positiva, o gráfico anuncia a ausência em vez de desenhar um anel vazio.</p>
        <VerCodigo codigo={'<ChartDonut title="Estrutura de custos" slices={[]} />'} />
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Decomposição por encaixe',
      descricao: 'Arraste o canto da caixa. Sem espaço, o gráfico retira a legenda, o texto do centro e, por fim, só a forma, em vez de encolher tudo. A leitura continua pelo aria-label de cada marca e pela visão em tabela; o que se perde é o controle da legenda. Com quinze grupos, a legenda ao lado não cabe na altura da caixa e rola, sem empurrar o anel para fora.',
      largo: true,
      Previa: DecomposicaoDoDonut,
      codigo: `<div style={{ height: 240, overflow: 'hidden', resize: 'both' }}>
  <ChartDonut height="fill" title="..." /* dados */ />
</div>`,
    },
    {
      titulo: 'Total no centro',
      descricao: 'Passe o ponteiro numa fatia: o centro troca o total pelo valor e pelo rótulo dela.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartDonut formatValue={formatarCompacto} height={240} slices={CUSTOS} title="Estrutura de custos" />
        </div>
      ),
      codigo: `<ChartDonut
  title="Estrutura de custos"
  slices={[
    { label: 'Devoluções de vendas', value: 400000 },
    { label: 'CMV - Custo das mercadorias', value: 6300000 },
  ]}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Fatias pequenas em Outros',
      descricao: 'Abaixo do limiar a fatia deixa de ser legível no anel; reunidas, ocupam uma linha só da legenda.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartDonut
            formatValue={formatarCompacto}
            height={240}
            slices={DESPESAS_POR_TIPO}
            smallSliceThreshold={0.05}
            title="Estrutura de despesas"
          />
        </div>
      ),
      codigo: `<ChartDonut
  title="Estrutura de despesas"
  slices={despesas}
  smallSliceThreshold={0.05}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Anel fino, legenda embaixo',
      descricao: 'Espessura, rótulo do centro e posição da legenda são configuráveis.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartDonut
            centerLabel="Receita"
            formatValue={formatarCompacto}
            height={240}
            legend="bottom"
            slices={RECEITA}
            thickness={0.22}
            title="Composição da receita"
          />
        </div>
      ),
      codigo: `<ChartDonut
  title="Composição da receita"
  slices={receita}
  thickness={0.22}
  centerLabel="Receita"
  legend="bottom"
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Fatia no ponteiro',
      descricao: 'onHover leva a fatia, já agrupada, ao ChartTooltip, com o valor por extenso.',
      Previa: FatiaNoPonteiro,
      codigo: `const [fatia, setFatia] = useState<ChartDonutSlice | null>(null);
const cores = resolveSeriesColors(receita);

<ChartTooltip
  title={fatia?.label}
  columns={[{ format: formatCurrency }]}
  computed="none"
  rows={fatia ? [{
    color: cores[receita.findIndex((item) => item.label === fatia.label)],
    label: fatia.label,
    values: [fatia.value],
  }] : []}
>
  <ChartDonut showTooltip={false} title="Composição da receita" slices={receita} onHover={setFatia} />
</ChartTooltip>`,
    },
    {
      titulo: 'Detalhe do Outros',
      descricao:
        'A costura avisa também pela entrada da legenda, que não tem ponteiro: o segundo argumento traz color, a cor com que a fatia foi desenhada, e anchor, o ponto onde ancorar o balão. Em Outros, grouped traz as fatias reunidas.',
      Previa: DetalheDoOutros,
      codigo: `const [alvo, setAlvo] = useState<{ details?: ChartHoverDetails; slice: ChartDonutSlice } | null>(null);
const fatia = alvo?.slice;
const linhas = fatia?.grouped ?? (fatia ? [fatia] : []);

<ChartTooltip
  anchor={alvo?.details?.anchor}
  title={fatia?.label}
  columns={[{ format: formatCurrency }]}
  computed="none"
  showTotal={fatia?.grouped !== undefined}
  rows={linhas.map((item) => ({ color: alvo?.details?.color, label: item.label, values: [item.value] }))}
>
  <ChartDonut
    showTooltip={false}
    title="Estrutura de despesas"
    slices={despesas}
    onHover={(slice, details) => setAlvo(slice && { details, slice })}
  />
</ChartTooltip>`,
    },
    {
      titulo: 'Distribuição com a fatia em destaque',
      descricao:
        'O balão é do produto: aqui ele lista as fatias como o anel as desenha, já com Outros, por groupSmallSlices, a mesma regra do componente. Destaca a que está sob o ponteiro ou na entrada da legenda e soma o total. Pela legenda, o anchor do segundo argumento é o ponteiro, ou a entrada no foco pelo teclado; pela fatia, o balão segue o ponteiro.',
      Previa: Distribuicao,
      codigo: `const [alvo, setAlvo] = useState<{ details?: ChartHoverDetails; slice: ChartDonutSlice } | null>(null);
// As fatias como o anel as desenha: groupSmallSlices é a regra do componente, com os mesmos padrões.
const desenhadas = groupSmallSlices(situacao);
const cores = resolveSeriesColors(desenhadas);

<ChartTooltip
  title="Distribuição"
  anchor={alvo?.details?.anchor}
  showTotal
  rows={alvo ? desenhadas.map((item, indice) => ({
    color: cores[indice],
    emphasis: item.label === alvo.slice.label,
    label: item.label,
    values: [item.value],
  })) : []}
>
  <ChartDonut
    showTooltip={false}
    title="Situação do estoque"
    slices={situacao}
    onHover={(slice, details) => setAlvo(slice && { details, slice })}
  />
</ChartTooltip>`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartDonut formatValue={formatarCompacto} height={180} legend="none" slices={RECEITA} title="Receita" />
      </div>
    ),
    texto: 'O anel abriga o valor que importa no centro, aqui o total da receita.',
    codigo: '<ChartDonut title="Receita" slices={receita} legend="none" height={180} formatValue={formatarCompacto} />',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartDonut formatValue={formatarCompacto} height={180} legend="none" showCenter={false} slices={RECEITA} title="Receita" />
      </div>
    ),
    texto: 'Anel sem valor no centro: é o centro que separa o anel da pizza. Sem ele, ChartPie.',
    codigo: '<ChartDonut title="Receita" slices={receita} showCenter={false} legend="none" height={180} formatValue={formatarCompacto} />',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões. O desenho não recebe foco. Ponteiro ou foco numa entrada realça a fatia e abre o balão junto dela.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga a fatia da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Visão em tabela', como: <>O botão <code>Ver como tabela</code> troca o desenho pela leitura completa; <code>showTableToggle={'{false}'}</code> o tira.</>, teste: 'visao-em-tabela.test.tsx' },
    { garantia: 'Toque', como: 'O primeiro toque fixa o realce e o balão; tocar na marca fixada ativa onMarkClick; tocar fora ou rolar solta. A rolagem da página não é afetada.', teste: 'toque.test.tsx' },
    { garantia: 'Decomposição por encaixe', como: 'Sem espaço, as partes saem na ordem da família e a leitura segue pelo aria-label das marcas.', teste: 'decomposicao.test.tsx' },
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartDonut.test.tsx' },
    { garantia: 'Descrição da fatia', como: <><code>aria-label</code> com rótulo, valor e percentual.</>, teste: 'ChartDonut.test.tsx' },
    { garantia: 'Legenda como controle', como: <>Botão com <code>aria-pressed</code>; o anel se reparte e o produto é avisado.</>, teste: 'ChartDonut.test.tsx' },
    { garantia: 'Legenda avisa como a marca', como: 'Ponteiro e foco na entrada realçam a fatia, trocam o centro, disparam onHover e abrem o balão junto dela; fatia desligada não.', teste: 'ChartDonut.test.tsx' },
    { garantia: 'Fatia agrupada', como: 'onHover entrega a fatia reunida, e não a que o consumidor informou.', teste: 'ChartDonut.test.tsx' },
    { garantia: 'Número inválido', como: 'Uma fatia inválida não zera o anel.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem fatia positiva, um EmptyState no lugar do desenho.', teste: 'ChartDonut.test.tsx' },
  ],
  api: [
    { nome: 'showTableToggle', tipo: 'boolean', padrao: 'true', descricao: 'Botão "Ver como tabela". Sem a prop, vale o do ChartsProvider. Com a tabela aberta, a legenda sai. Desligado, fica só o desenho.' },
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'slices', tipo: 'readonly ChartDonutSlice[]', descricao: <><code>{'{ label, value, color?, intent? }'}</code>, uma por fatia.</> },
    { nome: 'thickness', tipo: 'number', padrao: '0.38', descricao: 'Espessura do anel, como fração do raio, entre 0 e 1.' },
    { nome: 'showCenter', tipo: 'boolean', padrao: 'true', descricao: 'Valor no centro do anel.' },
    { nome: 'centerLabel', tipo: 'string', padrao: "'Total'", descricao: 'Texto sob o valor do centro, trocado pelo rótulo da fatia sob o ponteiro.' },
    { nome: 'showLegendValues', tipo: 'boolean', padrao: 'true', descricao: 'Percentual em cada entrada da legenda.' },
    { nome: 'smallSliceThreshold', tipo: 'number', padrao: '0.02', descricao: <>Fração do total abaixo da qual a fatia é reunida. A regra é exportada como <code>groupSmallSlices</code>, para o balão próprio listar as fatias desenhadas.</> },
    { nome: 'otherLabel', tipo: 'string', padrao: "'Outros'", descricao: 'Rótulo da fatia que reúne as pequenas.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatNumber', descricao: 'Formato do centro e das descrições.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato dos valores no balão: o eixo pode sair compacto e o balão, exato.' },
    { nome: 'formatPercent', tipo: '(ratio: number) => string', descricao: 'Formato do percentual, a partir da fração. O padrão arredonda ao inteiro, como 42%.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica.' },
    { nome: 'sliceRadius', tipo: 'number', descricao: 'Raio dos cantos da fatia. Sem valor, o token de raio pequeno.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '260', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'right'", descricao: 'Posição da legenda.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'hidden', tipo: 'readonly string[]', descricao: 'Fatias ocultas, pelo rótulo, no modo controlado.' },
    { nome: 'hiddenSlices', tipo: 'readonly string[]', descricao: <>Obsoleto até a 0.7.0: use <code>hidden</code>. Com os dois, vale o novo.</> },
    { nome: 'defaultHidden', tipo: 'readonly string[]', descricao: 'Fatias ocultas de início, no modo não controlado.' },
    { nome: 'defaultHiddenSlices', tipo: 'readonly string[]', descricao: <>Obsoleto até a 0.7.0: use <code>defaultHidden</code>. Com os dois, vale o novo.</> },
    { nome: 'onHiddenChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'onHiddenSlicesChange', tipo: '(hidden: readonly string[]) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onHiddenChange</code>. Com os dois, os dois avisam.</> },
    { nome: 'onHover', tipo: '(slice: ChartDonutSlice | null, details?: ChartHoverDetails) => void', descricao: <>Fatia sob o ponteiro, o foco ou a entrada da legenda, já agrupada; costura para o ChartTooltip. Da legenda vem o segundo argumento: <code>color</code>, a cor desenhada, e <code>anchor</code>, o ponto da janela onde ancorar o balão.</> },
    { nome: 'onHoverSlice', tipo: '(slice: ChartDonutSlice | null, details?: ChartHoverDetails) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onHover</code>. Com os dois, os dois avisam.</> },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
    { nome: 'palette', tipo: 'ChartPalette', descricao: <>Lista de cores em rotação, ou <code>{'{ base }'}</code>, que gera os tons. Vence o <code>accent</code>.</> },
    { nome: 'onMarkClick', tipo: '(slice: ChartDonutSlice) => void', descricao: 'Torna as fatias botões, percorridos pelas setas; o balão abre no foco. Em Outros, grouped traz as fatias reunidas.' },
    { nome: 'onSliceClick', tipo: '(slice: ChartDonutSlice) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onMarkClick</code>. Com os dois, os dois avisam.</> },
  ],
};
