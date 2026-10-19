import { useMemo, useState, type ComponentType } from 'react';
import * as ds from '@plenustech/design-system';
import * as suite from '@plenustech/design-system/icons';
import {
  Button,
  ButtonIcon,
  IconArrowUp,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconClose,
  IconExclamationCircle,
  IconExclamationTriangle,
  IconPlusCircle,
  IconSearch,
  InputText,
  SegmentedControl,
  type IconProps,
} from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

// Todos os icones exportados pelo pacote: um icone novo entra na grade sem editar esta pagina.
const ICONES = Object.fromEntries(
  Object.entries(ds).filter(([nome]) => /^Icon[A-Z]/.test(nome)),
) as Record<string, ComponentType<IconProps>>;
const NOMES = Object.keys(ICONES);

const SUITE = Object.entries(suite).filter(([nome]) => /^Icon[A-Z0-9]/.test(nome)) as [string, ComponentType<IconProps>][];
const POR_PAGINA = 120;

// Os oito nomes que existem nos dois conjuntos com desenhos diferentes: no principal, o nome diz o significado.
const DIFERENCAS: [string, string][] = [
  ['IconAlignCenter', 'IconTextCenter'],
  ['IconCalendar', 'IconCalendarFill'],
  ['IconCheck', 'IconCheckLg'],
  ['IconClock', 'IconClockFill'],
  ['IconFile', 'IconFileEarmark'],
  ['IconFilter', 'IconFunnel'],
  ['IconLink', 'IconLink45deg'],
  ['IconPlus', 'IconPlusLg'],
];

const normalizar = (texto: string) => texto.toLowerCase().replace(/[^a-z0-9]/g, '');

function SuiteCompleta() {
  const [termo, setTermo] = useState('');
  const [estilo, setEstilo] = useState('todos');
  const [limite, setLimite] = useState(POR_PAGINA);
  const [copiado, setCopiado] = useState('');
  const achados = useMemo(() => {
    const busca = normalizar(termo);

    return SUITE.filter(([nome]) => {
      const preenchido = nome.endsWith('Fill');

      if (estilo === 'contorno' && preenchido) return false;
      if (estilo === 'preenchido' && !preenchido) return false;

      return !busca || normalizar(nome).includes(busca);
    });
  }, [estilo, termo]);

  function copiar(nome: string) {
    const linha = `import { ${nome} } from '@plenustech/design-system/icons';`;

    navigator.clipboard?.writeText(linha).then(
      () => setCopiado(`Copiado: ${linha}`),
      () => setCopiado(linha),
    );
  }

  return (
    <div className="stack">
      <div className="demo-row">
        <InputText
          icon={<IconSearch />}
          label="Buscar ícone"
          onChange={(evento) => {
            setTermo(evento.currentTarget.value);
            setLimite(POR_PAGINA);
          }}
          placeholder="folder, truck, cash, book"
          size="sm"
          value={termo}
        />
        <SegmentedControl
          items={[
            { label: 'Todos', value: 'todos' },
            { label: 'Contorno', value: 'contorno' },
            { label: 'Preenchido', value: 'preenchido' },
          ]}
          label="Estilo"
          onValueChange={(valor) => {
            setEstilo(valor);
            setLimite(POR_PAGINA);
          }}
          size="sm"
          value={estilo}
        />
      </div>
      <p className="note" role="status">
        {copiado || `${achados.length.toLocaleString('pt-BR')} de ${SUITE.length.toLocaleString('pt-BR')} ícones. Clique para copiar o import.`}
      </p>
      <div className="icon-grid">
        {achados.slice(0, limite).map(([nome, Desenho]) => (
          <button aria-label={`Copiar o import de ${nome}`} className="icon-cell" key={nome} onClick={() => copiar(nome)} type="button">
            <Desenho size={20} />
            <code>{nome}</code>
          </button>
        ))}
      </div>
      {achados.length > limite && (
        <ds.Button onClick={() => setLimite((atual) => atual + POR_PAGINA)} size="sm" variant="secondary">
          Mostrar mais {Math.min(POR_PAGINA, achados.length - limite)}
        </ds.Button>
      )}
    </div>
  );
}

const playground = definirPlayground({
  inicial: { icone: 'IconCalendar', size: 24, label: '' },
  controles: [
    { tipo: 'opcoes', nome: 'icone', opcoes: NOMES },
    { tipo: 'numero', nome: 'size', min: 12, max: 64, passo: 4 },
    { tipo: 'texto', nome: 'label' },
  ],
  renderizar: (valores) => {
    const Desenho = ICONES[valores.icone];

    return <Desenho label={valores.label || undefined} size={valores.size} />;
  },
  codigo: (valores) =>
    gerarJsx(valores.icone, [
      ['size', valores.size],
      ['label', valores.label || undefined],
    ]),
  verificar: (valores) => {
    const nome = valores.label.trim();

    return [
      nome
        ? { nivel: 'ok', titulo: 'Nomeado', detalhe: `role="img" com o nome "${nome}". Use quando o ícone carrega o sentido sozinho.` }
        : {
            nivel: 'ok',
            titulo: 'Decorativo',
            detalhe: 'aria-hidden: fora da árvore de acessibilidade. Certo quando o texto ao lado diz o mesmo.',
          },
      { nivel: 'ok', titulo: 'Fora da tabulação', detalhe: 'focusable="false": o foco pertence ao controle, não ao ícone.' },
    ] satisfies Verificacao[];
  },
});

function Variantes() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>A suíte completa</h3>
        <p className="note">
          Os 2.050 ícones do Bootstrap Icons, pelo nome do desenho, em <code>@plenustech/design-system/icons</code>. Servem
          para categorizar conteúdo — assuntos, tipos de documento, seções — além das ações de interface. O bundle leva só
          os importados.
        </p>
        <SuiteCompleta />
      </div>
      <div className="subsection">
        <h3>Nomes que diferem entre os dois conjuntos</h3>
        <p className="note">
          O ponto de entrada principal mantém os ícones de interface pelo significado. Oito nomes existem nos dois com
          desenhos diferentes; o da suíte é o desenho do Bootstrap com esse nome.
        </p>
        <ds.Card>
          <ds.Card.Body flush>
            <ds.Table label="Nomes que diferem entre os dois conjuntos">
              <ds.Table.Header>
                <ds.Table.Column id="principal">Principal</ds.Table.Column>
                <ds.Table.Column id="suite">Mesmo desenho na suíte</ds.Table.Column>
              </ds.Table.Header>
              <ds.Table.Body items={DIFERENCAS.map(([principal, naSuite]) => ({ id: principal, naSuite }))}>
                {(linha) => (
                  <ds.Table.Row id={linha.id}>
                    <ds.Table.Cell><code>{linha.id}</code></ds.Table.Cell>
                    <ds.Table.Cell><code>{linha.naSuite}</code></ds.Table.Cell>
                  </ds.Table.Row>
                )}
              </ds.Table.Body>
            </ds.Table>
          </ds.Card.Body>
        </ds.Card>
      </div>
      <div className="subsection">
        <h3>Os de interface, no ponto de entrada principal</h3>
        <div className="icon-grid">
          {NOMES.map((nome) => {
            const Desenho = ICONES[nome];

            return (
              <span className="icon-cell" key={nome}>
                <Desenho size={20} />
                <code>{nome}</code>
              </span>
            );
          })}
        </div>
        <p className="note">
          Os caminhos vêm do Bootstrap Icons, sob licença MIT. Estes são os de interface, nomeados pelo significado; onde
          existe variante preenchida e ela lê bem no tamanho de interface, é a preenchida que vale.
        </p>
      </div>
      <div className="subsection">
        <h3>Tamanho e cor</h3>
        <div className="demo-row">
          <span style={{ fontSize: 12 }}><IconCalendar /> 12px</span>
          <span style={{ fontSize: 16 }}><IconCalendar /> 16px</span>
          <span style={{ fontSize: 24 }}><IconCalendar /> 24px</span>
          <span style={{ color: 'var(--pl-color-danger)' }}><IconClose size={20} /></span>
          <span style={{ color: 'var(--pl-color-success)' }}><IconArrowUp size={20} /></span>
        </div>
        <p className="note">
          Sem medida declarada, o ícone acompanha o tamanho do texto ao redor, em <code>1em</code>. A cor vem sempre de{' '}
          <code>currentColor</code>: ele herda a cor de onde está em vez de fixar a própria.
        </p>
      </div>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Decorativo</dt>
      <dd>
        Sem <code>label</code>, sai com <code>aria-hidden</code> e sem papel. É o caso sempre que houver texto ao lado dizendo a
        mesma coisa.
      </dd>
      <dt>Nomeado</dt>
      <dd>
        Com <code>label</code>, ganha <code>role=&quot;img&quot;</code> e nome acessível, para quando carrega o significado
        sozinho.
      </dd>
      <dt>Num botão</dt>
      <dd>
        O nome é do controle, não do ícone: o <code>ButtonIcon</code> exige <code>label</code> e o ícone dentro dele fica
        decorativo.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Ao lado do texto',
      descricao: 'Decorativo: o texto do botão já diz a ação.',
      Previa: () => (
        <Button>
          <IconPlusCircle />
          Novo registro
        </Button>
      ),
      codigo: '<Button>\n  <IconPlusCircle />\n  Novo registro\n</Button>',
    },
    {
      titulo: 'Botão só de ícone',
      descricao: 'O nome vai no ButtonIcon, que o mostra também como dica.',
      Previa: () => <ButtonIcon icon={<IconClose />} label="Fechar" variant="ghost" />,
      codigo: '<ButtonIcon icon={<IconClose />} label="Fechar" variant="ghost" />',
    },
    {
      titulo: 'Situação sem texto',
      descricao: 'Nomeado: numa coluna estreita, o ícone sozinho diz o estado.',
      Previa: () => (
        <>
          <span style={{ color: 'var(--pl-color-success)' }}>
            <IconCheckCircle label="Concluído" size={20} />
          </span>
          <span style={{ color: 'var(--pl-color-warning)' }}>
            <IconExclamationTriangle label="Pendente" size={20} />
          </span>
          <span style={{ color: 'var(--pl-color-danger)' }}>
            <IconExclamationCircle label="Falhou" size={20} />
          </span>
        </>
      ),
      codigo: '<IconCheckCircle label="Concluído" size={20} />\n<IconExclamationTriangle label="Pendente" size={20} />\n<IconExclamationCircle label="Falhou" size={20} />',
    },
  ],
  faca: {
    Previa: () => (
      <span>
        <IconCalendar /> Vence em 12/11
      </span>
    ),
    texto: 'Sem label quando o texto ao lado já diz o mesmo: o ícone sai da leitura.',
  },
  evite: {
    Previa: () => (
      <span>
        <IconCalendar label="Calendário" /> Vence em 12/11
      </span>
    ),
    texto: 'Nomear o ícone que acompanha texto: o leitor de tela ouve "Calendário" antes de cada data, sem ganho algum.',
  },
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Decorativo fora da leitura', como: <>Sem <code>label</code>, <code>aria-hidden</code> e sem papel.</>, teste: 'icons.test.tsx' },
    { garantia: 'Nome quando sozinho', como: <>Com <code>label</code>, <code>role=&quot;img&quot;</code> e nome acessível.</>, teste: 'icons.test.tsx' },
    { garantia: 'Fora da tabulação', como: <><code>focusable=&quot;false&quot;</code>: o foco é do controle.</>, teste: 'icons.test.tsx' },
    { garantia: 'Cor herdada', como: <><code>fill=&quot;currentColor&quot;</code>.</>, teste: 'icons.test.tsx' },
  ],
  notaDaApi: 'Vale para todos os ícones. Além destas, as propriedades nativas de <svg>, exceto children e viewBox.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Nome acessível. Sem ele, o ícone é decorativo.' },
    { nome: 'size', tipo: 'number | string', padrao: "'1em'", descricao: 'Largura e altura. Sem medida, acompanha o texto ao redor.' },
    { nome: 'className', tipo: 'string', descricao: 'Para o controle girar ou colorir o ícone.' },
  ],
};
