import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IconFile } from '../../icons';
import { ButtonTile } from './ButtonTile';
import styles from './ButtonTile.module.css';

describe('ButtonTile', () => {
  it('tem o nome do rotulo visivel, e o icone fica fora da leitura', () => {
    const { container } = render(<ButtonTile icon={<IconFile />} label="Arquivo" />);

    expect(screen.getByRole('button', { name: 'Arquivo' })).toHaveAttribute('type', 'button');
    expect(container.querySelector('svg')!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('mostra a descricao como dica e a liga ao botao', () => {
    render(<ButtonTile aria-describedby="atalho" description="Anexa um arquivo ao documento" icon={<IconFile />} label="Arquivo" />);
    const ladrilho = screen.getByRole('button', { name: 'Arquivo' });

    act(() => ladrilho.focus());

    expect(screen.getByRole('tooltip')).toHaveTextContent('Anexa um arquivo ao documento');
    expect(ladrilho.getAttribute('aria-describedby')).toBe(`atalho ${screen.getByRole('tooltip').id}`);
  });

  it('so alterna quando recebe selected', () => {
    const { rerender } = render(<ButtonTile icon={<IconFile />} label="Arquivo" />);
    expect(screen.getByRole('button', { name: 'Arquivo' })).not.toHaveAttribute('aria-pressed');

    rerender(<ButtonTile icon={<IconFile />} label="Arquivo" selected={false} />);
    expect(screen.getByRole('button', { name: 'Arquivo', pressed: false })).toBeInTheDocument();

    rerender(<ButtonTile icon={<IconFile />} label="Arquivo" selected />);
    expect(screen.getByRole('button', { name: 'Arquivo', pressed: true })).toBeInTheDocument();
  });

  it('alterna sozinho a partir do defaultSelected e avisa a mudanca', () => {
    const onSelectedChange = vi.fn();
    render(<ButtonTile defaultSelected icon={<IconFile />} label="Arquivo" onSelectedChange={onSelectedChange} />);
    const ladrilho = screen.getByRole('button', { name: 'Arquivo' });

    expect(ladrilho).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(ladrilho);

    expect(ladrilho).toHaveAttribute('aria-pressed', 'false');
    expect(onSelectedChange).toHaveBeenCalledWith(false);
  });

  it('controlado, avisa a mudanca e o onClick, mas so muda quando o produto muda selected', () => {
    const onClick = vi.fn();
    const onSelectedChange = vi.fn();
    render(<ButtonTile icon={<IconFile />} label="Arquivo" onClick={onClick} onSelectedChange={onSelectedChange} selected={false} />);

    fireEvent.click(screen.getByRole('button', { name: 'Arquivo' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Arquivo' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('aciona no clique e, desabilitado, nao', () => {
    const onClick = vi.fn();
    const { rerender } = render(<ButtonTile icon={<IconFile />} label="Arquivo" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Arquivo' }));
    rerender(<ButtonTile disabled icon={<IconFile />} label="Arquivo" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Arquivo' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('leva o tamanho, propriedades nativas, className e ref ao botao, tambem com descricao', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<ButtonTile className="extra" data-bloco="arquivo" description="Anexa" icon={<IconFile />} label="Arquivo" ref={ref} size="sm" />);

    const ladrilho = screen.getByRole('button', { name: 'Arquivo' });
    expect(ladrilho).toBe(ref.current);
    expect(ladrilho).toHaveClass(styles.tile!, styles.sm!, 'extra');
    expect(ladrilho).toHaveAttribute('data-bloco', 'arquivo');
  });
});
