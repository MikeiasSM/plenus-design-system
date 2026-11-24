import { measureLabel, type LabelFont } from './measureText';
import styles from './Chart.module.css';

export type ChartExportFormat = 'png' | 'svg';

export interface ChartExportOptions {
  /** Nome do arquivo. Sem ele, vale o titulo do grafico, sem acento nem espaco; a extensao entra se faltar. */
  fileName?: string;
  format: ChartExportFormat;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const REVOKE_DELAY = 40_000;
/** O PNG sai no dobro da resolucao, para ficar nitido numa apresentacao. */
const ESCALA_DO_PNG = 2;
const MARGEM = 24;
const ENTRE_TITULO_E_SUBTITULO = 4;
const ENTRE_BLOCOS = 16;
const AMOSTRA = 10;
const AMOSTRA_DA_LINHA = 16;
const ENTRE_AMOSTRA_E_TEXTO = 6;
const ENTRE_ENTRADAS = 16;
const FUNDO = '#FFFFFF';

/** Propriedades que o desenho recebe das folhas de estilo e que o arquivo precisa levar escritas no proprio elemento. */
const PROPRIEDADES = [
  'display',
  'visibility',
  'opacity',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'paint-order',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'font-variant-numeric',
  'letter-spacing',
  'text-anchor',
  'dominant-baseline',
  'shape-rendering',
  'stop-color',
  'stop-opacity',
] as const;

/** Atributos que so servem a tela: classes de folha que o arquivo nao tem, foco e marcas internas. */
const ATRIBUTOS_DA_TELA = ['class', 'tabindex', 'role', 'aria-labelledby', 'aria-describedby', 'data-chart-canvas', 'style'];

/** Nome do arquivo a partir do titulo, sem acento nem espaco: `Receita por canal` vira `receita-por-canal.png`. */
export function chartFileName(title: string, format: ChartExportFormat) {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base || 'grafico'}.${format}`;
}

function comExtensao(fileName: string, format: ChartExportFormat) {
  return fileName.toLowerCase().endsWith(`.${format}`) ? fileName : `${fileName}.${format}`;
}

function localizarDesenho(element: Element) {
  const desenho = element.matches('[data-chart-canvas]') ? element : element.querySelector('[data-chart-canvas]');

  if (!(desenho instanceof SVGSVGElement)) {
    throw new Error('exportChart: o elemento não tem um gráfico desenhado. Na visão em tabela ou sem dados, não há o que exportar.');
  }

  return { desenho, figura: desenho.closest('figure') ?? element };
}

/** Valor que nao serve ao arquivo: vazio, um `var()` por resolver, a cor do sistema ou o transparente de quem nao pintou. */
function inutil(valor: string) {
  return valor === '' || valor.includes('var(') || /^(canvastext|transparent|rgba\(0, 0, 0, 0\))$/i.test(valor);
}

/** Valor calculado utilizavel; o que ficou por resolver cai no padrao. */
function calculado(estilo: CSSStyleDeclaration, propriedade: string, padrao: string) {
  const valor = estilo.getPropertyValue(propriedade).trim();

  return inutil(valor) ? padrao : valor;
}

function pixels(valor: string, padrao: number) {
  const numero = Number.parseFloat(valor);

  return Number.isFinite(numero) && numero > 0 ? numero : padrao;
}

interface Tipo {
  color: string;
  family: string;
  size: number;
  weight: string;
}

function tipoDe(elemento: Element | null, padrao: Tipo): Tipo {
  if (!elemento) {
    return padrao;
  }

  const estilo = getComputedStyle(elemento);

  return {
    color: calculado(estilo, 'color', padrao.color),
    family: calculado(estilo, 'font-family', padrao.family),
    size: pixels(estilo.getPropertyValue('font-size'), padrao.size),
    weight: calculado(estilo, 'font-weight', padrao.weight),
  };
}

function texto(conteudo: string, x: number, y: number, tipo: Tipo) {
  const no = document.createElementNS(SVG_NS, 'text');

  no.setAttribute('x', String(x));
  no.setAttribute('y', String(y));
  no.setAttribute('fill', tipo.color);
  no.setAttribute('font-family', tipo.family);
  no.setAttribute('font-size', String(tipo.size));
  no.setAttribute('font-weight', tipo.weight);
  no.textContent = conteudo;

  return no;
}

/** Copia para cada elemento os estilos calculados, todos lidos antes de qualquer classe sair, porque elas se herdam. */
function embutirEstilos(raiz: Element) {
  const elementos = [raiz, ...raiz.querySelectorAll('*')];
  const estilos = elementos.map((elemento) => {
    const estilo = getComputedStyle(elemento);

    return new Map<string, string>(
      PROPRIEDADES.flatMap((propriedade) => {
        const valor = estilo.getPropertyValue(propriedade).trim();

        return valor === '' || valor.includes('var(') ? [] : [[propriedade, valor] as const];
      }),
    );
  });

  elementos.forEach((elemento, indice) => {
    const estilo = estilos[indice];

    ATRIBUTOS_DA_TELA.forEach((atributo) => elemento.removeAttribute(atributo));

    // A cor passada como atributo com `var()` so se le na pagina: no arquivo, vale a cor ja resolvida.
    (['fill', 'stroke', 'stop-color'] as const).forEach((atributo) => {
      const valor = elemento.getAttribute(atributo);

      if (valor?.includes('var(')) {
        const resolvido = estilo.get(atributo);

        if (resolvido && !resolvido.includes('var(')) {
          elemento.setAttribute(atributo, resolvido);
        }
      }
    });

    if (estilo.size > 0) {
      elemento.setAttribute('style', [...estilo].map(([propriedade, valor]) => `${propriedade}:${valor}`).join(';'));
    }
  });
}

interface EntradaDaLegenda {
  color: string;
  kind: 'series' | 'line' | 'band';
  label: string;
}

function entradasDaLegenda(figura: Element): EntradaDaLegenda[] {
  return [...figura.querySelectorAll('[data-chart-legend] > li')].flatMap((item) => {
    if (item.hasAttribute('data-hidden')) {
      return [];
    }

    const rotulo = item.getElementsByClassName(styles.legendLabel)[0]?.textContent?.trim() ?? item.textContent?.trim() ?? '';
    const amostra = item.querySelector('[aria-hidden="true"]');
    const tipo = item.getAttribute('data-reference');
    const kind = tipo === 'line' || tipo === 'band' ? tipo : 'series';
    const estilo = amostra ? getComputedStyle(amostra) : undefined;
    const inline = amostra instanceof HTMLElement ? amostra.style.background : '';
    const color =
      kind === 'series'
        ? (estilo && calculado(estilo, 'background-color', '')) || inline || '#888888'
        : (estilo && calculado(estilo, 'color', '')) || '#373435';

    return rotulo ? [{ color, kind, label: rotulo }] : [];
  });
}

/** Legenda em linhas que quebram na largura do desenho. Devolve a altura ocupada. */
function desenharLegenda(destino: Element, entradas: readonly EntradaDaLegenda[], topo: number, largura: number, tipo: Tipo) {
  const fonte: LabelFont = {
    centerSteps: [],
    family: tipo.family,
    headingFamily: tipo.family,
    labelWeight: 600,
    lineHeight: Math.round(tipo.size * 1.4),
    size: tipo.size,
  };
  const alturaDaLinha = Math.max(fonte.lineHeight, AMOSTRA + 4);
  let x = 0;
  let linha = 0;

  entradas.forEach((entrada) => {
    const larguraDaAmostra = entrada.kind === 'line' ? AMOSTRA_DA_LINHA : AMOSTRA;
    const larguraDoTexto = measureLabel(entrada.label, fonte);
    const ocupa = larguraDaAmostra + ENTRE_AMOSTRA_E_TEXTO + larguraDoTexto;

    if (x > 0 && x + ocupa > largura) {
      x = 0;
      linha += 1;
    }

    const meio = topo + linha * alturaDaLinha + alturaDaLinha / 2;
    const grupo = document.createElementNS(SVG_NS, 'g');

    if (entrada.kind === 'line') {
      const traco = document.createElementNS(SVG_NS, 'line');
      traco.setAttribute('x1', String(MARGEM + x));
      traco.setAttribute('x2', String(MARGEM + x + AMOSTRA_DA_LINHA));
      traco.setAttribute('y1', String(meio));
      traco.setAttribute('y2', String(meio));
      traco.setAttribute('stroke', entrada.color);
      traco.setAttribute('stroke-width', '2');
      traco.setAttribute('stroke-dasharray', '4 3');
      grupo.append(traco);
    } else {
      const caixa = document.createElementNS(SVG_NS, 'rect');
      caixa.setAttribute('x', String(MARGEM + x));
      caixa.setAttribute('y', String(meio - AMOSTRA / 2));
      caixa.setAttribute('width', String(AMOSTRA));
      caixa.setAttribute('height', String(AMOSTRA));
      caixa.setAttribute('rx', '2');
      caixa.setAttribute('fill', entrada.color);

      if (entrada.kind === 'band') {
        caixa.setAttribute('fill-opacity', '0.14');
        caixa.setAttribute('stroke', entrada.color);
        caixa.setAttribute('stroke-opacity', '0.5');
      }

      grupo.append(caixa);
    }

    const rotulo = texto(entrada.label, MARGEM + x + larguraDaAmostra + ENTRE_AMOSTRA_E_TEXTO, meio, tipo);
    rotulo.setAttribute('dominant-baseline', 'central');
    grupo.append(rotulo);
    destino.append(grupo);
    x += ocupa + ENTRE_ENTRADAS;
  });

  return entradas.length === 0 ? 0 : (linha + 1) * alturaDaLinha;
}

export interface ChartSvgRender {
  height: number;
  /** O arquivo SVG inteiro, com a declaracao XML. */
  markup: string;
  title: string;
  width: number;
}

/**
 * Monta o arquivo do grafico: titulo, subtitulo, desenho e legenda, num SVG com os estilos embutidos. A copia e lida
 * no tema claro, ao lado do original para herdar a paleta, e o fundo e branco, seja qual for o tema da tela.
 */
export function renderChartSvg(element: Element): ChartSvgRender {
  const { figura } = localizarDesenho(element);
  const area = document.createElement('div');
  const copia = figura.cloneNode(true) as Element;

  area.setAttribute('aria-hidden', 'true');
  area.setAttribute('data-theme', 'light');
  area.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;color-scheme:light;';
  area.style.width = `${figura.getBoundingClientRect().width || 0}px`;
  area.append(copia);
  // Ao lado do original, a copia herda a paleta e as variaveis do produto; o `data-theme` troca so o tema.
  (figura.parentNode ?? document.body).insertBefore(area, figura.nextSibling);

  try {
    const desenho = copia.matches('[data-chart-canvas]') ? copia : copia.querySelector('[data-chart-canvas]');

    if (!(desenho instanceof SVGSVGElement)) {
      throw new Error('exportChart: o elemento não tem um gráfico desenhado.');
    }

    const largura = Number(desenho.getAttribute('width')) || desenho.getBoundingClientRect().width;
    const altura = Number(desenho.getAttribute('height')) || desenho.getBoundingClientRect().height;
    const elementoDoTitulo = copia.querySelector('[data-chart-title]') ?? copia.querySelector('figcaption');
    const titulo = elementoDoTitulo?.textContent?.trim() ?? '';
    const elementoDoSubtitulo = copia.querySelector('[data-chart-subtitle]');
    const subtitulo = elementoDoSubtitulo?.textContent?.trim() ?? '';
    const tipoDoTitulo = tipoDe(elementoDoTitulo, { color: '#373435', family: 'sans-serif', size: 14, weight: '600' });
    // O titulo escondido da tela continua sendo o nome do arquivo: le-se o peso e o tamanho do titulo visivel.
    const tipoDoSubtitulo = tipoDe(elementoDoSubtitulo, { color: '#606062', family: tipoDoTitulo.family, size: 12, weight: '400' });
    const primeiroRotulo = copia.querySelector(`[data-chart-legend] .${styles.legendItem}`);
    const tipoDaLegenda = tipoDe(primeiroRotulo, { color: '#606062', family: tipoDoTitulo.family, size: 12, weight: '400' });
    const legenda = entradasDaLegenda(copia);

    // O realce do ponteiro e da tela, nao do dado: a faixa ou a linha sob o cursor fica fora do arquivo.
    desenho.querySelectorAll(`.${styles.cursor}, .${styles.pointCursor}`).forEach((realce) => realce.remove());
    embutirEstilos(desenho);

    const arquivo = document.createElementNS(SVG_NS, 'svg');
    const larguraTotal = Math.ceil(largura + MARGEM * 2);
    let topo = MARGEM;

    const fundo = document.createElementNS(SVG_NS, 'rect');
    fundo.setAttribute('fill', FUNDO);
    fundo.setAttribute('width', '100%');
    fundo.setAttribute('height', '100%');
    arquivo.append(fundo);

    if (titulo) {
      const no = texto(titulo, MARGEM, topo + tipoDoTitulo.size, tipoDoTitulo);
      arquivo.append(no);
      topo += Math.round(tipoDoTitulo.size * 1.4);
    }

    if (subtitulo) {
      topo += ENTRE_TITULO_E_SUBTITULO;
      arquivo.append(texto(subtitulo, MARGEM, topo + tipoDoSubtitulo.size, tipoDoSubtitulo));
      topo += Math.round(tipoDoSubtitulo.size * 1.4);
    }

    if (titulo || subtitulo) {
      topo += ENTRE_BLOCOS;
    }

    desenho.setAttribute('x', String(MARGEM));
    desenho.setAttribute('y', String(topo));
    desenho.setAttribute('width', String(largura));
    desenho.setAttribute('height', String(altura));
    desenho.style.setProperty('overflow', 'visible');
    arquivo.append(desenho);
    topo += altura;

    if (legenda.length > 0) {
      topo += ENTRE_BLOCOS;
      const grupo = document.createElementNS(SVG_NS, 'g');
      topo += desenharLegenda(grupo, legenda, topo, largura, tipoDaLegenda);
      arquivo.append(grupo);
    }

    const alturaTotal = Math.ceil(topo + MARGEM);

    arquivo.setAttribute('width', String(larguraTotal));
    arquivo.setAttribute('height', String(alturaTotal));
    arquivo.setAttribute('viewBox', `0 0 ${larguraTotal} ${alturaTotal}`);

    const markup = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(arquivo)}`;

    return { height: alturaTotal, markup, title: titulo, width: larguraTotal };
  } finally {
    area.remove();
  }
}

function baixar(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  /* O Safari perde o download se o endereco sai antes de ele comecar. */
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY);
}

/** Desenha o SVG num canvas no dobro da resolucao, sobre fundo branco. */
function pngDe({ height, markup, width }: ChartSvgRender): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();

    imagem.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * ESCALA_DO_PNG;
      canvas.height = height * ESCALA_DO_PNG;
      const contexto = canvas.getContext('2d');

      if (!contexto) {
        reject(new Error('exportChart: o navegador não oferece canvas para gerar o PNG.'));
        return;
      }

      contexto.scale(ESCALA_DO_PNG, ESCALA_DO_PNG);
      contexto.fillStyle = FUNDO;
      contexto.fillRect(0, 0, width, height);
      contexto.drawImage(imagem, 0, 0, width, height);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('exportChart: o PNG não pôde ser gerado.'))), 'image/png');
    };
    imagem.onerror = () => reject(new Error('exportChart: o desenho não pôde ser lido como imagem.'));
    imagem.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  });
}

/**
 * Baixa o grafico como PNG ou SVG, com o titulo, o subtitulo e a legenda, no tema claro e com fundo branco. Recebe a
 * figura do grafico (a `ref` dele) ou um elemento que a contenha; falha se o grafico estiver na visao em tabela.
 */
export async function exportChart(element: Element, { fileName, format }: ChartExportOptions): Promise<void> {
  // O arquivo e montado antes de qualquer espera, com o grafico como esta agora.
  const arquivo = renderChartSvg(element);
  const nome = fileName ? comExtensao(fileName, format) : chartFileName(arquivo.title, format);

  if (format === 'svg') {
    baixar(nome, new Blob([arquivo.markup], { type: 'image/svg+xml;charset=utf-8' }));
    return;
  }

  baixar(nome, await pngDe(arquivo));
}
