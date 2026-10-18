import { useState } from 'react';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  type CheckboxGroupOrientation,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const CANAIS = [
  { label: 'Web', value: 'web' },
  { label: 'E-mail', value: 'email' },
  { label: 'SMS', value: 'sms' },
];

const ORIENTACOES = ['vertical', 'horizontal'] as const;

const playground = definirPlayground({
  inicial: {
    label: 'Canais de aviso',
    hint: '',
    error: '',
    orientation: 'vertical',
    required: false,
    disabled: false,
    opcaoDesabilitada: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'orientation', opcoes: ORIENTACOES },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
    { tipo: 'booleano', nome: 'opcaoDesabilitada' },
  ],
  renderizar: (valores, registrar) => (
    <CheckboxGroup
      defaultValue={['web']}
      disabled={valores.disabled}
      error={valores.error || undefined}
      hint={valores.hint || undefined}
      label={valores.label}
      onValueChange={(valor) => registrar('onValueChange: [' + valor.join(', ') + ']')}
      orientation={valores.orientation as CheckboxGroupOrientation}
      required={valores.required}
    >
      {CANAIS.map((canal) => (
        <Checkbox
          disabled={valores.opcaoDesabilitada && canal.value === 'sms' ? true : undefined}
          key={canal.value}
          label={canal.label}
          value={canal.value}
        />
      ))}
    </CheckboxGroup>
  ),
  codigo: (valores) =>
    gerarJsx(
      'CheckboxGroup',
      [
        ['label', valores.label],
        ['hint', valores.hint || undefined],
        ['error', valores.error || undefined],
        ['orientation', valores.orientation, 'vertical'],
        ['required', valores.required, false],
        ['disabled', valores.disabled, false],
        ['defaultValue', expr("['web']")],
        ['onValueChange', expr('setCanais')],
      ],
      CANAIS.map((canal) =>
        gerarJsx('Checkbox', [
          ['label', canal.label],
          ['value', canal.value],
          ['disabled', valores.opcaoDesabilitada && canal.value === 'sms', false],
        ]),
      ).join('\n'),
    ),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Grupo nomeado', detalhe: `"${valores.label.trim()}", na legend do fieldset.` }
        : { nivel: 'falha', titulo: 'Grupo sem nome', detalhe: 'Sem legend, o leitor de tela anuncia as caixas sem dizer a pergunta.' },
    ];

    if (valores.required) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Obrigatório',
        detalhe: 'O formulário não envia sem ao menos uma caixa marcada; marcada uma, as demais deixam de ser exigidas.',
      });
    }

    if (valores.error) {
      verificacoes.push({ nivel: 'ok', titulo: 'Erro anunciado', detalhe: 'Mensagem em role="alert", descrevendo o grupo; cada caixa com aria-invalid.' });
    }

    if (valores.error && valores.hint) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Ajuda escondida pelo erro', detalhe: 'Só uma mensagem aparece: com erro, a ajuda sai.' });
    }

    if (valores.disabled) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Grupo desabilitado', detalhe: 'Todas as caixas saem da tabulação. Diga perto dele por quê.' });
    }

    return verificacoes;
  },
});

function CanaisControlados() {
  const [canais, setCanais] = useState<string[]>(['web']);

  return (
    <CheckboxGroup
      hint={canais.length ? `Selecionados: ${canais.join(', ')}` : 'Nenhum canal selecionado.'}
      label="Canais de aviso"
      onValueChange={setCanais}
      value={canais}
    >
      {CANAIS.map((canal) => (
        <Checkbox key={canal.value} label={canal.label} value={canal.value} />
      ))}
    </CheckboxGroup>
  );
}

function Obrigatorio() {
  const [enviado, setEnviado] = useState('');

  return (
    <form
      className="stack"
      onSubmit={(evento) => {
        evento.preventDefault();
        setEnviado(new FormData(evento.currentTarget).getAll('canais').join(', '));
      }}
    >
      <CheckboxGroup label="Canais de aviso" name="canais" required>
        {CANAIS.map((canal) => (
          <Checkbox key={canal.value} label={canal.label} value={canal.value} />
        ))}
      </CheckboxGroup>
      <Button type="submit">Salvar</Button>
      {enviado && <p className="note">Enviado: canais={enviado}</p>}
    </form>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <CheckboxGroup defaultValue={['web']} label="Padrão">
        <Checkbox label="Web" value="web" />
        <Checkbox label="E-mail" value="email" />
      </CheckboxGroup>
      <CheckboxGroup hint="Pode mudar depois." label="Com ajuda">
        <Checkbox label="Web" value="web" />
        <Checkbox label="E-mail" value="email" />
      </CheckboxGroup>
      <CheckboxGroup error="Escolha ao menos um canal." label="Com erro" required>
        <Checkbox label="Web" value="web" />
        <Checkbox label="E-mail" value="email" />
      </CheckboxGroup>
      <CheckboxGroup defaultValue={['email']} disabled label="Desabilitado">
        <Checkbox label="Web" value="web" />
        <Checkbox label="E-mail" value="email" />
      </CheckboxGroup>
      <CheckboxGroup defaultValue={['web']} label="Horizontal" orientation="horizontal">
        <Checkbox label="Web" value="web" />
        <Checkbox label="E-mail" value="email" />
        <Checkbox label="SMS" value="sms" />
      </CheckboxGroup>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>; não controlado com <code>defaultValue</code>. O
        estado é a lista dos valores marcados, e o grupo marca cada <code>Checkbox</code> pelo próprio <code>value</code>.
        Não controlado, volta ao valor inicial quando o formulário é reiniciado.
      </dd>
      <dt><code>Checkbox</code> sem <code>value</code></dt>
      <dd>Fica solto, mesmo dentro do grupo: não entra na lista nem recebe nome, desabilitado ou erro do grupo.</dd>
      <dt><code>name</code></dt>
      <dd>Sem ele, o grupo gera um nome único. Com ele, cada valor marcado vai ao formulário com esse nome.</dd>
      <dt><code>required</code></dt>
      <dd>Exige ao menos uma caixa marcada, não todas. O rótulo ganha o asterisco.</dd>
      <dt><code>disabled</code></dt>
      <dd>No grupo, desabilita todas as caixas; num <code>Checkbox</code>, vale o que ele declarar.</dd>
      <dt><code>orientation</code></dt>
      <dd>Vertical por padrão. Horizontal para poucas opções curtas, que quebram de linha quando não cabem.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Grupo controlado',
      descricao: 'O produto guarda a lista dos marcados e a mostra na ajuda.',
      Previa: CanaisControlados,
      codigo:
        '<CheckboxGroup\n  label="Canais de aviso"\n  value={canais}\n  onValueChange={setCanais}\n>\n  <Checkbox label="Web" value="web" />\n  <Checkbox label="E-mail" value="email" />\n  <Checkbox label="SMS" value="sms" />\n</CheckboxGroup>',
    },
    {
      titulo: 'Ao menos um, no formulário',
      descricao: 'Clique em Salvar sem marcar: o navegador barra o envio. Marcados, os valores vão pelo name.',
      Previa: Obrigatorio,
      codigo:
        '<form onSubmit={salvar}>\n  <CheckboxGroup label="Canais de aviso" name="canais" required>\n    <Checkbox label="Web" value="web" />\n    <Checkbox label="E-mail" value="email" />\n    <Checkbox label="SMS" value="sms" />\n  </CheckboxGroup>\n  <Button type="submit">Salvar</Button>\n</form>',
    },
  ],
  faca: {
    Previa: () => (
      <CheckboxGroup defaultValue={['web', 'email']} label="Canais de aviso">
        <Checkbox label="Web" value="web" />
        <Checkbox label="E-mail" value="email" />
        <Checkbox label="SMS" value="sms" />
      </CheckboxGroup>
    ),
    texto: 'CheckboxGroup para uma pergunta que aceita várias respostas, com uma legenda que diz qual é.',
  },
  evite: {
    Previa: () => (
      <RadioGroup defaultValue="web" label="Canal de aviso">
        <Radio label="Web" value="web" />
        <Radio label="E-mail" value="email" />
      </RadioGroup>
    ),
    texto: 'Usar o grupo de caixas quando só uma resposta vale. Escolha única é RadioGroup; uma escolha sim ou não é um Checkbox solto.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Passa por cada caixa, uma a uma, pulando as desabilitadas.' },
    { teclas: ['Espaço'], acao: 'Marca ou desmarca a caixa em foco.' },
  ],
  garantias: [
    {
      garantia: 'Grupo nomeado',
      como: <><code>&lt;fieldset&gt;</code>, papel <code>group</code>, com o rótulo na <code>&lt;legend&gt;</code>.</>,
      teste: 'CheckboxGroup.test.tsx',
    },
    { garantia: 'Caixas nativas', como: 'Um nome comum entre as caixas; cada valor marcado vai ao formulário.', teste: 'CheckboxGroup.test.tsx' },
    {
      garantia: 'Ajuda e erro',
      como: <><code>aria-describedby</code> no grupo, somado ao do consumidor; o erro em <code>role="alert"</code> e <code>aria-invalid</code> em cada caixa.</>,
      teste: 'CheckboxGroup.test.tsx',
    },
    { garantia: 'Obrigatório', como: 'O envio sem nenhuma caixa marcada é barrado; uma basta.', teste: 'CheckboxGroup.test.tsx' },
    { garantia: 'Reinício', como: 'Não controlado, o reset do formulário devolve o valor inicial.', teste: 'CheckboxGroup.test.tsx' },
    { garantia: 'Checkbox solto intacto', como: 'Fora do grupo, ou sem value, o Checkbox segue como antes.', teste: 'Checkbox.test.tsx' },
  ],
  notaDaApi: (
    <>
      No <code>CheckboxGroup</code>, as demais propriedades vão ao <code>&lt;fieldset&gt;</code>, com o ref. Cada opção é
      um <code>Checkbox</code> com <code>value</code>; seu <code>onChange</code> continua sendo chamado.
    </>
  ),
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Pergunta do grupo, na legend. Obrigatório.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'As opções, em Checkbox com value.' },
    { nome: 'value', tipo: 'string[]', descricao: 'Valores marcados, no modo controlado.' },
    { nome: 'defaultValue', tipo: 'string[]', padrao: '[]', descricao: 'Valores iniciais, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(values: string[]) => void', descricao: 'Avisa a lista inteira dos marcados a cada mudança.' },
    { nome: 'orientation', tipo: "'vertical' | 'horizontal'", padrao: "'vertical'", descricao: 'Disposição das caixas.' },
    { nome: 'name', tipo: 'string', padrao: 'gerado', descricao: 'Nome nativo das caixas, usado no envio do formulário.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo das opções.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Exige ao menos uma caixa marcada no envio.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita todas as caixas.' },
  ],
};
