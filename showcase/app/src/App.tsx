import { useEffect, useRef, useState } from 'react';
import { IconSearch, InputText, SegmentedControl, SkipLink, ToastRegion } from '@plenustech/design-system';
import { version } from '../../../package.json';
import { familias } from './catalogo';
import { PaginaDoComponente } from './estrutura/PaginaDoComponente';
import { VisaoGeral } from './estrutura/VisaoGeral';

const CHAVE_DO_TEMA = 'plenus-showcase-tema';

/** A escolha guardada vence; sem ela, a preferencia do sistema. */
function lerTema() {
  try {
    const guardado = localStorage.getItem(CHAVE_DO_TEMA);

    if (guardado === 'dark' || guardado === 'light') {
      return guardado;
    }
  } catch {
    // Sem acesso ao armazenamento, quem decide e o sistema.
  }

  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
    document.documentElement.dataset.theme = tema;

    try {
      localStorage.setItem(CHAVE_DO_TEMA, tema);
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
              { label: 'Claro', value: 'light' },
              { label: 'Escuro', value: 'dark' },
            ]}
            label="Tema"
            onValueChange={(valor) => setTema(valor as 'light' | 'dark')}
            size="sm"
            value={tema}
          />
        </div>
      </header>

      <div className="body">
        <nav aria-label="Componentes" className="sidebar">
          <a aria-current={atual ? undefined : 'page'} className="sidebar-home" href="#/">
            Visão geral
          </a>
          {filtradas.map((familia) => (
            <div className="sidebar-group" key={familia.nome}>
              <p className="sidebar-title">
                <span>{familia.nome}</span>
                <span>{familia.componentes.length}</span>
              </p>
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
          ))}
          {filtradas.length === 0 && <p className="sidebar-empty">Nenhum componente com esse nome.</p>}
        </nav>

        <main className="main" id="conteudo" tabIndex={-1}>
          {atual ? (
            <PaginaDoComponente componente={atual.componente} familia={atual.familia} key={atual.componente.nome} />
          ) : (
            <VisaoGeral familias={familias} />
          )}
        </main>
      </div>
    </div>
  );
}
