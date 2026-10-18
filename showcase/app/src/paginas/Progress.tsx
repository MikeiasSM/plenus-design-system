import { useEffect, useState } from 'react';
import { Button, Progress, Spinner, type ProgressSize } from '@plenustech/design-system';
import { gerarJsx } from '../estrutura/codigo';
import { definirPlayground, type Pagina, type Verificacao } from '../estrutura/tipos';

const TAMANHOS = ['sm', 'md'] as const;
const ALTURAS: Record<ProgressSize, number> = { sm: 4, md: 8 };

const playground = definirPlayground({
  inicial: { label: 'Envio do arquivo', value: 40, max: 100, indeterminado: false, showValue: true, size: 'md' },
  controles: [
    { tipo: 'texto', nome: 'label' },
    { tipo: 'numero', nome: 'value', min: 0, passo: 5 },
    { tipo: 'numero', nome: 'max', min: 1 },
    { tipo: 'booleano', nome: 'indeterminado' },
    { tipo: 'booleano', nome: 'showValue' },
    { tipo: 'opcoes', nome: 'size', opcoes: TAMANHOS },
  ],
  renderizar: (valores) => (
    <div style={{ width: '100%' }}>
      <Progress
        label={valores.label}
        max={valores.max}
        showValue={valores.showValue}
        size={valores.size as ProgressSize}
        value={valores.indeterminado ? undefined : valores.value}
      />
    </div>
  ),
  codigo: (valores) =>
    gerarJsx('Progress', [
      ['label', valores.label],
      ['value', valores.indeterminado ? undefined : valores.value],
      ['max', valores.max, 100],
      ['showValue', valores.showValue, false],
      ['size', valores.size, 'md'],
    ]),
  verificar: (valores) => {
    const verificacoes: Verificacao[] = [
      valores.label.trim()
        ? { nivel: 'ok', titulo: 'Nome acessível', detalhe: `"${valores.label.trim()}", vindo de label.` }
        : { nivel: 'falha', titulo: 'Sem nome acessível', detalhe: 'label é obrigatório: vai ao aria-label do progressbar.' },
    ];

    if (valores.indeterminado) {
      verificacoes.push({ nivel: 'ok', titulo: 'Indeterminado', detalhe: 'Sem value, o aria-valuenow fica de fora.' });

      if (valores.showValue) {
        verificacoes.push({ nivel: 'atencao', titulo: 'showValue sem efeito', detalhe: 'Sem value não há percentual a mostrar.' });
      }
    } else if (valores.value > valores.max || valores.value < 0) {
      verificacoes.push({
        nivel: 'atencao',
        titulo: 'Valor fora da faixa',
        detalhe: `O componente limita a ${Math.min(Math.max(valores.value, 0), valores.max)}. Mande o valor já dentro de 0 a max.`,
      });
    }

    return verificacoes;
  },
});

function Envio() {
  const [enviado, setEnviado] = useState<number | null>(null);

  useEffect(() => {
    if (enviado === null || enviado >= 100) {
      return;
    }

    const passo = setTimeout(() => setEnviado(enviado + 10), 200);
    return () => clearTimeout(passo);
  }, [enviado]);

  return (
    <div className="stack" style={{ width: '100%' }}>
      <Progress label="Envio do arquivo" showValue value={enviado ?? 0} />
      <div>
        <Button onClick={() => setEnviado(0)} size="sm" variant="secondary">Enviar arquivo</Button>
      </div>
    </div>
  );
}

function Variantes() {
  return (
    <div>
      {TAMANHOS.map((tamanho) => (
        <div className="subsection" key={tamanho}>
          <h3>
            <code>{tamanho}</code> · {ALTURAS[tamanho]}px
          </h3>
          <div className="demo-grid">
            <Progress label="Envio" size={tamanho} value={40} />
            <Progress label="Importação" showValue size={tamanho} value={82} />
            <Progress label="Processando" size={tamanho} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Modos() {
  return (
    <dl className="modes">
      <dt>Determinado</dt>
      <dd>
        Com <code>value</code>, anuncia <code>aria-valuenow</code>, <code>aria-valuemin</code> e <code>aria-valuemax</code>.
        O valor é limitado à faixa de 0 a <code>max</code>.
      </dd>
      <dt>Indeterminado</dt>
      <dd>Sem <code>value</code>, a barra anda sem fim e o valor atual fica fora da semântica.</dd>
      <dt><code>showValue</code></dt>
      <dd>Mostra o percentual arredondado ao lado da trilha; só no modo determinado.</dd>
    </dl>
  );
}

export const pagina: Pagina = {
  playground,
  exemplos: [
    {
      titulo: 'Envio de arquivo',
      descricao: 'Clique: a barra avança até 100%, com o percentual ao lado.',
      Previa: Envio,
      codigo: '<Progress label="Envio do arquivo" value={enviado} showValue />',
    },
    {
      titulo: 'Processamento sem previsão',
      descricao: 'Sem value, o modo indeterminado: há atividade, mas não se sabe quanto falta.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Progress label="Processando a importação" />
        </div>
      ),
      codigo: '<Progress label="Processando a importação" />',
    },
    {
      titulo: 'Contagem em outra escala',
      descricao: 'max troca a escala: 45 de 60 registros importados.',
      Previa: () => (
        <div style={{ width: '100%' }}>
          <Progress label="Registros importados" max={60} showValue size="sm" value={45} />
        </div>
      ),
      codigo: '<Progress\n  label="Registros importados"\n  value={45}\n  max={60}\n  showValue\n  size="sm"\n/>',
    },
  ],
  faca: {
    Previa: () => (
      <div style={{ width: '100%' }}>
        <Progress label="Envio do arquivo" showValue value={60} />
      </div>
    ),
    texto: 'Progress quando se sabe quanto falta, como no envio de um arquivo.',
  },
  evite: {
    Previa: () => <Spinner label="Enviando arquivo" />,
    texto: 'Spinner num envio de que se conhece o percentual: ele diz só que há atividade, não quanto falta.',
  },
  Variantes,
  Modos,
  garantias: [
    {
      garantia: 'Semântica de progresso',
      como: <><code>role=&quot;progressbar&quot;</code> com <code>aria-valuenow</code>, <code>aria-valuemin</code> e <code>aria-valuemax</code>.</>,
      teste: 'Progress.test.tsx',
    },
    { garantia: 'Nome acessível', como: <><code>label</code> obrigatório, levado ao <code>aria-label</code>.</>, teste: 'Progress.test.tsx' },
    { garantia: 'Indeterminado', como: <>Sem <code>value</code>, o <code>aria-valuenow</code> é omitido.</>, teste: 'Progress.test.tsx' },
  ],
  notaDaApi: 'Além destas, as propriedades nativas de <div> e o ref, levados ao próprio progressbar.',
  api: [
    { nome: 'label', tipo: 'string', descricao: 'Obrigatório. Nome acessível da barra.' },
    { nome: 'value', tipo: 'number', descricao: 'Valor atual. Sem ele, o modo indeterminado.' },
    { nome: 'max', tipo: 'number', padrao: '100', descricao: 'Fim da escala.' },
    { nome: 'showValue', tipo: 'boolean', padrao: 'false', descricao: 'Percentual ao lado da trilha.' },
    { nome: 'size', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'Espessura da trilha: 4 ou 8px.' },
  ],
};
