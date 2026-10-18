import { useState } from 'react';
import {
  ChartDonut,
  ChartTooltip,
  formatarMoeda,
  resolveSeriesColors,
  type ChartDonutSlice,
  type ChartLegendAlign,
  type ChartLegendPosition,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { DESPESAS_POR_TIPO, OPCOES_DE_ACCENT, RECEITA, accentDa, formatarCompacto } from '../dadosDosGraficos';

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
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartDonut
        accent={accentDa(valores.accent)}
        centerLabel={valores.centerLabel}
        formatValue={formatarCompacto}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        onHiddenSlicesChange={(ocultas) => registrar(`onHiddenSlicesChange: [${ocultas.join(', ')}]`)}
        onHoverSlice={(fatia) => registrar(`onHoverSlice: ${fatia ? fatia.label : null}`)}
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
      ['formatValue', expr('formatarCompacto')],
      ['onHoverSlice', expr('setFatia')],
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
        columns={[{ format: formatarMoeda }]}
        computed="none"
        rows={fatia ? [{ color: cor, label: fatia.label, values: [fatia.value] }] : []}
        title={fatia?.label}
      >
        <ChartDonut formatValue={formatarCompacto} height={240} onHoverSlice={setFatia} slices={RECEITA} title="Composição da receita" />
      </ChartTooltip>
    </div>
  );
}

function Variantes() {
  return (
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
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
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
      descricao: 'onHoverSlice leva a fatia, já agrupada, ao ChartTooltip, com o valor por extenso.',
      Previa: FatiaNoPonteiro,
      codigo: `const [fatia, setFatia] = useState<ChartDonutSlice | null>(null);
const cores = resolveSeriesColors(receita);

<ChartTooltip
  title={fatia?.label}
  columns={[{ format: formatarMoeda }]}
  computed="none"
  rows={fatia ? [{
    color: cores[receita.findIndex((item) => item.label === fatia.label)],
    label: fatia.label,
    values: [fatia.value],
  }] : []}
>
  <ChartDonut title="Composição da receita" slices={receita} onHoverSlice={setFatia} />
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
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartDonut formatValue={formatarCompacto} height={180} legend="none" showCenter={false} slices={RECEITA} title="Receita" />
      </div>
    ),
    texto: 'Anel sem valor no centro: é o centro que separa o anel da pizza. Sem ele, ChartPie.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões. O desenho não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga a fatia da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartDonut.test.tsx' },
    { garantia: 'Descrição da fatia', como: <><code>aria-label</code> com rótulo, valor e percentual.</>, teste: 'ChartDonut.test.tsx' },
    { garantia: 'Legenda como controle', como: <>Botão com <code>aria-pressed</code>; o anel se reparte e o produto é avisado.</>, teste: 'ChartDonut.test.tsx' },
    { garantia: 'Fatia agrupada', como: 'onHoverSlice entrega a fatia reunida, e não a que o consumidor informou.', teste: 'ChartDonut.test.tsx' },
    { garantia: 'Número inválido', como: 'Uma fatia inválida não zera o anel.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem fatia positiva, um EmptyState no lugar do desenho.', teste: 'ChartDonut.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'slices', tipo: 'readonly ChartDonutSlice[]', descricao: <><code>{'{ label, value, color?, intent? }'}</code>, uma por fatia.</> },
    { nome: 'thickness', tipo: 'number', padrao: '0.38', descricao: 'Espessura do anel, como fração do raio, entre 0 e 1.' },
    { nome: 'showCenter', tipo: 'boolean', padrao: 'true', descricao: 'Valor no centro do anel.' },
    { nome: 'centerLabel', tipo: 'string', padrao: "'Total'", descricao: 'Texto sob o valor do centro, trocado pelo rótulo da fatia sob o ponteiro.' },
    { nome: 'showLegendValues', tipo: 'boolean', padrao: 'true', descricao: 'Percentual em cada entrada da legenda.' },
    { nome: 'smallSliceThreshold', tipo: 'number', padrao: '0.02', descricao: 'Fração do total abaixo da qual a fatia é reunida.' },
    { nome: 'otherLabel', tipo: 'string', padrao: "'Outros'", descricao: 'Rótulo da fatia que reúne as pequenas.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do centro e das descrições.' },
    { nome: 'formatPercent', tipo: '(ratio: number) => string', descricao: 'Formato do percentual, a partir da fração. O padrão arredonda ao inteiro, como 42%.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica.' },
    { nome: 'sliceRadius', tipo: 'number', descricao: 'Raio dos cantos da fatia. Sem valor, o token de raio pequeno.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '260', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'right'", descricao: 'Posição da legenda.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'hiddenSlices', tipo: 'readonly string[]', descricao: 'Fatias ocultas, pelo rótulo, no modo controlado.' },
    { nome: 'defaultHiddenSlices', tipo: 'readonly string[]', descricao: 'Fatias ocultas de início, no modo não controlado.' },
    { nome: 'onHiddenSlicesChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'onHoverSlice', tipo: '(slice: ChartDonutSlice | null) => void', descricao: 'Fatia sob o ponteiro, já agrupada; costura para o ChartTooltip.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
  ],
};
