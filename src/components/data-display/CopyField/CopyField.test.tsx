import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyField } from './CopyField';

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return writeText;
}

describe('CopyField', () => {
  it('shows the label and the value, grouped under the label', () => {
    render(<CopyField label="client_id" value="ipe-am" />);

    expect(screen.getByRole('group', { name: 'client_id' })).toHaveTextContent('ipe-am');
  });

  it('copies, says "Copiado" and announces it as status', async () => {
    const writeText = mockClipboard();
    const onCopy = vi.fn();
    render(<CopyField label="Link da loja" onCopy={onCopy} value="https://ipe.plenusdelivery.com.br" />);

    await userEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(writeText).toHaveBeenCalledWith('https://ipe.plenusdelivery.com.br');
    expect(onCopy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Copiado' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Link da loja copiado');
  });

  it('goes back to "Copiar" after a few seconds', async () => {
    vi.useFakeTimers();
    mockClipboard();
    render(<CopyField label="client_id" value="ipe-am" />);

    await act(async () => screen.getByRole('button', { name: 'Copiar' }).click());
    expect(screen.getByRole('button', { name: 'Copiado' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('hides a masked value from the DOM but still copies it whole', async () => {
    const writeText = mockClipboard();
    const { container } = render(<CopyField label="client_secret" masked value="plt_8f2kQ9xLm4" />);

    expect(container).not.toHaveTextContent('plt_8f2kQ9xLm4');
    expect(screen.getByText('Valor oculto')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copiar' }));
    expect(writeText).toHaveBeenCalledWith('plt_8f2kQ9xLm4');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    expect(container).toHaveTextContent('plt_8f2kQ9xLm4');
    expect(screen.getByRole('button', { name: 'Ocultar' })).toBeInTheDocument();
  });
});
