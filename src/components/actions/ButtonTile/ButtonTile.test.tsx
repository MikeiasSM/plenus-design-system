import { createRef } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

describe('ButtonTile hideLabel', () => {
  it('esconde o rotulo, que segue como nome e aparece na dica, e mantem aria-pressed', () => {
    const { container } = render(<ButtonTile hideLabel icon={<IconFile />} label="Arquivo" selected />);
    const ladrilho = screen.getByRole('button', { name: 'Arquivo', pressed: true });

    expect(container.querySelector(`.${styles.label}`)).toBeNull();
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      ladrilho.focus();
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Arquivo');
    expect(ladrilho).not.toHaveAttribute('aria-describedby');
  });

  it('com descricao, a dica mostra rotulo e descricao, e so a descricao descreve', () => {
    render(
      <>
        <p id="atalho">Atalho A</p>
        <ButtonTile aria-describedby="atalho" description="Anexa um arquivo" hideLabel icon={<IconFile />} label="Arquivo" />
      </>,
    );
    const ladrilho = screen.getByRole('button', { name: 'Arquivo' });

    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      ladrilho.focus();
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Arquivo — Anexa um arquivo');
    expect(ladrilho).toHaveAccessibleDescription('Atalho A Anexa um arquivo');
  });

  it('continua alternando e leva a ref ao botao', () => {
    const ref = createRef<HTMLButtonElement>();
    const onSelectedChange = vi.fn();
    render(<ButtonTile defaultSelected={false} hideLabel icon={<IconFile />} label="Arquivo" onSelectedChange={onSelectedChange} ref={ref} />);
    const ladrilho = screen.getByRole('button', { name: 'Arquivo', pressed: false });

    fireEvent.click(ladrilho);

    expect(ladrilho).toBe(ref.current);
    expect(ladrilho).toHaveAttribute('aria-pressed', 'true');
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('o rotulo visivel hifeniza a palavra que nao cabe', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/actions/ButtonTile/ButtonTile.module.css'), 'utf8');
    const inicio = css.indexOf('.label {');

    expect(css.slice(inicio, css.indexOf('}', inicio))).toContain('hyphens: auto;');
  });
});
