import { useState, type ChangeEvent } from 'react';
import { Field, InputText, type FieldSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const LIMITE_DO_ARQUIVO = 5 * 1024 * 1024;

function controleDoCpf(maxLength: number, required: boolean) {
  return gerarJsx('input', [
    ['className', expr('className')],
    ['id', expr('id')],
    ['aria-describedby', expr('describedBy')],
    ['aria-invalid', expr('invalid || undefined')],
    ['inputMode', 'numeric'],
    ['maxLength', maxLength || undefined],
    ['required', required, false],
    ['value', expr('cpf')],
    ['onChange', expr('mudarCpf')],
  ]);
}

interface PropsDoCpf {
  error: string;
  hint: string;
  label: string;
  maxLength: number;
  onCpfChange?: (cpf: string) => void;
  required: boolean;
  showCharacterCount: boolean;
  size: FieldSize;
}

/** Um campo que o catálogo não entrega: só dígitos, com a fiação vinda do Field. */
function CampoDeCpf({ error, hint, label, maxLength, onCpfChange, required, showCharacterCount, size }: PropsDoCpf) {
  const [cpf, setCpf] = useState('');

  function mudarCpf(evento: ChangeEvent<HTMLInputElement>) {
    const digitos = evento.currentTarget.value.replace(/\D/g, '');
    setCpf(digitos);
    onCpfChange?.(digitos);
  }

  return (
    <Field
      characterCount={cpf.length}
      error={error || undefined}
      hint={hint || undefined}
      label={label || undefined}
      maxLength={maxLength || undefined}
      required={required}
      showCharacterCount={showCharacterCount}
      size={size}
      style={{ width: '100%', maxWidth: 360 }}
    >
      {({ className, describedBy, id, invalid }) => (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={className}
          id={id}
          inputMode="numeric"
          maxLength={maxLength || undefined}
          onChange={mudarCpf}
          required={required}
          value={cpf}
        />
      )}
    </Field>
  );
}

const playground = definirPlayground({
  inicial: {
    label: 'CPF',
    hint: 'Somente números.',
    error: '',
    size: 'md',
    required: false,
    showCharacterCount: true,
    maxLength: 11,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'size', opcoes: ['sm', 'md'] },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'showCharacterCount' },
    { tipo: 'numero', nome: 'maxLength', min: 0, max: 40 },
  ],
  renderizar: (valores, registrar) => (
    <CampoDeCpf
      error={valores.error}
      hint={valores.hint}
      label={valores.label}
      maxLength={valores.maxLength}
      onCpfChange={(cpf) => registrar(`onChange: "${cpf}"`)}
      required={valores.required}
      showCharacterCount={valores.showCharacterCount}
      size={valores.size as FieldSize}
    />
  ),
  codigo: (valores) =>
    gerarJsx(
      'Field',
      [
        ['label', valores.label || undefined],
        ['hint', valores.hint || undefined],
        ['error', valores.error || undefined],
        ['size', valores.size, 'md'],
        ['required', valores.required, false],
        ['maxLength', valores.maxLength || undefined],
        ['showCharacterCount', valores.showCharacterCount, false],
        ['characterCount', valores.showCharacterCount ? expr('cpf.length') : undefined],
      ],
      `{({ className, id, describedBy, invalid }) => (\n${controleDoCpf(valores.maxLength, valores.required).replace(/^/gm, '  ')}\n)}`,
    ),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Rótulo ligado', detalhe: 'O id chega pela função; o rótulo nomeia o controle sem id inventado.' }
        : {
            nivel: 'falha',
            titulo: 'Sem nome acessível',
            detalhe: 'Sem label, o controle precisa se nomear: aria-label ou aria-labelledby nele.',
          },
      {
        nivel: 'ok',
        titulo: 'Fiação aplicada',
        detalhe: 'className, id, describedBy e invalid só valem quando o controle os recebe, como na prévia.',
      },
    ];

    if (valores.error.trim()) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Erro anunciado',
        detalhe: 'Substitui a ajuda, marca aria-invalid e sai com role="alert" quando aparece.',
      });
    }

    if (valores.showCharacterCount && !valores.maxLength) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Contador sem limite', detalhe: 'Sem maxLength, mostra só o total.' });
    }

    if (valores.required) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Obrigatório',
        detalhe: 'O Field marca o rótulo; o required do controle é seu, como na prévia.',
      });
    }

    return verificacoes;
  },
});

function CpfValidadoAoSair() {
  const [cpf, setCpf] = useState('');
  const [erro, setErro] = useState<string>();

  return (
    <Field error={erro} hint="Somente números." label="CPF do titular" required style={{ width: '100%' }}>
      {({ className, describedBy, id, invalid }) => (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={className}
          id={id}
          inputMode="numeric"
          onBlur={() => setErro(cpf.length === 11 ? undefined : 'O CPF tem 11 dígitos.')}
          onChange={(evento) => setCpf(evento.currentTarget.value.replace(/\D/g, ''))}
          required
          value={cpf}
        />
      )}
    </Field>
  );
}

function Comprovante() {
  const [erro, setErro] = useState<string>();

  function escolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.currentTarget.files?.[0];
    setErro(arquivo && arquivo.size > LIMITE_DO_ARQUIVO ? 'O arquivo passa de 5 MB.' : undefined);
  }

  return (
    <Field error={erro} hint="PDF ou imagem, até 5 MB." label="Comprovante" style={{ width: '100%' }}>
      {({ className, describedBy, id, invalid }) => (
        <input
          accept=".pdf,image/*"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={className}
          id={id}
          onChange={escolher}
          type="file"
        />
      )}
    </Field>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>A função</dt>
      <dd>
        Recebe <code>{'{ className, id, describedBy, invalid }'}</code> e devolve o controle. O Field não toca no
        controle: quem o escreve aplica a fiação e o <code>required</code>. A <code>className</code> traz o visual dos
        campos do sistema — borda, foco, erro e tamanho —, e a classe própria do controle, somada a ela, vence.
      </dd>
      <dt><code>hint</code> e <code>error</code></dt>
      <dd>
        A ajuda descreve o controle. O erro a substitui, marca <code>invalid</code> e sai com <code>role=&quot;alert&quot;</code>,
        para ser anunciado quando aparece.
      </dd>
      <dt>Contador</dt>
      <dd>
        Com <code>showCharacterCount</code>, mostra <code>characterCount</code>, que vem de quem detém o valor, contra o{' '}
        <code>maxLength</code>, e entra na descrição do controle.
      </dd>
      <dt><code>id</code> e <code>aria-describedby</code></dt>
      <dd>O id informado é respeitado; sem ele, o Field gera um. A descrição que já vinha de fora é somada, não substituída.</dd>
      <dt>Sem <code>label</code></dt>
      <dd>Para o controle que se nomeia por conta própria, com <code>aria-label</code> ou <code>aria-labelledby</code>.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Erro que aparece ao sair',
      descricao: 'Saia do campo com menos de 11 dígitos: o erro troca a ajuda e é anunciado.',
      Previa: CpfValidadoAoSair,
      codigo:
        '<Field label="CPF do titular" hint="Somente números." error={erro} required>\n  {({ className, id, describedBy, invalid }) => (\n    <input\n      className={className}\n      id={id}\n      aria-describedby={describedBy}\n      aria-invalid={invalid || undefined}\n      inputMode="numeric"\n      required\n      value={cpf}\n      onChange={mudarCpf}\n      onBlur={validarCpf}\n    />\n  )}\n</Field>',
    },
    {
      titulo: 'Seletor de arquivo',
      descricao: 'Um controle que o catálogo não entrega, com ajuda e erro amarrados pelo Field.',
      Previa: Comprovante,
      codigo:
        '<Field label="Comprovante" hint="PDF ou imagem, até 5 MB." error={erro}>\n  {({ className, id, describedBy, invalid }) => (\n    <input\n      className={className}\n      id={id}\n      aria-describedby={describedBy}\n      aria-invalid={invalid || undefined}\n      type="file"\n      accept=".pdf,image/*"\n      onChange={escolher}\n    />\n  )}\n</Field>',
    },
  ],
  faca: {
    Previa: () => <Comprovante />,
    texto: 'Field em volta de um controle que o Design System não entrega: máscara de documento, arquivo, endereço.',
  },
  evite: {
    Previa: () => (
      <Field label="E-mail" style={{ width: '100%' }}>
        {({ id }) => <InputText id={id} />}
      </Field>
    ),
    texto: 'Envolver um campo do catálogo: ele já tem o seu Field por dentro. Use o label, o hint e o error dele.',
  },
  Modos,
  garantias: [
    { garantia: 'Rótulo ligado', como: 'O rótulo nomeia o controle sem que quem usa invente um id.', teste: 'Field.test.tsx' },
    { garantia: 'Ajuda e erro descritos', como: <>Entram em <code>aria-describedby</code>; o erro substitui a ajuda e marca inválido.</>, teste: 'Field.test.tsx' },
    { garantia: 'Erro anunciado', como: <>O erro que aparece depois sai com <code>role=&quot;alert&quot;</code>; a ajuda, sem papel.</>, teste: 'Field.test.tsx' },
    { garantia: 'Descrição preservada', como: <>O <code>aria-describedby</code> de fora é somado à descrição montada.</>, teste: 'Field.test.tsx' },
    { garantia: 'Contador descrito', como: 'A contagem contra o limite entra na descrição do controle.', teste: 'Field.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div>, que vão ao elemento de fora, e o ref.',
  api: [
    {
      nome: 'children',
      tipo: '(wiring: FieldWiring) => ReactNode',
      descricao: <>Recebe <code>{'{ className, id, describedBy, invalid }'}</code> e devolve o controle.</>,
    },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Tamanho do visual entregue em className, o mesmo dos campos do catálogo.' },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do controle. Opcional, para o controle que se nomeia sozinho.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do controle, na descrição dele.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro: substitui a ajuda e liga invalid.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Asterisco no rótulo. O required do controle é de quem o escreve.' },
    { nome: 'id', tipo: 'string', padrao: 'gerado', descricao: 'Id do controle, entregue pela função.' },
    { nome: 'showCharacterCount', tipo: 'boolean', padrao: 'false', descricao: 'Mostra o contador.' },
    { nome: 'characterCount', tipo: 'number', padrao: '0', descricao: 'A contagem, vinda de quem detém o valor.' },
    { nome: 'maxLength', tipo: 'number', descricao: 'Limite exibido no contador, como 7/11.' },
    { nome: 'aria-describedby', tipo: 'string', descricao: 'Descrição de fora, somada à montada pelo Field.' },
  ],
};
