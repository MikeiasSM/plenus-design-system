import { useState } from 'react';
import { Button, Checkbox, InputText, Switch, Tabs, createPalette } from '@plenustech/design-system';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const PRONTAS = ['orange', 'blue', 'purple'];
const CORES_DO_PAINEL = ['#F26B35', '#4B4B4D', '#000000', '#49619C', '#67BD50', '#6E2A92', '#ED3237', '#FCB52F'];

const ABAS = [
  { key: 'resumo', label: 'Resumo', content: null },
  { key: 'contratos', label: 'Contratos', content: null },
  { key: 'faturas', label: 'Faturas', content: null },
];

function Tela() {
  const [aba, setAba] = useState('resumo');

  return (
    <div className="stack" style={{ width: '100%', maxWidth: 420 }}>
      <Tabs items={ABAS} label="Seções do cliente" onSelectedKeyChange={setAba} selectedKey={aba} />
      <div className="row">
        <Button>Emitir fatura</Button>
        <Button variant="secondary">Exportar</Button>
        <Button variant="soft">Filtrar</Button>
      </div>
      <InputText defaultValue="Cooperativa Vale Verde" label="Cliente" />
      <div className="row">
        <Checkbox defaultChecked label="Recorrente" />
        <Switch defaultChecked label="Notificar" />
      </div>
    </div>
  );
}

/** Escopo da paleta: o atributo de uma pronta, ou o que `createPalette` devolve. Recusa vira mensagem. */
function escopo(paleta: string, cor: string, textoBranco: boolean) {
  if (PRONTAS.includes(paleta)) {
    return { props: { 'data-palette': paleta } };
  }

  try {
    return { props: createPalette(cor, textoBranco ? { onSolid: '#FFFFFF' } : {}) };
  } catch (erro) {
    return { erro: (erro as Error).message };
  }
}

const playground = definirPlayground({
  inicial: { paleta: 'propria', cor: '#67BD50', textoBranco: false },
  controles: [
    { tipo: 'opcoes', nome: 'paleta', opcoes: [...PRONTAS, 'propria'] },
    { tipo: 'texto', nome: 'cor' },
    { tipo: 'booleano', nome: 'textoBranco' },
  ],
  renderizar: (valores) => {
    const resultado = escopo(valores.paleta, valores.cor, valores.textoBranco);

    return resultado.erro ? (
      <p className="note">{resultado.erro}</p>
    ) : (
      <div {...resultado.props}>
        <Tela />
      </div>
    );
  },
  codigo: (valores) =>
    PRONTAS.includes(valores.paleta)
      ? `<section data-palette="${valores.paleta}">\n  …\n</section>`
      : `<section {...createPalette('${valores.cor}'${valores.textoBranco ? ", { onSolid: '#FFFFFF' }" : ''})}>\n  …\n</section>`,
  verificar: (valores) => {
    if (PRONTAS.includes(valores.paleta)) {
      return [{ nivel: 'ok', titulo: 'Paleta pronta', detalhe: 'Contraste medido pelo check:contraste nos dois temas.' }];
    }

    const resultado = escopo(valores.paleta, valores.cor, valores.textoBranco);
    const verificacoes: Verificacao[] = [];

    if (resultado.erro) {
      verificacoes.push({ nivel: 'falha', titulo: 'Cor recusada', detalhe: resultado.erro });
      return verificacoes;
    }

    verificacoes.push({
      nivel: 'ok',
      titulo: 'Traço medido',
      detalhe: 'Links, abas, foco e bordas de seleção usam o tom da rampa que chega a 4,5:1 sobre a superfície.',
    });

    if (valores.textoBranco) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Texto imposto pelo produto',
        detalhe: 'onSolid vence a medida. Abaixo de 4,5:1, o console avisa em desenvolvimento.',
      });
    }

    return verificacoes;
  },
});

function CoresDoPainel() {
  return (
    <div className="stack" style={{ width: '100%' }}>
      {CORES_DO_PAINEL.map((cor) => (
        <div className="row" key={cor} {...createPalette(cor)}>
          <code style={{ minWidth: 72 }}>{cor}</code>
          <Button size="sm">Salvar</Button>
          <Checkbox defaultChecked label="Ativo" />
        </div>
      ))}
    </div>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Paleta numa subárvore',
      descricao: 'data-palette vale em qualquer elemento; o resto da página segue a paleta de fora.',
      Previa: () => (
        <div className="row">
          <Button>Laranja</Button>
          <div data-palette="blue">
            <Button>Azul</Button>
          </div>
          <div data-palette="purple">
            <Button>Roxo</Button>
          </div>
        </div>
      ),
      codigo: '<Button>Laranja</Button>\n<div data-palette="blue">\n  <Button>Azul</Button>\n</div>',
    },
    {
      titulo: 'As cores da personalização do Painel',
      descricao: 'Cada uma por createPalette: o texto sobre a cor é o branco ou o grafite, o que medir mais.',
      Previa: CoresDoPainel,
      codigo: "<div {...createPalette('#FCB52F')}>\n  <Button size=\"sm\">Salvar</Button>\n</div>",
      largo: true,
    },
  ],
  garantias: [
    {
      garantia: 'Contraste das paletas prontas',
      como: <>O <code>check:contraste</code> mede laranja, azul e roxo nos dois temas.</>,
      teste: 'scripts/check-contraste.mjs',
    },
    {
      garantia: 'Paleta própria medida',
      como: 'Rampa sempre do claro ao escuro, neutra sem croma, traço a 4,5:1 nos dois temas e recusa abaixo de 1,5:1.',
      teste: 'createPalette.test.ts',
    },
  ],
  notaDaApi: 'createPalette devolve o atributo data-palette e as variáveis --pl-palette-*, para espalhar num elemento.',
  api: [
    { nome: 'cor', tipo: 'string', descricao: 'Cor da marca em hexadecimal. É o preenchimento: fundo do botão primário, do interruptor e da seleção.' },
    {
      nome: 'onSolid',
      tipo: 'string',
      descricao: 'Texto sobre a cor, imposto pelo produto. Sem ele, o branco ou o grafite, o que medir mais.',
    },
  ],
};
