import { useState } from 'react';
import { InputCurrency, type InputTextSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const MOEDAS = ['BRL', 'USD', 'EUR'] as const;
const TAMANHOS = ['sm', 'md'] as const;

const playground = definirPlayground({
  inicial: { label: 'Valor', currency: 'BRL', decimalScale: 2, hint: '', error: '', size: 'md', required: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'currency', opcoes: MOEDAS },
    { tipo: 'numero', nome: 'decimalScale', min: 0, max: 4 },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <InputCurrency
        currency={valores.currency}
        decimalScale={valores.decimalScale}
        disabled={valores.disabled}
        error={valores.error || undefined}
        hint={valores.hint || undefined}
        key={valores.decimalScale}
        label={valores.label || undefined}
        onBlur={() => registrar('onBlur: aplica a máscara')}
        onFocus={() => registrar('onFocus: tira a máscara')}
        onValueChange={(valor) => registrar(`onValueChange: "${valor}"`)}
        required={valores.required}
        size={valores.size as InputTextSize}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('InputCurrency', [
      ['label', valores.label || undefined],
      ['currency', valores.currency, 'BRL'],
      ['decimalScale', valores.decimalScale, 2],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['size', valores.size, 'md'],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['onValueChange', expr('setValor')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", ligado ao campo pelo rótulo.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, nomeie o campo por aria-label ou aria-labelledby.' },
      { nivel: 'ok', titulo: 'Teclado decimal', detalhe: 'inputmode="decimal" no celular.' },
      {
        nivel: 'atencao',
        titulo: 'Valor em texto pt-BR',
        detalhe: 'onValueChange entrega "1234,5", sem símbolo nem milhar. Converta antes de calcular.',
      },
    ];

    if (valores.currency !== 'BRL') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Separadores brasileiros',
        detalhe: 'A máscara usa o símbolo da moeda em pt-BR, com vírgula decimal e ponto de milhar: US$ 1.234,50.',
      });
    }

    return verificacoes;
  },
});

function ValorParaOProduto() {
  const [valor, setValor] = useState('1500');
  const numero = valor === '' ? null : Number(valor.replace(',', '.'));

  return (
    <div className="stack" style={{ width: '100%' }}>
      <InputCurrency label="Limite de crédito" onValueChange={setValor} value={valor} />
      <p className="note">
        onValueChange: <code>&quot;{valor}&quot;</code> · convertido: <code>{String(numero)}</code>
      </p>
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>No foco</dt>
        <dd>A máscara sai e fica o valor bruto, como <code>165789,50</code>, para editar sem tropeçar no símbolo.</dd>
        <dt>Ao sair</dt>
        <dd>
          Aplica o símbolo, o ponto de milhar e completa as casas: <code>165789,5</code> vira <code>R$ 165.789,50</code>.
        </dd>
        <dt>O ponto digitado</dt>
        <dd>
          Com três dígitos depois, é milhar: <code>1.234,56</code>. Com menos, vale como decimal: <code>12.50</code> vira{' '}
          <code>R$ 12,50</code>.
        </dd>
        <dt>Valor de fora</dt>
        <dd>
          Texto ou número. Número é lido na convenção brasileira e arredondado nas casas pedidas: <code>1234.5</code> aparece
          como <code>R$ 1.234,50</code>. Uma mudança externa aparece mesmo com o campo em foco.
        </dd>
        <dt>Sem <code>onChange</code></dt>
        <dd>O valor sai só por <code>onValueChange</code>, já normalizado: o evento cru divergia do valor exibido.</dd>
      </dl>
      <div className="subsection">
        <h3>Estados</h3>
        <div className="demo-grid">
          <InputCurrency defaultValue="165789" label="Valor inteiro" />
          <InputCurrency hint="A vírgula determina os centavos." label="Com ajuda" placeholder="0,00" />
          <InputCurrency error="Informe o valor do pedido." label="Com erro" />
          <InputCurrency defaultValue="2500,00" disabled label="Desabilitado" />
        </div>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Máscara ao sair',
      descricao: 'Clique no campo: a máscara sai para a edição e volta ao sair.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputCurrency defaultValue="165789,50" label="Valor do contrato" />
        </div>
      ),
      codigo: '<InputCurrency label="Valor do contrato" defaultValue="165789,50" />',
    },
    {
      titulo: 'Do texto ao número',
      descricao: 'O campo emite texto pt-BR; o produto converte antes de usar.',
      Previa: ValorParaOProduto,
      codigo:
        "const [limite, setLimite] = useState('1500');\nconst numero = limite === '' ? null : Number(limite.replace(',', '.'));\n\n<InputCurrency\n  label=\"Limite de crédito\"\n  value={limite}\n  onValueChange={setLimite}\n/>",
    },
    {
      titulo: 'Outra moeda',
      descricao: 'O símbolo segue a moeda; os separadores continuam os brasileiros.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputCurrency currency="USD" defaultValue={1234.5} label="Valor da fatura" />
        </div>
      ),
      codigo: '<InputCurrency\n  label="Valor da fatura"\n  currency="USD"\n  defaultValue={1234.5}\n/>',
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Edição sem máscara', como: 'No foco o campo mostra o valor bruto; a máscara volta ao sair.', teste: 'InputCurrency.test.tsx' },
    { garantia: 'Valor coerente', como: 'O valor emitido é o normalizado, sem símbolo nem milhar.', teste: 'InputCurrency.test.tsx' },
    { garantia: 'Mudança externa', como: 'Um valor controlado novo aparece mesmo durante o foco.', teste: 'InputCurrency.test.tsx' },
    { garantia: 'Rótulo, ajuda e erro', como: 'Os do InputText, com a mesma fiação acessível.', teste: 'InputText.test.tsx' },
  ],
  notaDaApi: 'Além destas, as do InputText, exceto type, onChange e showCharacterCount, e as nativas de <input> e o ref.',
  api: [
    { nome: 'currency', tipo: 'string', padrao: "'BRL'", descricao: 'Código ISO da moeda, que dá o símbolo da máscara.' },
    { nome: 'decimalScale', tipo: 'number', padrao: '2', descricao: 'Casas decimais, completadas ao sair.' },
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
