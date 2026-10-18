import { useEffect, useRef, useState } from 'react';
import { ComboBox, Select, type ComboBoxSize } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { ESTADOS } from '../dadosDeExemplo';

const REGISTROS = Array.from({ length: 10000 }, (_, indice) => ({
  value: String(indice),
  label: 'Registro ' + String(indice + 1).padStart(5, '0'),
}));

const LIMITE_DA_CONSULTA = 50;

const playground = definirPlayground({
  inicial: {
    label: 'Estado',
    placeholder: 'Digite para filtrar',
    selectionMode: 'single',
    hint: '',
    error: '',
    emptyMessage: 'Nenhum resultado',
    size: 'md',
    buscaExterna: false,
    loading: false,
    required: false,
    disabled: false,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'placeholder' },
    { tipo: 'opcoes', nome: 'selectionMode', opcoes: ['single', 'multiple'] },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'texto', nome: 'emptyMessage' },
    { tipo: 'opcoes', nome: 'size', opcoes: ['sm', 'md'] },
    { tipo: 'booleano', nome: 'buscaExterna' },
    { tipo: 'booleano', nome: 'loading' },
    { tipo: 'booleano', nome: 'required' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => {
    const comuns = {
      disabled: valores.disabled,
      emptyMessage: valores.emptyMessage,
      error: valores.error || undefined,
      hint: valores.hint || undefined,
      label: valores.label || undefined,
      loading: valores.loading,
      onSearch: valores.buscaExterna ? (termo: string) => registrar('onSearch: ' + JSON.stringify(termo)) : undefined,
      options: ESTADOS,
      placeholder: valores.placeholder || undefined,
      required: valores.required,
      size: valores.size as ComboBoxSize,
    };

    return (
      <div style={{ width: '100%' }}>
        {valores.selectionMode === 'multiple' ? (
          <ComboBox
            {...comuns}
            key="multiple"
            onValueChange={(escolhidos) => registrar('onValueChange: ' + JSON.stringify(escolhidos))}
            selectionMode="multiple"
          />
        ) : (
          <ComboBox {...comuns} key="single" onValueChange={(valor) => registrar('onValueChange: ' + JSON.stringify(valor))} />
        )}
      </div>
    );
  },
  codigo: (valores) =>
    gerarJsx('ComboBox', [
      ['label', valores.label || undefined],
      ['placeholder', valores.placeholder || undefined],
      ['selectionMode', valores.selectionMode, 'single'],
      ['options', expr('estados')],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['emptyMessage', valores.emptyMessage, 'Nenhum resultado'],
      ['size', valores.size, 'md'],
      ['onSearch', valores.buscaExterna ? expr('buscar') : undefined],
      ['loading', valores.loading, false],
      ['required', valores.required, false],
      ['disabled', valores.disabled, false],
      ['onValueChange', expr(valores.selectionMode === 'multiple' ? 'setEstados' : 'setEstado')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", no rótulo do campo.` }
        : {
            nivel: 'falha',
            titulo: 'Sem rótulo',
            detalhe: 'O placeholder some ao digitar e não é rótulo. Use label, ou aria-label.',
          },
    ];

    if (valores.buscaExterna) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Busca externa',
        detalhe: 'Com onSearch, o componente não filtra: digite e veja o termo nos eventos. As opções filtradas vêm do produto.',
      });
    }

    if (valores.loading && !valores.buscaExterna) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'loading sem onSearch',
        detalhe: 'O carregamento acompanha a busca externa. Com filtro local, não há o que esperar.',
      });
    }

    if (valores.selectionMode === 'multiple') {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Contagem anunciada',
        detalhe: 'O campo é descrito pelo total e pelos nomes escolhidos, mesmo quando só a primeira etiqueta cabe.',
      });
    }

    if (valores.error && valores.hint) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Ajuda escondida pelo erro', detalhe: 'Só uma mensagem aparece: com erro, a ajuda sai.' });
    }

    return verificacoes;
  },
});

function BuscaNoServidor() {
  const [opcoes, setOpcoes] = useState(REGISTROS.slice(0, LIMITE_DA_CONSULTA));
  const [carregando, setCarregando] = useState(false);
  const consulta = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(consulta.current), []);

  function buscar(termo: string) {
    clearTimeout(consulta.current);
    setCarregando(true);
    consulta.current = setTimeout(() => {
      const encontrados = REGISTROS.filter((registro) => registro.label.includes(termo));
      setOpcoes(encontrados.slice(0, LIMITE_DA_CONSULTA));
      setCarregando(false);
    }, 400);
  }

  return (
    <div style={{ width: '100%' }}>
      <ComboBox
        hint="Dez mil registros no servidor; cada consulta devolve até 50."
        label="Registro"
        loading={carregando}
        onSearch={buscar}
        options={opcoes}
        placeholder="Digite um número, como 0420"
      />
    </div>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <ComboBox label="Médio" options={ESTADOS} placeholder="Digite para filtrar" />
      <ComboBox label="Pequeno" options={ESTADOS} placeholder="Digite para filtrar" size="sm" />
      <ComboBox defaultValue="sp" label="Com valor" options={ESTADOS} />
      <ComboBox defaultValue={['sp', 'rj', 'mg']} label="Múltipla" options={ESTADOS} selectionMode="multiple" />
      <ComboBox error="Informe o estado." label="Com erro" options={ESTADOS} />
      <ComboBox defaultValue="sp" disabled label="Desabilitado" options={ESTADOS} />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>selectionMode</code></dt>
      <dd>
        <code>single</code> preenche o campo com o texto da escolha e fecha a lista. <code>multiple</code> mantém a lista
        aberta, mostra as escolhas em etiquetas e usa o campo só para a busca. Os tipos de <code>value</code> e{' '}
        <code>onValueChange</code> acompanham o modo: <code>string</code> ou <code>string[]</code>.
      </dd>
      <dt>Etiquetas</dt>
      <dd>
        Todas aparecem enquanto cabem; quando transbordam, a primeira e a contagem das demais. As etiquetas não entram
        na tabulação, e <code>Backspace</code> no campo vazio remove a última.
      </dd>
      <dt>Filtro local</dt>
      <dd>
        Sem <code>onSearch</code>, a lista filtra pelo texto em qualquer posição, ignorando caixa e acento: "sao" encontra
        São Paulo. Sem correspondência, mostra <code>emptyMessage</code> em vez de sumir.
      </dd>
      <dt>Busca externa</dt>
      <dd>
        Com <code>onSearch</code>, o componente avisa o termo e não filtra; o produto devolve as opções e sinaliza a
        espera com <code>loading</code>. É o caminho para listas grandes, como os dez mil registros do exemplo.
      </dd>
      <dt>Saída do campo</dt>
      <dd>Perder o foco no meio de uma busca a desfaz: o texto volta a dizer o que está escolhido.</dd>
      <dt><code>name</code></dt>
      <dd>Leva ao formulário um valor por escolha, volta ao inicial no reset e não é enviado desabilitado.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Escolha simples com filtro',
      descricao: 'Digite "sao" ou "goias": o filtro ignora caixa e acento.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ComboBox label="Estado" options={ESTADOS} placeholder="Digite para filtrar" />
        </div>
      ),
      codigo: '<ComboBox\n  label="Estado"\n  placeholder="Digite para filtrar"\n  options={estados}\n  onValueChange={setEstado}\n/>',
    },
    {
      titulo: 'Escolha múltipla',
      descricao: 'A lista fica aberta a cada escolha. Backspace no campo vazio remove a última.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <ComboBox
            defaultValue={['sp', 'rj', 'mg']}
            label="Estados atendidos"
            options={ESTADOS}
            placeholder="Digite para filtrar"
            selectionMode="multiple"
          />
        </div>
      ),
      codigo:
        "<ComboBox\n  label=\"Estados atendidos\"\n  placeholder=\"Digite para filtrar\"\n  selectionMode=\"multiple\"\n  options={estados}\n  defaultValue={['sp', 'rj', 'mg']}\n  onValueChange={setEstados}\n/>",
    },
    {
      titulo: 'Busca no servidor',
      descricao: 'Dez mil registros: o produto consulta a cada termo e o campo anuncia a espera.',
      Previa: BuscaNoServidor,
      codigo:
        "function buscar(termo: string) {\n  setCarregando(true);\n  consultar(termo).then((encontrados) => {\n    setOpcoes(encontrados);\n    setCarregando(false);\n  });\n}\n\n<ComboBox\n  label=\"Registro\"\n  options={opcoes}\n  onSearch={buscar}\n  loading={carregando}\n/>",
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <ComboBox label="Estado" options={ESTADOS} placeholder="Digite para filtrar" />
      </div>
    ),
    texto: 'ComboBox quando a lista é longa, precisa de busca ou admite mais de uma escolha.',
  },
  evite: {
    Previa: () => (
      <div className="stack" style={{ width: '100%' }}>
        <ComboBox
          label="Status"
          options={[
            { label: 'Ativo', value: 'ativo' },
            { label: 'Inativo', value: 'inativo' },
          ]}
        />
        <Select
          label="Status"
          options={[
            { label: 'Ativo', value: 'ativo' },
            { label: 'Inativo', value: 'inativo' },
          ]}
        />
      </div>
    ),
    texto: 'Busca para duas opções. Escolha única numa lista curta é o Select, como o de baixo: escolha pelo papel.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['↓'], acao: 'Com a lista fechada, abre e ativa a primeira opção.' },
    { teclas: ['↑', '↓'], acao: 'Opção anterior ou seguinte, com o foco sempre no campo.' },
    { teclas: ['Enter'], acao: 'Escolhe a opção ativa. Na escolha simples, fecha a lista.' },
    { teclas: ['Escape'], acao: 'Fecha a lista e desfaz a busca.' },
    { teclas: ['Backspace'], acao: 'Na escolha múltipla, com o campo vazio, remove a última escolha.' },
    { teclas: ['Home', 'End', 'Espaço'], acao: 'Editam o texto do campo, e não a lista.' },
  ],
  garantias: [
    {
      garantia: 'Autocompletar por lista',
      como: <>Campo com <code>role="combobox"</code>, <code>aria-autocomplete="list"</code> e <code>aria-expanded</code>.</>,
      teste: 'ComboBox.test.tsx',
    },
    {
      garantia: 'Opção ativa',
      como: <>O foco fica no campo, e a opção ativa em <code>aria-activedescendant</code>.</>,
      teste: 'ComboBox.test.tsx',
    },
    { garantia: 'Lista vazia', como: 'Sem correspondência, a mensagem de vazio aparece no painel.', teste: 'ComboBox.test.tsx' },
    {
      garantia: 'Carregamento',
      como: <><code>aria-busy</code> na lista e a mensagem de carregamento no lugar do vazio.</>,
      teste: 'ComboBox.test.tsx',
    },
    {
      garantia: 'Total das escolhas',
      como: 'Na escolha múltipla, o campo é descrito pela contagem e pelos nomes escolhidos.',
      teste: 'ComboBox.test.tsx',
    },
    {
      garantia: 'Campo de formulário',
      como: 'Rótulo, descrição e erro pelo Field; valor, reset e desabilitado no envio.',
      teste: 'formulario.test.tsx',
    },
  ],
  notaDaApi: (
    <>
      As demais propriedades nativas de <code>&lt;input&gt;</code> e o ref vão ao campo de texto, que é o controle. Na
      escolha múltipla, <code>value</code>, <code>defaultValue</code> e <code>onValueChange</code> trabalham com{' '}
      <code>string[]</code>.
    </>
  ),
  api: [
    { nome: 'options', tipo: '{ label: string; value: string; disabled?: boolean }[]', descricao: 'As opções da lista.' },
    { nome: 'selectionMode', tipo: "'single' | 'multiple'", padrao: "'single'", descricao: 'Escolha simples ou múltipla.' },
    { nome: 'value', tipo: 'string | string[]', descricao: 'Chave ou chaves escolhidas, no modo controlado.' },
    { nome: 'defaultValue', tipo: 'string | string[]', descricao: 'Escolha inicial, no modo não controlado.' },
    { nome: 'onValueChange', tipo: '(value: string) => void | (values: string[]) => void', descricao: 'Avisa a escolha, conforme o modo.' },
    { nome: 'onSearch', tipo: '(term: string) => void', descricao: 'Busca externa: avisa o termo e desliga o filtro local.' },
    { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Espera da busca externa.' },
    { nome: 'emptyMessage', tipo: 'string', padrao: "'Nenhum resultado'", descricao: 'Mensagem da lista sem correspondência.' },
    { nome: 'label', tipo: 'string', descricao: 'Rótulo do campo.' },
    { nome: 'placeholder', tipo: 'string', descricao: 'Texto do campo vazio.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Marca o rótulo e barra o envio vazio.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o campo.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Altura do campo.' },
    { nome: 'name', tipo: 'string', descricao: 'Nome do campo no formulário.' },
  ],
};
