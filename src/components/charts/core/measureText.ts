export interface LabelFont {
  family: string;
  /** Familia de display, usada onde o valor e um KPI. */
  headingFamily: string;
  lineHeight: number;
  size: number;
}

const PADRAO: LabelFont = {
  family: 'sans-serif',
  headingFamily: 'sans-serif',
  lineHeight: 16,
  size: 12,
};

/** Proporcao entre a largura media de um caractere e o corpo da fonte. */
const LARGURA_POR_CARACTERE = 0.58;

/**
 * Fonte dos rotulos, lida dos tokens no proprio elemento do grafico. Ler do
 * elemento evita repetir em JavaScript um valor que ja pertence ao CSS.
 */
export function labelFontOf(node: Element | null): LabelFont {
  if (!node || typeof getComputedStyle !== 'function') {
    return PADRAO;
  }

  const estilo = getComputedStyle(node);
  const family = estilo.getPropertyValue('--pl-font-body').trim() || estilo.fontFamily || PADRAO.family;
  const headingFamily = estilo.getPropertyValue('--pl-font-heading').trim() || family;
  const size = Number.parseFloat(estilo.getPropertyValue('--pl-type-caption-size')) || PADRAO.size;
  const lineHeight = Number.parseFloat(estilo.getPropertyValue('--pl-type-caption-line-height'));

  return { family, headingFamily, lineHeight: lineHeight || size * 1.34, size };
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
 * pagina; onde ele nao existe, a estimativa por caractere mantem o calculo
 * deterministico, em vez de devolver zero e amontoar os rotulos.
 */
export function measureLabel(text: string, font: LabelFont) {
  const estimativa = text.length * font.size * LARGURA_POR_CARACTERE;
  const medida = contextoDeMedida();

  if (!medida) {
    return estimativa;
  }

  medida.font = `${font.size}px ${font.family}`;

  return medida.measureText(text).width || estimativa;
}

export function widestLabel(labels: readonly string[], font: LabelFont) {
  return labels.reduce((maior, rotulo) => Math.max(maior, measureLabel(rotulo, font)), 0);
}

/**
 * Texto cortado para caber na largura, com reticencia. Onde o desenho e o
 * proprio espaco — o centro de um anel, o retangulo de um mapa de area — nao ha
 * caixa que corte por conta propria.
 */
export function truncateToWidth(text: string, font: LabelFont, maxWidth: number) {
  if (maxWidth <= 0) {
    return '';
  }

  if (measureLabel(text, font) <= maxWidth) {
    return text;
  }

  let corte = text.length;

  while (corte > 0 && measureLabel(`${text.slice(0, corte)}…`, font) > maxWidth) {
    corte -= 1;
  }

  return corte > 0 ? `${text.slice(0, corte)}…` : '';
}

/**
 * Texto quebrado nas linhas que cabem na largura. Onde o rotulo divide espaco
 * com o desenho, espremer tudo numa linha so e o que o faz invadir o que esta
 * ao lado. A ultima linha e cortada quando o limite de linhas se esgota.
 */
export function wrapToWidth(text: string, font: LabelFont, maxWidth: number, maxLines = 2) {
  if (maxWidth <= 0 || maxLines <= 0) {
    return [];
  }

  const linhas: string[] = [];

  text.split(/\s+/).filter(Boolean).forEach((palavra) => {
    const atual = linhas.at(-1);
    const juntas = atual ? `${atual} ${palavra}` : palavra;

    if (atual !== undefined && measureLabel(juntas, font) <= maxWidth) {
      linhas[linhas.length - 1] = juntas;
      return;
    }

    linhas.push(palavra);
  });

  if (linhas.length <= maxLines) {
    return linhas.map((linha) => truncateToWidth(linha, font, maxWidth));
  }

  const cabem = linhas.slice(0, maxLines);
  cabem[maxLines - 1] = truncateToWidth(
    [cabem[maxLines - 1], ...linhas.slice(maxLines)].join(' '),
    font,
    maxWidth,
  );

  return cabem;
}
