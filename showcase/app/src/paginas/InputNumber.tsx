import { useState } from 'react';
import { InputNumber, type InputTextSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md'] as const;

const playground = definirPlayground({
  inicial: { label: 'Quantidade', decimalScale: 0, hint: '', error: '', size: 'md', required: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'numero', nome: 'decimalScale', min: 0, max: 4 },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <InputNumber
        decimalScale={valores.decimalScale}
        disabled={valores.disabled}
        error={valores.error || undefined}
        hint={valores.hint || undefined}
        key={valores.decimalScale}
        label={valores.label || undefined}
        onBlur={() => registrar('onBlur')}
        onValueChange={(valor) => registrar(`onValueChange: "${valor}"`)}
        required={valores.required}
        size={valores.size as InputTextSize}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('InputNumber', [
      ['label', valores.label || undefined],
      ['decimalScale', valores.decimalScale, 0],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['size', valores.size, 'md'],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['onValueChange', expr('setQuantidade')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", ligado ao campo pelo rótulo.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, nomeie o campo por aria-label ou aria-labelledby.' },
      valores.decimalScale > 0
        ? {
            nivel: 'ok',
            titulo: 'Modo decimal',
            detalhe: `inputmode="decimal"; a vírgula separa até ${valores.decimalScale} casa(s), e o excedente é cortado.`,
          }
        : {
            nivel: 'ok',
            titulo: 'Modo inteiro',
            detalhe: 'inputmode="numeric" e pattern "-?[0-9]*"; vírgula e ponto são ignorados.',
          },
      {
        nivel: 'atencao',
        titulo: 'Valor em texto pt-BR',
        detalhe: 'onValueChange entrega "1234,5", sem milhar. Converta antes de calcular.',
      },
    ];

    return verificacoes;
  },
});

function ValorParaOProduto() {
  const [valor, setValor] = useState('1234,5');
  const numero = valor === '' ? null : Number(valor.replace(',', '.'));

  return (
    <div className="stack" style={{ width: '100%' }}>
      <InputNumber decimalScale={2} label="Peso líquido (kg)" onValueChange={setValor} value={valor} />
      <p className="note">
        onValueChange: <code>&quot;{valor}&quot;</code> · convertido: <code>{String(numero)}</code>
      </p>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>decimalScale={'{0}'}</code></dt>
      <dd>Modo inteiro, o padrão: vírgula e ponto não entram, e o teclado do celular é o numérico.</dd>
      <dt><code>decimalScale</code> maior que zero</dt>
      <dd>A vírgula separa os decimais, limitados às casas pedidas; o que passa delas é cortado, não arredondado.</dd>
      <dt>O ponto digitado</dt>
      <dd>
        Separa milhar em pt-BR. Com menos de três dígitos depois, fica na tela como foi digitado e vale como decimal; o
        terceiro dígito, ou a vírgula, decide. Ao sair do campo, o ponto indeciso vira vírgula.
      </dd>
      <dt>Negativo</dt>
      <dd>O sinal de menos à frente é aceito, nos dois modos.</dd>
      <dt>Valor de fora</dt>
      <dd>
        <code>value</code> e <code>defaultValue</code> aceitam texto ou número. Número é lido na convenção brasileira e
        arredondado nas casas pedidas: <code>12.34</code> aparece como <code>12,34</code>.
      </dd>
      <dt>Sem <code>onChange</code></dt>
      <dd>O valor sai só por <code>onValueChange</code>, já normalizado: o evento cru divergia do valor exibido.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Quantidade inteira',
      descricao: 'O padrão: vírgula e ponto não entram.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputNumber defaultValue="12" label="Quantidade" />
        </div>
      ),
      codigo: '<InputNumber label="Quantidade" defaultValue="12" />',
    },
    {
      titulo: 'Percentual com duas casas',
      descricao: 'A vírgula decide os decimais; a terceira casa não entra.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputNumber decimalScale={2} hint="Use vírgula para os decimais." label="Desconto (%)" />
        </div>
      ),
      codigo: '<InputNumber\n  label="Desconto (%)"\n  hint="Use vírgula para os decimais."\n  decimalScale={2}\n/>',
    },
    {
      titulo: 'Do texto ao número',
      descricao: 'O campo emite texto pt-BR, sem separador de milhar; o produto converte antes de usar.',
      Previa: ValorParaOProduto,
      codigo:
        "const [peso, setPeso] = useState('1234,5');\nconst numero = peso === '' ? null : Number(peso.replace(',', '.'));\n\n<InputNumber\n  label=\"Peso líquido (kg)\"\n  decimalScale={2}\n  value={peso}\n  onValueChange={setPeso}\n/>",
    },
  ],
  Modos,
  teclado: [
    { teclas: [',', '.'], acao: 'No modo inteiro, ignorados.' },
    { teclas: ['.'], acao: 'No modo decimal, espera o próximo dígito: vira milhar ou decimal, e decimal ao sair do campo.' },
  ],
  garantias: [
    { garantia: 'Teclado certo no celular', como: <><code>inputmode</code> numeric no modo inteiro, decimal no decimal.</>, teste: 'InputNumber.test.tsx' },
    {
      garantia: 'Validação coerente',
      como: <>No modo inteiro, o <code>pattern</code> aceita o sinal que o campo deixa digitar.</>,
      teste: 'InputNumber.test.tsx',
    },
    { garantia: 'Rótulo, ajuda e erro', como: 'Os do InputText, com a mesma fiação acessível.', teste: 'InputText.test.tsx' },
  ],
  notaDaApi: 'Além destas, as do InputText, exceto type, onChange e showCharacterCount, e as nativas de <input> e o ref.',
  api: [
    { nome: 'decimalScale', tipo: 'number', padrao: '0', descricao: 'Casas decimais. Zero é o modo inteiro.' },
    { nome: 'value', tipo: 'string | number', descricao: 'Valor controlado; número é lido na convenção brasileira.' },
    { nome: 'defaultValue', tipo: 'string | number', padrao: "''", descricao: 'Valor inicial, não controlado.' },
    {
      nome: 'onValueChange',
      tipo: '(value: string) => void',
      descricao: <>O valor normalizado, em texto pt-BR: <code>&quot;1234,5&quot;</code>.</>,
    },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Altura do campo.' },
  ],
};
