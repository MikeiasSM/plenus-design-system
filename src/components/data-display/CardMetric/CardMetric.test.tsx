import { fireEvent, render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { CardMetric, type CardMetricProps } from './CardMetric';

const moeda = (valor: number) => new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(valor);

function montar(props: Partial<CardMetricProps> = {}) {
  return render(
    <CardMetric {...props}>
      <Card.Header
        badge={<button type="button">Explicar com IA</button>}
        title="Faturamento"
        trailing={<CardMetric.Trend comparisons={[{ change: 0.124, label: 'vs. mês anterior' }]} />}
      />
      <CardMetric.Body>
        <CardMetric.Value formatTooltipValue={moeda} formatValue={() => 'R$ 1,5 M'} value={1523400.5} />
        <CardMetric.Bar
          segments={[
            { label: 'A vencer', value: 820 },
            { label: 'Vencido', value: 180 },
          ]}
          title="Situação dos títulos"
        />
      </CardMetric.Body>
    </CardMetric>,
  );
}

describe('CardMetric', () => {
  it('nomeia a ativacao pelo titulo e a dispara so pelo botao de cobertura', () => {
    const onActivate = vi.fn();
    montar({ onActivate });

    fireEvent.click(screen.getByRole('button', { name: 'Explicar com IA' }));
    expect(onActivate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir detalhes de Faturamento' }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('sem onActivate, nao ha botao de cobertura', () => {
    montar();

    expect(screen.queryByRole('button', { name: /Abrir detalhes/ })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Faturamento' })).toBeInTheDocument();
  });

  it('carregando, mantem o titulo, sinaliza ocupado e esconde a tendencia', () => {
    montar({ loading: true });

    expect(screen.getByRole('region', { name: 'Faturamento' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('button', { name: /Tendência/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Situação dos títulos/ })).not.toBeInTheDocument();
  });

  it('atualizando, mantem os dados e avisa o leitor de tela', () => {
    montar({ updating: true });

    expect(screen.getByRole('region', { name: 'Faturamento' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Atualizando')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /R\$ 1,5 M/ })).toBeInTheDocument();
  });

  it('em erro, a mensagem ocupa o lugar do valor e as demais partes saem', () => {
    montar({ error: 'Não foi possível carregar.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar.');
    expect(screen.queryByRole('button', { name: /Tendência/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Situação dos títulos/ })).not.toBeInTheDocument();
  });

  it('le a tendencia como frase e abre o balao no foco', () => {
    montar();

    const tendencia = screen.getByRole('button', { name: 'Tendência: Alta de 12,4%, vs. mês anterior' });
    fireEvent.focus(tendencia);

    expect(screen.getByText('Comparações')).toBeInTheDocument();
  });

  it('o valor compacto diz o valor exato no nome e no balao', () => {
    montar();

    const valor = screen.getByRole('button', { name: /^R\$ 1,5 M, valor exato R\$\s1\.523\.400,50$/ });
    fireEvent.focus(valor);

    expect(screen.getByText('Valor exato')).toBeInTheDocument();
  });

  it('valor ausente e lido como sem valor', () => {
    render(
      <CardMetric>
        <Card.Header title="Prazo médio" />
        <CardMetric.Body>
          <CardMetric.Value value={null} />
        </CardMetric.Body>
      </CardMetric>,
    );

    expect(screen.getByText('Sem valor')).toBeInTheDocument();
  });

  it('o grafico so com balao ainda abre o cartao no clique', () => {
    const onActivate = vi.fn();
    const { container } = render(
      <CardMetric onActivate={onActivate}>
        <Card.Header title="Ticket médio" />
        <CardMetric.Body>
          <CardMetric.Chart categories={['01/10', '02/10']} showTooltip title="Ticket diário" values={[172, 168]} />
        </CardMetric.Body>
      </CardMetric>,
    );

    fireEvent.click(container.querySelector('[class*="chart"]') as Element);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('as partes so existem dentro da moldura', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<CardMetric.Value value={1} />)).toThrow('CardMetric.Value deve ser usado dentro de CardMetric.');
  });
});
