import { act, fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from '../../overlays/Dialog';
import { ToastProvider, useToast } from './ToastProvider';
import { ToastRegion } from './ToastRegion';
import { dismissToast, globalToastStore, showToast, type ToastOptions } from './toastStore';

const shown: string[] = [];

function show(options: ToastOptions) {
  act(() => {
    shown.push(showToast(options));
  });
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => shown.splice(0).forEach(dismissToast));
    vi.useRealTimers();
  });

  it('anuncia o sucesso como status e some sozinho em 6s', () => {
    render(<ToastRegion />);
    show({ description: 'As alteracoes ja estao no ar.', title: 'Versao publicada', tone: 'success' });

    expect(screen.getByRole('status')).toHaveTextContent('Versao publicada');

    act(() => vi.advanceTimersByTime(6000));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('mantem o erro como alerta ate a pessoa fechar', () => {
    render(<ToastRegion />);
    show({ title: 'Falha ao salvar', tone: 'danger' });

    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar');

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('a acao roda e fecha o aviso', () => {
    const onClick = vi.fn();
    render(<ToastRegion />);
    show({ action: { label: 'Tentar de novo', onClick }, title: 'Falha ao salvar', tone: 'danger' });

    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mostra as acoes na ordem dada e aciona a escolhida', () => {
    const desfazer = vi.fn();
    const verDetalhes = vi.fn();
    render(<ToastRegion />);
    show({
      actions: [
        { label: 'Desfazer', onClick: desfazer },
        { label: 'Ver detalhes', onClick: verDetalhes },
      ],
      title: 'Registro removido',
    });

    expect(screen.getAllByRole('button').map((botao) => botao.textContent)).toEqual([
      'Desfazer',
      'Ver detalhes',
      '',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }));

    expect(verDetalhes).toHaveBeenCalledOnce();
    expect(desfazer).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('descarta a partir da terceira acao', () => {
    render(<ToastRegion />);
    show({
      actions: ['Uma', 'Duas', 'Tres'].map((label) => ({ label, onClick: vi.fn() })),
      title: 'Aviso',
    });

    expect(screen.queryByRole('button', { name: 'Tres' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duas' })).toBeInTheDocument();
  });

  it('para o tempo com o ponteiro em cima e recomeca ao sair', () => {
    render(<ToastRegion />);
    show({ title: 'Copiado' });

    fireEvent.mouseEnter(screen.getByRole('status'));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('status')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole('status'));
    act(() => vi.advanceTimersByTime(6000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('mostra no maximo tres, os mais recentes', () => {
    render(<ToastRegion />);
    ['Um', 'Dois', 'Tres', 'Quatro'].forEach((title) => show({ duration: null, title }));

    const titles = screen.getAllByRole('status').map((toast) => toast.querySelector('strong')?.textContent);
    expect(titles).toEqual(['Dois', 'Tres', 'Quatro']);
  });
});

function Disparador({ title }: { title: string }) {
  const { showToast: show } = useToast();

  return <button onClick={() => show({ title })} type="button">{`Avisar ${title}`}</button>;
}

describe('ToastProvider', () => {
  afterEach(() => {
    act(() => shown.splice(0).forEach(dismissToast));
  });

  it('cada provider mostra so os avisos da propria arvore', () => {
    render(
      <>
        <ToastProvider>
          <Disparador title="Primeiro" />
          <ToastRegion aria-label="primeira" />
        </ToastProvider>
        <ToastProvider>
          <Disparador title="Segundo" />
          <ToastRegion aria-label="segunda" />
        </ToastProvider>
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Avisar Primeiro' }));

    expect(screen.getByLabelText('primeira')).toHaveTextContent('Primeiro');
    expect(screen.getByLabelText('segunda')).toBeEmptyDOMElement();
  });

  it('o estado global do showToast nao chega ao provider', () => {
    render(
      <ToastProvider>
        <ToastRegion aria-label="regiao" />
      </ToastProvider>,
    );

    show({ duration: null, title: 'Global' });

    expect(screen.getByLabelText('regiao')).toBeEmptyDOMElement();
  });

  it('fora de um provider o hook age no estado global', () => {
    render(
      <>
        <Disparador title="Solto" />
        <ToastRegion aria-label="regiao" />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Avisar Solto' }));

    expect(screen.getByLabelText('regiao')).toHaveTextContent('Solto');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));
    expect(screen.getByLabelText('regiao')).toBeEmptyDOMElement();
  });

  it('o canto vai ao destino do portal quando ele e escolhido', () => {
    const destino = document.createElement('div');
    document.body.append(destino);
    render(<ToastRegion aria-label="regiao" portalContainer={destino} />);

    expect(destino).toContainElement(screen.getByLabelText('regiao'));
    destino.remove();
  });

  it('devolve o foco a quem o tinha antes do aviso quando o ultimo aviso sai', () => {
    render(
      <>
        <button type="button">Excluir</button>
        <ToastRegion />
      </>,
    );
    const origem = screen.getByRole('button', { name: 'Excluir' });
    act(() => origem.focus());
    show({ action: { label: 'Desfazer', onClick: () => undefined }, title: 'Registro removido' });

    act(() => screen.getByRole('button', { name: 'Desfazer' }).focus());
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }));

    expect(origem).toHaveFocus();
  });

  it('sem origem valida nao prende o foco na regiao vazia', () => {
    render(
      <>
        <button type="button">Excluir</button>
        <ToastRegion aria-label="regiao" />
      </>,
    );
    const origem = screen.getByRole('button', { name: 'Excluir' });
    act(() => origem.focus());
    show({ title: 'Registro removido' });
    act(() => screen.getByRole('button', { name: 'Fechar aviso' }).focus());
    (origem as HTMLButtonElement).disabled = true;

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));

    expect(screen.getByLabelText('regiao')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('regiao')).not.toHaveFocus();
  });

  it('com outro aviso o foco vai ao proximo, e nao a origem', () => {
    render(
      <>
        <button type="button">Excluir</button>
        <ToastRegion />
      </>,
    );
    act(() => screen.getByRole('button', { name: 'Excluir' }).focus());
    show({ duration: null, title: 'Primeiro' });
    show({ duration: null, title: 'Segundo' });
    const [fecharPrimeiro, fecharSegundo] = screen.getAllByRole('button', { name: 'Fechar aviso' });
    act(() => fecharPrimeiro.focus());

    fireEvent.click(fecharPrimeiro);

    expect(fecharSegundo).toHaveFocus();
  });
});

describe('ToastRegion com Dialog aberto', () => {
  afterEach(() => {
    act(() => shown.splice(0).forEach(dismissToast));
  });

  // O `ariaHideOutside` do Dialog esconde o que entra depois dele num MutationObserver, que roda em microtarefa.
  async function abrirComAviso(onOpenChange = vi.fn()) {
    render(
      <>
        <Dialog onOpenChange={onOpenChange} open title="Cadastro">
          <button type="button">Salvar</button>
        </Dialog>
        <ToastRegion aria-label="regiao" />
      </>,
    );
    show({ duration: null, title: 'Registro salvo' });
    await act(async () => undefined);
    return onOpenChange;
  }

  it('declara-se camada de cima, e o canto fica visivel ao leitor de tela', async () => {
    await abrirComAviso();

    const regiao = screen.getByLabelText('regiao');

    expect(regiao).toHaveAttribute('data-react-aria-top-layer', 'true');
    expect(regiao.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('o botao Fechar do aviso recebe o foco, que o Dialog nao puxa de volta', async () => {
    await abrirComAviso();

    // `hidden`: confere o foco por si, independente do teste do leitor de tela acima.
    const fechar = screen.getByRole('button', { hidden: true, name: 'Fechar aviso' });
    act(() => fechar.focus());

    expect(fechar).toHaveFocus();
  });

  it('clicar no aviso nao fecha o Dialog dispensavel', async () => {
    const onOpenChange = await abrirComAviso();
    const aviso = screen.getByRole('status', { hidden: true });

    fireEvent.pointerDown(aviso);
    fireEvent.mouseDown(aviso);
    fireEvent.pointerUp(aviso);
    fireEvent.mouseUp(aviso);
    fireEvent.click(aviso);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Cadastro' })).toBeInTheDocument();
  });
});

describe('showToast.promise', () => {
  afterEach(() => {
    act(() => globalToastStore.getSnapshot().forEach((toast) => dismissToast(toast.id)));
  });

  function adiada<T>() {
    let resolver!: (valor: T) => void;
    let rejeitar!: (motivo: unknown) => void;
    const promessa = new Promise<T>((ok, falha) => {
      resolver = ok;
      rejeitar = falha;
    });

    return { promessa, rejeitar, resolver };
  }

  it('carrega sem anunciar e troca o mesmo aviso pelo sucesso, que se anuncia', async () => {
    const { promessa, resolver } = adiada<number>();
    render(<ToastRegion />);
    act(() => {
      showToast.promise(promessa, { error: 'Falhou', loading: 'Salvando', success: (total) => `${total} itens salvos` });
    });

    const carregando = screen.getByText('Salvando');
    expect(carregando.closest('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);

    await act(async () => resolver(3));

    expect(screen.getByRole('status')).toHaveTextContent('3 itens salvos');
    expect(screen.queryByText('Salvando')).not.toBeInTheDocument();
    expect(document.querySelector('[aria-busy]')).toBeNull();
  });

  it('o erro vira alerta com o motivo e fica, e a promessa volta como veio', async () => {
    const { promessa, rejeitar } = adiada<void>();
    render(<ToastRegion />);
    let devolvida!: Promise<void>;
    act(() => {
      devolvida = showToast.promise(promessa, {
        error: (motivo) => ({ description: String((motivo as Error).message), title: 'Falha ao salvar' }),
        loading: { description: 'Pode levar alguns segundos.', title: 'Salvando' },
        success: 'Salvo',
      });
    });

    expect(devolvida).toBe(promessa);

    await act(async () => {
      rejeitar(new Error('Sem conexao'));
      await devolvida.catch(() => undefined);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao salvar');
    expect(screen.getByRole('alert')).toHaveTextContent('Sem conexao');
  });

  it('mantem o foco no fechar durante a troca', async () => {
    const { promessa, resolver } = adiada<void>();
    render(<ToastRegion />);
    act(() => {
      showToast.promise(promessa, { error: 'Falhou', loading: 'Salvando', success: 'Salvo' });
    });

    const fechar = screen.getByRole('button', { name: 'Fechar aviso' });
    act(() => fechar.focus());
    await act(async () => resolver());

    expect(screen.getByRole('status')).toHaveTextContent('Salvo');
    expect(document.activeElement).toBe(fechar);
  });

  it('fechado no carregando, nao volta quando a promessa termina', async () => {
    const { promessa, resolver } = adiada<void>();
    render(<ToastRegion />);
    act(() => {
      showToast.promise(() => promessa, { error: 'Falhou', loading: 'Salvando', success: 'Salvo' });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }));
    await act(async () => resolver());

    expect(screen.queryByText('Salvo')).not.toBeInTheDocument();
  });

  it('o sucesso some no tempo de sempre, contado da troca', async () => {
    vi.useFakeTimers();
    const { promessa, resolver } = adiada<void>();
    render(<ToastRegion />);
    act(() => {
      showToast.promise(promessa, { error: 'Falhou', loading: 'Salvando', success: 'Salvo' });
    });

    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByText('Salvando')).toBeInTheDocument();

    await act(async () => resolver());
    act(() => vi.advanceTimersByTime(5999));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('o useToast acompanha a promessa no estado da propria arvore', async () => {
    const { promessa, resolver } = adiada<void>();

    function Salvar() {
      const { promiseToast } = useToast();

      return (
        <button onClick={() => promiseToast(promessa, { error: 'Falhou', loading: 'Salvando', success: 'Salvo' })} type="button">
          Salvar
        </button>
      );
    }

    render(
      <ToastProvider>
        <Salvar />
        <ToastRegion />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText('Salvando')).toBeInTheDocument();

    await act(async () => resolver());
    expect(screen.getByRole('status')).toHaveTextContent('Salvo');
  });
});
