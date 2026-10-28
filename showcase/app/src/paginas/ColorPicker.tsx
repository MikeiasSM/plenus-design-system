import { useState } from 'react';
import {
  ColorPicker,
  Select,
  type ColorPickerSize,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const CORES = [
  { color: '#3F4143', label: 'Grafite', value: 'grafite' },
  { color: '#C0392B', label: 'Vermelho', value: 'vermelho' },
  { color: '#F87500', label: 'Laranja', value: 'laranja' },
  { color: '#22885B', label: 'Verde', value: 'verde' },
  { color: '#2C6DB5', label: 'Azul', value: 'azul' },
  { color: '#7A4FB5', label: 'Roxo', value: 'roxo' },
];

const EXTREMOS = [
  { color: '#FFFFFF', label: 'Branco', value: 'branco' },
  { color: '#000000', label: 'Preto', value: 'preto' },
  ...CORES.slice(1, 3),
];

const TAMANHOS = ['sm', 'md', 'lg'] as const;

const playground = definirPlayground({
  inicial: { label: 'Cor do texto', size: 'md', padrao: true, labelDoPadrao: '', opcoes: 6, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'padrao' },
    { tipo: 'texto', nome: 'labelDoPadrao' },
    { tipo: 'numero', nome: 'opcoes', min: 2, max: 6 },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <ColorPicker
      defaultOption={valores.padrao ? { label: valores.labelDoPadrao || undefined } : undefined}
      defaultValue={valores.padrao ? null : 'grafite'}
      disabled={valores.disabled}
      label={valores.label}
      onValueChange={(valor) => registrar('onValueChange: ' + String(valor))}
      options={CORES.slice(0, valores.opcoes)}
      size={valores.size as ColorPickerSize}
    />
  ),
  codigo: (valores) => {
    const itens = CORES.slice(0, valores.opcoes)
      .map((cor) => `  { label: '${cor.label}', value: '${cor.value}', color: '${cor.color}' },`)
      .join('\n');
    const padrao = valores.labelDoPadrao ? `{ label: '${valores.labelDoPadrao}' }` : '{}';

    return `const cores = [\n${itens}\n];\n\n${gerarJsx('ColorPicker', [
      ['label', valores.label],
      ['options', expr('cores')],
      ['defaultOption', valores.padrao ? expr(padrao) : undefined],
      ['size', valores.size, 'md'],
      ['disabled', valores.disabled, false],
      ['value', expr('cor')],
      ['onValueChange', expr('setCor')],
    ])}`;
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Grupo nomeado', detalhe: `"${valores.label.trim()}", em aria-label do radiogroup.` }
        : { nivel: 'falha', titulo: 'Grupo sem nome', detalhe: 'O label não aparece na tela, mas é o que o leitor de tela anuncia ao entrar no grupo.' },
      { nivel: 'ok', titulo: 'Nome de cada cor', detalhe: 'O label da opção é o nome do rádio e aparece como dica no foco e no ponteiro.' },
      { nivel: 'ok', titulo: 'Escolha sem depender de cor', detalhe: 'Anel no texto principal e visto sobre a amostra escolhida.' },
      {
        nivel: 'ok',
        titulo: 'Alvo de toque',
        detalhe:
          valores.size === 'sm'
            ? '20px com 8px de espaço: o círculo de 24px em volta de cada uma não encosta no vizinho (WCAG 2.5.8).'
            : '28px, acima dos 24px da WCAG 2.5.8.',
      },
    ];

    if (valores.disabled) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Desabilitado', detalhe: 'Todas as amostras saem da tabulação. Diga perto dele por quê.' });
    }

    return verificacoes;
  },
});

function CorDoDestaque() {
  const [cor, setCor] = useState<string | null>(null);
  const escolhida = CORES.find((item) => item.value === cor);

  return (
    <div className="stack">
      <ColorPicker defaultOption={{}} label="Cor do destaque" onValueChange={setCor} options={CORES} value={cor} />
      <p className="note" style={{ color: escolhida?.color }}>
        {escolhida ? `Texto em ${escolhida.label.toLowerCase()}.` : 'Texto na cor padrão do documento.'}
      </p>
    </div>
  );
}

function Variantes() {
  return (
    <div className="matrix">
      <div className="matrix-row matrix-head">
        <span>size</span>
        <span>cores</span>
        <span>com padrão escolhido</span>
        <span>branco e preto</span>
        <span>disabled</span>
      </div>
      {TAMANHOS.map((tamanho) => (
        <div className="matrix-row" key={tamanho}>
          <code>{tamanho}</code>
          <span>
            <ColorPicker defaultValue="azul" label="Cor" options={CORES.slice(0, 4)} size={tamanho} />
          </span>
          <span>
            <ColorPicker defaultOption={{}} defaultValue={null} label="Cor" options={CORES.slice(0, 3)} size={tamanho} />
          </span>
          <span>
            <ColorPicker defaultValue="branco" label="Cor" options={EXTREMOS} size={tamanho} />
          </span>
          <span>
            <ColorPicker defaultValue="vermelho" disabled label="Cor" options={CORES.slice(0, 3)} size={tamanho} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>; não controlado com <code>defaultValue</code>. O
        valor é o <code>value</code> da opção, nunca a cor: o produto decide o que cada nome pinta.
      </dd>
      <dt><code>defaultOption</code></dt>
      <dd>
        Acrescenta, antes das cores, a amostra riscada que significa sem cor. Escolhida, o valor é <code>null</code>; no
        formulário, vai vazia. O nome padrão é &quot;Padrão&quot;, trocado por <code>label</code>.
      </dd>
      <dt><code>label</code> das opções</dt>
      <dd>
        É o nome de cada amostra para o leitor de tela e aparece como dica no foco e no ponteiro, pelo{' '}
        <code>Tooltip</code>. Use o nome da cor, não o código.
      </dd>
      <dt><code>name</code></dt>
      <dd>Por baixo são rádios nativos: com <code>name</code>, a escolha vai ao formulário.</dd>
      <dt><code>disabled</code></dt>
      <dd>Desabilita todas as amostras.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Cor de um trecho',
      descricao: 'Como na aba Estilo do editor: a amostra riscada devolve o texto à cor padrão do documento.',
      Previa: CorDoDestaque,
      codigo:
        "<ColorPicker\n  label=\"Cor do destaque\"\n  defaultOption={{}}\n  options={[\n    { label: 'Grafite', value: 'grafite', color: '#3F4143' },\n    { label: 'Vermelho', value: 'vermelho', color: '#C0392B' },\n    { label: 'Laranja', value: 'laranja', color: '#F87500' },\n    { label: 'Verde', value: 'verde', color: '#22885B' },\n    { label: 'Azul', value: 'azul', color: '#2C6DB5' },\n    { label: 'Roxo', value: 'roxo', color: '#7A4FB5' },\n  ]}\n  value={cor}\n  onValueChange={setCor}\n/>",
    },
    {
      titulo: 'Compacto, num painel lateral',
      descricao: 'Passe o ponteiro ou chegue pelo teclado: o nome de cada cor aparece como dica.',
      Previa: () => <ColorPicker defaultOption={{}} defaultValue="azul" label="Cor do texto" options={CORES} size="sm" />,
      codigo: '<ColorPicker\n  label="Cor do texto"\n  size="sm"\n  defaultOption={{}}\n  options={cores}\n  defaultValue="azul"\n/>',
    },
  ],
  faca: {
    Previa: () => <ColorPicker defaultOption={{}} defaultValue="azul" label="Cor do texto" options={CORES.slice(0, 5)} />,
    texto: 'Uma paleta curta, com o nome de cada cor e a opção de voltar ao padrão.',
  },
  evite: {
    Previa: () => (
      <Select
        defaultValue="azul"
        label="Cor do texto"
        options={CORES.map((cor) => ({ label: cor.label, value: cor.value }))}
      />
    ),
    texto: 'Uma lista de nomes, que obriga a ler e imaginar a cor. Cor se escolhe vendo; o ColorPicker é para paletas curtas e definidas, não para cor livre.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Entra no grupo pela amostra escolhida e sai dele de uma vez.' },
    { teclas: ['←', '→', '↑', '↓'], acao: 'Move para a amostra vizinha e a escolhe; a dica mostra o nome.' },
    { teclas: ['Esc'], acao: 'Fecha a dica.' },
  ],
  garantias: [
    {
      garantia: 'Grupo nomeado',
      como: <><code>role="radiogroup"</code> com o <code>label</code> em <code>aria-label</code>.</>,
      teste: 'ColorPicker.test.tsx',
    },
    { garantia: 'Rádios nativos', como: 'Cada amostra é um rádio, nomeado pelo label da opção.', teste: 'ColorPicker.test.tsx' },
    { garantia: 'Nome visível', como: 'O label da amostra aparece como dica no foco.', teste: 'ColorPicker.test.tsx' },
    { garantia: 'Sem cor', como: <>A amostra padrão vem primeiro e vale <code>null</code>.</>, teste: 'ColorPicker.test.tsx' },
    { garantia: 'Formulário', como: <>O valor escolhido vai no envio pelo <code>name</code>.</>, teste: 'ColorPicker.test.tsx' },
    {
      garantia: 'Contraste',
      como: 'Contorno no texto terciário e anel no texto principal, ambos acima de 4,5:1 sobre a superfície nos dois temas.',
      teste: 'check:contraste',
    },
  ],
  notaDaApi: 'As demais propriedades nativas de <div> e o ref vão ao contêiner do grupo.',
  api: [
    {
      nome: 'options',
      tipo: '{ value: string; label: string; color: string }[]',
      descricao: 'As amostras. color é qualquer cor do CSS; label é o nome e a dica.',
    },
    { nome: 'label', tipo: 'string', descricao: 'Nome do grupo, para o leitor de tela. Obrigatório.' },
    { nome: 'defaultOption', tipo: '{ label?: string }', descricao: "Amostra riscada, sem cor, que vale null. Nome padrão 'Padrão'." },
    { nome: 'value', tipo: 'string | null', descricao: 'Valor escolhido, no modo controlado; null é a amostra padrão.' },
    { nome: 'defaultValue', tipo: 'string | null', descricao: 'Valor inicial, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: string | null) => void', descricao: 'Avisa a amostra escolhida.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Amostras de 20, 28 ou 36px.' },
    { nome: 'name', tipo: 'string', padrao: 'gerado', descricao: 'Nome nativo dos rádios, usado no envio do formulário.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita todas as amostras.' },
  ],
};
