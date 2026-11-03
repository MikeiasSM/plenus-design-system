import { useState } from 'react';
import { InputText, SaveBar } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const playground = definirPlayground({
  inicial: {
    open: true,
    message: 'Alterações não salvas',
    discardLabel: 'Descartar',
    saveLabel: 'Salvar',
    saving: false,
  },
  controles: [
    { tipo: 'booleano', nome: 'open' },
    { tipo: 'texto', nome: 'message' },
    { tipo: 'texto', nome: 'discardLabel' },
    { tipo: 'texto', nome: 'saveLabel' },
    { tipo: 'booleano', nome: 'saving' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <SaveBar
        discardLabel={valores.discardLabel}
        message={valores.message}
        onDiscard={() => registrar('onDiscard')}
        onSave={() => registrar('onSave')}
        open={valores.open}
        saveLabel={valores.saveLabel}
        saving={valores.saving}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('SaveBar', [
      ['open', expr('houveAlteracao')],
      ['message', valores.message, 'Alterações não salvas'],
      ['discardLabel', valores.discardLabel, 'Descartar'],
      ['saveLabel', valores.saveLabel, 'Salvar'],
      ['saving', valores.saving ? expr('salvando') : undefined],
      ['onDiscard', expr('descartar')],
      ['onSave', expr('salvar')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      { nivel: 'ok', titulo: 'Anunciada ao abrir', detalhe: 'A mensagem sai numa região de status; fechada, os botões saem do foco e da leitura.' },
    ];

    if (!valores.message.trim()) {
      verificacoes.push({ nivel: 'falha', titulo: 'Mensagem vazia', detalhe: 'Sem texto, nada é anunciado e a região fica sem nome.' });
    }

    return verificacoes;
  },
});

function Formulario() {
  const [nome, setNome] = useState('Ana Ribeiro');
  const [salvo, setSalvo] = useState('Ana Ribeiro');
  const [salvando, setSalvando] = useState(false);

  function salvar() {
    setSalvando(true);
    window.setTimeout(() => {
      setSalvo(nome);
      setSalvando(false);
    }, 1200);
  }

  return (
    <div className="stack" style={{ maxHeight: 220, overflow: 'auto', width: '100%' }}>
      <SaveBar onDiscard={() => setNome(salvo)} onSave={salvar} open={nome !== salvo} saving={salvando} />
      <div style={{ padding: 16 }}>
        <InputText label="Nome" onChange={(evento) => setNome(evento.currentTarget.value)} value={nome} />
      </div>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>open</code></dt>
      <dd>
        Controlado pelo produto, que sabe se há alteração pendente: a barra não abre nem fecha sozinha. Ela permanece montada
        e desliza ao abrir; com <code>prefers-reduced-motion</code>, aparece sem transição.
      </dd>
      <dt>Posição</dt>
      <dd>
        Fica presa ao topo da área de rolagem em que for montada (<code>position: sticky</code>). Onde montá-la é do
        produto, em geral antes do conteúdo da página.
      </dd>
      <dt><code>saving</code></dt>
      <dd>O salvar fica ocupado e não dispara de novo; o descartar fica desabilitado até terminar.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Formulário com alterações pendentes',
      descricao: 'Edite o nome: a barra abre. Salvar leva 1,2 s; descartar volta ao valor salvo.',
      largo: true,
      Previa: Formulario,
      codigo:
        "<SaveBar\n  open={valor !== salvo}\n  saving={salvando}\n  onDiscard={() => setValor(salvo)}\n  onSave={salvar}\n/>\n<InputText label=\"Nome\" value={valor} onChange={...} />",
    },
  ],
  Modos,
  garantias: [
    { garantia: 'Anunciada', como: <>Uma região <code>role=&quot;status&quot;</code> sempre montada recebe a mensagem ao abrir.</>, teste: 'SaveBar.test.tsx' },
    { garantia: 'Fechada, fora do alcance', como: <>Sem <code>open</code>, os botões ficam <code>inert</code>: nem foco nem leitura.</>, teste: 'SaveBar.test.tsx' },
    { garantia: 'Salvando', como: <>O salvar fica <code>aria-busy</code> e ignora o clique.</>, teste: 'SaveBar.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref.',
  api: [
    { nome: 'open', tipo: 'boolean', descricao: 'Mostra a barra. Controlado pelo produto.' },
    { nome: 'onSave', tipo: '() => void', descricao: 'Clique em salvar.' },
    { nome: 'onDiscard', tipo: '() => void', descricao: 'Clique em descartar.' },
    { nome: 'message', tipo: 'string', padrao: "'Alterações não salvas'", descricao: 'Texto da barra, anunciado ao abrir e nome da região.' },
    { nome: 'saveLabel', tipo: 'string', padrao: "'Salvar'", descricao: 'Texto do botão de salvar.' },
    { nome: 'discardLabel', tipo: 'string', padrao: "'Descartar'", descricao: 'Texto do botão de descartar.' },
    { nome: 'saving', tipo: 'boolean', padrao: 'false', descricao: 'Salvamento em curso.' },
  ],
};
