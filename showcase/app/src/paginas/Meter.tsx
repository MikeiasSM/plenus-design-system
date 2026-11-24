import { Meter, Progress } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const IDEAIS = ['abaixo', 'acima', 'no meio'] as const;
type Ideal = (typeof IDEAIS)[number];

const GB = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** O optimum fora de faixa deixa claro de que lado esta o bom, sem depender do valor de low e high. */
function optimumDe(ideal: Ideal, min: number, max: number, low: number, high: number) {
  return ideal === 'abaixo' ? min : ideal === 'acima' ? max : (low + high) / 2;
}

const playground = definirPlayground({
  inicial: {
    label: 'Armazenamento',
    value: 72,
    min: 0,
    max: 100,
    faixas: true,
    low: 50,
    high: 80,
    ideal: 'abaixo',
    valueLabel: '',
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'numero', nome: 'value', passo: 1 },
    { tipo: 'numero', nome: 'min' },
    { tipo: 'numero', nome: 'max' },
    { tipo: 'booleano', nome: 'faixas' },
    { tipo: 'numero', nome: 'low' },
    { tipo: 'numero', nome: 'high' },
    { tipo: 'opcoes', nome: 'ideal', opcoes: IDEAIS },
    { tipo: 'texto', nome: 'valueLabel' },
  ],
  renderizar: (valores) => (
    <div style={{ width: '100%' }}>
      <Meter
        label={valores.label}
        value={valores.value}
        min={valores.min}
        max={valores.max}
        low={valores.faixas ? valores.low : undefined}
        high={valores.faixas ? valores.high : undefined}
        optimum={
          valores.faixas
            ? optimumDe(valores.ideal as Ideal, valores.min, valores.max, valores.low, valores.high)
            : undefined
        }
        valueLabel={valores.valueLabel || undefined}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Meter', [
      ['label', valores.label],
      ['value', valores.value],
      ['min', valores.min, 0],
      ['max', valores.max, 100],
      ['low', valores.faixas ? valores.low : undefined],
      ['high', valores.faixas ? valores.high : undefined],
      [
        'optimum',
        valores.faixas
          ? optimumDe(valores.ideal as Ideal, valores.min, valores.max, valores.low, valores.high)
          : undefined,
      ],
      ['valueLabel', valores.valueLabel || undefined],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", vindo de label, escrito acima do trilho.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'label é obrigatório: dá nome ao meter.' },
      {
        nivel: 'ok',
        titulo: 'Valor escrito',
        detalhe: valores.valueLabel
          ? `"${valores.valueLabel}", vindo de valueLabel, abaixo do trilho e no aria-valuetext.`
          : 'Sem valueLabel, a porcentagem do intervalo, abaixo do trilho e no aria-valuetext.',
      },
    ];

    if (valores.max <= valores.min) {
      verificacoes.push({ nivel: 'falha', titulo: 'Faixa vazia', detalhe: 'max precisa ser maior que min.' });
    } else if (valores.value < valores.min || valores.value > valores.max) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Valor fora da faixa',
        detalhe: `O componente limita a ${Math.min(Math.max(valores.value, valores.min), valores.max)}. Mande o valor já dentro de min a max.`,
      });
    }

    if (valores.faixas && valores.low > valores.high) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'low acima de high',
        detalhe: 'Como no <meter> do HTML, high sobe até low e a faixa do meio some.',
      });
    }

    if (!valores.faixas) {
      verificacoes.push({ nivel: 'ok', titulo: 'Cor da marca', detalhe: 'Sem low, high nem optimum, a medida não diz se o valor é bom ou ruim.' });
    }

    return verificacoes;
  },
});

function Variantes() {
  return (
    <div>
      <div className="subsection">
        <h3>Ideal embaixo · armazenamento</h3>
        <div className="demo-grid">
          <Meter label="Sucesso" value={3} max={10} low={5} high={8} optimum={0} valueLabel="3 de 10 GB" />
          <Meter label="Atenção" value={6.5} max={10} low={5} high={8} optimum={0} valueLabel="6,5 de 10 GB" />
          <Meter label="Perigo" value={9.4} max={10} low={5} high={8} optimum={0} valueLabel="9,4 de 10 GB" />
        </div>
        <VerCodigo
          codigo={`<Meter label="Sucesso" value={3} max={10} low={5} high={8} optimum={0} valueLabel="3 de 10 GB" />
<Meter label="Atenção" value={6.5} max={10} low={5} high={8} optimum={0} valueLabel="6,5 de 10 GB" />
<Meter label="Perigo" value={9.4} max={10} low={5} high={8} optimum={0} valueLabel="9,4 de 10 GB" />`}
        />
      </div>
      <div className="subsection">
        <h3>Sem faixas · cor da marca</h3>
        <div className="demo-grid">
          <Meter label="Ocupação da sala" value={64} />
        </div>
        <VerCodigo codigo={'<Meter label="Ocupação da sala" value={64} />'} />
      </div>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Tom pela faixa</dt>
      <dd>
        <code>low</code> e <code>high</code> dividem a escala em três faixas, e <code>optimum</code> diz qual é a boa,
        como no <code>&lt;meter&gt;</code> do HTML. Na faixa do ideal, sucesso; na vizinha, atenção; na oposta, perigo.
        Com o ideal na faixa do meio, os dois lados são só atenção.
      </dd>
      <dt>Sem faixas</dt>
      <dd>
        Sem <code>low</code>, <code>high</code> nem <code>optimum</code>, o preenchimento fica na cor da marca.
      </dd>
      <dt><code>valueLabel</code></dt>
      <dd>
        O texto do valor, em string ou função do valor. Sem ele, a porcentagem do intervalo. Sai sempre abaixo do
        trilho e no <code>aria-valuetext</code>: o tom nunca é o único sinal.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Armazenamento',
      descricao: 'O ideal é pouco uso: acima de 8 GB, perigo. O texto do produto vem de valueLabel.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Meter label="Armazenamento" value={7.2} max={10} low={5} high={8} optimum={0} valueLabel="7,2 de 10 GB" />
        </div>
      ),
      codigo: '<Meter\n  label="Armazenamento"\n  value={7.2}\n  max={10}\n  low={5}\n  high={8}\n  optimum={0}\n  valueLabel="7,2 de 10 GB"\n/>',
    },
    {
      titulo: 'Nota em outra escala',
      descricao: 'O ideal é a nota alta; valueLabel em função escreve o valor como o produto quer.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Meter
            label="Nota do atendimento"
            value={4.6}
            max={5}
            low={3}
            high={4.5}
            optimum={5}
            valueLabel={(nota) => `${GB.format(nota)} de 5`}
          />
        </div>
      ),
      codigo: gerarJsx('Meter', [
        ['label', 'Nota do atendimento'],
        ['value', 4.6],
        ['max', 5],
        ['low', 3],
        ['high', 4.5],
        ['optimum', 5],
        ['valueLabel', expr('(nota) => `${formatNumber(nota)} de 5`')],
      ]),
    },
    {
      titulo: 'Medida sem julgamento',
      descricao: 'Sem faixas, a cor da marca e a porcentagem do intervalo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Meter label="Ocupação da sala" value={18} max={30} />
        </div>
      ),
      codigo: '<Meter label="Ocupação da sala" value={18} max={30} />',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Meter label="Armazenamento" value={7.2} max={10} high={8} optimum={0} valueLabel="7,2 de 10 GB" />
      </div>
    ),
    texto: 'Meter para uma medida parada numa faixa conhecida, como o espaço ocupado.',
    codigo: '<Meter label="Armazenamento" value={7.2} max={10} high={8} optimum={0} valueLabel="7,2 de 10 GB" />',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Progress label="Armazenamento" max={10} showValue value={7.2} />
      </div>
    ),
    texto: 'Progress para o espaço ocupado: o leitor de tela anuncia uma operação em andamento, e nada está acontecendo.',
    codigo: '<Progress label="Armazenamento" value={7.2} max={10} showValue />',
  },
  Variantes,
  Modos,
  garantias: [
    {
      garantia: 'Semântica de medida',
      como: <><code>role=&quot;meter&quot;</code> com <code>aria-valuenow</code>, <code>aria-valuemin</code>, <code>aria-valuemax</code> e <code>aria-valuetext</code>.</>,
      teste: 'Meter.test.tsx',
    },
    { garantia: 'Nome acessível', como: <><code>label</code> obrigatório, escrito acima do trilho e ligado por <code>aria-labelledby</code>.</>, teste: 'Meter.test.tsx' },
    { garantia: 'Valor escrito', como: <>O texto do valor sai abaixo do trilho e no <code>aria-valuetext</code>; o tom nunca é o único sinal.</>, teste: 'Meter.test.tsx' },
    { garantia: 'Tom pela faixa', como: <>A regra do <code>&lt;meter&gt;</code> do HTML, com <code>low</code>, <code>high</code> e <code>optimum</code>.</>, teste: 'Meter.test.tsx' },
    { garantia: 'Contorno do trilho', como: <>A 3:1 contra a superfície, para o fim da faixa aparecer; em cores forçadas, borda e preenchimento na cor do texto.</>, teste: 'check:contraste' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref, levados ao próprio meter.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Nome da medida, acima do trilho.' },
    { nome: 'value', tipo: 'number', descricao: 'Obrigatório. Valor atual, limitado à faixa de min a max.' },
    { nome: 'min', tipo: 'number', padrao: '0', descricao: 'Início da escala.' },
    { nome: 'max', tipo: 'number', padrao: '100', descricao: 'Fim da escala.' },
    { nome: 'low', tipo: 'number', descricao: 'Fim da faixa baixa.' },
    { nome: 'high', tipo: 'number', descricao: 'Início da faixa alta.' },
    { nome: 'optimum', tipo: 'number', descricao: 'O ponto ideal; sem ele, com low ou high, o meio da escala.' },
    { nome: 'valueLabel', tipo: 'string | ((value: number) => string)', descricao: 'Texto do valor. Sem ele, a porcentagem do intervalo.' },
    { nome: 'locale', tipo: 'string', padrao: "'pt-BR'", descricao: 'Localidade da porcentagem padrão.' },
  ],
};
