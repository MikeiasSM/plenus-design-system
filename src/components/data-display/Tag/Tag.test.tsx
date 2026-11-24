import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tag } from './Tag';
import styles from './Tag.module.css';

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

  it('marca a raiz com data-selected e data-disabled', () => {
    const { container, rerender } = render(<Tag onSelectedChange={vi.fn()}>Editor</Tag>);
    const raiz = container.firstElementChild!;
    expect(raiz).not.toHaveAttribute('data-selected');
    expect(raiz).not.toHaveAttribute('data-disabled');

    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    expect(raiz).toHaveAttribute('data-selected');

    rerender(<Tag disabled>Editor</Tag>);
    expect(container.firstElementChild).toHaveAttribute('data-disabled');
    expect(container.firstElementChild).not.toHaveAttribute('data-selected');
  });

  it('a aparencia filled troca a classe da raiz; outline e o padrao', () => {
    const { container, rerender } = render(<Tag>Ativo</Tag>);
    expect(container.firstElementChild).not.toHaveClass(styles.filled!);

    rerender(<Tag appearance="filled">Ativo</Tag>);
    expect(container.firstElementChild).toHaveClass(styles.filled!);
  });

  it('nomeia o botao de remover com o removeLabel antes do texto', () => {
    render(
      <Tag onRemove={vi.fn()} removeLabel="Tirar filtro">
        Perfil: editor
      </Tag>,
    );

    expect(screen.getByRole('button', { name: 'Tirar filtro Perfil: editor' })).toBeInTheDocument();
  });

  it('com conteudo rico, o nome do botao de remover vem do texto desenhado', () => {
    render(
      <Tag onRemove={vi.fn()}>
        <strong>Perfil</strong>: editor
      </Tag>,
    );

    expect(screen.getByRole('button', { name: /^Remover Perfil ?: editor$/ })).toBeInTheDocument();
  });

  it('a area de clique do alternar cobre a pilula, com o botao de remover acima dela', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Tag/Tag.module.css'), 'utf8');
    const regra = (seletor: string) =>
      css
        .split('}')
        .map((bloco) => bloco.split('{'))
        .find(([cabeca]) => cabeca.replace(/\/\*[\s\S]*?\*\//g, '').trim() === seletor)?.[1] ?? '';

    expect(regra('.tag')).toMatch(/position: relative/);
    expect(regra('.toggle::after')).toMatch(/position: absolute/);
    expect(regra('.toggle::after')).toMatch(/inset: 0/);
    expect(regra('.remove')).toMatch(/position: relative/);
    expect(regra('.remove')).toMatch(/z-index: 1/);
  });

  it('le as variaveis de aparencia com o valor do sistema de reserva, sem declara-las', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Tag/Tag.module.css'), 'utf8');

    expect(css).toContain('var(--pl-tag-radius, var(--pl-radius-sm))');
    expect(css).toContain('var(--pl-tag-bg, var(--pl-color-surface))');
    expect(css).toContain('var(--pl-tag-shadow, none)');
    expect(css).not.toMatch(/--pl-tag-[a-z]+\s*:/);
  });
});
