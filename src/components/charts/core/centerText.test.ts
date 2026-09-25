import { fitCenterText } from './centerText';
import { labelFontOf } from './measureText';

const fonte = labelFontOf(null);

describe('texto do centro do anel', () => {
  it('usa o maior degrau da escala quando o texto cabe', () => {
    expect(fitCenterText('264K', 'Total', fonte, 300).size).toBe(36);
  });

  it('desce de degrau quando o anel encolhe, em vez de transbordar', () => {
    const largo = fitCenterText('264K', 'Total', fonte, 300).size;
    const estreito = fitCenterText('264K', 'Total', fonte, 90).size;

    expect(estreito).toBeLessThan(largo);
  });

  it('desce de degrau quando o valor cresce, e nao so quando o anel encolhe', () => {
    const curto = fitCenterText('9', 'Total', fonte, 120).size;
    const longo = fitCenterText('1.284.930,55', 'Total', fonte, 120).size;

    expect(longo).toBeLessThan(curto);
  });

  it('corta no ultimo degrau, porque o SVG nao quebra linha nem esconde o que transborda', () => {
    const apertado = fitCenterText('1.284.930.551,77', 'Total', fonte, 60);

    expect(apertado.size).toBe(16);
    expect(apertado.value.endsWith('…')).toBe(true);
  });

  it('corta tambem o rotulo, que costuma ser o texto mais longo dos dois', () => {
    const { label } = fitCenterText('264K', 'Cmv - Custos das mercadorias vendidas', fonte, 90);

    expect(label.endsWith('…')).toBe(true);
  });

  it('usa a familia de display nos degraus grandes e a de corpo no menor', () => {
    const grande = fitCenterText('9', 'Total', fonte, 300);
    const pequeno = fitCenterText('1.284.930.551,77', 'Total', fonte, 60);

    expect(grande.family).toBe(fonte.headingFamily);
    expect(pequeno.family).toBe(fonte.family);
  });
});
