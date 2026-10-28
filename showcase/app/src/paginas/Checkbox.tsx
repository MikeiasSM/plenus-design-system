import { useState } from 'react';
import { Button, Checkbox } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const playground = definirPlayground({
  inicial: { label: 'Aceito os termos de uso', hint: '', error: '', indeterminate: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'booleano', nome: 'indeterminate' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <Checkbox
      aria-label={valores.label ? undefined : 'Aceite'}
      disabled={valores.disabled}
      error={valores.error || undefined}
      hint={valores.hint || undefined}
      indeterminate={valores.indeterminate}
      label={valores.label || undefined}
      onChange={(evento) => registrar('onChange: checked=' + evento.currentTarget.checked)}
    />
  ),
  codigo: (valores) =>
    gerarJsx('Checkbox', [
      ['label', valores.label || undefined],
      ['aria-label', valores.label ? undefined : 'Aceite'],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['indeterminate', valores.indeterminate, false],
      ['disabled', valores.disabled, false],
      ['onChange', expr('alternar')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", vindo do rótulo associado.` }
        : {
            nivel: 'atencao',
            titulo: 'Sem rótulo visível',
            detalhe: 'O nome passa a depender de aria-label. Prefira o rótulo visível, que também amplia a área de clique.',
          },
    ];

    if (valores.error && valores.hint) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Ajuda escondida pelo erro',
        detalhe: 'Só uma mensagem aparece: com erro, a ajuda sai. Ponha no erro o que a pessoa precisa para corrigir.',
      });
    }

    if (valores.error) {
      verificacoes.push({ nivel: 'ok', titulo: 'Erro anunciado', detalhe: 'aria-invalid ligado e a mensagem em role="alert".' });
    }

    if (valores.indeterminate) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Estado misto',
        detalhe: 'Vai à propriedade nativa indeterminate, que o leitor de tela anuncia como misto.',
      });
    }

    return verificacoes;
  },
});

const CANAIS = ['E-mail', 'SMS', 'Notificação no aplicativo'];

function MarcarTodos() {
  const [marcados, setMarcados] = useState<string[]>(['E-mail']);
  const todos = marcados.length === CANAIS.length;

  function alternar(canal: string) {
    setMarcados((atuais) => (atuais.includes(canal) ? atuais.filter((item) => item !== canal) : [...atuais, canal]));
  }

  return (
    <div className="stack">
      <Checkbox
        checked={todos}
        indeterminate={marcados.length > 0 && !todos}
        label="Todos os canais"
        onChange={() => setMarcados(todos ? [] : CANAIS)}
      />
      <div className="stack" style={{ paddingInlineStart: 26 }}>
        {CANAIS.map((canal) => (
          <Checkbox checked={marcados.includes(canal)} key={canal} label={canal} onChange={() => alternar(canal)} />
        ))}
      </div>
    </div>
  );
}

function Aceite() {
  const [aceito, setAceito] = useState(false);
  const [tentou, setTentou] = useState(false);

  return (
    <div className="stack">
      <Checkbox
        checked={aceito}
        error={tentou && !aceito ? 'Aceite os termos para continuar.' : undefined}
        label="Li e aceito os termos de uso"
        onChange={(evento) => setAceito(evento.currentTarget.checked)}
      />
      <Button onClick={() => setTentou(true)}>Continuar</Button>
    </div>
  );
}

function Variantes() {
  return (
    <div className="demo-grid">
      <Checkbox label="Desmarcado" />
      <Checkbox defaultChecked label="Marcado" />
      <Checkbox indeterminate label="Indeterminado" />
      <Checkbox hint="No máximo um por semana." label="Com ajuda" />
      <Checkbox error="Campo obrigatório." label="Com erro" />
      <Checkbox disabled label="Desabilitado" />
      <Checkbox defaultChecked disabled label="Desabilitado e marcado" />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>checked</code> ou <code>defaultChecked</code></dt>
      <dd>
        É o checkbox nativo: controlado com <code>checked</code> e <code>onChange</code>, não controlado com{' '}
        <code>defaultChecked</code>. O valor vai ao formulário pelo <code>name</code>, como em qualquer input.
      </dd>
      <dt><code>indeterminate</code></dt>
      <dd>
        Estado visual de escolha parcial, aplicado à propriedade nativa do elemento. Quem decide quando ele vale é o
        produto, normalmente a partir dos itens filhos.
      </dd>
      <dt><code>error</code> e <code>hint</code></dt>
      <dd>
        Uma mensagem por vez abaixo do controle, ligada por <code>aria-describedby</code>. O erro liga{' '}
        <code>aria-invalid</code> e é anunciado ao aparecer.
      </dd>
      <dt>Sem <code>label</code></dt>
      <dd>
        Numa célula de tabela, por exemplo, o nome vem de <code>aria-label</code> ou <code>aria-labelledby</code>.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Marcar todos',
      descricao: 'O pai fica indeterminado enquanto a escolha dos filhos é parcial.',
      Previa: MarcarTodos,
      codigo:
        "<Checkbox\n  label=\"Todos os canais\"\n  checked={todos}\n  indeterminate={marcados.length > 0 && !todos}\n  onChange={alternarTodos}\n/>\n{canais.map((canal) => (\n  <Checkbox\n    key={canal}\n    label={canal}\n    checked={marcados.includes(canal)}\n    onChange={() => alternar(canal)}\n  />\n))}",
    },
    {
      titulo: 'Aceite obrigatório',
      descricao: 'Clique em Continuar sem marcar: o erro aparece junto do controle e é anunciado.',
      Previa: Aceite,
      codigo:
        "<Checkbox\n  label=\"Li e aceito os termos de uso\"\n  checked={aceito}\n  error={tentou && !aceito ? 'Aceite os termos para continuar.' : undefined}\n  onChange={(evento) => setAceito(evento.currentTarget.checked)}\n/>\n<Button onClick={continuar}>Continuar</Button>",
    },
    {
      titulo: 'Preferência com ajuda',
      descricao: 'A ajuda explica a consequência da escolha, sem alongar o rótulo.',
      Previa: () => <Checkbox defaultChecked hint="No máximo um por semana." label="Receber resumo por e-mail" name="resumo" />,
      codigo: '<Checkbox\n  label="Receber resumo por e-mail"\n  hint="No máximo um por semana."\n  name="resumo"\n  defaultChecked\n/>',
    },
  ],
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Leva o foco ao checkbox.' },
    { teclas: ['Espaço'], acao: 'Marca ou desmarca.' },
  ],
  garantias: [
    {
      garantia: 'Semântica nativa',
      como: <>Um <code>&lt;input type="checkbox"&gt;</code> dentro do próprio <code>&lt;label&gt;</code>.</>,
      teste: 'Checkbox.test.tsx',
    },
    { garantia: 'Nome acessível', como: 'O rótulo associado ou, sem ele, aria-label.', teste: 'Checkbox.test.tsx' },
    { garantia: 'Estado misto', como: <>A propriedade <code>indeterminate</code> do elemento nativo.</>, teste: 'Checkbox.test.tsx' },
    {
      garantia: 'Ajuda e erro',
      como: <><code>aria-describedby</code> para a mensagem; com erro, <code>aria-invalid</code> e <code>role="alert"</code>.</>,
      teste: 'Checkbox.test.tsx',
    },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <input>, como checked, defaultChecked, onChange e name, e o ref.',
  api: [
    { nome: 'label', tipo: 'ReactNode', descricao: 'Rótulo visível. Sem ele, use aria-label ou aria-labelledby.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do controle.' },
    { nome: 'error', tipo: 'string', descricao: 'Mensagem de erro; substitui a ajuda e marca o controle como inválido.' },
    { nome: 'indeterminate', tipo: 'boolean', padrao: 'false', descricao: 'Estado de escolha parcial.' },
    { nome: 'onCheckedChange', tipo: '(checked: boolean) => void', descricao: 'A marcação a cada mudança, ao lado do onChange nativo.' },
  ],
};
