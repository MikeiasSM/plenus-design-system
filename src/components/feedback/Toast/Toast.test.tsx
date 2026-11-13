import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';
import { ToastRegion } from './ToastRegion';
import { dismissToast, showToast, type ToastOptions } from './toastStore';

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
