import { useState } from 'react';
import { Button, IconPlusCircle, type ButtonSize, type ButtonVariant } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';
import { VerCodigo } from '../estrutura/VerCodigo';

const VARIANTES = ['primary', 'secondary', 'soft', 'ghost', 'neutral', 'link', 'danger', 'dangerSoft', 'dangerGhost'] as const;
const TAMANHOS = ['sm', 'md', 'lg'] as const;
const ALTURAS: Record<ButtonSize, number> = { sm: 32, md: 36, lg: 40 };
// Texto sobre o fundo de cada variante, medido nos tokens do tema claro.
const CONTRASTES: Record<ButtonVariant, string> = {
  primary: '3,03:1',
  secondary: '12,32:1',
  soft: '7,27:1',
  ghost: '6,27:1',
  neutral: '11,00:1',
  link: '5,38:1',
  danger: '6,95:1',
  dangerSoft: '6,85:1',
  dangerGhost: '7,86:1',
};

const playground = definirPlayground({
  inicial: { variant: 'primary', size: 'md', children: 'Salvar', icone: false, loading: false, disabled: false, disabledReason: '' },
  controles: [
    { tipo: 'opcoes', nome: 'variant', opcoes: VARIANTES },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'texto', nome: 'children' },
    { tipo: 'booleano', nome: 'icone' },
    { tipo: 'booleano', nome: 'loading' },
    { tipo: 'booleano', nome: 'disabled' },
    { tipo: 'texto', nome: 'disabledReason' },
  ],
  renderizar: (valores, registrar) => (
    <Button
      disabled={valores.disabled}
      disabledReason={valores.disabledReason || undefined}
      loading={valores.loading}
      onBlur={() => registrar('onBlur')}
      onClick={() => registrar('onClick')}
      onFocus={() => registrar('onFocus')}
      size={valores.size as ButtonSize}
      variant={valores.variant as ButtonVariant}
    >
      {valores.icone && <IconPlusCircle />}
      {valores.children}
    </Button>
  ),
  codigo: (valores) =>
    gerarJsx(
      'Button',
      [
        ['variant', valores.variant, 'primary'],
        ['size', valores.size, 'md'],
        ['loading', valores.loading, false],
        ['disabled', valores.disabled, false],
        ['disabledReason', valores.disabledReason, ''],
        ['onClick', expr('salvar')],
      ],
      [valores.icone && '<IconPlusCircle />', valores.children].filter(Boolean).join('\n'),
    ),
  verificar: (valores) => {
    const texto = valores.children.trim();
    const variante = valores.variant as ButtonVariant;
    const verificacoes: Verificacao[] = [
      texto
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${texto}", vindo do texto.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'Botão sem texto não é anunciado. Use ButtonIcon, com label.' },
      variante === 'link'
        ? { nivel: 'atencao', titulo: 'Alvo de toque', detalhe: 'Em linha, mede a altura da linha do texto: a WCAG 2.5.8 aceita o link dentro de uma frase.' }
        : {
            nivel: 'ok',
            titulo: 'Alvo de toque',
            detalhe: `${ALTURAS[valores.size as ButtonSize]}px de altura, acima dos 24px da WCAG 2.5.8.`,
          },
      variante === 'primary'
        ? { nivel: 'atencao', titulo: `Contraste ${CONTRASTES.primary}`, detalhe: 'Abaixo de 4,5:1. Exceção aceita, registrada na conferência de contraste.' }
        : { nivel: 'ok', titulo: `Contraste ${CONTRASTES[variante]}`, detalhe: 'O texto sobre o fundo passa AA.' },
    ];

    if (valores.loading) {
      verificacoes.push({ nivel: 'ok', titulo: 'Estado ocupado', detalhe: 'aria-busy ligado; o clique é ignorado e o foco fica.' });
    }

    if (valores.disabled && valores.disabledReason.trim()) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Desabilitado com motivo',
        detalhe: 'aria-disabled: continua na tabulação, ignora clique, Enter e Espaço, e o motivo o descreve.',
      });
    } else if (valores.disabled) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Desabilitado',
        detalhe: 'Sai da tabulação. Diga por que a ação não está disponível, com disabledReason ou perto dele.',
      });
    }

    if (/^(ok|clique aqui|aqui)$/i.test(texto)) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Texto genérico', detalhe: 'Prefira o verbo da ação, como "Salvar alterações".' });
    }

    return verificacoes;
  },
});

function Alternar() {
  const [fixado, setFixado] = useState(true);

  return (
    <>
      <Button aria-pressed={fixado} onClick={() => setFixado(!fixado)} variant="secondary">
        Fixar no topo
      </Button>
      <Button aria-pressed={!fixado} onClick={() => setFixado(!fixado)} variant="ghost">
        Soltar
      </Button>
    </>
  );
}

function Envio() {
  const [enviando, setEnviando] = useState(false);

  function enviar() {
    setEnviando(true);
    setTimeout(() => setEnviando(false), 1500);
  }

  return (
    <Button loading={enviando} onClick={enviar}>
      {enviando ? 'Enviando' : 'Enviar convite'}
    </Button>
  );
}

const CODIGO_DAS_VARIANTES = `<Button variant="primary">Salvar</Button>
<Button variant="secondary">Salvar</Button>
<Button variant="soft">Salvar</Button>
<Button variant="ghost">Salvar</Button>
<Button variant="neutral">Salvar</Button>
<Button variant="link">Salvar</Button>
<Button variant="danger">Salvar</Button>
<Button variant="dangerSoft">Salvar</Button>
<Button variant="dangerGhost">Salvar</Button>

<Button size="sm">Salvar</Button>
<Button size="md">Salvar</Button>
<Button size="lg">Salvar</Button>

<Button disabled>Salvar</Button>
<Button loading>Salvar</Button>`;

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
          <span>loading</span>
        </div>
        {VARIANTES.map((variante) => (
          <div className="matrix-row" key={variante}>
            <code>{variante}</code>
            {TAMANHOS.map((tamanho) => (
              <span key={tamanho}>
                <Button size={tamanho} variant={variante}>Salvar</Button>
              </span>
            ))}
            <span>
              <Button disabled variant={variante}>Salvar</Button>
            </span>
            <span>
              <Button loading variant={variante}>Salvar</Button>
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
      <dt><code>loading</code></dt>
      <dd>
        Mostra o indicador antes do texto, ignora o clique e anuncia <code>aria-busy</code>. Continua focável, para o foco
        não se perder no meio do envio.
      </dd>
      <dt><code>disabled</code></dt>
      <dd>Sai da ordem de tabulação e não dispara eventos. Prefira dizer por que a ação não está disponível.</dd>
      <dt><code>disabled</code> com <code>disabledReason</code></dt>
      <dd>
        Fica com <code>aria-disabled</code>, continua na tabulação, ignora clique, Enter e Espaço, e o motivo o descreve por{' '}
        <code>aria-describedby</code>.
      </dd>
      <dt><code>aria-pressed</code></dt>
      <dd>O botão que alterna mostra o estado ligado no tonal da marca, em qualquer variante.</dd>
      <dt><code>href</code> e <code>as</code></dt>
      <dd>
        Com <code>href</code> (ou <code>as</code> e <code>linkProps</code>), vira link de verdade, com as mesmas variantes,
        tamanhos e ícones. <code>disabled</code> tira o destino e o link sai da tabulação; <code>loading</code> mantém o
        destino, mas não navega. <code>type</code> não se aplica.
      </dd>
      <dt><code>type</code></dt>
      <dd>
        O padrão é <code>button</code>, para não enviar formulário por acidente. O envio é explícito, com{' '}
        <code>type=&quot;submit&quot;</code>.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Ações de formulário',
      descricao: 'A principal à direita, a secundária ao lado.',
      Previa: () => (
        <>
          <Button variant="secondary">Cancelar</Button>
          <Button type="submit">Salvar alterações</Button>
        </>
      ),
      codigo: '<Button variant="secondary" onClick={cancelar}>\n  Cancelar\n</Button>\n<Button type="submit">Salvar alterações</Button>',
    },
    {
      titulo: 'Enviando',
      descricao: 'Clique: o botão entra em loading por 1,5s, ignora cliques repetidos e volta.',
      Previa: Envio,
      codigo: "<Button loading={enviando} onClick={enviar}>\n  {enviando ? 'Enviando' : 'Enviar convite'}\n</Button>",
    },
    {
      titulo: 'Ação destrutiva',
      descricao: 'danger só para o que não se desfaz, e sempre com confirmação num Dialog.',
      Previa: () => <Button variant="danger">Excluir módulo</Button>,
      codigo: '<Button variant="danger" onClick={confirmar}>\n  Excluir módulo\n</Button>',
    },
    {
      titulo: 'Ação destrutiva discreta',
      descricao: 'dangerGhost para excluir dentro de uma linha, de uma lista ou de uma barra, onde o vermelho sólido pesaria.',
      Previa: () => <Button variant="dangerGhost">Excluir rascunho</Button>,
      codigo: '<Button variant="dangerGhost" onClick={excluir}>\n  Excluir rascunho\n</Button>',
    },
    {
      titulo: 'Como link',
      descricao: 'Navegar é link, não botão: com href, o Button é um <a> com o mesmo visual, e Ctrl+clique abre outra aba.',
      Previa: () => (
        <>
          <Button href="#/button">Novo pedido</Button>
          <Button href="#/button" variant="secondary">
            Ver tudo
          </Button>
          <Button disabled href="#/button" variant="secondary">
            Ver base
          </Button>
        </>
      ),
      codigo:
        '<Button href="/pedidos/novo">Novo pedido</Button>\n<Button href="/pedidos" variant="secondary">Ver tudo</Button>\n<Button href="/base" variant="secondary" disabled>\n  Ver base\n</Button>\n\n// Com o componente de link da aplicação\n<Button as={Link} linkProps={{ to: \'/pedidos\' }}>Ver tudo</Button>',
    },
    {
      titulo: 'Neutro',
      descricao: 'neutral é o tonal sem a cor da marca: fundo cinza, sem borda visível.',
      Previa: () => (
        <>
          <Button variant="neutral">Arquivar</Button>
          <Button href="#/button" variant="neutral">
            Ver histórico
          </Button>
        </>
      ),
      codigo: '<Button variant="neutral">Arquivar</Button>\n<Button href="/historico" variant="neutral">Ver histórico</Button>',
    },
    {
      titulo: 'Link no meio do texto',
      descricao: 'link herda a fonte do parágrafo, fica sublinhado e o foco é um contorno que acompanha a quebra de linha.',
      Previa: () => (
        <p style={{ margin: 0, maxWidth: 420 }}>
          O relatório é gerado toda segunda-feira.{' '}
          <Button variant="link">Gerar agora mesmo, fora do horário de costume</Button> ou{' '}
          <Button href="#/button" variant="link">
            ver os anteriores
          </Button>
          .
        </p>
      ),
      codigo:
        "<p>\n  O relatório é gerado toda segunda-feira.{' '}\n  <Button variant=\"link\" onClick={gerar}>Gerar agora mesmo</Button> ou{' '}\n  <Button href=\"/relatorios\" variant=\"link\">ver os anteriores</Button>.\n</p>",
    },
    {
      titulo: 'Desabilitado com motivo',
      descricao: 'Chegue pelo Tab: o botão recebe o foco, não responde, e o leitor de tela ouve o motivo.',
      Previa: () => (
        <>
          <Button disabled disabledReason="Preencha o nome do cliente antes de enviar">
            Enviar proposta
          </Button>
          <Button disabled variant="secondary">
            Sem motivo
          </Button>
        </>
      ),
      codigo: '<Button disabled disabledReason="Preencha o nome do cliente antes de enviar">\n  Enviar proposta\n</Button>',
    },
    {
      titulo: 'Botão que alterna',
      descricao: 'Com aria-pressed, o estado ligado é o tonal da marca, em qualquer variante.',
      Previa: Alternar,
      codigo: '<Button aria-pressed={fixado} onClick={() => setFixado(!fixado)} variant="secondary">\n  Fixar no topo\n</Button>',
    },
    {
      titulo: 'Ações de baixa ênfase',
      descricao: 'Numa barra de ferramentas, ghost e soft não competem com a ação principal.',
      Previa: () => (
        <>
          <Button variant="ghost">Exportar</Button>
          <Button variant="soft">Duplicar</Button>
          <Button>
            <IconPlusCircle />
            Novo registro
          </Button>
        </>
      ),
      codigo:
        '<Button variant="ghost">Exportar</Button>\n<Button variant="soft">Duplicar</Button>\n<Button>\n  <IconPlusCircle />\n  Novo registro\n</Button>',
    },
  ],
  faca: {
    Previa: () => (
      <>
        <Button variant="secondary">Cancelar</Button>
        <Button>Salvar alterações</Button>
      </>
    ),
    texto: 'Uma ação principal por área, com o verbo do que acontece. As demais em secondary ou ghost.',
    codigo: '<Button variant="secondary">Cancelar</Button>\n<Button>Salvar alterações</Button>',
  },
  evite: {
    Previa: () => (
      <>
        <Button>OK</Button>
        <Button>Salvar</Button>
        <Button>Enviar</Button>
      </>
    ),
    texto: 'Três ações principais disputando atenção, e um "OK" que não diz nada. Sem espaço para texto, ButtonIcon; muitas ações secundárias, Menu.',
    codigo: '<Button>OK</Button>\n<Button>Salvar</Button>\n<Button>Enviar</Button>',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Leva o foco ao botão; o anel aparece só na navegação por teclado.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona a operação, exceto em loading e desabilitado com motivo.' },
  ],
  garantias: [
    { garantia: 'Pressão', como: <>O estado <code>:active</code> vale em qualquer ponteiro, e o hover só onde o ponteiro paira.</>, teste: 'mobile.test.ts' },
    { garantia: 'Toque', como: 'Com o dedo como ponteiro principal, o pequeno e o médio têm 44px, e o grande, 48px.', teste: 'mobile.test.ts' },
    { garantia: 'Semântica nativa', como: <>Elemento <code>&lt;button&gt;</code>; com <code>href</code>, <code>as</code> ou <code>linkProps</code>, <code>&lt;a href&gt;</code>. Desabilitado, o link fica sem destino, com <code>role=&quot;link&quot;</code> e <code>aria-disabled</code>.</>, teste: 'Button.test.tsx' },
    { garantia: 'Nome acessível', como: 'O texto do botão. Sem texto, ButtonIcon, que exige label.', teste: 'Button.test.tsx' },
    { garantia: 'Estado ocupado', como: <><code>aria-busy</code> e <code>aria-disabled</code> durante o loading.</>, teste: 'Button.test.tsx' },
    { garantia: 'Motivo do desabilitado', como: <>Com <code>disabledReason</code>, <code>aria-disabled</code>, foco mantido, clique, Enter e Espaço barrados e o motivo em <code>aria-describedby</code>.</>, teste: 'Button.test.tsx' },
    { garantia: 'Contraste', como: 'primary sólido em 3,03:1 é exceção aceita; as demais variantes passam AA.', teste: 'check:contraste' },
  ],
  notaDaApi:
    'Além destas, todas as propriedades nativas de <button> e o ref (do <a>, quando é link). Ganchos de aparência, lidos com o valor da variante como reserva: --pl-button-bg, --pl-button-fg, --pl-button-border, --pl-button-bg-hover, --pl-button-bg-active e --pl-button-bg-pressed.',
  api: [
    { nome: 'variant', tipo: "'primary' | 'secondary' | 'soft' | 'ghost' | 'neutral' | 'link' | 'danger' | 'dangerSoft' | 'dangerGhost'", padrao: "'primary'", descricao: 'Peso visual da ação. neutral é o tonal cinza; link é a ação no meio do texto; dangerGhost é a destrutiva discreta, só o texto em vermelho.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura de 32, 36 ou 40px; o pequeno e o médio alinham com o campo do mesmo tamanho. link ignora o tamanho.' },
    { nome: 'disabledReason', tipo: 'string', descricao: 'Com disabled, troca o disabled nativo por aria-disabled: o botão segue focável, não responde e o motivo o descreve.' },
    { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Indicador de atividade; o clique é ignorado.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o botão nativo. Como link, tira o destino e o marca com aria-disabled.' },
    { nome: 'type', tipo: "'button' | 'submit' | 'reset'", padrao: "'button'", descricao: 'Envio de formulário só quando pedido. Não vale para link.' },
    { nome: 'href', tipo: 'string', descricao: 'Destino: o Button vira um <a href>, com o mesmo visual. Desabilitado, o link perde o href.' },
    { nome: 'as', tipo: 'ElementType', padrao: "'a'", descricao: 'Componente de link da aplicação, para não acoplar o sistema a um roteador.' },
    { nome: 'linkProps', tipo: 'Record<string, unknown>', descricao: 'Propriedades entregues inteiras ao componente de link, para o roteador que não usa href, como o to do React Router.' },
  ],
};
