import { useEffect, useRef, useState } from 'react';
import {
  FileUpload,
  Switch,
  type FileUploadItem,
} from '@plenustech/design-system';
import { expr, gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const MB = 1024 ** 2;

const playground = definirPlayground({
  inicial: { label: 'Anexo', hint: '', error: '', accept: '.pdf,image/*', maxSizeEmMb: 5, multiple: false, disabled: false },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'texto', nome: 'error' },
    { tipo: 'texto', nome: 'accept' },
    { tipo: 'numero', nome: 'maxSizeEmMb', min: 0, max: 100 },
    { tipo: 'booleano', nome: 'multiple' },
    { tipo: 'booleano', nome: 'disabled' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <FileUpload
        accept={valores.accept || undefined}
        disabled={valores.disabled}
        error={valores.error || undefined}
        hint={valores.hint || undefined}
        label={valores.label}
        maxSize={valores.maxSizeEmMb ? valores.maxSizeEmMb * MB : undefined}
        multiple={valores.multiple}
        onFilesRejected={(recusas) =>
          registrar(`onFilesRejected: ${recusas.map(({ file, reason }) => `${file.name} (${reason})`).join(', ')}`)
        }
        onFilesSelected={(files) => registrar(`onFilesSelected: ${files.map((file) => file.name).join(', ')}`)}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('FileUpload', [
      ['label', valores.label],
      ['hint', valores.hint || undefined],
      ['error', valores.error || undefined],
      ['accept', valores.accept || undefined],
      ['maxSize', valores.maxSizeEmMb ? expr(`${valores.maxSizeEmMb} * 1024 ** 2`) : undefined],
      ['multiple', valores.multiple, false],
      ['disabled', valores.disabled, false],
      ['onFilesSelected', expr('enviar')],
      ['onFilesRejected', expr('registrarRecusas')],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", ligado ao seletor nativo pelo rótulo.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'label é obrigatório: nomeia o seletor de arquivo.' },
      {
        nivel: 'ok',
        titulo: 'Seletor nativo',
        detalhe: 'O <input type="file"> fica fora da vista e na tabulação; o foco dele acende a zona.',
      },
    ];

    if (!valores.accept && !valores.maxSizeEmMb) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Sem restrições escritas',
        detalhe: 'Sem accept nem maxSize, a zona não diz o que aceita. Declare-os, ou escreva no hint.',
      });
    }

    if (valores.error.trim()) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Erro anunciado',
        detalhe: 'O error do produto vence a mensagem de recusa, sai com role="alert" e marca aria-invalid.',
      });
    }

    return verificacoes;
  },
});

/** Envio de mentira: o progresso anda por `setInterval`; com a queda ligada ao começar, o envio falha aos 60%. */
function EnvioSimulado() {
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [falhar, setFalhar] = useState(true);
  const [recusas, setRecusas] = useState(0);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const ativos = timers.current;
    return () => ativos.forEach((timer) => window.clearInterval(timer));
  }, []);

  function atualizar(id: string, mudanca: Partial<FileUploadItem>) {
    setItems((atuais) => atuais.map((item) => (item.id === id ? { ...item, ...mudanca } : item)));
  }

  function parar(id: string) {
    window.clearInterval(timers.current.get(id));
    timers.current.delete(id);
  }

  function subir(id: string) {
    const vaiFalhar = falhar;
    let progresso = 0;
    atualizar(id, { error: undefined, progress: 0, status: 'uploading' });
    timers.current.set(
      id,
      window.setInterval(() => {
        progresso += 10;

        if (vaiFalhar && progresso >= 60) {
          parar(id);
          atualizar(id, { error: 'A conexão caiu.', status: 'error' });
        } else if (progresso >= 100) {
          parar(id);
          atualizar(id, { progress: 100, status: 'done' });
        } else {
          atualizar(id, { progress: progresso });
        }
      }, 300),
    );
  }

  function enviar(files: File[]) {
    const novos = files.map<FileUploadItem>((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      name: file.name,
      progress: 0,
      size: file.size,
      status: 'uploading',
    }));
    setItems((atuais) => [...atuais, ...novos]);
    novos.forEach((item) => subir(item.id));
  }

  function remover(id: string) {
    parar(id);
    setItems((atuais) => atuais.filter((item) => item.id !== id));
  }

  return (
    <div className="stack" style={{ width: '100%' }}>
      <Switch checked={falhar} label="Simular queda da conexão aos 60%" onChange={(evento) => setFalhar(evento.target.checked)} />
      <FileUpload
        accept=".pdf,image/*"
        hint={recusas ? `${recusas} arquivo(s) recusado(s) até agora.` : undefined}
        items={items}
        label="Anexos do documento"
        maxSize={5 * MB}
        multiple
        onCancel={remover}
        onFilesRejected={(novas) => setRecusas((total) => total + novas.length)}
        onFilesSelected={enviar}
        onRemove={remover}
        onRetry={subir}
      />
    </div>
  );
}

const ESTADOS: FileUploadItem[] = [
  { id: '1', name: 'relatorio-anual-2026.pdf', progress: 45, size: 24.6 * MB, status: 'uploading' },
  { id: '2', name: 'capa.png', size: 512 * 1024, status: 'done' },
  { error: 'A conexão caiu.', id: '3', name: 'apresentacao.mp4', size: 1.2 * 1024 * MB, status: 'error' },
];

function Variantes() {
  return (
    <div className="demo-grid">
      <FileUpload accept=".pdf,image/*" label="Um arquivo" maxSize={5 * MB} onFilesSelected={() => undefined} />
      <FileUpload accept="image/*" label="Galeria" maxSize={10 * MB} multiple onFilesSelected={() => undefined} />
    </div>
  );
}

function Modos() {
  return (
    <div className="stack">
      <div className="subsection">
        <h3>Estados da zona</h3>
        <div className="demo-grid">
          <FileUpload accept="video/*" error="O arquivo passa de 200 MB." label="Com erro" maxSize={200 * MB} onFilesSelected={() => undefined} />
          <FileUpload accept=".pdf" disabled label="Desabilitado" onFilesSelected={() => undefined} />
        </div>
        <p className="note">Arrastar por cima troca o tracejado por linha cheia na cor principal. Solto na zona desabilitada, o arquivo é ignorado.</p>
      </div>
      <div className="subsection">
        <h3>Estados de cada envio</h3>
        <div style={{ maxWidth: 520 }}>
          <FileUpload
            items={ESTADOS}
            label="Arquivos"
            onCancel={() => undefined}
            onFilesSelected={() => undefined}
            onRemove={() => undefined}
            onRetry={() => undefined}
          />
        </div>
        <p className="note">
          Subindo: Progress e cancelar. Enviado: remover. Com erro: a mensagem do produto, tentar de novo quando houver onRetry, e
          remover. Cada ação só aparece com o callback dela.
        </p>
      </div>
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Envio com progresso',
      descricao:
        'Escolha ou arraste PDFs e imagens. Acima de 5 MB ou de outro tipo, a recusa aparece no erro do campo. Ligada a queda, o envio falha aos 60%: tente de novo depois de desligá-la, ou cancele no meio.',
      Previa: EnvioSimulado,
      codigo:
        '<FileUpload\n  label="Anexos do documento"\n  accept=".pdf,image/*"\n  maxSize={5 * 1024 ** 2}\n  multiple\n  items={envios}\n  onFilesSelected={enviar}\n  onFilesRejected={registrarRecusas}\n  onCancel={cancelar}\n  onRetry={reenviar}\n  onRemove={remover}\n/>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <FileUpload accept=".pdf,image/*" label="Comprovante" maxSize={5 * MB} onFilesSelected={() => undefined} />
      </div>
    ),
    texto: 'Declare accept e maxSize: a zona escreve o que aceita e o motivo de cada recusa sai sozinho.',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <FileUpload hint="Só PDF, até 5 MB." label="Comprovante" onFilesSelected={() => undefined} />
      </div>
    ),
    texto: 'Escrever a restrição só no hint: o campo aceita qualquer arquivo e a recusa fica por conta do servidor.',
  },
  Variantes,
  Modos,
  teclado: [
    { teclas: ['Tab'], acao: 'Leva o foco ao seletor de arquivo; a zona acende o anel.' },
    { teclas: ['Enter', 'Espaço'], acao: 'Abre o seletor do sistema.' },
    { teclas: ['Tab'], acao: 'Na lista, percorre tentar de novo, cancelar e remover de cada envio.' },
  ],
  garantias: [
    {
      garantia: 'Seletor nativo',
      como: <>O <code>&lt;input type=&quot;file&quot;&gt;</code> nomeado pelo rótulo; o botão visível sai da tabulação e da árvore.</>,
      teste: 'FileUpload.test.tsx',
    },
    { garantia: 'Restrições descritas', como: 'Tipos, limite e ajuda entram na descrição do seletor.', teste: 'FileUpload.test.tsx' },
    {
      garantia: 'Recusa anunciada',
      como: <>O motivo sai no erro do campo, com <code>role=&quot;alert&quot;</code> e <code>aria-invalid</code>.</>,
      teste: 'FileUpload.test.tsx',
    },
    { garantia: 'Estado do envio', como: <>Cada linha anuncia enviando, enviado ou a falha por <code>role=&quot;status&quot;</code>.</>, teste: 'FileUpload.test.tsx' },
    { garantia: 'Tamanho legível', como: 'Base 1024, com os separadores da localidade.', teste: 'formatFileSize.test.ts' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div>, que vão à raiz. O Design System não envia o arquivo: recebe, valida e mostra.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Nome do campo, ligado ao seletor nativo.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo da zona.' },
    { nome: 'error', tipo: 'string', descricao: 'Erro do produto: vence a mensagem de recusa.' },
    { nome: 'accept', tipo: 'string', descricao: 'Tipos aceitos, como no input nativo: ".pdf,image/*". Escritos na zona.' },
    { nome: 'maxSize', tipo: 'number', descricao: 'Limite por arquivo, em bytes. Escrito na zona.' },
    { nome: 'multiple', tipo: 'boolean', padrao: 'false', descricao: 'Aceita vários; sem ele, do que for solto vale o primeiro.' },
    { nome: 'disabled', tipo: 'boolean', padrao: 'false', descricao: 'Desabilita o seletor e ignora o que for solto.' },
    { nome: 'onFilesSelected', tipo: '(files: File[]) => void', descricao: 'Recebe só os aceitos.' },
    {
      nome: 'onFilesRejected',
      tipo: "(rejections: { file: File; reason: 'type' | 'size' }[]) => void",
      descricao: 'Recebe os recusados e o motivo.',
    },
    {
      nome: 'items',
      tipo: "{ id; name; size; status: 'uploading' | 'done' | 'error'; progress?; error? }[]",
      padrao: '[]',
      descricao: 'Os envios, mantidos pelo produto, que informa o progresso de 0 a 100.',
    },
    { nome: 'onCancel', tipo: '(id: string) => void', descricao: 'Cancela o que está subindo.' },
    { nome: 'onRetry', tipo: '(id: string) => void', descricao: 'Tenta de novo o que falhou.' },
    { nome: 'onRemove', tipo: '(id: string) => void', descricao: 'Remove o que terminou ou falhou.' },
  ],
};
