import { render, screen } from '@testing-library/react';
import { IconCalendar, IconChevronDown, IconClose } from './icons';

describe('icones', () => {
  it('fica fora da arvore de acessibilidade quando e decorativo', () => {
    const { container } = render(<IconChevronDown />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
  });

  it('ganha nome acessivel quando carrega significado sozinho', () => {
    render(<IconClose label="Fechar" />);
    const svg = screen.getByRole('img', { name: 'Fechar' });

    expect(svg).not.toHaveAttribute('aria-hidden');
  });

  it('acompanha o tamanho do texto ao redor quando nao se declara medida', () => {
    const { container } = render(<IconCalendar />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('width', '1em');
    expect(svg).toHaveAttribute('height', '1em');
  });

  it('aceita medida declarada', () => {
    const { container } = render(<IconCalendar size={20} />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '20');
  });

  it('herda a cor do texto, para nao fixar cor no proprio icone', () => {
    const { container } = render(<IconChevronDown />);

    expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
  });

  it('sai da ordem de tabulacao, que pertence ao controle e nao ao icone', () => {
    const { container } = render(<IconChevronDown />);

    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false');
  });

  it('aceita classe do consumidor, para o controle girar ou colorir o icone', () => {
    const { container } = render(<IconChevronDown className="girado" />);

    expect(container.querySelector('svg')).toHaveClass('girado');
  });
});
