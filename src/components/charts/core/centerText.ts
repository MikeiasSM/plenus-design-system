import { measureLabel, truncateToWidth, type LabelFont } from './measureText';

export interface CenterText {
  family: string;
  label: string;
  lineHeight: number;
  size: number;
  value: string;
}

/**
 * Degraus oficiais para o valor do centro, do maior para o menor. O valor e um
 * KPI, e `TOKENS-REFERENCE-TYPOGRAPHY.md` reserva a Poppins a esse papel; anel
 * pequeno desce na escala em vez de sair dela com um tamanho proprio.
 */
const DEGRAUS = [
  { display: true, lineHeight: 44, size: 36 },
  { display: true, lineHeight: 32, size: 24 },
  { display: false, lineHeight: 24, size: 16 },
];

/** Folga entre o texto e a borda interna do anel. */
const FOLGA = 8;

/**
 * Valor e rotulo do centro, no maior degrau da escala em que o texto ainda cabe
 * dentro do anel. O SVG nao quebra linha nem corta o que transborda, entao quem
 * precisa caber e o texto: ele desce de degrau e, no ultimo, e cortado.
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
  const disponivel = Math.max(innerDiameter - FOLGA * 2, 0);

  const degrau =
    DEGRAUS.find((candidato) =>
      measureLabel(value, {
        ...font,
        family: candidato.display ? font.headingFamily : font.family,
        size: candidato.size,
      }) <= disponivel,
    ) ?? DEGRAUS[DEGRAUS.length - 1];

  const family = degrau.display ? font.headingFamily : font.family;

  return {
    family,
    label: truncateToWidth(label, font, disponivel),
    lineHeight: degrau.lineHeight,
    size: degrau.size,
    value: truncateToWidth(value, { ...font, family, size: degrau.size }, disponivel),
  };
}
