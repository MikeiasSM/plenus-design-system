import { useEffect, useRef, useState } from 'react';
import { Button, CodeBlock, InputText, SegmentedControl, Select, Switch } from '@plenustech/design-system';
import { lerTemaDoDocumento, mensagemConfiavel, ROTA_DA_PREVIA, type MensagemDaPrevia, type MensagemParaAPrevia } from './janela';
import type { Controle, DefinicaoDoPlayground, NivelDaVerificacao, Valores } from './tipos';

const LARGURAS = [
  { label: 'Livre', value: 'livre', maxima: '100%' },
  { label: 'Tablet', value: 'tablet', maxima: '768px' },
  { label: 'Celular', value: 'celular', maxima: '390px' },
] as const;

const MARCAS: Record<NivelDaVerificacao, string> = { ok: '✓', atencao: '!', falha: '✕' };

/** Os mais recentes, numa caixa de altura fixa: hover dispara em rajada, e o painel nao pode crescer com ele. */
const LIMITE_DE_EVENTOS = 6;

/** Opcoes curtas cabem lado a lado; as demais vao num `Select`. */
function cabeLadoALado(opcoes: readonly string[]) {
  return opcoes.length <= 4 && opcoes.join('').length <= 28;
}

interface Evento {
  hora: string;
  id: number;
  nome: string;
}

function CampoDoControle({
  controle,
  mudar,
  valor,
}: {
  controle: Controle;
  mudar: (valor: string | number | boolean) => void;
  valor: string | number | boolean;
}) {
  const { nome } = controle;

  if (controle.tipo === 'booleano') {
    return (
      <div className="pg-boolean">
        <Switch checked={Boolean(valor)} label={nome} onChange={(evento) => mudar(evento.currentTarget.checked)} />
      </div>
    );
  }

  if (controle.tipo === 'texto') {
    return <InputText label={nome} onChange={(evento) => mudar(evento.currentTarget.value)} size="sm" value={String(valor)} />;
  }

  if (controle.tipo === 'numero') {
    return (
      <InputText
        label={nome}
        max={controle.max}
        min={controle.min}
        onChange={(evento) => mudar(Number(evento.currentTarget.value))}
        size="sm"
        step={controle.passo}
        type="number"
        value={String(valor)}
      />
    );
  }

  if (!cabeLadoALado(controle.opcoes)) {
    return (
      <Select
        label={nome}
        onValueChange={mudar}
        options={controle.opcoes.map((opcao) => ({ label: opcao, value: opcao }))}
        size="sm"
        value={String(valor)}
      />
    );
  }

  return (
    <div className="pg-field">
      <span aria-hidden="true" className="pg-label">{nome}</span>
      <SegmentedControl
        items={controle.opcoes.map((opcao) => ({ label: opcao, value: opcao }))}
        label={nome}
        onValueChange={mudar}
        size="sm"
        value={String(valor)}
      />
    </div>
  );
}

/** Altura de partida do iframe, ate a previa dizer a do conteudo. */
const ALTURA_INICIAL = 320;

/** O tema do documento, acompanhado em tempo real: o iframe o recebe junto dos valores. */
function useTemaDoDocumento() {
  const [tema, setTema] = useState(lerTemaDoDocumento);

  useEffect(() => {
    const observador = new MutationObserver(() => setTema(lerTemaDoDocumento()));
    observador.observe(document.documentElement, { attributeFilter: ['data-theme'], attributes: true });
    return () => observador.disconnect();
  }, []);

  return tema;
}

interface JanelaProps {
  componente: string;
  largura: string;
  registrar: (evento: string) => void;
  titulo: string;
  valores: Valores;
}

/**
 * A previa numa janela propria: o iframe carrega o Showcase na rota de previa, mesma origem, e so recebe os valores
 * por mensagem, sem recarregar. Cada evento volta pelo mesmo canal.
 */
function JanelaDaPrevia({ componente, largura, registrar, titulo, valores }: JanelaProps) {
  const quadro = useRef<HTMLIFrameElement>(null);
  const pronta = useRef(false);
  const tema = useTemaDoDocumento();
  const [altura, setAltura] = useState(ALTURA_INICIAL);
  // O ouvinte vive o tempo do iframe; o que muda a cada render fica numa referencia.
  const registrarAtual = useRef(registrar);
  const estado = useRef<MensagemParaAPrevia>({ tipo: 'estado', tema, valores });

  registrarAtual.current = registrar;
  estado.current = { tipo: 'estado', tema, valores };

  function enviar() {
    if (pronta.current) {
      quadro.current?.contentWindow?.postMessage(estado.current, window.location.origin);
    }
  }

  useEffect(() => {
    function receber(evento: MessageEvent<MensagemDaPrevia>) {
      if (!mensagemConfiavel(evento, quadro.current?.contentWindow ?? null)) {
        return;
      }

      if (evento.data?.tipo === 'pronto') {
        pronta.current = true;
        enviar();
      } else if (evento.data?.tipo === 'evento') {
        registrarAtual.current(evento.data.nome);
      } else if (evento.data?.tipo === 'altura') {
        setAltura(evento.data.altura);
      }
    }

    window.addEventListener('message', receber);
    return () => window.removeEventListener('message', receber);
  }, []);

  useEffect(enviar, [tema, valores]);

  return (
    <iframe
      className="pg-janela"
      ref={quadro}
      src={`${window.location.pathname}${window.location.search}#/${ROTA_DA_PREVIA}/${encodeURIComponent(componente)}`}
      style={{ height: altura, maxWidth: largura }}
      title={titulo}
    />
  );
}

/** Previa do componente com as propriedades editaveis, o codigo que a reproduz, os eventos disparados e as verificacoes. */
export function Playground({ componente, definicao }: { componente: string; definicao: DefinicaoDoPlayground }) {
  const [valores, setValores] = useState<Valores>(definicao.inicial);
  const [largura, setLargura] = useState<(typeof LARGURAS)[number]['value']>('livre');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const verificacoes = definicao.verificar?.(valores) ?? [];
  const escolhida = LARGURAS.find((item) => item.value === largura) ?? LARGURAS[0];
  // Em Livre, a previa segue a janela de verdade; so as larguras fixas precisam de uma janela propria.
  const emJanela = definicao.emJanela && largura !== 'livre';
  const pendentes = verificacoes.filter((verificacao) => verificacao.nivel !== 'ok').length;

  function registrar(nome: string) {
    const hora = new Date().toLocaleTimeString('pt-BR');
    setEventos((atuais) => [{ hora, id: performance.now(), nome }, ...atuais].slice(0, LIMITE_DE_EVENTOS));
  }

  return (
    <div className="pg">
      <div className="pg-main">
        <div className="pg-stage-wrap">
          <div className="pg-toolbar">
            <SegmentedControl
              items={LARGURAS.map(({ label, value }) => ({ label, value }))}
              label="Largura da prévia"
              onValueChange={(valor) => setLargura(valor as typeof largura)}
              size="sm"
              value={largura}
            />
            <span className="pg-caption">
              {definicao.emJanela
                ? 'Em Livre, a prévia segue a janela; em Tablet e Celular, roda numa janela dessa largura, e as consultas de mídia valem dentro dela.'
                : 'A largura estreita a prévia; as consultas de mídia seguem a janela.'}
            </span>
          </div>
          <div className="pg-stage-bg">
            {emJanela ? (
              <JanelaDaPrevia
                componente={componente}
                largura={escolhida.maxima}
                registrar={registrar}
                titulo={`Prévia de ${componente} na largura de ${escolhida.label.toLowerCase()}`}
                valores={valores}
              />
            ) : (
              <div className="pg-stage" style={{ maxWidth: escolhida.maxima }}>
                {definicao.renderizar(valores, registrar)}
              </div>
            )}
          </div>
        </div>
        <div className="pg-controls">
          {definicao.controles.map((controle) => (
            <CampoDoControle
              controle={controle}
              key={controle.nome}
              mudar={(valor) => setValores((atuais) => ({ ...atuais, [controle.nome]: valor }))}
              valor={valores[controle.nome]}
            />
          ))}
          <Button onClick={() => setValores(definicao.inicial)} size="sm" variant="ghost">
            Restaurar padrão
          </Button>
        </div>
      </div>
      <div className="pg-code">
        <CodeBlock code={definicao.codigo(valores)} language="Código" syntax="tsx" />
      </div>
      <div className="pg-bottom">
        <section aria-labelledby="pg-eventos" className="pg-panel">
          <header className="pg-panel-head">
            <h3 id="pg-eventos">Eventos</h3>
            <Button disabled={eventos.length === 0} onClick={() => setEventos([])} size="sm" variant="ghost">
              Limpar
            </Button>
          </header>
          <div aria-live="off" className="pg-log" role="log">
            {eventos.length === 0 && <p className="pg-empty">Interaja com a prévia. Cada callback disparado aparece aqui.</p>}
            {eventos.map((evento) => (
              <div className="pg-event" key={evento.id}>
                <code>{evento.nome}</code>
                <span>{evento.hora}</span>
              </div>
            ))}
          </div>
        </section>
        {verificacoes.length > 0 && (
          <section aria-labelledby="pg-verificacoes" className="pg-panel">
            <header className="pg-panel-head">
              <h3 id="pg-verificacoes">Verificações</h3>
              <span className="pg-summary">{pendentes === 0 ? 'tudo certo' : `${pendentes} para olhar`}</span>
            </header>
            {verificacoes.map((verificacao) => (
              <div className="pg-check" key={verificacao.titulo}>
                <span aria-hidden="true" className={`pg-mark pg-mark-${verificacao.nivel}`}>
                  {MARCAS[verificacao.nivel]}
                </span>
                <div>
                  <strong>{verificacao.titulo}</strong>
                  <small>{verificacao.detalhe}</small>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
