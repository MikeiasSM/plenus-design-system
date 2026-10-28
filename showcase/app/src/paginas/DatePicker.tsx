import { useState } from 'react';
import { Button, DatePicker, formatDate, type DatePickerSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

const ehFimDeSemana = (data: string) => [0, 6].includes(new Date(`${data}T00:00`).getDay());

function hojeEmIso() {
  const hoje = new Date();
  const doisDigitos = (valor: number) => String(valor).padStart(2, '0');

  return `${hoje.getFullYear()}-${doisDigitos(hoje.getMonth() + 1)}-${doisDigitos(hoje.getDate())}`;
}

function verificarLimite(nome: string, valor: string): Verificacao | undefined {
  if (valor && !DATA_ISO.test(valor)) {
    return { nivel: 'falha', titulo: `${nome} fora do formato`, detalhe: `"${valor}" não é texto ISO, como 2026-03-09, e é ignorado.` };
  }

  return undefined;
}

const playground = definirPlayground({
  inicial: {
    label: 'Vencimento',
    hint: '',
    error: '',
    size: 'md',
    min: '',
    max: '',
    semFimDeSemana: false,
    required: false,
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'size', opcoes: ['sm', 'md', 'lg'] },
    { tipo: 'texto', nome: 'min' },
    { tipo: 'texto', nome: 'max' },
    { tipo: 'booleano', nome: 'semFimDeSemana' },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <DatePicker
      disabled={valores.disabled}
      error={valores.error || undefined}
      hint={valores.hint || undefined}
      isDateUnavailable={valores.semFimDeSemana ? ehFimDeSemana : undefined}
      label={valores.label || undefined}
      max={valores.max || undefined}
      min={valores.min || undefined}
      onValueChange={(valor) => registrar('onValueChange: ' + JSON.stringify(valor))}
      required={valores.required}
      size={valores.size as DatePickerSize}
    />
  ),
  codigo: (valores) =>
    gerarJsx('DatePicker', [
      ['label', valores.label || undefined],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['size', valores.size, 'md'],
      ['min', valores.min || undefined],
      ['max', valores.max || undefined],
      ['isDateUnavailable', valores.semFimDeSemana ? expr('ehFimDeSemana') : undefined],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['value', expr('vencimento')],
      ['onValueChange', expr('setVencimento')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", no rótulo do campo.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, passe aria-label: o campo e o calendário ficam sem nome.' },
    ];
    const limites = [verificarLimite('min', valores.min), verificarLimite('max', valores.max)].filter(
      (verificacao): verificacao is Verificacao => verificacao !== undefined,
    );

    verificacoes.push(...limites);

    if (!limites.length && valores.min && valores.max && valores.min > valores.max) {
      verificacoes.push({ nivel: 'falha', titulo: 'Faixa vazia', detalhe: 'min depois de max: nenhuma data pode ser escolhida.' });
    } else if (!limites.length && (valores.min || valores.max || valores.semFimDeSemana)) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Datas recusadas',
        detalhe: 'Ficam indisponíveis na grade, com aria-disabled, e a digitação também as recusa.',
      });
    }

    if (valores.error && valores.hint) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Ajuda escondida pelo erro', detalhe: 'Só uma mensagem aparece: com erro, a ajuda sai.' });
    }

    return verificacoes;
  },
});

function Vencimento() {
  const [vencimento, setVencimento] = useState<string | null>('2026-03-09');

  return (
    <div className="stack" style={{ width: '100%' }}>
      <DatePicker label="Vencimento" onValueChange={setVencimento} value={vencimento} />
      <p className="note">
        {vencimento ? `value: "${vencimento}", ou ${formatDate(vencimento, { format: 'long' })}` : 'value: null'}
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
        setEnviado(String(new FormData(evento.currentTarget).get('entrega')));
      }}
      style={{ width: '100%' }}
    >
      <DatePicker label="Data de entrega" name="entrega" required />
      <Button type="submit">Agendar</Button>
      {enviado && <p className="note">Enviado: entrega={enviado}</p>}
    </form>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <DatePicker label="Médio" />
      <DatePicker label="Pequeno" size="sm" />
      <DatePicker hint="Digite ou escolha no calendário." label="Com ajuda" />
      <DatePicker error="Informe o vencimento." label="Com erro" />
      <DatePicker label="Obrigatório" required />
      <DatePicker disabled label="Desabilitado" value="2026-03-09" />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Texto ISO</dt>
      <dd>
        Entra e sai como <code>2026-03-09</code>, o mesmo texto que vai ao <code>FormData</code>. Texto que não é data
        conta como vazio, em vez de derrubar o componente.
      </dd>
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>. <code>null</code> é controlado e vazio:
        devolver <code>undefined</code> não limpa, porque o campo volta a ser não controlado.
      </dd>
      <dt>Digitação</dt>
      <dd>
        A máscara aceita barra, traço, ponto ou espaço como separador. Enquanto a data está pela metade, ou cai fora da
        faixa permitida, o valor emitido é <code>null</code>.
      </dd>
      <dt>Rascunho no calendário</dt>
      <dd>
        Escolher um dia não aplica nada: só <strong>Aplicar</strong> grava. <strong>Cancelar</strong> descarta, e{' '}
        <strong>Hoje</strong> leva a grade à data corrente sem aplicar.
      </dd>
      <dt><code>min</code>, <code>max</code> e <code>isDateUnavailable</code></dt>
      <dd>
        Os dias recusados continuam focáveis na grade, para o teclado alcançá-los, mas não podem ser escolhidos.
      </dd>
      <dt><code>name</code></dt>
      <dd>
        Um campo oculto leva o valor ao formulário, volta ao inicial no reset e não é enviado com o seletor
        desabilitado.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Controlado',
      descricao: 'Digite ou escolha: o valor é texto ISO, e formatDate o apresenta por extenso.',
      Previa: Vencimento,
      codigo:
        "const [vencimento, setVencimento] = useState<string | null>('2026-03-09');\n\n<DatePicker label=\"Vencimento\" value={vencimento} onValueChange={setVencimento} />",
    },
    {
      titulo: 'A partir de hoje',
      descricao: 'Os dias anteriores ficam indisponíveis, na grade e na digitação.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <DatePicker hint="Não aceita datas passadas." label="Agendar para" min={hojeEmIso()} />
        </div>
      ),
      codigo: '<DatePicker\n  label="Agendar para"\n  hint="Não aceita datas passadas."\n  min={hoje}\n/>',
    },
    {
      titulo: 'Só dias úteis',
      descricao: 'O predicado recebe cada data em ISO e diz se ela está indisponível.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <DatePicker isDateUnavailable={ehFimDeSemana} label="Data da reunião" />
        </div>
      ),
      codigo:
        "const ehFimDeSemana = (data: string) => [0, 6].includes(new Date(`${data}T00:00`).getDay());\n\n<DatePicker label=\"Data da reunião\" isDateUnavailable={ehFimDeSemana} />",
    },
    {
      titulo: 'No formulário',
      descricao: 'Com name, a data vai no envio em ISO. Obrigatório, o envio vazio é barrado.',
      Previa: Envio,
      codigo:
        '<form onSubmit={agendar}>\n  <DatePicker label="Data de entrega" name="entrega" required />\n  <Button type="submit">Agendar</Button>\n</form>',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['↓'], acao: 'No campo, abre o calendário com o foco no dia escolhido.' },
    { teclas: ['←', '→'], acao: 'Na grade, dia anterior ou seguinte.' },
    { teclas: ['↑', '↓'], acao: 'Na grade, mesma data da semana anterior ou seguinte.' },
    { teclas: ['Home', 'End'], acao: 'Primeiro ou último dia do mês.' },
    { teclas: ['PageUp', 'PageDown'], acao: 'Mês anterior ou seguinte; com Shift, ano anterior ou seguinte.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Escolhe o dia em foco, ainda como rascunho.' },
    { teclas: ['Escape'], acao: 'No calendário, fecha sem aplicar e devolve o foco ao botão; no campo, só fecha.' },
  ],
  garantias: [
    {
      garantia: 'Abre um diálogo',
      como: <>O botão anuncia <code>aria-haspopup="dialog"</code> e <code>aria-expanded</code>; o painel é um <code>role="dialog"</code> nomeado.</>,
      teste: 'DatePicker.test.tsx',
    },
    {
      garantia: 'Dia por extenso',
      como: <>Cada dia se anuncia como "12 de março de 2026", com <code>aria-pressed</code> no escolhido.</>,
      teste: 'DatePicker.test.tsx',
    },
    {
      garantia: 'Foco na grade',
      como: 'Ao abrir, o foco vai ao dia e anda com as setas; trocar o mês pelo botão não o puxa para a grade.',
      teste: 'data-hora.test.tsx',
    },
    {
      garantia: 'Dias indisponíveis',
      como: <><code>aria-disabled</code> nos dias fora da faixa, que a digitação também recusa.</>,
      teste: 'DatePicker.test.tsx',
    },
    {
      garantia: 'Campo de formulário',
      como: 'Rótulo, descrição e inválido pelo Field; valor, reset, desabilitado e obrigatório no envio.',
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
    { nome: 'value', tipo: 'string | null', descricao: 'Data em ISO, no modo controlado. null é controlado e vazio.' },
    { nome: 'defaultValue', tipo: 'string', descricao: 'Data inicial em ISO, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: string | null) => void', descricao: 'Data em ISO, ou null sem data inteira e permitida.' },
    { nome: 'min', tipo: 'string', descricao: 'Primeira data permitida, em ISO.' },
    { nome: 'max', tipo: 'string', descricao: 'Última data permitida, em ISO.' },
    { nome: 'isDateUnavailable', tipo: '(date: string) => boolean', descricao: 'Recusa datas avulsas, recebidas em ISO.' },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Marca o rótulo e barra o envio vazio.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o campo e o botão do calendário.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura do campo: 32, 36 ou 56px.' },
    { nome: 'placeholder', tipo: 'string', padrao: "'dd/mm/aaaa'", descricao: 'Texto do campo vazio.' },
    { nome: 'locale', tipo: 'string', padrao: "'pt-BR'", descricao: 'Idioma dos nomes de mês e dia no calendário.' },
    { nome: 'name', tipo: 'string', descricao: 'Nome do campo no formulário.' },
  ],
};
