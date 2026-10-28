import { useState } from 'react';
import { TimePicker, type TimePickerSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const emMinutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

function verificarLimite(nome: string, valor: string): Verificacao | undefined {
  if (valor && !HORA.test(valor)) {
    return { nivel: 'falha', titulo: `${nome} fora do formato`, detalhe: `"${valor}" não é hora em HH:mm, como 09:30, e é ignorado.` };
  }

  return undefined;
}

const playground = definirPlayground({
  inicial: { label: 'Início', hint: '', error: '', size: 'md', min: '', max: '', step: 30, required: false, disabled: false },
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
    <TimePicker
      disabled={valores.disabled}
      error={valores.error || undefined}
      hint={valores.hint || undefined}
      label={valores.label || undefined}
      max={valores.max || undefined}
      min={valores.min || undefined}
      onValueChange={(valor) => registrar('onValueChange: ' + JSON.stringify(valor))}
      required={valores.required}
      size={valores.size as TimePickerSize}
      step={valores.step}
    />
  ),
  codigo: (valores) =>
    gerarJsx('TimePicker', [
      ['label', valores.label || undefined],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['size', valores.size, 'md'],
      ['min', valores.min || undefined],
      ['max', valores.max || undefined],
      ['step', valores.step, 30],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['value', expr('inicio')],
      ['onValueChange', expr('setInicio')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", no rótulo do campo.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, passe aria-label: o campo e a lista ficam sem nome.' },
    ];
    const limites = [verificarLimite('min', valores.min), verificarLimite('max', valores.max)].filter(
      (verificacao): verificacao is Verificacao => verificacao !== undefined,
    );

    verificacoes.push(...limites);

    if (!(valores.step > 0)) {
      verificacoes.push({ nivel: 'falha', titulo: 'Passo inválido', detalhe: 'Com passo zero ou negativo, a lista de horários fica vazia.' });
      return verificacoes;
    }

    if (!limites.length) {
      const inicio = valores.min ? emMinutos(valores.min) : 0;
      const fim = valores.max ? emMinutos(valores.max) : 23 * 60 + 59;
      const quantidade = fim < inicio ? 0 : Math.floor((fim - inicio) / valores.step) + 1;

      verificacoes.push(
        quantidade
          ? { nivel: 'ok', titulo: `${quantidade} horários`, detalhe: 'Do primeiro ao último que couber no passo, dentro da faixa.' }
          : { nivel: 'falha', titulo: 'Faixa vazia', detalhe: 'min depois de max: nenhum horário pode ser escolhido.' },
      );
    }

    return verificacoes;
  },
});

function Controlado() {
  const [inicio, setInicio] = useState<string | null>('09:30');

  return (
    <div className="stack" style={{ width: '100%' }}>
      <TimePicker label="Início" onValueChange={setInicio} value={inicio} />
      <p className="note">value: {JSON.stringify(inicio)}</p>
    </div>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <TimePicker label="Médio" />
      <TimePicker label="Pequeno" size="sm" />
      <TimePicker hint="Horário de Brasília." label="Com ajuda" />
      <TimePicker error="Informe a hora." label="Com erro" />
      <TimePicker label="Obrigatório" required />
      <TimePicker disabled label="Desabilitado" value="09:30" />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Texto <code>HH:mm</code></dt>
      <dd>
        Entra e sai como <code>09:30</code>, em 24 horas, o mesmo texto que vai ao <code>FormData</code>. O painel é do
        Design System, e não o seletor nativo, que seguia a localidade do sistema operacional e podia mostrar AM/PM.
      </dd>
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>. <code>null</code> é controlado e vazio.
      </dd>
      <dt>Digitação</dt>
      <dd>
        A hora só vale com os quatro dígitos: <code>18:4</code> ainda emite <code>null</code>, para não fixar o minuto
        antes de completá-lo. Hora fora da faixa também emite <code>null</code>.
      </dd>
      <dt>Painel</dt>
      <dd>
        Uma coluna de horários, de <code>step</code> em <code>step</code> minutos entre <code>min</code> e{' '}
        <code>max</code>; sem limites, da meia-noite ao último horário do dia. Acima dela, um campo{' '}
        <code>hh:mm</code> para informar a hora sem percorrer a lista. Escolher aplica e fecha.
      </dd>
      <dt><code>name</code></dt>
      <dd>Leva o valor ao formulário, volta ao inicial no reset e não é enviado com o seletor desabilitado.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Controlado',
      descricao: 'Digite ou escolha na lista: o valor é texto HH:mm, ou null enquanto a hora está incompleta.',
      Previa: Controlado,
      codigo: "const [inicio, setInicio] = useState<string | null>('09:30');\n\n<TimePicker label=\"Início\" value={inicio} onValueChange={setInicio} />",
    },
    {
      titulo: 'Horário comercial',
      descricao: 'A lista só oferece os horários da faixa, e a digitação recusa os de fora.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <TimePicker hint="Das 8h às 18h." label="Atendimento" max="18:00" min="08:00" />
        </div>
      ),
      codigo: '<TimePicker\n  label="Atendimento"\n  hint="Das 8h às 18h."\n  min="08:00"\n  max="18:00"\n/>',
    },
    {
      titulo: 'De 15 em 15 minutos',
      descricao: 'O passo define os horários da lista; a digitação aceita qualquer minuto.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <TimePicker label="Lembrete" step={15} />
        </div>
      ),
      codigo: '<TimePicker label="Lembrete" step={15} />',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['↓'], acao: 'No campo, abre o painel com o foco na lista, a partir do horário escolhido.' },
    { teclas: ['↑', '↓'], acao: 'Na lista, horário anterior ou seguinte.' },
    { teclas: ['Home', 'End'], acao: 'Primeiro ou último horário.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Escolhe o horário em foco e fecha.' },
    { teclas: ['Escape'], acao: 'Fecha o painel; de dentro dele, devolve o foco ao botão.' },
  ],
  garantias: [
    {
      garantia: 'Abre um diálogo',
      como: <>O botão anuncia <code>aria-haspopup="dialog"</code> e <code>aria-expanded</code>.</>,
      teste: 'TimePicker.test.tsx',
    },
    {
      garantia: 'Lista de horários',
      como: <><code>role="listbox"</code> com o foco nele e o horário ativo em <code>aria-activedescendant</code>.</>,
      teste: 'data-hora.test.tsx',
    },
    { garantia: 'Erro', como: <><code>aria-invalid</code> e a mensagem ligada ao campo.</>, teste: 'TimePicker.test.tsx' },
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
    { nome: 'value', tipo: 'string | null', descricao: 'Hora em HH:mm, no modo controlado. null é controlado e vazio.' },
    { nome: 'defaultValue', tipo: 'string', descricao: 'Hora inicial em HH:mm, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: string | null) => void', descricao: 'Hora em HH:mm, ou null sem hora inteira e permitida.' },
    { nome: 'min', tipo: 'string', descricao: 'Primeiro horário permitido, em HH:mm.' },
    { nome: 'max', tipo: 'string', descricao: 'Último horário permitido, em HH:mm.' },
    { nome: 'step', tipo: 'number', padrao: '30', descricao: 'Minutos entre os horários da lista.' },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Marca o rótulo e barra o envio vazio.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o campo e o botão do painel.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura do campo: 32, 36 ou 56px.' },
    { nome: 'placeholder', tipo: 'string', padrao: "'hh:mm'", descricao: 'Texto do campo vazio.' },
    { nome: 'name', tipo: 'string', descricao: 'Nome do campo no formulário.' },
  ],
};
