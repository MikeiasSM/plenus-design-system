import { useState } from 'react';
import { Button, IconPlusCircle, type ButtonSize, type ButtonVariant } from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const VARIANTES = ['primary', 'secondary', 'soft', 'ghost', 'danger', 'dangerGhost'] as const;
const TAMANHOS = ['sm', 'md', 'lg'] as const;
const ALTURAS: Record<ButtonSize, number> = { sm: 32, md: 36, lg: 40 };
// Texto sobre o fundo de cada variante, medido nos tokens do tema claro.
const CONTRASTES: Record<ButtonVariant, string> = {
  primary: '3,03:1',
  secondary: '12,32:1',
  soft: '7,27:1',
  ghost: '6,27:1',
  danger: '6,95:1',
  dangerGhost: '7,86:1',
};

const playground = definirPlayground({
  inicial: { variant: 'primary', size: 'md', children: 'Salvar', icone: false, loading: false, disabled: false },
  controles: [
    { tipo: 'opcoes', nome: 'variant', opcoes: VARIANTES },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'texto', nome: 'children' },
    { tipo: 'booleano', nome: 'icone' },
    { tipo: 'booleano', nome: 'loading' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <Button
      disabled={valores.disabled}
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
      {
        nivel: 'ok',
        titulo: 'Alvo de toque',
        detalhe: `${ALTURAS[valores.size as ButtonSize]}px de altura, acima dos 24px da WCAG 2.5.8.`,
      },
      variante === 'primary'
        ? { nivel: 'atencao', titulo: `Contraste ${CONTRASTES.primary}`, detalhe: 'Abaixo de 4,5:1. Exceção aceita, registrada no PROGRESS.' }
        : { nivel: 'ok', titulo: `Contraste ${CONTRASTES[variante]}`, detalhe: 'O texto sobre o fundo passa AA.' },
    ];

    if (valores.loading) {
      verificacoes.push({ nivel: 'ok', titulo: 'Estado ocupado', detalhe: 'aria-busy ligado; o clique é ignorado e o foco fica.' });
    }

    if (valores.disabled) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Desabilitado',
        detalhe: 'Sai da tabulação. Diga perto dele por que a ação não está disponível.',
      });
    }

    if (/^(ok|clique aqui|aqui)$/i.test(texto)) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Texto genérico', detalhe: 'Prefira o verbo da ação, como "Salvar alterações".' });
    }

    return verificacoes;
  },
});

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

function Variantes() {
  return (
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
      <dd>Sai da ordem de tabulação e não dispara eventos. Prefira dizer, perto dele, por que a ação não está disponível.</dd>
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
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Leva o foco ao botão; o anel aparece só na navegação por teclado.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Aciona a operação, exceto em loading.' },
  ],
  garantias: [
    { garantia: 'Semântica nativa', como: <>Elemento <code>&lt;button&gt;</code>, sem papel emprestado.</>, teste: 'Button.test.tsx' },
    { garantia: 'Nome acessível', como: 'O texto do botão. Sem texto, ButtonIcon, que exige label.', teste: 'Button.test.tsx' },
    { garantia: 'Estado ocupado', como: <><code>aria-busy</code> e <code>aria-disabled</code> durante o loading.</>, teste: 'Button.test.tsx' },
    { garantia: 'Contraste', como: 'primary sólido em 3,03:1 é exceção aceita; as demais variantes passam AA.', teste: 'check:contraste' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <button> e o ref.',
  api: [
    { nome: 'variant', tipo: "'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'dangerGhost'", padrao: "'primary'", descricao: 'Peso visual da ação. dangerGhost é a destrutiva discreta, só o texto em vermelho.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Altura de 32, 36 ou 40px; o pequeno e o médio alinham com o campo do mesmo tamanho.' },
    { nome: 'loading', tipo: 'boolean', padrao: 'false', descricao: 'Indicador de atividade; o clique é ignorado.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o botão nativo.' },
    { nome: 'type', tipo: "'button' | 'submit' | 'reset'", padrao: "'button'", descricao: 'Envio de formulário só quando pedido.' },
  ],
};
