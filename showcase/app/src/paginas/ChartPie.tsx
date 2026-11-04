import { useState } from 'react';
import {
  ChartPie,
  ChartTooltip,
  formatCurrency,
  resolveSeriesColors,
  type ChartLegendAlign,
  type ChartLegendPosition,
  type ChartPieSlice,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { DESPESAS_POR_TIPO, OPCOES_DE_ACCENT, RECEITA, accentDa, formatarCompacto, FORMATOS } from '../dadosDosGraficos';
import { DecomposicaoDoPie } from '../estrutura/decomposicao';

const TOTAL_DESPESAS_POR_TIPO = DESPESAS_POR_TIPO.reduce((soma, fatia) => soma + fatia.value, 0);
const TOTAL_DA_RECEITA = RECEITA.reduce((soma, fatia) => soma + fatia.value, 0);

const playground = definirPlayground({
  inicial: {
    title: 'Estrutura de despesas',
    showDataLabels: true,
    showLegendValues: false,
    smallSliceThreshold: 0.02,
    otherLabel: 'Outros',
    legend: 'bottom',
    legendAlign: 'center',
    accent: 'nenhuma',
    formatValue: 'compacto',
    formatTooltipValue: 'igual',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'booleano', nome: 'showDataLabels' },
    { tipo: 'booleano', nome: 'showLegendValues' },
    { tipo: 'numero', nome: 'smallSliceThreshold', min: 0, max: 0.2, passo: 0.01 },
    { tipo: 'texto', nome: 'otherLabel' },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
    { tipo: 'opcoes', nome: 'formatValue', opcoes: Object.keys(FORMATOS) },
    { tipo: 'opcoes', nome: 'formatTooltipValue', opcoes: ['igual', ...Object.keys(FORMATOS)] },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartPie
        accent={accentDa(valores.accent)}
        formatTooltipValue={FORMATOS[valores.formatTooltipValue]?.formatar}
        formatValue={FORMATOS[valores.formatValue].formatar}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        onHiddenChange={(ocultas) => registrar(`onHiddenChange: [${ocultas.join(', ')}]`)}
        onHover={(fatia) => registrar(`onHover: ${fatia ? fatia.label : null}`)}
        otherLabel={valores.otherLabel}
        showDataLabels={valores.showDataLabels}
        showLegendValues={valores.showLegendValues}
        slices={DESPESAS_POR_TIPO}
        smallSliceThreshold={valores.smallSliceThreshold}
        title={valores.title}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartPie', [
      ['title', valores.title],
      ['slices', expr('despesas')],
      ['showDataLabels', valores.showDataLabels, false],
      ['showLegendValues', valores.showLegendValues, false],
      ['smallSliceThreshold', valores.smallSliceThreshold, 0.02],
      ['otherLabel', valores.otherLabel, 'Outros'],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr(FORMATOS[valores.formatValue].codigo)],
      ['formatTooltipValue', FORMATOS[valores.formatTooltipValue] && expr(FORMATOS[valores.formatTooltipValue].codigo)],
      ['onHover', expr('setFatia')],
    ]),
  verificar: (valores) => {
    const pequenas = DESPESAS_POR_TIPO.filter((fatia) => fatia.value / TOTAL_DESPESAS_POR_TIPO < valores.smallSliceThreshold);
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
    ];

    if (pequenas.length >= 2) {
      verificacoes.push({
        nivel: 'ok',
        titulo: `Fatias reunidas em "${valores.otherLabel}"`,
        detalhe: `${pequenas.map((fatia) => fatia.label).join(', ')} ficam abaixo do limiar e viram uma fatia neutra.`,
      });
    } else {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Fatias finas',
        detalhe: 'Abaixo de 2% a fatia deixa de ser legível e ainda ocupa uma linha da legenda. Só duas ou mais pequenas são reunidas.',
      });
    }

    if (!valores.otherLabel.trim() && pequenas.length >= 2) {
      verificacoes.push({ nivel: 'falha', titulo: 'Fatia sem nome', detalhe: 'A fatia reunida fica sem rótulo na legenda e na descrição.' });
    }

    if (valores.showDataLabels) {
      verificacoes.push({ nivel: 'ok', titulo: 'Rótulo onde cabe', detalhe: 'O percentual só entra na fatia que o comporta, na cor de texto medida para ela.' });
    }

    return verificacoes;
  },
});

function FatiaNoPonteiro() {
  const [fatia, setFatia] = useState<ChartPieSlice | null>(null);
  const cores = resolveSeriesColors(RECEITA);
  const cor = fatia ? cores[RECEITA.findIndex((item) => item.label === fatia.label)] : undefined;

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatCurrency }]}
        computed={{ compute: (valor) => valor / TOTAL_DA_RECEITA }}
        rows={fatia ? [{ color: cor, label: fatia.label, values: [fatia.value] }] : []}
        subtitle="Valor e fatia da receita"
        title={fatia?.label}
      >
        <ChartPie showTooltip={false} formatValue={formatarCompacto} height={240} onHover={setFatia} slices={RECEITA} title="Composição da receita" />
      </ChartTooltip>
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt><code>showDataLabels</code></dt>
        <dd>
          O percentual só entra quando a fatia o comporta: até meia volta a largura disponível é a corda no centro do
          arco, dali em diante é o raio. Fatia estreita fica sem rótulo em vez de receber um texto que não cabe.
        </dd>
        <dt><code>smallSliceThreshold</code></dt>
        <dd>
          Duas ou mais fatias abaixo do limiar viram uma, com o rótulo de <code>otherLabel</code> e intenção neutra. Ela
          entra no lugar da primeira pequena, para a ordem das demais não mudar.
        </dd>
        <dt>Legenda</dt>
        <dd>
          Desliga a fatia, e o círculo se reparte entre as demais em movimento. Com <code>showLegendValues</code>, cada
          entrada traz o percentual.
        </dd>
        <dt>Pizza ou anel</dt>
        <dd>
          ChartPie e ChartDonut são a mesma composição com papéis distintos: o anel existe para abrigar um valor no centro.
          Sem valor central a mostrar, a pizza.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartPie slices={[]} title="Composição da receita" />
        <p className="note">Sem fatia positiva, o gráfico anuncia a ausência em vez de desenhar uma pizza vazia.</p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Decomposição por encaixe',
      descricao: 'Arraste o canto da caixa. Sem espaço, o gráfico retira a legenda e, depois, só a forma, em vez de encolher tudo. A leitura continua pelo aria-label de cada marca e pela visão em tabela; o que se perde é o controle da legenda.',
      largo: true,
      Previa: DecomposicaoDoPie,
      codigo: `<div style={{ height: 240, overflow: 'hidden', resize: 'both' }}>
  <ChartPie height="fill" title="..." /* dados */ />
</div>`,
    },
    {
      titulo: 'Percentual na fatia',
      descricao: 'O texto sobre a fatia usa o token de texto daquela cor, medido nos dois temas.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartPie formatValue={formatarCompacto} height={260} showDataLabels slices={RECEITA} title="Composição da receita" />
        </div>
      ),
      codigo: `<ChartPie
  title="Composição da receita"
  slices={[
    { label: 'Serviços', value: 320000 },
    { label: 'Produtos', value: 280000 },
    { label: 'Assinaturas', value: 150000 },
  ]}
  showDataLabels
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Percentual na legenda',
      descricao: 'Legenda à direita, com o percentual alinhado numa coluna.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartPie
            formatValue={formatarCompacto}
            height={220}
            legend="right"
            showLegendValues
            slices={DESPESAS_POR_TIPO}
            smallSliceThreshold={0.05}
            title="Estrutura de despesas"
          />
        </div>
      ),
      codigo: `<ChartPie
  title="Estrutura de despesas"
  slices={despesas}
  legend="right"
  showLegendValues
  smallSliceThreshold={0.05}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Paleta do gráfico',
      descricao: 'Uma cor base gera os tons da mesma matiz, do mais escuro ao mais claro; uma lista gira entre as fatias.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartPie formatValue={formatarCompacto} height={240} palette={{ base: '#1F6FB2' }} showDataLabels slices={DESPESAS_POR_TIPO} title="Estrutura de despesas" />
        </div>
      ),
      codigo: `<ChartPie
  title="Estrutura de despesas"
  slices={despesas}
  palette={{ base: '#1F6FB2' }}
  showDataLabels
/>`,
    },
    {
      titulo: 'Fatia no ponteiro',
      descricao: 'onHover entrega a fatia já agrupada; a coluna calculada mostra a parte do total.',
      Previa: FatiaNoPonteiro,
      codigo: `const [fatia, setFatia] = useState<ChartPieSlice | null>(null);
const cores = resolveSeriesColors(receita);

<ChartTooltip
  title={fatia?.label}
  subtitle="Valor e fatia da receita"
  columns={[{ format: formatCurrency }]}
  computed={{ compute: (valor) => valor / totalDaReceita }}
  rows={fatia ? [{
    color: cores[receita.findIndex((item) => item.label === fatia.label)],
    label: fatia.label,
    values: [fatia.value],
  }] : []}
>
  <ChartPie showTooltip={false} title="Composição da receita" slices={receita} onHover={setFatia} />
</ChartTooltip>`,
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões. O desenho não recebe foco. Ponteiro ou foco numa entrada realça a fatia e abre o balão junto dela.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga a fatia da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Visão em tabela', como: <>O botão <code>Ver como tabela</code> troca o desenho pela leitura completa; <code>showTableToggle={'{false}'}</code> o tira.</>, teste: 'visao-em-tabela.test.tsx' },
    { garantia: 'Toque', como: 'O primeiro toque fixa o realce e o balão; tocar na marca fixada ativa onMarkClick; tocar fora ou rolar solta. A rolagem da página não é afetada.', teste: 'toque.test.tsx' },
    { garantia: 'Decomposição por encaixe', como: 'Sem espaço, as partes saem na ordem da família e a leitura segue pelo aria-label das marcas.', teste: 'decomposicao.test.tsx' },
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartPie.test.tsx' },
    { garantia: 'Descrição da fatia', como: <><code>aria-label</code> com rótulo, valor e percentual.</>, teste: 'ChartPie.test.tsx' },
    { garantia: 'Legenda como controle', como: <>Botão com <code>aria-pressed</code> que desliga a fatia.</>, teste: 'ChartPie.test.tsx' },
    { garantia: 'Contraste do rótulo', como: <>O percentual usa o token <code>chart.on-*</code> da cor da fatia.</>, teste: 'check:contraste' },
    { garantia: 'Número inválido', como: 'Uma fatia inválida não zera o círculo nem impede o agrupamento.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem fatia positiva, um EmptyState no lugar do desenho.', teste: 'ChartPie.test.tsx' },
  ],
  api: [
    { nome: 'showTableToggle', tipo: 'boolean', padrao: 'true', descricao: 'Botão "Ver como tabela". Com a tabela aberta, a legenda sai. Desligado, fica só o desenho.' },
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'slices', tipo: 'readonly ChartPieSlice[]', descricao: <><code>{'{ label, value, color?, intent? }'}</code>, uma por fatia.</> },
    { nome: 'showDataLabels', tipo: 'boolean', padrao: 'false', descricao: 'Percentual dentro da fatia, onde couber.' },
    { nome: 'showLegendValues', tipo: 'boolean', padrao: 'false', descricao: 'Percentual em cada entrada da legenda.' },
    { nome: 'smallSliceThreshold', tipo: 'number', padrao: '0.02', descricao: 'Fração do total abaixo da qual a fatia é reunida.' },
    { nome: 'otherLabel', tipo: 'string', padrao: "'Outros'", descricao: 'Rótulo da fatia que reúne as pequenas.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatNumber', descricao: 'Formato do valor nas descrições.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato dos valores no balão: o eixo pode sair compacto e o balão, exato.' },
    { nome: 'formatPercent', tipo: '(ratio: number) => string', descricao: 'Formato do percentual, a partir da fração. O padrão arredonda ao inteiro, como 42%.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica.' },
    { nome: 'palette', tipo: 'ChartPalette', descricao: <>Lista de cores em rotação, ou <code>{'{ base }'}</code>, que gera os tons. Vence o <code>accent</code>.</> },
    { nome: 'sliceRadius', tipo: 'number', descricao: 'Raio dos cantos da fatia. Sem valor, o token de raio pequeno.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '260', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'hidden', tipo: 'readonly string[]', descricao: 'Fatias ocultas, pelo rótulo, no modo controlado.' },
    { nome: 'hiddenSlices', tipo: 'readonly string[]', descricao: <>Obsoleto até a 0.7.0: use <code>hidden</code>. Com os dois, vale o novo.</> },
    { nome: 'defaultHidden', tipo: 'readonly string[]', descricao: 'Fatias ocultas de início, no modo não controlado.' },
    { nome: 'defaultHiddenSlices', tipo: 'readonly string[]', descricao: <>Obsoleto até a 0.7.0: use <code>defaultHidden</code>. Com os dois, vale o novo.</> },
    { nome: 'onHiddenChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'onHiddenSlicesChange', tipo: '(hidden: readonly string[]) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onHiddenChange</code>. Com os dois, os dois avisam.</> },
    { nome: 'onHover', tipo: '(slice: ChartPieSlice | null, details?: ChartHoverDetails) => void', descricao: <>Fatia sob o ponteiro, o foco ou a entrada da legenda, já agrupada; costura para o ChartTooltip. Da legenda vem o segundo argumento: <code>color</code>, a cor desenhada, e <code>anchor</code>, o ponto da janela onde ancorar o balão.</> },
    { nome: 'onHoverSlice', tipo: '(slice: ChartPieSlice | null, details?: ChartHoverDetails) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onHover</code>. Com os dois, os dois avisam.</> },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
    { nome: 'onMarkClick', tipo: '(slice: ChartPieSlice) => void', descricao: 'Torna as fatias botões, percorridos pelas setas; o balão abre no foco. Em Outros, grouped traz as fatias reunidas.' },
    { nome: 'onSliceClick', tipo: '(slice: ChartPieSlice) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onMarkClick</code>. Com os dois, os dois avisam.</> },
  ],
};
