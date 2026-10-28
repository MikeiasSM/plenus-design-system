import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tag } from './Tag';

describe('Tag', () => {
  it('e so texto quando nao alterna nem remove', () => {
    render(<Tag>Ativo</Tag>);

    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('nomeia o botao de remover com o texto da etiqueta e avisa a remocao', () => {
    const onRemove = vi.fn();
    render(
      <>
        <Tag onRemove={onRemove}>Situacao: ativo</Tag>
        <Tag onRemove={vi.fn()}>Perfil: editor</Tag>
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remover Situacao: ativo' }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Remover Perfil: editor' })).toBeInTheDocument();
  });

  it('alterna com aria-pressed quando recebe selected', () => {
    function Filtro() {
      const [selected, setSelected] = useState(false);
      return (
        <Tag onSelectedChange={setSelected} selected={selected}>
          Editor
        </Tag>
      );
    }
    render(<Filtro />);

    const toggle = screen.getByRole('button', { name: 'Editor' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('alterna sozinha a partir do defaultSelected e avisa a mudanca', () => {
    const onSelectedChange = vi.fn();
    render(
      <Tag defaultSelected onSelectedChange={onSelectedChange}>
        Editor
      </Tag>,
    );

    const toggle = screen.getByRole('button', { name: 'Editor' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(onSelectedChange).toHaveBeenCalledWith(false);
  });

  it('so com onSelectedChange ja alterna, comecando desligada', () => {
    render(<Tag onSelectedChange={vi.fn()}>Editor</Tag>);

    expect(screen.getByRole('button', { name: 'Editor' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('controlada, so muda quando o produto muda selected', () => {
    const onSelectedChange = vi.fn();
    render(
      <Tag onSelectedChange={onSelectedChange} selected={false}>
        Editor
      </Tag>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));

    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Editor' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('desabilitada, nao alterna nem remove', () => {
    const onRemove = vi.fn();
    const onSelectedChange = vi.fn();
    render(
      <Tag disabled onRemove={onRemove} onSelectedChange={onSelectedChange} selected={false}>
        Editor
      </Tag>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remover Editor' }));

    expect(onSelectedChange).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
