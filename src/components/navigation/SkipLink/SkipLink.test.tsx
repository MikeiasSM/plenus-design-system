import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('e um link para a ancora do conteudo, com o texto padrao', () => {
    render(<SkipLink href="#conteudo" />);

    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo');
  });

  it('leva o foco ao alvo, que ganha tabindex -1, e rola ate ele', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(
      <>
        <SkipLink href="#conteudo" />
        <main id="conteudo">Conteúdo</main>
      </>,
    );

    const link = screen.getByRole('link');
    const notPrevented = fireEvent.click(link);
    const main = screen.getByRole('main');

    expect(notPrevented).toBe(false);
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it('mantem o tabindex que o alvo ja tem', () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(
      <>
        <SkipLink href="#conteudo" />
        <div id="conteudo" tabIndex={0}>
          Conteúdo
        </div>
      </>,
    );

    fireEvent.click(screen.getByRole('link'));

    expect(screen.getByText('Conteúdo')).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('Conteúdo')).toHaveFocus();
  });

  it('sem alvo na pagina, segue o comportamento nativo', () => {
    render(<SkipLink href="#inexistente" />);

    expect(fireEvent.click(screen.getByRole('link'))).toBe(true);
  });

  it('encadeia o onClick do consumidor, que pode cancelar a acao', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <>
        <SkipLink href="#conteudo" onClick={onClick} />
        <main id="conteudo">Conteúdo</main>
      </>,
    );

    fireEvent.click(screen.getByRole('link'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('main')).not.toHaveFocus();
    expect(screen.getByRole('main')).not.toHaveAttribute('tabindex');
  });
});
