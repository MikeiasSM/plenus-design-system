import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, CodeBlock, LinkList } from '@plenustech/design-system';
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
      <Card>
        <Card.Body flush>
          <LinkList aria-label="Composições de tela" layout="grid">
            {telas.map((tela) => (
              <LinkList.Item description={tela.resumo} href={`${CAMINHO_DAS_COMPOSICOES}/${tela.id}`} key={tela.id} title={tela.nome} />
            ))}
          </LinkList>
        </Card.Body>
      </Card>
    </article>
  );
}

/** A tela escolhida dentro da moldura. A moldura não troca de uma tela para outra: o submenu e a conta continuam como estavam. */
export function Composicoes({ tela: id }: { tela: string }) {
  const tela = telas.find((candidata) => candidata.id === id);
  const [janelaInteira, setJanelaInteira] = useState(false);
  const palco = useRef<HTMLDivElement>(null);
  const botaoDeOcupar = useRef<HTMLButtonElement>(null);
  const botaoDeSair = useRef<HTMLButtonElement>(null);
  const haTela = Boolean(tela);

  useEffect(() => {
    if (!janelaInteira) {
      return;
    }

    // Sem tela, o palco sai do ar: não há o que ocupar, e o fundo não pode ficar inerte.
    if (!haTela) {
      setJanelaInteira(false);
      return;
    }

    // O palco fica sobre a janela; o resto da página, atrás dele, sai da navegação: o Tab não passa por trás. O canto de
    // avisos fica de fora, porque o aviso de uma tela precisa continuar anunciado e operável.
    const inertes: HTMLElement[] = [];
    for (let no: HTMLElement | null = palco.current; no && no !== document.documentElement; no = no.parentElement) {
      for (const irmao of Array.from(no.parentElement?.children ?? [])) {
        if (irmao !== no && irmao instanceof HTMLElement && !irmao.inert && !irmao.hasAttribute('data-fora-do-modal')) {
          irmao.inert = true;
          inertes.push(irmao);
        }
      }
    }

    botaoDeSair.current?.focus();
    // O Esc que uma camada de cima já tratou, como um menu ou um diálogo, não sai da janela inteira.
    const sair = (evento: KeyboardEvent) => evento.key === 'Escape' && !evento.defaultPrevented && setJanelaInteira(false);
    window.addEventListener('keydown', sair);

    return () => {
      window.removeEventListener('keydown', sair);
      inertes.forEach((elemento) => {
        elemento.inert = false;
      });
      botaoDeOcupar.current?.focus();
    };
  }, [haTela, janelaInteira]);

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
      <div className="palco-controle">
        <Button onClick={() => setJanelaInteira(true)} ref={botaoDeOcupar} size="sm" variant="secondary">
          Ocupar a janela
        </Button>
      </div>
      <div
        aria-label={janelaInteira ? `${tela.nome}, em janela inteira` : undefined}
        aria-modal={janelaInteira || undefined}
        className={janelaInteira ? 'palco palco-janela' : 'palco'}
        ref={palco}
        role={janelaInteira ? 'dialog' : undefined}
      >
        {janelaInteira && (
          <div className="palco-janela-barra">
            <Button onClick={() => setJanelaInteira(false)} ref={botaoDeSair} size="sm" variant="secondary">
              Sair da janela inteira (Esc)
            </Button>
          </div>
        )}
        <div className="palco-moldura">
          <Moldura item={tela.item} modulo={tela.modulo}>
            <Componente key={tela.id} />
          </Moldura>
        </div>
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
