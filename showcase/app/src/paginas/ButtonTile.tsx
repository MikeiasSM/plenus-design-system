import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  ButtonTile,
  IconAlignLeft,
  IconCalendar,
  IconChartBar,
  IconCheckCircle,
  IconDesktop,
  IconFile,
  IconLink,
  IconMobile,
  IconStructure,
  IconTablet,
  IconUpload,
  type ButtonTileSize,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md'] as const;
const SELECOES = ['ausente', 'false', 'true'] as const;
const ICONES: Record<string, ReactNode> = {
  IconFile: <IconFile />,
  IconChartBar: <IconChartBar />,
  IconCalendar: <IconCalendar />,
  IconUpload: <IconUpload />,
  IconStructure: <IconStructure />,
};

const grade = (largura: number): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, minmax(${largura}px, 1fr))`,
  gap: 8,
  width: '100%',
});

const BLOCOS = [
  { chave: 'texto', rotulo: 'Texto', descricao: 'Parágrafo de texto corrido.', icone: <IconAlignLeft /> },
  { chave: 'arquivo', rotulo: 'Arquivo', descricao: 'Anexa um arquivo para download.', icone: <IconFile /> },
  { chave: 'grafico', rotulo: 'Gráfico', descricao: 'Barras, linhas ou pizza a partir de uma tabela.', icone: <IconChartBar /> },
  { chave: 'link', rotulo: 'Link para outro documento', descricao: 'Cartão com o título do documento ligado.', icone: <IconLink /> },
  { chave: 'data', rotulo: 'Data', descricao: 'Data escrita por extenso.', icone: <IconCalendar /> },
  {
    chave: 'estrutura',
    rotulo: 'Sumário com os títulos de todas as seções',
    descricao: 'Índice gerado dos títulos do documento.',
    icone: <IconStructure />,
  },
];

const playground = definirPlayground({
  inicial: {
    icon: 'IconFile',
    label: 'Arquivo',
    description: 'Anexa um arquivo para download.',
    size: 'md',
    selected: 'ausente',
    disabled: false,
  },
  controles: [
    { tipo: 'opcoes', nome: 'icon', opcoes: Object.keys(ICONES) },
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'description' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'opcoes', nome: 'selected', opcoes: SELECOES },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: valores.size === 'sm' ? 88 : 120 }}>
      <ButtonTile
        description={valores.description || undefined}
        disabled={valores.disabled}
        icon={ICONES[valores.icon]}
        label={valores.label}
        onClick={() => registrar('onClick')}
        selected={valores.selected === 'ausente' ? undefined : valores.selected === 'true'}
        size={valores.size as ButtonTileSize}
        style={{ width: '100%' }}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('ButtonTile', [
      ['icon', expr(`<${valores.icon} />`)],
      ['label', valores.label],
      ['description', valores.description || undefined],
      ['size', valores.size, 'md'],
      ['selected', valores.selected === 'ausente' ? undefined : valores.selected === 'true'],
      ['disabled', valores.disabled, false],
      ['onClick', expr('inserir')],
    ]),
  verificar: (valores) => {
    const nome = valores.label.trim();
    const verificacoes: Verificacao[] = [
      nome
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${nome}", o mesmo texto que aparece no ladrilho.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'label é obrigatório: é o texto visível e o nome do botão.' },
      valores.description.trim()
        ? { nivel: 'ok', titulo: 'Descrição', detalhe: 'Mostrada como dica no foco e no ponteiro, e ligada por aria-describedby.' }
        : { nivel: 'ok', titulo: 'Sem descrição', detalhe: 'O rótulo basta quando diz o que o ladrilho faz.' },
    ];

    if (valores.selected !== 'ausente') {
      verificacoes.push({ nivel: 'ok', titulo: 'Botão que alterna', detalhe: `aria-pressed="${valores.selected}".` });
    }

    if (nome.length > 40) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Rótulo longo', detalhe: 'Passa de duas linhas e é cortado com reticências.' });
    }

    if (valores.disabled) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Desabilitado',
        detalhe: 'Sai da tabulação. Diga perto dele por que a opção não está disponível.',
      });
    }

    return verificacoes;
  },
});

function BibliotecaDeBlocos() {
  return (
    <div style={grade(96)}>
      {BLOCOS.map((bloco) => (
        <ButtonTile description={bloco.descricao} icon={bloco.icone} key={bloco.chave} label={bloco.rotulo} />
      ))}
    </div>
  );
}

const DISPOSITIVOS = [
  { chave: 'computador', rotulo: 'Computador', icone: <IconDesktop /> },
  { chave: 'tablet', rotulo: 'Tablet', icone: <IconTablet /> },
  { chave: 'celular', rotulo: 'Celular', icone: <IconMobile /> },
];

function PreviaPorDispositivo() {
  const [atual, setAtual] = useState('computador');

  return (
    <div role="group" aria-label="Prévia por dispositivo" style={grade(88)}>
      {DISPOSITIVOS.map((dispositivo) => (
        <ButtonTile
          icon={dispositivo.icone}
          key={dispositivo.chave}
          label={dispositivo.rotulo}
          onClick={() => setAtual(dispositivo.chave)}
          selected={atual === dispositivo.chave}
          size="sm"
        />
      ))}
    </div>
  );
}

function Variantes() {
  return (
    <div className="matrix">
      <div className="matrix-row matrix-head">
        <span>size</span>
        <span>comum</span>
        <span>selected</span>
        <span>disabled</span>
        <span>duas linhas</span>
      </div>
      {TAMANHOS.map((tamanho) => (
        <div className="matrix-row" key={tamanho}>
          <code>{tamanho}</code>
          <span>
            <ButtonTile icon={<IconFile />} label="Arquivo" size={tamanho} />
          </span>
          <span>
            <ButtonTile icon={<IconCheckCircle />} label="Concluído" selected size={tamanho} />
          </span>
          <span>
            <ButtonTile disabled icon={<IconUpload />} label="Enviar" size={tamanho} />
          </span>
          <span style={{ width: tamanho === 'sm' ? 88 : 112 }}>
            <ButtonTile icon={<IconStructure />} label="Sumário com os títulos de todas as seções" size={tamanho} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>label</code></dt>
      <dd>Obrigatório. É o texto visível e o nome do botão. Quebra em até duas linhas; o que passa vira reticências.</dd>
      <dt>Mesma altura</dt>
      <dd>
        O ladrilho reserva a altura de duas linhas de rótulo e centraliza o conteúdo: numa grade, os de uma linha e os de
        duas medem igual.
      </dd>
      <dt><code>description</code></dt>
      <dd>
        Mostrada como dica do Tooltip no foco e, com o ponteiro, depois de meio segundo; enquanto visível, fica ligada por
        <code> aria-describedby</code>.
      </dd>
      <dt><code>selected</code></dt>
      <dd>
        Só para o ladrilho que alterna: vira <code>aria-pressed</code> e mostra o estado ligado. Sem ele, o ladrilho é um
        botão comum, sem estado.
      </dd>
      <dt><code>disabled</code></dt>
      <dd>Desabilita o botão nativo: sai da ordem de tabulação e não dispara eventos.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Biblioteca de blocos',
      descricao: 'Grade de ladrilhos de inserção. Rótulos longos quebram em duas linhas e todos medem igual.',
      Previa: BibliotecaDeBlocos,
      codigo:
        '<div className="grade">\n  {blocos.map((bloco) => (\n    <ButtonTile\n      key={bloco.chave}\n      icon={bloco.icone}\n      label={bloco.rotulo}\n      description={bloco.descricao}\n      onClick={() => inserir(bloco)}\n    />\n  ))}\n</div>',
    },
    {
      titulo: 'Ladrilhos que alternam',
      descricao: 'Com selected, cada ladrilho anuncia aria-pressed e o escolhido fica marcado.',
      Previa: PreviaPorDispositivo,
      codigo:
        '<div role="group" aria-label="Prévia por dispositivo">\n  {dispositivos.map((dispositivo) => (\n    <ButtonTile\n      key={dispositivo.chave}\n      icon={dispositivo.icone}\n      label={dispositivo.rotulo}\n      selected={atual === dispositivo.chave}\n      size="sm"\n      onClick={() => setAtual(dispositivo.chave)}\n    />\n  ))}\n</div>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={grade(96)}>
        <ButtonTile icon={<IconFile />} label="Arquivo" />
        <ButtonTile icon={<IconChartBar />} label="Gráfico" />
        <ButtonTile icon={<IconCalendar />} label="Data" />
      </div>
    ),
    texto: 'Ladrilhos numa grade de opções do mesmo tipo, com rótulos curtos que dizem o que se insere.',
  },
  evite: {
    Previa: () => <ButtonTile icon={<IconCheckCircle />} label="Salvar alterações" />,
    texto: 'Ladrilho como botão de ação de formulário. Para uma ação isolada, Button; só ícone, ButtonIcon.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Leva o foco ao ladrilho e mostra a descrição como dica.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona o ladrilho; com selected, alterna.' },
    { teclas: ['Escape'], acao: 'Fecha a dica, com o foco no ladrilho.' },
  ],
  garantias: [
    { garantia: 'Semântica nativa', como: <>Elemento <code>&lt;button&gt;</code>, com <code>type=&quot;button&quot;</code>.</>, teste: 'ButtonTile.test.tsx' },
    { garantia: 'Nome acessível', como: 'O rótulo visível é o nome; o ícone fica fora da leitura.', teste: 'ButtonTile.test.tsx' },
    { garantia: 'Descrição', como: <>A dica fica ligada por <code>aria-describedby</code>, somada à do consumidor.</>, teste: 'ButtonTile.test.tsx' },
    { garantia: 'Estado exposto', como: <><code>aria-pressed</code> só quando o ladrilho alterna.</>, teste: 'ButtonTile.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <button>, exceto aria-label, aria-pressed e children, e o ref.',
  api: [
    { nome: 'icon', tipo: 'ReactNode', descricao: 'Obrigatória. Ícone acima do rótulo; fica fora da leitura.' },
    { nome: 'label', tipo: 'string', descricao: 'Obrigatória. Texto visível e nome do botão, em até duas linhas.' },
    { nome: 'description', tipo: 'string', descricao: 'Dica no foco e no ponteiro, ligada por aria-describedby.' },
    { nome: 'selected', tipo: 'boolean', descricao: 'Para o ladrilho que alterna: vira aria-pressed.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Ícone de 20 ou 24px e rótulo em caption ou label.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o botão nativo.' },
    { nome: 'type', tipo: "'button' | 'submit' | 'reset'", padrao: "'button'", descricao: 'Envio de formulário só quando pedido.' },
  ],
};
