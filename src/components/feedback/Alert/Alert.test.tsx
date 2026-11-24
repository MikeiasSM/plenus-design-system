import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { Alert } from './Alert';
import styles from './Alert.module.css';

describe('Alert', () => {
  it('announces urgent tones assertively', () => {
    render(<Alert tone="danger" title="Falha no envio">Tente novamente.</Alert>);

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Falha no envio');
    expect(alerta).toHaveTextContent('Tente novamente.');
  });

  it('announces informative tones politely', () => {
    render(<Alert tone="info">Sincronizacao concluida.</Alert>);

    expect(screen.getByRole('status')).toHaveTextContent('Sincronizacao concluida.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('treats warnings as urgent and successes as polite', () => {
    const { rerender } = render(<Alert tone="warning">Espaco quase esgotado.</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<Alert tone="success">Registro salvo.</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('o tom neutro nao entra como regiao viva', () => {
    const { container } = render(<Alert tone="neutral" title="Sobre os prazos">Contam em dias uteis.</Alert>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveAttribute('role');
    expect(container.firstElementChild).toHaveClass(styles.neutral!);
    expect(container.firstElementChild).toHaveTextContent('Sobre os prazosContam em dias uteis.');
  });

  it('o icone e decorativo e false equivale a nao ter icone', () => {
    const { container, rerender } = render(
      <Alert icon={<svg data-testid="icone" />} tone="info">
        Sincronizacao concluida.
      </Alert>,
    );

    expect(screen.getByTestId('icone').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('status')).toHaveAccessibleName('');

    rerender(
      <Alert icon={false} tone="info">
        Sincronizacao concluida.
      </Alert>,
    );
    expect(container.querySelector(`.${styles.icon}`)).toBeNull();
    expect(container.firstElementChild).not.toHaveClass(styles.withSlots!);
  });

  it('mostra a acao junto do texto, dentro da mesma mensagem', () => {
    const onClick = vi.fn();
    render(
      <Alert action={<button onClick={onClick} type="button">Tentar de novo</button>} title="Falha no envio" tone="danger">
        O arquivo nao chegou.
      </Alert>,
    );

    const alerta = screen.getByRole('alert');
    const botao = screen.getByRole('button', { name: 'Tentar de novo' });
    expect(alerta).toContainElement(botao);
    expect(alerta).toHaveClass(styles.withAction!);

    fireEvent.click(botao);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('aceita titulo rico', () => {
    render(
      <Alert title={<>Pedido <code>P-12</code> salvo</>} tone="success">
        Pronto.
      </Alert>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Pedido P-12 salvo');
    expect(screen.getByText('P-12').tagName).toBe('CODE');
  });

  it('sem icone nem acao, mantem a marcacao de antes', () => {
    const { container } = render(<Alert title="Aviso">Texto.</Alert>);

    expect(Array.from(container.firstElementChild!.children).map((filho) => filho.tagName)).toEqual(['STRONG', 'DIV']);
  });

  it('a acao muda de lugar pela largura da propria mensagem, por container query', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/components/feedback/Alert/Alert.module.css'), 'utf8');

    expect(css).toMatch(/container: pl-alert \/ inline-size/);
    expect(css).toMatch(/@container pl-alert \(min-width: 480px\)/);
  });
});
