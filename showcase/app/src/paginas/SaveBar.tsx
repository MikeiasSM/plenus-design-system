import { useRef, useState } from 'react';
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
  const campo = useRef<HTMLInputElement>(null);

  // Ao fechar, a barra tira os botões do foco: quem decide para onde ele vai é o produto.
  function salvar() {
    setSalvando(true);
    window.setTimeout(() => {
      setSalvo(nome);
      setSalvando(false);
      campo.current?.focus();
    }, 1200);
  }

  function descartar() {
    setNome(salvo);
    campo.current?.focus();
  }

  return (
    <div className="stack" style={{ maxHeight: 220, overflow: 'auto', width: '100%' }}>
      <SaveBar onDiscard={descartar} onSave={salvar} open={nome !== salvo} saving={salvando} />
      <div style={{ padding: 16 }}>
        <InputText label="Nome" ref={campo} onChange={(evento) => setNome(evento.currentTarget.value)} value={nome} />
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
      <dt>Foco ao fechar</dt>
      <dd>
        Fechada, a barra tira os botões do foco, e o foco que estava neles cai no <code>body</code>. A barra não sabe de
        onde a pessoa veio: ao salvar ou descartar, o produto devolve o foco a um ponto do formulário, como o campo editado.
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
      descricao:
        'Edite o nome: a barra abre. Salvar leva 1,2 s; descartar volta ao valor salvo. Nos dois casos o foco volta ao campo, porque a barra fechada sai do foco.',
      largo: true,
      Previa: Formulario,
      codigo:
        "const campo = useRef<HTMLInputElement>(null);\n\n<SaveBar\n  open={valor !== salvo}\n  saving={salvando}\n  onDiscard={() => {\n    setValor(salvo);\n    campo.current?.focus();\n  }}\n  onSave={salvar} // ao terminar, campo.current?.focus()\n/>\n<InputText label=\"Nome\" ref={campo} value={valor} onChange={...} />",
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
