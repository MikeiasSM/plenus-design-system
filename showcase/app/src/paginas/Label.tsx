import { useId } from 'react';
import { Label } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const OPCOES = '<option value="">Escolha</option>\n<option value="kg">Quilograma</option>\n<option value="un">Unidade</option>';

function RotuloDaUnidade({ children, onClick, required }: { children: string; onClick?: () => void; required: boolean }) {
  const id = useId();

  return (
    <div className="stack">
      <Label htmlFor={id} onClick={onClick} required={required}>
        {children}
      </Label>
      <select defaultValue="" id={id} required={required}>
        <option value="">Escolha</option>
        <option value="kg">Quilograma</option>
        <option value="un">Unidade</option>
      </select>
    </div>
  );
}

function codigoDaUnidade(texto: string, required: boolean) {
  return [
    gerarJsx('Label', [['htmlFor', 'unidade'], ['required', required, false]], texto),
    gerarJsx('select', [['id', 'unidade'], ['required', required, false]], OPCOES),
  ].join('\n');
}

const playground = definirPlayground({
  inicial: { children: 'Unidade de medida', required: false },
  controles: [
    { tipo: 'texto', nome: 'children' },
    { tipo: 'booleano', nome: 'required' },
  ],
  renderizar: (valores, registrar) => (
    <RotuloDaUnidade onClick={() => registrar('onClick: o foco vai ao select')} required={valores.required}>
      {valores.children}
    </RotuloDaUnidade>
  ),
  codigo: (valores) => codigoDaUnidade(valores.children, valores.required),
  verificar: (valores) => {
    const texto = valores.children.trim();
    const verificacoes: Verificacao[] = [
      texto
        ? { nivel: 'ok', titulo: 'Nome do controle', detalhe: `"${texto}", ligado por htmlFor; o clique no rótulo foca o controle.` }
        : { nivel: 'falha', titulo: 'Rótulo vazio', detalhe: 'O controle fica sem nome acessível.' },
    ];

    if (valores.required) {
      verificacoes.push({
        nivel: 'ok',
        titulo: 'Obrigatório',
        detalhe: 'O asterisco fica fora do nome. O required do controle é seu, como na prévia.',
      });
    }

    return verificacoes;
  },
});

function SeletorDeArquivo() {
  const id = useId();

  return (
    <div className="stack">
      <Label htmlFor={id}>Planilha de importação</Label>
      <input accept=".csv,.xlsx" id={id} type="file" />
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
        amarração entre eles. Os campos do catálogo já trazem o próprio rótulo.
      </dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Controle nativo sem rótulo próprio',
      descricao: 'Um seletor de arquivo do navegador, nomeado pelo Label.',
      Previa: SeletorDeArquivo,
      codigo: '<Label htmlFor="planilha">Planilha de importação</Label>\n<input id="planilha" type="file" accept=".csv,.xlsx" />',
    },
    {
      titulo: 'Obrigatório',
      descricao: 'O asterisco não entra no nome: o leitor de tela ouve "Unidade de medida", e o required do select diz o resto.',
      Previa: () => <RotuloDaUnidade required>Unidade de medida</RotuloDaUnidade>,
      codigo: codigoDaUnidade('Unidade de medida', true),
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
