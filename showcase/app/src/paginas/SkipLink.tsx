import { useId, useRef, useState, type CSSProperties } from 'react';
import { SkipLink } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

// O link fica fixo e fora da tela até receber foco; nas prévias ele aparece no lugar, sempre visível.
const VISIVEL: CSSProperties = { position: 'static', transform: 'none' };
const TEXTO_PADRAO = 'Pular para o conteúdo';

const playground = definirPlayground({
  inicial: { href: '#conteudo', children: TEXTO_PADRAO },
  controles: [
    { tipo: 'texto', nome: 'href' },
    { tipo: 'texto', nome: 'children' },
  ],
  renderizar: (valores, registrar) => (
    <SkipLink
      href={valores.href}
      onBlur={() => registrar('onBlur')}
      onClick={(evento) => {
        evento.preventDefault();
        registrar(`onClick: ${valores.href}`);
      }}
      onFocus={() => registrar('onFocus')}
      style={VISIVEL}
    >
      {valores.children || undefined}
    </SkipLink>
  ),
  codigo: (valores) =>
    `${gerarJsx('SkipLink', [['href', valores.href]], valores.children === TEXTO_PADRAO ? undefined : valores.children)}\n...\n<main id="${valores.href.replace(/^#/, '')}" tabIndex={-1}>...</main>`,
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.href.startsWith('#') && valores.href.length > 1
        ? { nivel: 'ok', titulo: 'Âncora', detalhe: `Leva ao elemento de id "${valores.href.slice(1)}".` }
        : { nivel: 'falha', titulo: 'Não é âncora', detalhe: 'href deve apontar para o id do conteúdo principal, como #conteudo.' },
      {
        nivel: 'ok',
        titulo: 'Nome acessível',
        detalhe: valores.children.trim() ? `"${valores.children.trim()}".` : `Sem children, o texto padrão: "${TEXTO_PADRAO}".`,
      },
    ];

    return verificacoes;
  },
});

function DestinoLocal() {
  const id = useId();
  const destino = useRef<HTMLDivElement>(null);
  const [chegou, setChegou] = useState(false);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <SkipLink
        href={`#${id}`}
        onClick={(evento) => {
          evento.preventDefault();
          destino.current?.focus();
        }}
        style={VISIVEL}
      />
      <div className="demo-box" onBlur={() => setChegou(false)} onFocus={() => setChegou(true)} ref={destino} tabIndex={-1}>
        {chegou ? 'O foco está aqui: o próximo Tab segue a partir do conteúdo.' : 'Conteúdo principal'}
      </div>
    </div>
  );
}

function Modos() {
  return (
    <>
      <div className="subsection">
        <h3>Neste Showcase</h3>
        <p className="note">
          Este Showcase já tem um: recarregue a página e aperte Tab. O link fica fora da tela até receber foco, aparece no
          canto e leva à âncora informada. As prévias desta página o mostram sempre visível, só para demonstração.
        </p>
      </div>
      <div className="subsection">
        <h3>Foco no destino</h3>
        <p className="note">
          O navegador já leva o ponto de partida da tabulação para a âncora, então o componente não foca o alvo por conta
          própria. Uma aplicação que guarda a rota no endereço, como este Showcase, impede a navegação no{' '}
          <code>onClick</code> e foca o conteúdo ela mesma.
        </p>
      </div>
    </>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'No topo da aplicação',
      descricao: 'Primeiro item da página, antes do cabeçalho; o conteúdo principal tem o id da âncora.',
      Previa: () => <SkipLink href="#conteudo" onClick={(evento) => evento.preventDefault()} style={VISIVEL} />,
      codigo: '<SkipLink href="#conteudo" />\n<header>...</header>\n<main id="conteudo" tabIndex={-1}>...</main>',
    },
    {
      titulo: 'Rota no endereço',
      descricao: 'Clique: o link não troca o endereço e leva o foco ao conteúdo, como na raiz deste Showcase.',
      Previa: DestinoLocal,
      codigo:
        "<SkipLink\n  href=\"#conteudo\"\n  onClick={(evento) => {\n    evento.preventDefault();\n    document.getElementById('conteudo')?.focus();\n  }}\n/>",
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Primeira parada da página: o link aparece ao receber foco.' },
    { teclas: ['Enter'], acao: 'Segue para a âncora do conteúdo principal.' },
  ],
  garantias: [
    {
      garantia: 'Link nativo',
      como: <><code>&lt;a&gt;</code> para a âncora, com o texto padrão &quot;{TEXTO_PADRAO}&quot;.</>,
      teste: 'SkipLink.test.tsx',
    },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <a> e o ref.',
  api: [
    { nome: 'href', tipo: 'string', descricao: 'Obrigatório. Âncora do conteúdo principal, como #conteudo.' },
    { nome: 'children', tipo: 'ReactNode', padrao: `'${TEXTO_PADRAO}'`, descricao: 'Texto do link.' },
  ],
};
