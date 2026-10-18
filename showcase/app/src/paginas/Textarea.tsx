import { Textarea, type TextareaSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md'] as const;

const playground = definirPlayground({
  inicial: {
    label: 'Observações',
    placeholder: 'Descreva a ocorrência',
    hint: '',
    error: '',
    rows: 4,
    size: 'md',
    maxLength: 240,
    showCharacterCount: true,
    required: false,
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'placeholder' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'numero', nome: 'rows', min: 1, max: 12 },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'numero', nome: 'maxLength', min: 0, max: 1000 },
    { tipo: 'booleano', nome: 'showCharacterCount' },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <Textarea
        disabled={valores.disabled}
        error={valores.error || undefined}
        hint={valores.hint || undefined}
        label={valores.label || undefined}
        maxLength={valores.maxLength || undefined}
        onBlur={() => registrar('onBlur')}
        onChange={(evento) => registrar(`onChange: ${evento.currentTarget.value.length} caractere(s)`)}
        onFocus={() => registrar('onFocus')}
        placeholder={valores.placeholder || undefined}
        required={valores.required}
        rows={valores.rows}
        showCharacterCount={valores.showCharacterCount}
        size={valores.size as TextareaSize}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Textarea', [
      ['label', valores.label || undefined],
      ['placeholder', valores.placeholder || undefined],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['rows', valores.rows, 4],
      ['size', valores.size, 'md'],
      ['maxLength', valores.maxLength || undefined],
      ['showCharacterCount', valores.showCharacterCount, false],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['onChange', expr('mudar')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", ligado ao campo pelo rótulo.` }
        : {
            nivel: 'falha',
            titulo: 'Sem nome acessível',
            detalhe: valores.placeholder
              ? 'O placeholder não nomeia o campo. Dê um label.'
              : 'Sem label, nomeie o campo por aria-label ou aria-labelledby.',
          },
      {
        nivel: 'atencao',
        titulo: 'Contorno em repouso 1,33:1',
        detalhe: 'Exceção aceita, registrada no PROGRESS. No hover e no foco a borda chega a 3,03:1 e 5,57:1.',
      },
    ];

    if (valores.error.trim()) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Erro anunciado',
        detalhe: 'aria-invalid, descrição do campo e role="alert" quando aparece. Ele substitui a ajuda.',
      });
    }

    if (valores.showCharacterCount && !valores.maxLength) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Contador sem limite', detalhe: 'Sem maxLength, mostra só o total.' });
    }

    return verificacoes;
  },
});

function Variantes() {
  return (
    <div className="demo-grid">
      <Textarea label='size="md"' placeholder="Descreva a ocorrência" />
      <Textarea label='size="sm", rows={2}' placeholder="Nota rápida" rows={2} size="sm" />
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Estados</h3>
        <div className="demo-grid">
          <Textarea hint="Fica visível só para a equipe." label="Com ajuda" />
          <Textarea error="Campo obrigatório." label="Com erro" />
          <Textarea defaultValue="Somente leitura" disabled label="Desabilitado" />
        </div>
        <p className="note">O redimensionamento é só vertical e some quando o campo está desabilitado.</p>
      </div>
      <div className="subsection">
        <h3>Contador de caracteres</h3>
        <p className="note">
          Conta em unidades UTF-16, a mesma medida do maxLength nativo, e acompanha o valor controlado ou não. É a mesma
          contagem do InputText.
        </p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Observações com limite',
      descricao: 'O contador mostra o total contra o limite e entra na descrição do campo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Textarea hint="Aparece no comprovante do cliente." label="Observações do pedido" maxLength={240} showCharacterCount />
        </div>
      ),
      codigo:
        '<Textarea\n  label="Observações do pedido"\n  hint="Aparece no comprovante do cliente."\n  maxLength={240}\n  showCharacterCount\n/>',
    },
    {
      titulo: 'Nota compacta',
      descricao: 'size="sm" com duas linhas, para notas rápidas ao lado de outros campos.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Textarea label="Nota interna" placeholder="Nota rápida" rows={2} size="sm" />
        </div>
      ),
      codigo: '<Textarea label="Nota interna" placeholder="Nota rápida" rows={2} size="sm" />',
    },
  ],
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Rótulo associado', como: <>O <code>label</code> nomeia o <code>&lt;textarea&gt;</code> nativo.</>, teste: 'Textarea.test.tsx' },
    { garantia: 'Erro acessível', como: <>Marca <code>aria-invalid</code> e descreve o campo.</>, teste: 'Textarea.test.tsx' },
    { garantia: 'Erro anunciado', como: <>O erro que aparece depois sai com <code>role=&quot;alert&quot;</code>.</>, teste: 'Field.test.tsx' },
    { garantia: 'Contador', como: 'Acompanha a digitação, contra o maxLength.', teste: 'Textarea.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <textarea>, exceto size, e o ref.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro: substitui a ajuda e marca o campo como inválido.' },
    { nome: 'rows', tipo: 'number', padrao: '4', descricao: 'Linhas visíveis.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Altura mínima e tamanho da fonte.' },
    { nome: 'showCharacterCount', tipo: 'boolean', padrao: 'false', descricao: 'Mostra o contador, contra o maxLength quando houver.' },
    { nome: 'maxLength', tipo: 'number', descricao: 'Limite nativo de caracteres.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Obrigatório nativo, com asterisco no rótulo.' },
  ],
};
