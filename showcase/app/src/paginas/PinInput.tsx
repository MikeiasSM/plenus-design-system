import { useState } from 'react';
import { Button, PinInput, type PinInputSize, type PinInputType } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const TIPOS = ['numeric', 'alphanumeric'] as const;
const GRUPOS = ['nenhum', '3 e 3', '2, 2 e 2'] as const;
const TAMANHOS = ['sm', 'md', 'lg'] as const;

function gruposDe(opcao: string, comprimento: number): number[] | undefined {
  if (opcao === '3 e 3') {
    return [Math.ceil(comprimento / 2), Math.floor(comprimento / 2)];
  }

  if (opcao === '2, 2 e 2') {
    return Array.from({ length: Math.ceil(comprimento / 2) }, () => 2);
  }

  return undefined;
}

const playground = definirPlayground({
  inicial: {
    label: 'Código de verificação',
    hint: 'Enviado por mensagem para o celular cadastrado.',
    error: '',
    length: 6,
    type: 'numeric',
    groups: 'nenhum',
    mask: false,
    size: 'md',
    required: false,
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'numero', nome: 'length', min: 4, max: 8 },
    { tipo: 'opcoes', nome: 'type', opcoes: TIPOS },
    { tipo: 'opcoes', nome: 'groups', opcoes: GRUPOS },
    { tipo: 'booleano', nome: 'mask' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <PinInput
      disabled={valores.disabled}
      error={valores.error || undefined}
      groups={gruposDe(valores.groups, valores.length)}
      hint={valores.hint || undefined}
      key={`${valores.length}-${valores.type}`}
      label={valores.label || undefined}
      length={valores.length}
      mask={valores.mask}
      onChange={(valor) => registrar(`onChange: "${valor}"`)}
      onComplete={(valor) => registrar(`onComplete: "${valor}"`)}
      required={valores.required}
      size={valores.size as PinInputSize}
      type={valores.type as PinInputType}
    />
  ),
  codigo: (valores) => {
    const grupos = gruposDe(valores.groups, valores.length);

    return gerarJsx('PinInput', [
      ['label', valores.label || undefined],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['length', valores.length, 6],
      ['type', valores.type, 'numeric'],
      ['groups', grupos ? expr(`[${grupos.join(', ')}]`) : undefined],
      ['mask', valores.mask, false],
      ['size', valores.size, 'md'],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['onComplete', expr('verificar')],
    ]);
  },
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", num campo só, ligado pelo rótulo.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, nomeie o campo por aria-label ou aria-labelledby.' },
      valores.type === 'numeric'
        ? {
            nivel: 'ok',
            titulo: 'autocomplete="one-time-code"',
            detalhe: 'O celular oferece o código recebido por mensagem, e ele entra inteiro, com o teclado numérico.',
          }
        : { nivel: 'ok', titulo: 'Letras em maiúsculas', detalhe: 'Letras e dígitos, escritos em maiúsculas; o resto é descartado.' },
      { nivel: 'ok', titulo: 'Colar de uma vez', detalhe: 'Espaços e hífens saem, e o excesso é cortado.' },
    ];

    if (valores.mask) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Máscara só na tela',
        detalhe: 'As caixas mostram pontos, mas o leitor de tela continua lendo os caracteres, como num campo comum.',
      });
    }

    if (valores.length > 6 && valores.groups === 'nenhum') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Código longo sem grupos',
        detalhe: 'Acima de 6 caracteres, groups ajuda a conferir o código por partes.',
      });
    }

    return verificacoes;
  },
});

function ConfirmacaoDoCodigo() {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string>();
  const [situacao, setSituacao] = useState('');

  function verificar(valor: string) {
    if (valor === '123456') {
      setErro(undefined);
      setSituacao('Código confirmado.');
    } else {
      setErro('Código incorreto. Confira a mensagem e tente de novo.');
      setSituacao('');
    }
  }

  return (
    <div className="stack">
      <PinInput
        error={erro}
        hint="Use 123456 para confirmar."
        label="Código de verificação"
        onChange={(valor) => {
          setCodigo(valor);
          setErro(undefined);
          setSituacao('');
        }}
        onComplete={verificar}
        value={codigo}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button disabled={codigo.length < 6} onClick={() => verificar(codigo)} variant="secondary">
          Verificar
        </Button>
        <span role="status">{situacao}</span>
      </div>
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Um campo só</dt>
        <dd>
          Por baixo das caixas há um único <code>&lt;input&gt;</code>, transparente. O leitor de tela ouve um campo com
          rótulo e ajuda, colar entra de uma vez e o preenchimento automático do código recebido por mensagem chega
          inteiro. O cursor fica sempre no fim: clicar numa caixa não abre o meio do código.
        </dd>
        <dt><code>type</code></dt>
        <dd>
          <code>numeric</code>, o padrão, aceita só dígitos, com o teclado numérico no celular e{' '}
          <code>autocomplete=&quot;one-time-code&quot;</code>. <code>alphanumeric</code> aceita letras e dígitos e escreve
          as letras em maiúsculas.
        </dd>
        <dt>Filtro</dt>
        <dd>
          O que se digita ou cola passa pelo tipo: &quot;482-913&quot; vira &quot;482913&quot;, e o que passa de{' '}
          <code>length</code> é cortado. O caractere que não vale não chama <code>onChange</code>.
        </dd>
        <dt><code>onComplete</code></dt>
        <dd>Chamado uma vez quando o código enche. Não envia nada: verificar na hora ou num botão é escolha do produto.</dd>
        <dt><code>mask</code> e <code>groups</code></dt>
        <dd>
          <code>mask</code> mostra pontos no lugar dos caracteres. <code>groups</code> desenha um traço entre os grupos,
          como <code>[3, 3]</code>; o valor continua sem separador.
        </dd>
      </dl>
      <div className="subsection">
        <h3>Estados</h3>
        <div className="demo-grid">
          <PinInput hint="Enviado por mensagem." label="Com ajuda" length={4} />
          <PinInput defaultValue="48" error="Código incompleto." label="Com erro" length={4} />
          <PinInput defaultValue="4829" label="Com máscara" length={4} mask />
          <PinInput defaultValue="4829" disabled label="Desabilitado" length={4} />
        </div>
        <VerCodigo
          codigo={`<PinInput label="Com ajuda" length={4} hint="Enviado por mensagem." />
<PinInput label="Com erro" length={4} error="Código incompleto." />
<PinInput label="Com máscara" length={4} defaultValue="4829" mask />
<PinInput label="Desabilitado" length={4} disabled />`}
        />
      </div>
      <div className="subsection">
        <h3>Tamanhos</h3>
        <div className="stack">
          <PinInput label="Pequeno" length={4} size="sm" />
          <PinInput label="Médio" length={4} />
          <PinInput label="Grande" length={4} size="lg" />
        </div>
        <VerCodigo
          codigo={`<PinInput label="Pequeno" length={4} size="sm" />
<PinInput label="Médio" length={4} />
<PinInput label="Grande" length={4} size="lg" />`}
        />
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Verificação ao encher',
      descricao:
        'O onComplete verifica assim que o código enche, e o botão continua lá para quem prefere confirmar. O erro some quando a pessoa volta a digitar.',
      Previa: ConfirmacaoDoCodigo,
      codigo:
        '<PinInput\n  label="Código de verificação"\n  value={codigo}\n  onChange={setCodigo}\n  onComplete={verificar}\n  error={erro}\n/>',
    },
    {
      titulo: 'Código de retirada em dois grupos',
      descricao: 'Letras e dígitos, em maiúsculas, com um traço entre os grupos de 3. O valor não leva o traço.',
      Previa: () => <PinInput groups={[3, 3]} label="Código de retirada" type="alphanumeric" />,
      codigo: '<PinInput\n  label="Código de retirada"\n  type="alphanumeric"\n  groups={[3, 3]}\n/>',
    },
  ],
  Modos,
  teclado: [
    { teclas: ['0–9'], acao: 'Preenche a próxima caixa; no alfanumérico, também as letras.' },
    { teclas: ['Backspace'], acao: 'Apaga o último caractere.' },
    { teclas: ['Ctrl', 'V'], acao: 'Cola o código inteiro, sem os separadores.' },
  ],
  garantias: [
    { garantia: 'Um campo com nome', como: 'Um único input com rótulo e ajuda; as caixas ficam fora da árvore acessível.', teste: 'PinInput.test.tsx' },
    { garantia: 'Colar filtra', como: '"482-913" vira "482913", e o excesso é cortado.', teste: 'PinInput.test.tsx' },
    { garantia: 'Filtro do tipo', como: 'Só dígitos no numérico; letras em maiúsculas no alfanumérico.', teste: 'PinInput.test.tsx' },
    { garantia: 'onComplete uma vez', como: 'Chamado ao encher, e de novo só depois de apagar e encher.', teste: 'PinInput.test.tsx' },
    { garantia: 'Cursor no fim', como: 'Focar, clicar ou selecionar devolve o cursor ao fim do código.', teste: 'PinInput.test.tsx' },
    {
      garantia: 'Erro acessível',
      como: <>O erro marca <code>aria-invalid</code>, descreve o campo e pinta as caixas de perigo.</>,
      teste: 'PinInput.test.tsx',
    },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <input>, exceto type, size, maxLength e minLength, e o ref.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; as caixas ganham a borda de perigo.' },
    { nome: 'length', tipo: 'number', padrao: '6', descricao: 'Quantidade de caracteres do código.' },
    { nome: 'type', tipo: "'numeric' | 'alphanumeric'", padrao: "'numeric'", descricao: 'Só dígitos, ou letras e dígitos em maiúsculas.' },
    { nome: 'value', tipo: 'string', descricao: 'Valor controlado, filtrado pelo tipo.' },
    { nome: 'defaultValue', tipo: 'string', descricao: 'Valor inicial do campo não controlado.' },
    { nome: 'onChange', tipo: '(value: string) => void', descricao: 'O código a cada mudança, filtrado e sem separador.' },
    { nome: 'onComplete', tipo: '(value: string) => void', descricao: 'Chamado uma vez quando o código enche. Não envia nada.' },
    { nome: 'mask', tipo: 'boolean', padrao: 'false', descricao: 'Mostra pontos no lugar dos caracteres.' },
    { nome: 'groups', tipo: 'number[]', descricao: 'Tamanho de cada grupo, como [3, 3]; um traço visual os separa.' },
    { nome: 'labelAddon', tipo: 'ReactNode', descricao: 'Ao lado do rótulo e fora dele, como um link de reenviar o código.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Caixas de 36×44, 44×52 ou 52×60px.' },
  ],
};
