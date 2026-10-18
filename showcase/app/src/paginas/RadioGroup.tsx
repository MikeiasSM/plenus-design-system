import { useState } from 'react';
import { Button, Radio, RadioGroup } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const PAGAMENTOS = [
  { label: 'Pix', value: 'pix' },
  { label: 'Boleto', value: 'boleto' },
  { label: 'Cartão de crédito', value: 'cartao' },
];

const playground = definirPlayground({
  inicial: { label: 'Forma de pagamento', hint: '', error: '', required: false, disabled: false, opcaoDesabilitada: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
    { tipo: 'booleano', nome: 'opcaoDesabilitada' },
  ],
  renderizar: (valores, registrar) => (
    <RadioGroup
      defaultValue="pix"
      disabled={valores.disabled}
      error={valores.error || undefined}
      hint={valores.hint || undefined}
      label={valores.label}
      onValueChange={(valor) => registrar('onValueChange: ' + valor)}
      required={valores.required}
    >
      {PAGAMENTOS.map((opcao) => (
        <Radio
          disabled={valores.opcaoDesabilitada && opcao.value === 'cartao' ? true : undefined}
          key={opcao.value}
          label={opcao.label}
          value={opcao.value}
        />
      ))}
    </RadioGroup>
  ),
  codigo: (valores) =>
    gerarJsx(
      'RadioGroup',
      [
        ['label', valores.label],
        ['hint', valores.hint || undefined],
        ['error', valores.error || undefined],
        ['required', valores.required, false],
        ['disabled', valores.disabled, false],
        ['defaultValue', 'pix'],
        ['onValueChange', expr('setPagamento')],
      ],
      PAGAMENTOS.map((opcao) =>
        gerarJsx('Radio', [
          ['label', opcao.label],
          ['value', opcao.value],
          ['disabled', valores.opcaoDesabilitada && opcao.value === 'cartao', false],
        ]),
      ).join('\n'),
    ),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Grupo nomeado', detalhe: `"${valores.label.trim()}", na legend do fieldset.` }
        : { nivel: 'falha', titulo: 'Grupo sem nome', detalhe: 'Sem legend, o leitor de tela anuncia as opções sem dizer a pergunta.' },
    ];

    if (valores.required) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Obrigatório',
        detalhe: 'aria-required no grupo e required nos rádios: o formulário não envia sem escolha.',
      });
    }

    if (valores.error && valores.hint) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Ajuda escondida pelo erro', detalhe: 'Só uma mensagem aparece: com erro, a ajuda sai.' });
    }

    if (valores.disabled) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Grupo desabilitado', detalhe: 'Todas as opções saem da tabulação. Diga perto dele por quê.' });
    }

    return verificacoes;
  },
});

function Pagamento() {
  const [pagamento, setPagamento] = useState('pix');

  return (
    <RadioGroup hint={`Selecionado: ${pagamento}`} label="Forma de pagamento" onValueChange={setPagamento} value={pagamento}>
      {PAGAMENTOS.map((opcao) => (
        <Radio key={opcao.value} label={opcao.label} value={opcao.value} />
      ))}
    </RadioGroup>
  );
}

function Obrigatorio() {
  const [enviado, setEnviado] = useState('');

  return (
    <form
      className="stack"
      onSubmit={(evento) => {
        evento.preventDefault();
        setEnviado(String(new FormData(evento.currentTarget).get('plano')));
      }}
    >
      <RadioGroup label="Plano" name="plano" required>
        <Radio label="Mensal" value="mensal" />
        <Radio label="Anual" value="anual" />
      </RadioGroup>
      <Button type="submit">Assinar</Button>
      {enviado && <p className="note">Enviado: plano={enviado}</p>}
    </form>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <RadioGroup defaultValue="mensal" label="Padrão">
        <Radio label="Mensal" value="mensal" />
        <Radio label="Anual" value="anual" />
      </RadioGroup>
      <RadioGroup hint="Pode mudar depois." label="Com ajuda">
        <Radio label="Mensal" value="mensal" />
        <Radio label="Anual" value="anual" />
      </RadioGroup>
      <RadioGroup error="Escolha uma opção." label="Com erro" required>
        <Radio label="Mensal" value="mensal" />
        <Radio label="Anual" value="anual" />
      </RadioGroup>
      <RadioGroup defaultValue="anual" disabled label="Desabilitado">
        <Radio label="Mensal" value="mensal" />
        <Radio label="Anual" value="anual" />
      </RadioGroup>
      <RadioGroup defaultValue="mensal" label="Uma opção desabilitada">
        <Radio label="Mensal" value="mensal" />
        <Radio disabled label="Anual" value="anual" />
      </RadioGroup>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>; não controlado com <code>defaultValue</code>. O
        grupo marca cada <code>Radio</code> pelo próprio <code>value</code>.
      </dd>
      <dt><code>name</code></dt>
      <dd>
        Sem ele, o grupo gera um nome único e o divide entre as opções, que é o que faz delas um grupo nativo. Com ele, a
        escolha vai ao formulário.
      </dd>
      <dt><code>disabled</code></dt>
      <dd>No grupo, desabilita todas as opções; num <code>Radio</code>, só aquela.</dd>
      <dt><code>required</code></dt>
      <dd>O formulário não envia o grupo vazio, e o rótulo ganha o asterisco.</dd>
      <dt><code>Radio</code> fora do grupo</dt>
      <dd>Lança um erro: o rádio depende do nome e do valor que o grupo distribui.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Grupo controlado',
      descricao: 'O produto guarda a escolha e a mostra na ajuda.',
      Previa: Pagamento,
      codigo:
        '<RadioGroup\n  label="Forma de pagamento"\n  hint={`Selecionado: ${pagamento}`}\n  value={pagamento}\n  onValueChange={setPagamento}\n>\n  <Radio label="Pix" value="pix" />\n  <Radio label="Boleto" value="boleto" />\n  <Radio label="Cartão de crédito" value="cartao" />\n</RadioGroup>',
    },
    {
      titulo: 'Obrigatório no formulário',
      descricao: 'Clique em Assinar sem escolher: o navegador barra o envio. Escolhido, o valor vai pelo name.',
      Previa: Obrigatorio,
      codigo:
        '<form onSubmit={assinar}>\n  <RadioGroup label="Plano" name="plano" required>\n    <Radio label="Mensal" value="mensal" />\n    <Radio label="Anual" value="anual" />\n  </RadioGroup>\n  <Button type="submit">Assinar</Button>\n</form>',
    },
  ],
  faca: {
    Previa: () => (
      <RadioGroup defaultValue="pix" label="Forma de pagamento">
        <Radio label="Pix" value="pix" />
        <Radio label="Boleto" value="boleto" />
      </RadioGroup>
    ),
    texto: 'RadioGroup para a pergunta de um formulário, com legenda, ajuda e erro.',
  },
  evite: {
    Previa: () => (
      <RadioGroup defaultValue="lista" label="Exibir como">
        <Radio label="Lista" value="lista" />
        <Radio label="Cartões" value="cartoes" />
      </RadioGroup>
    ),
    texto: 'Rádios para mudar o que a tela mostra. Poucas opções curtas que trocam a visão, como lista ou cartões, são um SegmentedControl.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Entra no grupo pela opção marcada, ou pela primeira, e sai dele de uma vez.' },
    { teclas: ['↑', '↓', '←', '→'], acao: 'Move para a opção vizinha e a escolhe, pulando as desabilitadas.' },
    { teclas: ['Espaço'], acao: 'Escolhe a opção em foco, se ainda não estiver marcada.' },
  ],
  garantias: [
    {
      garantia: 'Grupo nomeado',
      como: <><code>&lt;fieldset&gt;</code> com <code>role="radiogroup"</code> e o rótulo na <code>&lt;legend&gt;</code>.</>,
      teste: 'RadioGroup.test.tsx',
    },
    { garantia: 'Rádios nativos', como: 'Um nome comum entre as opções: setas e tabulação vêm do navegador.', teste: 'RadioGroup.test.tsx' },
    {
      garantia: 'Ajuda e erro',
      como: <><code>aria-describedby</code> no grupo, somado ao do consumidor; com erro, <code>aria-invalid</code>.</>,
      teste: 'RadioGroup.test.tsx',
    },
    { garantia: 'Obrigatório', como: 'O envio do grupo vazio é barrado e o erro marcado.', teste: 'RadioGroup.test.tsx' },
  ],
  notaDaApi: (
    <>
      No <code>RadioGroup</code>, as demais propriedades vão ao <code>&lt;fieldset&gt;</code>. No <code>Radio</code>, que
      recebe <code>label</code>, <code>value</code> e <code>disabled</code>, vão ao <code>&lt;input&gt;</code>, com o ref.
    </>
  ),
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Pergunta do grupo, na legend. Obrigatório.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'As opções, em Radio.' },
    { nome: 'value', tipo: 'string', descricao: 'Valor escolhido, no modo controlado.' },
    { nome: 'defaultValue', tipo: 'string', descricao: 'Valor inicial, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: string) => void', descricao: 'Avisa a opção escolhida.' },
    { nome: 'name', tipo: 'string', padrao: 'gerado', descricao: 'Nome nativo dos rádios, usado no envio do formulário.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo das opções.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Exige uma escolha no envio.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita todas as opções.' },
  ],
};
