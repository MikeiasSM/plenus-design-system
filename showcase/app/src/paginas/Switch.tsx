import { useState } from 'react';
import { Switch } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const playground = definirPlayground({
  inicial: { label: 'Notificações por e-mail', hint: '', error: '', defaultChecked: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'booleano', nome: 'defaultChecked' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <Switch
      defaultChecked={valores.defaultChecked}
      disabled={valores.disabled}
      error={valores.error || undefined}
      hint={valores.hint || undefined}
      key={String(valores.defaultChecked)}
      label={valores.label}
      onChange={(evento) => registrar('onChange: checked=' + evento.currentTarget.checked)}
    />
  ),
  codigo: (valores) =>
    gerarJsx('Switch', [
      ['label', valores.label],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['defaultChecked', valores.defaultChecked, false],
      ['disabled', valores.disabled, false],
      ['onChange', expr('alternar')],
    ]),
  verificar: (valores) => {
    const texto = valores.label.trim();
    const verificacoes: Verificacao[] = [
      texto
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${texto}", vindo do rótulo associado.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'O rótulo é obrigatório: é ele que diz o que liga e desliga.' },
      { nivel: 'ok', titulo: 'Papel de switch', detalhe: 'Anunciado como ligado ou desligado, sobre um checkbox nativo.' },
    ];

    if (/^(ativar|ligar|desligar|ativo|on|off)$/i.test(texto)) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Rótulo sem objeto',
        detalhe: 'O estado já é anunciado. Nomeie o que é alternado, como "Notificações por e-mail".',
      });
    }

    if (valores.error && valores.hint) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Ajuda escondida pelo erro', detalhe: 'Só uma mensagem aparece: com erro, a ajuda sai.' });
    }

    return verificacoes;
  },
});

function Densidade() {
  const [compacto, setCompacto] = useState(false);

  return (
    <div className="stack">
      <Switch checked={compacto} label="Modo compacto" onChange={(evento) => setCompacto(evento.currentTarget.checked)} />
      <p className="note">{compacto ? 'A listagem passa a mostrar mais linhas por tela.' : 'A listagem usa o espaçamento padrão.'}</p>
    </div>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <Switch label="Desligado" />
      <Switch defaultChecked label="Ligado" />
      <Switch hint="Acompanha a preferência do sistema." label="Com ajuda" />
      <Switch error="Não foi possível salvar." label="Com erro" />
      <Switch disabled label="Desabilitado" />
      <Switch defaultChecked disabled label="Desabilitado e ligado" />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>checked</code> ou <code>defaultChecked</code></dt>
      <dd>
        Por baixo é um checkbox nativo com <code>role="switch"</code>: controlado com <code>checked</code> e{' '}
        <code>onChange</code>, não controlado com <code>defaultChecked</code>, e enviado pelo <code>name</code>.
      </dd>
      <dt><code>error</code> e <code>hint</code></dt>
      <dd>
        Uma mensagem por vez, ligada por <code>aria-describedby</code>. O erro liga <code>aria-invalid</code> e é
        anunciado ao aparecer.
      </dd>
      <dt><code>disabled</code></dt>
      <dd>Repassado ao controle nativo: sai da tabulação e não muda de estado.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Preferências',
      descricao: 'Cada alternância vale na hora, sem botão de salvar.',
      Previa: () => (
        <div className="stack">
          <Switch defaultChecked label="Notificações por e-mail" />
          <Switch label="Notificações no aplicativo" />
          <Switch defaultChecked hint="Acompanha a preferência do sistema." label="Tema automático" />
        </div>
      ),
      codigo:
        '<Switch label="Notificações por e-mail" defaultChecked />\n<Switch label="Notificações no aplicativo" />\n<Switch\n  label="Tema automático"\n  hint="Acompanha a preferência do sistema."\n  defaultChecked\n/>',
    },
    {
      titulo: 'Efeito imediato na tela',
      descricao: 'Controlado: o produto aplica o estado assim que ele muda.',
      Previa: Densidade,
      codigo:
        '<Switch\n  label="Modo compacto"\n  checked={compacto}\n  onChange={(evento) => setCompacto(evento.currentTarget.checked)}\n/>',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Leva o foco ao switch.' },
    { teclas: ['Espaço'], acao: 'Liga ou desliga.' },
  ],
  garantias: [
    {
      garantia: 'Semântica de switch',
      como: <><code>role="switch"</code> sobre um <code>&lt;input type="checkbox"&gt;</code> nativo.</>,
      teste: 'Switch.test.tsx',
    },
    { garantia: 'Nome acessível', como: 'O rótulo, obrigatório, associado ao controle.', teste: 'Switch.test.tsx' },
    { garantia: 'Ajuda', como: <><code>aria-describedby</code> aponta para a mensagem.</>, teste: 'Switch.test.tsx' },
    { garantia: 'Inválido', como: <>Mantém o <code>aria-invalid</code> que o consumidor declarar.</>, teste: 'Switch.test.tsx' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <input>, como checked, defaultChecked, onChange e name, e o ref.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'O que é alternado. Obrigatório.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do controle.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda e marca o controle como inválido.' },
  ],
};
