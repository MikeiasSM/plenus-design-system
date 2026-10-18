import { Button, Spinner, type SpinnerSize } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md', 'lg'] as const;
const MEDIDAS: Record<SpinnerSize, number> = { sm: 14, md: 20, lg: 28 };

const playground = definirPlayground({
  inicial: { size: 'md', label: 'Carregando' },
  controles: [
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
    { tipo: 'texto', nome: 'label' },
  ],
  renderizar: (valores) => <Spinner label={valores.label || undefined} size={valores.size as SpinnerSize} />,
  codigo: (valores) =>
    gerarJsx('Spinner', [
      ['label', valores.label || undefined],
      ['size', valores.size, 'md'],
    ]),
  verificar: (valores): Verificacao[] => [
    valores.label.trim()
      ? { nivel: 'ok', titulo: 'Anunciado', detalhe: `role="status" com o nome "${valores.label.trim()}".` }
      : {
          nivel: 'atencao',
          titulo: 'Decorativo',
          detalhe: 'Sem label, fica com aria-hidden. Quem o envolve precisa anunciar a atividade.',
        },
  ],
});

function Variantes() {
  return (
    <div className="demo-row">
      {TAMANHOS.map((tamanho) => (
        <div className="demo-box stack" key={tamanho} style={{ justifyItems: 'center' }}>
          <Spinner label="Carregando" size={tamanho} />
          <code>
            {tamanho} · {MEDIDAS[tamanho]}px
          </code>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Com <code>label</code></dt>
      <dd>Sai com <code>role=&quot;status&quot;</code> e o rótulo como nome: o leitor de tela anuncia a atividade.</dd>
      <dt>Sem <code>label</code></dt>
      <dd>Decorativo, com <code>aria-hidden</code>. Serve quando outro elemento já diz o que acontece.</dd>
      <dt>No <code>Button</code></dt>
      <dd>O <code>loading</code> do botão usa o Spinner decorativo; quem anuncia o estado é o próprio botão, com <code>aria-busy</code>.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Carregando um painel',
      descricao: 'Sozinho, com label: o leitor de tela ouve o que está em curso.',
      Previa: () => <Spinner label="Carregando o painel" size="lg" />,
      codigo: '<Spinner label="Carregando o painel" size="lg" />',
    },
    {
      titulo: 'Ao lado de um texto',
      descricao: 'O texto visível já diz o que acontece: o indicador fica decorativo.',
      Previa: () => (
        <div className="demo-row" role="status">
          <Spinner size="sm" />
          <span>Sincronizando registros</span>
        </div>
      ),
      codigo: '<div role="status">\n  <Spinner size="sm" />\n  <span>Sincronizando registros</span>\n</div>',
    },
    {
      titulo: 'Dentro do botão',
      descricao: 'loading no Button já traz o Spinner; não se monta um à parte.',
      Previa: () => <Button loading>Salvando</Button>,
      codigo: '<Button loading>Salvando</Button>',
    },
  ],
  Variantes,
  Modos,
  garantias: [
    { garantia: 'Decorativo por padrão', como: <>Sem <code>label</code>, <code>aria-hidden=&quot;true&quot;</code>.</>, teste: 'Spinner.test.tsx' },
    { garantia: 'Anúncio com nome', como: <>Com <code>label</code>, <code>role=&quot;status&quot;</code> e <code>aria-label</code>.</>, teste: 'Spinner.test.tsx' },
  ],
  notaDaApi: 'Além destas, todas as propriedades nativas de <span>.',
  api: [
    { nome: 'size', tipo: "'sm' | 'md' | 'lg'", padrao: "'md'", descricao: 'Diâmetro de 14, 20 ou 28px.' },
    { nome: 'label', tipo: 'string', descricao: 'Nome anunciado. Sem ele, o indicador é decorativo.' },
  ],
};
