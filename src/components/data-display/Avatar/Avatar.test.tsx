import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

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
});
