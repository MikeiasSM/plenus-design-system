import { useEffect, useState } from 'react';
import { Badge, Button, CodeBlock } from '@plenustech/design-system';
import { CAMINHO_DAS_COMPOSICOES } from './menu';
import { Moldura } from './Moldura';
import { telas } from './telas';
import './composicoes.css';

function IndiceDasComposicoes() {
  return (
    <article className="page-content overview">
      <p className="crumb">Composições</p>
      <div className="page-title">
        <h1>Composições de tela</h1>
      </div>
      <p className="page-lead">
        Telas completas montadas só com os componentes da biblioteca, dentro de um <code>AppShell</code>. Os dados são de exemplo e ficam no
        Showcase. Cada tela traz a regra de composição, os componentes que usa e a estrutura.
      </p>
      <div className="overview-grid">
        {telas.map((tela) => (
          <a className="overview-card" href={`${CAMINHO_DAS_COMPOSICOES}/${tela.id}`} key={tela.id}>
            <strong>{tela.nome}</strong>
            <small>{tela.resumo}</small>
          </a>
        ))}
      </div>
    </article>
  );
}

/** A tela escolhida dentro da moldura. A moldura não troca de uma tela para outra: o submenu e a conta continuam como estavam. */
export function Composicoes({ tela: id }: { tela: string }) {
  const tela = telas.find((candidata) => candidata.id === id);
  const [janelaInteira, setJanelaInteira] = useState(false);

  useEffect(() => {
    if (!janelaInteira) {
      return;
    }

    const sair = (evento: KeyboardEvent) => evento.key === 'Escape' && setJanelaInteira(false);
    window.addEventListener('keydown', sair);
    return () => window.removeEventListener('keydown', sair);
  }, [janelaInteira]);

  if (!tela) {
    return <IndiceDasComposicoes />;
  }

  const { Componente } = tela;

  return (
    <article className="composicao">
      <p className="crumb">Composições</p>
      <div className="page-title">
        <h1>{tela.nome}</h1>
      </div>
      <p className="page-lead">{tela.resumo}</p>
      <div className={janelaInteira ? 'palco-controle palco-controle-janela' : 'palco-controle'}>
        <Button aria-pressed={janelaInteira} onClick={() => setJanelaInteira(!janelaInteira)} size="sm" variant="secondary">
          {janelaInteira ? 'Sair da janela inteira (Esc)' : 'Ocupar a janela'}
        </Button>
      </div>
      <div className={janelaInteira ? 'palco palco-janela' : 'palco'}>
        <Moldura item={tela.item} modulo={tela.modulo}>
          <Componente key={tela.id} />
        </Moldura>
      </div>
      <div className="apoio">
        <section aria-labelledby="regra-de-composicao">
          <h2 id="regra-de-composicao">Regra de composição</h2>
          <p>{tela.nota}</p>
          <h2>Componentes da biblioteca</h2>
          <ul className="apoio-componentes">
            {tela.componentes.map((componente) => (
              <li key={componente}>
                <Badge tone="neutral">{componente}</Badge>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="estrutura-da-tela">
          <h2 id="estrutura-da-tela">Estrutura</h2>
          <CodeBlock code={tela.codigo} syntax="tsx" />
        </section>
      </div>
    </article>
  );
}
