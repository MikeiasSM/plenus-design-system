import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';
import { AvatarItem } from './AvatarItem';

describe('AvatarItem', () => {
  it('rende o avatar, o titulo e a descricao', () => {
    render(<AvatarItem avatar={<Avatar name="Ana Prado" size="sm" />} description="Aprovadora" title="Ana Prado" />);

    expect(screen.getByText('AP')).toBeInTheDocument();
    expect(screen.getByText('Aprovadora')).toBeInTheDocument();
    expect(screen.getByText('Ana Prado')).toBeInTheDocument();
  });

  it('poe o Avatar decorativo, porque o titulo ja mostra o nome', () => {
    const { container } = render(<AvatarItem avatar={<Avatar name="Ana Prado" src="/ana.jpg" />} title="Ana Prado" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.firstElementChild).toHaveTextContent(/^Ana Prado$/);
  });

  it('mantem o Avatar nomeado quando ele pede decorative={false}', () => {
    render(<AvatarItem avatar={<Avatar decorative={false} name="Ana Prado" />} title="Responsavel" />);

    expect(screen.getByRole('img', { name: 'Ana Prado' })).toBeInTheDocument();
  });

  it('omite a descricao quando nao e informada', () => {
    render(<AvatarItem avatar={<Avatar name="Ana Prado" />} title="Maria" />);

    expect(screen.getByText('Maria').parentElement?.children).toHaveLength(1);
  });

  it('encaminha ref, className e propriedades nativas na raiz', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <AvatarItem avatar={<Avatar name="Ana" />} className="meu-item" data-teste="item" ref={ref} title="Ana" />,
    );

    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('meu-item');
    expect(ref.current).toHaveAttribute('data-teste', 'item');
    expect(ref.current).not.toHaveAttribute('title');
  });
});
