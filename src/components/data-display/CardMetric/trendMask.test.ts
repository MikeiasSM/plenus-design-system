import { parseTrendMask, resolveTrendLine, trendCells, isTextCell, unknownTrendParts, type CardMetricTrendPart } from './trendMask';

function texto(mascara: string, presentes: readonly CardMetricTrendPart[]) {
  return parseTrendMask(mascara).map((linha) =>
    resolveTrendLine(linha, (parte) => presentes.includes(parte))
      .map((segmento) => (segmento.kind === 'part' ? `<${segmento.part}>` : segmento.text))
      .join(''),
  );
}

describe('mascara do Trend', () => {
  it('le uma linha por linha do texto, com partes e o texto entre elas', () => {
    expect(texto('{change}{icon} {label}\n{value} · {description}', ['change', 'icon', 'label', 'value', 'description'])).toEqual([
      '<change><icon> <label>',
      '<value> · <description>',
    ]);
  });

  it('a parte ausente leva o separador junto, sem deixar o ponto orfao', () => {
    expect(texto('{value} · {description}', ['description'])).toEqual(['<description>']);
    expect(texto('{value} · {description}', ['value'])).toEqual(['<value>']);
  });

  it('o espaco fica quando ha parte presente dos dois lados, mesmo com uma ausente no meio', () => {
    expect(texto('{change}{icon} {label}', ['change', 'label'])).toEqual(['<change> <label>']);
  });

  it('o trecho opcional aparece inteiro ou nao aparece', () => {
    expect(texto('{label} [({description})]', ['label', 'description'])).toEqual(['<label> (<description>)']);
    expect(texto('{label} [({description})]', ['label'])).toEqual(['<label>']);
  });

  it('a linha sem nenhuma parte presente fica vazia', () => {
    expect(texto('{label}\n{value} · {description}', ['label'])).toEqual(['<label>', '']);
  });

  it('aponta as partes que a lib nao conhece, que ficam de fora do desenho', () => {
    const linhas = parseTrendMask('{change} {periodo}\n[{meta}]');

    expect(unknownTrendParts(linhas)).toEqual(['periodo', 'meta']);
    expect(texto('{change} {periodo}', ['change'])).toEqual(['<change>']);
  });

  it('na tabela, reparte a primeira linha em celulas nos espacos, e as partes coladas dividem a celula', () => {
    const [linha] = parseTrendMask('{label} {value} {icon}{change}');
    const celulas = trendCells(linha);

    expect(celulas).toHaveLength(3);
    expect(celulas.map(isTextCell)).toEqual([true, false, false]);
  });
});
