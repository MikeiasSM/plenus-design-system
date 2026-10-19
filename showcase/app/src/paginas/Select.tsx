import { useState } from 'react';
import { Button, ComboBox, Select, type SelectSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { ESTADOS } from '../dadosDeExemplo';

const PERIODICIDADES = [
  { label: 'Mensal', value: 'mensal' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral', value: 'semestral' },
  { label: 'Anual', value: 'anual' },
];

const REGIOES = [
  { label: 'Centro-Oeste', value: 'centro-oeste' },
  { label: 'Nordeste', value: 'nordeste' },
  { label: 'Norte', value: 'norte' },
  { label: 'Sudeste', value: 'sudeste' },
  { label: 'Sul', value: 'sul' },
  { disabled: true, label: 'Exterior', value: 'exterior' },
];

const SECOES = [
  { label: 'Títulos', value: 'titulos', description: 'Financeiro / Títulos' },
  { label: 'Contas a pagar', value: 'contas-a-pagar', description: 'Financeiro / Contas a pagar' },
  { label: 'Contratos', value: 'contratos', description: 'Jurídico / Contratos' },
  { label: 'Admissão', value: 'admissao', description: 'Pessoas / Admissão' },
];

const LISTAS = { periodicidade: PERIODICIDADES, regioes: REGIOES, estados: ESTADOS, secoes: SECOES };

const playground = definirPlayground({
  inicial: {
    label: 'Periodicidade',
    lista: 'periodicidade',
    placeholder: 'Selecione',
    hint: '',
    error: '',
    size: 'md',
    required: false,
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'lista', opcoes: ['periodicidade', 'regioes', 'estados', 'secoes'] },
    { tipo: 'texto', nome: 'placeholder' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'size', opcoes: ['sm', 'md'] },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <Select
        disabled={valores.disabled}
        error={valores.error || undefined}
        hint={valores.hint || undefined}
        key={valores.lista}
        label={valores.label || undefined}
        onValueChange={(valor) => registrar('onValueChange: ' + valor)}
        options={LISTAS[valores.lista as keyof typeof LISTAS]}
        placeholder={valores.placeholder}
        required={valores.required}
        size={valores.size as SelectSize}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Select', [
      ['label', valores.label || undefined],
      ['options', expr(valores.lista)],
      ['placeholder', valores.placeholder, 'Selecione'],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['size', valores.size, 'md'],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['value', expr('valor')],
      ['onValueChange', expr('setValor')],
    ]),
  verificar: (valores) => {
    const opcoes = LISTAS[valores.lista as keyof typeof LISTAS];
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", no rótulo do campo.` }
        : {
            nivel: 'falha',
            titulo: 'Sem rótulo',
            detalhe: 'O gatilho fica sem nome e a lista toma o placeholder como nome. Use label, ou aria-label.',
          },
      opcoes.length > 10
        ? {
            nivel: 'atencao',
            titulo: `${opcoes.length} opções`,
            detalhe: 'Lista longa, sem busca. Para listas longas ou que precisam de busca, o catálogo indica o ComboBox.',
          }
        : { nivel: 'ok', titulo: `${opcoes.length} opções`, detalhe: 'Lista curta, o papel do Select.' },
    ];

    if (opcoes.some((opcao) => 'disabled' in opcao)) {
      verificacoes.push({ nivel: 'ok', titulo: 'Opção indisponível', detalhe: 'Fica na lista com aria-disabled, e o teclado a pula.' });
    }

    if (opcoes.some((opcao) => 'description' in opcao)) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Segunda linha',
        detalhe: 'O rótulo nomeia a opção e a descrição a descreve; o gatilho fechado mostra só o rótulo.',
      });
    }

    if (valores.error && valores.hint) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Ajuda escondida pelo erro', detalhe: 'Só uma mensagem aparece: com erro, a ajuda sai.' });
    }

    return verificacoes;
  },
});

function Controlado() {
  const [periodicidade, setPeriodicidade] = useState('mensal');

  return (
    <div className="stack" style={{ width: '100%' }}>
      <Select label="Periodicidade" onValueChange={setPeriodicidade} options={PERIODICIDADES} value={periodicidade} />
      <p className="note">value: "{periodicidade}"</p>
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
        setEnviado(String(new FormData(evento.currentTarget).get('regiao')));
      }}
      style={{ width: '100%' }}
    >
      <Select label="Região de atuação" name="regiao" options={REGIOES} required />
      <Button type="submit">Salvar</Button>
      {enviado && <p className="note">Enviado: regiao={enviado}</p>}
    </form>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <Select label="Médio" options={PERIODICIDADES} />
      <Select label="Pequeno" options={PERIODICIDADES} size="sm" />
      <Select defaultValue="anual" label="Com valor" options={PERIODICIDADES} />
      <Select hint="A lista responde à digitação." label="Com ajuda" options={PERIODICIDADES} />
      <Select error="Escolha uma opção." label="Com erro" options={PERIODICIDADES} />
      <Select defaultValue="anual" disabled label="Desabilitado" options={PERIODICIDADES} />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>; não controlado com <code>defaultValue</code>. O
        valor é a chave da opção, e não o objeto: uma escolha feita antes de as opções chegarem não se perde.
      </dd>
      <dt>Busca por digitação</dt>
      <dd>
        Com a lista aberta, digitar leva à opção cujo texto começa pelas letras, ignorando caixa e acento. Não filtra a
        lista: filtrar é papel do <code>ComboBox</code>.
      </dd>
      <dt><code>name</code></dt>
      <dd>
        Um campo oculto leva o valor ao formulário, volta ao inicial no reset e não é enviado com o campo desabilitado.
      </dd>
      <dt><code>required</code></dt>
      <dd>Marca o rótulo e barra o envio sem escolha.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Controlado',
      descricao: 'O produto guarda a chave da opção escolhida.',
      Previa: Controlado,
      codigo:
        "const [periodicidade, setPeriodicidade] = useState('mensal');\n\n<Select\n  label=\"Periodicidade\"\n  options={periodicidades}\n  value={periodicidade}\n  onValueChange={setPeriodicidade}\n/>",
    },
    {
      titulo: 'Busca por digitação',
      descricao: 'Abra a lista e digite "sul" de uma vez: o "s" leva a Sudeste, e as letras seguintes acumulam até Sul. Exterior está indisponível.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Select label="Região" options={REGIOES} />
        </div>
      ),
      codigo:
        "const regioes = [\n  { label: 'Centro-Oeste', value: 'centro-oeste' },\n  { label: 'Nordeste', value: 'nordeste' },\n  { label: 'Norte', value: 'norte' },\n  { label: 'Sudeste', value: 'sudeste' },\n  { label: 'Sul', value: 'sul' },\n  { label: 'Exterior', value: 'exterior', disabled: true },\n];\n\n<Select label=\"Região\" options={regioes} />",
    },
    {
      titulo: 'Opção com segunda linha',
      descricao: 'A seção em destaque e o caminho dela embaixo. O leitor de tela lê o rótulo como nome e o caminho como descrição; fechado, o gatilho mostra só o rótulo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Select label="Dentro de" options={SECOES} />
        </div>
      ),
      codigo:
        "const secoes = [\n  { label: 'Títulos', value: 'titulos', description: 'Financeiro / Títulos' },\n  { label: 'Contratos', value: 'contratos', description: 'Jurídico / Contratos' },\n];\n\n<Select label=\"Dentro de\" options={secoes} />",
    },
    {
      titulo: 'No formulário',
      descricao: 'Com name, a chave vai no envio. Obrigatório, o envio sem escolha é barrado.',
      Previa: Envio,
      codigo:
        '<form onSubmit={salvar}>\n  <Select label="Região de atuação" name="regiao" options={regioes} required />\n  <Button type="submit">Salvar</Button>\n</form>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Select defaultValue="mensal" label="Periodicidade" options={PERIODICIDADES} />
      </div>
    ),
    texto: 'Select para escolha única numa lista curta, como campo de formulário.',
  },
  evite: {
    Previa: () => (
      <div className="stack" style={{ width: '100%' }}>
        <Select label="Estado" options={ESTADOS} />
        <ComboBox label="Estado" options={ESTADOS} placeholder="Digite para filtrar" />
      </div>
    ),
    texto: 'Vinte e sete estados num Select, sem busca. Lista longa, com busca ou mais de uma escolha pede o ComboBox, como o de baixo.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['↓', '↑', 'Enter', 'Espaço'], acao: 'No gatilho, abrem a lista a partir da opção escolhida.' },
    { teclas: ['↑', '↓'], acao: 'Na lista, opção anterior ou seguinte, pulando as desabilitadas.' },
    { teclas: ['Home', 'End'], acao: 'Primeira ou última opção.' },
    { teclas: ['A–Z'], acao: 'Vai à opção que começa pelas letras digitadas.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Escolhe a opção em foco e fecha.' },
    { teclas: ['Escape'], acao: 'Fecha sem escolher e devolve o foco ao gatilho.' },
    { teclas: ['Tab'], acao: 'Fecha a lista sem escolher.' },
  ],
  garantias: [
    {
      garantia: 'Anuncia o popup',
      como: <>Gatilho com <code>role="combobox"</code>, <code>aria-haspopup="listbox"</code> e <code>aria-expanded</code>.</>,
      teste: 'Select.test.tsx',
    },
    {
      garantia: 'Estado de seleção',
      como: <><code>role="listbox"</code> com <code>aria-selected</code> em cada opção.</>,
      teste: 'Select.test.tsx',
    },
    {
      garantia: 'Opção ativa',
      como: <>O foco fica na lista, e a opção ativa em <code>aria-activedescendant</code>.</>,
      teste: 'Select.test.tsx',
    },
    {
      garantia: 'Segunda linha',
      como: <>A opção se nomeia pelo rótulo e se descreve pela <code>description</code>; o ícone é decorativo.</>,
      teste: 'Select.test.tsx',
    },
    { garantia: 'Foco devolvido', como: 'Escape fecha e devolve o foco ao gatilho.', teste: 'Select.test.tsx' },
    { garantia: 'Busca por digitação', como: 'Pelo início do texto, ignorando caixa e acento.', teste: 'selection.test.ts' },
    {
      garantia: 'Campo de formulário',
      como: 'Rótulo, descrição e erro pelo Field; valor, reset, desabilitado e obrigatório no envio.',
      teste: 'formulario.test.tsx',
    },
  ],
  notaDaApi: (
    <>
      As demais propriedades nativas de <code>&lt;button&gt;</code> e o ref vão ao gatilho, que é o controle.
    </>
  ),
  api: [
    {
      nome: 'options',
      tipo: '{ label: string; value: string; description?: string; icon?: ReactNode; disabled?: boolean }[]',
      descricao: 'As opções da lista. description é a segunda linha e icon, um ornamento à frente; os dois só na lista aberta.',
    },
    { nome: 'value', tipo: 'string', descricao: 'Chave escolhida, no modo controlado.' },
    { nome: 'defaultValue', tipo: 'string', descricao: 'Chave inicial, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: string) => void', descricao: 'Avisa a chave escolhida.' },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'placeholder', tipo: 'string', padrao: "'Selecione'", descricao: 'Texto do gatilho sem escolha.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Marca o rótulo e barra o envio vazio.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o gatilho.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Altura do campo.' },
    { nome: 'name', tipo: 'string', descricao: 'Nome do campo no formulário.' },
  ],
};
