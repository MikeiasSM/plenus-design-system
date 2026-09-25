import { groupSmallSlices } from './slices';
import { sliceAngles, VOLTA } from './arcs';
import { truncateToWidth, labelFontOf } from './measureText';

const fonte = labelFontOf(null);

describe('agrupamento de fatias pequenas', () => {
  const custos = [
    { label: 'CMV', value: 940 },
    { label: 'Frete', value: 20 },
    { label: 'Devoluções', value: 20 },
    { label: 'Comissões', value: 20 },
  ];

  it('reune as fatias abaixo do limiar numa so', () => {
    const reunidas = groupSmallSlices(custos, { label: 'Outros', threshold: 0.05 });

    expect(reunidas.map((fatia) => fatia.label)).toEqual(['CMV', 'Outros']);
    expect(reunidas[1].value).toBe(60);
  });

  it('mantem a fatia reunida no lugar da primeira pequena, preservando a ordem', () => {
    const reunidas = groupSmallSlices(
      [{ label: 'Frete', value: 20 }, { label: 'CMV', value: 940 }, { label: 'Devoluções', value: 20 }],
      { label: 'Outros', threshold: 0.05 },
    );

    expect(reunidas.map((fatia) => fatia.label)).toEqual(['Outros', 'CMV']);
  });

  it('nao agrupa uma fatia sozinha, que nada ganharia em virar Outros', () => {
    const reunidas = groupSmallSlices([{ label: 'CMV', value: 980 }, { label: 'Frete', value: 20 }], {
      label: 'Outros',
      threshold: 0.05,
    });

    expect(reunidas.map((fatia) => fatia.label)).toEqual(['CMV', 'Frete']);
  });

  it('dispensa o agrupamento sem limiar ou sem total', () => {
    expect(groupSmallSlices(custos, { label: 'Outros', threshold: 0 })).toEqual(custos);
    expect(groupSmallSlices([{ label: 'Vazio', value: 0 }], { label: 'Outros', threshold: 0.1 })).toHaveLength(1);
  });

  it('reune com intencao neutra, para Outros nao disputar a paleta das demais', () => {
    const reunidas = groupSmallSlices(custos, { label: 'Outros', threshold: 0.05 });

    expect(reunidas[1].intent).toBe('neutral');
  });
});

describe('angulos das fatias', () => {
  it('reparte a volta na proporcao dos valores', () => {
    const [primeira, segunda] = sliceAngles([75, 25]);

    expect(primeira.endAngle - primeira.startAngle).toBeCloseTo(VOLTA * 0.75, 5);
    expect(segunda.endAngle - segunda.startAngle).toBeCloseTo(VOLTA * 0.25, 5);
  });

  it('mantem a ordem recebida, que e a que a legenda repete', () => {
    const [primeira] = sliceAngles([10, 90]);

    expect(primeira.endAngle - primeira.startAngle).toBeCloseTo(VOLTA * 0.1, 5);
  });

  it('fecha a fatia desligada em angulo zero, em vez de tira-la da volta', () => {
    const [, desligada] = sliceAngles([100, 0]);

    expect(desligada.endAngle - desligada.startAngle).toBe(0);
  });
});

describe('corte de texto pela largura', () => {
  it('devolve o texto inteiro quando ele cabe', () => {
    expect(truncateToWidth('Total', fonte, 400)).toBe('Total');
  });

  it('corta com reticencia quando nao cabe', () => {
    const cortado = truncateToWidth('Custos das mercadorias vendidas', fonte, 60);

    expect(cortado.endsWith('…')).toBe(true);
    expect(cortado.length).toBeLessThan('Custos das mercadorias vendidas'.length);
  });

  it('devolve vazio quando nao ha largura alguma', () => {
    expect(truncateToWidth('Total', fonte, 0)).toBe('');
  });
});
