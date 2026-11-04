import { useEffect, useRef, useState } from 'react';
import { IconChevronRight, IconSearch, InputText, SegmentedControl, SkipLink, ToastRegion } from '@plenustech/design-system';
import { version } from '../../../package.json';
import { familias } from './catalogo';
import { Composicoes } from './composicoes/Composicoes';
import { CAMINHO_DAS_COMPOSICOES, ROTA_DAS_COMPOSICOES } from './composicoes/menu';
import { telas } from './composicoes/telas';
import { PaginaDoComponente } from './estrutura/PaginaDoComponente';
import { VisaoGeral } from './estrutura/VisaoGeral';
import { Fundamentos } from './fundamentos/Fundamentos';

const CHAVE_DO_TEMA = 'plenus-showcase-tema';

type Tema = 'light' | 'dark' | 'system';

/** A escolha guardada vence; sem ela, o sistema decide e o documento fica sem `data-theme`. */
function lerTema(): Tema {
  try {
    const guardado = localStorage.getItem(CHAVE_DO_TEMA);

    if (guardado === 'dark' || guardado === 'light') {
      return guardado;
    }
  } catch {
    // Sem acesso ao armazenamento, quem decide e o sistema.
  }

  return 'system';
}

/** Ignora caixa e acento, para "formularios" achar "Formulários". */
function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** `#/button/playground`: o componente e, opcionalmente, a secao da pagina. */
function lerRota() {
  const [componente = '', secao = ''] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { componente, secao };
}

function useRota() {
  const [rota, setRota] = useState(lerRota);

  useEffect(() => {
    const atualizar = () => setRota(lerRota());
    window.addEventListener('hashchange', atualizar);
    return () => window.removeEventListener('hashchange', atualizar);
  }, []);

  return rota;
}

export function App() {
  const [tema, setTema] = useState(lerTema);
  const [busca, setBusca] = useState('');
  const campoDeBusca = useRef<HTMLInputElement>(null);
  const rota = useRota();
  const termo = normalizar(busca.trim());

  const atual = familias
    .flatMap((familia) => familia.componentes.map((componente) => ({ componente, familia: familia.nome })))
    .find(({ componente }) => componente.nome.toLowerCase() === rota.componente);

  // A familia da pagina aberta comeca expandida; as outras, como a pessoa as deixou.
  const [abertas, setAbertas] = useState<ReadonlySet<string>>(() => new Set(atual ? [atual.familia] : []));
  const [familiaAtual, setFamiliaAtual] = useState(atual?.familia);

  if (atual?.familia !== familiaAtual) {
    setFamiliaAtual(atual?.familia);
    if (atual && !abertas.has(atual.familia)) {
      setAbertas(new Set([...abertas, atual.familia]));
    }
  }

  function alternar(nome: string) {
    const proximas = new Set(abertas);
    if (!proximas.delete(nome)) {
      proximas.add(nome);
    }
    setAbertas(proximas);
  }

  const noComposicoes = rota.componente === ROTA_DAS_COMPOSICOES;
  const noFundamentos = rota.componente === 'fundamentos';
  const telasFiltradas = telas.filter((tela) => !termo || [tela.nome, tela.resumo, 'composições'].some((texto) => normalizar(texto).includes(termo)));

  const filtradas = familias
    .map((familia) => ({
      ...familia,
      componentes: familia.componentes.filter(
        (componente) =>
          !termo ||
          [componente.nome, componente.papel, familia.nome].some((texto) => normalizar(texto).includes(termo)),
      ),
    }))
    .filter((familia) => familia.componentes.length > 0);

  useEffect(() => {
    if (tema === 'system') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = tema;
    }

    try {
      if (tema === 'system') {
        localStorage.removeItem(CHAVE_DO_TEMA);
      } else {
        localStorage.setItem(CHAVE_DO_TEMA, tema);
      }
    } catch {
      // Guardar a escolha e conveniencia, nao requisito.
    }
  }, [tema]);

  useEffect(() => {
    const alvo = rota.secao ? document.getElementById(rota.secao) : null;

    if (alvo) {
      alvo.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [rota.componente, rota.secao]);

  useEffect(() => {
    function atalho(evento: KeyboardEvent) {
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault();
        campoDeBusca.current?.focus();
      }
    }

    window.addEventListener('keydown', atalho);
    return () => window.removeEventListener('keydown', atalho);
  }, []);

  return (
    <div className="shell">
      {/* O endereco guarda a rota; o atalho leva o foco sem troca-lo. */}
      <SkipLink
        href="#conteudo"
        onClick={(evento) => {
          evento.preventDefault();
          document.getElementById('conteudo')?.focus();
        }}
      />
      <ToastRegion />
      <header className="topbar">
        <a className="brand" href="#/">
          <span aria-hidden="true" className="brand-mark">P</span>
          Plenustech DS
        </a>
        <div className="topbar-search">
          <InputText
            aria-keyshortcuts="Control+K"
            aria-label="Buscar componente"
            icon={<IconSearch />}
            onChange={(evento) => setBusca(evento.currentTarget.value)}
            placeholder="Buscar componente ou família  (Ctrl K)"
            ref={campoDeBusca}
            type="search"
            value={busca}
          />
        </div>
        <div className="topbar-end">
          <span className="version">v{version}</span>
          <SegmentedControl
            items={[
              { label: 'Sistema', value: 'system' },
              { label: 'Claro', value: 'light' },
              { label: 'Escuro', value: 'dark' },
            ]}
            label="Tema"
            onValueChange={(valor) => setTema(valor as Tema)}
            size="sm"
            value={tema}
          />
        </div>
      </header>

      <div className="body">
        <nav aria-label="Componentes" className="sidebar">
          <a aria-current={atual || noComposicoes || noFundamentos ? undefined : 'page'} className="sidebar-home" href="#/">
            Visão geral
          </a>
          <a aria-current={noFundamentos ? 'page' : undefined} className="sidebar-home" href="#/fundamentos">
            Fundamentos
          </a>
          {telasFiltradas.length > 0 && (
            <div className="sidebar-group">
              <a aria-current={noComposicoes && !rota.secao ? 'page' : undefined} className="sidebar-title sidebar-title-link" href={CAMINHO_DAS_COMPOSICOES}>
                <span>Composições</span>
                <span className="sidebar-count">{telasFiltradas.length}</span>
              </a>
              <div className="sidebar-items">
                {telasFiltradas.map((tela) => (
                  <a
                    aria-current={noComposicoes && rota.secao === tela.id ? 'page' : undefined}
                    className="sidebar-item"
                    href={`${CAMINHO_DAS_COMPOSICOES}/${tela.id}`}
                    key={tela.id}
                  >
                    {tela.nome}
                  </a>
                ))}
              </div>
            </div>
          )}
          {filtradas.map((familia) => {
            // Na busca, todas abertas: o resultado nao pode ficar escondido num modulo recolhido.
            const aberta = Boolean(termo) || abertas.has(familia.nome);
            const listaId = `familia-${normalizar(familia.nome).replace(/\W+/g, '-')}`;

            return (
              <div className="sidebar-group" key={familia.nome}>
                <button
                  aria-controls={listaId}
                  aria-expanded={aberta}
                  className="sidebar-title"
                  onClick={() => alternar(familia.nome)}
                  type="button"
                >
                  <IconChevronRight aria-hidden="true" className="sidebar-chevron" size={12} />
                  <span>{familia.nome}</span>
                  <span className="sidebar-count">{familia.componentes.length}</span>
                </button>
                <div className="sidebar-items" hidden={!aberta} id={listaId}>
                  {familia.componentes.map((componente) => (
                    <a
                      aria-current={componente === atual?.componente ? 'page' : undefined}
                      className="sidebar-item"
                      href={`#/${componente.nome.toLowerCase()}`}
                      key={componente.nome}
                    >
                      {componente.nome}
                      {componente.previsto && <span className="sidebar-planned">previsto</span>}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
          {filtradas.length === 0 && <p className="sidebar-empty">Nenhum componente com esse nome.</p>}
        </nav>

        <main className={noComposicoes ? 'main main-composicao' : 'main'} id="conteudo" tabIndex={-1}>
          {noComposicoes ? (
            <Composicoes tela={rota.secao} />
          ) : noFundamentos ? (
            <Fundamentos />
          ) : atual ? (
            <PaginaDoComponente componente={atual.componente} familia={atual.familia} key={atual.componente.nome} />
          ) : (
            <VisaoGeral familias={familias} />
          )}
        </main>
      </div>
    </div>
  );
}
