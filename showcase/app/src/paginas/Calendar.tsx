import { useState } from 'react';
import { Calendar, Card, formatDate, type DateRange } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

const ehFimDeSemana = (data: string) => [0, 6].includes(new Date(`${data}T00:00`).getDay());

function hojeEmIso() {
  const hoje = new Date();
  const doisDigitos = (valor: number) => String(valor).padStart(2, '0');

  return `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`;
}

const playground = definirPlayground({
  inicial: {
    'aria-label': 'Data da entrega',
    selectionMode: 'single',
    minValue: '',
    maxValue: '',
    semFimDeSemana: false,
  },
  controles: [
    { tipo: 'texto', nome: 'aria-label' },
    { tipo: 'opcoes', nome: 'selectionMode', opcoes: ['single', 'range'] },
    { tipo: 'texto', nome: 'minValue' },
    { tipo: 'texto', nome: 'maxValue' },
    { tipo: 'booleano', nome: 'semFimDeSemana' },
  ],
  renderizar: (valores, registrar) => {
    const comuns = {
      'aria-label': valores['aria-label'] || undefined,
      isDateUnavailable: valores.semFimDeSemana ? ehFimDeSemana : undefined,
      maxValue: valores.maxValue || undefined,
      minValue: valores.minValue || undefined,
    };

    return valores.selectionMode === 'range' ? (
      <Calendar {...comuns} onChange={(valor) => registrar('onChange: ' + JSON.stringify(valor))} selectionMode="range" />
    ) : (
      <Calendar {...comuns} onChange={(valor) => registrar('onChange: ' + JSON.stringify(valor))} />
    );
  },
  codigo: (valores) =>
    gerarJsx('Calendar', [
      ['aria-label', valores['aria-label'] || undefined],
      ['selectionMode', valores.selectionMode, 'single'],
      ['minValue', valores.minValue || undefined],
      ['maxValue', valores.maxValue || undefined],
      ['isDateUnavailable', valores.semFimDeSemana ? expr('ehFimDeSemana') : undefined],
      ['value', expr(valores.selectionMode === 'range' ? 'periodo' : 'data')],
      ['onChange', expr(valores.selectionMode === 'range' ? 'setPeriodo' : 'setData')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores['aria-label'].trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores['aria-label'].trim()}", no grupo do calendário.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem aria-label, passe aria-labelledby: o grupo fica sem nome.' },
    ];

    for (const [nome, valor] of [['minValue', valores.minValue], ['maxValue', valores.maxValue]] as const) {
      if (valor && !DATA_ISO.test(valor)) {
        verificacoes.push({ nivel: 'falha', titulo: `${nome} fora do formato`, detalhe: `"${valor}" não é texto ISO, como 2026-03-09, e é ignorado.` });
      }
    }

    if (valores.semFimDeSemana) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Indisponível além da cor',
        detalhe: 'Os fins de semana ficam riscados, com aria-disabled e ", indisponível" no nome.',
      });
    }

    return verificacoes;
  },
});

function Entrega() {
  const [data, setData] = useState<string | null>(null);

  return (
    <div className="stack">
      <Calendar
        aria-label="Data da entrega"
        isDateUnavailable={ehFimDeSemana}
        minValue={hojeEmIso()}
        onChange={setData}
        value={data}
      />
      <p className="note">{data ? `value: "${data}", ou ${formatDate(data, { format: 'long' })}` : 'value: null'}</p>
    </div>
  );
}

function Periodo() {
  const [periodo, setPeriodo] = useState<DateRange | null>(null);

  return (
    <div className="stack">
      <Calendar aria-label="Período" onChange={setPeriodo} selectionMode="range" value={periodo} />
      <p className="note">{periodo ? `start: "${periodo.start}", end: "${periodo.end}"` : 'sem período'}</p>
    </div>
  );
}

function NaMoldura() {
  return (
    <Card style={{ width: 'max-content', maxWidth: '100%' }}>
      <Calendar aria-label="Disponibilidade da sala" defaultValue={hojeEmIso()} isDateUnavailable={ehFimDeSemana} />
    </Card>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>selectionMode</code></dt>
      <dd>
        <code>"single"</code>, o padrão, escolhe uma data, e <code>onChange</code> recebe o texto ISO,{' '}
        <code>2026-03-09</code>. Com <code>"range"</code>, o primeiro clique marca o início e o segundo, o fim; se vier
        antes, as pontas se invertem, e os dias entre eles ganham o realce. Só o intervalo inteiro chega a{' '}
        <code>onChange</code>, como <code>{'{ start, end }'}</code>, o mesmo formato do <code>DatePickerRange</code>.
      </dd>
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onChange</code>; <code>null</code> é controlado e vazio. A escolha é
        imediata: não há rascunho nem <strong>Aplicar</strong>, como no painel dos seletores.
      </dd>
      <dt>Indisponível e fora da faixa</dt>
      <dd>
        O dia recusado por <code>isDateUnavailable</code> fica apagado e riscado, com &quot;, indisponível&quot; no nome,
        e não se escolhe: a cor não é o único sinal. Antes de <code>minValue</code> e depois de <code>maxValue</code>, o
        dia só se apaga. Os dois continuam focáveis, para o teclado passar por eles.
      </dd>
      <dt>Sem moldura</dt>
      <dd>
        É o mesmo miolo do painel do <code>DatePicker</code>, sem borda nem fundo próprios: quem quer moldura o põe num{' '}
        <code>Card</code>. Mostra um mês por vez e não marca eventos nos dias.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Data da entrega',
      descricao: 'A partir de hoje e sem fins de semana, que ficam riscados. A escolha vale na hora.',
      Previa: Entrega,
      codigo:
        "const [data, setData] = useState<string | null>(null);\n\n<Calendar\n  aria-label=\"Data da entrega\"\n  minValue={hoje}\n  isDateUnavailable={ehFimDeSemana}\n  value={data}\n  onChange={setData}\n/>",
    },
    {
      titulo: 'Intervalo',
      descricao: 'Com selectionMode="range", dois cliques marcam o início e o fim.',
      Previa: Periodo,
      codigo:
        "const [periodo, setPeriodo] = useState<DateRange | null>(null);\n\n<Calendar\n  selectionMode=\"range\"\n  aria-label=\"Período\"\n  value={periodo}\n  onChange={setPeriodo}\n/>",
    },
    {
      titulo: 'Numa moldura',
      descricao: 'Sem borda nem fundo, o calendário entra no Card quando a tela pede moldura.',
      Previa: NaMoldura,
      codigo:
        '<Card>\n  <Calendar\n    aria-label="Disponibilidade da sala"\n    defaultValue={hoje}\n    isDateUnavailable={ehFimDeSemana}\n  />\n</Card>',
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Entra na grade, no dia escolhido ou em hoje, e segue para os botões do cabeçalho.' },
    { teclas: ['←', '→'], acao: 'Dia anterior ou seguinte.' },
    { teclas: ['↑', '↓'], acao: 'Mesma data da semana anterior ou seguinte.' },
    { teclas: ['Home', 'End'], acao: 'Primeiro ou último dia do mês.' },
    { teclas: ['PageUp', 'PageDown'], acao: 'Mês anterior ou seguinte; com Shift, ano anterior ou seguinte.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Escolhe o dia em foco; no intervalo, o início e depois o fim.' },
  ],
  garantias: [
    {
      garantia: 'Grupo nomeado',
      como: <>O calendário é um <code>role="group"</code> com o <code>aria-label</code> do produto, e a grade, um <code>role="grid"</code> com o nome do mês.</>,
      teste: 'Calendar.test.tsx',
    },
    {
      garantia: 'Dia por extenso',
      como: <>Cada dia se anuncia como "26 de novembro de 2026", com <code>aria-pressed</code> no escolhido e nas pontas do intervalo, e <code>aria-current="date"</code> em hoje.</>,
      teste: 'Calendar.test.tsx',
    },
    {
      garantia: 'Indisponível além da cor',
      como: <>O dia recusado tem <code>aria-disabled</code>, fica riscado e ganha ", indisponível" no nome.</>,
      teste: 'Calendar.test.tsx',
    },
  ],
  notaDaApi: (
    <>
      As demais propriedades nativas de <code>&lt;div&gt;</code> e o ref vão ao grupo que envolve o calendário. O{' '}
      <code>className</code> soma ao do sistema.
    </>
  ),
  api: [
    { nome: 'aria-label', tipo: 'string', descricao: 'Nome do calendário, como "Data da entrega". Sem ele, passe aria-labelledby.' },
    { nome: 'selectionMode', tipo: "'single' | 'range'", padrao: "'single'", descricao: 'Uma data ou um intervalo.' },
    { nome: 'value', tipo: 'string | DateRange | null', descricao: 'Data em ISO, ou { start, end } no intervalo, no modo controlado. null é controlado e vazio.' },
    { nome: 'defaultValue', tipo: 'string | DateRange | null', descricao: 'Valor inicial, no modo não controlado.' },
    { nome: 'onChange', tipo: '(value: string) => void | (value: DateRange) => void', descricao: 'Chamado a cada data escolhida, ou quando o segundo clique fecha o intervalo.' },
    { nome: 'minValue', tipo: 'string', descricao: 'Primeira data que se escolhe, em ISO. Antes dela, os dias só se apagam.' },
    { nome: 'maxValue', tipo: 'string', descricao: 'Última data que se escolhe, em ISO. Depois dela, os dias só se apagam.' },
    { nome: 'isDateUnavailable', tipo: '(date: string) => boolean', descricao: 'Recusa datas avulsas, recebidas em ISO: ficam riscadas e anunciadas como indisponíveis.' },
    { nome: 'autoFocus', tipo: 'boolean', padrao: 'false', descricao: 'Leva o foco ao dia escolhido, ou a hoje, ao montar.' },
    { nome: 'locale', tipo: 'string', padrao: "'pt-BR'", descricao: 'Idioma dos nomes de mês e dia.' },
  ],
};
