import { useState } from 'react';
import {
  ChartSunburst,
  ChartTooltip,
  formatarMoeda,
  type ChartHoveredNode,
  type ChartLegendAlign,
  type ChartLegendPosition,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { DESPESAS, OPCOES_DE_ACCENT, TOTAL_DE_DESPESAS, accentDa, formatarCompacto } from '../dadosDosGraficos';

const playground = definirPlayground({
  inicial: {
    title: 'Estrutura de despesas',
    showLabels: true,
    ringGap: 2,
    legend: 'bottom',
    legendAlign: 'center',
    accent: 'nenhuma',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'booleano', nome: 'showLabels' },
    { tipo: 'numero', nome: 'ringGap', min: 0, max: 12 },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartSunburst
        accent={accentDa(valores.accent)}
        formatValue={formatarCompacto}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        nodes={DESPESAS}
        onHiddenGroupsChange={(ocultos) => registrar(`onHiddenGroupsChange: [${ocultos.join(', ')}]`)}
        onHoverNode={(caminho) => registrar(`onHoverNode: ${caminho ? caminho.map((nivel) => nivel.label).join(' › ') : null}`)}
        ringGap={valores.ringGap}
        showLabels={valores.showLabels}
        title={valores.title}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartSunburst', [
      ['title', valores.title],
      ['nodes', expr('despesas')],
      ['showLabels', valores.showLabels, true],
      ['ringGap', valores.ringGap, 2],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr('formatarCompacto')],
      ['onHoverNode', expr('setCaminho')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
      { nivel: 'ok', titulo: 'Hierarquia na cor', detalhe: 'Os filhos nascem da cor do pai e clareiam a cada anel.' },
    ];

    if (!valores.showLabels) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Anel externo sem nome',
        detalhe: 'A legenda nomeia só o nível zero. Sem rótulos, os demais arcos dependem do ponteiro para serem lidos.',
      });
    }

    if (valores.legend === 'none') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Sem legenda', detalhe: 'Os grupos do nível zero deixam de ser nomeados e de ser desligáveis.' });
    }

    return verificacoes;
  },
});

function CaminhoNoPonteiro() {
  const [caminho, setCaminho] = useState<readonly ChartHoveredNode[] | null>(null);

  return (
    <div style={{ width: '100%' }}>
      <ChartTooltip
        columns={[{ format: formatarMoeda }]}
        computed={{ compute: (valor) => valor / TOTAL_DE_DESPESAS }}
        rows={(caminho ?? []).map((nivel, indice, niveis) => ({
          emphasis: indice === niveis.length - 1,
          label: nivel.label,
          values: [nivel.value],
        }))}
        subtitle="Valor e fatia do total de despesas"
        title={caminho?.at(-1)?.label}
      >
        <ChartSunburst showTooltip={false} formatValue={formatarCompacto} height={320} nodes={DESPESAS} onHoverNode={setCaminho} title="Estrutura de despesas" />
      </ChartTooltip>
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Anéis</dt>
        <dd>
          Os filhos repartem o ângulo do pai e nascem da cor dele, clareando a cada anel: sem isso, os anéis externos
          repetiriam a cor do nível zero e nada distinguiria um filho do outro.
        </dd>
        <dt>Ponteiro</dt>
        <dd>
          Acende o arco e os que o originaram, até a raiz, e apaga o resto, inclusive os filhos dele, que não explicam nada
          sobre ele.
        </dd>
        <dt>Legenda</dt>
        <dd>Lista apenas o nível zero, e desliga o ramo inteiro.</dd>
        <dt><code>showLabels</code></dt>
        <dd>
          O rótulo do anel externo é projetado para fora, com um conector de dois segmentos. A banda dele é reservada antes
          do anel, para o texto não ser cortado; sem rótulos, o anel cresce.
        </dd>
        <dt><code>onHoverNode</code></dt>
        <dd>Entrega o caminho do grupo ao arco sob o ponteiro, cada nível com o valor somado. Com ele, o <code>&lt;title&gt;</code> sai.</dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartSunburst nodes={[]} title="Estrutura de despesas" />
        <p className="note">Sem nós, o gráfico anuncia a ausência em vez de desenhar anéis vazios.</p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Anéis aninhados',
      descricao: 'Grupo no anel de dentro, itens no de fora, com o rótulo projetado.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartSunburst formatValue={formatarCompacto} height={340} nodes={DESPESAS} title="Estrutura de despesas" />
        </div>
      ),
      codigo: `<ChartSunburst
  title="Estrutura de despesas"
  nodes={[
    {
      label: 'Operacionais',
      children: [
        { label: 'Pessoal', value: 520000 },
        { label: 'Aluguel', value: 180000 },
        { label: 'Energia', value: 90000 },
      ],
    },
    { label: 'Administrativas', children: [...] },
    { label: 'Financeiras', children: [{ label: 'Juros', value: 120000 }] },
  ]}
  height={340}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Sem rótulos',
      descricao: 'Num cartão estreito, o anel ocupa a área inteira; a leitura fica no ponteiro.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartSunburst formatValue={formatarCompacto} height={240} nodes={DESPESAS} showLabels={false} title="Estrutura de despesas" />
        </div>
      ),
      codigo: `<ChartSunburst
  title="Estrutura de despesas"
  nodes={despesas}
  showLabels={false}
  height={240}
  formatValue={formatarCompacto}
/>`,
    },
    {
      titulo: 'Caminho no ponteiro',
      descricao: 'Uma linha por nível no ChartTooltip; a última, a do próprio arco, sobe de tom.',
      Previa: CaminhoNoPonteiro,
      codigo: `const [caminho, setCaminho] = useState<readonly ChartHoveredNode[] | null>(null);

<ChartTooltip
  title={caminho?.at(-1)?.label}
  subtitle="Valor e fatia do total de despesas"
  columns={[{ format: formatarMoeda }]}
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
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, uma por grupo do nível zero. O desenho não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga o ramo da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartSunburst.test.tsx' },
    {
      garantia: 'Descrição do arco',
      como: <><code>aria-label</code> com rótulo, valor e percentual; sem costura, também no <code>&lt;title&gt;</code>.</>,
      teste: 'ChartSunburst.test.tsx',
    },
    { garantia: 'Hierarquia', como: 'Os filhos repartem o ângulo do pai e clareiam a cor dele a cada anel.', teste: 'ChartSunburst.test.tsx' },
    { garantia: 'Realce do ramo', como: 'O ponteiro acende o arco e os ancestrais, sem os filhos.', teste: 'ChartSunburst.test.tsx' },
    { garantia: 'Rótulo inteiro', como: 'A banda dos rótulos é reservada antes do anel, e o texto não some.', teste: 'ChartSunburst.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem nós, um EmptyState no lugar do desenho.', teste: 'ChartSunburst.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    {
      nome: 'nodes',
      tipo: 'readonly ChartSunburstNode[]',
      descricao: <><code>{'{ label, value?, children?, color?, intent? }'}</code>; o nó sem value vale a soma dos filhos.</>,
    },
    { nome: 'showLabels', tipo: 'boolean', padrao: 'true', descricao: 'Rótulo projetado no anel externo.' },
    { nome: 'ringGap', tipo: 'number', padrao: '2', descricao: 'Folga entre dois anéis vizinhos.' },
    { nome: 'sliceRadius', tipo: 'number', descricao: 'Raio das pontas de cada arco. Sem valor, o token de raio pequeno.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato do valor nos rótulos e nas descrições.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato dos valores no balão: o eixo pode sair compacto e o balão, exato.' },
    { nome: 'formatPercent', tipo: '(ratio: number) => string', descricao: 'Formato do percentual, a partir da fração. O padrão arredonda ao inteiro, como 42%.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica dos grupos.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '320', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda, com os grupos do nível zero.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'hiddenGroups', tipo: 'readonly string[]', descricao: 'Grupos ocultos, pelo rótulo, no modo controlado.' },
    { nome: 'defaultHiddenGroups', tipo: 'readonly string[]', descricao: 'Grupos ocultos de início, no modo não controlado.' },
    { nome: 'onHiddenGroupsChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    {
      nome: 'onHoverNode',
      tipo: '(path: readonly ChartHoveredNode[] | null) => void',
      descricao: 'Caminho do grupo ao arco sob o ponteiro, com os valores somados; costura para o ChartTooltip.',
    },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
  ],
};
