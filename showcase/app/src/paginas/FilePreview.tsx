import { useState } from 'react';
import {
  FilePreview,
  FileUpload,
  type FilePreviewKind,
  type FilePreviewSize,
  type FilePreviewStatus,
  type FileUploadItem,
} from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TIPOS = ['image', 'video', 'file'] as const;
const TAMANHOS = ['sm', 'md', 'lg'] as const;
const ESTADOS = ['idle', 'uploading', 'done', 'error'] as const;

/** Imagem de exemplo desenhada aqui mesmo, sem arquivo externo: um degrade com duas formas. */
const IMAGEM =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8ec5d6"/><stop offset="1" stop-color="#2f6f8f"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><circle cx="68" cy="28" r="12" fill="#f4e3a1"/><path d="M0 80 L30 46 L52 70 L66 58 L96 86 V96 H0 Z" fill="#1f4a5e"/></svg>',
  );

/** Poster claro, para mostrar que o play continua legivel sobre fundo claro. */
const POSTER_CLARO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#f6f4ee"/><rect x="12" y="60" width="72" height="8" rx="4" fill="#e4e0d4"/></svg>',
  );

const playground = definirPlayground({
  inicial: { kind: 'image', size: 'md', status: 'idle', progress: 40, badge: '', alt: '', semImagem: false },
  controles: [
    { tipo: 'opcoes', nome: 'kind', opcoes: TIPOS },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'opcoes', nome: 'status', opcoes: ESTADOS },
    { tipo: 'numero', nome: 'progress', min: 0, max: 100, passo: 5 },
    { tipo: 'texto', nome: 'badge' },
    { tipo: 'texto', nome: 'alt' },
    { tipo: 'booleano', nome: 'semImagem' },
  ],
  renderizar: (valores) => (
    <FilePreview
      alt={valores.alt}
      badge={valores.badge || undefined}
      kind={valores.kind as FilePreviewKind}
      progress={valores.progress}
      size={valores.size as FilePreviewSize}
      src={valores.semImagem ? null : IMAGEM}
      status={valores.status as FilePreviewStatus}
    />
  ),
  codigo: (valores) =>
    gerarJsx('FilePreview', [
      ['src', valores.semImagem ? undefined : '/capa.png'],
      ['kind', valores.kind, 'image'],
      ['size', valores.size, 'md'],
      ['status', valores.status, 'idle'],
      ['progress', valores.status === 'uploading' ? valores.progress : undefined],
      ['badge', valores.badge || undefined],
      ['alt', valores.alt || undefined],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.alt.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `role="img" com o nome "${valores.alt.trim()}".` }
        : { nivel: 'ok', titulo: 'Decorativo', detalhe: 'Sem alt, o quadro sai da árvore: o nome do arquivo fica no texto ao lado.' },
    ];

    if (valores.status === 'uploading') {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Progresso só desenhado',
        detalhe: 'A barra do quadro não se anuncia. O número acessível fica com quem usa, como a barra da linha do FileUpload.',
      });
    }

    if (valores.size === 'sm' && valores.badge) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Selo fora da vista', detalhe: 'No sm o selo não cabe e sai; o estado continua no ícone.' });
    }

    return verificacoes;
  },
});

function Estados() {
  return (
    <div className="stack">
      {TAMANHOS.map((tamanho) => (
        <div key={tamanho} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {ESTADOS.map((estado) => (
            <FilePreview key={estado} progress={estado === 'uploading' ? 60 : undefined} size={tamanho} src={IMAGEM} status={estado} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Escolha de verdade: o File recebido vai direto em `preview.file`, e o quadro cria e revoga a URL. */
function ComArquivo() {
  const [items, setItems] = useState<FileUploadItem[]>([]);

  function receber(files: File[]) {
    setItems((atuais) => [
      ...atuais,
      ...files.map<FileUploadItem>((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        preview: { file, kind: file.type.startsWith('image/') ? 'image' : 'file' },
        size: file.size,
        status: 'done',
      })),
    ]);
  }

  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <FileUpload
        accept="image/*,.pdf"
        items={items}
        label="Imagens"
        multiple
        onFilesSelected={receber}
        onRemove={(id) => setItems((atuais) => atuais.filter((item) => item.id !== id))}
      />
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Estados e tamanhos',
      descricao:
        'Parado, enviando, enviado e com erro, em sm, md e lg. O estado fala pela borda e pelo ícone do canto, também no sm, nunca só pela cor.',
      largo: true,
      Previa: Estados,
      codigo:
        '<FilePreview src="/capa.png" status="idle" />\n<FilePreview src="/capa.png" status="uploading" progress={60} />\n<FilePreview src="/capa.png" status="done" />\n<FilePreview src="/capa.png" status="error" />',
    },
    {
      titulo: 'Vídeo e arquivo',
      descricao: 'No vídeo, o play fica num disco escuro, legível também sobre um pôster claro. Sem imagem, o ícone de reserva, com o selo do tipo.',
      Previa: () => (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <FilePreview kind="video" size="lg" src={IMAGEM} />
          <FilePreview kind="video" size="lg" src={POSTER_CLARO} />
          <FilePreview badge="PDF" kind="file" size="lg" />
        </div>
      ),
      codigo: '<FilePreview kind="video" size="lg" src="/poster.jpg" />\n<FilePreview kind="file" size="lg" badge="PDF" />',
    },
    {
      titulo: 'No FileUpload, com o arquivo escolhido',
      descricao:
        'Escolha imagens: o File recebido vai em preview.file, e a prévia cria a URL de objeto ao montar e a revoga ao sair. Na linha, o quadro é o sm, da altura do nome e do tamanho.',
      Previa: ComArquivo,
      codigo:
        "function receber(files: File[]) {\n  setEnvios(files.map((file) => ({\n    id: file.name,\n    name: file.name,\n    size: file.size,\n    status: 'uploading',\n    preview: { file },\n  })));\n}",
    },
  ],
  faca: {
    Previa: () => <FilePreview size="lg" src={IMAGEM} />,
    texto: 'Passe o File em file, ou uma miniatura pronta em src. Para foto grande, a miniatura poupa decodificar a imagem inteira num quadro de 56px.',
    codigo: '<FilePreview file={arquivo} />\n<FilePreview src={miniaturaDoServidor} />',
  },
  evite: {
    Previa: () => <FilePreview size="lg" src={IMAGEM} />,
    texto: 'Criar a URL no render, como src={URL.createObjectURL(arquivo)}: cada atualização do progresso cria uma URL nova, que ninguém revoga, e a imagem pisca.',
    codigo: '<FilePreview src={URL.createObjectURL(arquivo)} />',
  },
  garantias: [
    { garantia: 'Decorativo por padrão', como: <>Sem <code>alt</code>, <code>aria-hidden</code>; com ele, <code>role=&quot;img&quot;</code> e o nome.</>, teste: 'FilePreview.test.tsx' },
    { garantia: 'URL com dono', como: <>Com <code>file</code>, a URL de objeto é criada ao montar e revogada ao trocar o arquivo e ao desmontar.</>, teste: 'FilePreview.test.tsx' },
    { garantia: 'Falha também antes da hidratação', como: 'Ao montar, a imagem já terminada sem tamanho cai no ícone de reserva.', teste: 'FilePreview.test.tsx' },
    { garantia: 'Estado além da cor', como: 'Borda e ícone no canto em todos os tamanhos; em cores forçadas, o erro ganha borda dupla.', teste: 'FilePreview.test.tsx' },
    { garantia: 'Progresso seguro', como: <>O valor é limitado de 0 a 100, e <code>NaN</code> vira progresso indeterminado.</>, teste: 'FilePreview.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div>, que vão à raiz. No FileUpload, preview: { file, src, kind } num item põe o quadro no lugar do ícone.',
  api: [
    { nome: 'file', tipo: 'Blob | null', descricao: 'O próprio arquivo. A prévia cria e revoga a URL de objeto; passe sempre o mesmo objeto. Vale sobre src.' },
    { nome: 'src', tipo: 'string | null', descricao: 'Imagem ou pôster por endereço. Para arquivo grande, uma miniatura feita pelo produto.' },
    { nome: 'kind', tipo: "'image' | 'video' | 'file'", padrao: "'image'", descricao: 'video põe o play sobre o pôster; file mostra só o ícone.' },
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: '40, 56 ou 96px de lado. No sm, o selo sai e o ícone de estado fica menor.' },
    { nome: 'status', tipo: "'idle' | 'uploading' | 'done' | 'error'", padrao: "'idle'", descricao: 'Na borda e no ícone do canto.' },
    { nome: 'progress', tipo: 'number', descricao: 'De 0 a 100, em uploading. Sem ele, ou NaN, a barra é indeterminada. Só desenho.' },
    { nome: 'badge', tipo: 'ReactNode', descricao: 'Selo curto no canto de cima, como "PDF".' },
    { nome: 'icon', tipo: 'ReactNode', descricao: 'Troca o ícone de reserva.' },
    { nome: 'alt', tipo: 'string', padrao: "''", descricao: 'Nome da prévia. Vazio, ela é decorativa.' },
  ],
};
