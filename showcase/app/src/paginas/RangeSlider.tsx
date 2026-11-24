import { useState } from 'react';
import { RangeSlider, type SliderRange, type SliderSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md', 'lg'] as const;
const MOEDA = { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 } as const;

const playground = definirPlayground({
  inicial: {
    label: 'Faixa de preço',
    min: 0,
    max: 2000,
    step: 50,
    minDistance: 0,
    moeda: true,
    hint: 'Arraste entre os polegares para mover a faixa inteira.',
    error: '',
    size: 'md',
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'numero', nome: 'min' },
    { tipo: 'numero', nome: 'max' },
    { tipo: 'numero', nome: 'step', min: 1 },
    { tipo: 'numero', nome: 'minDistance', min: 0 },
    { tipo: 'booleano', nome: 'moeda' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <RangeSlider
        disabled={valores.disabled}
        error={valores.error || undefined}
        format={valores.moeda ? MOEDA : undefined}
        hint={valores.hint || undefined}
        key={`${valores.min}-${valores.max}`}
        label={valores.label || undefined}
        max={valores.max}
        min={valores.min}
        minDistance={valores.minDistance}
        onValueChange={(valor) => registrar(`onValueChange: [${valor.join(', ')}]`)}
        onValueCommit={(valor) => registrar(`onValueCommit: [${valor.join(', ')}]`)}
        size={valores.size as SliderSize}
        step={valores.step}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('RangeSlider', [
      ['label', valores.label || undefined],
      ['min', valores.min, 0],
      ['max', valores.max, 100],
      ['step', valores.step, 1],
      ['minDistance', valores.minDistance, 0],
      ['format', valores.moeda ? expr("{ style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }") : undefined],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['size', valores.size, 'md'],
      ['disabled', valores.disabled, false],
      ['value', expr('faixa')],
      ['onValueChange', expr('setFaixa')],
    ]),
  verificar: (valores) => {
    const nome = valores.label.trim();
    const verificacoes: Verificacao[] = [
      nome
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `Os polegares se chamam "${nome}, mínimo" e "${nome}, máximo".` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, nomeie o controle por aria-label ou aria-labelledby.' },
      valores.minDistance <= valores.max - valores.min
        ? { nivel: 'ok', titulo: 'Distância mínima', detalhe: `Os polegares ficam a pelo menos ${valores.minDistance} um do outro.` }
        : { nivel: 'falha', titulo: 'Distância impossível', detalhe: 'A minDistance passa do intervalo entre min e max.' },
      {
        nivel: 'ok',
        titulo: 'Arrasto da faixa',
        detalhe: 'Entre os polegares, o arrasto move os dois com a mesma largura; pelo teclado, cada um anda sozinho.',
      },
    ];

    return verificacoes;
  },
});

function FiltroNoFim() {
  const [faixa, setFaixa] = useState<SliderRange>([300, 1200]);
  const [consultada, setConsultada] = useState<SliderRange>([300, 1200]);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <RangeSlider
        format={MOEDA}
        label="Faixa de preço"
        max={2000}
        onValueChange={setFaixa}
        onValueCommit={setConsultada}
        step={50}
        value={faixa}
      />
      <p className="note">
        onValueChange: <code>[{faixa.join(', ')}]</code> · onValueCommit: <code>[{consultada.join(', ')}]</code>
      </p>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Os polegares não se cruzam</dt>
      <dd>
        Encostam um no outro. <code>minDistance</code> mantém um intervalo mínimo, e cada polegar anuncia até onde pode ir
        em <code>aria-valuemin</code> e <code>aria-valuemax</code>.
      </dd>
      <dt>Clique no trilho</dt>
      <dd>Leva o polegar mais próximo. Com os dois no mesmo ponto, o lado do clique decide qual vai.</dd>
      <dt>Arrasto da faixa</dt>
      <dd>
        Entre os polegares, o cursor vira mão e o arrasto move a faixa inteira, com a mesma largura, até encostar num
        extremo. Clicar ali sem arrastar não muda nada.
      </dd>
      <dt>Nomes</dt>
      <dd>
        Cada polegar leva o rótulo e o seu papel, "Faixa de preço, mínimo" e "Faixa de preço, máximo"; <code>labels</code>{' '}
        troca os textos e o separador da faixa ao lado do rótulo.
      </dd>
      <dt>Durante e no fim</dt>
      <dd>
        <code>onValueChange</code> dispara a cada passo; <code>onValueCommit</code>, ao soltar. No teclado, cada tecla
        dispara os dois.
      </dd>
      <dt>Em formulário</dt>
      <dd>
        <code>startName</code> e <code>endName</code> enviam as duas pontas; o <code>reset</code> volta ao{' '}
        <code>defaultValue</code>.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Filtro que consulta no fim',
      descricao: 'A faixa acompanha o arrasto; a consulta usa o onValueCommit, ao soltar.',
      Previa: FiltroNoFim,
      codigo:
        "const [faixa, setFaixa] = useState<SliderRange>([300, 1200]);\n\n<RangeSlider\n  label=\"Faixa de preço\"\n  min={0}\n  max={2000}\n  step={50}\n  format={{ style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }}\n  value={faixa}\n  onValueChange={setFaixa}\n  onValueCommit={consultar}\n/>",
    },
    {
      titulo: 'Com distância mínima',
      descricao: 'Os polegares ficam a pelo menos duas horas um do outro.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <RangeSlider
            defaultValue={[8, 18]}
            format={{ style: 'unit', unit: 'hour' }}
            label="Horário de entrega"
            marks={[0, 6, 12, 18, 24]}
            max={24}
            minDistance={2}
          />
        </div>
      ),
      codigo:
        "<RangeSlider\n  label=\"Horário de entrega\"\n  max={24}\n  minDistance={2}\n  marks={[0, 6, 12, 18, 24]}\n  format={{ style: 'unit', unit: 'hour' }}\n  defaultValue={[8, 18]}\n/>",
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Do polegar do mínimo ao do máximo.' },
    { teclas: ['→', '↑'], acao: 'Um passo acima, só o polegar com foco.' },
    { teclas: ['←', '↓'], acao: 'Um passo abaixo, só o polegar com foco.' },
    { teclas: ['PageUp', 'PageDown'], acao: 'O passo grande, largeStep: dez passos por padrão.' },
    { teclas: ['Home', 'End'], acao: 'Até o extremo ou até o outro polegar.' },
  ],
  garantias: [
    {
      garantia: 'Padrão WAI-ARIA Slider de dois polegares',
      como: 'Cada polegar com role="slider", nome próprio e o aria-valuetext formatado.',
      teste: 'RangeSlider.test.tsx',
    },
    { garantia: 'Sem cruzar', como: 'No teclado e no arrasto, com a distância mínima respeitada.', teste: 'RangeSlider.test.tsx' },
    { garantia: 'Arrasto da faixa', como: 'A mesma largura até o extremo; o clique sem arrasto não muda nada.', teste: 'RangeSlider.test.tsx' },
    { garantia: 'Rótulo, ajuda e erro', como: 'Os do Field, ligados aos dois polegares.', teste: 'RangeSlider.test.tsx' },
  ],
  notaDaApi: 'Além destas, as do Slider, exceto value, defaultValue, name e os eventos, e as nativas de <div>, que vão ao grupo dos polegares.',
  api: [
    { nome: 'value', tipo: '[number, number]', descricao: 'Faixa controlada.' },
    { nome: 'defaultValue', tipo: '[number, number]', padrao: '[min, max]', descricao: 'Faixa inicial, não controlada; o reset do formulário volta a ela.' },
    { nome: 'onValueChange', tipo: '(value: [number, number]) => void', descricao: 'A cada passo, durante o arrasto e no teclado.' },
    { nome: 'onValueCommit', tipo: '(value: [number, number]) => void', descricao: 'Ao soltar o ponteiro, e a cada tecla.' },
    { nome: 'minDistance', tipo: 'number', padrao: '0', descricao: 'Intervalo mínimo entre os polegares, na unidade do valor.' },
    { nome: 'startName', tipo: 'string', descricao: 'Nome do início no formulário.' },
    { nome: 'endName', tipo: 'string', descricao: 'Nome do fim no formulário.' },
    {
      nome: 'labels',
      tipo: 'RangeSliderLabels',
      descricao: <>Os textos <code>start</code>, <code>end</code> e <code>separator</code>: "mínimo", "máximo" e " a ".</>,
    },
  ],
};
