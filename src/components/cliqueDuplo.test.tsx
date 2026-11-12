import { act, fireEvent, render, screen } from '@testing-library/react';
import { Tag } from './data-display/Tag';
import { ToastRegion } from './feedback/Toast';
import { dismissToast, showToast } from './feedback/Toast/toastStore';
import { FileUpload } from './forms/FileUpload';
import { Button } from './actions/Button';
import { Menu } from './overlays/Menu';

describe('o segundo clique de um clique duplo é ignorado', () => {
  it('Toast: o clique duplo em "Desfazer" desfaz só um aviso', () => {
    const ids: string[] = [];
    const desfazerUm = vi.fn();
    const desfazerDois = vi.fn();
    render(<ToastRegion />);
    act(() => {
      ids.push(showToast({ action: { label: 'Desfazer', onClick: desfazerUm }, duration: null, title: 'Um' }));
      ids.push(showToast({ action: { label: 'Desfazer', onClick: desfazerDois }, duration: null, title: 'Dois' }));
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Desfazer' })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }), { detail: 2 });

    expect(desfazerDois).toHaveBeenCalledTimes(1);
    expect(desfazerUm).not.toHaveBeenCalled();
    act(() => ids.forEach(dismissToast));
  });

  it('Tag: o clique duplo no X remove só uma etiqueta', () => {
    const onRemove = vi.fn();
    render(
      <>
        <Tag onRemove={onRemove}>abc</Tag>
        <Tag onRemove={onRemove}>abd</Tag>
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remover abc' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Remover abd' }), { detail: 2 });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('FileUpload: o clique duplo na lixeira remove só um arquivo', () => {
    const onRemove = vi.fn();
    render(
      <FileUpload
        items={[
          { id: 'a', name: 'a.pdf', size: 1, status: 'done' },
          { id: 'b', name: 'b.pdf', size: 1, status: 'done' },
        ]}
        label="Anexo"
        onFilesSelected={vi.fn()}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remover a.pdf' }), { detail: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Remover b.pdf' }), { detail: 2 });

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('Menu: o segundo clique do clique duplo num item não roda outro item', () => {
    const duplicar = vi.fn();
    render(
      <Menu items={[{ key: 'duplicar', label: 'Duplicar', onSelect: duplicar }]} label="Ações">
        <Button>Ações</Button>
      </Menu>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ações' }));

    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicar' }), { detail: 2 });

    expect(duplicar).not.toHaveBeenCalled();
  });
});
