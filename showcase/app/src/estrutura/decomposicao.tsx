import {
  ChartArea,
  ChartBar,
  ChartCombo,
  ChartDonut,
  ChartGauge,
  ChartHeatmap,
  ChartLine,
  ChartMap,
  ChartPie,
  ChartRadial,
  ChartSankey,
  ChartScatter,
  ChartSunburst,
  ChartTimeline,
  ChartTreemap,
  ChartWaterfall,
} from '@plenustech/design-system';
import { COMPOSICAO, CONVERSAO, DESPESAS, DESPESAS_POR_TIPO, FATURAMENTO, MESES } from '../dadosDosGraficos';
import { MALHA_DAS_UFS } from '../dadosDoMapa';
import { ConteinerRedimensavel } from './ConteinerRedimensavel';

/**
 * Um gráfico por família, em `height="fill"` dentro de uma caixa que o leitor redimensiona. Cada página de gráfico
 * mostra o seu: arrastar o canto faz o gráfico retirar as partes na ordem da família, só quando elas não cabem.
 */

const horas = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].flatMap((x, coluna) =>
  ['Manhã', 'Tarde', 'Noite'].map((y, linha) => ({ value: (coluna * 7 + linha * 13) % 40, x, y })),
);

export const DecomposicaoDoBar = () => (
  <ConteinerRedimensavel>
    <ChartBar categories={MESES} height="fill" series={COMPOSICAO} title="Faturamento" xAxisTitle="Mês" yAxisTitle="Valor" />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoLine = () => (
  <ConteinerRedimensavel>
    <ChartLine categories={MESES} height="fill" series={COMPOSICAO} title="Faturamento" xAxisTitle="Mês" yAxisTitle="Valor" />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoArea = () => (
  <ConteinerRedimensavel>
    <ChartArea categories={MESES} height="fill" series={COMPOSICAO} title="Faturamento" xAxisTitle="Mês" yAxisTitle="Valor" />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoCombo = () => (
  <ConteinerRedimensavel>
    <ChartCombo
      categories={MESES}
      height="fill"
      series={[
        { kind: 'bar', label: 'Faturamento', values: FATURAMENTO },
        { axis: 'right', kind: 'line', label: 'Conversão', values: CONVERSAO },
      ]}
      title="Faturamento e conversão"
    />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoWaterfall = () => (
  <ConteinerRedimensavel>
    <ChartWaterfall
      height="fill"
      steps={[
        { label: 'Receita', total: true, value: 100 },
        { label: 'Custos', value: -45 },
        { label: 'Impostos', value: -12 },
        { label: 'Resultado', total: true, value: 43 },
      ]}
      title="Formação do resultado"
      yAxisTitle="Valor"
    />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoScatter = () => (
  <ConteinerRedimensavel>
    <ChartScatter
      height="fill"
      series={[
        { label: 'Norte', points: [{ x: 12, y: 18 }, { x: 25, y: 22 }, { x: 31, y: 30 }] },
        { label: 'Sul', points: [{ x: 15, y: 10 }, { x: 28, y: 16 }] },
      ]}
      title="Prazo por margem"
      xAxisTitle="Prazo"
      yAxisTitle="Margem"
    />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoPie = () => (
  <ConteinerRedimensavel>
    <ChartPie height="fill" legend="right" slices={DESPESAS_POR_TIPO} title="Estrutura de despesas" />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoDonut = () => (
  <ConteinerRedimensavel>
    <ChartDonut height="fill" legend="right" slices={DESPESAS_POR_TIPO} title="Estrutura de despesas" />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoRadial = () => (
  <ConteinerRedimensavel>
    <ChartRadial
      height="fill"
      legend="right"
      title="Metas do trimestre"
      tracks={[
        { label: 'Vendas', max: 100, value: 72 },
        { label: 'Leads', max: 100, value: 45 },
      ]}
    />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoGauge = () => (
  <ConteinerRedimensavel>
    <ChartGauge
      height="fill"
      max={100}
      min={0}
      segments={[
        { intent: 'negative', label: 'Crítica', to: 40 },
        { intent: 'warning', label: 'Atenção', to: 70 },
        { intent: 'positive', label: 'Boa', to: 100 },
      ]}
      target={{ label: 'Meta', value: 80 }}
      title="Atingimento da meta"
      value={64}
    />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoTreemap = () => (
  <ConteinerRedimensavel>
    <ChartTreemap height="fill" nodes={DESPESAS} title="Despesas" />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoSunburst = () => (
  <ConteinerRedimensavel>
    <ChartSunburst height="fill" nodes={DESPESAS} title="Despesas" />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoSankey = () => (
  <ConteinerRedimensavel>
    <ChartSankey
      flows={[
        { source: 'Receita', target: 'Custos', value: 40 },
        { source: 'Receita', target: 'Resultado', value: 60 },
        { source: 'Custos', target: 'Pessoal', value: 25 },
        { source: 'Custos', target: 'Outros', value: 15 },
      ]}
      height="fill"
      title="Fluxo do resultado"
    />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoHeatmap = () => (
  <ConteinerRedimensavel>
    <ChartHeatmap cells={horas} height="fill" title="Atendimentos por horário" />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoMap = () => (
  <ConteinerRedimensavel>
    <ChartMap
      data={MALHA_DAS_UFS.features.map((uf, indice) => ({ id: String(uf.id), value: ((indice * 37) % 100) + 5 }))}
      geometry={MALHA_DAS_UFS}
      height="fill"
      title="Vendas por UF"
    />
  </ConteinerRedimensavel>
);

export const DecomposicaoDoTimeline = () => (
  <ConteinerRedimensavel>
    <ChartTimeline
      height="fill"
      rowSummary={(linha) => ({ subtitle: 'no período', title: `${linha.label.length} h` })}
      rows={[
        { key: 'a', label: 'Equipe de implantação' },
        { key: 'b', label: 'Equipe de suporte' },
      ]}
      segments={[
        { end: 4, row: 'a', series: 'Trabalho', start: 1 },
        { end: 8, row: 'b', series: 'Trabalho', start: 3 },
      ]}
      series={[{ label: 'Trabalho' }]}
      title="Jornada"
    />
  </ConteinerRedimensavel>
);
