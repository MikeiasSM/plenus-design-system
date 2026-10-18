import { Alert, Button, showToast, type ToastOptions, type ToastTone } from '@plenustech/design-system';
import { definirPlayground, type Pagina, type Valores, type Verificacao } from '../estrutura/tipos';

const TONS = ['info', 'success', 'warning', 'danger'] as const;
const DURACOES = ['padrão', '3000', '10000', 'null'] as const;

function duracaoDe(opcao: string) {
  if (opcao === 'padrão') {
    return undefined;
  }

  return opcao === 'null' ? null : Number(opcao);
}

function opcoesDo(valores: Valores, registrar: (evento: string) => void): ToastOptions {
  return {
    title: String(valores.title),
    tone: valores.tone as ToastTone,
    description: String(valores.description) || undefined,
    duration: duracaoDe(String(valores.duration)),
    action: valores.acao ? { label: 'Tentar de novo', onClick: () => registrar('action.onClick') } : undefined,
  };
}

const playground = definirPlayground({
  inicial: {
    tone: 'danger',
    title: 'Falha ao salvar',
    description: 'A conexão falhou. O item continua na fila.',
    acao: true,
    duration: 'padrão',
  },
  controles: [
    { tipo: 'opcoes', nome: 'tone', opcoes: TONS },
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'booleano', nome: 'acao' },
    { tipo: 'opcoes', nome: 'duration', opcoes: DURACOES },
  ],
  renderizar: (valores, registrar) => (
    <Button onClick={() => registrar(`showToast: ${showToast(opcoesDo(valores, registrar))}`)} variant="secondary">
      Mostrar aviso
    </Button>
  ),
  codigo: (valores) => {
    const linhas = [
      valores.tone !== 'info' && `  tone: '${valores.tone}',`,
      `  title: '${valores.title}',`,
      valores.description && `  description: '${valores.description}',`,
      valores.duration !== 'padrão' && `  duration: ${valores.duration},`,
      valores.acao && "  action: { label: 'Tentar de novo', onClick: salvar },",
    ].filter(Boolean);

    return `// Uma vez, na raiz da aplicação\n<ToastRegion />\n\n// Em qualquer lugar\nshowToast({\n${linhas.join('\n')}\n});`;
  },
  verificar: (valores) => {
    const duracao = duracaoDe(valores.duration);
    const verificacoes: Verificacao[] = [
      valores.tone === 'danger' || valores.tone === 'warning'
        ? { nivel: 'ok', titulo: 'Anúncio assertivo', detalhe: 'role="alert", como no Alert.' }
        : { nivel: 'ok', titulo: 'Anúncio educado', detalhe: 'role="status", como no Alert.' },
      { nivel: 'ok', titulo: 'Tempo sob controle', detalhe: 'Ponteiro ou foco dentro do aviso param o tempo, que recomeça ao sair.' },
    ];

    if (!valores.title.trim()) {
      verificacoes.push({ nivel: 'falha', titulo: 'Sem título', detalhe: 'title é obrigatório: é o que o aviso anuncia.' });
    }

    if (valores.tone === 'danger' && duracao !== undefined && duracao !== null) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Erro que some sozinho',
        detalhe: 'O erro fica até ser fechado por padrão: quem não leu a falha não pode perdê-la.',
      });
    }

    return verificacoes;
  },
});

function Variantes() {
  return (
    <div className="demo-row">
      <Button
        onClick={() => showToast({ description: 'As alterações já estão no ar.', title: 'Versão publicada', tone: 'success' })}
        variant="secondary"
      >
        Sucesso
      </Button>
      <Button onClick={() => showToast({ title: 'Sincronização agendada para as 3h' })} variant="secondary">
        Informação
      </Button>
      <Button
        onClick={() => showToast({ description: 'Restam 8% do armazenamento.', title: 'Espaço quase esgotado', tone: 'warning' })}
        variant="secondary"
      >
        Aviso
      </Button>
      <Button
        onClick={() =>
          showToast({
            action: { label: 'Tentar de novo', onClick: () => showToast({ title: 'Salvo na segunda tentativa', tone: 'success' }) },
            description: 'A conexão falhou. O item continua na fila.',
            title: 'Falha ao salvar',
            tone: 'danger',
          })
        }
        variant="secondary"
      >
        Erro com ação
      </Button>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Tempo</dt>
      <dd>
        Sucesso, informação e aviso somem em 6s. O erro fica até ser fechado. <code>duration</code> troca o tempo, em
        milissegundos, e <code>null</code> mantém o aviso.
      </dd>
      <dt>Pausa</dt>
      <dd>Ponteiro ou foco dentro do aviso param o tempo, que recomeça ao sair.</dd>
      <dt>Fila</dt>
      <dd>Ficam à vista os três mais recentes; os de trás aparecem quando um sai.</dd>
      <dt><code>action</code></dt>
      <dd>Um botão só, como tentar de novo. Acioná-lo roda o <code>onClick</code> e fecha o aviso.</dd>
      <dt><code>dismissToast</code></dt>
      <dd><code>showToast</code> devolve o id; <code>dismissToast(id)</code> fecha o aviso antes do tempo.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Publicado',
      descricao: 'Confirma algo que acabou de acontecer e sai sozinho em 6s.',
      Previa: () => (
        <Button onClick={() => showToast({ description: 'As alterações já estão no ar.', title: 'Versão publicada', tone: 'success' })}>
          Publicar
        </Button>
      ),
      codigo:
        "showToast({\n  tone: 'success',\n  title: 'Versão publicada',\n  description: 'As alterações já estão no ar.',\n});",
    },
    {
      titulo: 'Falha com tentar de novo',
      descricao: 'O erro espera ser fechado; a ação tenta de novo e fecha o aviso.',
      Previa: () => (
        <Button
          onClick={() =>
            showToast({
              action: { label: 'Tentar de novo', onClick: () => showToast({ title: 'Salvo na segunda tentativa', tone: 'success' }) },
              description: 'A conexão falhou. O item continua na fila.',
              title: 'Falha ao salvar',
              tone: 'danger',
            })
          }
          variant="secondary"
        >
          Salvar
        </Button>
      ),
      codigo:
        "showToast({\n  tone: 'danger',\n  title: 'Falha ao salvar',\n  description: 'A conexão falhou. O item continua na fila.',\n  action: { label: 'Tentar de novo', onClick: salvar },\n});",
    },
    {
      titulo: 'Copiado',
      descricao: 'Confirmação curta, só com título, em 3s.',
      Previa: () => (
        <Button onClick={() => showToast({ duration: 3000, title: 'Link copiado' })} variant="ghost">
          Copiar link
        </Button>
      ),
      codigo: "showToast({ title: 'Link copiado', duration: 3000 });",
    },
  ],
  faca: {
    Previa: () => (
      <Button onClick={() => showToast({ title: 'Versão publicada', tone: 'success' })} variant="secondary">
        Publicar
      </Button>
    ),
    texto: 'Toast para algo que acabou de acontecer — salvo, publicado, falhou — e não precisa ficar na tela.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Alert title="Espaço quase esgotado" tone="warning">Restam 8% do armazenamento.</Alert>
      </div>
    ),
    texto: 'Toast para uma situação que continua, como o espaço quase esgotado: ela pede um Alert junto do conteúdo, até mudar.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Leva o foco à ação e ao fechar do aviso; com o foco dentro, o tempo para.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona a ação ou fecha o aviso.' },
  ],
  garantias: [
    {
      garantia: 'Anúncio pela urgência',
      como: <>Aviso e erro com <code>role=&quot;alert&quot;</code>; os demais com <code>role=&quot;status&quot;</code>.</>,
      teste: 'Toast.test.tsx',
    },
    { garantia: 'Erro não se perde', como: 'O erro fica até ser fechado.', teste: 'Toast.test.tsx' },
    { garantia: 'Tempo pausável', como: 'Ponteiro em cima para o tempo, que recomeça ao sair.', teste: 'Toast.test.tsx' },
    { garantia: 'Botão de fechar com nome', como: <>Botão nativo com <code>aria-label=&quot;Fechar aviso&quot;</code>.</>, teste: 'Toast.test.tsx' },
  ],
  notaDaApi: (
    <>
      Não há um componente <code>Toast</code>: <code>ToastRegion</code> é montado uma vez na raiz, sem propriedades, e{' '}
      <code>showToast(options)</code> dispara o aviso de qualquer lugar. Estas são as opções.
    </>
  ),
  api: [
    { nome: 'title', tipo: 'string', descricao: 'Obrigatório. O que aconteceu.' },
    { nome: 'description', tipo: 'string', descricao: 'Detalhe em uma frase.' },
    { nome: 'tone', tipo: "'info' | 'success' | 'warning' | 'danger'", padrao: "'info'", descricao: 'Ícone, cor e urgência do anúncio.' },
    {
      nome: 'duration',
      tipo: 'number | null',
      padrao: '6000',
      descricao: <>Milissegundos até sumir; <code>null</code> mantém. No erro, o padrão é <code>null</code>.</>,
    },
    { nome: 'action', tipo: '{ label: string; onClick: () => void }', descricao: 'Ação única; acioná-la fecha o aviso.' },
  ],
};
