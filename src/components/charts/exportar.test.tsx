import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { chartFileName, exportChart, renderChartSvg } from './core';
import { ChartBar } from './ChartBar';
import { ChartDonut } from './ChartDonut';
import { ChartLine } from './ChartLine';

const canais = [
  { label: 'Loja', values: [42, 45] },
  { label: 'Site', values: [31, 35] },
];

function simularDownload() {
  const blobs: Blob[] = [];
  const nomes: string[] = [];
  const createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob);
    return 'blob:grafico';
  });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    nomes.push(this.download);
  });

  vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL: vi.fn() }));

  return { blobs, click, nomes };
}

function lerBlob(blob: Blob) {
  return new Promise<string>((resolve) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.readAsText(blob);
  });
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
});
afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('exportable', () => {
  it('sem exportable, nenhum menu aparece', () => {
    render(<ChartBar categories={['jan', 'fev']} series={canais} title="Receita por canal" />);

    expect(screen.queryByRole('button', { name: /Opções do gráfico/ })).not.toBeInTheDocument();
  });

  it('o menu "Opções do gráfico" oferece PNG e SVG', () => {
    render(<ChartBar categories={['jan', 'fev']} exportable series={canais} title="Receita por canal" />);

    const gatilho = screen.getByRole('button', { name: 'Opções do gráfico Receita por canal' });
    fireEvent.click(gatilho);

    expect(screen.getByRole('menu', { name: 'Opções do gráfico Receita por canal' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Baixar PNG', 'Baixar SVG']);
  });

  it('"Baixar SVG" baixa o arquivo com o nome do título, sem acento nem espaço', async () => {
    const { blobs, nomes } = simularDownload();
    render(<ChartBar categories={['jan', 'fev']} exportable series={canais} subtitle="Novembro de 2026" title="Receita por canal" />);

    fireEvent.click(screen.getByRole('button', { name: 'Opções do gráfico Receita por canal' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'Baixar SVG' }));
    });

    expect(nomes).toEqual(['receita-por-canal.svg']);
    expect(blobs[0].type).toBe('image/svg+xml;charset=utf-8');

    const conteudo = await lerBlob(blobs[0]);
    expect(conteudo).toContain('Receita por canal');
    expect(conteudo).toContain('Novembro de 2026');
  });

  it('na visão em tabela, as opções ficam indisponíveis', () => {
    render(<ChartBar categories={['jan', 'fev']} exportable series={canais} title="Receita por canal" />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver como tabela' }));
    fireEvent.click(screen.getByRole('button', { name: 'Opções do gráfico Receita por canal' }));

    expect(screen.getByRole('menuitem', { name: 'Baixar PNG' })).toBeDisabled();
  });

  it('o subtítulo aparece abaixo do título', () => {
    render(<ChartLine categories={['jan', 'fev']} series={canais} subtitle="Novembro de 2026" title="Receita por canal" />);

    expect(screen.getByText('Novembro de 2026')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Receita por canal' })).toBeInTheDocument();
  });

  it('vale para os outros gráficos da moldura comum', () => {
    render(<ChartDonut exportable slices={[{ label: 'A', value: 1 }, { label: 'B', value: 2 }]} title="Fatias" />);

    expect(screen.getByRole('button', { name: 'Opções do gráfico Fatias' })).toBeInTheDocument();
  });
});

describe('o SVG gerado', () => {
  it('leva título, subtítulo, desenho e legenda, sobre fundo branco e sem as classes da tela', () => {
    const ref = createRef<HTMLElement>();
    render(
      <ChartBar
        categories={['jan', 'fev']}
        ref={ref}
        references={[{ label: 'Meta', type: 'line', value: 50 }]}
        series={canais}
        subtitle="Novembro de 2026"
        title="Receita por canal"
      />,
    );

    const { height, markup, title, width } = renderChartSvg(ref.current!);
    const documento = new DOMParser().parseFromString(markup.replace(/^<\?xml[^>]*\?>\s*/, ''), 'image/svg+xml');
    const raiz = documento.documentElement;

    expect(title).toBe('Receita por canal');
    expect(markup.startsWith('<?xml')).toBe(true);
    expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(raiz.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(raiz.getAttribute('viewBox')).toBe(`0 0 ${width} ${height}`);
    expect(raiz.querySelector('rect')?.getAttribute('fill')).toBe('#FFFFFF');

    const textos = [...raiz.querySelectorAll('text')].map((no) => no.textContent);
    expect(textos.slice(0, 2)).toEqual(['Receita por canal', 'Novembro de 2026']);
    expect(textos).toEqual(expect.arrayContaining(['Loja', 'Site', 'Meta: 50', 'jan', 'fev']));

    // O desenho entra inteiro, como um svg aninhado, sem classe nem papel de tela.
    expect(raiz.querySelectorAll('svg')).toHaveLength(1);
    expect(raiz.querySelectorAll('path').length).toBeGreaterThanOrEqual(4);
    expect(raiz.querySelector('[class]')).toBeNull();
    expect(raiz.querySelector('[role]')).toBeNull();
  });

  it('a cópia é lida no tema claro e sai do documento depois', () => {
    const ref = createRef<HTMLElement>();
    render(
      <div data-theme="dark">
        <ChartBar categories={['jan']} ref={ref} series={canais} title="Receita" />
      </div>,
    );
    const lidos: (string | null)[] = [];
    const original = window.getComputedStyle;
    vi.spyOn(window, 'getComputedStyle').mockImplementation((elemento, pseudo) => {
      lidos.push(elemento.closest('[data-theme]')?.getAttribute('data-theme') ?? null);
      return original(elemento, pseudo);
    });

    renderChartSvg(ref.current!);

    expect(lidos.length).toBeGreaterThan(0);
    expect(lidos.every((tema) => tema === 'light')).toBe(true);
    expect(document.querySelectorAll('[data-chart-canvas]')).toHaveLength(1);
  });

  it('falha com clareza quando não há desenho', () => {
    const ref = createRef<HTMLElement>();
    render(<ChartBar categories={[]} ref={ref} series={[]} title="Vazio" />);

    expect(() => renderChartSvg(ref.current!)).toThrow(/não tem um gráfico desenhado/);
  });
});

describe('exportChart', () => {
  it('nomeia o arquivo pelo título, sem acento nem espaço', () => {
    expect(chartFileName('Receita por canal — São Paulo', 'png')).toBe('receita-por-canal-sao-paulo.png');
    expect(chartFileName('   ', 'svg')).toBe('grafico.svg');
  });

  it('usa o fileName informado e acrescenta a extensão', async () => {
    const { nomes } = simularDownload();
    const ref = createRef<HTMLElement>();
    render(<ChartBar categories={['jan']} ref={ref} series={canais} title="Receita" />);

    await exportChart(ref.current!, { fileName: 'receita', format: 'svg' });
    await exportChart(ref.current!, { fileName: 'receita.svg', format: 'svg' });

    expect(nomes).toEqual(['receita.svg', 'receita.svg']);
  });

  it('o PNG é desenhado num canvas no dobro da resolução, sobre branco', async () => {
    const { blobs, nomes } = simularDownload();
    const png = new Blob(['png'], { type: 'image/png' });
    const contexto = { drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '', scale: vi.fn() };
    const tamanhos: [number, number][] = [];

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      tamanhos.push([this.width, this.height]);
      return contexto as unknown as CanvasRenderingContext2D;
    } as unknown as typeof HTMLCanvasElement.prototype.getContext);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(png));
    vi.stubGlobal(
      'Image',
      class {
        onerror: (() => void) | null = null;
        onload: (() => void) | null = null;
        set src(_valor: string) {
          queueMicrotask(() => this.onload?.());
        }
      },
    );

    const ref = createRef<HTMLElement>();
    render(<ChartBar categories={['jan']} ref={ref} series={canais} title="Receita por canal" />);
    const { height, width } = renderChartSvg(ref.current!);

    await exportChart(ref.current!, { format: 'png' });

    expect(nomes.at(-1)).toBe('receita-por-canal.png');
    expect(blobs.at(-1)).toBe(png);
    expect(tamanhos.at(-1)).toEqual([width * 2, height * 2]);
    expect(contexto.scale).toHaveBeenCalledWith(2, 2);
    expect(contexto.fillStyle).toBe('#FFFFFF');
    expect(contexto.drawImage).toHaveBeenCalled();
  });
});
