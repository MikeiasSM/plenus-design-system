import { useMemo, useState } from 'react';
import {
  ButtonIcon,
  Card,
  ChartTimeline,
  formatarDuracao,
  formatarPercentual,
  IconChevronLeft,
  IconChevronRight,
  type AxisVisibility,
  type ChartLegendAlign,
  type ChartTimelineBand,
  type ChartTimelineDensity,
  type ChartTimelineLabelAlign,
  type ChartTimelineMarker,
  type ChartTimelineOverlap,
  type ChartTimelineProps,
  type ChartTimelineRow,
  type ChartTimelineRowBand,
  type ChartTimelineSegment,
  type ChartTimelineSegmentLabelContent,
  type ChartTimelineSegmentLabels,
  type ChartTimelineSeries,
  type ChartTimelineState,
} from '@plenustech/design-system';
import { expr, gerarJsx, type Atributo } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VISIBILIDADES } from '../dadosDosGraficos';

/* ---- Jornada de trabalho: um dia por linha, eixo de 0h a 24h --------------------------------------------------- */

const HORA = 3_600_000;
const HOJE = new Date(2026, 9, 18, 14, 32);
const FERIADOS: Record<string, string> = { '2026-09-07': 'Feriado', '2026-10-12': 'Feriado' };
const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const NOMES_DOS_MESES = ['Agosto', 'Setembro', 'Outubro'];
const PRIMEIRO_MES = 7;
const ULTIMO_MES = 9;

const doisDigitos = (valor: number) => String(valor).padStart(2, '0');
const diaMes = (data: Date) => `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`;
const rotuloDoDia = (data: Date) => `${DIAS_DA_SEMANA[data.getDay()]} ${diaMes(data)}`;
const horas = (hora: number, minuto = 0) => hora + minuto / 60;
const somaDasPontas = (intervalos: readonly ChartTimelineSegment[]) =>
  intervalos.reduce((total, intervalo) => total + Number(intervalo.end) - Number(intervalo.start), 0);
/** Em horas do dia as pontas sao horas; em datas, milissegundos. */
const duracaoEmHoras = (intervalos: readonly ChartTimelineSegment[]) => somaDasPontas(intervalos) * HORA;

const SERIES_DA_JORNADA: ChartTimelineSeries[] = [
  { label: 'Horário da jornada', color: 'var(--pl-color-border)' },
  { label: 'Dentro da jornada', intent: 'neutral' },
  { label: 'Antes da jornada' },
  { label: 'Entre turnos' },
  { label: 'Depois da jornada', intent: 'positive' },
  { label: 'Dia sem jornada', intent: 'warning' },
  { label: 'Batida isolada', intent: 'negative' },
  { label: 'Adicional noturno', color: 'var(--pl-color-text-tertiary)' },
];

const ADICIONAL_NOTURNO: ChartTimelineBand[] = [
  { series: 'Adicional noturno', start: 0, end: 5 },
  { series: 'Adicional noturno', start: 22, end: 24 },
];

/** Sequencia pseudoaleatoria com semente: o mesmo mes sempre desenha os mesmos dias. */
function aleatorio(semente: number) {
  let estado = semente;

  return () => {
    estado = (estado + 0x6d2b79f5) | 0;
    let mistura = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    mistura = (mistura + Math.imul(mistura ^ (mistura >>> 7), 61 | mistura)) ^ mistura;
    return ((mistura ^ (mistura >>> 14)) >>> 0) / 4294967296;
  };
}

type Periodo = readonly [number, number];

/** Classifica cada trecho trabalhado contra o horario do dia: dentro, antes, entre turnos ou depois. */
function classificar(periodos: readonly Periodo[], jornada: readonly Periodo[]) {
  if (jornada.length === 0) {
    return periodos.map(([inicio, fim]) => ({ start: inicio, end: fim, series: 'Dia sem jornada' }));
  }

  const trechos: { end: number; series: string; start: number }[] = [];

  for (const [inicio, fim] of periodos) {
    const cortes = [...new Set([inicio, fim, ...jornada.flat().filter((corte) => corte > inicio && corte < fim)])].sort(
      (a, b) => a - b,
    );

    for (let indice = 0; indice < cortes.length - 1; indice += 1) {
      const meio = (cortes[indice] + cortes[indice + 1]) / 2;
      const serie = jornada.some(([de, ate]) => meio > de && meio < ate)
        ? 'Dentro da jornada'
        : meio < jornada[0][0]
          ? 'Antes da jornada'
          : meio > jornada[jornada.length - 1][1]
            ? 'Depois da jornada'
            : 'Entre turnos';
      const anterior = trechos.at(-1);

      if (anterior?.series === serie && anterior.end === cortes[indice]) {
        anterior.end = cortes[indice + 1];
      } else {
        trechos.push({ start: cortes[indice], end: cortes[indice + 1], series: serie });
      }
    }
  }

  return trechos;
}

const DIAS_FIXOS: Record<string, { batidas?: number[]; periodos?: Periodo[] }> = {
  '2026-10-02': { periodos: [[horas(6, 50), horas(11, 30)], [horas(12, 30), horas(15, 54)], [horas(19, 10), horas(21, 22)]] },
  '2026-10-03': { periodos: [] },
  '2026-10-04': { periodos: [[horas(9, 10), horas(13, 25)]] },
  '2026-10-07': { batidas: [horas(21, 47)] },
};

interface DadosDaJornada {
  markers: ChartTimelineMarker[];
  rowBands: ChartTimelineRowBand[];
  rows: ChartTimelineRow[];
  segments: ChartTimelineSegment[];
}

function jornadaDoMes(mes: number, ultimoDia = 31): DadosDaJornada {
  const dados: DadosDaJornada = { markers: [], rowBands: [], rows: [], segments: [] };

  for (let dia = 1; dia <= ultimoDia; dia += 1) {
    const data = new Date(2026, mes, dia);

    if (data.getMonth() !== mes || data > HOJE) {
      break;
    }

    const chave = `2026-${doisDigitos(mes + 1)}-${doisDigitos(dia)}`;
    const feriado = FERIADOS[chave];
    const sorte = aleatorio(2026 * 1000 + mes * 40 + dia);
    const util = data.getDay() >= 1 && data.getDay() <= 5 && !feriado;
    const jornada: Periodo[] = util ? [[8, 12], [13, 17.8]] : [];
    let periodos: Periodo[] = [];
    let batidas: number[] = [];

    if (util) {
      const entrada = 8 - sorte() * 0.8;
      const almoco = 11.9 + sorte() * 0.35;
      const volta = almoco + 0.6 + sorte() * 0.65;
      const saida = 17.5 + sorte() * (sorte() < 0.25 ? 2.5 : 1);
      periodos = [[entrada, almoco], [volta, saida]];

      if (sorte() < 0.12) {
        batidas = [21.5 + sorte() * 1.3];
      }
    } else if (!feriado && sorte() < 0.2) {
      const inicio = 9 + sorte() * 0.7;
      periodos = [[inicio, inicio + 3.4 + sorte()]];
    }

    periodos = DIAS_FIXOS[chave]?.periodos ?? periodos;
    batidas = DIAS_FIXOS[chave]?.batidas ?? batidas;

    dados.rows.push({ key: chave, label: rotuloDoDia(data), description: feriado });
    jornada.forEach(([inicio, fim]) => dados.rowBands.push({ row: chave, series: 'Horário da jornada', start: inicio, end: fim }));
    classificar(periodos, jornada).forEach((trecho) => dados.segments.push({ row: chave, ...trecho }));
    batidas.forEach((hora) =>
      dados.markers.push({ row: chave, series: 'Batida isolada', time: hora, label: 'Batida sem par' }),
    );
  }

  return dados;
}

function totaisDaJornada(intervalos: readonly ChartTimelineSegment[]) {
  const total = duracaoEmHoras(intervalos);
  const dentro = duracaoEmHoras(intervalos.filter((intervalo) => intervalo.series === 'Dentro da jornada'));

  return { fora: total - dentro, total };
}

function resumoDoDia(_dia: ChartTimelineRow, intervalos: readonly ChartTimelineSegment[]) {
  const { fora, total } = totaisDaJornada(intervalos);

  return total > 0 ? { title: formatarDuracao(total), subtitle: `${formatarDuracao(fora)} fora` } : undefined;
}

const OUTUBRO = jornadaDoMes(ULTIMO_MES);
const PRIMEIRA_QUINZENA = jornadaDoMes(ULTIMO_MES, 12);

/** A navegacao entre meses e composicao do produto: o grafico recebe os dias e desenha. */
function JornadaDoMes() {
  const [mes, setMes] = useState(ULTIMO_MES);
  const dados = useMemo(() => jornadaDoMes(mes), [mes]);
  const { fora, total } = totaisDaJornada(dados.segments);

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Card.Header
          description={`${formatarDuracao(total)} trabalhadas · ${formatarDuracao(fora)} fora da jornada`}
          title={`${NOMES_DOS_MESES[mes - PRIMEIRO_MES]} de 2026`}
          trailing={
            <div className="demo-row">
              <ButtonIcon
                disabled={mes <= PRIMEIRO_MES}
                icon={<IconChevronLeft />}
                label="Mês anterior"
                onClick={() => setMes(mes - 1)}
                size="sm"
              />
              <ButtonIcon
                disabled={mes >= ULTIMO_MES}
                icon={<IconChevronRight />}
                label="Próximo mês"
                onClick={() => setMes(mes + 1)}
                size="sm"
              />
            </div>
          }
        />
        <Card.Body>
          <ChartTimeline
            bands={ADICIONAL_NOTURNO}
            density="sm"
            domain={[0, 24]}
            markers={dados.markers}
            rowBands={dados.rowBands}
            rowGap={2}
            rowSummary={resumoDoDia}
            rows={dados.rows}
            segments={dados.segments}
            series={SERIES_DA_JORNADA}
            showSegmentLabels="hidden"
            timeScale="dayHours"
            title="Jornada diária"
          />
        </Card.Body>
      </Card>
    </div>
  );
}

/* ---- Cronograma de projeto: Gantt em datas ------------------------------------------------------------------------- */

const em = (dia: number, hora = 0, mes = 9) => new Date(2026, mes, dia, hora);
const formatarDias = (duracao: number) => {
  const dias = Math.max(Math.round(duracao / (24 * HORA)), 1);
  return dias === 1 ? '1 dia' : `${dias} dias`;
};

function finsDeSemana(inicio: Date, fim: Date) {
  const faixas: ChartTimelineBand[] = [];

  for (let dia = new Date(inicio); dia < fim; dia = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 1)) {
    if (dia.getDay() === 6) {
      faixas.push({ series: 'Fim de semana', start: dia, end: new Date(dia.getFullYear(), dia.getMonth(), dia.getDate() + 2) });
    }
  }

  return faixas;
}

const CRONOGRAMA: ChartTimelineProps = {
  title: 'Cronograma da implantação do ERP',
  rows: [
    { key: 'req', label: 'Levantamento de requisitos', group: 'produto' },
    { key: 'tel', label: 'Desenho das telas', group: 'produto' },
    { key: 'val', label: 'Validação com usuários', group: 'produto' },
    { key: 'mod', label: 'Modelagem de dados', group: 'engenharia' },
    { key: 'api', label: 'API de integração', group: 'engenharia' },
    { key: 'tdm', label: 'Telas do módulo', group: 'engenharia' },
    { key: 'mig', label: 'Migração de cadastros', group: 'operacoes' },
    { key: 'trn', label: 'Treinamento', group: 'operacoes' },
    { key: 'prd', label: 'Entrada em produção', group: 'operacoes' },
  ],
  groups: [
    { key: 'produto', label: 'Produto' },
    { key: 'engenharia', label: 'Engenharia' },
    { key: 'operacoes', label: 'Operações' },
  ],
  series: [
    { label: 'Descoberta' },
    { label: 'Construção' },
    { label: 'Implantação' },
    { label: 'Marco', intent: 'neutral' },
    { label: 'Fim de semana', color: 'var(--pl-color-text-tertiary)' },
  ],
  segments: [
    { row: 'req', series: 'Descoberta', start: em(1, 9), end: em(9, 18), label: 'Ana R.', progress: 1 },
    { row: 'tel', series: 'Descoberta', start: em(6, 9), end: em(16, 18), label: 'Bruno S.', progress: 1 },
    { row: 'val', series: 'Descoberta', start: em(19, 9), end: em(23, 18), label: 'Ana R.', progress: 0 },
    { row: 'mod', series: 'Construção', start: em(5, 9), end: em(14, 18), label: 'Carla M.', progress: 1 },
    { row: 'api', series: 'Construção', start: em(13, 9), end: em(30, 18), label: 'Diego R.', progress: 0.4 },
    { row: 'tdm', series: 'Construção', start: em(15, 9), end: em(6, 18, 10), label: 'Elisa P.', progress: 0.15 },
    { row: 'mig', series: 'Implantação', start: em(26, 9), end: em(4, 18, 10), label: 'Fábio N.', progress: 0 },
    { row: 'trn', series: 'Implantação', start: em(3, 9, 10), end: em(6, 18, 10), label: 'Gabriela T.', progress: 0 },
  ],
  markers: [
    { row: 'req', series: 'Marco', time: em(9, 18), shape: 'diamond', label: 'Aprovação do escopo' },
    { row: 'prd', series: 'Marco', time: em(9, 12, 10), shape: 'diamond', label: 'Virada para produção' },
  ],
  bands: finsDeSemana(em(1), em(16, 0, 10)),
  referenceLines: [{ time: HOJE, label: 'Hoje 18/10' }],
  domain: [em(1), em(16, 0, 10)],
  formatValue: formatarDias,
  formatTime: diaMes,
  rowSummary: (_tarefa, [etapa]) =>
    etapa && { title: formatarPercentual(etapa.progress ?? 0), subtitle: formatarDias(somaDasPontas([etapa])) },
};

/* ---- Disponibilidade de servicos: modo estados ------------------------------------------------------------------- */

const AGORA = horas(HOJE.getHours(), HOJE.getMinutes());

const SERVICOS: ChartTimelineRow[] = [
  { key: 'pag', label: 'API de pagamentos' },
  { key: 'por', label: 'Portal do cliente' },
  { key: 'nfe', label: 'Emissão de NF-e' },
  { key: 'ban', label: 'Integração bancária' },
  { key: 'fila', label: 'Fila de e-mails', description: 'sem coleta' },
];

const INCIDENTES: Record<string, [number, number, string][]> = {
  pag: [[9, 10.5, 'Degradado'], [10.5, 11, 'Fora do ar']],
  por: [[13, 14, 'Degradado']],
  nfe: [[2, 4, 'Manutenção'], [10, 10.5, 'Degradado']],
  ban: [[6, 6.5, 'Fora do ar'], [6.5, 7.5, 'Degradado']],
};

/** Uma leitura a cada meia hora, ate agora. */
const LEITURAS: ChartTimelineState[] = SERVICOS.filter((servico) => servico.key !== 'fila').flatMap((servico) =>
  Array.from({ length: Math.ceil(AGORA * 2) }, (_, indice) => {
    const hora = indice / 2;
    const incidente = (INCIDENTES[servico.key] ?? []).find(([de, ate]) => hora >= de && hora < ate);
    return { row: servico.key, state: incidente?.[2] ?? 'Operacional', time: hora };
  }),
);

const SERIES_DE_ESTADO: ChartTimelineSeries[] = [
  { label: 'Operacional', intent: 'positive' },
  { label: 'Degradado', intent: 'warning' },
  { label: 'Fora do ar', intent: 'negative' },
  { label: 'Manutenção', intent: 'neutral' },
  { label: 'Janela de manutenção', color: 'var(--pl-color-text-tertiary)' },
];

function disponibilidade(_servico: ChartTimelineRow, estados: readonly ChartTimelineSegment[]) {
  const total = duracaoEmHoras(estados);
  const operacional = duracaoEmHoras(estados.filter((estado) => estado.series === 'Operacional'));
  const fora = duracaoEmHoras(estados.filter((estado) => estado.series === 'Fora do ar'));

  return total > 0
    ? {
        title: formatarPercentual(operacional / total, { casasDecimais: 1 }),
        subtitle: fora ? `${formatarDuracao(fora)} fora` : 'sem queda',
      }
    : undefined;
}

const SERVICOS_EM_ESTADOS: ChartTimelineProps = {
  title: 'Disponibilidade dos serviços em 18/10/2026',
  timeScale: 'dayHours',
  domain: [0, 15],
  rows: SERVICOS,
  series: SERIES_DE_ESTADO,
  states: LEITURAS,
  statesEnd: AGORA,
  bands: [{ series: 'Janela de manutenção', start: 2, end: 4 }],
  referenceLines: [{ time: AGORA, label: 'Agora 14h32' }],
  rowSummary: disponibilidade,
};

/* ---- Escala de plantoes: sobreposicao em sub-faixas -------------------------------------------------------------- */

const diurno = (row: string, dia: number) => ({ row, series: 'Diurno', start: em(dia, 7), end: em(dia, 19) });
const noturno = (row: string, dia: number) => ({ row, series: 'Noturno', start: em(dia, 19), end: em(dia + 1, 7) });
const sobreaviso = (row: string, inicio: Date, fim: Date) => ({ row, series: 'Sobreaviso', start: inicio, end: fim });

const PLANTOES: ChartTimelineProps = {
  title: 'Escala de plantões, 12/10 a 18/10/2026',
  domain: [em(12), em(19)],
  rows: [
    { key: 'ana', label: 'Ana Lima' },
    { key: 'bru', label: 'Bruno Sá' },
    { key: 'car', label: 'Carla Mota' },
    { key: 'die', label: 'Diego Reis' },
    { key: 'fab', label: 'Fábio Nunes', description: 'férias' },
  ],
  series: [
    { label: 'Diurno' },
    { label: 'Noturno', color: 'var(--pl-chart-series-4)' },
    { label: 'Sobreaviso', color: 'var(--pl-chart-series-3)' },
    { label: 'Fim de semana', color: 'var(--pl-color-text-tertiary)' },
  ],
  segments: [
    diurno('ana', 12),
    diurno('ana', 14),
    sobreaviso('ana', em(14, 12), em(15, 8)),
    diurno('ana', 17),
    noturno('bru', 12),
    noturno('bru', 15),
    sobreaviso('bru', em(16), em(17)),
    diurno('car', 13),
    diurno('car', 15),
    diurno('car', 16),
    sobreaviso('car', em(18, 7), em(18, 19)),
    noturno('die', 13),
    diurno('die', 18),
    sobreaviso('die', em(18, 12), em(18, 20)),
  ],
  bands: finsDeSemana(em(12), em(19)),
  referenceLines: [{ time: HOJE, label: 'Agora' }],
  formatTime: (data) => `${rotuloDoDia(data)} ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`,
  rowSummary: (_pessoa, turnos) => {
    const plantoes = turnos.filter((turno) => turno.series !== 'Sobreaviso').length;
    return turnos.length ? { title: formatarDuracao(somaDasPontas(turnos)), subtitle: `${plantoes} plantões` } : undefined;
  },
};

/* ---- Uso das salas: rotulo com o nome da reuniao ------------------------------------------------------------------ */

const reuniao = (row: string, series: string, inicio: number, fim: number, label: string) => ({ row, series, start: inicio, end: fim, label });

const SALAS: ChartTimelineProps = {
  title: 'Ocupação das salas, Sex 16/10/2026',
  timeScale: 'dayHours',
  domain: [7, 20],
  rows: [
    { key: 'atl', label: 'Atlântico', description: '8 lugares' },
    { key: 'pan', label: 'Pantanal', description: '6' },
    { key: 'cer', label: 'Cerrado', description: '4' },
    { key: 'aud', label: 'Auditório', description: '40' },
  ],
  series: [
    { label: 'Interna' },
    { label: 'Cliente' },
    { label: 'Treinamento', color: 'var(--pl-chart-series-3)' },
    { label: 'Almoço', color: 'var(--pl-color-text-tertiary)' },
  ],
  segments: [
    reuniao('atl', 'Interna', horas(8, 30), 9, 'Daily Produto'),
    reuniao('atl', 'Cliente', horas(9, 30), 11, 'Kickoff Alfa'),
    reuniao('atl', 'Interna', 14, horas(15, 30), 'Revisão de sprint'),
    reuniao('pan', 'Interna', 8, horas(8, 30), 'Daily Eng.'),
    reuniao('pan', 'Interna', 10, 12, 'Entrevistas'),
    reuniao('pan', 'Cliente', horas(13, 30), horas(14, 30), 'Demo Beta'),
    reuniao('cer', 'Interna', 9, 10, 'Suporte N2'),
    reuniao('cer', 'Interna', horas(15, 30), 18, 'Planejamento Q4'),
    reuniao('aud', 'Treinamento', 9, 12, 'Onboarding'),
    reuniao('aud', 'Treinamento', 14, 17, 'Treinamento NF-e'),
  ],
  bands: [{ series: 'Almoço', start: 12, end: 13, label: 'Almoço' }],
  segmentLabel: 'label',
  segmentLabelAlign: 'start',
  showSegmentLabels: 'visible',
  rowSummary: (_sala, reunioes) => {
    const ocupado = duracaoEmHoras(reunioes);
    return ocupado ? { title: formatarDuracao(ocupado), subtitle: `${formatarPercentual(ocupado / (13 * HORA))} do dia` } : undefined;
  },
};

/* ---- Playground ---------------------------------------------------------------------------------------------------- */

const JORNADA_DA_QUINZENA: ChartTimelineProps = {
  title: 'Jornada de trabalho, 01/10 a 12/10/2026',
  timeScale: 'dayHours',
  domain: [0, 24],
  rows: PRIMEIRA_QUINZENA.rows,
  series: SERIES_DA_JORNADA,
  segments: PRIMEIRA_QUINZENA.segments,
  rowBands: PRIMEIRA_QUINZENA.rowBands,
  markers: PRIMEIRA_QUINZENA.markers,
  bands: ADICIONAL_NOTURNO,
  referenceLines: [{ time: 18, label: 'Meta 18h' }],
  rowSummary: resumoDoDia,
};

/** Cada conjunto e as variaveis que o codigo gerado mostra no lugar dos dados. */
const CONJUNTOS: Record<string, { dados: readonly Atributo[]; props: ChartTimelineProps }> = {
  jornada: {
    dados: [['segments', expr('intervalos')], ['rowBands', expr('jornadas')], ['markers', expr('batidas')]],
    props: JORNADA_DA_QUINZENA,
  },
  cronograma: {
    dados: [['groups', expr('equipes')], ['segments', expr('etapas')], ['markers', expr('marcos')]],
    props: CRONOGRAMA,
  },
  servicos: { dados: [['states', expr('leituras')], ['statesEnd', expr('agora')]], props: SERVICOS_EM_ESTADOS },
  plantoes: { dados: [['segments', expr('plantoes')]], props: PLANTOES },
};

const playground = definirPlayground({
  largo: true,
  inicial: {
    conjunto: 'jornada',
    title: 'Jornada de trabalho, 01/10 a 12/10/2026',
    density: 'md',
    overlap: 'stack',
    showSegmentLabels: 'auto',
    segmentLabel: 'duration',
    segmentLabelAlign: 'center',
    showProgress: true,
    mergeConsecutive: true,
    xAxis: 'visible',
    axisPosition: 'top',
    showGrid: true,
    rowSummary: true,
    compactSummary: 'below',
    rowGap: 4,
    collapsibleGroups: true,
    legend: 'top',
    legendAlign: 'left',
    showTooltip: true,
    highlightOnHover: false,
    onSegmentClick: true,
  },
  controles: [
    { tipo: 'opcoes', nome: 'conjunto', opcoes: Object.keys(CONJUNTOS) },
    { tipo: 'texto', nome: 'title' },
    { tipo: 'opcoes', nome: 'density', opcoes: ['md', 'sm'] },
    { tipo: 'opcoes', nome: 'overlap', opcoes: ['stack', 'overlay'] },
    { tipo: 'opcoes', nome: 'showSegmentLabels', opcoes: ['auto', 'visible', 'hidden'] },
    { tipo: 'opcoes', nome: 'segmentLabel', opcoes: ['duration', 'label'] },
    { tipo: 'opcoes', nome: 'segmentLabelAlign', opcoes: ['start', 'center', 'end'] },
    { tipo: 'booleano', nome: 'showProgress' },
    { tipo: 'booleano', nome: 'mergeConsecutive' },
    { tipo: 'opcoes', nome: 'xAxis', opcoes: VISIBILIDADES },
    { tipo: 'opcoes', nome: 'axisPosition', opcoes: ['top', 'bottom'] },
    { tipo: 'booleano', nome: 'showGrid' },
    { tipo: 'booleano', nome: 'rowSummary' },
    { tipo: 'opcoes', nome: 'compactSummary', opcoes: ['below', 'hidden'] },
    { tipo: 'numero', nome: 'rowGap', min: 0, max: 12 },
    { tipo: 'booleano', nome: 'collapsibleGroups' },
    { tipo: 'opcoes', nome: 'legend', opcoes: ['top', 'bottom', 'none'] },
    { tipo: 'opcoes', nome: 'legendAlign', opcoes: ['left', 'center', 'right'] },
    { tipo: 'booleano', nome: 'showTooltip' },
    { tipo: 'booleano', nome: 'highlightOnHover' },
    { tipo: 'booleano', nome: 'onSegmentClick' },
  ],
  renderizar: (valores, registrar) => {
    const { props } = CONJUNTOS[valores.conjunto];

    return (
      <div style={{ width: '100%' }}>
        <ChartTimeline
          {...props}
          axisPosition={valores.axisPosition as 'top' | 'bottom'}
          collapsibleGroups={valores.collapsibleGroups}
          compactSummary={valores.compactSummary as 'below' | 'hidden'}
          density={valores.density as ChartTimelineDensity}
          highlightOnHover={valores.highlightOnHover}
          key={valores.conjunto}
          legend={valores.legend as 'top' | 'bottom' | 'none'}
          legendAlign={valores.legendAlign as ChartLegendAlign}
          mergeConsecutive={valores.mergeConsecutive}
          onCollapsedGroupsChange={(grupos) => registrar(`onCollapsedGroupsChange: [${grupos.join(', ')}]`)}
          onHiddenSeriesChange={(ocultas) => registrar(`onHiddenSeriesChange: [${ocultas.join(', ')}]`)}
          onSegmentClick={
            valores.onSegmentClick
              ? (intervalo, linha) => registrar(`onSegmentClick: ${linha.label} · ${intervalo.series}`)
              : undefined
          }
          overlap={valores.overlap as ChartTimelineOverlap}
          rowGap={valores.rowGap}
          rowSummary={valores.rowSummary ? props.rowSummary : undefined}
          segmentLabel={valores.segmentLabel as ChartTimelineSegmentLabelContent}
          segmentLabelAlign={valores.segmentLabelAlign as ChartTimelineLabelAlign}
          showGrid={valores.showGrid}
          showProgress={valores.showProgress}
          showSegmentLabels={valores.showSegmentLabels as ChartTimelineSegmentLabels}
          showTooltip={valores.showTooltip}
          title={valores.title}
          xAxis={valores.xAxis as AxisVisibility}
        />
      </div>
    );
  },
  codigo: (valores) => {
    const { dados, props } = CONJUNTOS[valores.conjunto];

    return gerarJsx('ChartTimeline', [
      ['title', valores.title],
      ['timeScale', props.timeScale, 'calendar'],
      ['domain', props.domain && expr('dominio')],
      ['rows', expr('linhas')],
      ['series', expr('series')],
      ...dados,
      ['density', valores.density, 'md'],
      ['overlap', valores.overlap, 'stack'],
      ['showSegmentLabels', valores.showSegmentLabels, 'auto'],
      ['segmentLabel', valores.segmentLabel, 'duration'],
      ['segmentLabelAlign', valores.segmentLabelAlign, 'center'],
      ['showProgress', valores.showProgress, true],
      ['mergeConsecutive', valores.mergeConsecutive, true],
      ['xAxis', valores.xAxis, 'visible'],
      ['axisPosition', valores.axisPosition, 'top'],
      ['showGrid', valores.showGrid, true],
      ['rowSummary', valores.rowSummary ? expr('resumoDaLinha') : undefined],
      ['compactSummary', valores.compactSummary, 'below'],
      ['rowGap', valores.rowGap, 4],
      ['collapsibleGroups', valores.collapsibleGroups, true],
      ['legend', valores.legend, 'top'],
      ['legendAlign', valores.legendAlign, 'left'],
      ['showTooltip', valores.showTooltip, true],
      ['highlightOnHover', valores.highlightOnHover, false],
      ['onSegmentClick', valores.onSegmentClick ? expr('abrirDetalhe') : undefined],
    ]);
  },
  verificar: (valores) => {
    const titulo = valores.title.trim();
    const verificacoes: Verificacao[] = [
      titulo
        ? valores.onSegmentClick
          ? { nivel: 'ok', titulo: 'Grupo nomeado', detalhe: `O desenho é role="group" nomeado por "${titulo}", e cada intervalo é um botão.` }
          : { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O desenho é role="img" nomeado por "${titulo}".` }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O title nomeia o gráfico para o leitor de tela. Sem ele, o desenho fica sem nome.' },
      { nivel: 'ok', titulo: 'Leitura medida a medida', detalhe: '"Ver como tabela" troca o desenho por uma tabela com uma seção por linha.' },
    ];

    if (valores.onSegmentClick) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Teclado',
        detalhe: 'Tab entra por um único intervalo; as setas, Home e End percorrem; Enter e Espaço disparam onSegmentClick.',
      });
    }

    if (valores.legend === 'none') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Cor sem nome',
        detalhe: 'Sem legenda, a série só se nomeia no balão e na tabela: a cor sozinha não diz o que o intervalo é.',
      });
    }

    if (valores.conjunto !== 'servicos' && !valores.mergeConsecutive) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Só em estados', detalhe: 'mergeConsecutive vale para states; este conjunto usa segments.' });
    }

    if (valores.overlap === 'overlay' && valores.conjunto === 'plantoes') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Sobreaviso encoberto',
        detalhe: 'Em overlay, o intervalo que cruza outro fica por cima dele; em stack, cada um tem a sua sub-faixa.',
      });
    }

    return verificacoes;
  },
});

/* ---- Variantes e modos ----------------------------------------------------------------------------------------------- */

const DIA_CURTO: ChartTimelineProps = {
  ...JORNADA_DA_QUINZENA,
  rows: JORNADA_DA_QUINZENA.rows.slice(1, 4),
  referenceLines: undefined,
  rowSummary: undefined,
};

function Variantes() {
  return (
    <div className="demo-grid">
      {(['md', 'sm'] as const).map((density) => (
        <div className="demo-box" key={density}>
          <ChartTimeline {...DIA_CURTO} density={density} legend="none" title={`density="${density}"`} />
        </div>
      ))}
      {(['stack', 'overlay'] as const).map((overlap) => (
        <div className="demo-box" key={overlap}>
          <ChartTimeline
            {...PLANTOES}
            legend="none"
            overlap={overlap}
            rowSummary={undefined}
            rows={PLANTOES.rows.slice(0, 3)}
            title={`overlap="${overlap}"`}
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
        <dt><code>timeScale</code></dt>
        <dd>
          Em <code>calendar</code>, datas contínuas: um <code>Date</code> ou milissegundos. Em <code>dayHours</code>, horas
          do dia com cada linha sendo um dia: um <code>Date</code> vale pela hora, e um número é a hora decimal. O
          intervalo que cruza a meia-noite é cortado no fim do eixo, com a ponta marcada; dividi-lo entre o dia e o
          seguinte é do produto, que sabe que a linha é um dia.
        </dd>
        <dt><code>states</code> e <code>mergeConsecutive</code></dt>
        <dd>
          Alternativa a <code>segments</code>: cada leitura vale até a seguinte, e a última até <code>statesEnd</code> ou
          o fim do eixo. Juntando, leituras iguais seguidas viram uma região; sem juntar, uma célula por leitura.
        </dd>
        <dt><code>showSegmentLabels</code></dt>
        <dd>
          Em <code>auto</code>, o rótulo só entra na barra quando cabe inteiro; em <code>visible</code>, corta com
          reticências o que não cabe; em <code>hidden</code>, fica só o balão.
        </dd>
        <dt><code>xAxis=&quot;onHover&quot;</code></dt>
        <dd>
          O eixo guarda o lugar e aparece com o ponteiro ou o foco no gráfico. A altura é a lista de linhas: abrir a
          calha empurraria a página.
        </dd>
        <dt><code>minPlotWidth</code> e <code>compactSummary</code></dt>
        <dd>
          Abaixo da largura mínima, o desenho rola de lado e rótulos e resumo ficam fixos. Em largura estreita, o resumo
          desce para baixo do rótulo, ou sai.
        </dd>
        <dt><code>onSegmentClick</code></dt>
        <dd>
          Sem ele, o desenho é <code>role=&quot;img&quot;</code>. Com ele, <code>role=&quot;group&quot;</code>, e cada
          intervalo é um botão de tabulação móvel.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Largura de celular</h3>
        <div style={{ maxWidth: 358 }}>
          <ChartTimeline {...JORNADA_DA_QUINZENA} density="sm" legend="none" referenceLines={undefined} />
        </div>
        <p className="note">
          Em 358px o resumo desce para baixo do dia e o desenho rola de lado, com os dias fixos.
        </p>
      </div>
      <div className="subsection">
        <h3>Estados, juntando os iguais</h3>
        <ChartTimeline {...SERVICOS_EM_ESTADOS} density="sm" legend="bottom" showSegmentLabels="hidden" />
        <p className="note">
          As mesmas leituras do exemplo de disponibilidade, com <code>mergeConsecutive</code> ligado: cada estado vira
          uma região contínua.
        </p>
      </div>
      <div className="subsection">
        <h3>Sem dados</h3>
        <ChartTimeline rows={[]} series={SERIES_DA_JORNADA} title="Jornada de trabalho" />
        <p className="note">Sem intervalos, faixas ou instantes, o gráfico anuncia a ausência com <code>emptyMessage</code>.</p>
      </div>
    </div>
  );
}

const REGISTRO_NO_EIXO: ChartTimelineProps = {
  title: 'Histórico do pedido 4512',
  rows: [{ key: 'pedido', label: 'Pedido 4512' }],
  series: [{ label: 'Rascunho' }, { label: 'Aguardando revisão' }, { label: 'Publicado' }],
  states: [
    { row: 'pedido', state: 'Rascunho', time: new Date(2026, 9, 12, 9, 14) },
    { row: 'pedido', state: 'Aguardando revisão', time: new Date(2026, 9, 14, 16, 2) },
    { row: 'pedido', state: 'Publicado', time: new Date(2026, 9, 15, 10, 40) },
  ],
};

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Jornada de trabalho do mês',
      largo: true,
      descricao:
        'Um dia por linha, de 0h a 24h, com o horário da jornada ao fundo e o resumo do dia à direita. Mês e total são composição do produto: Card e ButtonIcon.',
      Previa: JornadaDoMes,
      codigo: `const [mes, setMes] = useState(9);
const dias = jornadaDoMes(mes);

<Card>
  <Card.Header
    title={nomeDoMes(mes)}
    description={\`\${formatarDuracao(total)} trabalhadas · \${formatarDuracao(fora)} fora da jornada\`}
    trailing={
      <>
        <ButtonIcon icon={<IconChevronLeft />} label="Mês anterior" onClick={() => setMes(mes - 1)} size="sm" />
        <ButtonIcon icon={<IconChevronRight />} label="Próximo mês" onClick={() => setMes(mes + 1)} size="sm" />
      </>
    }
  />
  <Card.Body>
    <ChartTimeline
      title="Jornada diária"
      timeScale="dayHours"
      domain={[0, 24]}
      rows={dias.rows}
      series={series}
      segments={dias.segments}
      rowBands={dias.rowBands}
      markers={dias.markers}
      bands={adicionalNoturno}
      rowSummary={(dia, intervalos) => ({ title: formatarDuracao(total(intervalos)), subtitle: \`\${formatarDuracao(fora(intervalos))} fora\` })}
      density="sm"
      rowGap={2}
      showSegmentLabels="hidden"
    />
  </Card.Body>
</Card>`,
    },
    {
      titulo: 'Cronograma de projeto',
      largo: true,
      descricao:
        'Gantt em datas: progresso, equipes como grupos recolhíveis, marcos em diamante, fim de semana hachurado e a linha de hoje.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartTimeline {...CRONOGRAMA} defaultCollapsedGroups={['operacoes']} density="sm" legend="bottom" segmentLabel="label" />
        </div>
      ),
      codigo: `<ChartTimeline
  title="Cronograma da implantação do ERP"
  domain={[new Date(2026, 9, 1), new Date(2026, 10, 16)]}
  rows={tarefas}
  groups={equipes}
  defaultCollapsedGroups={['operacoes']}
  series={fases}
  segments={etapas}
  markers={marcos}
  bands={finsDeSemana}
  referenceLines={[{ time: hoje, label: 'Hoje 18/10' }]}
  segmentLabel="label"
  formatValue={formatarDias}
  formatTime={formatarDiaMes}
  rowSummary={(tarefa, [etapa]) => etapa && { title: formatarPercentual(etapa.progress ?? 0), subtitle: formatarDias(duracao(etapa)) }}
  density="sm"
  legend="bottom"
/>`,
    },
    {
      titulo: 'Disponibilidade de serviços',
      largo: true,
      descricao:
        'Modo estados, sem juntar iguais: uma célula por leitura de 30 minutos, cor por intent. A última leitura vale até agora.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartTimeline
            {...SERVICOS_EM_ESTADOS}
            density="sm"
            legend="bottom"
            mergeConsecutive={false}
            minPlotWidth={300}
            showSegmentLabels="hidden"
          />
        </div>
      ),
      codigo: `<ChartTimeline
  title="Disponibilidade dos serviços em 18/10/2026"
  timeScale="dayHours"
  domain={[0, 15]}
  rows={servicos}
  series={[
    { label: 'Operacional', intent: 'positive' },
    { label: 'Degradado', intent: 'warning' },
    { label: 'Fora do ar', intent: 'negative' },
    { label: 'Manutenção', intent: 'neutral' },
  ]}
  states={leituras}
  statesEnd={agora}
  mergeConsecutive={false}
  referenceLines={[{ time: agora, label: 'Agora 14h32' }]}
  rowSummary={disponibilidade}
  showSegmentLabels="hidden"
  density="sm"
/>`,
    },
    {
      titulo: 'Escala de plantões',
      largo: true,
      descricao: 'Uma semana em datas. Plantão e sobreaviso se cruzam na mesma pessoa e vão para sub-faixas automáticas.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartTimeline {...PLANTOES} legend="bottom" rowGap={2} />
        </div>
      ),
      codigo: `<ChartTimeline
  title="Escala de plantões, 12/10 a 18/10/2026"
  domain={[new Date(2026, 9, 12), new Date(2026, 9, 19)]}
  rows={pessoas}
  series={turnos}
  segments={plantoes}
  bands={finsDeSemana}
  referenceLines={[{ time: agora, label: 'Agora' }]}
  rowSummary={horasDaSemana}
/>`,
    },
    {
      titulo: 'Uso das salas de reunião',
      largo: true,
      descricao: 'Um dia, das 7h às 20h. O rótulo mostra o nome da reunião, cortado quando não cabe; o almoço é uma faixa global.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ChartTimeline {...SALAS} legend="bottom" />
        </div>
      ),
      codigo: `<ChartTimeline
  title="Ocupação das salas, Sex 16/10/2026"
  timeScale="dayHours"
  domain={[7, 20]}
  rows={salas}
  series={tipos}
  segments={reunioes}
  bands={[{ series: 'Almoço', start: 12, end: 13, label: 'Almoço' }]}
  segmentLabel="label"
  segmentLabelAlign="start"
  showSegmentLabels="visible"
/>`,
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartTimeline {...DIA_CURTO} density="sm" legend="none" title="Jornada de trabalho" />
      </div>
    ),
    texto:
      'Quanto tempo, quando e ao mesmo tempo que o quê: a posição e a largura da barra são o dado. Isso é ChartTimeline.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ChartTimeline {...REGISTRO_NO_EIXO} legend="none" />
      </div>
    ),
    texto:
      'Os passos de um registro num eixo de tempo: a barra sugere uma duração que ninguém vai ler. Por onde o registro passou é Timeline.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Com onSegmentClick, entra no gráfico por um único intervalo: o último focado. Sem ele, o desenho não recebe foco.' },
    { teclas: ['←', '→'], acao: 'Intervalo anterior e seguinte na mesma linha.' },
    { teclas: ['↑', '↓'], acao: 'Linha anterior e seguinte, no intervalo mais próximo no tempo.' },
    { teclas: ['Home', 'End'], acao: 'Primeiro e último intervalo da linha.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Dispara onSegmentClick; na legenda, liga e desliga a série; no grupo, recolhe e expande.' },
  ],
  garantias: [
    { garantia: 'Nome acessível', como: <>O desenho é <code>role=&quot;img&quot;</code> nomeado pelo <code>title</code>; com clique, <code>role=&quot;group&quot;</code>.</>, teste: 'ChartTimeline.test.tsx' },
    { garantia: 'Descrição do intervalo', como: 'Cada intervalo tem aria-label com linha, série, início, fim e duração, e a ponta cortada quando houver.', teste: 'ChartTimeline.test.tsx' },
    { garantia: 'Teclado', como: 'Tabulação móvel, setas, Home, End, Enter e Espaço, com o anel do foco.', teste: 'ChartTimeline.test.tsx' },
    { garantia: 'Visão em tabela', como: <>Botão com <code>aria-pressed</code>; uma seção por linha, com <code>th scope=&quot;rowgroup&quot;</code>, sem as séries desligadas.</>, teste: 'ChartTimeline.test.tsx' },
    { garantia: 'Legenda como filtro', como: 'A série desligada sai do desenho, do resumo e da tabela.', teste: 'ChartTimeline.test.tsx' },
    { garantia: 'Instante inválido', como: 'NaN ou data inválida não vira geometria: o intervalo não é desenhado.', teste: 'ChartTimeline.test.tsx' },
    { garantia: 'Eixo de tempo', como: 'Faixa automática arredondada à hora ou ao dia; marcas por hora, dia, semana ou mês, pelo espaço.', teste: 'timelineTime.test.ts' },
    { garantia: 'Duração', como: <><code>formatarDuracao</code>: <code>10h16m</code>, <code>48m</code>, <code>12h</code>.</>, teste: 'formatarDuracao.test.ts' },
  ],
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Título visível e nome acessível do desenho.' },
    { nome: 'rows', tipo: 'readonly ChartTimelineRow[]', descricao: <><code>{'{ key, label, description?, group? }'}</code>, na ordem de exibição. A key identifica; o label pode repetir.</> },
    { nome: 'series', tipo: 'readonly ChartTimelineSeries[]', descricao: <><code>{'{ label, color?, intent? }'}</code>. Servem a intervalos, faixas e marcas.</> },
    { nome: 'segments', tipo: 'readonly ChartTimelineSegment[]', descricao: <><code>{'{ row, series, start, end, label?, progress? }'}</code>.</> },
    { nome: 'states', tipo: 'readonly ChartTimelineState[]', descricao: <>Alternativa a segments: <code>{'{ row, time, state }'}</code>, cada uma vale até a seguinte.</> },
    { nome: 'mergeConsecutive', tipo: 'boolean', padrao: 'true', descricao: 'Em states, junta leituras iguais seguidas.' },
    { nome: 'statesEnd', tipo: 'Date | number', padrao: 'fim do eixo', descricao: 'Onde termina o último estado de cada linha.' },
    { nome: 'timeScale', tipo: "'calendar' | 'dayHours'", padrao: "'calendar'", descricao: 'Datas contínuas, ou horas do dia com cada linha sendo um dia.' },
    { nome: 'domain', tipo: 'readonly [Date | number, Date | number]', padrao: 'automático', descricao: 'Faixa fixa do eixo. Automática: do primeiro ao último instante, arredondada à hora ou ao dia.' },
    { nome: 'xAxis', tipo: "'visible' | 'hidden' | 'onHover'", padrao: "'visible'", descricao: 'Visibilidade do eixo de tempo.' },
    { nome: 'axisPosition', tipo: "'top' | 'bottom'", padrao: "'top'", descricao: 'No topo, o eixo fica à vista em listas longas.' },
    { nome: 'showGrid', tipo: 'boolean', padrao: 'true', descricao: 'Linhas verticais nas marcas do eixo.' },
    { nome: 'rowBands', tipo: 'readonly ChartTimelineRowBand[]', descricao: <>Faixas de referência de uma linha, ao fundo: <code>{'{ row, series, start, end }'}</code>.</> },
    { nome: 'bands', tipo: 'readonly ChartTimelineBand[]', descricao: <>Faixas globais hachuradas: <code>{'{ series, start, end, label? }'}</code>.</> },
    { nome: 'markers', tipo: 'readonly ChartTimelineMarker[]', descricao: <>Instantes numa linha: <code>{"{ row, series, time, shape?: 'line' | 'dot' | 'diamond', label? }"}</code>.</> },
    { nome: 'referenceLines', tipo: 'readonly ChartTimelineReferenceLine[]', descricao: <>Linhas verticais com rótulo: <code>{'{ time, label, intent? }'}</code>.</> },
    { nome: 'overlap', tipo: "'stack' | 'overlay'", padrao: "'stack'", descricao: 'Intervalos que se cruzam: sub-faixas automáticas, ou um sobre o outro.' },
    { nome: 'showSegmentLabels', tipo: "'auto' | 'visible' | 'hidden'", padrao: "'auto'", descricao: 'Rótulo na barra: só quando cabe, cortado, ou nunca.' },
    { nome: 'segmentLabel', tipo: "'duration' | 'label'", padrao: "'duration'", descricao: 'A duração, pelo formatValue, ou o label do intervalo (sem ele, o da série).' },
    { nome: 'segmentLabelAlign', tipo: "'start' | 'center' | 'end'", padrao: "'center'", descricao: 'Alinhamento do rótulo na barra.' },
    { nome: 'showProgress', tipo: 'boolean', padrao: 'true', descricao: 'Desenha o progress como preenchimento parcial.' },
    { nome: 'rowSummary', tipo: '(row, segments) => ChartTimelineSummary | undefined', descricao: <>Resumo <code>{'{ title, subtitle? }'}</code> à direita, sobre os intervalos visíveis da linha.</> },
    { nome: 'compactSummary', tipo: "'below' | 'hidden'", padrao: "'below'", descricao: 'Em largura estreita, o resumo desce para baixo do rótulo ou sai.' },
    { nome: 'groups', tipo: 'readonly ChartTimelineGroup[]', descricao: <>Um nível de agrupamento, <code>{'{ key, label }'}</code>; a linha declara o seu em row.group.</> },
    { nome: 'collapsibleGroups', tipo: 'boolean', padrao: 'true', descricao: 'O cabeçalho do grupo recolhe e expande; recolhido, mostra o período do grupo.' },
    { nome: 'collapsedGroups', tipo: 'readonly string[]', descricao: 'Grupos recolhidos, no modo controlado.' },
    { nome: 'defaultCollapsedGroups', tipo: 'readonly string[]', descricao: 'Grupos recolhidos de início, no modo não controlado.' },
    { nome: 'onCollapsedGroupsChange', tipo: '(collapsed: readonly string[]) => void', descricao: 'Avisa cada grupo recolhido ou expandido.' },
    { nome: 'density', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Linha de 26px ou 36px; barra de 14px ou 20px.' },
    { nome: 'rowGap', tipo: 'number', padrao: '4', descricao: 'Espaço entre linhas, em px.' },
    { nome: 'rowLabelWidth', tipo: "number | 'auto'", padrao: "'auto'", descricao: 'Largura da coluna de rótulos; automática pelo maior, com teto.' },
    { nome: 'minPlotWidth', tipo: 'number', padrao: '360', descricao: 'Abaixo dela, o desenho rola de lado com rótulos e resumo fixos.' },
    { nome: 'emptyRowLabel', tipo: 'string', padrao: "'Sem registro'", descricao: 'Texto da linha sem dado.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Sem dados no período'", descricao: 'Estado vazio do gráfico inteiro.' },
    { nome: 'legend', tipo: "'top' | 'bottom' | 'none'", padrao: "'top'", descricao: 'Posição da legenda, que aparece a partir de duas séries.' },
    { nome: 'legendAlign', tipo: "'left' | 'center' | 'right'", padrao: "'left'", descricao: 'Apoio da legenda.' },
    { nome: 'hiddenSeries', tipo: 'readonly string[]', descricao: 'Séries ocultas, pelo rótulo, no modo controlado.' },
    { nome: 'defaultHiddenSeries', tipo: 'readonly string[]', descricao: 'Séries ocultas de início, no modo não controlado.' },
    { nome: 'onHiddenSeriesChange', tipo: '(hidden: readonly string[]) => void', descricao: 'Avisa cada mudança feita pela legenda.' },
    { nome: 'showTooltip', tipo: 'boolean', padrao: 'true', descricao: 'Balão: no intervalo, série, período e duração; na linha, os totais por série.' },
    { nome: 'highlightOnHover', tipo: 'boolean', padrao: 'false', descricao: 'Esmaece as outras séries sob o ponteiro ou o foco.' },
    { nome: 'formatValue', tipo: '(durationMs: number) => string', padrao: 'formatarDuracao', descricao: 'Formato das durações no rótulo, na descrição e na tabela.' },
    { nome: 'formatTooltipValue', tipo: '(durationMs: number) => string', padrao: 'formatValue', descricao: 'Formato das durações só no balão.' },
    { nome: 'formatTime', tipo: '(time: Date) => string', padrao: 'por escala', descricao: 'Instantes no balão, na descrição e na tabela: 07:12 ou 05/10 14:00.' },
    { nome: 'formatTick', tipo: '(time: Date) => string', padrao: 'por escala', descricao: 'Marcas do eixo: 6h, 05/10 ou Seg 05/10.' },
    { nome: 'onSegmentClick', tipo: '(segment, row) => void', descricao: 'Clique, Enter ou Espaço num intervalo. Com ele, os intervalos viram botões.' },
  ],
};
