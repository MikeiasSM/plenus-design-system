import { Button, Rating } from '@plenustech/design-system';
import { useState } from 'react';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const NOMES = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Ótimo'];

const playground = definirPlayground({
  inicial: {
    readOnly: false,
    label: 'Como foi o atendimento?',
    value: 4,
    step: '1',
    max: 5,
    size: 'md',
    valueLabels: true,
    showValue: true,
    clearable: true,
    required: false,
    hint: '',
    error: '',
    disabled: false,
    count: 128,
    compact: false,
  },
  controles: [
    { tipo: 'booleano', nome: 'readOnly' },
    { tipo: 'texto', nome: 'label' },
    { tipo: 'numero', nome: 'value', min: 0, max: 10, passo: 0.1 },
    { tipo: 'opcoes', nome: 'step', opcoes: ['1', '0.5'] },
    { tipo: 'numero', nome: 'max', min: 3, max: 10, passo: 1 },
    { tipo: 'opcoes', nome: 'size', opcoes: ['sm', 'md', 'lg'] },
    { tipo: 'booleano', nome: 'valueLabels' },
    { tipo: 'booleano', nome: 'showValue' },
    { tipo: 'booleano', nome: 'clearable' },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'booleano', nome: 'disabled' },
    { tipo: 'numero', nome: 'count', min: 0, max: 100000, passo: 1 },
    { tipo: 'booleano', nome: 'compact' },
  ],
  renderizar: (valores, registrar) => {
    const size = valores.size as 'sm' | 'md' | 'lg';

    if (valores.readOnly) {
      return (
        <Rating
          compact={valores.compact}
          count={valores.count || undefined}
          max={valores.max}
          readOnly
          showValue={valores.showValue}
          size={size}
          value={valores.value || null}
        />
      );
    }

    const step = valores.step === '0.5' ? 0.5 : 1;
    const inicial = valores.value ? Math.round(valores.value / step) * step : null;

    return (
      <Rating
        clearable={valores.clearable}
        defaultValue={inicial}
        disabled={valores.disabled}
        error={valores.error || undefined}
        hint={valores.hint || undefined}
        key={`${inicial}-${step}-${valores.max}`}
        label={valores.label}
        max={valores.max}
        onHover={(nota) => nota !== null && registrar(`onHover(${nota})`)}
        onValueChange={(nota) => registrar(`onValueChange(${nota})`)}
        required={valores.required}
        showValue={valores.showValue}
        size={size}
        step={step}
        valueLabels={valores.valueLabels && valores.max === 5 ? NOMES : undefined}
      />
    );
  },
  codigo: (valores) =>
    valores.readOnly
      ? gerarJsx('Rating', [
          ['readOnly', true],
          ['value', valores.value || null],
          ['max', valores.max, 5],
          ['count', valores.count || undefined],
          ['compact', valores.compact, false],
          ['size', valores.size, 'md'],
          ['showValue', valores.showValue, true],
        ])
      : gerarJsx('Rating', [
          ['label', valores.label],
          ['value', expr('nota')],
          ['onValueChange', expr('setNota')],
          ['max', valores.max, 5],
          ['step', valores.step === '0.5' ? 0.5 : undefined],
          ['valueLabels', valores.valueLabels && valores.max === 5 ? expr("['Péssimo', 'Ruim', 'Regular', 'Bom', 'Ótimo']") : undefined],
          ['size', valores.size, 'md'],
          ['showValue', valores.showValue, true],
          ['clearable', valores.clearable, false],
          ['required', valores.required, false],
          ['hint', valores.hint || undefined],
          ['error', valores.error || undefined],
          ['disabled', valores.disabled, false],
          ['name', 'nota'],
        ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [];

    if (valores.readOnly) {
      verificacoes.push({ nivel: 'ok', titulo: 'Nota no nome', detalhe: 'A exibição é uma imagem nomeada: "4 de 5 estrelas, 128 avaliações".' });
      if (!valores.value) {
        verificacoes.push({ nivel: 'ok', titulo: 'Sem avaliações em texto', detalhe: 'Sem nota, o texto diz "Sem avaliações", sem estrelas vazias que pareçam nota zero.' });
      }
      return verificacoes;
    }

    verificacoes.push(
      valores.label
        ? { nivel: 'ok', titulo: 'Grupo nomeado', detalhe: `O grupo de rádio se chama "${valores.label}".` }
        : { nivel: 'falha', titulo: 'Grupo sem nome', detalhe: 'Sem label, aria-label ou aria-labelledby, o leitor de tela não diz o que se avalia.' },
    );

    if (valores.step === '0.5') {
      verificacoes.push({ nivel: 'atencao', titulo: 'Dobro de paradas', detalhe: `Com meia estrela, as setas passam por ${valores.max * 2} notas.` });
    }

    if (!valores.showValue) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Sem o valor escrito', detalhe: 'Sem showValue, a nota fica só no desenho das estrelas.' });
    }

    return verificacoes;
  },
});

function AvaliacaoObrigatoria() {
  const [nota, setNota] = useState<number | null>(null);
  const [erro, setErro] = useState('');

  return (
    <form
      className="stack"
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        setErro(nota === null ? 'Escolha uma nota de 1 a 5.' : '');
      }}
    >
      <Rating
        clearable
        error={erro || undefined}
        label="Como foi o atendimento?"
        onValueChange={(proxima) => {
          setNota(proxima);
          setErro('');
        }}
        required
        size="lg"
        value={nota}
        valueLabels={NOMES}
      />
      <Button type="submit">Enviar avaliação</Button>
    </form>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Avaliação obrigatória',
      descricao: 'Entrada com o nome de cada nota e "Limpar nota". Enviar sem nota mostra o erro no próprio grupo.',
      Previa: AvaliacaoObrigatoria,
      codigo:
        '<Rating\n  label="Como foi o atendimento?"\n  value={nota}\n  onValueChange={setNota}\n  valueLabels={[\'Péssimo\', \'Ruim\', \'Regular\', \'Bom\', \'Ótimo\']}\n  size="lg"\n  clearable\n  required\n  error={erro}\n/>',
    },
    {
      titulo: 'Meia estrela',
      descricao: 'Com step={0.5}, cada estrela tem duas metades, cada uma um rádio: a do início dá a meia nota.',
      Previa: () => <Rating defaultValue={3.5} label="Nota do curso" step={0.5} />,
      codigo: '<Rating label="Nota do curso" step={0.5} value={nota} onValueChange={setNota} />',
    },
    {
      titulo: 'Média com contagem',
      descricao: 'Exibição: o desenho arredonda à meia estrela e o texto mostra a casa decimal.',
      Previa: () => <Rating count={2347} readOnly value={4.6} />,
      codigo: '<Rating readOnly value={4.6} count={2347} />',
    },
    {
      titulo: 'Compacto em tabela',
      descricao: 'Uma estrela e a nota, para uma coluna. Sem nota, o texto diz "Sem avaliações".',
      Previa: () => (
        <div className="stack">
          <Rating compact count={312} readOnly size="sm" value={4.7} />
          <Rating compact readOnly size="sm" value={null} />
        </div>
      ),
      codigo: '<Rating readOnly compact size="sm" value={4.7} count={312} />\n<Rating readOnly compact size="sm" value={null} />',
    },
  ],
  faca: {
    Previa: () => <Rating count={128} readOnly value={4.5} />,
    texto: 'Rating para uma nota numa escala curta de estrelas, em que mais é melhor: a média de um item, a avaliação de um atendimento.',
    codigo: '<Rating readOnly value={4.5} count={128} />',
  },
  evite: {
    Previa: () => <Rating label="Você concorda?" max={5} />,
    texto: 'Escala com rótulos, como "concordo" a "discordo", ou nota de 0 a 10: RadioGroup ou SegmentedControl, com os rótulos à vista.',
    codigo: '<Rating label="Você concorda?" />',
  },
  teclado: [
    { teclas: ['Tab'], acao: 'Entra no grupo pela estrela marcada, ou pela primeira, e sai para "Limpar nota", quando há.' },
    { teclas: ['←', '→', '↑', '↓'], acao: 'Trocam a nota, com a volta do último para o primeiro, seguindo a direção do texto. Com step={0.5}, andam meia estrela.' },
    { teclas: ['Espaço'], acao: 'Marca a estrela em foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Em "Limpar nota", tira a nota e devolve o foco ao grupo.' },
  ],
  garantias: [
    { garantia: 'Grupo de rádio nativo', como: 'fieldset com legend e um rádio por estrela, ou por meia estrela, com o nome da nota: "4 estrelas, Bom".', teste: 'Rating.test.tsx' },
    { garantia: 'Nota da exibição no nome', como: 'role="img" com "4,5 de 5 estrelas, 128 avaliações"; sem nota, "Sem avaliações" em texto.', teste: 'Rating.test.tsx' },
    { garantia: 'Contraste da estrela', como: 'Contorno da cheia em --pl-rating-stroke e da vazia em --pl-control-border, os dois a 3:1, medidos por npm run check:contraste.', teste: 'contraste-tokens.mjs' },
    { garantia: 'Formulário', como: 'O valor vai no FormData pelos rádios; o reset do formulário volta ao defaultValue.', teste: 'Rating.test.tsx' },
    { garantia: 'Alvo de toque', como: 'Na entrada, cada estrela tem alvo de 24, 28 ou 36px, também no sm.', teste: 'Rating.module.css' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas do elemento de fora (fieldset na entrada, span na exibição), exceto children, e o ref.',
  api: [
    { nome: 'readOnly', tipo: 'boolean', padrao: 'false', descricao: 'Exibição de uma nota, como imagem nomeada. Sem ele, a entrada num formulário.' },
    { nome: 'value', tipo: 'number | null', descricao: 'A nota. Na entrada, múltipla de step; na exibição, qualquer fração. null é sem nota.' },
    { nome: 'max', tipo: 'number', padrao: '5', descricao: 'Quantidade de estrelas, de 3 a 10.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Estrela de 16, 24 ou 32px; na entrada, alvo de 24, 28 ou 36px.' },
    { nome: 'showValue', tipo: 'boolean', padrao: 'true', descricao: 'O valor escrito ao lado: "4 de 5 · Bom" na entrada, "4,5" na exibição.' },
    { nome: 'icon', tipo: 'ReactNode', descricao: 'Ícone em currentColor no lugar da estrela: cheio no traço da estrela, vazio na borda de controle.' },
    { nome: 'label', tipo: 'string', descricao: 'Entrada. Legenda do grupo e nome acessível.' },
    { nome: 'defaultValue', tipo: 'number | null', padrao: 'null', descricao: 'Entrada. Nota inicial, não controlada; o reset do formulário volta a ela.' },
    { nome: 'onValueChange', tipo: '(value: number | null) => void', descricao: 'Entrada. A nova nota; null ao limpar.' },
    { nome: 'onHover', tipo: '(value: number | null) => void', descricao: 'Entrada. A nota sob o ponteiro que paira, ou null ao sair.' },
    { nome: 'step', tipo: '1 | 0.5', padrao: '1', descricao: 'Entrada. Com 0.5, meia estrela, com dois rádios por estrela.' },
    { nome: 'valueLabels', tipo: 'readonly string[]', descricao: 'Entrada. Um nome por nota inteira, lido em cada rádio e escrito ao lado.' },
    { nome: 'clearable', tipo: 'boolean', padrao: 'false', descricao: 'Entrada. O botão "Limpar nota" enquanto há nota.' },
    { nome: 'hint, error, required, disabled, name', tipo: 'como no RadioGroup', descricao: 'Entrada. Ajuda e erro ligados ao grupo; name nos rádios nativos.' },
    { nome: 'count', tipo: 'number', descricao: 'Exibição. Quantas avaliações formam a nota: "(128)".' },
    { nome: 'compact', tipo: 'boolean', padrao: 'false', descricao: 'Exibição. Uma estrela e o número.' },
    { nome: 'labels', tipo: 'Partial<RatingLabels>', descricao: 'Troca "Limpar nota", "Sem nota", "Sem avaliações" e as frases dos nomes.' },
  ],
};
