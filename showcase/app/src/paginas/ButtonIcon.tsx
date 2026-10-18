import type { ReactNode } from 'react';
import {
  Button,
  ButtonIcon,
  IconChartBar,
  IconClose,
  IconMinusCircle,
  IconPlusCircle,
  IconSearch,
  InputText,
  type ButtonSize,
  type ButtonVariant,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const VARIANTES = ['primary', 'secondary', 'soft', 'ghost', 'danger'] as const;
const TAMANHOS = ['sm', 'md', 'lg'] as const;
const ALTURAS: Record<ButtonSize, number> = { sm: 28, md: 42, lg: 48 };
const ICONES: Record<string, ReactNode> = {
  IconSearch: <IconSearch />,
  IconClose: <IconClose />,
  IconPlusCircle: <IconPlusCircle />,
  IconMinusCircle: <IconMinusCircle />,
  IconChartBar: <IconChartBar />,
};

const playground = definirPlayground({
  inicial: { icon: 'IconSearch', label: 'Buscar', variant: 'secondary', size: 'md', disabled: false },
  controles: [
    { tipo: 'opcoes', nome: 'icon', opcoes: Object.keys(ICONES) },
    { tipo: 'texto', nome: 'label' },
    { tipo: 'opcoes', nome: 'variant', opcoes: VARIANTES },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <ButtonIcon
      disabled={valores.disabled}
      icon={ICONES[valores.icon]}
      label={valores.label}
      onBlur={() => registrar('onBlur')}
      onClick={() => registrar('onClick')}
      onFocus={() => registrar('onFocus')}
      size={valores.size as ButtonSize}
      variant={valores.variant as ButtonVariant}
    />
  ),
  codigo: (valores) =>
    gerarJsx('ButtonIcon', [
      ['icon', expr(`<${valores.icon} />`)],
      ['label', valores.label],
      ['variant', valores.variant, 'secondary'],
      ['size', valores.size, 'md'],
      ['disabled', valores.disabled, false],
      ['onClick', expr('buscar')],
    ]),
  verificar: (valores) => {
    const nome = valores.label.trim();
    const verificacoes: Verificacao[] = [
      nome
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${nome}", dito ao leitor de tela e mostrado como dica.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'label é obrigatório: só o ícone não diz o que o botão faz.' },
      {
        nivel: 'ok',
        titulo: 'Alvo de toque',
        detalhe: `Quadrado de ${ALTURAS[valores.size as ButtonSize]}px, acima dos 24px da WCAG 2.5.8.`,
      },
    ];

    if (valores.variant === 'primary') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Quadrado na cor principal',
        detalhe: 'Chama mais atenção do que uma ação de ícone pede; por isso o padrão é secondary.',
      });
    }

    if (valores.disabled) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Desabilitado',
        detalhe: 'Sai da tabulação e não dispara eventos. Diga perto dele por que a ação não está disponível.',
      });
    }

    return verificacoes;
  },
});

const PESSOAS = ['Ana Ribeiro', 'Bruno Costa', 'Carla Mendes'];

function Variantes() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Variantes</h3>
        <div className="demo-row">
          {VARIANTES.map((variante) => (
            <ButtonIcon icon={<IconSearch />} key={variante} label={`Buscar, ${variante}`} variant={variante} />
          ))}
        </div>
      </div>
      <div className="subsection">
        <h3>Tamanhos, na altura do Button</h3>
        <div className="demo-row">
          {TAMANHOS.map((tamanho) => (
            <span className="demo-row" key={tamanho}>
              <ButtonIcon icon={<IconSearch />} label={`Buscar, ${tamanho}`} size={tamanho} />
              <Button size={tamanho} variant="secondary">
                {tamanho} · {ALTURAS[tamanho]}px
              </Button>
            </span>
          ))}
        </div>
        <p className="note">Quadrado na altura do Button de cada tamanho, para alinhar com ele e com o InputText numa barra.</p>
      </div>
      <div className="subsection">
        <h3>Desabilitado</h3>
        <div className="demo-row">
          {VARIANTES.map((variante) => (
            <ButtonIcon disabled icon={<IconSearch />} key={variante} label={`Buscar, ${variante}`} variant={variante} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>label</code></dt>
      <dd>
        Obrigatório. Vai ao <code>aria-label</code> e à dica do Tooltip, que aparece no foco e, com o ponteiro, depois de
        meio segundo. Escape fecha a dica.
      </dd>
      <dt><code>variant</code></dt>
      <dd>
        <code>secondary</code> por padrão, e não <code>primary</code> como o Button: um quadrado na cor principal chama mais
        atenção do que uma ação de ícone pede.
      </dd>
      <dt>Sem <code>loading</code></dt>
      <dd>No quadrado, o indicador disputaria o lugar do ícone. Nasce quando houver consumidor pedindo.</dd>
      <dt><code>disabled</code></dt>
      <dd>Desabilita o botão nativo: sai da ordem de tabulação e não dispara eventos.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Fechar um painel',
      descricao: 'O contexto já diz o que o X faz; o label diz ao leitor de tela.',
      Previa: () => (
        <div className="demo-box demo-row" style={{ width: '100%', justifyContent: 'space-between' }}>
          <strong>Filtros</strong>
          <ButtonIcon icon={<IconClose />} label="Fechar filtros" size="sm" variant="ghost" />
        </div>
      ),
      codigo: '<ButtonIcon\n  icon={<IconClose />}\n  label="Fechar filtros"\n  size="sm"\n  variant="ghost"\n  onClick={fechar}\n/>',
    },
    {
      titulo: 'Ação de uma linha',
      descricao: 'Cada botão nomeia o registro: "Remover Ana Ribeiro", e não só "Remover".',
      Previa: () => (
        <div className="stack" style={{ width: '100%' }}>
          {PESSOAS.map((pessoa) => (
            <div className="demo-row" key={pessoa} style={{ justifyContent: 'space-between' }}>
              <span>{pessoa}</span>
              <ButtonIcon icon={<IconMinusCircle />} label={`Remover ${pessoa}`} size="sm" variant="ghost" />
            </div>
          ))}
        </div>
      ),
      codigo:
        '{pessoas.map((pessoa) => (\n  <ButtonIcon\n    key={pessoa.id}\n    icon={<IconMinusCircle />}\n    label={`Remover ${pessoa.nome}`}\n    size="sm"\n    variant="ghost"\n    onClick={() => remover(pessoa)}\n  />\n))}',
    },
    {
      titulo: 'Ao lado da busca',
      descricao: 'Na altura do InputText médio, o botão fecha a barra sem texto repetido.',
      Previa: () => (
        <div className="demo-row" style={{ width: '100%', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <InputText icon={<IconSearch />} label="Buscar pedidos" placeholder="Número ou cliente" type="search" />
          </div>
          <ButtonIcon icon={<IconChartBar />} label="Ver como gráfico" />
        </div>
      ),
      codigo:
        '<InputText\n  icon={<IconSearch />}\n  label="Buscar pedidos"\n  placeholder="Número ou cliente"\n  type="search"\n/>\n<ButtonIcon icon={<IconChartBar />} label="Ver como gráfico" />',
    },
  ],
  faca: {
    Previa: () => (
      <>
        <ButtonIcon icon={<IconClose />} label="Fechar" variant="ghost" />
        <Button>
          <IconPlusCircle />
          Novo registro
        </Button>
      </>
    ),
    texto: 'Ícone sozinho quando o texto não cabe ou repetiria o contexto, como o fechar. Havendo espaço, Button com texto.',
  },
  evite: {
    Previa: () => <ButtonIcon icon={<IconPlusCircle />} label="Novo registro" variant="primary" />,
    texto: 'A ação principal só em ícone, com espaço de sobra: a pessoa precisa adivinhar o que ele faz.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Leva o foco ao botão e mostra o label como dica.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona a operação.' },
    { teclas: ['Escape'], acao: 'Fecha a dica, com o foco no botão.' },
  ],
  garantias: [
    {
      garantia: 'Nome acessível',
      como: <>O <code>label</code> vai ao <code>aria-label</code>; o ícone fica fora da leitura.</>,
      teste: 'ButtonIcon.test.tsx',
    },
    { garantia: 'Dica no teclado', como: 'O label aparece como dica também a quem chega pelo foco.', teste: 'ButtonIcon.test.tsx' },
    { garantia: 'Dica dispensável', como: 'Escape e a saída do foco fecham a dica.', teste: 'Tooltip.test.tsx' },
    { garantia: 'Semântica nativa', como: <>Elemento <code>&lt;button&gt;</code>, composto do Button.</>, teste: 'ButtonIcon.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <button>, exceto aria-label e children, e o ref.',
  api: [
    { nome: 'icon', tipo: 'ReactNode', descricao: 'O ícone. Obrigatório; fica fora da leitura.' },
    { nome: 'label', tipo: 'string', descricao: 'Nome do botão, obrigatório: vai ao leitor de tela e à dica.' },
    {
      nome: 'variant',
      tipo: "'primary' | 'secondary' | 'soft' | 'ghost' | 'danger'",
      padrao: "'secondary'",
      descricao: 'Peso visual, como no Button.',
    },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Quadrado de 28, 42 ou 48px, a altura do Button.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o botão nativo.' },
    { nome: 'type', tipo: "'button' | 'submit' | 'reset'", padrao: "'button'", descricao: 'Herdado do Button: envio só quando pedido.' },
  ],
};
