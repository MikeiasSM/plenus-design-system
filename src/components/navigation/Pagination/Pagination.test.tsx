import { act, fireEvent, render, screen } from '@testing-library/react';
import { Profiler } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pagination, montarFaixa } from './Pagination';

describe('Pagination: estilo', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/components/navigation/Pagination/Pagination.module.css'), 'utf8');
  const bloco = (seletor: string) => {
    const inicio = css.indexOf(`${seletor} {`);

    expect(inicio).toBeGreaterThanOrEqual(0);
    return css.slice(inicio, css.indexOf('}', inicio));
  };

  it('o intervalo e o seletor descem de linha, e os passos ficam numa linha so, sem encolher', () => {
    expect(bloco('.linha')).toContain('flex-wrap: wrap;');
    expect(bloco('.steps')).toContain('flex: 0 0 auto;');
    expect(bloco('.steps')).not.toContain('flex-wrap');
    expect(bloco('.list')).toContain('flex-wrap: nowrap;');
  });

  it('anterior, paginas e proxima ficam num grupo so, que desce inteiro', () => {
    render(<Pagination pageCount={5} />);

    const grupo = screen.getByRole('button', { name: 'Página anterior' }).parentElement;

    expect(grupo).toContainElement(screen.getByRole('list'));
    expect(grupo).toContainElement(screen.getByRole('button', { name: 'Próxima página' }));
  });
});

describe('montarFaixa', () => {
  it('mostra tudo quando cabe', () => {
    expect(montarFaixa(1, 5, 1)).toEqual([1, 2, 3, 4, 5]);
  });

  it('abre reticencia a direita quando a atual esta no inicio, sem encolher a faixa', () => {
    expect(montarFaixa(2, 20, 1)).toEqual([1, 2, 3, 4, 5, null, 20]);
    expect(montarFaixa(1, 10, 1)).toEqual([1, 2, 3, 4, 5, null, 10]);
  });

  it('nao esconde uma pagina so atras da reticencia', () => {
    expect(montarFaixa(4, 10, 1)).toEqual([1, 2, 3, 4, 5, null, 10]);
  });

  it('abre reticencia dos dois lados no meio', () => {
    expect(montarFaixa(10, 20, 1)).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it('abre reticencia a esquerda quando a atual esta no fim', () => {
    expect(montarFaixa(19, 20, 1)).toEqual([1, null, 16, 17, 18, 19, 20]);
  });

  it('respeita a quantidade de vizinhos', () => {
    expect(montarFaixa(10, 20, 2)).toEqual([1, null, 8, 9, 10, 11, 12, null, 20]);
  });
});

describe('Pagination', () => {
  it('nao renderiza nada com uma pagina so', () => {
    const { container } = render(<Pagination page={1} pageCount={1} onPageChange={() => undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('marca a pagina atual e desabilita o passo anterior no inicio', () => {
    render(<Pagination page={1} pageCount={10} onPageChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Página anterior' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Próxima página' })).not.toHaveAttribute('aria-disabled');
  });

  it('desabilita o proximo no fim', () => {
    render(<Pagination page={10} pageCount={10} onPageChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Próxima página' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('nao passa da borda pelo passo que continua focavel nela', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={10} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('reporta a pagina escolhida e os passos', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={5} pageCount={10} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Página 6' }));
    expect(onPageChange).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('controlada, so muda a pagina atual quando o produto muda page', () => {
    render(<Pagination page={5} pageCount={10} onPageChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Página 6' }));

    expect(screen.getByRole('button', { name: 'Página 5' })).toHaveAttribute('aria-current', 'page');
  });

  it('sem controle, comeca pelo defaultPage e troca de pagina sozinha', () => {
    const onPageChange = vi.fn();
    render(<Pagination defaultPage={3} pageCount={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(onPageChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: 'Página 4' })).toHaveAttribute('aria-current', 'page');
  });

  it('sem page nem defaultPage, comeca na primeira', () => {
    render(<Pagination pageCount={10} />);

    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('limita a pagina informada a faixa valida', () => {
    render(<Pagination page={99} pageCount={10} onPageChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Página 10' })).toHaveAttribute('aria-current', 'page');
  });

  it('suspende a troca de pagina sem tirar os botoes do foco', () => {
    const onPageChange = vi.fn();
    render(<Pagination disabled page={5} pageCount={10} onPageChange={onPageChange} />);

    const pagina = screen.getByRole('button', { name: 'Página 6' });

    fireEvent.click(pagina);
    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(onPageChange).not.toHaveBeenCalled();
    expect(pagina).toHaveAttribute('aria-disabled', 'true');
    expect(pagina).not.toBeDisabled();
  });

  describe('intervalo da página', () => {
    it('não mostra o intervalo sem o total e o tamanho da página', () => {
      render(<Pagination page={1} pageCount={10} onPageChange={() => undefined} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('mostra o intervalo da última página, que pode vir incompleta', () => {
      render(<Pagination page={3} pageCount={3} pageSize={25} totalItems={52} onPageChange={() => undefined} />);

      expect(screen.getByText('51–52 de 52')).toBeInTheDocument();
    });

    it('separa o milhar com ponto', () => {
      render(<Pagination page={25} pageCount={88} pageSize={50} totalItems={4380} onPageChange={() => undefined} />);

      expect(screen.getByText('1.201–1.250 de 4.380')).toBeInTheDocument();
    });

    it('anuncia por região viva, numa forma falada sem o travessão', () => {
      const { rerender } = render(
        <Pagination page={1} pageCount={3} pageSize={25} totalItems={52} onPageChange={() => undefined} />,
      );
      rerender(<Pagination page={2} pageCount={3} pageSize={25} totalItems={52} onPageChange={() => undefined} />);

      const regiao = screen.getByRole('status');
      expect(screen.getByText('26–50 de 52')).toHaveAttribute('aria-hidden', 'true');
      expect(regiao).toContainElement(screen.getByText('Itens 26 a 50 de 52'));
      expect(screen.getAllByRole('status')).toHaveLength(1);
    });

    it('troca o texto pelo formatRange', () => {
      const formatRange = vi.fn(({ start, end, total }) => `Documentos ${start} a ${end} de ${total}`);
      render(
        <Pagination
          formatRange={formatRange}
          page={2}
          pageCount={3}
          pageSize={25}
          totalItems={52}
          onPageChange={() => undefined}
        />,
      );

      expect(formatRange).toHaveBeenCalledWith({ start: 26, end: 50, total: 52 });
      expect(screen.getByRole('status')).toHaveTextContent(/^Documentos 26 a 50 de 52$/);
    });
  });

  describe('primeira e última página', () => {
    it('leva às pontas e desabilita a da ponta atual', () => {
      const onPageChange = vi.fn();
      render(<Pagination showFirstLast page={1} pageCount={10} onPageChange={onPageChange} />);

      expect(screen.getByRole('button', { name: 'Primeira página' })).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'Primeira página' }));
      fireEvent.click(screen.getByRole('button', { name: 'Última página' }));

      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(10);
    });

    it('não aparecem sem showFirstLast', () => {
      render(<Pagination page={1} pageCount={10} />);

      expect(screen.queryByRole('button', { name: 'Última página' })).not.toBeInTheDocument();
    });
  });

  describe('itens por página', () => {
    function escolherTamanho(tamanho: string) {
      fireEvent.click(screen.getByRole('combobox', { name: 'Itens por página' }));
      fireEvent.click(screen.getByRole('option', { name: tamanho }));
    }

    it('sem controle, começa pela primeira opção e tira dela o total de páginas', () => {
      render(<Pagination pageSizeOptions={[25, 50]} totalItems={120} />);

      expect(screen.getByRole('combobox', { name: 'Itens por página' })).toHaveTextContent('25');
      expect(screen.getByRole('button', { name: 'Página 5' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Página 6' })).not.toBeInTheDocument();
    });

    it('vai à página que contém o primeiro item da atual', () => {
      const onPageChange = vi.fn();
      const onPageSizeChange = vi.fn();
      render(
        <Pagination
          defaultPage={4}
          pageSizeOptions={[25, 100]}
          totalItems={400}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />,
      );

      escolherTamanho('100');

      expect(onPageSizeChange).toHaveBeenCalledWith(100);
      expect(onPageChange).toHaveBeenCalledWith(1);
      expect(screen.getByText('1–100 de 400')).toBeInTheDocument();
    });

    it('troca o tamanho mesmo com a troca de página suspensa', () => {
      const onPageSizeChange = vi.fn();
      render(<Pagination disabled pageSizeOptions={[25, 50]} totalItems={120} onPageSizeChange={onPageSizeChange} />);

      escolherTamanho('50');

      expect(onPageSizeChange).toHaveBeenCalledWith(50);
    });

    it('continua na tela com uma página só, para voltar a um tamanho menor', () => {
      render(<Pagination pageSize={100} pageSizeOptions={[25, 100]} totalItems={80} />);

      expect(screen.getByRole('combobox', { name: 'Itens por página' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Próxima página' })).not.toBeInTheDocument();
    });

    it('nomeia a lista aberta pelo campo', () => {
      render(<Pagination pageSizeOptions={[25, 50]} totalItems={120} />);

      fireEvent.click(screen.getByRole('combobox', { name: 'Itens por página' }));

      expect(screen.getByRole('listbox', { name: 'Itens por página' })).toBeInTheDocument();
    });
  });
});

describe('Pagination: largura', () => {
  const original = HTMLElement.prototype.getBoundingClientRect;
  const formas = [330, 230, 190, 110];
  let larguraDoNav = 400;

  const retangulo = (largura: number) => ({
    width: largura,
    height: 32,
    top: 0,
    left: 0,
    right: largura,
    bottom: 32,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  beforeEach(() => {
    HTMLElement.prototype.getBoundingClientRect = function medir(this: HTMLElement) {
      if (this.tagName === 'NAV') {
        return retangulo(larguraDoNav);
      }

      return retangulo(this.dataset.forma === undefined ? 0 : formas[Number(this.dataset.forma)]);
    };
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = original;
  });

  it('cabendo, mostra todos os numeros', () => {
    larguraDoNav = 400;
    render(<Pagination defaultPage={10} pageCount={20} />);

    expect(screen.getByRole('button', { name: 'Página 11' })).toBeInTheDocument();
    expect(screen.queryByText('10 de 20')).not.toBeInTheDocument();
  });

  it('sem largura para os vizinhos, tira os vizinhos da atual antes de virar compacto', () => {
    larguraDoNav = 240;
    render(<Pagination defaultPage={10} pageCount={20} />);

    expect(screen.getByRole('button', { name: 'Página 10' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Página 11' })).not.toBeInTheDocument();
    expect(screen.queryByText('10 de 20')).not.toBeInTheDocument();
  });

  it('sem largura para os numeros, vira anterior, "3 de 12" e proxima, que a pagina atual e o total anunciam', () => {
    larguraDoNav = 200;
    render(<Pagination defaultPage={3} pageCount={12} />);

    expect(screen.getByText('3 de 12')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('status')).toHaveTextContent('3 de 12');
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Página 3' })).not.toBeInTheDocument();
  });

  it('com o total de itens, so o intervalo se anuncia, e o "3 de 12" fica visivel fora da regiao viva', () => {
    larguraDoNav = 200;
    render(<Pagination defaultPage={3} pageCount={12} pageSize={10} totalItems={120} />);

    expect(screen.getByText('3 de 12')).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Itens 21 a 30 de 120');
    expect(screen.getByRole('status')).not.toContainElement(screen.getByText('3 de 12'));
  });

  it('compact forca o modo compacto mesmo com largura de sobra, e a pagina muda pelos passos', () => {
    larguraDoNav = 800;
    const onPageChange = vi.fn();
    render(<Pagination compact page={3} pageCount={12} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }));

    expect(screen.getByText('3 de 12')).toBeInTheDocument();
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('no servidor, o HTML inicial traz a forma completa, sem erro', () => {
    const html = renderToString(<Pagination defaultPage={10} pageCount={20} />);

    expect(html).toContain('aria-label="Página 11"');
    expect(html).not.toContain('>10 de 20<');
  });

  it('hidrata o HTML do servidor sem divergencia', async () => {
    const erros = vi.fn();
    larguraDoNav = 200;
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToString(<Pagination defaultPage={10} pageCount={20} />);

    await act(async () => {
      hydrateRoot(container, <Pagination defaultPage={10} pageCount={20} />, { onRecoverableError: erros });
    });

    expect(erros).not.toHaveBeenCalled();
    expect(container.querySelector('[aria-current="page"]')).toHaveTextContent('10 de 20');
    container.remove();
  });

  it('formatCompact troca o texto do modo compacto', () => {
    render(<Pagination compact formatCompact={(pagina, total) => `Page ${pagina} of ${total}`} page={3} pageCount={12} />);

    expect(screen.getByText('Page 3 of 12')).toHaveAttribute('aria-current', 'page');
  });

  it('com as pontas, o compacto as perde so se ainda nao couber', () => {
    larguraDoNav = 150;
    render(<Pagination compact page={3} pageCount={12} showFirstLast />);

    expect(screen.queryByRole('button', { name: 'Primeira página' })).not.toBeInTheDocument();
    expect(screen.getByText('3 de 12')).toBeInTheDocument();

    larguraDoNav = 200;
    const { container } = render(<Pagination compact page={3} pageCount={12} showFirstLast />);

    expect(container.querySelector('[aria-label="Primeira página"]')).not.toBeNull();
  });

  it('sem largura nem para o texto, ficam so as setas, e o "3 de 12" so se anuncia', () => {
    larguraDoNav = 100;
    render(<Pagination defaultPage={3} pageCount={12} />);

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Página 3' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('3 de 12');
    expect(screen.getByText('3 de 12').parentElement?.className).not.toMatch(/compactText/);
  });

  it('so com as setas e com o total de itens, quem anuncia e o intervalo', () => {
    larguraDoNav = 100;
    render(<Pagination defaultPage={3} pageCount={12} pageSize={10} totalItems={120} />);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Itens 21 a 30 de 120');
  });

  it('a decisao nao depende do nivel atual: reduz uma vez e para, sem laco de renderizacao', () => {
    larguraDoNav = 240;
    const renderizacoes = vi.fn();

    render(
      <Profiler id="paginacao" onRender={renderizacoes}>
        <Pagination defaultPage={10} pageCount={20} />
      </Profiler>,
    );

    expect(screen.getByRole('button', { name: 'Página 10' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Página 11' })).not.toBeInTheDocument();
    expect(renderizacoes.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('volta a crescer quando o pai alarga', () => {
    let observar: () => void = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(chamar: () => void) {
          observar = chamar;
        }
        observe() {}
        disconnect() {}
      },
    );
    larguraDoNav = 160;
    render(<Pagination defaultPage={10} pageCount={20} />);

    expect(screen.getByText('10 de 20')).toBeInTheDocument();

    larguraDoNav = 400;
    act(() => observar());

    expect(screen.getByRole('button', { name: 'Página 11' })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('a copia invisivel fica fora da arvore de acessibilidade, sem botao nem texto', () => {
    const { container } = render(<Pagination defaultPage={10} pageCount={20} pageSize={10} totalItems={200} />);
    const copia = container.querySelector('[aria-hidden="true"][inert]');

    expect(copia).not.toBeNull();
    expect(copia?.querySelector('button, a, input, select, [tabindex]')).toBeNull();
    expect(copia?.textContent).toBe('');
    expect(screen.getAllByRole('button', { name: 'Página anterior' })).toHaveLength(1);
  });

  it('observa a largura tambem quando as paginas chegam depois da montagem', () => {
    const observados: Element[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe(alvo: Element) {
          observados.push(alvo);
        }
        disconnect() {}
      },
    );
    const { rerender } = render(<Pagination pageSize={25} pageSizeOptions={[25, 50]} totalItems={0} />);

    expect(observados).toHaveLength(0);

    rerender(<Pagination pageSize={25} pageSizeOptions={[25, 50]} totalItems={2000} />);

    expect(observados[0].tagName).toBe('NAV');
    expect(observados.slice(1).every((alvo) => alvo.hasAttribute('data-forma'))).toBe(true);
    vi.unstubAllGlobals();
  });
});
