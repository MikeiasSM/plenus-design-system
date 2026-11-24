import { createRef } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

describe('ButtonIcon: dica, descricao e motivo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function abrirDicaPeloTeclado(botao: HTMLElement) {
    vi.useFakeTimers();
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Tab' });
      botao.focus();
      vi.advanceTimersByTime(1000);
    });
  }

  it('a dica que repete o label nao vira descricao: o nome e anunciado uma vez', () => {
    render(<ButtonIcon icon={<IconClose />} label="Fechar" />);
    const botao = screen.getByRole('button', { name: 'Fechar' });

    abrirDicaPeloTeclado(botao);

    expect(screen.getByRole('tooltip')).toHaveTextContent('Fechar');
    expect(botao).not.toHaveAttribute('aria-describedby');
    expect(botao).toHaveAccessibleDescription('');
  });

  it('mantem o aria-describedby do consumidor com a dica aberta', () => {
    render(
      <>
        <p id="atalho">Atalho Esc</p>
        <ButtonIcon aria-describedby="atalho" icon={<IconClose />} label="Fechar" />
      </>,
    );
    const botao = screen.getByRole('button', { name: 'Fechar' });

    abrirDicaPeloTeclado(botao);

    expect(botao).toHaveAttribute('aria-describedby', 'atalho');
    expect(botao).toHaveAccessibleDescription('Atalho Esc');
  });

  it('desabilitado com motivo, fica focavel, a dica mostra label e motivo, e so o motivo descreve', () => {
    const onClick = vi.fn();
    render(<ButtonIcon disabled disabledReason="Sem permissao" icon={<IconClose />} label="Excluir" onClick={onClick} />);
    const botao = screen.getByRole('button', { name: 'Excluir' });

    expect(botao).not.toBeDisabled();
    expect(botao).toHaveAttribute('aria-disabled', 'true');
    abrirDicaPeloTeclado(botao);

    expect(botao).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Excluir — Sem permissao');
    expect(botao).toHaveAccessibleDescription('Sem permissao');
    expect(fireEvent.keyDown(botao, { key: 'Enter' })).toBe(false);
    fireEvent.click(botao);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('ButtonIcon: tamanho xs e contagem', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/components/actions/ButtonIcon/ButtonIcon.module.css'), 'utf8').replace(/\r\n/g, '\n');

  it('xs e um quadrado de 24px com icone de 14px, que cresce com o dedo como os demais', () => {
    render(<ButtonIcon icon={<IconClose />} label="Remover" size="xs" />);

    const botao = screen.getByRole('button', { name: 'Remover' });
    expect(botao).toHaveClass(styles.buttonIcon!, styles.xs!);
    expect(css).toMatch(/\.buttonIcon\.xs \{\s*padding: 4px;\s*border-radius: var\(--pl-radius-sm\);\s*font-size: 0\.875rem;/);
    expect(css).toMatch(/@media \(pointer: coarse\) \{\s*\.buttonIcon\.xs \{\s*padding: calc\(\(var\(--pl-control-height-sm\) - 0\.875rem - 2px\) \/ 2\);/);
  });

  it('mostra o selo fora da leitura, e o nome passa a dizer a contagem', () => {
    const { container } = render(<ButtonIcon count={3} icon={<IconClose />} label="Notificacoes" />);

    const botao = screen.getByRole('button', { name: 'Notificacoes, 3' });
    const selo = container.querySelector(`.${styles.count}`);
    expect(selo).toHaveTextContent('3');
    expect(selo).toHaveAttribute('aria-hidden', 'true');
    expect(botao).toHaveClass(styles.counted!);
  });

  it('aceita o nome da contagem do produto e mostra 99+ acima de 99', () => {
    const { container } = render(
      <ButtonIcon count={120} countLabel={(n) => `${n} notificacoes nao lidas`} icon={<IconClose />} label="Notificacoes" />,
    );

    expect(screen.getByRole('button', { name: '120 notificacoes nao lidas' })).toBeInTheDocument();
    expect(container.querySelector(`.${styles.count}`)).toHaveTextContent('99+');
  });

  it('sem contagem ou com zero, nao ha selo e o nome e o label', () => {
    const { container } = render(
      <>
        <ButtonIcon count={0} icon={<IconClose />} label="Um" />
        <ButtonIcon icon={<IconClose />} label="Dois" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Um' })).not.toHaveClass(styles.counted!);
    expect(screen.getByRole('button', { name: 'Dois' })).toBeInTheDocument();
    expect(container.querySelector(`.${styles.count}`)).toBeNull();
  });
});
