import { useEffect, useState } from 'react';
import {
  Button,
  ChartMap,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  Skeleton,
  type ChartLegendAlign,
  type ChartMapColorScale,
  type ChartMapFeature,
  type ChartMapFeatureCollection,
  type ChartMapLegendPosition,
  type ChartMapMarkerSeries,
  type ChartMapProps,
  type ChartMapRegionDatum,
} from '@plenustech/design-system';
import { expr, gerarJsx, type Atributo } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VISIBILIDADES } from '../dadosDosGraficos';
import { MALHA_DAS_UFS } from '../dadosDoMapa';

/* ---- Dados de exemplo, por UF ------------------------------------------------------------------------------------ */

const porUf = (valores: Record<string, number | null>): ChartMapRegionDatum[] =>
  Object.entries(valores).map(([id, value]) => ({ id, value }));

/** Vendas simuladas da base de teste do mantenedor; Roraima e Amapá ficam sem dado. */
const VENDAS = porUf({
  SP: 1794832000, MG: 925625000, RJ: 768099000, BA: 564275000, RS: 519635000, PR: 496949000, CE: 454588000,
  PE: 439363000, SC: 388279000, MA: 337032000, GO: 330591000, PA: 328312000, ES: 180612000, PB: 174164000,
  AL: 163154000, PI: 161310000, RN: 153112000, MT: 142565000, AM: 140192000, DF: 116135000, MS: 102941000,
  SE: 101147000, RO: 79939000, TO: 73209000, AC: 52503000,
});

const VARIACAO = porUf({
  SP: 8.4, MG: 5.1, RJ: -3.2, ES: 2.7, PR: 11.8, SC: 14.6, RS: -6.9, BA: 4.3, PE: 9.7, CE: 12.1, MA: -2.4, PB: 6.8,
  RN: 3.9, AL: -8.1, SE: 1.2, PI: 7.4, GO: 18.3, DF: 2.1, MT: 23.6, MS: 15.2, PA: -4.6, AM: -11.3, RO: 6.2, TO: 9.1,
  AC: -17.8, RR: 4.4, AP: null,
});

const COBERTURA = porUf({
  SP: 94, RJ: 88, MG: 71, ES: 76, PR: 83, SC: 86, RS: 79, DF: 100, GO: 64, MS: 58, MT: 42, BA: 55, PE: 68, CE: 61,
  MA: 33, PB: 57, RN: 52, AL: 47, SE: 62, PI: 29, PA: 24, AM: 12, RO: 37, TO: 31, AC: 18, RR: 15, AP: null,
});

const REGIONAIS = [
  { id: 'norte-co', label: 'Regional Norte e Centro-Oeste', ufs: ['AC', 'AM', 'AP', 'PA', 'RO', 'TO', 'GO', 'MT', 'MS', 'DF'] },
  { id: 'nordeste', label: 'Regional Nordeste', ufs: ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'] },
  { id: 'sudeste', label: 'Regional Sudeste', ufs: ['MG', 'RJ', 'ES'] },
  { id: 'sao-paulo', label: 'Regional São Paulo', ufs: ['SP'] },
  { id: 'sul', label: 'Regional Sul', ufs: ['PR', 'SC', 'RS'] },
];
const CATEGORIAS_DAS_REGIONAIS = REGIONAIS.map(({ id, label }) => ({ id, label }));
const REGIONAL_POR_UF: ChartMapRegionDatum[] = REGIONAIS.flatMap((regional) =>
  regional.ufs.map((id) => ({ category: regional.id, id })),
);

const CAPITAIS: ChartMapMarkerSeries[] = [
  {
    id: 'diretos',
    label: 'Clientes diretos',
    points: (
      [
        ['sao-paulo', 'São Paulo', -23.55, -46.63, 1840], ['rio', 'Rio de Janeiro', -22.91, -43.17, 960],
        ['bh', 'Belo Horizonte', -19.92, -43.94, 720], ['curitiba', 'Curitiba', -25.43, -49.27, 610],
        ['poa', 'Porto Alegre', -30.03, -51.23, 580], ['brasilia', 'Brasília', -15.79, -47.88, 540],
        ['salvador', 'Salvador', -12.97, -38.5, 430], ['recife', 'Recife', -8.05, -34.88, 410],
        ['fortaleza', 'Fortaleza', -3.73, -38.52, 390], ['goiania', 'Goiânia', -16.69, -49.26, 350],
        ['floripa', 'Florianópolis', -27.6, -48.55, 300], ['manaus', 'Manaus', -3.12, -60.02, 230],
        ['belem', 'Belém', -1.46, -48.49, 210], ['vitoria', 'Vitória', -20.32, -40.34, 190],
        ['campo-grande', 'Campo Grande', -20.46, -54.62, 170], ['cuiaba', 'Cuiabá', -15.6, -56.1, 160],
        ['natal', 'Natal', -5.79, -35.21, 140], ['joao-pessoa', 'João Pessoa', -7.12, -34.86, 135],
        ['sao-luis', 'São Luís', -2.53, -44.3, 120], ['maceio', 'Maceió', -9.67, -35.74, 110],
        ['teresina', 'Teresina', -5.09, -42.8, 95], ['aracaju', 'Aracaju', -10.91, -37.07, 90],
        ['porto-velho', 'Porto Velho', -8.76, -63.9, 60], ['palmas', 'Palmas', -10.18, -48.33, 55],
        ['rio-branco', 'Rio Branco', -9.97, -67.81, 30], ['macapa', 'Macapá', 0.03, -51.07, 25],
        ['boa-vista', 'Boa Vista', 2.82, -60.67, 22],
      ] as const
    ).map(([id, label, latitude, longitude, value]) => ({ id, label, latitude, longitude, value })),
  },
  {
    id: 'revenda',
    label: 'Clientes via revenda',
    points: (
      [
        ['campinas', 'Campinas', -22.91, -47.06, 320], ['ribeirao', 'Ribeirão Preto', -21.18, -47.81, 210],
        ['uberlandia', 'Uberlândia', -18.92, -48.28, 180], ['londrina', 'Londrina', -23.31, -51.16, 160],
        ['joinville', 'Joinville', -26.3, -48.85, 190], ['caxias', 'Caxias do Sul', -29.17, -51.18, 140],
        ['feira', 'Feira de Santana', -12.27, -38.97, 110], ['campina', 'Campina Grande', -7.23, -35.88, 85],
        ['juiz-de-fora', 'Juiz de Fora', -21.76, -43.35, 120], ['santarem', 'Santarém', -2.44, -54.71, 45],
      ] as const
    ).map(([id, label, latitude, longitude, value]) => ({ id, label, latitude, longitude, value })),
  },
];

const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const ufsDa = (regiao: string) =>
  MALHA_DAS_UFS.features.filter((feicao) => feicao.properties?.regiao === regiao).map((feicao) => String(feicao.id));

const moedaCompacta = (valor: number) => formatarMoeda(valor, { compacto: true });
const formatarVariacao = (valor: number) => `${valor > 0 ? '+' : ''}${formatarPercentual(valor / 100, { casasDecimais: 1 })}`;
const formatarCobertura = (valor: number) => formatarPercentual(valor / 100);
const totalDe = (dados: readonly ChartMapRegionDatum[]) => dados.reduce((soma, dado) => soma + (dado.value ?? 0), 0);

const MALHA = { featureNameKey: 'properties.nome', geometry: MALHA_DAS_UFS } as const;

/* ---- Playground --------------------------------------------------------------------------------------------------- */

interface Conjunto {
  codigoDosDados: string;
  codigoDoFormato?: string;
  data: readonly ChartMapRegionDatum[];
  formatValue: (valor: number) => string;
  title: string;
  valueLabel: string;
}

const CONJUNTOS: Record<string, Conjunto> = {
  sequential: {
    codigoDosDados: 'vendasPorUf',
    codigoDoFormato: '(valor) => formatarMoeda(valor, { compacto: true })',
    data: VENDAS,
    formatValue: moedaCompacta,
    title: 'Vendas por UF',
    valueLabel: 'Vendas',
  },
  diverging: {
    codigoDosDados: 'variacaoPorUf',
    codigoDoFormato: 'formatarVariacao',
    data: VARIACAO,
    formatValue: formatarVariacao,
    title: 'Variação de vendas contra 2025',
    valueLabel: 'Variação',
  },
  classes: {
    codigoDosDados: 'coberturaPorUf',
    codigoDoFormato: '(valor) => formatarPercentual(valor / 100)',
    data: COBERTURA,
    formatValue: formatarCobertura,
    title: 'Cobertura de atendimento por UF',
    valueLabel: 'Municípios atendidos',
  },
  categorical: {
    codigoDosDados: 'regionalPorUf',
    data: REGIONAL_POR_UF,
    formatValue: formatarNumero,
    title: 'Regionais responsáveis',
    valueLabel: 'Regional',
  },
  none: {
    codigoDosDados: '',
    data: [],
    formatValue: formatarNumero,
    title: 'Clientes por capital',
    valueLabel: 'Clientes',
  },
};

function escalaDe(tipo: string, metodo: string, faixas: number, log: boolean): ChartMapColorScale {
  if (tipo === 'classes') {
    return metodo === 'thresholds'
      ? { thresholds: [20, 40, 60, 80], type: 'classes' }
      : { count: faixas, method: metodo as 'quantile' | 'equalInterval', type: 'classes' };
  }

  if (tipo === 'categorical') {
    return { categories: CATEGORIAS_DAS_REGIONAIS, type: 'categorical' };
  }

  if (tipo === 'diverging') {
    return { center: 0, type: 'diverging' };
  }

  return tipo === 'none' ? { type: 'none' } : { log: log || undefined, type: 'sequential' };
}

function codigoDaEscala(tipo: string, metodo: string, faixas: number, log: boolean) {
  if (tipo === 'classes') {
    return metodo === 'thresholds'
      ? "{ type: 'classes', thresholds: [20, 40, 60, 80] }"
      : `{ type: 'classes', method: '${metodo}', count: ${faixas} }`;
  }

  return {
    categorical: "{ type: 'categorical', categories: regionais }",
    diverging: "{ type: 'diverging', center: 0 }",
    none: "{ type: 'none' }",
    sequential: log ? "{ type: 'sequential', log: true }" : undefined,
  }[tipo];
}

function MapaDoPlayground({ props, registrar }: { props: ChartMapProps; registrar: (evento: string) => void }) {
  const [selecionada, setSelecionada] = useState<string | null>(null);

  return (
    <ChartMap
      {...props}
      onRegionClick={
        props.onRegionClick &&
        ((regiao) => {
          registrar(`onRegionClick: ${regiao.id} · ${regiao.value ?? regiao.category ?? 'sem dado'}`);
          setSelecionada((atual) => (atual === regiao.id ? null : regiao.id));
        })
      }
      selectedRegion={props.onRegionClick ? selecionada : undefined}
    />
  );
}

const playground = definirPlayground({
  largo: true,
  inicial: {
    colorScale: 'sequential',
    log: false,
    method: 'thresholds',
    count: 5,
    noDataStyle: 'hatch',
    regionLabels: 'visible',
    smallRegionLabels: 'callout',
    showDataLabels: 'hidden',
    markers: false,
    showShare: true,
    showTooltip: true,
    onRegionClick: true,
    focus: 'Brasil',
    legend: 'bottom',
    legendAlign: 'center',
    height: 440,
    showTableToggle: true,
  },
  controles: [
    { tipo: 'opcoes', nome: 'colorScale', opcoes: Object.keys(CONJUNTOS) },
    { tipo: 'booleano', nome: 'log' },
    { tipo: 'opcoes', nome: 'method', opcoes: ['thresholds', 'quantile', 'equalInterval'] },
    { tipo: 'numero', nome: 'count', min: 2, max: 7 },
    { tipo: 'opcoes', nome: 'noDataStyle', opcoes: ['hatch', 'neutral'] },
    { tipo: 'opcoes', nome: 'regionLabels', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'smallRegionLabels', opcoes: ['callout', 'hidden'] },
    { tipo: 'opcoes', nome: 'showDataLabels', opcoes: VISIBILIDADES },
    { tipo: 'booleano', nome: 'markers' },
    { tipo: 'booleano', nome: 'showShare' },
    { tipo: 'booleano', nome: 'showTooltip' },
    { tipo: 'booleano', nome: 'onRegionClick' },
    { tipo: 'opcoes', nome: 'focus', opcoes: ['Brasil', ...REGIOES] },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['bottom', 'right', 'top', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'numero', nome: 'height', min: 240, max: 640, passo: 20 },
    { tipo: 'booleano', nome: 'showTableToggle' },
  ],
  renderizar: (valores, registrar) => {
    const conjunto = CONJUNTOS[valores.colorScale];
    const comMarcadores = valores.markers || valores.colorScale === 'none';

    return (
      <div style={{ width: '100%' }}>
        <MapaDoPlayground
          key={valores.colorScale}
          props={{
            ...MALHA,
            colorScale: escalaDe(valores.colorScale, valores.method, valores.count, valores.log),
            data: conjunto.data,
            focus: valores.focus === 'Brasil' ? undefined : ufsDa(valores.focus),
            formatValue: conjunto.formatValue,
            height: valores.height,
            legend: valores.legend as ChartMapLegendPosition,
            legendAlign: valores.legendAlign as ChartLegendAlign,
            markers: comMarcadores ? CAPITAIS : undefined,
            markerValueLabel: 'Clientes',
            noDataStyle: valores.noDataStyle as 'hatch' | 'neutral',
            onHiddenClassesChange: (ocultas) => registrar(`onHiddenClassesChange: [${ocultas.join(', ')}]`),
            onHiddenSeriesChange: (ocultas) => registrar(`onHiddenSeriesChange: [${ocultas.join(', ')}]`),
            onMarkerClick: (marcador) => registrar(`onMarkerClick: ${marcador.id} · ${marcador.value}`),
            onRegionClick: valores.onRegionClick ? () => undefined : undefined,
            regionLabels: valores.regionLabels as ChartMapProps['regionLabels'],
            showDataLabels: valores.showDataLabels as ChartMapProps['showDataLabels'],
            showShare: valores.showShare,
            showTableToggle: valores.showTableToggle,
            showTooltip: valores.showTooltip,
            smallRegionLabels: valores.smallRegionLabels as 'callout' | 'hidden',
            subtitle:
              valores.colorScale === 'sequential' ? `Total: ${moedaCompacta(totalDe(conjunto.data))}` : undefined,
            title: conjunto.title,
            valueLabel: conjunto.valueLabel,
          }}
          registrar={registrar}
        />
      </div>
    );
  },
  codigo: (valores) => {
    const conjunto = CONJUNTOS[valores.colorScale];
    const comMarcadores = valores.markers || valores.colorScale === 'none';
    const escala = codigoDaEscala(valores.colorScale, valores.method, valores.count, valores.log);
    const atributos: Atributo[] = [
      ['title', conjunto.title],
      ['geometry', expr('malhaDasUfs')],
      ['featureNameKey', 'properties.nome'],
      ['data', conjunto.codigoDosDados ? expr(conjunto.codigoDosDados) : undefined],
      ['colorScale', escala && expr(escala)],
      ['valueLabel', valores.colorScale === 'none' ? undefined : conjunto.valueLabel],
      ['formatValue', conjunto.codigoDoFormato && expr(conjunto.codigoDoFormato)],
      ['subtitle', valores.colorScale === 'sequential' ? expr('`Total: ${formatarMoeda(total, { compacto: true })}`') : undefined],
      ['showShare', valores.showShare, false],
      ['noDataStyle', valores.noDataStyle, 'hatch'],
      ['regionLabels', valores.regionLabels, 'visible'],
      ['smallRegionLabels', valores.smallRegionLabels, 'callout'],
      ['showDataLabels', valores.showDataLabels, 'hidden'],
      ['markers', comMarcadores ? expr('clientesPorCidade') : undefined],
      ['markerValueLabel', comMarcadores ? 'Clientes' : undefined],
      ['focus', valores.focus === 'Brasil' ? undefined : expr(`ufsDo${valores.focus.replace('-', '')}`)],
      ['selectedRegion', valores.onRegionClick ? expr('selecionada') : undefined],
      ['onRegionClick', valores.onRegionClick ? expr('(regiao) => setSelecionada(regiao.id)') : undefined],
      ['showTooltip', valores.showTooltip, true],
      ['showTableToggle', valores.showTableToggle, true],
      ['legend', valores.legend, 'bottom'],
      ['legendAlign', valores.legendAlign, 'center'],
      ['height', valores.height, 440],
    ];

    return gerarJsx('ChartMap', atributos);
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.onRegionClick
        ? { nivel: 'ok', titulo: 'Grupo nomeado', detalhe: 'O desenho é role="group"; cada UF é um botão, com um único ponto de tabulação e setas entre elas.' }
        : { nivel: 'ok', titulo: 'Nome acessível', detalhe: 'O desenho é role="img" nomeado pelo título, com o resumo como descrição.' },
      valores.showTableToggle
        ? { nivel: 'ok', titulo: 'Leitura completa', detalhe: '"Ver como tabela" alcança DF, SE e AL, que o dedo não acerta no celular.' }
        : { nivel: 'atencao', titulo: 'Sem tabela', detalhe: 'Sem a visão em tabela, as UFs pequenas só se leem pelo ponteiro.' },
    ];

    if (valores.legend === 'none' && valores.colorScale !== 'none') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Cor sem escala', detalhe: 'Sem legenda, o tom não se lê: o valor só aparece no balão e na tabela.' });
    }

    if (valores.colorScale === 'diverging') {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Sinal escrito',
        detalhe: 'Vermelho e verde se confundem na deuteranopia: o sinal está no balão, na legenda e na tabela.',
      });
    }

    if (valores.showShare && (valores.colorScale === 'diverging' || valores.colorScale === 'classes')) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Parte de uma taxa', detalhe: 'showShare só faz sentido em grandeza somável; variação e cobertura não se somam.' });
    }

    if (valores.log && valores.colorScale !== 'sequential') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Só na sequencial', detalhe: 'log vale para a escala sequencial.' });
    }

    return verificacoes;
  },
});

/* ---- Exemplos ------------------------------------------------------------------------------------------------------ */

const NORDESTE = ufsDa('Nordeste');

function Exemplo(props: Partial<ChartMapProps> & Pick<ChartMapProps, 'title'>) {
  return (
    <div style={{ width: '100%' }}>
      <ChartMap {...MALHA} height={400} {...props} />
    </div>
  );
}

/* ---- Municipios do Nordeste, carregados sob demanda ------------------------------------------------------------- */

interface MalhasDoNordeste {
  estados: ChartMapFeatureCollection;
  municipios: ChartMapFeatureCollection;
}

const UFS_DO_NORDESTE = ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'];
let malhasDoNordeste: Promise<MalhasDoNordeste> | undefined;

/** Como um produto faria: o arquivo chega por fetch, uma vez, e nao entra no bundle. */
function carregarMalhasDoNordeste() {
  const ler = (arquivo: string) =>
    fetch(`${import.meta.env.BASE_URL}dados-mapa/${arquivo}`).then((resposta) => {
      if (!resposta.ok) {
        throw new Error(`Não carregou ${arquivo}`);
      }

      return resposta.json() as Promise<ChartMapFeatureCollection>;
    });

  malhasDoNordeste ??= Promise.all([ler('estados.json'), ler('municipios-nordeste.json')]).then(([estados, municipios]) => ({
    estados,
    municipios,
  }));

  return malhasDoNordeste;
}

const ufDa = (feicao: ChartMapFeature) => String(feicao.properties?.uf ?? '');
const numeroDe = (feicao: ChartMapFeature, campo: string) => Number(feicao.properties?.[campo] ?? 0);

function MunicipiosDoNordeste() {
  const [malhas, setMalhas] = useState<MalhasDoNordeste | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [uf, setUf] = useState<string | null>(null);

  useEffect(() => {
    carregarMalhasDoNordeste().then(setMalhas, () => setFalhou(true));
  }, []);

  if (falhou) {
    return <p className="note">Não foi possível carregar a malha dos municípios.</p>;
  }

  if (!malhas) {
    return <Skeleton height={440} shape="block" width="100%" />;
  }

  // Descer e composicao: a pagina troca a geometria para os municipios da UF e deixa as demais como contexto.
  const municipios = malhas.municipios.features.filter((feicao) => !uf || ufDa(feicao) === uf);
  const contexto = malhas.estados.features.filter((feicao) => (uf ? ufDa(feicao) !== uf : !UFS_DO_NORDESTE.includes(ufDa(feicao))));
  const somar = (campo: string) => municipios.reduce((soma, feicao) => soma + numeroDe(feicao, campo), 0);
  // Razao nao se soma: no conjunto, recalcula-se sobre os totais.
  const noConjunto = somar('vendas_brl') / somar('populacao');

  return (
    <div className="stack" style={{ width: '100%' }}>
      {uf && (
        <div>
          <Button onClick={() => setUf(null)} size="sm" variant="secondary">
            Voltar ao Nordeste
          </Button>
        </div>
      )}
      <ChartMap
        colorScale={{ count: 7, method: 'quantile', type: 'classes' }}
        data={municipios.map((feicao) => ({ id: String(feicao.id), value: numeroDe(feicao, 'vendas_por_habitante_brl') }))}
        featureLabelKey="properties.uf"
        featureNameKey="properties.nome"
        focus={municipios.map((feicao) => String(feicao.id))}
        formatValue={(valor) => formatarMoeda(valor)}
        geometry={{ features: [...contexto, ...municipios] }}
        key={uf ?? 'nordeste'}
        onRegionClick={uf ? undefined : (municipio) => setUf(ufDa(municipio.feature))}
        regionLabels="hidden"
        subtitle={`${formatarNumero(municipios.length)} municípios · ${formatarMoeda(noConjunto)} por habitante no conjunto`}
        title={uf ? `Vendas por habitante, municípios de ${uf}` : 'Vendas por habitante, municípios do Nordeste'}
        valueLabel="Vendas por habitante"
      />
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt><code>geometry</code></dt>
        <dd>
          O Design System não embute fronteiras: o produto fornece o GeoJSON e responde pela licença dele. O dado casa com a
          feição pelo identificador lido em <code>featureIdKey</code>. Descer de nível é composição: o produto troca a
          geometria, e a documentação recomenda carregar um nível por vez.
        </dd>
        <dt><code>colorScale</code></dt>
        <dd>
          Sequencial, linear ou logarítmica; divergente em torno de um centro; classes por quantis, intervalos iguais ou
          limites fixos; categórica; ou nenhuma, para marcadores sobre fundo neutro. Com menos valores distintos que
          faixas, as faixas diminuem; com um valor só, uma cor e uma entrada na legenda. Mais escuro é maior, nos dois
          temas.
        </dd>
        <dt>Sem dado e dado sem região</dt>
        <dd>
          A região sem dado é hachurada e entra na legenda com a contagem. O dado cujo id não está na geometria some do
          desenho, e o componente avisa no console em desenvolvimento.
        </dd>
        <dt><code>regionLabels</code> e <code>smallRegionLabels</code></dt>
        <dd>
          O rótulo vai ao centro visual da maior parte da região e só entra se cabe inteiro, sem tocar outro. Sem espaço
          para o valor, fica a sigla; sem espaço nem para ela, vai para uma coluna junto ao desenho, com linha guia. Quando
          a coluna não comporta todos, como nos municípios, nenhum vai.
        </dd>
        <dt><code>focus</code></dt>
        <dd>
          Enquadra as regiões pedidas, com teto de aproximação: o DF sozinho não ocupa o palco. As demais ficam em cinza,
          como contexto, sem valor nem interação, e a escala e a posição contam só o recorte.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Largura de celular</h3>
        <div style={{ maxWidth: 358 }}>
          <ChartMap {...MALHA} data={VENDAS} formatValue={moedaCompacta} legend="right" title="Vendas por UF" valueLabel="Vendas" />
        </div>
        <p className="note">Em 358px a legenda lateral desce para baixo e a altura encolhe até a proporção do país.</p>
      </div>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartMap {...MALHA} data={[]} title="Vendas por UF" />
        <p className="note">Sem valor em região alguma, o gráfico anuncia a ausência com <code>emptyMessage</code>.</p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      largo: true,
      titulo: 'UF em escala sequencial',
      descricao: 'Uma matiz do claro ao escuro, com o total do nível sob o título. Roraima e Amapá sem dado, em hachura.',
      Previa: () => (
        <Exemplo
          data={VENDAS}
          formatValue={moedaCompacta}
          showShare
          subtitle={`Total: ${moedaCompacta(totalDe(VENDAS))}`}
          title="Vendas por UF"
          valueLabel="Vendas"
        />
      ),
      codigo: `<ChartMap
  title="Vendas por UF"
  subtitle={\`Total: \${formatarMoeda(total, { compacto: true })}\`}
  geometry={malhaDasUfs}
  featureNameKey="properties.nome"
  data={vendasPorUf}
  valueLabel="Vendas"
  formatValue={(valor) => formatarMoeda(valor, { compacto: true })}
  showShare
/>`,
    },
    {
      largo: true,
      titulo: 'Divergente em torno de zero',
      descricao: 'Queda em perigo, alta em sucesso, domínio simétrico. O sinal está escrito no balão, na legenda e na tabela.',
      Previa: () => (
        <Exemplo
          colorScale={{ center: 0, type: 'diverging' }}
          data={VARIACAO}
          formatValue={formatarVariacao}
          title="Variação de vendas contra 2025"
          valueLabel="Variação"
        />
      ),
      codigo: `<ChartMap
  title="Variação de vendas contra 2025"
  geometry={malhaDasUfs}
  featureNameKey="properties.nome"
  data={variacaoPorUf}
  colorScale={{ type: 'diverging', center: 0 }}
  valueLabel="Variação"
  formatValue={formatarVariacao}
/>`,
    },
    {
      largo: true,
      titulo: 'Classes por limites fixos',
      descricao: 'Cada faixa da legenda conta as UFs, destaca as dela sob o ponteiro e as desliga no clique.',
      Previa: () => (
        <Exemplo
          colorScale={{ thresholds: [20, 40, 60, 80], type: 'classes' }}
          data={COBERTURA}
          formatValue={formatarCobertura}
          legend="right"
          title="Cobertura de atendimento"
          valueLabel="Municípios atendidos"
        />
      ),
      codigo: `<ChartMap
  title="Cobertura de atendimento"
  geometry={malhaDasUfs}
  featureNameKey="properties.nome"
  data={coberturaPorUf}
  colorScale={{ type: 'classes', thresholds: [20, 40, 60, 80] }}
  valueLabel="Municípios atendidos"
  formatValue={(valor) => formatarPercentual(valor / 100)}
  legend="right"
/>`,
    },
    {
      largo: true,
      titulo: 'Categórica por regional',
      descricao: 'A cor nomeia a regional, não mede nada; a legenda desliga cada uma pelo id. Sem rótulo de valor.',
      Previa: () => (
        <Exemplo
          colorScale={{ categories: CATEGORIAS_DAS_REGIONAIS, type: 'categorical' }}
          data={REGIONAL_POR_UF}
          legend="right"
          title="Regionais responsáveis"
          valueLabel="Regional"
        />
      ),
      codigo: `<ChartMap
  title="Regionais responsáveis"
  geometry={malhaDasUfs}
  featureNameKey="properties.nome"
  data={regionalPorUf}
  colorScale={{ type: 'categorical', categories: regionais }}
  valueLabel="Regional"
  legend="right"
/>`,
    },
    {
      largo: true,
      titulo: 'Marcadores por capital',
      descricao: 'Latitude e longitude sobre fundo neutro, com o raio pela raiz do valor: a área é proporcional.',
      Previa: () => (
        <Exemplo
          colorScale={{ type: 'none' }}
          markers={CAPITAIS}
          markerValueLabel="Clientes"
          regionLabels="hidden"
          title="Clientes por capital"
        />
      ),
      codigo: `<ChartMap
  title="Clientes por capital"
  geometry={malhaDasUfs}
  featureNameKey="properties.nome"
  colorScale={{ type: 'none' }}
  markers={[
    { id: 'diretos', label: 'Clientes diretos', points: capitais },
    { id: 'revenda', label: 'Clientes via revenda', points: cidadesDaRevenda },
  ]}
  markerValueLabel="Clientes"
  regionLabels="hidden"
/>`,
    },
    {
      largo: true,
      titulo: 'Municípios do Nordeste',
      descricao:
        'Os 1.794 municípios, carregados sob demanda, em sete quantis: a concentração nas capitais apagaria a escala linear. As outras UFs ficam como contexto. Clicar num município desce para a UF dele, e a página troca a geometria. Geografia, área e população: IBGE, referência 2025; vendas simuladas.',
      Previa: MunicipiosDoNordeste,
      codigo: `const [uf, setUf] = useState<string | null>(null);
const municipios = malhaDosMunicipios.features.filter((feicao) => !uf || feicao.properties.uf === uf);
const contexto = malhaDasUfs.features.filter((feicao) =>
  uf ? feicao.properties.uf !== uf : !ufsDoNordeste.includes(feicao.properties.uf),
);

<ChartMap
  title="Vendas por habitante, municípios do Nordeste"
  geometry={{ features: [...contexto, ...municipios] }}
  focus={municipios.map((feicao) => String(feicao.id))}
  featureNameKey="properties.nome"
  featureLabelKey="properties.uf"
  data={municipios.map((feicao) => ({ id: String(feicao.id), value: feicao.properties.vendas_por_habitante_brl }))}
  colorScale={{ type: 'classes', method: 'quantile', count: 7 }}
  valueLabel="Vendas por habitante"
  formatValue={(valor) => formatarMoeda(valor)}
  regionLabels="hidden"
  onRegionClick={uf ? undefined : (municipio) => setUf(municipio.feature.properties.uf)}
/>`,
    },
    {
      largo: true,
      titulo: 'Foco no Nordeste',
      descricao: 'focus enquadra as nove UFs; o resto do país fica em cinza, como contexto, e a escala conta só o recorte.',
      Previa: () => (
        <Exemplo
          data={VENDAS}
          focus={NORDESTE}
          formatValue={moedaCompacta}
          showDataLabels="visible"
          showShare
          title="Vendas no Nordeste"
          valueLabel="Vendas"
        />
      ),
      codigo: `<ChartMap
  title="Vendas no Nordeste"
  geometry={malhaDasUfs}
  featureNameKey="properties.nome"
  data={vendasPorUf}
  focus={['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA']}
  valueLabel="Vendas"
  formatValue={(valor) => formatarMoeda(valor, { compacto: true })}
  showDataLabels="visible"
  showShare
/>`,
    },
  ],
  faca: {
    Previa: () => (
      <Exemplo
        colorScale={{ method: 'quantile', type: 'classes' }}
        data={VENDAS}
        formatValue={moedaCompacta}
        height={300}
        legend="none"
        regionLabels="hidden"
        title="Vendas por UF, por quintis"
      />
    ),
    texto: 'Valor concentrado em poucas regiões, como vendas e densidade: quantis ou logarítmica distribuem a cor.',
  },
  evite: {
    Previa: () => (
      <Exemplo
        colorScale={{ categories: CATEGORIAS_DAS_REGIONAIS, type: 'categorical' }}
        data={REGIONAL_POR_UF}
        height={300}
        legend="none"
        title="Regionais"
      />
    ),
    texto: 'Mapa sem legenda: a cor sozinha não diz o que a região é. A legenda nomeia a escala e é o controle dela.',
  },
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Com onRegionClick ou onMarkerClick, entra no mapa por uma marca só: a selecionada, a última focada ou a primeira. Sem eles, o desenho não recebe foco.' },
    { teclas: ['←', '→', '↑', '↓'], acao: 'Marca vizinha naquela direção, pelo centro de cada uma.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Dispara onRegionClick ou onMarkerClick; na legenda, liga e desliga a faixa ou a série.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code> nomeado pelo <code>title</code>, com o resumo de maior, menor e sem dado como descrição; com clique, <code>role=&quot;group&quot;</code>.</>, teste: 'ChartMap.test.tsx' },
    { garantia: 'Descrição da região', como: 'aria-label com nome, valor e posição: "São Paulo, R$ 1,8 bi, 1º de 25"; sem dado, diz "Sem dado".', teste: 'ChartMap.test.tsx' },
    { garantia: 'Teclado', como: 'Tabulação móvel, setas pela direção, Enter e Espaço, com o contorno do foco na cor primária.', teste: 'ChartMap.test.tsx' },
    { garantia: 'Visão em tabela', como: <>Botão com <code>aria-pressed</code>; tabela nativa com busca sem acento e cabeçalhos que ordenam, com <code>aria-sort</code>.</>, teste: 'ChartMap.test.tsx' },
    { garantia: 'Cor nunca sozinha', como: 'Valor, faixa e categoria estão no balão, no rótulo e na tabela; o rótulo tem o halo da superfície, no contraste de texto do tema.', teste: 'ChartMap.test.tsx' },
    { garantia: 'Escalas', como: 'Linear, logarítmica, divergente simétrica, quantis, intervalos iguais e limites fixos, com as faixas reduzidas a valores distintos.', teste: 'mapScales.test.ts' },
    { garantia: 'Rótulos', como: 'Centro visual da maior parte; cabe pelos quatro cantos, sem colisão; sigla sozinha; coluna com linha guia.', teste: 'mapLabels.test.ts' },
    { garantia: 'Número inválido', como: 'NaN e infinito são sem dado e não viram geometria.', teste: 'ChartMap.test.tsx' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do desenho.' },
    { nome: 'subtitle', tipo: 'string', descricao: 'Linha sob o título, como o total do nível. Razões se recalculam sobre os totais, no produto.' },
    { nome: 'geometry', tipo: 'ChartMapFeatureCollection', descricao: 'Fronteiras em GeoJSON, do produto. Polígonos e multipolígonos; anel com menos de quatro posições é descartado, e o sentido da RFC 7946 é aceito.' },
    { nome: 'featureIdKey', tipo: 'string', padrao: "'id'", descricao: <>Caminho do identificador na feição, como <code>properties.sigla</code>. É por ele que o dado casa.</> },
    { nome: 'featureNameKey', tipo: 'string', padrao: "'properties.name'", descricao: 'Caminho do nome no balão, na tabela e na descrição.' },
    { nome: 'featureLabelKey', tipo: 'string', padrao: 'o identificador', descricao: 'Caminho do texto curto do rótulo: a sigla na UF, o nome na região.' },
    { nome: 'data', tipo: 'readonly ChartMapRegionDatum[]', padrao: '[]', descricao: <><code>{'{ id, value?, category? }'}</code>. Feição sem item, ou com valor inválido, fica sem dado.</> },
    { nome: 'colorScale', tipo: 'ChartMapColorScale', padrao: "{ type: 'sequential' }", descricao: <><code>sequential</code> (com <code>log</code> e <code>domain</code>), <code>diverging</code> (com <code>center</code>), <code>classes</code> por <code>method</code> e <code>count</code> ou por <code>thresholds</code> e <code>labels</code>, <code>categorical</code> com <code>categories</code>, ou <code>none</code>.</> },
    { nome: 'valueLabel', tipo: 'string', padrao: "'Valor'", descricao: 'Nome da medida no balão, na legenda e na tabela.' },
    { nome: 'formatValue', tipo: '(value: number) => string', padrao: 'formatarNumero', descricao: 'Formato na legenda, nos rótulos, na descrição e na tabela.' },
    { nome: 'formatTooltipValue', tipo: '(value: number) => string', padrao: 'formatValue', descricao: 'Formato só do balão.' },
    { nome: 'formatPercent', tipo: '(ratio: number) => string', padrao: '1 casa', descricao: 'Formato da parte do total.' },
    { nome: 'showShare', tipo: 'boolean', padrao: 'false', descricao: 'Parte do total no balão e na tabela. Só em grandeza somável.' },
    { nome: 'noDataLabel', tipo: 'string', padrao: "'Sem dado'", descricao: 'Texto da ausência na legenda, no balão e na tabela.' },
    { nome: 'noDataStyle', tipo: "'hatch' | 'neutral'", padrao: "'hatch'", descricao: 'Hachura ou cinza liso para a região sem dado.' },
    { nome: 'regionLabels', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'visible'", descricao: 'Rótulo da região: sempre, só sob o ponteiro ou o foco, ou nunca.' },
    { nome: 'smallRegionLabels', tipo: "'callout' | 'hidden'", padrao: "'callout'", descricao: 'O rótulo que não cabe vai para a coluna com linha guia, ou some.' },
    { nome: 'showDataLabels', tipo: "'visible' | 'onHover' | 'hidden'", padrao: "'hidden'", descricao: 'Valor abaixo da sigla, onde couber.' },
    { nome: 'markers', tipo: 'readonly ChartMapMarkerSeries[]', descricao: <><code>{'{ id, label, points, color?, intent? }'}</code>, com <code>{'{ id, label, latitude, longitude, value }'}</code> por ponto.</> },
    { nome: 'markerValueLabel', tipo: 'string', padrao: "'Valor'", descricao: 'Nome da medida dos marcadores.' },
    { nome: 'markerMaxSize', tipo: 'number', padrao: '20', descricao: 'Raio máximo em px; o raio cresce pela raiz do valor.' },
    { nome: 'markerMinSize', tipo: 'number', padrao: '3', descricao: 'Raio mínimo em px, para o marcador pequeno continuar alcançável.' },
    { nome: 'hiddenSeries', tipo: 'readonly string[]', descricao: 'Categorias e séries de marcadores desligadas, pelo id, no modo controlado.' },
    { nome: 'defaultHiddenSeries', tipo: 'readonly string[]', descricao: 'As desligadas de início, no modo não controlado.' },
    { nome: 'onHiddenSeriesChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Clique na legenda de categoria ou de série.' },
    { nome: 'hiddenClasses', tipo: 'readonly number[]', descricao: 'Faixas desligadas, pelo índice, no modo controlado.' },
    { nome: 'onHiddenClassesChange', tipo: '(hidden: readonly number[]) => void', descricao: 'Clique numa faixa da legenda.' },
    { nome: 'focus', tipo: 'readonly string[]', descricao: 'Ids que o enquadramento abraça, com teto de aproximação; o resto fica como contexto.' },
    { nome: 'selectedRegion', tipo: 'string | null', descricao: 'Região com contorno de seleção, no modo controlado.' },
    { nome: 'onRegionClick', tipo: '(region: ChartMapRegion) => void', descricao: <>Clique, Enter ou Espaço: <code>{'{ id, name, value, category, feature }'}</code>. Com ele, as regiões viram botões.</> },
    { nome: 'onMarkerClick', tipo: '(marker: ChartMapMarkerEvent) => void', descricao: <><code>{'{ id, series, value }'}</code>. Com ele, os marcadores viram botões.</> },
    { nome: 'onHoverRegion', tipo: '(id: string | null) => void', descricao: 'Região sob o ponteiro ou o foco, para painéis vizinhos.' },
    { nome: 'showTooltip', tipo: 'boolean', padrao: 'true', descricao: 'Balão: valor, faixa, parte do total e posição; no marcador, cidade, série e valor.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'right' | 'none'", padrao: "'bottom'", descricao: "Abaixo de 640px, 'right' cai para 'bottom'." },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'center'", descricao: 'Apoio da legenda horizontal.' },
    { nome: 'height', tipo: "number | 'fill'", padrao: '440', descricao: 'Altura máxima, ou a do contêiner. A largura estreita encolhe a altura até a proporção da geometria.' },
    { nome: 'showTableToggle', tipo: 'boolean', padrao: 'true', descricao: 'Botão "Ver como tabela".' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados'", descricao: 'Quando nenhuma região tem valor.' },
  ],
};
