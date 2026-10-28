import { useState } from 'react';
import { IconSearch, InputText, type InputTextSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md', 'lg'] as const;
const TIPOS = ['text', 'search', 'email', 'tel', 'url'] as const;

const playground = definirPlayground({
  inicial: {
    label: 'Nome do módulo',
    placeholder: '',
    hint: '',
    error: '',
    type: 'text',
    size: 'md',
    icon: false,
    maxLength: 0,
    showCharacterCount: false,
    required: false,
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'placeholder' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'opcoes', nome: 'type', opcoes: TIPOS },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'icon' },
    { tipo: 'numero', nome: 'maxLength', min: 0, max: 200 },
    { tipo: 'booleano', nome: 'showCharacterCount' },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <InputText
        disabled={valores.disabled}
        error={valores.error || undefined}
        hint={valores.hint || undefined}
        icon={valores.icon ? <IconSearch /> : undefined}
        label={valores.label || undefined}
        maxLength={valores.maxLength || undefined}
        onBlur={() => registrar('onBlur')}
        onChange={(evento) => registrar(`onChange: "${evento.currentTarget.value}"`)}
        onFocus={() => registrar('onFocus')}
        placeholder={valores.placeholder || undefined}
        required={valores.required}
        showCharacterCount={valores.showCharacterCount}
        size={valores.size as InputTextSize}
        type={valores.type}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('InputText', [
      ['label', valores.label || undefined],
      ['type', valores.type, 'text'],
      ['icon', valores.icon ? expr('<IconSearch />') : undefined],
      ['placeholder', valores.placeholder || undefined],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
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
            detalhe: valores.icon || valores.placeholder
              ? 'Nem o ícone nem o placeholder nomeiam o campo. Dê um label.'
              : 'Sem label, nomeie o campo por aria-label ou aria-labelledby.',
          },
      {
        nivel: 'atencao',
        titulo: 'Contorno em repouso 1,33:1',
        detalhe: 'Exceção aceita, registrada no PROGRESS. No hover e no foco a borda chega a 3,03:1 e 5,57:1.',
      },
    ];

    if (valores.icon) {
      verificacoes.push({ nivel: 'ok', titulo: 'Ícone decorativo', detalhe: 'Fica fora da leitura; o nome continua no label.' });
    }

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

    if (valores.disabled) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Desabilitado',
        detalhe: 'Sai da tabulação e não vai no envio do formulário. Diga perto dele por quê.',
      });
    }

    return verificacoes;
  },
});

function EmailValidado() {
  const [email, setEmail] = useState('');
  const [saiu, setSaiu] = useState(false);
  const invalido = saiu && !/^\S+@\S+\.\S+$/.test(email);

  return (
    <div style={{ width: '100%' }}>
      <InputText
        autoComplete="email"
        error={invalido ? 'Informe um e-mail como nome@empresa.com.br.' : undefined}
        label="E-mail"
        onBlur={() => setSaiu(true)}
        onChange={(evento) => setEmail(evento.currentTarget.value)}
        required
        type="email"
        value={email}
      />
    </div>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      {TAMANHOS.map((tamanho) => (
        <InputText key={tamanho} label={`size="${tamanho}"`} placeholder="Nome do módulo" size={tamanho} />
      ))}
      {TAMANHOS.map((tamanho) => (
        <InputText
          icon={<IconSearch />}
          key={tamanho}
          label={`size="${tamanho}", com icon`}
          placeholder="Pesquisar"
          size={tamanho}
          type="search"
        />
      ))}
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Estados</h3>
        <div className="demo-grid">
          <InputText hint="Aparece no relatório mensal." label="Com ajuda" />
          <InputText error="Campo obrigatório." label="Com erro" />
          <InputText label="Obrigatório" required />
          <InputText defaultValue="Somente leitura" disabled label="Desabilitado" />
        </div>
      </div>
      <div className="subsection">
        <h3>Contador de caracteres</h3>
        <div className="demo-grid">
          <InputText defaultValue="Texto inicial" label="Com limite" maxLength={80} showCharacterCount />
          <InputText defaultValue="Texto inicial" label="Sem limite" showCharacterCount />
        </div>
        <p className="note">
          Conta em unidades UTF-16, a mesma medida do maxLength nativo: o número bate com o ponto em que o navegador corta, e
          um emoji conta 2. Controlado ou não, o contador acompanha o valor e volta ao inicial no reset do formulário.
        </p>
      </div>
      <div className="subsection">
        <h3>Número e dinheiro</h3>
        <p className="note">O InputText não formata valores. Para número, InputNumber; para dinheiro, InputCurrency.</p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Busca com ícone',
      descricao: 'A lupa é decorativa e fica fora da leitura; o nome do campo continua no label.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputText icon={<IconSearch />} label="Buscar clientes" placeholder="Nome ou CNPJ" type="search" />
        </div>
      ),
      codigo: '<InputText\n  icon={<IconSearch />}\n  label="Buscar clientes"\n  placeholder="Nome ou CNPJ"\n  type="search"\n/>',
    },
    {
      titulo: 'Busca compacta numa barra',
      descricao: 'O tamanho sm, com ícone, para barras de filtro.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputText icon={<IconSearch />} label="Filtrar" placeholder="Pesquisar" size="sm" type="search" />
        </div>
      ),
      codigo: '<InputText\n  icon={<IconSearch />}\n  label="Filtrar"\n  placeholder="Pesquisar"\n  size="sm"\n  type="search"\n/>',
    },
    {
      titulo: 'Busca de destaque',
      descricao: 'O tamanho lg, de 56px, para a busca principal de uma página. A sombra do cartão em volta é do produto, não do campo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputText icon={<IconSearch />} label="Buscar na documentação" placeholder="O que você procura?" size="lg" type="search" />
        </div>
      ),
      codigo:
        '<InputText\n  icon={<IconSearch />}\n  label="Buscar na documentação"\n  placeholder="O que você procura?"\n  size="lg"\n  type="search"\n/>',
    },
    {
      titulo: 'Validação ao sair',
      descricao: 'Digite um e-mail incompleto e saia do campo: o erro aparece e é anunciado.',
      Previa: EmailValidado,
      codigo:
        '<InputText\n  label="E-mail"\n  type="email"\n  autoComplete="email"\n  required\n  value={email}\n  error={invalido ? \'Informe um e-mail como nome@empresa.com.br.\' : undefined}\n  onChange={(evento) => setEmail(evento.currentTarget.value)}\n  onBlur={() => setSaiu(true)}\n/>',
    },
    {
      titulo: 'Texto curto com limite',
      descricao: 'O contador mostra quanto resta e entra na descrição do campo.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <InputText label="Título do aviso" maxLength={60} showCharacterCount />
        </div>
      ),
      codigo: '<InputText label="Título do aviso" maxLength={60} showCharacterCount />',
    },
  ],
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Rótulo associado', como: <>O <code>label</code> nomeia o <code>&lt;input&gt;</code> nativo.</>, teste: 'InputText.test.tsx' },
    {
      garantia: 'Obrigatório',
      como: <><code>required</code> nativo; o asterisco fica fora do nome.</>,
      teste: 'InputText.test.tsx',
    },
    { garantia: 'Ajuda e erro', como: <>Ligados por <code>aria-describedby</code>; o erro marca <code>aria-invalid</code>.</>, teste: 'InputText.test.tsx' },
    { garantia: 'Erro anunciado', como: <>O erro que aparece depois sai com <code>role=&quot;alert&quot;</code>.</>, teste: 'Field.test.tsx' },
    { garantia: 'Contador', como: <>Entra na descrição do campo, sem <code>aria-live</code>.</>, teste: 'InputText.test.tsx' },
    { garantia: 'Ícone decorativo', como: <>Dentro de <code>aria-hidden</code>; o nome continua no label.</>, teste: 'InputText.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <input>, exceto size, e o ref, que chega ao input.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro: substitui a ajuda e marca o campo como inválido.' },
    { nome: 'icon', tipo: 'ReactNode', descricao: 'Ícone decorativo à frente do texto, como a lupa de uma busca.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura do campo: 32, 36 ou 56px. O lg é o da busca de destaque.' },
    { nome: 'onValueChange', tipo: '(value: string) => void', descricao: 'O texto a cada mudança, ao lado do onChange nativo.' },
    { nome: 'showCharacterCount', tipo: 'boolean', padrao: 'false', descricao: 'Mostra o contador, contra o maxLength quando houver.' },
    { nome: 'maxLength', tipo: 'number', descricao: 'Limite nativo de caracteres.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Obrigatório nativo, com asterisco no rótulo.' },
    { nome: 'type', tipo: 'string', padrao: "'text'", descricao: 'Tipo nativo: text, search, email, tel, url.' },
  ],
};
