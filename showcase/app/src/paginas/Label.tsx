import { useId } from 'react';
import { InputText, Label } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

function RotuloDoCodigo({ children, onClick, required }: { children: string; onClick?: () => void; required: boolean }) {
  const id = useId();

  return (
    <div className="stack" style={{ width: '100%', maxWidth: 320 }}>
      <Label htmlFor={id} onClick={onClick} required={required}>
        {children}
      </Label>
      <InputText id={id} placeholder="PRD-0001" required={required} />
    </div>
  );
}

function codigoDoRotulo(texto: string, required: boolean) {
  return [
    gerarJsx('Label', [['htmlFor', 'codigo'], ['required', required, false]], texto),
    gerarJsx('InputText', [['id', 'codigo'], ['placeholder', 'PRD-0001'], ['required', required, false]]),
  ].join('\n');
}

const playground = definirPlayground({
  inicial: { children: 'Código do produto', required: false },
  controles: [
    { tipo: 'texto', nome: 'children' },
    { tipo: 'booleano', nome: 'required' },
  ],
  renderizar: (valores, registrar) => (
    <RotuloDoCodigo onClick={() => registrar('onClick: o foco vai ao campo')} required={valores.required}>
      {valores.children}
    </RotuloDoCodigo>
  ),
  codigo: (valores) => codigoDoRotulo(valores.children, valores.required),
  verificar: (valores) => {
    const texto = valores.children.trim();
    const verificacoes: Verificacao[] = [
      texto
        ? { nivel: 'ok', titulo: 'Nome do controle', detalhe: `"${texto}", ligado por htmlFor; o clique no rótulo foca o campo.` }
        : { nivel: 'falha', titulo: 'Rótulo vazio', detalhe: 'O campo fica sem nome acessível.' },
    ];

    if (valores.required) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Obrigatório',
        detalhe: 'O asterisco fica fora do nome. O required do campo é seu, como na prévia.',
      });
    }

    return verificacoes;
  },
});

function RotuloAoLado() {
  const id = useId();

  return (
    <div className="demo-row" style={{ flexWrap: 'nowrap' }}>
      <Label htmlFor={id}>Buscar</Label>
      <InputText id={id} placeholder="Nome ou e-mail" size="sm" type="search" />
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt><code>htmlFor</code></dt>
      <dd>Liga o rótulo ao controle pelo id: o texto vira o nome acessível, e o clique no rótulo leva o foco ao controle.</dd>
      <dt><code>required</code></dt>
      <dd>
        Mostra o asterisco, fora do nome acessível. Não marca o controle: o <code>required</code> dele continua sendo de quem
        o escreve.
      </dd>
      <dt>Label ou Field</dt>
      <dd>
        Label nomeia <strong>um</strong> controle. Com ajuda, erro ou contador, use o Field, que cuida do conjunto e da
        amarração entre eles. Os campos do catálogo já trazem o próprio rótulo pelo <code>label</code>; o Label à parte
        serve quando o rótulo precisa de outro lugar, como ao lado do campo.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Rótulo ao lado do campo',
      descricao: 'Numa barra compacta, o rótulo fica na mesma linha; o campo vem sem o label próprio.',
      Previa: RotuloAoLado,
      codigo: '<Label htmlFor="busca">Buscar</Label>\n<InputText id="busca" type="search" size="sm" placeholder="Nome ou e-mail" />',
    },
    {
      titulo: 'Obrigatório',
      descricao: 'O asterisco não entra no nome: o leitor de tela ouve "Código do produto", e o required do campo diz o resto.',
      Previa: () => <RotuloDoCodigo required>Código do produto</RotuloDoCodigo>,
      codigo: codigoDoRotulo('Código do produto', true),
    },
  ],
  Modos,
  garantias: [
    {
      garantia: 'Associação ao controle',
      como: <>Elemento <code>&lt;label&gt;</code> nativo, ligado por <code>htmlFor</code>.</>,
      teste: 'Label.test.tsx',
    },
    { garantia: 'Asterisco fora do nome', como: <>O indicador de obrigatório leva <code>aria-hidden</code>.</>, teste: 'Label.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <label>; o className soma ao do sistema.',
  api: [
    { nome: 'htmlFor', tipo: 'string', descricao: 'O id do controle que o rótulo nomeia.' },
    { nome: 'required', tipo: 'boolean', padrao: 'false', descricao: 'Mostra o asterisco, fora do nome acessível.' },
    { nome: 'children', tipo: 'ReactNode', descricao: 'O texto do rótulo.' },
  ],
};
