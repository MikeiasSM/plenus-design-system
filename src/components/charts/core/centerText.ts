import { measureLabel, truncateToWidth, type LabelFont } from './measureText';
import { CHART_LABEL_OFFSET } from './spacing';

export interface CenterText {
  family: string;
  label: string;
  lineHeight: number;
  size: number;
  value: string;
}

/** Raio do vazio central em que o valor cabe inteiro no menor degrau da escala. */
export function centerTextRadius(value: string, font: LabelFont) {
  const menor = font.centerSteps[font.centerSteps.length - 1];
  const largura = measureLabel(value, {
    ...font,
    family: menor.display ? font.headingFamily : font.family,
    size: menor.size,
  });

  return largura / 2 + CHART_LABEL_OFFSET;
}

/**
 * Valor e rotulo do centro, no maior degrau da escala oficial em que o texto ainda cabe dentro do anel: o valor e um
 * KPI, e anel pequeno desce na escala em vez de sair dela. O SVG nao corta o que transborda; no ultimo degrau, corta-se.
 */
export function fitCenterText(
  value: string,
  label: string,
  font: LabelFont,
  innerDiameter: number,
): CenterText {
  // A largura util e a corda do circulo interno na altura do texto, e nao o
  // diametro: no centro do anel o texto tem o diametro inteiro, mas o rotulo,
  // logo abaixo, tem menos.
  const disponivel = Math.max(innerDiameter - CHART_LABEL_OFFSET * 2, 0);

  const degraus = font.centerSteps;
  const degrau =
    degraus.find((candidato) =>
      measureLabel(value, {
        ...font,
        family: candidato.display ? font.headingFamily : font.family,
        size: candidato.size,
      }) <= disponivel,
    ) ?? degraus[degraus.length - 1];

  const family = degrau.display ? font.headingFamily : font.family;

  return {
    family,
    label: truncateToWidth(label, font, disponivel),
    lineHeight: degrau.lineHeight,
    size: degrau.size,
    value: truncateToWidth(value, { ...font, family, size: degrau.size }, disponivel),
  };
}
