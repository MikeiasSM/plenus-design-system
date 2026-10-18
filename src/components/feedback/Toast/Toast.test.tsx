import { act, fireEvent, render, screen } from '@testing-library/react';
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
