import { useId, useState, type CSSProperties } from 'react';
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
    `${gerarJsx('SkipLink', [['href', valores.href]], valores.children === TEXTO_PADRAO ? undefined : valores.children)}\n...\n<main id="${valores.href.replace(/^#/, '')}">...</main>`,
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
  const [chegou, setChegou] = useState(false);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <SkipLink href={`#${id}`} style={VISIVEL} />
      <div className="demo-box" id={id} onBlur={() => setChegou(false)} onFocus={() => setChegou(true)}>
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
          O salto nativo da âncora rola a página, mas nem todo navegador move o foco, e numa aplicação que guarda a rota
          no endereço ele troca a rota. Por isso o link leva o foco ao elemento do <code>id</code> por conta própria, sem
          mudar o endereço: põe <code>tabindex=&quot;-1&quot;</code> nele quando não é focável e rola até ele. Sem esse
          elemento na página, o link segue o comportamento nativo. O <code>onClick</code> do produto roda antes e, com{' '}
          <code>preventDefault</code>, cancela o salto.
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
      codigo: '<SkipLink href="#conteudo" />\n<header>...</header>\n<main id="conteudo">...</main>',
    },
    {
      titulo: 'Foco no conteúdo',
      descricao: 'Clique: o link não troca o endereço e leva o foco ao conteúdo, que ganha tabindex="-1".',
      Previa: DestinoLocal,
      codigo: '<SkipLink href="#conteudo" />\n...\n<main id="conteudo">...</main>',
    },
  ],
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Primeira parada da página: o link aparece ao receber foco.' },
    { teclas: ['Enter'], acao: 'Leva o foco ao conteúdo principal e rola até ele.' },
  ],
  garantias: [
    {
      garantia: 'Link nativo',
      como: <><code>&lt;a&gt;</code> para a âncora, com o texto padrão &quot;{TEXTO_PADRAO}&quot;.</>,
      teste: 'SkipLink.test.tsx',
    },
    {
      garantia: 'Foco no destino',
      como: <>O alvo do <code>href</code> recebe o foco, com <code>tabindex=&quot;-1&quot;</code> quando não é focável; sem alvo, vale o comportamento nativo.</>,
      teste: 'SkipLink.test.tsx',
    },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <a> e o ref.',
  api: [
    { nome: 'href', tipo: 'string', descricao: 'Obrigatório. Âncora do conteúdo principal, como #conteudo.' },
    { nome: 'children', tipo: 'ReactNode', padrao: `'${TEXTO_PADRAO}'`, descricao: 'Texto do link.' },
  ],
};
