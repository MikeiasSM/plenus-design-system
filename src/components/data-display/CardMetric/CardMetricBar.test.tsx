import { fireEvent, render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { CardMetric } from './CardMetric';
import type { CardMetricBarProps } from './CardMetricBar';

const TITULOS = [
  { label: 'A vencer', value: 820 },
  { label: 'Vencido até 30 dias', value: 190 },
  { label: 'Vencido há mais de 90 dias', value: 10 },
  { label: 'Protestado', value: 8 },
  { label: 'Créditos a compensar', value: -30 },
];

function montar(props: Partial<CardMetricBarProps> = {}) {
  render(
    <CardMetric>
      <Card.Header title="Contas a receber" />
      <CardMetric.Body>
        <CardMetric.Bar segments={TITULOS} title="Situação dos títulos" {...props} />
      </CardMetric.Body>
    </CardMetric>,
  );

  return screen.getByRole('img', { name: /Situação dos títulos/ });
}

function linhasDoBalao() {
  return [...document.querySelectorAll('[aria-hidden="true"] span')].map((celula) => celula.textContent);
}

describe('CardMetric.Bar', () => {
  it('le cada segmento e o total com sinal no nome da imagem', () => {
    const barra = montar({ showPercent: false });

    expect(barra).toHaveAccessibleName(
      'Situação dos títulos: A vencer, 820; Vencido até 30 dias, 190; Vencido há mais de 90 dias, 10; Protestado, 8; Créditos a compensar, -30. Total 998',
    );
  });

  it('e uma parada de Tab que abre o balao no foco', () => {
    const barra = montar();

    expect(barra).toHaveAttribute('tabindex', '0');
    fireEvent.focus(barra);
    expect(document.querySelector('[aria-hidden="true"] p')).toHaveTextContent('Situação dos títulos');
  });

  it('reune no balao os positivos pequenos e deixa o negativo de fora', () => {
    fireEvent.focus(montar({ smallSegmentThreshold: 0.02 }));

    const linhas = linhasDoBalao();
    expect(linhas).toContain('Outros (2)');
    expect(linhas).not.toContain('Protestado');
    expect(linhas).toContain('Créditos a compensar');
  });

  it('sem limiar, lista todos os segmentos', () => {
    fireEvent.focus(montar({ smallSegmentThreshold: 0 }));

    expect(linhasDoBalao()).toContain('Protestado');
  });

  it('sem dados, mostra a mensagem e uma imagem sem dados', () => {
    montar({ segments: [] });

    expect(screen.getByRole('img', { name: 'Situação dos títulos: sem dados' })).toBeInTheDocument();
    expect(screen.getByText('Sem dados')).toBeInTheDocument();
  });
});
