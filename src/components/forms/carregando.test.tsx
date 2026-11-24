import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ComboBox, type ComboBoxOption } from './ComboBox';
import { Select } from './Select';

const PASSO = 36;
const ALTURA_DA_LISTA = 280;

function registros(total: number, inicio = 0): ComboBoxOption[] {
  return Array.from({ length: total }, (_, indice) => ({
    value: String(inicio + indice),
    label: 'Registro ' + String(inicio + indice + 1).padStart(5, '0'),
  }));
}

/**
 * O jsdom não faz layout: cada opção passa a medir 36px, a lista mostra 280px e a rolagem fica em `rolagem.topo`.
 * A altura do conteúdo soma as opções montadas e os espaçadores da janela virtual.
 */
const rolagem = { topo: 0 };
const originais = new Map<string, PropertyDescriptor | undefined>();

function simular(alvo: object, nome: string, descritor: PropertyDescriptor) {
  originais.set(nome, Object.getOwnPropertyDescriptor(alvo, nome));
  Object.defineProperty(alvo, nome, { configurable: true, ...descritor });
}

function ehLista(elemento: Element) {
  return elemento.getAttribute('role') === 'listbox';
}

function simularLayout() {
  rolagem.topo = 0;
  simular(HTMLElement.prototype, 'offsetTop', {
    get(this: HTMLElement) {
      return this.parentElement ? Array.prototype.indexOf.call(this.parentElement.children, this) * PASSO : 0;
    },
  });
  simular(HTMLElement.prototype, 'offsetHeight', { get: () => PASSO });
  simular(Element.prototype, 'clientHeight', {
    get(this: Element) {
      return ehLista(this) ? ALTURA_DA_LISTA : 0;
    },
  });
  simular(Element.prototype, 'scrollHeight', {
    get(this: Element) {
      if (!ehLista(this)) {
        return 0;
      }

      return Array.from(this.children).reduce(
        (total, filho) =>
          total + (filho.getAttribute('role') === 'option' ? PASSO : parseFloat((filho as HTMLElement).style.height) || 0),
        0,
      );
    },
  });
  simular(Element.prototype, 'scrollTop', {
    get(this: Element) {
      return ehLista(this) ? rolagem.topo : 0;
    },
    set(this: Element, valor: number) {
      if (ehLista(this)) {
        rolagem.topo = valor;
      }
    },
  });
}

function rolarAte(topo: number) {
  rolagem.topo = topo;
  fireEvent.scroll(screen.getByRole('listbox'));
}

afterEach(() => {
  for (const [nome, descritor] of originais) {
    const alvo = nome === 'offsetTop' || nome === 'offsetHeight' ? HTMLElement.prototype : Element.prototype;

    if (descritor) {
      Object.defineProperty(alvo, nome, descritor);
    } else {
      Reflect.deleteProperty(alvo, nome);
    }
  }
  originais.clear();
  vi.useRealTimers();
});

describe('ComboBox carregando', () => {
  it('troca as opções por uma linha de espera e marca a lista como ocupada', () => {
    render(<ComboBox label="Cliente" loading onSearch={vi.fn()} options={registros(4)} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Cliente' }));

    const lista = screen.getByRole('listbox');
    expect(lista).toHaveAttribute('aria-busy', 'true');
    expect(within(lista).queryAllByRole('option')).toHaveLength(0);
    expect(within(lista).getByText('Carregando')).toBeInTheDocument();
  });

  it('anuncia a espera uma vez na região de status e a contagem quando o resultado chega', () => {
    vi.useFakeTimers();
    const { rerender } = render(<ComboBox label="Cliente" loading={false} onSearch={vi.fn()} options={registros(4)} />);
    const campo = screen.getByRole('combobox', { name: 'Cliente' });
    const status = screen.getByRole('status');

    fireEvent.change(campo, { target: { value: 'reg' } });
    rerender(<ComboBox label="Cliente" loading onSearch={vi.fn()} options={registros(4)} />);
    expect(status).toBeEmptyDOMElement();

    act(() => vi.advanceTimersByTime(300));
    expect(status).toHaveTextContent('Carregando');

    // Outra renderização durante a mesma espera não repete o anúncio.
    rerender(<ComboBox label="Cliente" loading onSearch={vi.fn()} options={registros(2)} />);
    act(() => vi.advanceTimersByTime(300));
    expect(status).toHaveTextContent(/^Carregando$/);

    rerender(<ComboBox label="Cliente" loading={false} onSearch={vi.fn()} options={registros(20)} />);
    expect(status).toHaveTextContent('20 resultados');
    expect(screen.getAllByRole('option')).toHaveLength(20);
  });

  it('a busca que volta logo anuncia só o resultado, e o vazio pela mensagem de vazio', () => {
    vi.useFakeTimers();
    const { rerender } = render(<ComboBox label="Cliente" loading={false} onSearch={vi.fn()} options={registros(4)} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Cliente' }), { target: { value: 'xyz' } });
    rerender(<ComboBox label="Cliente" loading onSearch={vi.fn()} options={registros(4)} />);
    act(() => vi.advanceTimersByTime(100));
    rerender(<ComboBox label="Cliente" loading={false} onSearch={vi.fn()} options={[]} />);
    act(() => vi.advanceTimersByTime(500));

    expect(screen.getByRole('status')).toHaveTextContent('Nenhum resultado');
  });

  it('usa os textos de labels na linha de espera e nos anúncios', () => {
    const labels = {
      loading: 'Loading',
      loadingMore: 'Loading more',
      results: (count: number) => `${count} results`,
    };
    const { rerender } = render(
      <ComboBox label="Cliente" labels={labels} loading onSearch={vi.fn()} options={[]} />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Cliente' }));
    expect(within(screen.getByRole('listbox')).getByText('Loading')).toBeInTheDocument();

    rerender(<ComboBox label="Cliente" labels={labels} loading={false} onSearch={vi.fn()} options={registros(3)} />);
    expect(screen.getByRole('status')).toHaveTextContent('3 results');
  });

  it('não monta a região de status sem loading nem onLoadMore', () => {
    render(<ComboBox label="Cliente" options={registros(4)} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('ComboBox com páginas', () => {
  it('pede a próxima página uma vez ao chegar a três opções do fim, sem tirar o foco', () => {
    simularLayout();
    const onLoadMore = vi.fn();
    const { rerender } = render(<ComboBox hasMore label="Cliente" onLoadMore={onLoadMore} options={registros(20)} />);
    const campo = screen.getByRole('combobox', { name: 'Cliente' });

    campo.focus();
    fireEvent.click(campo);
    expect(onLoadMore).not.toHaveBeenCalled();

    // 20 opções de 36px em 280px: a rolagem vai até 440, e 400 deixa só uma opção e pouco abaixo da vista.
    rolarAte(400);
    rolarAte(420);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Carregando mais')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(20);
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-busy');
    expect(campo).toHaveFocus();

    rerender(<ComboBox hasMore label="Cliente" onLoadMore={onLoadMore} options={registros(40)} />);

    expect(screen.queryByText('Carregando mais')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('40 resultados');
    expect(screen.getAllByRole('option')).toHaveLength(40);
    expect(rolagem.topo).toBe(420);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rolarAte(1100);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('a seta para baixo na última opção pede mais, e o foco fica nela', () => {
    simularLayout();
    const onLoadMore = vi.fn();
    render(<ComboBox hasMore label="Cliente" onLoadMore={onLoadMore} options={registros(20)} />);
    const campo = screen.getByRole('combobox', { name: 'Cliente' });

    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    for (let vez = 0; vez < 19; vez += 1) {
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
    }
    const ultima = screen.getByRole('option', { name: 'Registro 00020' });
    expect(campo).toHaveAttribute('aria-activedescendant', ultima.id);
    expect(onLoadMore).not.toHaveBeenCalled();

    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    fireEvent.keyDown(campo, { key: 'ArrowDown' });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(campo).toHaveAttribute('aria-activedescendant', ultima.id);
  });

  it('a lista que cabe sem rolar já está no fim e pede a próxima página ao abrir', () => {
    const onLoadMore = vi.fn();
    render(<ComboBox hasMore label="Cliente" onLoadMore={onLoadMore} options={registros(3)} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Cliente' }));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('sem hasMore não pede página', () => {
    const onLoadMore = vi.fn();
    render(<ComboBox label="Cliente" onLoadMore={onLoadMore} options={registros(3)} />);
    const campo = screen.getByRole('combobox', { name: 'Cliente' });

    fireEvent.click(campo);
    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    fireEvent.keyDown(campo, { key: 'ArrowDown' });

    expect(onLoadMore).not.toHaveBeenCalled();
    expect(screen.queryByText('Carregando mais')).not.toBeInTheDocument();
  });

  it('o loading do produto durante a página não apaga as opções', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<ComboBox hasMore label="Cliente" onLoadMore={onLoadMore} options={registros(3)} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Cliente' }));
    rerender(<ComboBox hasMore label="Cliente" loading onLoadMore={onLoadMore} options={registros(3)} />);

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByText('Carregando mais')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-busy');
  });

  it('a busca nova esquece o pedido em curso', () => {
    const onLoadMore = vi.fn();
    render(<ComboBox hasMore label="Cliente" onLoadMore={onLoadMore} onSearch={vi.fn()} options={registros(3)} />);
    const campo = screen.getByRole('combobox', { name: 'Cliente' });

    fireEvent.click(campo);
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    fireEvent.change(campo, { target: { value: 'reg' } });

    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });
});

describe('ComboBox com muitas opções', () => {
  it('acima de 200 opções desenha só as visíveis, cada uma com a posição no total', () => {
    simularLayout();
    render(<ComboBox label="Município" options={registros(5000)} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Município' }));

    const opcoes = screen.getAllByRole('option');
    expect(opcoes.length).toBeGreaterThan(0);
    expect(opcoes.length).toBeLessThan(40);
    expect(opcoes[0]).toHaveAttribute('aria-setsize', '5000');
    expect(opcoes[0]).toHaveAttribute('aria-posinset', '1');

    rolarAte(PASSO * 3000);

    const depois = screen.getAllByRole('option');
    expect(depois.length).toBeLessThan(40);
    expect(screen.getByRole('option', { name: 'Registro 03001' })).toHaveAttribute('aria-posinset', '3001');
  });

  it('até 200 opções desenha todas', () => {
    simularLayout();
    render(<ComboBox label="Município" options={registros(200)} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Município' }));

    expect(screen.getAllByRole('option')).toHaveLength(200);
  });
});

describe('Select com páginas', () => {
  it('pede a próxima página uma vez perto do fim e anuncia a contagem quando ela chega', () => {
    simularLayout();
    const onLoadMore = vi.fn();
    const { rerender } = render(<Select hasMore label="Município" onLoadMore={onLoadMore} options={registros(20)} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Município' }));
    const lista = screen.getByRole('listbox');
    expect(lista).toHaveFocus();
    expect(onLoadMore).not.toHaveBeenCalled();

    rolarAte(400);
    rolarAte(430);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Carregando mais')).toBeInTheDocument();

    rerender(<Select hasMore label="Município" onLoadMore={onLoadMore} options={registros(40)} />);

    expect(screen.queryByText('Carregando mais')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('40 resultados');
    expect(screen.getAllByRole('option')).toHaveLength(40);
    expect(lista).toHaveFocus();
    expect(rolagem.topo).toBe(430);
  });

  it('a seta para baixo na última opção pede mais', () => {
    simularLayout();
    const onLoadMore = vi.fn();
    render(<Select defaultValue="19" hasMore label="Município" onLoadMore={onLoadMore} options={registros(20)} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Município' }));
    const lista = screen.getByRole('listbox');
    const ultima = screen.getByRole('option', { name: 'Registro 00020' });
    expect(lista).toHaveAttribute('aria-activedescendant', ultima.id);
    expect(onLoadMore).not.toHaveBeenCalled();

    fireEvent.keyDown(lista, { key: 'ArrowDown' });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(lista).toHaveAttribute('aria-activedescendant', ultima.id);
  });

  it('usa loadingMoreMessage e loadedMessage', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <Select
        hasMore
        label="Município"
        loadedMessage={(count) => `${count} loaded`}
        loadingMoreMessage="Loading more"
        onLoadMore={onLoadMore}
        options={registros(3)}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Município' }));
    expect(screen.getByText('Loading more')).toBeInTheDocument();

    rerender(
      <Select
        hasMore={false}
        label="Município"
        loadedMessage={(count) => `${count} loaded`}
        loadingMoreMessage="Loading more"
        onLoadMore={onLoadMore}
        options={registros(6)}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('6 loaded');
  });

  it('acima de 200 opções desenha só as visíveis, com a posição no total', () => {
    simularLayout();
    render(<Select label="Município" options={registros(5000)} />);

    fireEvent.click(screen.getByRole('combobox', { name: 'Município' }));

    const opcoes = screen.getAllByRole('option');
    expect(opcoes.length).toBeLessThan(40);
    expect(opcoes[0]).toHaveAttribute('aria-setsize', '5000');
    expect(opcoes[0]).toHaveAttribute('aria-posinset', '1');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
