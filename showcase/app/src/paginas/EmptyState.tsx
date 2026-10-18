import {
  Button,
  EmptyState,
  IconClose,
  IconPlusCircle,
  type EmptyStateSize,
  type EmptyStateTone,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md', 'lg'] as const;
const TONS = ['neutral', 'danger'] as const;

const playground = definirPlayground({
  inicial: {
    size: 'md',
    tone: 'neutral',
    title: 'Nenhum registro encontrado',
    description: 'Ajuste a busca ou os filtros.',
    acoes: true,
  },
  controles: [
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'opcoes', nome: 'tone', opcoes: TONS },
    { tipo: 'texto', nome: 'title' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'booleano', nome: 'acoes' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%' }}>
      <EmptyState
        actions={
          valores.acoes && (
            <>
              <Button onClick={() => registrar('Limpar filtros: onClick')} variant="secondary">Limpar filtros</Button>
              <Button onClick={() => registrar('Novo registro: onClick')}>Novo registro</Button>
            </>
          )
        }
        description={valores.description || undefined}
        size={valores.size as EmptyStateSize}
        title={valores.title}
        tone={valores.tone as EmptyStateTone}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('EmptyState', [
      ['size', valores.size, 'md'],
      ['tone', valores.tone, 'neutral'],
      ['title', valores.title],
      ['description', valores.description || undefined],
      ['actions', valores.acoes ? expr('acoes') : undefined],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.title.trim()
        ? { nivel: 'ok', titulo: 'Texto legível', detalhe: 'O título fala; ícone e cartões ficam fora da leitura.' }
        : { nivel: 'falha', titulo: 'Sem título', detalhe: 'O ícone é decorativo: sem title, o vazio não diz nada.' },
      valores.tone === 'danger'
        ? { nivel: 'ok', titulo: 'Falha anunciada', detalhe: 'role="alert": o leitor de tela lê o bloco assim que aparece.' }
        : { nivel: 'ok', titulo: 'Sem interrupção', detalhe: 'O vazio comum não interrompe o leitor de tela.' },
    ];

    if (valores.tone === 'danger' && !valores.acoes) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Falha sem saída',
        detalhe: 'Diga o que fazer: uma ação como tentar de novo.',
      });
    }

    return verificacoes;
  },
});

function Variantes() {
  return (
    <div className="stack">
      <EmptyState description="Tente outro termo de busca." size="sm" title="Nenhum estado encontrado" />
      <EmptyState
        actions={<Button variant="secondary">Limpar filtros</Button>}
        description="Não há registros para exibir. Se houver busca ou filtros aplicados, experimente ajustá-los."
        title="Nenhum registro encontrado"
      />
      <EmptyState
        actions={<Button size="lg">Criar coleção</Button>}
        description="Coleções agrupam seções e documentos e definem quem pode ver cada um."
        icon={<IconPlusCircle />}
        size="lg"
        title="Nenhuma coleção ainda"
      />
      <p className="note">
        O pequeno serve a listas, painéis e gráficos, sem os cartões; o médio, a tabelas e cartões; o grande, a uma
        página inteira.
      </p>
    </div>
  );
}

function Modos() {
  return (
    <>
      <div className="subsection">
        <h3>Falha ao carregar</h3>
        <EmptyState
          actions={<Button variant="secondary">Tentar de novo</Button>}
          description="A conexão com o servidor falhou. Seus dados estão seguros; tente de novo em instantes."
          icon={<IconClose />}
          title="Não foi possível carregar os registros"
          tone="danger"
        />
        <p className="note">
          No tom <code>danger</code> o bloco sai com <code>role=&quot;alert&quot;</code> e sem os cartões, porque a falha
          não é conteúdo a caminho.
        </p>
      </div>
      <div className="subsection">
        <h3>Movimento</h3>
        <p className="note">
          Os cartões atrás do ícone flutuam devagar e param quando o sistema pede movimento reduzido. Ícone e cartões ficam
          fora da leitura; quem fala é o texto.
        </p>
      </div>
    </>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Busca sem resultado',
      descricao: 'Num painel ou lista, o pequeno: sem cartões, só o ícone e a frase.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <EmptyState description="Tente outro termo de busca." size="sm" title="Nenhum cliente encontrado" />
        </div>
      ),
      codigo: '<EmptyState\n  size="sm"\n  title="Nenhum cliente encontrado"\n  description="Tente outro termo de busca."\n/>',
    },
    {
      titulo: 'Primeiro uso',
      descricao: 'Ícone próprio e a ação que cria o primeiro item.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <EmptyState
            actions={<Button>Criar coleção</Button>}
            description="Coleções agrupam seções e documentos e definem quem pode ver cada um."
            icon={<IconPlusCircle />}
            title="Nenhuma coleção ainda"
          />
        </div>
      ),
      codigo:
        '<EmptyState\n  icon={<IconPlusCircle />}\n  title="Nenhuma coleção ainda"\n  description="Coleções agrupam seções e documentos e definem quem pode ver cada um."\n  actions={<Button>Criar coleção</Button>}\n/>',
    },
    {
      titulo: 'Lista que não carregou',
      descricao: 'No lugar do conteúdo que faltou, em tom de erro, com a saída.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <EmptyState
            actions={<Button variant="secondary">Tentar de novo</Button>}
            icon={<IconClose />}
            size="sm"
            title="Não foi possível carregar os registros"
            tone="danger"
          />
        </div>
      ),
      codigo:
        '<EmptyState\n  tone="danger"\n  size="sm"\n  icon={<IconClose />}\n  title="Não foi possível carregar os registros"\n  actions={<Button variant="secondary" onClick={recarregar}>Tentar de novo</Button>}\n/>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <EmptyState
          actions={<Button variant="secondary">Tentar de novo</Button>}
          icon={<IconClose />}
          size="sm"
          title="Não foi possível carregar os registros"
          tone="danger"
        />
      </div>
    ),
    texto: 'No lugar de uma lista que não carregou, EmptyState em tom de erro: diz por que o conteúdo não está ali e o que fazer.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <EmptyState size="sm" title="Não foi possível salvar" tone="danger" />
      </div>
    ),
    texto: 'EmptyState para a falha ao salvar um formulário. Ela acompanha um conteúdo que continua ali: é Alert.',
  },
  Variantes,
  Modos,
  garantias: [
    {
      garantia: 'Anúncio só na falha',
      como: <>O vazio comum não interrompe; <code>tone=&quot;danger&quot;</code> sai com <code>role=&quot;alert&quot;</code>.</>,
      teste: 'EmptyState.test.tsx',
    },
    { garantia: 'Decoração fora da leitura', como: <>Ícone e cartões com <code>aria-hidden</code>.</>, teste: 'EmptyState.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref, no elemento de fora.',
  api: [
    { nome: 'title', tipo: 'ReactNode', descricao: 'Obrigatório. O que falta, em uma frase.' },
    { nome: 'description', tipo: 'ReactNode', descricao: 'Por que falta e o que fazer.' },
    { nome: 'actions', tipo: 'ReactNode', descricao: 'Uma ou duas ações: a secundária antes da principal.' },
    { nome: 'icon', tipo: 'ReactNode', padrao: '<IconSearch />', descricao: 'Ícone no centro; decorativo.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Lista ou painel, tabela ou cartão, página inteira.' },
    { nome: 'tone', tipo: "'neutral' | 'danger'", padrao: "'neutral'", descricao: 'danger para a falha ao carregar.' },
  ],
};
