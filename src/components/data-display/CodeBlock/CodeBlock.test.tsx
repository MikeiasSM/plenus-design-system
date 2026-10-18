import { act, createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { CodeBlock } from './CodeBlock';
import styles from './CodeBlock.module.css';

const trecho = 'public class Main {\n  int x;\n}';

describe('CodeBlock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('copia o codigo inteiro e anuncia a copia ao leitor de tela', async () => {
    const escrever = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText: escrever } });
    render(<CodeBlock code={trecho} />);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copiar' })));

    expect(escrever).toHaveBeenCalledWith(trecho);
    expect(screen.getByRole('button', { name: 'Copiado' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Código copiado');
  });

  it('volta ao rotulo de copiar depois do aviso', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<CodeBlock code={trecho} />);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copiar' })));
    act(() => vi.advanceTimersByTime(2000));

    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('mostra o arquivo e a linguagem no cabecalho', () => {
    const { container } = render(<CodeBlock code={trecho} copyable={false} fileName="Main.java" language="Java" />);

    expect(container.getElementsByClassName(styles.header!)).toHaveLength(1);
    expect(screen.getByText('Main.java')).toBeInTheDocument();
    expect(screen.getByText('Java')).toBeInTheDocument();
  });

  it('dispensa o cabecalho quando nao ha o que mostrar nele', () => {
    const { container } = render(<CodeBlock code={trecho} copyable={false} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.getElementsByClassName(styles.header!)).toHaveLength(0);
  });

  it('o codigo que rola de lado recebe foco, e o que quebra a linha nao precisa', () => {
    const { container, rerender } = render(<CodeBlock code={trecho} />);

    expect(container.querySelector('pre')).toHaveAttribute('tabindex', '0');

    rerender(<CodeBlock code={trecho} wrap />);

    expect(container.querySelector('pre')).not.toHaveAttribute('tabindex');
  });

  it('marca as linhas destacadas, contadas a partir de 1', () => {
    const { container } = render(<CodeBlock code={trecho} highlightedLines={[2]} />);

    const marcadas = container.querySelectorAll('mark');
    expect(marcadas).toHaveLength(1);
    expect(marcadas[0]).toHaveTextContent('int x;');
  });

  it('mantem uma linha por linha do codigo, inclusive a vazia', () => {
    const { container } = render(<CodeBlock code={'a\n\nb'} lineNumbers />);

    expect(container.querySelectorAll('code > *')).toHaveLength(3);
    expect(container.querySelector('pre')).toHaveClass(styles.numbered!);
  });

  it('leva as propriedades nativas, o className e a ref ao elemento de fora', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<CodeBlock className="largo" code={trecho} data-origem="manual" ref={ref} />);

    expect(container.firstElementChild).toBe(ref.current);
    expect(ref.current).toHaveClass('largo');
    expect(ref.current).toHaveAttribute('data-origem', 'manual');
  });
});
