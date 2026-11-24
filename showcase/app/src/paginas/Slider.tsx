import { useState } from 'react';
import { Slider, type SliderSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md', 'lg'] as const;
const FORMATOS = ['número', 'quilômetro', 'moeda', 'percentual'] as const;

const OPCOES_DO_FORMATO: Record<(typeof FORMATOS)[number], Intl.NumberFormatOptions | undefined> = {
  número: undefined,
  quilômetro: { style: 'unit', unit: 'kilometer' },
  moeda: { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 },
  percentual: { style: 'unit', unit: 'percent' },
};

const CODIGO_DO_FORMATO: Record<(typeof FORMATOS)[number], string | undefined> = {
  número: undefined,
  quilômetro: "{ style: 'unit', unit: 'kilometer' }",
  moeda: "{ style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }",
  percentual: "{ style: 'unit', unit: 'percent' }",
};

const playground = definirPlayground({
  inicial: {
    label: 'Raio de entrega',
    min: 0,
    max: 50,
    step: 5,
    formato: 'quilômetro',
    marcas: true,
    hint: '',
    error: '',
    size: 'md',
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'numero', nome: 'min' },
    { tipo: 'numero', nome: 'max' },
    { tipo: 'numero', nome: 'step', min: 1 },
    { tipo: 'opcoes', nome: 'formato', opcoes: FORMATOS },
    { tipo: 'booleano', nome: 'marcas' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => {
    const formato = valores.formato as (typeof FORMATOS)[number];

    return (
      <div style={{ width: '100%', maxWidth: 360 }}>
        <Slider
          defaultValue={valores.min}
          disabled={valores.disabled}
          error={valores.error || undefined}
          format={OPCOES_DO_FORMATO[formato]}
          hint={valores.hint || undefined}
          key={`${valores.min}-${valores.max}`}
          label={valores.label || undefined}
          marks={valores.marcas ? [valores.min, (valores.min + valores.max) / 2, valores.max] : undefined}
          max={valores.max}
          min={valores.min}
          onValueChange={(valor) => registrar(`onValueChange: ${valor}`)}
          onValueCommit={(valor) => registrar(`onValueCommit: ${valor}`)}
          size={valores.size as SliderSize}
          step={valores.step}
        />
      </div>
    );
  },
  codigo: (valores) => {
    const formato = CODIGO_DO_FORMATO[valores.formato as (typeof FORMATOS)[number]];

    return gerarJsx('Slider', [
      ['label', valores.label || undefined],
      ['min', valores.min, 0],
      ['max', valores.max, 100],
      ['step', valores.step, 1],
      ['marks', valores.marcas ? [valores.min, (valores.min + valores.max) / 2, valores.max] : undefined],
      ['format', formato && expr(formato)],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['size', valores.size, 'md'],
      ['disabled', valores.disabled, false],
      ['value', expr('raio')],
      ['onValueChange', expr('setRaio')],
    ]);
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `O polegar se chama "${valores.label.trim()}".` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, nomeie o controle por aria-label ou aria-labelledby.' },
      valores.max > valores.min
        ? { nivel: 'ok', titulo: 'Intervalo válido', detalhe: `De ${valores.min} a ${valores.max}, de ${valores.step} em ${valores.step}.` }
        : { nivel: 'falha', titulo: 'Intervalo vazio', detalhe: 'O max precisa ser maior que o min.' },
      {
        nivel: 'ok',
        titulo: 'Valor falado',
        detalhe: 'aria-valuetext leva o valor formatado; o texto ao lado do rótulo fica fora do leitor de tela, para não repetir.',
      },
    ];

    return verificacoes;
  },
});

function NoFimDoArrasto() {
  const [valor, setValor] = useState(40);
  const [confirmado, setConfirmado] = useState(40);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <Slider label="Volume" format={{ style: 'unit', unit: 'percent' }} onValueChange={setValor} onValueCommit={setConfirmado} value={valor} />
      <p className="note">
        onValueChange: <code>{valor}</code> · onValueCommit: <code>{confirmado}</code>
      </p>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>O valor ao lado do rótulo</dt>
      <dd>Sempre visível, sem balão sobre o polegar: quem arrasta com o dedo cobre o polegar, e o balão sumiria sob ele.</dd>
      <dt>Clique no trilho</dt>
      <dd>O polegar vai ao ponto, já no passo, e o arrasto continua dali até soltar.</dd>
      <dt>Passo e marcas</dt>
      <dd>
        O encaixe é sempre o <code>step</code>, contado a partir do <code>min</code>. As <code>marks</code> só mostram:
        um número aparece formatado, e <code>{'{ value, label }'}</code> troca o texto.
      </dd>
      <dt>Formato</dt>
      <dd>
        <code>format</code> recebe as opções do <code>Intl.NumberFormat</code>, na localidade de <code>locale</code>, pt-BR
        por padrão. Vale para o texto ao lado do rótulo, as marcas e o <code>aria-valuetext</code>.
      </dd>
      <dt>Durante e no fim</dt>
      <dd>
        <code>onValueChange</code> dispara a cada passo do arrasto; <code>onValueCommit</code>, ao soltar, para o filtro que
        consulta o servidor só no fim. No teclado, cada tecla dispara os dois.
      </dd>
      <dt>Foco</dt>
      <dd>O anel aparece só quando o foco chega pelo teclado. No arrasto, o polegar cresce um pouco e a borda engrossa.</dd>
      <dt>Em formulário</dt>
      <dd>
        Com <code>name</code>, o formulário recebe o número; o <code>reset</code> volta ao <code>defaultValue</code>.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Com marcas e unidade',
      descricao: 'As marcas mostram os pontos de referência; o encaixe é o passo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Slider defaultValue={15} format={{ style: 'unit', unit: 'kilometer' }} label="Raio de entrega" marks={[0, 25, 50]} max={50} step={5} />
        </div>
      ),
      codigo:
        "<Slider\n  label=\"Raio de entrega\"\n  min={0}\n  max={50}\n  step={5}\n  marks={[0, 25, 50]}\n  format={{ style: 'unit', unit: 'kilometer' }}\n  defaultValue={15}\n/>",
    },
    {
      titulo: 'Durante o arrasto e no fim',
      descricao: 'O valor acompanha o arrasto; a confirmação só chega ao soltar.',
      Previa: NoFimDoArrasto,
      codigo:
        "const [volume, setVolume] = useState(40);\n\n<Slider\n  label=\"Volume\"\n  format={{ style: 'unit', unit: 'percent' }}\n  value={volume}\n  onValueChange={setVolume}\n  onValueCommit={salvar}\n/>",
    },
    {
      titulo: 'Tamanhos',
      descricao: 'Polegar de 16, 20 e 24px; a área de toque fica em 44px nos três.',
      Previa: () => (
        <div className="stack" style={{ width: '100%' }}>
          <Slider defaultValue={30} label="Pequeno" size="sm" />
          <Slider defaultValue={50} label="Médio" />
          <Slider defaultValue={70} label="Grande" size="lg" />
        </div>
      ),
      codigo: '<Slider label="Pequeno" size="sm" />\n<Slider label="Médio" />\n<Slider label="Grande" size="lg" />',
    },
  ],
  Modos,
  teclado: [
    { teclas: ['→', '↑'], acao: 'Um passo acima.' },
    { teclas: ['←', '↓'], acao: 'Um passo abaixo.' },
    { teclas: ['PageUp', 'PageDown'], acao: 'O passo grande, largeStep: dez passos por padrão.' },
    { teclas: ['Home', 'End'], acao: 'O mínimo e o máximo.' },
  ],
  garantias: [
    {
      garantia: 'Padrão WAI-ARIA Slider',
      como: <>role="slider" com <code>aria-valuenow</code>, os extremos e o <code>aria-valuetext</code> formatado.</>,
      teste: 'Slider.test.tsx',
    },
    { garantia: 'Teclado completo', como: 'Setas, PageUp e PageDown, Home e End, sem rolar a página.', teste: 'Slider.test.tsx' },
    { garantia: 'Ponteiro com captura', como: 'Clique no trilho, arrasto preso aos extremos e confirmação ao soltar.', teste: 'Slider.test.tsx' },
    { garantia: 'Rótulo, ajuda e erro', como: 'Os do Field, ligados ao polegar.', teste: 'Slider.test.tsx' },
  ],
  notaDaApi: 'Além destas, as nativas de <div>, que vão à área do trilho, e o ref.',
  api: [
    { nome: 'value', tipo: 'number', descricao: 'Valor controlado.' },
    { nome: 'defaultValue', tipo: 'number', padrao: 'min', descricao: 'Valor inicial, não controlado; o reset do formulário volta a ele.' },
    { nome: 'onValueChange', tipo: '(value: number) => void', descricao: 'A cada passo, durante o arrasto e no teclado.' },
    { nome: 'onValueCommit', tipo: '(value: number) => void', descricao: 'Ao soltar o ponteiro, e a cada tecla.' },
    { nome: 'min', tipo: 'number', padrao: '0', descricao: 'Extremo inferior.' },
    { nome: 'max', tipo: 'number', padrao: '100', descricao: 'Extremo superior.' },
    { nome: 'step', tipo: 'number', padrao: '1', descricao: 'O passo do encaixe e das setas, contado a partir do min.' },
    { nome: 'largeStep', tipo: 'number', padrao: '10 × step', descricao: 'O passo do PageUp e do PageDown.' },
    { nome: 'marks', tipo: 'readonly (number | SliderMark)[]', descricao: <>Marcas sob o trilho; <code>{'{ value, label }'}</code> troca o texto.</> },
    { nome: 'format', tipo: 'Intl.NumberFormatOptions', descricao: 'Formato do valor, das marcas e do aria-valuetext.' },
    { nome: 'locale', tipo: 'string', padrao: "'pt-BR'", descricao: 'Localidade do formato.' },
    { nome: 'name', tipo: 'string', descricao: 'Envia o número no formulário.' },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo, que nomeia o polegar.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do controle.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Polegar de 16, 20 ou 24px; a área de toque é sempre 44px.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Fora da ordem do Tab, sem resposta ao ponteiro.' },
  ],
};
