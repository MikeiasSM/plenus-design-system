import { useState } from 'react';
import { Button, DateTimePicker, formatDate, formatTime, type DateTimePickerSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function verificarLimite(nome: string, valor: string): Verificacao | undefined {
  if (valor && !DATA_ISO.test(valor)) {
    return { nivel: 'falha', titulo: `${nome} fora do formato`, detalhe: `"${valor}" não é data ISO, como 2026-03-09, e é ignorado.` };
  }

  return undefined;
}

const playground = definirPlayground({
  inicial: { label: 'Agendamento', hint: '', error: '', size: 'md', min: '', max: '', step: 30, required: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'size', opcoes: ['sm', 'md', 'lg'] },
    { tipo: 'texto', nome: 'min' },
    { tipo: 'texto', nome: 'max' },
    { tipo: 'numero', nome: 'step', min: 1, max: 240, passo: 5 },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <DateTimePicker
      disabled={valores.disabled}
      error={valores.error || undefined}
      hint={valores.hint || undefined}
      label={valores.label || undefined}
      max={valores.max || undefined}
      min={valores.min || undefined}
      onValueChange={(valor) => registrar('onValueChange: ' + JSON.stringify(valor))}
      required={valores.required}
      size={valores.size as DateTimePickerSize}
      step={valores.step}
    />
  ),
  codigo: (valores) =>
    gerarJsx('DateTimePicker', [
      ['label', valores.label || undefined],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['size', valores.size, 'md'],
      ['min', valores.min || undefined],
      ['max', valores.max || undefined],
      ['step', valores.step, 30],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['value', expr('agendamento')],
      ['onValueChange', expr('setAgendamento')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", no rótulo do campo.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, passe aria-label: o campo e o painel ficam sem nome.' },
    ];
    const limites = [verificarLimite('min', valores.min), verificarLimite('max', valores.max)].filter(
      (verificacao): verificacao is Verificacao => verificacao !== undefined,
    );

    verificacoes.push(...limites);

    if (!limites.length && valores.min && valores.max && valores.min > valores.max) {
      verificacoes.push({ nivel: 'falha', titulo: 'Faixa vazia', detalhe: 'min depois de max: nenhuma data pode ser escolhida.' });
    }

    if (valores.min || valores.max) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Limites só de data',
        detalhe: 'min e max recusam dias, não horários: a lista de horas cobre o dia inteiro.',
      });
    }

    if (!(valores.step > 0)) {
      verificacoes.push({ nivel: 'falha', titulo: 'Passo inválido', detalhe: 'Com passo zero ou negativo, a lista de horários fica vazia.' });
    }

    return verificacoes;
  },
});

function Agendamento() {
  const [agendamento, setAgendamento] = useState<string | null>('2026-03-09T18:40');

  return (
    <div className="stack" style={{ width: '100%' }}>
      <DateTimePicker label="Agendamento" onValueChange={setAgendamento} value={agendamento} />
      <p className="note">
        {agendamento
          ? `value: "${agendamento}", ou ${formatDate(agendamento.slice(0, 10), { format: 'long' })} às ${formatTime(agendamento.slice(11, 16))}`
          : 'value: null'}
      </p>
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
        setEnviado(String(new FormData(evento.currentTarget).get('visita')));
      }}
      style={{ width: '100%' }}
    >
      <DateTimePicker label="Visita técnica" name="visita" required step={15} />
      <Button type="submit">Agendar visita</Button>
      {enviado && <p className="note">Enviado: visita={enviado}</p>}
    </form>
  );
}

function AberturaControlada() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <Button onClick={() => setAberto(!aberto)} variant="secondary">
        {aberto ? 'Fechar o painel' : 'Abrir o painel'}
      </Button>
      <DateTimePicker label="Agendamento" onOpenChange={setAberto} open={aberto} />
      <p className="note">open: {String(aberto)}</p>
    </div>
  );
}

const CODIGO_DAS_VARIANTES = `<DateTimePicker label="Médio" />
<DateTimePicker label="Pequeno" size="sm" />
<DateTimePicker label="Com ajuda" hint="Horário de Brasília." />
<DateTimePicker label="Com erro" error="Informe data e hora." />
<DateTimePicker label="Obrigatório" required />
<DateTimePicker label="Desabilitado" value="2026-03-09T18:40" disabled />`;

function Variantes() {
  return (
    <>
      <div className="demo-grid">
        <DateTimePicker label="Médio" />
        <DateTimePicker label="Pequeno" size="sm" />
        <DateTimePicker hint="Horário de Brasília." label="Com ajuda" />
        <DateTimePicker error="Informe data e hora." label="Com erro" />
        <DateTimePicker label="Obrigatório" required />
        <DateTimePicker disabled label="Desabilitado" value="2026-03-09T18:40" />
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Texto ISO</dt>
      <dd>
        Entra e sai como <code>2026-03-09T18:40</code>, sem segundos, o mesmo texto que vai ao <code>FormData</code>.
      </dd>
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>. <code>null</code> é controlado e vazio.
      </dd>
      <dt>Digitação</dt>
      <dd>
        Data e hora na mesma máscara, só com números: a barra, o espaço e os dois pontos vêm dela, e digitá-los não faz
        nada. Durante a digitação, o valor só grava com a data e a hora completas; só a data vale meia-noite ao confirmar
        ou sair do campo. Pela metade, o valor não se apaga: só esvaziar o campo por inteiro emite <code>null</code>.
      </dd>
      <dt>Atalhos</dt>
      <dd>
        <code>H</code> dá a data e a hora atuais. <code>+</code> e <code>-</code> mudam um dia com o cursor na data, uma
        hora na hora e um minuto no minuto, e a virada passa para a data: 31/12 às 23:30 com <code>+</code> na hora vira
        01/01 do ano seguinte às 00:30. Com o campo vazio, partem de agora; com texto inválido, do último valor válido.
      </dd>
      <dt>Completar ao sair</dt>
      <dd>
        Com Enter, Tab ou clique fora, a data se completa como no <code>DatePicker</code> e a hora como no{' '}
        <code>TimePicker</code>. A hora é a parte depois do espaço: <code>21/05/2026 8</code> vira 21/05/2026 08:00.
        Sem espaço, o que foi digitado é só a data.
      </dd>
      <dt>Valor inválido</dt>
      <dd>
        Data ou hora inválida, ou data fora de <code>min</code> e <code>max</code>, mantém o texto no campo, sem mudar o
        valor nem chamar <code>onValueChange</code>. O campo mostra &quot;Data inválida.&quot;, &quot;Hora
        inválida.&quot; ou &quot;Data fora do intervalo permitido.&quot; no lugar do erro e recebe{' '}
        <code>aria-invalid</code>; o <code>error</code> do produto, se houver, prevalece. <code>onInvalid</code> recebe
        o texto. A mensagem some quando o valor fica válido.
      </dd>
      <dt>Painel</dt>
      <dd>
        Calendário à esquerda e horários à direita, sobre um rascunho: nada é gravado até <strong>Aplicar</strong>.
        Escolher a data preserva a hora, e escolher a hora preserva a data; hora sem data se apoia em hoje.{' '}
        <strong>Agora</strong> preenche data e hora correntes.
      </dd>
      <dt><code>min</code> e <code>max</code></dt>
      <dd>Limites de data, em <code>2026-03-09</code>. Os horários não são limitados.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Controlado',
      descricao: 'O valor é texto ISO; formatDate e formatTime o apresentam.',
      Previa: Agendamento,
      codigo:
        "const [agendamento, setAgendamento] = useState<string | null>('2026-03-09T18:40');\n\n<DateTimePicker\n  label=\"Agendamento\"\n  value={agendamento}\n  onValueChange={setAgendamento}\n/>",
    },
    {
      titulo: 'Abertura controlada',
      descricao: 'O produto abre e fecha o painel por open. Botão, teclado, Escape, clique fora e escolha pedem a mudança por onOpenChange.',
      Previa: AberturaControlada,
      codigo:
        "const [aberto, setAberto] = useState(false);\n\n<DateTimePicker label=\"Agendamento\" open={aberto} onOpenChange={setAberto} />",
    },
    {
      titulo: 'No formulário',
      descricao: 'De 15 em 15 minutos. Com name, data e hora vão juntas no envio.',
      Previa: Envio,
      codigo:
        '<form onSubmit={agendar}>\n  <DateTimePicker label="Visita técnica" name="visita" required step={15} />\n  <Button type="submit">Agendar visita</Button>\n</form>',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['↓'], acao: 'No campo, abre o painel com o foco no dia escolhido.' },
    { teclas: ['H'], acao: 'No campo, preenche com a data e a hora atuais.' },
    { teclas: ['+', '-'], acao: 'No campo, avança ou recua um dia, uma hora ou um minuto, conforme o cursor.' },
    { teclas: ['Enter'], acao: 'No campo, completa e valida o que foi digitado.' },
    { teclas: ['←', '→', '↑', '↓'], acao: 'Na grade, anda por dia e por semana.' },
    { teclas: ['PageUp', 'PageDown'], acao: 'Mês anterior ou seguinte; com Shift, ano.' },
    { teclas: ['Tab'], acao: 'Passa da grade ao campo de hora, à lista de horários e ao rodapé.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Escolhe o dia ou o horário em foco, ainda como rascunho.' },
    { teclas: ['Escape'], acao: 'Fecha sem aplicar.' },
  ],
  garantias: [
    {
      garantia: 'Abre um diálogo',
      como: <>O botão anuncia <code>aria-haspopup="dialog"</code>; calendário e horários ficam no mesmo diálogo.</>,
      teste: 'DateTimePicker.test.tsx',
    },
    {
      garantia: 'Dia por extenso',
      como: 'Cada dia da grade se anuncia pela data completa; os fora da faixa, com aria-disabled.',
      teste: 'DateTimePicker.test.tsx',
    },
    { garantia: 'Ids únicos', como: 'Dois seletores na mesma página não dividem os ids das opções de hora.', teste: 'data-hora.test.tsx' },
    {
      garantia: 'Campo de formulário',
      como: 'Rótulo e descrição pelo Field; valor, reset, desabilitado e obrigatório no envio.',
      teste: 'formulario.test.tsx',
    },
  ],
  notaDaApi: (
    <>
      As demais propriedades nativas de <code>&lt;input&gt;</code> e o ref vão ao campo de texto, que é o controle. O{' '}
      <code>className</code> soma à caixa do campo.
    </>
  ),
  api: [
    { nome: 'portalContainer', tipo: 'HTMLElement | null', descricao: 'Elemento que recebe o overlay, para herdar o tema da subárvore. Vale sobre o PortalProvider; sem ele e sem o provider, o document.body.' },
    { nome: 'value', tipo: 'string | null', descricao: 'Data e hora em ISO, no modo controlado. null é controlado e vazio.' },
    { nome: 'defaultValue', tipo: 'string', descricao: 'Data e hora iniciais em ISO, no modo não controlado.' },
    { nome: 'open', tipo: 'boolean', descricao: 'Abre ou fecha o painel, no modo controlado.' },
    { nome: 'defaultOpen', tipo: 'boolean', padrao: 'false', descricao: 'Aberto de início, no modo não controlado.' },
    { nome: 'onOpenChange', tipo: '(open: boolean) => void', descricao: 'Avisa cada pedido de abrir ou fechar; no modo controlado, só muda se o produto atualizar open.' },
    { nome: 'onValueChange', tipo: '(value: string | null) => void', descricao: 'Data e hora em ISO, ou null ao esvaziar o campo. Texto pela metade ou inválido não chama.' },
    { nome: 'onInvalid', tipo: '(text: string) => void', descricao: 'Avisa o texto digitado que não é uma data e hora válidas, ao confirmar ou sair do campo.' },
    { nome: 'min', tipo: 'string', descricao: 'Primeira data permitida, em ISO.' },
    { nome: 'max', tipo: 'string', descricao: 'Última data permitida, em ISO.' },
    { nome: 'isDateUnavailable', tipo: '(date: string) => boolean', descricao: 'Recusa datas avulsas, recebidas em ISO.' },
    { nome: 'step', tipo: 'number', padrao: '30', descricao: 'Minutos entre os horários da lista.' },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Marca o rótulo e barra o envio vazio.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o campo e o botão do painel.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura do campo: 32, 36 ou 56px.' },
    { nome: 'placeholder', tipo: 'string', padrao: "'dd/mm/aaaa hh:mm'", descricao: 'Texto do campo vazio.' },
    { nome: 'locale', tipo: 'string', padrao: "'pt-BR'", descricao: 'Idioma dos nomes de mês e dia no calendário.' },
    { nome: 'name', tipo: 'string', descricao: 'Nome do campo no formulário.' },
  ],
};
