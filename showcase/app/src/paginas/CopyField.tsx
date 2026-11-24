import { CopyField } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const playground = definirPlayground({
  inicial: {
    label: 'Chave de acesso',
    value: 'chave_exemplo_123',
    hint: 'Use esta chave só no servidor.',
    masked: true,
  },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'texto', nome: 'value' },
    { tipo: 'texto', nome: 'hint' },
    { tipo: 'booleano', nome: 'masked' },
  ],
  renderizar: (valores, registrar) => (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <CopyField
        hint={valores.hint || undefined}
        label={valores.label}
        masked={valores.masked}
        onCopy={() => registrar('onCopy')}
        value={valores.value}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('CopyField', [
      ['label', valores.label],
      ['value', valores.value],
      ['hint', valores.hint || undefined],
      ['masked', valores.masked, false],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label
        ? { nivel: 'ok', titulo: 'Botão com nome próprio', detalhe: `O botão se chama "Copiar ${valores.label}".` }
        : { nivel: 'falha', titulo: 'Sem rótulo', detalhe: 'Sem label, o grupo e o botão ficam sem dizer o que copiam.' },
    ];

    if (valores.masked) {
      verificacoes.push({ nivel: 'ok', titulo: 'Valor fora do DOM', detalhe: 'Oculto, o valor não está na página; os pontos são sempre oito.' });
    }

    if (!valores.value) {
      verificacoes.push({ nivel: 'atencao', titulo: 'Valor vazio', detalhe: 'Copiar põe um texto vazio na área de transferência.' });
    }

    return verificacoes;
  },
});

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Link para compartilhar',
      descricao: 'O valor à vista, em fonte mono, quebrando em qualquer ponto.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <CopyField label="Link da loja" value="https://exemplo.com/loja" />
        </div>
      ),
      codigo: '<CopyField label="Link da loja" value="https://exemplo.com/loja" />',
    },
    {
      titulo: 'Credencial',
      descricao: 'Com masked, o valor fica oculto até "Mostrar", e "Copiar" copia o valor inteiro mesmo oculto.',
      Previa: () => (
        <div style={{ width: '100%', maxWidth: 480 }}>
          <CopyField hint="Use esta chave só no servidor." label="client_secret" masked value="chave_exemplo_123" />
        </div>
      ),
      codigo: '<CopyField\n  label="client_secret"\n  value={segredo}\n  hint="Use esta chave só no servidor."\n  masked\n/>',
    },
    {
      titulo: 'Vários campos',
      descricao: 'Cada botão leva o rótulo do seu campo no nome: "Copiar client_id", "Copiar client_secret".',
      Previa: () => (
        <div className="stack" style={{ width: '100%', maxWidth: 480 }}>
          <CopyField label="client_id" value="loja-exemplo" />
          <CopyField label="client_secret" masked value="chave_exemplo_123" />
        </div>
      ),
      codigo: '<CopyField label="client_id" value="loja-exemplo" />\n<CopyField label="client_secret" value={segredo} masked />',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%', maxWidth: 360 }}>
        <CopyField label="Chave de acesso" masked value="chave_exemplo_123" />
      </div>
    ),
    texto: 'CopyField para um valor curto que a pessoa leva para outro lugar: uma chave, um link, um registro de DNS.',
    codigo: '<CopyField label="Chave de acesso" value={chave} masked />',
  },
  evite: {
    Previa: () => (
      <div style={{ width: '100%', maxWidth: 360 }}>
        <CopyField label="Configuração" value={'{ "loja": "loja-exemplo", "ativo": true }'} />
      </div>
    ),
    texto: 'Trecho de código ou várias linhas: o CodeBlock tem realce, numeração e rolagem.',
    codigo: '<CopyField label="Configuração" value={json} />',
  },
  teclado: [
    { teclas: ['Tab'], acao: 'Passa por "Mostrar", quando há, e por "Copiar".' },
    { teclas: ['Enter', 'Espaço'], acao: 'No botão, copia o valor inteiro ou alterna entre mostrar e ocultar.' },
  ],
  garantias: [
    { garantia: 'Cópia anunciada', como: <>Copia e anuncia &quot;&lt;rótulo&gt; copiado&quot; por <code>role=&quot;status&quot;</code>, de novo a cada cópia.</>, teste: 'CopyField.test.tsx' },
    { garantia: 'Falha avisada', como: 'Com a cópia recusada ou sem a Clipboard API, avisa "Não foi possível copiar" e seleciona o valor à vista.', teste: 'CopyField.test.tsx' },
    { garantia: 'Botão com nome próprio', como: 'O nome do botão leva o rótulo do campo: "Copiar client_id".', teste: 'CopyField.test.tsx' },
    { garantia: 'Valor oculto fora do DOM', como: 'Oculto, o valor não vai à página, os pontos não dizem o tamanho e um valor novo nasce oculto já no primeiro quadro.', teste: 'CopyField.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div>, exceto children, e o ref, no elemento de fora.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Rótulo do campo, que também entra no nome do botão de copiar.' },
    { nome: 'value', tipo: 'string', descricao: 'Obrigatório. O valor copiado inteiro pelo botão.' },
    { nome: 'hint', tipo: 'string', descricao: 'Ajuda abaixo do campo, ligada ao grupo por aria-describedby.' },
    { nome: 'masked', tipo: 'boolean', padrao: 'false', descricao: 'Oculta o valor, com o botão "Mostrar".' },
    { nome: 'onCopy', tipo: '() => void', descricao: 'Chamado depois de copiar, só quando a cópia dá certo.' },
    { nome: 'copiedAnnouncement', tipo: 'string', descricao: 'O que a região de status anuncia depois de copiar. Padrão: "<rótulo> copiado".' },
    { nome: 'labels', tipo: 'Partial<CopyFieldLabels>', descricao: 'Troca "Copiar", "Copiado", "Mostrar", "Ocultar", "Valor oculto" e os avisos de falha.' },
  ],
};
