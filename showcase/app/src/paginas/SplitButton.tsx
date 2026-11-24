import { useState } from 'react';
import { SplitButton, type ButtonSize, type MenuItem, type MenuSection, type SplitButtonVariant } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const VARIANTES = ['primary', 'secondary'] as const;
const TAMANHOS = ['sm', 'md', 'lg'] as const;
const ALTURAS: Record<ButtonSize, number> = { sm: 32, md: 36, lg: 40 };

const ITENS_SALVAR: MenuItem[] = [
  { key: 'rascunho', label: 'Salvar como rascunho' },
  { key: 'copia', label: 'Salvar uma cópia', shortcut: 'Ctrl+Shift+S' },
  { key: 'modelo', label: 'Salvar como modelo', disabled: true },
];

const ITENS_EXPORTAR: MenuItem[] = [
  { key: 'csv', label: 'Exportar em CSV' },
  { key: 'xlsx', label: 'Exportar em Excel' },
  { key: 'pdf', label: 'Exportar em PDF' },
];

const CODIGO_DOS_ITENS = `items={[
  { key: 'rascunho', label: 'Salvar como rascunho' },
  { key: 'copia', label: 'Salvar uma cópia', shortcut: 'Ctrl+Shift+S' },
  { key: 'modelo', label: 'Salvar como modelo', disabled: true },
]}`;

const playground = definirPlayground({
  inicial: { variant: 'primary', size: 'md', label: 'Salvar', menuLabel: '', disabled: false },
  controles: [
    { tipo: 'opcoes', nome: 'variant', opcoes: VARIANTES },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'menuLabel' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <SplitButton
      disabled={valores.disabled}
      items={ITENS_SALVAR}
      label={valores.label}
      menuLabel={valores.menuLabel || undefined}
      onAction={() => registrar('onAction')}
      onMenuAction={(key) => registrar(`onMenuAction: ${key}`)}
      size={valores.size as ButtonSize}
      variant={valores.variant as SplitButtonVariant}
    />
  ),
  codigo: (valores) =>
    gerarJsx('SplitButton', [
      ['label', valores.label],
      ['variant', valores.variant, 'primary'],
      ['size', valores.size, 'md'],
      ['menuLabel', valores.menuLabel, ''],
      ['disabled', valores.disabled, false],
      ['onAction', expr('salvar')],
      ['items', expr('itens')],
      ['onMenuAction', expr('escolher')],
    ]),
  verificar: (valores) => {
    const texto = valores.label.trim();
    const nomeDoMenu = valores.menuLabel.trim() || (texto ? `Mais opções de ${texto.toLocaleLowerCase('pt-BR')}` : '');
    const verificacoes: Verificacao[] = [
      texto
        ? { nivel: 'ok', titulo: 'Nome do grupo e da ação', detalhe: `"${texto}", no grupo e no botão principal.` }
        : { nivel: 'falha', titulo: 'Sem nome', detalhe: 'Sem label, o grupo e a ação principal não são anunciados.' },
      nomeDoMenu
        ? { nivel: 'ok', titulo: 'Nome do botão do menu', detalhe: `"${nomeDoMenu}", anunciado como botão de menu, recolhido ou expandido.` }
        : { nivel: 'falha', titulo: 'Botão do menu sem nome', detalhe: 'Dê um label ou um menuLabel.' },
      {
        nivel: 'ok',
        titulo: 'Alvo de toque',
        detalhe: `${ALTURAS[valores.size as ButtonSize]}px de altura nas duas partes, acima dos 24px da WCAG 2.5.8.`,
      },
    ];

    if (valores.disabled) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Desabilitado',
        detalhe: 'As duas partes saem da tabulação. Diga perto dele por que a ação não está disponível.',
      });
    }

    return verificacoes;
  },
});

function Escolhas() {
  const [ultima, setUltima] = useState('Nenhuma ação ainda.');

  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <SplitButton
        items={ITENS_SALVAR}
        label="Salvar"
        onAction={() => setUltima('Salvo.')}
        onMenuAction={(key) => setUltima(`Escolhido no menu: ${key}.`)}
      />
      <span aria-live="polite" style={{ color: 'var(--pl-color-text-secondary)' }}>
        {ultima}
      </span>
    </div>
  );
}

const ITENS_COM_GRUPOS: (MenuItem | MenuSection)[] = [
  {
    key: 'publicar',
    items: [
      { key: 'agendar', label: 'Agendar publicação' },
      { key: 'revisao', label: 'Enviar para revisão' },
    ],
  },
  { key: 'perigo', items: [{ key: 'descartar', label: 'Descartar alterações', tone: 'danger' }] },
];

const CODIGO_DAS_VARIANTES = `<SplitButton label="Salvar" variant="primary" items={itens} onAction={salvar} onMenuAction={escolher} />
<SplitButton label="Exportar" variant="secondary" items={itens} onAction={exportar} onMenuAction={escolher} />

<SplitButton label="Salvar" size="sm" items={itens} onAction={salvar} />
<SplitButton label="Salvar" size="md" items={itens} onAction={salvar} />
<SplitButton label="Salvar" size="lg" items={itens} onAction={salvar} />

<SplitButton label="Salvar" disabled items={itens} onAction={salvar} />`;

function Variantes() {
  return (
    <>
      <div className="matrix">
        <div className="matrix-row matrix-head">
          <span>variant</span>
          {TAMANHOS.map((tamanho) => (
            <span key={tamanho}>
              {tamanho} · {ALTURAS[tamanho]}px
            </span>
          ))}
          <span>disabled</span>
        </div>
        {VARIANTES.map((variante) => (
          <div className="matrix-row" key={variante}>
            <code>{variante}</code>
            {TAMANHOS.map((tamanho) => (
              <span key={tamanho}>
                <SplitButton items={ITENS_SALVAR} label="Salvar" size={tamanho} variant={variante} />
              </span>
            ))}
            <span>
              <SplitButton disabled items={ITENS_SALVAR} label="Salvar" variant={variante} />
            </span>
          </div>
        ))}
      </div>
      <VerCodigo codigo={CODIGO_DAS_VARIANTES} />
    </>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>label</code> e <code>onAction</code></dt>
      <dd>
        A ação principal, sempre à vista. O <code>label</code> também dá nome ao grupo, e não muda sozinho para a última
        escolha do menu: trocar o rótulo sem a pessoa pedir faz errar o clique seguinte.
      </dd>
      <dt><code>items</code> e <code>onMenuAction</code></dt>
      <dd>
        As variações, no formato do <code>Menu</code>: atalho, grupos com divisor, item desabilitado, tom de perigo e
        submenu. <code>onMenuAction</code> recebe o <code>key</code> do item, depois do <code>onSelect</code> dele.
      </dd>
      <dt><code>menuLabel</code></dt>
      <dd>
        Nome do botão do menu e do próprio menu. O padrão é <q>Mais opções de</q> e o <code>label</code> em minúsculas.
      </dd>
      <dt><code>disabled</code></dt>
      <dd>
        Trava as duas partes e fecha o menu aberto. Um item desabilitado no menu não trava a ação principal.
      </dd>
      <dt><code>variant</code></dt>
      <dd>
        <code>primary</code> separa as partes por um fio de 1px na cor do texto a 25%; <code>secondary</code> faz as duas
        dividirem a borda. Os cantos de dentro são retos.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Ação principal e variações',
      descricao: 'Clique na ação ou abra o menu: a ação principal continua a mesma depois de qualquer escolha.',
      Previa: Escolhas,
      codigo: `<SplitButton\n  label="Salvar"\n  onAction={salvar}\n  ${CODIGO_DOS_ITENS.split('\n').join('\n  ')}\n  onMenuAction={escolher}\n/>`,
    },
    {
      titulo: 'Secundário',
      descricao: 'Para a ação que não é a principal da área. As duas partes dividem a mesma borda.',
      Previa: () => <SplitButton items={ITENS_EXPORTAR} label="Exportar" variant="secondary" />,
      codigo:
        "<SplitButton\n  label=\"Exportar\"\n  variant=\"secondary\"\n  onAction={exportar}\n  items={[\n    { key: 'csv', label: 'Exportar em CSV' },\n    { key: 'xlsx', label: 'Exportar em Excel' },\n    { key: 'pdf', label: 'Exportar em PDF' },\n  ]}\n  onMenuAction={exportarComo}\n/>",
    },
    {
      titulo: 'Grupos e perigo',
      descricao: 'Grupos do Menu ganham divisor; a variação destrutiva fica por último, no tom de perigo.',
      Previa: () => <SplitButton items={ITENS_COM_GRUPOS} label="Publicar" />,
      codigo:
        "<SplitButton\n  label=\"Publicar\"\n  onAction={publicar}\n  items={[\n    {\n      key: 'publicar',\n      items: [\n        { key: 'agendar', label: 'Agendar publicação' },\n        { key: 'revisao', label: 'Enviar para revisão' },\n      ],\n    },\n    { key: 'perigo', items: [{ key: 'descartar', label: 'Descartar alterações', tone: 'danger' }] },\n  ]}\n  onMenuAction={escolher}\n/>",
    },
  ],
  faca: {
    Previa: () => <SplitButton items={ITENS_SALVAR} label="Salvar" />,
    texto: 'Uma ação que a maioria usa, à vista, e as variações dela no menu.',
    codigo: `<SplitButton label="Salvar" onAction={salvar} items={itens} onMenuAction={escolher} />`,
  },
  evite: {
    Previa: () => (
      <SplitButton
        items={[
          { key: 'imprimir', label: 'Imprimir' },
          { key: 'arquivar', label: 'Arquivar' },
          { key: 'excluir', label: 'Excluir', tone: 'danger' },
        ]}
        label="Salvar"
      />
    ),
    texto: 'Ações sem relação com a principal no mesmo menu. Elas vão num Menu à parte, ou em botões próprios.',
    codigo:
      "<SplitButton\n  label=\"Salvar\"\n  items={[\n    { key: 'imprimir', label: 'Imprimir' },\n    { key: 'arquivar', label: 'Arquivar' },\n    { key: 'excluir', label: 'Excluir', tone: 'danger' },\n  ]}\n/>",
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Passa da ação principal ao botão do menu, cada um com o próprio foco.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Na ação principal, aciona; no botão do menu, abre o menu no primeiro item.' },
    { teclas: ['↓', '↑'], acao: 'No botão do menu, abre o menu no primeiro ou no último item; no menu, percorre os itens, pulando os desabilitados.' },
    { teclas: ['Home', 'End'], acao: 'Vai ao primeiro ou ao último item do menu.' },
    { teclas: ['Esc'], acao: 'Fecha o menu sem escolher e devolve o foco ao botão do menu.' },
  ],
  garantias: [
    { garantia: 'Grupo nomeado', como: <><code>role=&quot;group&quot;</code> com o nome da ação, e dois botões, cada um com nome próprio.</>, teste: 'SplitButton.test.tsx' },
    { garantia: 'Botão de menu', como: <><code>aria-haspopup=&quot;menu&quot;</code> e <code>aria-expanded</code> no segundo botão, com o nome <q>Mais opções de</q> e a ação.</>, teste: 'SplitButton.test.tsx' },
    { garantia: 'Menu pelo teclado', como: 'Setas, Home, End e Esc do Menu, e o foco de volta ao botão do menu depois da escolha.', teste: 'SplitButton.test.tsx' },
    { garantia: 'Ação estável', como: 'O rótulo da ação principal não muda depois de uma escolha no menu.', teste: 'SplitButton.test.tsx' },
    { garantia: 'Desabilitado', como: <><code>disabled</code> trava as duas partes; um item desabilitado no menu não trava a principal.</>, teste: 'SplitButton.test.tsx' },
    { garantia: 'Contraste', como: 'O das variantes primary e secondary do Button.', teste: 'check:contraste' },
  ],
  notaDaApi: 'Além destas, os atributos de <div> no grupo, como className, id e style.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Texto da ação principal e nome do grupo.' },
    { nome: 'onAction', tipo: '() => void', descricao: 'A ação principal.' },
    { nome: 'items', tipo: 'readonly (MenuItem | MenuSection)[]', descricao: 'As variações, no formato do Menu: atalho, grupos, desabilitado, tom de perigo e submenu.' },
    { nome: 'onMenuAction', tipo: '(key: string) => void', descricao: 'Recebe o key do item escolhido, depois do onSelect do próprio item.' },
    { nome: 'menuLabel', tipo: 'string', padrao: "'Mais opções de <label>'", descricao: 'Nome do botão do menu e do menu. O padrão leva o label em minúsculas.' },
    { nome: 'variant', tipo: "'primary' | 'secondary'", padrao: "'primary'", descricao: 'primary separa as partes por um fio; secondary as faz dividir a borda.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura de 32, 36 ou 40px, como no Button.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Trava as duas partes e fecha o menu aberto.' },
  ],
};
