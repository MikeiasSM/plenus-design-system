/** Um degrau da escala tipográfica para o valor do centro de um anel. */
export interface CenterStep {
  display: boolean;
  lineHeight: number;
  size: number;
}

export interface LabelFont {
  /** Degraus do valor do centro, do maior ao menor: display, headline e title. */
  centerSteps: readonly CenterStep[];
  family: string;
  /** Família de display, usada onde o valor e um KPI. */
  headingFamily: string;
  /** Peso de `type.label`, o do título de eixo. */
  labelWeight: number;
  lineHeight: number;
  size: number;
}

/** Os papeis de cada degrau do centro e o valor deles na referência tipográfica, para quando não ha CSS. */
const DEGRAUS_DO_CENTRO = [
  { display: true, papel: 'display-large', size: 36, lineHeight: 44 },
  { display: true, papel: 'headline-medium', size: 24, lineHeight: 32 },
  { display: false, papel: 'title', size: 16, lineHeight: 24 },
];

const PADRAO: LabelFont = {
  centerSteps: DEGRAUS_DO_CENTRO.map(({ display, lineHeight, size }) => ({ display, lineHeight, size })),
  family: 'sans-serif',
  headingFamily: 'sans-serif',
  labelWeight: 600,
  lineHeight: 16,
  size: 12,
};

/** Proporção entre a largura media de um caractere e o corpo da fonte. */
const LARGURA_POR_CARACTERE = 0.58;

const PIXELS = /^-?\d*\.?\d+px$/;

/**
 * Medida de um token de tipografia em pixels. O valor em `px` e lido direto; `rem`, `calc()` ou `clamp()` são
 * resolvidos pelo navegador numa sonda dentro do elemento, onde valem a fonte e a janela de quem usa o token.
 */
function pixelsOf(node: Element, value: string, property: 'font-size' | 'line-height') {
  if (value === '' || PIXELS.test(value)) {
    return Number.parseFloat(value);
  }

  const sonda = document.createElement('span');
  sonda.style.setProperty('position', 'absolute');
  sonda.style.setProperty('visibility', 'hidden');
  sonda.style.setProperty(property, value);
  node.appendChild(sonda);
  const pixels = Number.parseFloat(getComputedStyle(sonda).getPropertyValue(property));
  sonda.remove();

  return pixels;
}

/**
 * Fonte dos rótulos, lida dos tokens no próprio elemento do gráfico. Ler do
 * elemento evita repetir em JavaScript um valor que já pertence ao CSS.
 */
export function labelFontOf(node: Element | null): LabelFont {
  if (!node || typeof getComputedStyle !== 'function') {
    return PADRAO;
  }

  const estilo = getComputedStyle(node);
  const family = estilo.getPropertyValue('--pl-font-body').trim() || estilo.fontFamily || PADRAO.family;
  const headingFamily = estilo.getPropertyValue('--pl-font-heading').trim() || family;
  const token = (nome: string) => estilo.getPropertyValue(`--pl-type-${nome}`).trim();
  const medida = (nome: string, property: 'font-size' | 'line-height') => pixelsOf(node, token(nome), property);
  const size = medida('caption-size', 'font-size') || PADRAO.size;
  const lineHeight = medida('caption-line-height', 'line-height');
  const centerSteps = DEGRAUS_DO_CENTRO.map((degrau) => ({
    display: degrau.display,
    lineHeight: medida(`${degrau.papel}-line-height`, 'line-height') || degrau.lineHeight,
    size: medida(`${degrau.papel}-size`, 'font-size') || degrau.size,
  }));

  const labelWeight = Number.parseFloat(token('label-weight')) || PADRAO.labelWeight;

  return { centerSteps, family, headingFamily, labelWeight, lineHeight: lineHeight || size * 1.34, size };
}

let contexto: CanvasRenderingContext2D | null | undefined;

function contextoDeMedida() {
  if (contexto === undefined) {
    try {
      contexto = document.createElement('canvas').getContext('2d');
    } catch {
      contexto = null;
    }
  }

  return contexto;
}

/**
 * Largura do texto na fonte informada. O canvas mede sem inserir nada na
 * página; onde ele não existe, a estimativa por caractere mantem o calculo
 * deterministico, em vez de devolver zero e amontoar os rótulos.
 */
export function measureLabel(text: string, font: LabelFont, weight = 400) {
  const estimativa = text.length * font.size * LARGURA_POR_CARACTERE;
  const medida = contextoDeMedida();

  if (!medida) {
    return estimativa;
  }

  medida.font = `${weight} ${font.size}px ${font.family}`;

  return medida.measureText(text).width || estimativa;
}

export function widestLabel(labels: readonly string[], font: LabelFont) {
  return labels.reduce((maior, rotulo) => Math.max(maior, measureLabel(rotulo, font)), 0);
}

/**
 * Texto cortado para caber na largura, com reticência. Onde o desenho e o
 * próprio espaço — o centro de um anel, o retangulo de um mapa de área — não ha
 * caixa que corte por conta própria.
 */
export function truncateToWidth(text: string, font: LabelFont, maxWidth: number, weight?: number) {
  if (maxWidth <= 0) {
    return '';
  }

  if (measureLabel(text, font, weight) <= maxWidth) {
    return text;
  }

  let corte = text.length;

  while (corte > 0 && measureLabel(`${text.slice(0, corte)}…`, font, weight) > maxWidth) {
    corte -= 1;
  }

  return corte > 0 ? `${text.slice(0, corte)}…` : '';
}

