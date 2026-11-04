import { useState } from 'react';
import {
  Button,
  DatePickerRange,
  defaultDateRangeShortcuts,
  formatDate,
  type DateRange,
  type DateRangeShortcut,
} from '@plenustech/design-system';
import type { Pagina } from '../estrutura/tipos';

const ATALHOS_DO_PRODUTO: readonly DateRangeShortcut[] = [
  {
    label: 'Próximos 7 dias',
    range: () => {
      const hoje = new Date();
      const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 6);
      const iso = (data: Date) =>
        [data.getFullYear(), String(data.getMonth() + 1).padStart(2, '0'), String(data.getDate()).padStart(2, '0')].join('-');

      return { start: iso(hoje), end: iso(fim) };
    },
  },
];

function descrever(periodo: DateRange | null) {
  return periodo
    ? `${formatDate(periodo.start, { format: 'long' })} a ${formatDate(periodo.end, { format: 'long' })}`
    : 'sem período';
}

function ComAtalhos() {
  const [periodo, setPeriodo] = useState<DateRange | null>(null);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <DatePickerRange
        label="Período do relatório"
        onValueChange={setPeriodo}
        shortcuts={defaultDateRangeShortcuts}
        value={periodo}
      />
      <p className="note">{descrever(periodo)}</p>
    </div>
  );
}

function SemAtalhos() {
  return (
    <div style={{ width: '100%' }}>
      <DatePickerRange hint="Escolha o primeiro e o último dia." label="Vigência" />
    </div>
  );
}

function AtalhosDoProduto() {
  return (
    <div style={{ width: '100%' }}>
      <DatePickerRange label="Agendamento" min={new Date().toISOString().slice(0, 10)} shortcuts={ATALHOS_DO_PRODUTO} />
    </div>
  );
}

function Envio() {
  const [enviado, setEnviado] = useState('');

  return (
    <form
      className="stack"
      onSubmit={(evento) => {
        evento.preventDefault();
        const dados = new FormData(evento.currentTarget);
        setEnviado(`inicio=${String(dados.get('inicio'))}, fim=${String(dados.get('fim'))}`);
      }}
      style={{ width: '100%' }}
    >
      <DatePickerRange endName="fim" label="Período" required startName="inicio" />
      <Button type="submit">Filtrar</Button>
      {enviado && <p className="note">Enviado: {enviado}</p>}
    </form>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <DatePickerRange label="Médio" />
      <DatePickerRange label="Pequeno" size="sm" />
      <DatePickerRange error="Informe o período." label="Com erro" />
      <DatePickerRange defaultValue={{ start: '2026-03-09', end: '2026-03-13' }} disabled label="Desabilitado" />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Intervalo ISO</dt>
      <dd>
        Entra e sai como <code>{'{ start: "2026-03-09", end: "2026-03-13" }'}</code>, com as duas pontas incluídas.{' '}
        <code>null</code> é controlado e vazio.
      </dd>
      <dt>Rascunho no painel</dt>
      <dd>
        O primeiro clique marca o início e o segundo o fim; se vier antes, as pontas se invertem. Só{' '}
        <strong>Aplicar</strong> grava; <strong>Limpar</strong> esvazia o rascunho e, aplicado, o valor.
      </dd>
      <dt><code>shortcuts</code></dt>
      <dd>
        Lista do produto de <code>{'{ label, range }'}</code>. O <code>range</code> é uma função, chamada com o painel
        aberto, para &quot;Hoje&quot; valer o dia da escolha. Sem a propriedade não há atalho; escolher um só preenche o
        rascunho. <code>defaultDateRangeShortcuts</code> é uma lista pronta e opcional.
      </dd>
      <dt><code>min</code>, <code>max</code> e <code>isDateUnavailable</code></dt>
      <dd>Os dias recusados não podem ser escolhidos, e o atalho cujo intervalo sai da faixa fica desabilitado.</dd>
      <dt><code>startName</code> e <code>endName</code></dt>
      <dd>Dois campos ocultos levam as pontas ao formulário, voltam ao inicial no reset e não seguem desabilitados.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  exemplos: [
    {
      titulo: 'Com a lista pronta de atalhos',
      descricao: 'defaultDateRangeShortcuts traz Hoje, Ontem, Últimos 7 e 30 dias, Este mês e Mês passado. O produto passa, filtra ou troca.',
      Previa: ComAtalhos,
      codigo:
        "const [periodo, setPeriodo] = useState<DateRange | null>(null);\n\n<DatePickerRange\n  label=\"Período do relatório\"\n  shortcuts={defaultDateRangeShortcuts}\n  value={periodo}\n  onValueChange={setPeriodo}\n/>",
    },
    {
      titulo: 'Sem atalhos',
      descricao: 'Sem shortcuts, o painel é só o calendário.',
      Previa: SemAtalhos,
      codigo: '<DatePickerRange label="Vigência" hint="Escolha o primeiro e o último dia." />',
    },
    {
      titulo: 'Atalhos do produto',
      descricao: 'O range é uma função. Atalhos que saem de min e max ficam desabilitados.',
      Previa: AtalhosDoProduto,
      codigo:
        "const proximos7: DateRangeShortcut = {\n  label: 'Próximos 7 dias',\n  range: () => ({ start: hoje(), end: emSeisDias() }),\n};\n\n<DatePickerRange label=\"Agendamento\" min={hoje()} shortcuts={[proximos7]} />",
    },
    {
      titulo: 'No formulário',
      descricao: 'Com startName e endName, as pontas vão no envio em ISO.',
      Previa: Envio,
      codigo:
        '<form onSubmit={filtrar}>\n  <DatePickerRange label="Período" startName="inicio" endName="fim" required />\n  <Button type="submit">Filtrar</Button>\n</form>',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Enter', 'Espaço'], acao: 'No gatilho, abre o painel; na grade, escolhe o dia em foco.' },
    { teclas: ['←', '→'], acao: 'Na grade, dia anterior ou seguinte.' },
    { teclas: ['↑', '↓'], acao: 'Na grade, mesma data da semana anterior ou seguinte.' },
    { teclas: ['Home', 'End'], acao: 'Primeiro ou último dia do mês.' },
    { teclas: ['PageUp', 'PageDown'], acao: 'Mês anterior ou seguinte; com Shift, ano anterior ou seguinte.' },
    { teclas: ['Tab'], acao: 'Percorre os atalhos, a grade e os botões do rodapé.' },
    { teclas: ['Escape'], acao: 'Fecha sem aplicar e devolve o foco ao gatilho.' },
  ],
  garantias: [
    {
      garantia: 'Abre um diálogo',
      como: <>O gatilho é um <code>role="combobox"</code> com <code>aria-haspopup="dialog"</code>, <code>aria-expanded</code> e, quando obrigatório, <code>aria-required</code>; o painel é um <code>role="dialog"</code> nomeado.</>,
      teste: 'DatePickerRange.test.tsx',
    },
    {
      garantia: 'Intervalo anunciado',
      como: 'O resumo acima do calendário é uma região viva: diz o início, o fim ou o que falta escolher.',
      teste: 'DatePickerRange.test.tsx',
    },
    {
      garantia: 'Atalho em estado',
      como: <>O atalho do intervalo escolhido fica com <code>aria-pressed</code>; o que sai de min e max, desabilitado.</>,
      teste: 'DatePickerRange.test.tsx',
    },
    {
      garantia: 'Campo de formulário',
      como: 'Rótulo, descrição e inválido pelo Field; início e fim no envio, reset, desabilitado e obrigatório.',
      teste: 'DatePickerRange.test.tsx',
    },
  ],
  notaDaApi: (
    <>
      As demais propriedades nativas de <code>&lt;button&gt;</code> e o ref vão ao gatilho, que é o controle. O{' '}
      <code>className</code> soma ao do sistema.
    </>
  ),
  api: [
    { nome: 'value', tipo: 'DateRange | null', descricao: 'Intervalo em ISO, no modo controlado. null é controlado e vazio.' },
    { nome: 'defaultValue', tipo: 'DateRange', descricao: 'Intervalo inicial, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: DateRange | null) => void', descricao: 'Chamado em Aplicar, com o intervalo ou null.' },
    { nome: 'shortcuts', tipo: 'readonly DateRangeShortcut[]', descricao: 'Atalhos do painel, definidos pelo produto. Sem a propriedade, não há atalho. defaultDateRangeShortcuts é uma lista pronta.' },
    { nome: 'open', tipo: 'boolean', descricao: 'Abre ou fecha o painel, no modo controlado.' },
    { nome: 'defaultOpen', tipo: 'boolean', padrao: 'false', descricao: 'Aberto de início, no modo não controlado.' },
    { nome: 'onOpenChange', tipo: '(open: boolean) => void', descricao: 'Avisa cada pedido de abrir ou fechar.' },
    { nome: 'min', tipo: 'string', descricao: 'Primeira data permitida, em ISO.' },
    { nome: 'max', tipo: 'string', descricao: 'Última data permitida, em ISO.' },
    { nome: 'isDateUnavailable', tipo: '(date: string) => boolean', descricao: 'Recusa datas avulsas, recebidas em ISO.' },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Marca o rótulo e barra o envio vazio.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o gatilho.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura do campo.' },
    { nome: 'placeholder', tipo: 'string', padrao: "'Selecione o período'", descricao: 'Texto do gatilho sem intervalo.' },
    { nome: 'locale', tipo: 'string', padrao: "'pt-BR'", descricao: 'Idioma do calendário e formato das datas.' },
    { nome: 'startName', tipo: 'string', descricao: 'Nome do início no formulário.' },
    { nome: 'endName', tipo: 'string', descricao: 'Nome do fim no formulário.' },
    { nome: 'portalContainer', tipo: 'HTMLElement | null', descricao: 'Elemento que recebe o overlay. Vale sobre o PortalProvider; sem ele e sem o provider, o document.body.' },
  ],
};
