import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import chartStyles from './core/Chart.module.css';
import { referencePosition, validReferences, withReferenceColumns, type ChartReference } from './core';
import { ChartArea } from './ChartArea';
import { ChartBar } from './ChartBar';
import { ChartCombo } from './ChartCombo';
import { ChartLine } from './ChartLine';

type Props = Record<string, unknown>;

const semanas = ['S1', 'S2', 'S3'];
const atendimentos = [{ label: 'Atendimentos', values: [58, 72, 99] }];
const referencias: ChartReference[] = [
  { label: 'Meta', type: 'line', value: 80 },
  { from: 60, label: 'Faixa aceitável', to: 95, tone: 'success', type: 'band' },
];

const graficos: [string, (props: Props) => ReactElement][] = [
  ['ChartBar', (props) => <ChartBar categories={semanas} series={atendimentos} title="Atendimentos por semana" {...props} />],
  ['ChartLine', (props) => <ChartLine categories={semanas} series={atendimentos} title="Atendimentos por semana" {...props} />],
  ['ChartArea', (props) => <ChartArea categories={semanas} series={atendimentos} title="Atendimentos por semana" {...props} />],
  [
    'ChartCombo',
    (props) => (
      <ChartCombo
        categories={semanas}
        series={atendimentos.map((serie) => ({ ...serie, kind: 'bar' as const }))}
        title="Atendimentos por semana"
        {...props}
      />
    ),
  ],
];

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
});

const rotulosDoEixo = () => [...document.querySelectorAll('text')].map((no) => no.textContent ?? '');

describe.each(graficos)('%s: linhas e faixas de referência', (_, montar) => {
  it('sem references, nada muda: nem legenda, nem nome, nem marcas', () => {
    render(montar({}));

    expect(screen.getByRole('img', { name: 'Atendimentos por semana' })).toBeInTheDocument();
    expect(document.querySelector(`.${chartStyles.referenceLine}`)).toBeNull();
    expect(document.querySelector(`.${chartStyles.referenceBand}`)).toBeNull();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('desenha a linha tracejada com rótulo e valor, e a faixa atrás das marcas', () => {
    render(montar({ references: referencias }));

    const linha = document.querySelector(`.${chartStyles.referenceLine}`);
    const faixa = document.querySelector(`.${chartStyles.referenceBand}`);

    expect(linha).not.toBeNull();
    expect(faixa).not.toBeNull();
    expect(rotulosDoEixo()).toContain('Meta 80');
    // A faixa vem antes no documento, para ficar atras das marcas; a linha, depois, por cima delas.
    expect(faixa!.compareDocumentPosition(linha!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('o nome acessível cita as referências', () => {
    render(montar({ references: referencias }));

    expect(
      screen.getByRole('img', { name: 'Atendimentos por semana com Meta de 80 e Faixa aceitável de 60 a 95' }),
    ).toBeInTheDocument();
  });

  it('entra na legenda, sem botão de ligar e desligar', () => {
    render(montar({ references: referencias }));
    const legenda = screen.getByRole('list');

    expect(within(legenda).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Atendimentos',
      'Meta: 80',
      'Faixa aceitável: 60 a 95',
    ]);
    expect(within(legenda).queryByRole('button', { name: /Meta/ })).not.toBeInTheDocument();
  });

  it('a escala se estende para incluir a meta, mesmo sem dado lá', () => {
    render(montar({ references: [{ label: 'Meta', type: 'line', value: 150 }] }));

    const valores = rotulosDoEixo().map((rotulo) => Number(rotulo.replace(/\./g, ''))).filter(Number.isFinite);
    expect(Math.max(...valores)).toBeGreaterThanOrEqual(150);
  });

  it('a tabela ganha uma coluna por referência, com acima, dentro ou abaixo', () => {
    render(montar({ references: referencias }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver como tabela' }));
    const tabela = screen.getByRole('table');

    expect(within(tabela).getAllByRole('columnheader').map((cabecalho) => cabecalho.textContent)).toEqual([
      'Atendimentos',
      'Meta (80)',
      'Faixa aceitável (60 a 95)',
    ]);
    expect(within(tabela).getAllByRole('row').slice(1).map((linha) => linha.textContent)).toEqual([
      'S158abaixoabaixo',
      'S272abaixodentro',
      'S399acimaacima',
    ]);
  });
});

describe('referências: casos de borda', () => {
  it('descarta número inválido e acerta a faixa invertida', () => {
    expect(
      validReferences([
        { label: 'Quebrada', type: 'line', value: Number.NaN },
        { from: 90, label: 'Faixa', to: 10, type: 'band' },
      ]),
    ).toEqual([{ from: 10, label: 'Faixa', to: 90, type: 'band' }]);
  });

  it('a posição na linha distingue o igual, e a faixa inclui as bordas', () => {
    const linha: ChartReference = { label: 'Meta', type: 'line', value: 10 };
    const faixa: ChartReference = { from: 10, label: 'Faixa', to: 20, type: 'band' };

    expect([5, 10, 15].map((valor) => referencePosition(linha, valor))).toEqual(['abaixo', 'igual', 'acima']);
    expect([9, 10, 20, 21].map((valor) => referencePosition(faixa, valor))).toEqual(['abaixo', 'dentro', 'dentro', 'acima']);
  });

  it('com mais de uma série, cada posição leva o nome da série', () => {
    const tabela = withReferenceColumns(
      { columns: ['A', 'B'], rows: [{ cells: ['5', '15'], header: 'jan', key: 'jan' }] },
      [{ label: 'Meta', type: 'line', value: 10 }],
      [
        { label: 'A', values: [5] },
        { label: 'B', values: [15] },
      ],
      String,
    );

    expect(tabela.rows[0].cells).toEqual(['5', '15', 'A abaixo, B acima']);
  });

  it('empilhado, compara o total da pilha', () => {
    render(
      <ChartBar
        categories={['jan']}
        references={[{ label: 'Meta', type: 'line', value: 100 }]}
        series={[
          { label: 'Loja', values: [60] },
          { label: 'Site', values: [50] },
        ]}
        stacked
        title="Vendas"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver como tabela' }));

    expect(within(screen.getByRole('table')).getAllByRole('row')[1].textContent).toBe('jan6050acima');
  });

  it('na barra horizontal, a linha corre na vertical', () => {
    render(
      <ChartBar
        categories={['A', 'B']}
        orientation="horizontal"
        references={[{ label: 'Meta', type: 'line', value: 50 }]}
        series={[{ label: 'Vendas', values: [30, 70] }]}
        title="Vendas"
      />,
    );
    const linha = document.querySelector(`.${chartStyles.referenceLine}`)!;

    expect(linha.getAttribute('x1')).toBe(linha.getAttribute('x2'));
    expect(linha.getAttribute('y1')).not.toBe(linha.getAttribute('y2'));
  });

  it('o tom da faixa vem pela classe do status', () => {
    render(<ChartLine categories={semanas} references={referencias} series={atendimentos} title="Atendimentos" />);

    expect(document.querySelector(`.${chartStyles.referenceBand}`)).toHaveClass(chartStyles.referenceSuccess);
  });
});
