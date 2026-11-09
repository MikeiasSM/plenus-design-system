import {
  ChartRadial,
  formatPercent,
  type ChartLegendAlign,
  type ChartLegendPosition,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';
import { OPCOES_DE_ACCENT, accentDa } from '../dadosDosGraficos';
import { DecomposicaoDoRadial } from '../estrutura/decomposicao';

const METAS = [
  { label: 'Vendas', max: 100, value: 72 },
  { label: 'Serviços', max: 100, value: 45 },
  { label: 'Assinaturas', max: 100, value: 88 },
];

const VENDEDORES = [
  { label: 'Ana Prado', value: 42 },
  { label: 'Bruno Dias', value: 31 },
  { label: 'Célia Nunes', value: 18 },
];

const formatarMeta = (valor: number) => formatPercent(valor / 100);

const playground = definirPlayground({
  inicial: {
    title: 'Metas do trimestre',
    tracks: 3,
    startAngle: 0,
    endAngle: 360,
    thickness: 16,
    showCenter: true,
    centerLabel: '',
    legend: 'bottom',
    legendAlign: 'center',
    accent: 'nenhuma',
  },
  controles: [
    { tipo: 'texto', nome: 'title' },
    { tipo: 'numero', nome: 'tracks', min: 0, max: 3 },
    { tipo: 'numero', nome: 'startAngle', min: -180, max: 360, passo: 15 },
    { tipo: 'numero', nome: 'endAngle', min: -180, max: 360, passo: 15 },
    { tipo: 'numero', nome: 'thickness', min: 2, max: 48, passo: 2 },
    { tipo: 'booleano', nome: 'showCenter' },
    { tipo: 'texto', nome: 'centerLabel' },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'right', 'bottom', 'left', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'opcoes', nome: 'accent', opcoes: OPCOES_DE_ACCENT },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <ChartRadial
        accent={accentDa(valores.accent)}
        centerLabel={valores.centerLabel || undefined}
        endAngle={valores.endAngle}
        formatValue={formatarMeta}
        legend={valores.legend as ChartLegendPosition}
        legendAlign={valores.legendAlign as ChartLegendAlign}
        onHiddenChange={(ocultos) => registrar(`onHiddenChange: [${ocultos.join(', ')}]`)}
        showCenter={valores.showCenter}
        startAngle={valores.startAngle}
        thickness={valores.thickness}
        title={valores.title}
        tracks={METAS.slice(0, valores.tracks)}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ChartRadial', [
      ['title', valores.title],
      ['tracks', expr('metas')],
      ['startAngle', valores.startAngle, 0],
      ['endAngle', valores.endAngle, 360],
      ['thickness', valores.thickness, 16],
      ['showCenter', valores.showCenter, true],
      ['centerLabel', valores.centerLabel || undefined],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['accent', accentDa(valores.accent)],
      ['formatValue', expr('(valor) => formatPercent(valor / 100)')],
    ]),
  verificar: (valores) => {
    const volta = valores.endAngle - valores.startAngle;
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${valores.title.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, a imagem fica sem nome.' },
    ];

    if (volta <= 0) {
      verificacoes.push({ nivel: 'falha', titulo: 'Volta vazia', detalhe: 'endAngle precisa passar de startAngle; senão, não há arco a desenhar.' });
    } else if (volta > 360) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Mais de uma volta', detalhe: 'A volta se limita a 360 graus a partir de startAngle.' });
    }

    if (valores.tracks === 1) {
      verificacoes.push({ nivel: 'ok', titulo: 'Legenda dispensada', detalhe: 'Um anel só: a legenda aparece a partir de dois.' });
    }

    if (valores.showCenter && !valores.centerLabel) {
      verificacoes.push({ nivel: 'ok', titulo: 'Rótulo do centro', detalhe: 'Sem centerLabel, o centro usa o rótulo do primeiro anel visível.' });
    }

    return verificacoes;
  },
});

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Pista e arco</dt>
        <dd>
          Cada anel tem a pista de fundo, que é o quanto falta, e o arco de preenchimento, que cresce ao aparecer. O arco
          para na meta: valor acima de <code>max</code> preenche a volta inteira.
        </dd>
        <dt><code>max</code></dt>
        <dd>A meta do anel. Sem ela, a meta é o maior valor entre os anéis.</dd>
        <dt>Centro</dt>
        <dd>
          Traz o valor do primeiro anel visível e some quando todos estão desligados. Com um anel em foco, pelo ponteiro,
          pelo teclado ou pela legenda, mostra o valor e o rótulo dele, no lugar do <code>centerLabel</code>, e volta ao
          primeiro ao sair. Ele reserva o próprio espaço, até
          metade do raio: com muitos anéis, quem cede é a espessura deles, e a folga junto.
        </dd>
        <dt>Legenda</dt>
        <dd>Aparece a partir de dois anéis, com o valor de cada um. Desligar esvazia o arco e mantém a pista.</dd>
      </dl>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartRadial title="Metas do trimestre" tracks={[]} />
        <p className="note">Sem anéis, o gráfico anuncia a ausência em vez de desenhar pistas vazias.</p>
        <VerCodigo
          codigo={`<ChartRadial title="Metas do trimestre" tracks={[]} />`}
        />
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Decomposição por encaixe',
      descricao: 'Arraste o canto da caixa. Sem espaço, o gráfico retira a legenda, o texto do centro e, por fim, só a forma, em vez de encolher tudo. A leitura continua pelo aria-label de cada marca e pela visão em tabela; o que se perde é o controle da legenda.',
      largo: true,
      Previa: DecomposicaoDoRadial,
      codigo: `<div style={{ height: 240, overflow: 'hidden', resize: 'both' }}>
  <ChartRadial height="fill" title="..." /* dados */ />
</div>`,
    },
    {
      titulo: 'Anéis contra a meta',
      descricao: 'Três medidas, cada uma medida contra a própria meta.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartRadial formatValue={formatarMeta} height={280} title="Metas do trimestre" tracks={METAS} />
        </div>
      ),
      codigo: `<ChartRadial
  title="Metas do trimestre"
  tracks={[
    { label: 'Vendas', value: 72, max: 100 },
    { label: 'Serviços', value: 45, max: 100 },
    { label: 'Assinaturas', value: 88, max: 100 },
  ]}
  height={280}
  formatValue={(valor) => formatPercent(valor / 100)}
/>`,
    },
    {
      titulo: 'Meia-lua',
      descricao: 'Ângulos e espessura transformam a mesma composição num medidor.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartRadial
            endAngle={90}
            formatValue={formatarMeta}
            height={220}
            startAngle={-90}
            thickness={22}
            title="Atingimento da meta"
            tracks={[{ label: 'Meta mensal', max: 100, value: 64 }]}
          />
        </div>
      ),
      codigo: `<ChartRadial
  title="Atingimento da meta"
  tracks={[{ label: 'Meta mensal', value: 64, max: 100 }]}
  startAngle={-90}
  endAngle={90}
  thickness={22}
  height={220}
  formatValue={(valor) => formatPercent(valor / 100)}
/>`,
    },
    {
      titulo: 'Sem meta declarada',
      descricao: 'Sem max, a meta é o maior valor: o primeiro anel fecha a volta e os demais se medem contra ele.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartRadial centerLabel="contratos" height={260} title="Contratos por vendedor" tracks={VENDEDORES} />
        </div>
      ),
      codigo: `<ChartRadial
  title="Contratos por vendedor"
  tracks={[
    { label: 'Ana Prado', value: 42 },
    { label: 'Bruno Dias', value: 31 },
    { label: 'Célia Nunes', value: 18 },
  ]}
  centerLabel="contratos"
/>`,
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Percorre as entradas da legenda, que são botões a partir de dois anéis. O desenho não recebe foco. Ponteiro ou foco numa entrada realça o anel e abre o balão junto dela.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Liga ou desliga o anel da entrada focada; aria-pressed acompanha.' },
  ],
  garantias: [
    { garantia: 'Visão em tabela', como: <>O botão <code>Ver como tabela</code> troca o desenho pela leitura completa; <code>showTableToggle={'{false}'}</code> o tira.</>, teste: 'visao-em-tabela.test.tsx' },
    { garantia: 'Toque', como: 'O primeiro toque fixa o realce e o balão; tocar na marca fixada ativa onMarkClick; tocar fora ou rolar solta. A rolagem da página não é afetada.', teste: 'toque.test.tsx' },
    { garantia: 'Decomposição por encaixe', como: 'Sem espaço, as partes saem na ordem da família e a leitura segue pelo aria-label das marcas.', teste: 'decomposicao.test.tsx' },
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code>, nomeado pelo <code>title</code>.</>, teste: 'ChartRadial.test.tsx' },
    {
      garantia: 'Descrição do anel',
      como: <><code>aria-label</code> e <code>&lt;title&gt;</code> com rótulo e valor; não há costura com o ChartTooltip.</>,
      teste: 'ChartRadial.test.tsx',
    },
    { garantia: 'Medida contra a meta', como: 'O arco se mede contra o max do anel, e não contra o maior valor.', teste: 'ChartRadial.test.tsx' },
    { garantia: 'Centro legível', como: 'O centro reserva o espaço do valor mesmo com muitos anéis.', teste: 'ChartRadial.test.tsx' },
    { garantia: 'Número inválido', como: 'Um anel inválido não apaga os demais; o centro some com todos desligados.', teste: 'numeros-invalidos.test.tsx' },
    { garantia: 'Ausência anunciada', como: 'Sem anéis, um EmptyState no lugar do desenho.', teste: 'ChartRadial.test.tsx' },
  ],
  api: [
    { nome: 'showTableToggle', tipo: 'boolean', padrao: 'true', descricao: 'Botão "Ver como tabela". Com a tabela aberta, a legenda sai. Desligado, fica só o desenho.' },
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do gráfico.' },
    { nome: 'tracks', tipo: 'readonly ChartRadialTrack[]', descricao: <><code>{'{ label, value, max?, color?, intent? }'}</code>, um por anel, de fora para dentro.</> },
    { nome: 'startAngle', tipo: 'number', padrao: '0', descricao: 'Início da volta, em graus a partir do topo.' },
    { nome: 'endAngle', tipo: 'number', padrao: '360', descricao: 'Fim da volta, em graus a partir do topo.' },
    { nome: 'thickness', tipo: 'number', padrao: '16', descricao: 'Espessura de cada anel, em pixels; cede quando os anéis não cabem.' },
    { nome: 'showCenter', tipo: 'boolean', padrao: 'true', descricao: 'Valor do primeiro anel visível no centro, ou o do anel em foco.' },
    { nome: 'centerLabel', tipo: 'string', descricao: 'Texto sob o valor do centro. Sem ele, o rótulo do primeiro anel; o anel em foco mostra o próprio rótulo.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatNumber', descricao: 'Formato do centro, da legenda e das descrições.' },
    { nome: 'accent', tipo: 'string', descricao: 'Cor de tema que abre a paleta categórica.' },
    { nome: 'trackRadius', tipo: 'number', descricao: 'Raio das pontas do arco. Sem valor, o token de raio pequeno.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '260', descricao: 'Altura do desenho; fill a toma do contêiner.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'left' | 'right' | 'none'", padrao: "'bottom'", descricao: 'Posição da legenda, que aparece a partir de dois anéis.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'hidden', tipo: 'readonly string[]', descricao: 'Anéis ocultos, pelo rótulo, no modo controlado.' },
    { nome: 'hiddenTracks', tipo: 'readonly string[]', descricao: <>Obsoleto até a 0.7.0: use <code>hidden</code>. Com os dois, vale o novo.</> },
    { nome: 'defaultHidden', tipo: 'readonly string[]', descricao: 'Anéis ocultos de início, no modo não controlado.' },
    { nome: 'defaultHiddenTracks', tipo: 'readonly string[]', descricao: <>Obsoleto até a 0.7.0: use <code>defaultHidden</code>. Com os dois, vale o novo.</> },
    { nome: 'onHiddenChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'onHiddenTracksChange', tipo: '(hidden: readonly string[]) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onHiddenChange</code>. Com os dois, os dois avisam.</> },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Texto do estado vazio.' },
    { nome: 'palette', tipo: 'ChartPalette', descricao: <>Lista de cores em rotação, ou <code>{'{ base }'}</code>, que gera os tons. Vence o <code>accent</code>.</> },
    { nome: 'onHover', tipo: '(track: ChartRadialTrack | null, details?: ChartHoverDetails) => void', descricao: <>Anel sob o ponteiro, o foco ou a entrada da legenda; costura para o ChartTooltip. Da legenda vem o segundo argumento: <code>color</code>, a cor desenhada, e <code>anchor</code>, o ponto da janela onde ancorar o balão.</> },
    { nome: 'onMarkClick', tipo: '(track: ChartRadialTrack) => void', descricao: 'Torna os anéis botões, percorridos pelas setas; o balão abre no foco.' },
    { nome: 'onTrackClick', tipo: '(track: ChartRadialTrack) => void', descricao: <>Obsoleto até a 0.7.0: use <code>onMarkClick</code>. Com os dois, os dois avisam.</> },
  ],
};
