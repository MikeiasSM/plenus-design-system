import { fireEvent, render, screen } from '@testing-library/react';
import { ChartsProvider } from '../../charts/ChartsProvider';
import { Card } from '../Card';
import { CardMetric, type CardMetricProps } from './CardMetric';

const moeda = (valor: number) => new Intl.NumberFormat('pt-BR', { currency: 'BRL', style: 'currency' }).format(valor);

function montar(props: Partial<CardMetricProps> = {}) {
  return render(
    <CardMetric {...props}>
      <Card.Header
        badge={<button type="button">Ajuda</button>}
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

    fireEvent.click(screen.getByRole('button', { name: 'Ajuda' }));
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
    expect(screen.getByRole('status')).toHaveTextContent('Atualizando');
    expect(screen.getByRole('button', { name: /R\$ 1,5 M/ })).toBeInTheDocument();
  });

  it('em erro, a mensagem ocupa o lugar do valor e as demais partes saem', () => {
    montar({ error: 'Não foi possível carregar.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar.');
    expect(screen.queryByRole('button', { name: /Tendência/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Situação dos títulos/ })).not.toBeInTheDocument();
  });

  it('em erro, a mensagem aparece mesmo sem o valor', () => {
    render(
      <CardMetric error="Falhou">
        <Card.Header title="Vendas" />
        <CardMetric.Body>
          <CardMetric.Bar segments={[{ label: 'A', value: 1 }]} title="Composição" />
        </CardMetric.Body>
      </CardMetric>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
  });

  it('diz a diferenca e o sentido, e nao inventa variacao que nao veio', () => {
    render(
      <CardMetric>
        <Card.Header
          title="Prazo"
          trailing={
            <CardMetric.Trend
              comparisons={[
                { change: 0.052, label: 'vs. meta', polarity: 'lowerIsBetter', value: 2 },
                { label: 'vs. ano anterior', value: 500 },
              ]}
            />
          }
        />
      </CardMetric>,
    );

    expect(
      screen.getByRole('button', {
        name: 'Tendência: Alta de 5,2% (+2), desfavorável, vs. meta; Sem variação calculada (+500), vs. ano anterior',
      }),
    ).toBeInTheDocument();
  });

  it('le a tendencia como frase e abre o balao no foco', () => {
    montar();

    const tendencia = screen.getByRole('button', { name: 'Tendência: Alta de 12,4%, favorável, vs. mês anterior' });
    fireEvent.focus(tendencia);

    expect(screen.getByText('Comparações')).toBeInTheDocument();
  });

  describe('Trend com mascara', () => {
    const moedaCompacta = (valor: number) => `R$ ${Math.round(valor / 1000)} k`;
    const comparacoes = [
      { change: 0.124, label: 'vs. mês anterior', value: 168000, formatValue: moedaCompacta },
      { change: -0.05, description: 'Revisada em março.', label: 'vs. meta' },
      { change: 0.018, label: 'vs. média', polarity: 'neutral' as const },
    ];

    function abrir(props: Partial<Parameters<typeof CardMetric.Trend>[0]> = {}) {
      render(
        <CardMetric>
          <CardMetric.Trend comparisons={comparacoes} {...props} />
        </CardMetric>,
      );
      fireEvent.focus(screen.getByRole('button'));

      return document.querySelector('[aria-hidden="true"][style*="left"]') as HTMLElement;
    }

    it('sem mascara, mostra a variacao, o icone e o rotulo, e embaixo a diferenca e a explicacao', () => {
      const balao = abrir();

      expect(balao).toHaveTextContent('+12,4% vs. mês anterior');
      expect(balao).toHaveTextContent('+R$ 168 k');
      expect(balao).toHaveTextContent('-5,0% vs. meta');
      expect(balao).toHaveTextContent('Revisada em março.');
      // Sem diferença, o separador sai junto: a linha da meta e so a explicacao.
      expect(balao.textContent).not.toMatch(/·\s*Revisada/);
    });

    it('pinta no tom so as partes pedidas, e a neutra fica sem tom', () => {
      const balao = abrir({ tonedParts: ['change'] });
      const classeDe = (texto: string) => [...balao.querySelectorAll('span')].find((no) => no.textContent === texto)?.className ?? '';

      expect(classeDe('+12,4%')).toMatch(/success/);
      expect(classeDe('-5,0%')).toMatch(/danger/);
      expect(classeDe('+1,8%')).not.toMatch(/success|danger/);
      expect(classeDe('vs. mês anterior')).not.toMatch(/success/);
    });

    it('segue a mascara do produto, na ordem dela', () => {
      const balao = abrir({ mask: '{label}: {change}' });

      expect(balao).toHaveTextContent('vs. mês anterior: +12,4%');
      expect(balao).not.toHaveTextContent('R$ 168 k');
    });

    it('em tabela, alinha a primeira linha em colunas e leva a explicacao para baixo', () => {
      const balao = abrir({ layout: 'table' });
      const grade = balao.querySelector('[class*="table"]') as HTMLElement;

      expect(grade.style.gridTemplateColumns).toBe('minmax(0, 1fr) auto auto');
      expect(balao).toHaveTextContent('Revisada em março.');
    });

    it('o selo segue a propria mascara, e o nome acessivel continua sendo a frase inteira', () => {
      render(
        <CardMetric>
          <CardMetric.Trend badgeMask="{value}" comparisons={comparacoes} />
        </CardMetric>,
      );
      const botao = screen.getByRole('button');

      expect(botao).toHaveTextContent('+R$ 168 k');
      expect(botao).toHaveAccessibleName(
        'Tendência: Alta de 12,4% (+R$ 168 k), favorável, vs. mês anterior; Queda de 5,0%, desfavorável, vs. meta. Revisada em março.; Alta de 1,8%, vs. média',
      );
    });

    it('avisa em desenvolvimento a parte que nao existe', () => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      abrir({ mask: '{change} {periodo}' });

      expect(aviso).toHaveBeenCalledWith(expect.stringContaining('{periodo}'));
      aviso.mockRestore();
    });
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

  it('varios indicadores no mesmo cartao mostram cada valor com seu rotulo', () => {
    render(
      <CardMetric>
        <Card.Header title="Como o negócio está" />
        <CardMetric.Body>
          <CardMetric.Value label="Vendas do mês" value={412380} />
        </CardMetric.Body>
        <CardMetric.Body>
          <CardMetric.Value label="Ticket médio" value={187} />
        </CardMetric.Body>
      </CardMetric>,
    );

    expect(screen.getByText('Vendas do mês')).toBeInTheDocument();
    expect(screen.getByText('Ticket médio')).toBeInTheDocument();
    expect(screen.getByText(/412\.380/)).toBeInTheDocument();
    expect(screen.getByText(/187/)).toBeInTheDocument();
  });

  it('o grafico não traz o botão "Ver como tabela", que tomaria o espaço medido do desenho', () => {
    const altura = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(48);
    const largura = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(226);

    render(
      <CardMetric>
        <CardMetric.Body>
          <CardMetric.Chart categories={['01/10', '02/10']} title="Ticket diário" values={[172, 168]} />
        </CardMetric.Body>
      </CardMetric>,
    );

    expect(screen.getByRole('img', { name: /Ticket diário/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver como tabela' })).not.toBeInTheDocument();
    altura.mockRestore();
    largura.mockRestore();
  });

  it('o grafico segue sem o botão "Ver como tabela" mesmo com o ChartsProvider ligado', () => {
    const altura = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(48);
    const largura = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(226);

    render(
      <ChartsProvider showTableToggle>
        <CardMetric>
          <CardMetric.Body>
            <CardMetric.Chart categories={['01/10', '02/10']} title="Ticket diário" values={[172, 168]} />
          </CardMetric.Body>
        </CardMetric>
      </ChartsProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Ver como tabela' })).not.toBeInTheDocument();
    altura.mockRestore();
    largura.mockRestore();
  });

  it('as partes so existem dentro da moldura', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<CardMetric.Value value={1} />)).toThrow('CardMetric.Value deve ser usado dentro de CardMetric.');
  });
});
