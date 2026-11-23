import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';
import styles from './Avatar.module.css';

describe('Avatar', () => {
  it('renders initials when no image is provided', () => {
    render(<Avatar name="Maria Costa" />);

    expect(screen.getByRole('img', { name: 'Maria Costa' })).toHaveTextContent('MC');
  });

  it('renders an image with the accessible name', () => {
    render(<Avatar name="Joao Silva" src="/avatar.jpg" size="lg" />);

    const avatar = screen.getByRole('img', { name: 'Joao Silva' });
    expect(avatar).toHaveAttribute('src', '/avatar.jpg');
    expect(avatar.className).toContain('_lg_');
  });

  it('falls back to initials when the image fails', () => {
    render(<Avatar name="Ana Lima" src="/missing.jpg" />);

    fireEvent.error(screen.getByRole('img', { name: 'Ana Lima' }));

    expect(screen.getByRole('img', { name: 'Ana Lima' })).toHaveTextContent('AL');
  });

  it('supports a single-word name', () => {
    render(<Avatar name="Plenustech" />);

    expect(screen.getByRole('img', { name: 'Plenustech' })).toHaveTextContent('P');
  });

  it('poe o fundo so nas iniciais, e na foto o contorno sutil', () => {
    const { rerender } = render(<Avatar name="Ana Lima" />);
    expect(screen.getByRole('img', { name: 'Ana Lima' })).toHaveClass(styles.initials!);
    expect(screen.getByRole('img', { name: 'Ana Lima' })).not.toHaveClass(styles.photo!);

    rerender(<Avatar name="Ana Lima" src="/ana.jpg" />);
    expect(screen.getByRole('img', { name: 'Ana Lima' })).toHaveClass(styles.photo!);
    expect(screen.getByRole('img', { name: 'Ana Lima' })).not.toHaveClass(styles.initials!);
  });

  it('decorativo, sai da arvore de acessibilidade na foto e nas iniciais', () => {
    const { container, rerender } = render(<Avatar decorative name="Ana Lima" src="/ana.jpg" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');

    rerender(<Avatar decorative name="Ana Lima" />);
    const iniciais = container.firstElementChild!;
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(iniciais).toHaveAttribute('aria-hidden', 'true');
    expect(iniciais).not.toHaveAttribute('aria-label');
    expect(iniciais).toHaveTextContent('AL');
  });

  it('usa as iniciais pedidas no lugar das do nome, mantendo o nome acessivel', () => {
    render(<Avatar initials="PX" name="Projeto Exemplo Comercial" />);

    expect(screen.getByRole('img', { name: 'Projeto Exemplo Comercial' })).toHaveTextContent('PX');
  });

  it('aceita o tamanho xs', () => {
    render(<Avatar name="Ana Lima" size="xs" />);

    expect(screen.getByRole('img', { name: 'Ana Lima' })).toHaveClass(styles.xs!);
  });

  it('le as variaveis de aparencia com o valor do sistema de reserva, sem declara-las na raiz', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/data-display/Avatar/Avatar.module.css'), 'utf8');

    expect(css).toContain('var(--pl-avatar-bg, var(--pl-color-primary-container))');
    expect(css).toContain('var(--pl-avatar-fg, var(--pl-color-on-primary-container))');
    expect(css).not.toMatch(/--pl-avatar-(bg|fg)\s*:/);
  });
});
