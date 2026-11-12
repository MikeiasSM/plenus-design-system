import { act, fireEvent, render, screen } from '@testing-library/react';
import { SaveBar, type SaveBarProps } from './SaveBar';

function barra(props: Partial<SaveBarProps> = {}) {
  const onDiscard = vi.fn();
  const onSave = vi.fn();
  const resultado = render(<SaveBar onDiscard={onDiscard} onSave={onSave} open {...props} />);

  return { ...resultado, onDiscard, onSave };
}

describe('SaveBar', () => {
  it('chama descartar e salvar', () => {
    const { onDiscard, onSave } = barra();

    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('anuncia a mensagem quando abre, e nao quando fecha', () => {
    const { rerender } = barra({ open: false });

    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    rerender(<SaveBar onDiscard={vi.fn()} onSave={vi.fn()} open />);
    expect(screen.getByRole('status')).toHaveTextContent('Alterações não salvas');

    rerender(<SaveBar onDiscard={vi.fn()} onSave={vi.fn()} open={false} />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('tira os botoes do foco e da leitura enquanto fechada', () => {
    const { rerender } = barra({ open: false });

    expect(screen.getByRole('region', { hidden: true })).toHaveAttribute('inert');

    rerender(<SaveBar onDiscard={vi.fn()} onSave={vi.fn()} open />);
    expect(screen.getByRole('region', { name: 'Alterações não salvas' })).not.toHaveAttribute('inert');
  });

  it('usa os textos do produto', () => {
    barra({ discardLabel: 'Desfazer', message: 'Há mudanças pendentes', saveLabel: 'Gravar' });

    expect(screen.getByRole('region', { name: 'Há mudanças pendentes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desfazer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gravar' })).toBeInTheDocument();
  });

  it('prende-se ao topo por padrao e ao pe com placement bottom', () => {
    const { container, rerender } = barra();

    expect(container.firstElementChild).toHaveAttribute('data-placement', 'top');

    rerender(<SaveBar onDiscard={vi.fn()} onSave={vi.fn()} open placement="bottom" />);
    expect(container.firstElementChild).toHaveAttribute('data-placement', 'bottom');
  });

  it('enquanto salva, ocupa o salvar, desabilita o descartar e nao salva de novo', () => {
    const { onSave } = barra({ saving: true });

    expect(screen.getByRole('button', { name: 'Descartar' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('aria-busy', 'true');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('com um onSave assíncrono, trava o Salvar sozinho até a promessa terminar', async () => {
    let resolver!: () => void;
    const onSave = vi.fn(() => new Promise<void>((resolve) => (resolver = resolve)));
    barra({ onSave });
    const salvar = screen.getByRole('button', { name: 'Salvar' });

    fireEvent.click(salvar);
    fireEvent.click(salvar);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(salvar).toHaveAttribute('aria-busy', 'true');

    await act(async () => resolver());
    expect(salvar).not.toHaveAttribute('aria-busy');
  });
});
