export interface LabelFont {
  family: string;
  lineHeight: number;
  size: number;
}

const PADRAO: LabelFont = { family: 'sans-serif', lineHeight: 16, size: 12 };

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
  const size = Number.parseFloat(estilo.getPropertyValue('--pl-type-caption-size')) || PADRAO.size;
  const lineHeight = Number.parseFloat(estilo.getPropertyValue('--pl-type-caption-line-height'));

  return { family, lineHeight: lineHeight || size * 1.34, size };
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
