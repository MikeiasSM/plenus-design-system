import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IconClose } from '../../icons';
import { ButtonIcon } from './ButtonIcon';
import styles from './ButtonIcon.module.css';

describe('ButtonIcon', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('tem o nome do label, e o icone fica fora da leitura', () => {
    const { container } = render(<ButtonIcon icon={<IconClose />} label="Fechar" />);

    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('mostra o label como dica a quem chega pelo teclado', () => {
    vi.useFakeTimers();
    render(<ButtonIcon icon={<IconClose />} label="Fechar" />);

    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      screen.getByRole('button', { name: 'Fechar' }).focus();
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('tooltip')).toHaveTextContent('Fechar');
  });

  it('aciona a operacao no clique', () => {
    const onClick = vi.fn();
    render(<ButtonIcon icon={<IconClose />} label="Fechar" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('e quadrado no tamanho pedido e leva propriedades nativas, className e ref ao botao', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<ButtonIcon className="extra" data-origem="barra" icon={<IconClose />} label="Fechar" ref={ref} size="sm" />);

    const botao = screen.getByRole('button', { name: 'Fechar' });
    expect(botao).toBe(ref.current);
    expect(botao).toHaveClass(styles.buttonIcon!, styles.sm!, 'extra');
    expect(botao).toHaveAttribute('data-origem', 'barra');
  });

  it('com href vira link com o label como nome, o icone fora da leitura e a ref no elemento', () => {
    const ref = createRef<HTMLAnchorElement>();
    const { container } = render(<ButtonIcon href="/ajuda" icon={<IconClose />} label="Ajuda" ref={ref} />);

    const link = screen.getByRole('link', { name: 'Ajuda' });
    expect(link).toHaveAttribute('href', '/ajuda');
    expect(link).toBe(ref.current);
    expect(link).toHaveClass(styles.buttonIcon!);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('como link, aceita as e linkProps e desabilitado perde o destino', () => {
    render(
      <>
        <ButtonIcon as="a" icon={<IconClose />} label="Um" linkProps={{ href: '/um', 'data-rota': '/um' }} />
        <ButtonIcon disabled href="/dois" icon={<IconClose />} label="Dois" />
      </>,
    );

    expect(screen.getByRole('link', { name: 'Um' })).toHaveAttribute('data-rota', '/um');
    expect(screen.getByRole('link', { name: 'Dois' })).not.toHaveAttribute('href');
    expect(screen.getByRole('link', { name: 'Dois' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('cancela o Enter repetido, e o onClick que devolve uma Promise não trava o botão', () => {
    const onClick = vi.fn(() => new Promise<void>(() => {}));
    render(<ButtonIcon icon={<IconClose />} label="Excluir" onClick={onClick} />);
    const botao = screen.getByRole('button', { name: 'Excluir' });

    expect(fireEvent.keyDown(botao, { key: 'Enter', repeat: true })).toBe(false);
    fireEvent.click(botao);
    fireEvent.click(botao);

    expect(onClick).toHaveBeenCalledTimes(2);
    expect(botao).not.toHaveAttribute('aria-busy');
  });
});
