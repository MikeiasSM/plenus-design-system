import { useState } from 'react';
import { InputPassword } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const AUTOCOMPLETES = ['current-password', 'new-password'] as const;
const TAMANHOS = ['sm', 'md'] as const;
const MINIMO = 8;

function validarSenha(senha: string) {
  return senha.length < MINIMO ? `Use ao menos ${MINIMO} caracteres.` : undefined;
}

const playground = definirPlayground({
  inicial: {
    label: 'Senha',
    hint: '',
    error: '',
    autoComplete: 'current-password',
    validar: false,
    validateOnBlur: true,
    showToggle: true,
    allowCopy: false,
    size: 'md',
    required: false,
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'autoComplete', opcoes: AUTOCOMPLETES },
    { tipo: 'booleano', nome: 'validar' },
    { tipo: 'booleano', nome: 'validateOnBlur' },
    { tipo: 'booleano', nome: 'showToggle' },
    { tipo: 'booleano', nome: 'allowCopy' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <InputPassword
        allowCopy={valores.allowCopy}
        autoComplete={valores.autoComplete}
        disabled={valores.disabled}
        error={valores.error || undefined}
        hint={valores.hint || undefined}
        key={`${valores.validar}-${valores.validateOnBlur}`}
        label={valores.label || undefined}
        onBlur={() => registrar('onBlur')}
        onChange={(evento) => registrar(`onChange: ${evento.currentTarget.value.length} caractere(s)`)}
        onCopy={() => registrar(valores.allowCopy ? 'onCopy' : 'onCopy: bloqueado')}
        onValidationChange={(mensagem) => registrar(`onValidationChange: ${mensagem ? `"${mensagem}"` : 'undefined'}`)}
        required={valores.required}
        showToggle={valores.showToggle}
        size={valores.size as 'sm' | 'md'}
        validate={valores.validar ? validarSenha : undefined}
        validateOnBlur={valores.validateOnBlur}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('InputPassword', [
      ['label', valores.label || undefined],
      ['autoComplete', valores.autoComplete, 'current-password'],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['validate', valores.validar ? expr('validarSenha') : undefined],
      ['validateOnBlur', valores.validar ? valores.validateOnBlur : undefined, true],
      ['onValidationChange', valores.validar ? expr('setErroDaSenha') : undefined],
      ['showToggle', valores.showToggle, true],
      ['allowCopy', valores.allowCopy, false],
      ['size', valores.size, 'md'],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", ligado ao campo pelo rótulo.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Sem label, nomeie o campo por aria-label ou aria-labelledby.' },
      { nivel: 'ok', titulo: 'Sem contador', detalhe: 'O comprimento da senha, que a máscara protege, não aparece na tela.' },
      {
        nivel: 'ok',
        titulo: `autocomplete="${valores.autoComplete}"`,
        detalhe:
          valores.autoComplete === 'new-password'
            ? 'Cadastro ou troca: o gerenciador de senhas pode sugerir uma nova.'
            : 'Entrada: o gerenciador de senhas preenche a salva.',
      },
    ];

    if (!valores.showToggle) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Sem revelação',
        detalhe: 'Quem digita não confere o que escreveu. O papel do campo é revelar por ação explícita.',
      });
    }

    if (valores.allowCopy) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Cópia liberada',
        detalhe: 'O padrão bloqueia copiar e recortar a senha; colar e o preenchimento automático continuam livres.',
      });
    }

    if (valores.validar && !valores.validateOnBlur) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Valida a cada tecla',
        detalhe: 'A mensagem aparece desde o primeiro caractere, antes de a pessoa terminar.',
      });
    }

    if (valores.validar && valores.error.trim()) {
      verificacoes.push({ nivel: 'ok', titulo: 'error prevalece', detalhe: 'O error de fora fica no lugar da mensagem de validate.' });
    }

    return verificacoes;
  },
});

function NovaSenha() {
  const [senha, setSenha] = useState('');

  return (
    <div className="stack" style={{ width: '100%' }}>
      <InputPassword
        autoComplete="new-password"
        hint={`Ao menos ${MINIMO} caracteres.`}
        label="Nova senha"
        onChange={(evento) => setSenha(evento.currentTarget.value)}
        validate={validarSenha}
      />
      <InputPassword
        autoComplete="new-password"
        label="Confirme a nova senha"
        validate={(confirmacao) => (confirmacao === senha ? undefined : 'As senhas não conferem.')}
      />
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <dl className="modes">
        <dt>Revelação</dt>
        <dd>
          A senha começa mascarada. O botão &quot;Mostrar&quot; revela, com o nome &quot;Mostrar senha&quot; ou &quot;Ocultar
          senha&quot; conforme o estado, e a senha volta a ser ocultada quando o formulário é enviado.
        </dd>
        <dt><code>allowCopy</code></dt>
        <dd>
          Copiar e recortar são bloqueados por padrão; colar, o preenchimento automático e os gerenciadores de senha
          continuam livres. Isso não impede extensões ou scripts privilegiados de acessarem o campo.
        </dd>
        <dt><code>validate</code></dt>
        <dd>
          Recebe a senha e devolve a mensagem, ou <code>undefined</code>. Roda ao sair do campo e, depois disso, a cada
          tecla; com <code>validateOnBlur={'{false}'}</code>, a cada tecla desde o início. O resultado vai a{' '}
          <code>onValidationChange</code>, e um <code>error</code> de fora prevalece sobre ele.
        </dd>
        <dt>Sem contador</dt>
        <dd>
          Um contador ao vivo publicaria o comprimento exato da senha. O <code>maxLength</code> continua, sem contagem
          visível.
        </dd>
        <dt><code>disabled</code></dt>
        <dd>Desabilita o campo e o botão de revelação juntos.</dd>
      </dl>
      <div className="subsection">
        <h3>Estados</h3>
        <div className="demo-grid">
          <InputPassword hint="Use uma senha segura." label="Com ajuda" />
          <InputPassword error="Senha obrigatória." label="Com erro" />
          <InputPassword label="Sem revelação" showToggle={false} />
          <InputPassword defaultValue="segredo" disabled label="Desabilitado" />
        </div>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Entrada',
      descricao: 'O gerenciador de senhas preenche a senha salva.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputPassword label="Senha" required />
        </div>
      ),
      codigo: '<InputPassword label="Senha" required />',
    },
    {
      titulo: 'Nova senha com confirmação',
      descricao: 'Cada campo valida ao sair: o mínimo no primeiro, a igualdade no segundo.',
      Previa: NovaSenha,
      codigo:
        '<InputPassword\n  label="Nova senha"\n  autoComplete="new-password"\n  hint="Ao menos 8 caracteres."\n  validate={validarSenha}\n  onChange={(evento) => setSenha(evento.currentTarget.value)}\n/>\n<InputPassword\n  label="Confirme a nova senha"\n  autoComplete="new-password"\n  validate={(confirmacao) =>\n    confirmacao === senha ? undefined : \'As senhas não conferem.\'\n  }\n/>',
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Vai do campo ao botão de revelação.' },
    { teclas: ['Enter', 'Espaço'], acao: 'No botão, mostra ou oculta a senha.' },
  ],
  garantias: [
    {
      garantia: 'Revelação acessível',
      como: <>Começa mascarada; o botão troca o nome entre &quot;Mostrar senha&quot; e &quot;Ocultar senha&quot;.</>,
      teste: 'InputPassword.test.tsx',
    },
    { garantia: 'Ocultada no envio', como: 'A senha revelada volta a ser mascarada quando o formulário é enviado.', teste: 'InputPassword.test.tsx' },
    {
      garantia: 'Erro sem vazar a senha',
      como: <>O erro marca <code>aria-invalid</code> e descreve o campo, sem publicar o comprimento.</>,
      teste: 'InputPassword.test.tsx',
    },
    { garantia: 'Validação exposta', como: 'A mensagem de validate vira o erro acessível do campo.', teste: 'InputPassword.test.tsx' },
    { garantia: 'Cópia bloqueada', como: 'Copiar e recortar são cancelados, salvo com allowCopy.', teste: 'InputPassword.test.tsx' },
    { garantia: 'Botão acompanha o campo', como: 'Desabilitado junto com ele.', teste: 'InputPassword.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <input>, exceto type e size, e o ref.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; prevalece sobre a de validate.' },
    { nome: 'validate', tipo: '(value: string) => string | undefined', descricao: 'Devolve a mensagem de erro, ou undefined.' },
    { nome: 'validateOnBlur', tipo: 'boolean', padrao: 'true', descricao: 'Valida a partir da saída do campo; false valida a cada tecla.' },
    { nome: 'onValidationChange', tipo: '(message?: string) => void', descricao: 'Recebe o resultado de cada validação.' },
    { nome: 'showToggle', tipo: 'boolean', padrao: 'true', descricao: 'Mostra o botão de revelação.' },
    { nome: 'allowCopy', tipo: 'boolean', padrao: 'false', descricao: 'Libera copiar e recortar.' },
    { nome: 'autoComplete', tipo: 'string', padrao: "'current-password'", descricao: "Use 'new-password' em cadastro e troca." },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Altura do campo.' },
  ],
};
