import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Columns } from './Columns';

const items = [
  { id: 'geral', label: 'Geral' },
  { id: 'equipe', label: 'Equipe' },
];

function renderIndex(label?: string) {
  return render(
    <Columns>
      <Columns.Main>
        <section id="geral">Geral</section>
        <section id="equipe">Equipe</section>
      </Columns.Main>
      <Columns.Index items={items} label={label} />
    </Columns>,
  );
}

describe('Columns', () => {
  it('mostra o conteudo principal e a coluna lateral como aside', () => {
    render(
      <Columns>
        <Columns.Main>Principal</Columns.Main>
        <Columns.Aside>Resumo</Columns.Aside>
      </Columns>,
    );

    expect(screen.getByText('Principal')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveTextContent('Resumo');
  });

  it('entrega propriedades nativas, className e ref a raiz', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Columns className="extra" data-testid="raiz" ref={ref}>
        <Columns.Main>Principal</Columns.Main>
      </Columns>,
    );

    expect(screen.getByTestId('raiz')).toHaveClass('extra');
    expect(ref.current).toBe(screen.getByTestId('raiz'));
  });
});

function mockTops(tops: Record<string, number>) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { top: tops[this.id] ?? 0 } as DOMRect;
  });
}

describe('Columns.Index', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
    window.location.hash = '';
    mockTops({ equipe: 500 });
  });

  afterEach(() => {
    scrollIntoView.mockClear();
    vi.restoreAllMocks();
  });

  it('nomeia o indice por "Nesta pagina" ou pelo label', () => {
    const { unmount } = renderIndex();
    expect(screen.getByRole('navigation', { name: 'Nesta página' })).toBeInTheDocument();
    unmount();

    renderIndex('Seções');
    expect(screen.getByRole('navigation', { name: 'Seções' })).toBeInTheDocument();
  });

  it('aponta cada link para o id da secao e marca o primeiro', () => {
    renderIndex();

    expect(screen.getByRole('link', { name: 'Equipe' })).toHaveAttribute('href', '#equipe');
    expect(screen.getByRole('link', { name: 'Geral' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Equipe' })).not.toHaveAttribute('aria-current');
  });

  it('rola ate a secao, leva o foco e nao altera o endereco', () => {
    renderIndex();

    fireEvent.click(screen.getByRole('link', { name: 'Equipe' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(window.location.hash).toBe('');
    expect(document.getElementById('equipe')).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Equipe' })).toHaveAttribute('aria-current', 'true');
  });

  it('rola sem animacao quando o sistema pede menos movimento', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
    renderIndex();

    fireEvent.click(screen.getByRole('link', { name: 'Equipe' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('acompanha a rolagem do documento', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    renderIndex();
    mockTops({ equipe: 40, geral: -300 });

    act(() => {
      document.dispatchEvent(new Event('scroll'));
    });

    expect(screen.getByRole('link', { name: 'Equipe' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Geral' })).not.toHaveAttribute('aria-current');
  });
});
