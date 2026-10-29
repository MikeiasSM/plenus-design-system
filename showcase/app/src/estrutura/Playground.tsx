import { useState } from 'react';
import { Button, CodeBlock, InputText, SegmentedControl, Select, Switch } from '@plenustech/design-system';
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

/** Previa do componente com as propriedades editaveis, o codigo que a reproduz, os eventos disparados e as verificacoes. */
export function Playground({ definicao }: { definicao: DefinicaoDoPlayground }) {
  const [valores, setValores] = useState<Valores>(definicao.inicial);
  const [largura, setLargura] = useState<(typeof LARGURAS)[number]['value']>('livre');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const verificacoes = definicao.verificar?.(valores) ?? [];
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
            <span className="pg-caption">A largura estreita a prévia; as consultas de mídia seguem a janela.</span>
          </div>
          <div className="pg-stage-bg">
            <div className="pg-stage" style={{ maxWidth: LARGURAS.find((item) => item.value === largura)?.maxima }}>
              {definicao.renderizar(valores, registrar)}
            </div>
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
