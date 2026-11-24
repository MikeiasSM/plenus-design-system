import { useState } from 'react';
import { ColorField, InputText, type InputTextSize } from '@plenustech/design-system';
import { gerarJsx, expr } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const SUGESTOES = [
  { color: '#E85D1F', label: 'Laranja do logo' },
  { color: '#2E2A26', label: 'Grafite do logo' },
  { color: '#F2C14E', label: 'Amarelo do logo' },
  { color: '#3A7D6B', label: 'Verde do logo' },
];

const TAMANHOS = ['sm', 'md', 'lg'] as const;

const playground = definirPlayground({
  inicial: { label: 'Cor da marca', size: 'md', sugestoes: 3, hint: '', disabled: false, readOnly: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'numero', nome: 'sugestoes', min: 0, max: 4 },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'booleano', nome: 'disabled' },
    { tipo: 'booleano', nome: 'readOnly' },
  ],
  renderizar: (valores, registrar) => (
    <ColorField
      defaultValue="#E85D1F"
      disabled={valores.disabled}
      hint={valores.hint || undefined}
      label={valores.label}
      onValueChange={(valor) => registrar('onValueChange: ' + String(valor))}
      readOnly={valores.readOnly}
      size={valores.size as InputTextSize}
      suggestions={valores.sugestoes > 0 ? SUGESTOES.slice(0, valores.sugestoes) : undefined}
    />
  ),
  codigo: (valores) => {
    const itens = SUGESTOES.slice(0, valores.sugestoes)
      .map((cor) => `  { color: '${cor.color}', label: '${cor.label}' },`)
      .join('\n');
    const jsx = gerarJsx('ColorField', [
      ['label', valores.label],
      ['suggestions', valores.sugestoes > 0 ? expr('sugestoes') : undefined],
      ['hint', valores.hint || undefined],
      ['size', valores.size, 'md'],
      ['disabled', valores.disabled, false],
      ['readOnly', valores.readOnly, false],
      ['value', expr('cor')],
      ['onValueChange', expr('setCor')],
    ]);

    return valores.sugestoes > 0 ? `const sugestoes = [\n${itens}\n];\n\n${jsx}` : jsx;
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Campo nomeado', detalhe: `"${valores.label.trim()}", no rótulo visível do campo.` }
        : { nivel: 'falha', titulo: 'Campo sem nome', detalhe: 'O label é obrigatório: é o nome do campo e entra no nome do grupo das amostras.' },
      { nivel: 'ok', titulo: 'Formato à vista', detalhe: 'O placeholder #RRGGBB mostra o formato antes do erro (WCAG 3.3.2).' },
      { nivel: 'ok', titulo: 'Amostra decorativa', detalhe: 'A amostra dentro do campo é aria-hidden: quem lê ouve o código.' },
    ];

    if (valores.sugestoes > 0) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Grupo das amostras',
        detalhe: `"Cores sugeridas para ${valores.label.trim()}": o nome cita o campo, e dois campos na mesma tela não se confundem.`,
      });
    }

    if (valores.disabled || valores.readOnly) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: valores.disabled ? 'Desabilitado' : 'Só de leitura',
        detalhe: 'O conta-gotas e as amostras também ficam travados. Diga perto do campo por quê.',
      });
    }

    return verificacoes;
  },
});

function CorDaMarca() {
  const [cor, setCor] = useState<string | null>('#E85D1F');

  return (
    <div className="stack">
      <ColorField label="Cor da marca" onValueChange={setCor} suggestions={SUGESTOES} value={cor} />
      <p className="note">{cor ? `Valor no formulário: ${cor}.` : 'Sem cor válida: o valor é null.'}</p>
    </div>
  );
}

const CODIGO_DAS_VARIANTES = `<ColorField label="Cor" size="sm" defaultValue="#E85D1F" suggestions={sugestoes} />
<ColorField label="Cor" size="md" defaultValue="#E85D1F" suggestions={sugestoes} />
<ColorField label="Cor" size="lg" defaultValue="#E85D1F" suggestions={sugestoes} />

<ColorField label="Cor" defaultValue="#E85D1F" readOnly suggestions={sugestoes} />
<ColorField label="Cor" defaultValue="#E85D1F" disabled suggestions={sugestoes} />`;

function Variantes() {
  return (
    <>
      <div className="matrix">
        <div className="matrix-row matrix-head">
          <span>size</span>
          <span>com sugestões</span>
          <span>readOnly</span>
          <span>disabled</span>
        </div>
        {TAMANHOS.map((tamanho) => (
          <div className="matrix-row" key={tamanho}>
            <code>{tamanho}</code>
            <span>
              <ColorField defaultValue="#E85D1F" label="Cor" size={tamanho} suggestions={SUGESTOES.slice(0, 3)} />
            </span>
            <span>
              <ColorField defaultValue="#E85D1F" label="Cor" readOnly size={tamanho} suggestions={SUGESTOES.slice(0, 3)} />
            </span>
            <span>
              <ColorField defaultValue="#E85D1F" disabled label="Cor" size={tamanho} suggestions={SUGESTOES.slice(0, 3)} />
            </span>
          </div>
        ))}
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>value</code> ou <code>defaultValue</code></dt>
      <dd>
        Controlado com <code>value</code> e <code>onValueChange</code>; não controlado com <code>defaultValue</code>. O
        valor é <code>#RRGGBB</code> em maiúsculas, ou <code>null</code> com o campo vazio ou com um código que não vale.
        No modo controlado, o texto volta ao <code>value</code> sempre que o produto redesenha o campo.
      </dd>
      <dt>Código curto</dt>
      <dd>
        <code>e85</code> vale só quando a pessoa sai do campo, já expandido em <code>#EE8855</code>: em digitação, ele é o
        começo de um código de seis.
      </dd>
      <dt><code>suggestions</code></dt>
      <dd>
        Amostras abaixo do campo, como um <code>ColorPicker</code>. A cor repetida fica só na primeira, e a que não é
        hexadecimal fica de fora, com aviso em desenvolvimento. Elas só preenchem o campo: no formulário, vai o texto.
      </dd>
      <dt>Conta-gotas</dt>
      <dd>
        Usa o <code>EyeDropper</code> do navegador, que hoje só existe no Chrome e no Edge de computador. Onde ele não
        existe, o botão não aparece.
      </dd>
      <dt><code>readOnly</code> e <code>disabled</code></dt>
      <dd>Travam o texto, as amostras e o conta-gotas.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Cor da marca',
      descricao: 'As cores tiradas do logo como sugestão, e o código livre para o resto.',
      Previa: CorDaMarca,
      codigo:
        "<ColorField\n  label=\"Cor da marca\"\n  suggestions={[\n    { color: '#E85D1F', label: 'Laranja do logo' },\n    { color: '#2E2A26', label: 'Grafite do logo' },\n  ]}\n  value={cor}\n  onValueChange={setCor}\n/>",
    },
    {
      titulo: 'Só o código',
      descricao: 'Sem sugestões, o campo é o código e, onde houver, o conta-gotas.',
      Previa: () => <ColorField defaultValue="#3A7D6B" label="Cor do destaque" />,
      codigo: '<ColorField label="Cor do destaque" defaultValue="#3A7D6B" />',
    },
  ],
  faca: {
    Previa: () => <ColorField defaultValue="#E85D1F" label="Cor da marca" suggestions={SUGESTOES.slice(0, 3)} />,
    texto: 'Cor livre, com as cores que o produto já conhece como atalho.',
    codigo: '<ColorField label="Cor da marca" suggestions={coresDoLogo} />',
  },
  evite: {
    Previa: () => <InputText defaultValue="#E85D1F" label="Cor da marca" />,
    texto: 'Um campo de texto comum: não mostra a cor, não normaliza o código e não avisa o formato. Para uma paleta curta e fechada, use o ColorPicker.',
    codigo: '<InputText label="Cor da marca" />',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Passa pelo campo, pelo conta-gotas e entra no grupo das amostras.' },
    { teclas: ['←', '→', '↑', '↓'], acao: 'No grupo, move para a amostra vizinha e a escolhe.' },
    { teclas: ['Esc'], acao: 'Com o conta-gotas aberto, cancela sem mudar a cor.' },
  ],
  garantias: [
    { garantia: 'Valor atual', como: <>O código que deixa de valer avisa <code>null</code>.</>, teste: 'ColorField.test.tsx' },
    { garantia: 'Modo controlado', como: <>Um <code>null</code> do produto limpa também o rascunho inválido.</>, teste: 'ColorField.test.tsx' },
    { garantia: 'Travado', como: <><code>readOnly</code> e <code>disabled</code> travam as amostras e o conta-gotas.</>, teste: 'ColorField.test.tsx' },
    { garantia: 'Foco estável', como: 'O conta-gotas aparece sem recriar o campo: o autoFocus fica.', teste: 'ColorField.test.tsx' },
    { garantia: 'Formulário', como: <>Só o texto vai ao envio, pelo <code>name</code>; as amostras ficam fora.</>, teste: 'ColorField.test.tsx' },
    { garantia: 'Colagem', como: 'O código colado com espaços entra inteiro e normalizado.', teste: 'ColorField.test.tsx' },
  ],
  notaDaApi: 'As demais propriedades do InputText, como name, hint, error, size e o ref, vão ao campo.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Nome do campo. Obrigatório.' },
    { nome: 'value', tipo: 'string | null', descricao: 'A cor, no modo controlado; null é o campo vazio.' },
    { nome: 'defaultValue', tipo: 'string | null', descricao: 'Cor inicial, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: string | null) => void', descricao: 'A cor em #RRGGBB quando o código vale; null quando não vale ou com o campo vazio.' },
    { nome: 'suggestions', tipo: '{ color: string; label: string }[]', descricao: 'Amostras do produto, abaixo do campo.' },
    { nome: 'suggestionsLabel', tipo: 'string', padrao: "'Cores sugeridas para <label>'", descricao: 'Nome do grupo das amostras.' },
    { nome: 'eyedropperLabel', tipo: 'string', padrao: "'Pegar uma cor da tela'", descricao: 'Nome do botão do conta-gotas.' },
    { nome: 'invalidMessage', tipo: 'string', padrao: "'Use o código hexadecimal, como #E85D1F.'", descricao: 'Erro de formato, depois da saída do campo.' },
    { nome: 'placeholder', tipo: 'string', padrao: "'#RRGGBB'", descricao: 'O formato esperado, à vista no campo vazio.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Tamanho do campo, das amostras e do conta-gotas.' },
  ],
};
