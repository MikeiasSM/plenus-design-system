import { useState } from 'react';
import { Button, Steps, type StepItem } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const ETAPAS_DO_EMAIL: StepItem[] = [
  { key: 'conta', label: 'Conta', description: 'Remetente e nome' },
  { key: 'servidor', label: 'Servidor', description: 'Endereço e porta' },
  { key: 'seguranca', label: 'Segurança', description: 'TLS e credenciais' },
  { key: 'teste', label: 'Teste', description: 'Envio de prova' },
];

const CHAVES = ETAPAS_DO_EMAIL.map((etapa) => etapa.key);

function EtapasDoPlayground({
  descricoes,
  inicial,
  label,
  livre,
  registrar,
}: {
  descricoes: boolean;
  inicial: string;
  label: string;
  livre: boolean;
  registrar: (evento: string) => void;
}) {
  const [atual, setAtual] = useState(inicial);
  const itens = descricoes ? ETAPAS_DO_EMAIL : ETAPAS_DO_EMAIL.map(({ key, label }) => ({ key, label }));

  return (
    <Steps
      current={atual}
      items={itens}
      label={label}
      onCurrentChange={
        livre
          ? (chave) => {
              registrar(`onCurrentChange: ${chave}`);
              setAtual(chave);
            }
          : undefined
      }
    />
  );
}

const playground = definirPlayground({
  inicial: { label: 'Etapas do e-mail', current: 'servidor', livre: true, descricoes: true },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'current', opcoes: CHAVES },
    { tipo: 'booleano', nome: 'livre' },
    { tipo: 'booleano', nome: 'descricoes' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <EtapasDoPlayground
        descricoes={valores.descricoes}
        inicial={valores.current}
        key={valores.current}
        label={valores.label}
        livre={valores.livre}
        registrar={registrar}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Steps', [
      ['label', valores.label],
      ['items', expr('etapas')],
      ['current', valores.livre ? expr('etapa') : valores.current],
      ['onCurrentChange', valores.livre ? expr('setEtapa') : undefined],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Navegação nomeada', detalhe: `<nav aria-label="${valores.label.trim()}">.` }
        : { nivel: 'falha', titulo: 'Navegação sem nome', detalhe: 'label é obrigatório: distingue esta região das outras <nav>.' },
      { nivel: 'ok', titulo: 'Posição anunciada', detalhe: 'A atual leva aria-current="step"; as anteriores, ", concluída" para o leitor de tela.' },
      valores.livre
        ? { nivel: 'ok', titulo: 'Navegação livre', detalhe: 'Com onCurrentChange, cada etapa é um botão.' }
        : { nivel: 'ok', titulo: 'Só indicador', detalhe: 'Sem onCurrentChange, as etapas são texto; avançar e voltar ficam no produto.' },
    ];

    return verificacoes;
  },
});

function Assistente() {
  const [indice, setIndice] = useState(0);
  const etapa = ETAPAS_DO_EMAIL[indice];

  return (
    <div className="stack" style={{ width: '100%' }}>
      <Steps current={etapa.key} items={ETAPAS_DO_EMAIL} label="Etapas do e-mail" />
      <div className="demo-box">
        <strong>{etapa.label}</strong>
        <p className="note">{etapa.description}</p>
      </div>
      <div className="demo-row" style={{ justifyContent: 'flex-end' }}>
        <Button disabled={indice === 0} onClick={() => setIndice(indice - 1)} variant="secondary">
          Voltar
        </Button>
        <Button disabled={indice === ETAPAS_DO_EMAIL.length - 1} onClick={() => setIndice(indice + 1)}>
          Avançar
        </Button>
      </div>
    </div>
  );
}

function Livre() {
  const [etapa, setEtapa] = useState('seguranca');

  return (
    <div style={{ width: '100%' }}>
      <Steps current={etapa} items={ETAPAS_DO_EMAIL} label="Etapas do e-mail" onCurrentChange={setEtapa} />
    </div>
  );
}

function Variantes() {
  return (
    <div>
      {CHAVES.map((chave) => (
        <div className="subsection" key={chave}>
          <h3>
            <code>current=&quot;{chave}&quot;</code>
          </h3>
          <Steps current={chave} items={ETAPAS_DO_EMAIL} label={`Etapas do e-mail, em ${chave}`} />
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Só indicador</dt>
      <dd>Sem <code>onCurrentChange</code>, as etapas são texto e mostram onde a pessoa está.</dd>
      <dt>Navegação livre</dt>
      <dd>Com <code>onCurrentChange</code>, cada etapa vira botão, para quem pode ir e voltar livremente.</dd>
      <dt>Estados</dt>
      <dd>
        As anteriores à atual contam como concluídas, com o visto; a atual leva <code>aria-current=&quot;step&quot;</code>;
        as seguintes ficam por vir.
      </dd>
      <dt>Celular</dt>
      <dd>As etapas empilham, com a linha na vertical.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Assistente com avançar e voltar',
      descricao: 'O Steps só indica; o conteúdo da etapa e os botões são do produto.',
      Previa: Assistente,
      codigo:
        '<Steps label="Etapas do e-mail" items={etapas} current={etapa.key} />\n<FormularioDaEtapa etapa={etapa} />\n<Button variant="secondary" onClick={voltar}>Voltar</Button>\n<Button onClick={avancar}>Avançar</Button>',
    },
    {
      titulo: 'Navegação livre',
      descricao: 'Clique em qualquer etapa: com onCurrentChange, cada uma é botão.',
      Previa: Livre,
      codigo: '<Steps\n  label="Etapas do e-mail"\n  items={etapas}\n  current={etapa}\n  onCurrentChange={setEtapa}\n/>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Steps current="servidor" items={ETAPAS_DO_EMAIL} label="Etapas do e-mail" />
      </div>
    ),
    texto: 'Steps para um processo em sequência, em que as etapas anteriores contam como concluídas.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Steps
          current="notificacoes"
          items={[
            { key: 'perfil', label: 'Perfil' },
            { key: 'notificacoes', label: 'Notificações' },
            { key: 'seguranca', label: 'Segurança' },
          ]}
          label="Preferências"
        />
      </div>
    ),
    texto: 'Steps para seções equivalentes, sem ordem: o Perfil não está "concluído". Painéis equivalentes são Tabs.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Com onCurrentChange, percorre as etapas; sem ele, o indicador não recebe foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Vai à etapa, na navegação livre.' },
  ],
  garantias: [
    {
      garantia: 'Etapa atual',
      como: <><code>aria-current=&quot;step&quot;</code> na atual, dentro de uma <code>&lt;nav&gt;</code> nomeada.</>,
      teste: 'Steps.test.tsx',
    },
    { garantia: 'Concluídas anunciadas', como: 'As anteriores somam ", concluída" ao texto, não só o visto.', teste: 'Steps.test.tsx' },
    { garantia: 'Botão só quando navega', como: <>Sem <code>onCurrentChange</code>, nenhum botão é criado.</>, teste: 'Steps.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <nav> e o ref, exceto children.',
  api: [
    { nome: 'items', tipo: 'readonly StepItem[]', descricao: <>Cada etapa: <code>key</code>, <code>label</code> e <code>description</code>.</> },
    { nome: 'current', tipo: 'string', descricao: 'Chave da etapa atual, no modo controlado.' },
    { nome: 'defaultCurrent', tipo: 'string', descricao: 'Etapa inicial, no modo não controlado. Sem ela, a primeira.' },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Nome da navegação.' },
    { nome: 'onCurrentChange', tipo: '(key: string) => void', descricao: 'Com ela, cada etapa vira botão.' },
    { nome: 'onStepChange', tipo: '(key: string) => void', descricao: <>Obsoleto: use <code>onCurrentChange</code>.</> },
  ],
};
