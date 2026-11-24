import { useLayoutEffect } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyField } from './CopyField';

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return writeText;
}

function recusarCopia() {
  const writeText = vi.fn().mockRejectedValue(new DOMException('negado', 'NotAllowedError'));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  return writeText;
}

function removerClipboard() {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
}

describe('CopyField', () => {
  afterEach(() => {
    vi.useRealTimers();
    removerClipboard();
  });

  it('mostra o rótulo e o valor, agrupados sob o rótulo', () => {
    render(<CopyField label="client_id" value="loja-exemplo" />);

    expect(screen.getByRole('group', { name: 'client_id' })).toHaveTextContent('loja-exemplo');
  });

  it('copia, diz "Copiado" e anuncia como status', async () => {
    const writeText = mockClipboard();
    const onCopy = vi.fn();
    render(<CopyField label="Link da loja" onCopy={onCopy} value="https://exemplo.com/loja" />);

    await userEvent.click(screen.getByRole('button', { name: 'Copiar Link da loja' }));

    expect(writeText).toHaveBeenCalledWith('https://exemplo.com/loja');
    expect(onCopy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Copiado Link da loja' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Link da loja copiado');
  });

  it('dá a cada botão de copiar o rótulo do seu campo', () => {
    render(
      <>
        <CopyField label="client_id" value="loja-exemplo" />
        <CopyField label="client_secret" masked value="chave_exemplo_123" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Copiar client_id' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar client_secret' })).toBeInTheDocument();
  });

  it('volta a "Copiar" depois de alguns segundos', async () => {
    vi.useFakeTimers();
    mockClipboard();
    render(<CopyField label="client_id" value="loja-exemplo" />);

    await act(async () => screen.getByRole('button', { name: 'Copiar client_id' }).click());
    expect(screen.getByRole('button', { name: 'Copiado client_id' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('button', { name: 'Copiar client_id' })).toBeInTheDocument();
  });

  it('recomeça o tempo e anuncia de novo quando copia outra vez antes do fim', async () => {
    vi.useFakeTimers();
    mockClipboard();
    render(<CopyField label="client_id" value="loja-exemplo" />);

    await act(async () => screen.getByRole('button', { name: 'Copiar client_id' }).click());
    const primeiroAviso = screen.getByRole('status').firstElementChild;

    act(() => vi.advanceTimersByTime(1500));
    await act(async () => screen.getByRole('button', { name: 'Copiado client_id' }).click());

    // O texto é o mesmo, mas o nó é novo: a região de status volta a anunciar.
    expect(screen.getByRole('status').firstElementChild).not.toBe(primeiroAviso);
    expect(screen.getByRole('status')).toHaveTextContent('client_id copiado');

    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole('button', { name: 'Copiado client_id' })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('button', { name: 'Copiar client_id' })).toBeInTheDocument();
  });

  it('anuncia a falha e seleciona o valor quando o navegador recusa a cópia', async () => {
    recusarCopia();
    const onCopy = vi.fn();
    render(<CopyField label="client_id" onCopy={onCopy} value="loja-exemplo" />);

    await userEvent.click(screen.getByRole('button', { name: 'Copiar client_id' }));

    expect(onCopy).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Não foi possível copiar. O valor ficou selecionado');
    expect(window.getSelection()?.toString()).toBe('loja-exemplo');
    // O aviso também fica à vista, para quem não usa leitor de tela.
    expect(screen.getAllByText(/Não foi possível copiar/)).toHaveLength(2);
  });

  it('anuncia a falha quando a página não tem a Clipboard API', async () => {
    removerClipboard();
    render(<CopyField label="client_id" value="loja-exemplo" />);

    await userEvent.click(screen.getByRole('button', { name: 'Copiar client_id' }));

    expect(screen.getByRole('status')).toHaveTextContent('Não foi possível copiar');
    expect(screen.getByRole('button', { name: 'Copiar client_id' })).toBeInTheDocument();
  });

  it('com o valor oculto, anuncia a falha sem selecionar nem expor o valor', async () => {
    recusarCopia();
    const { container } = render(<CopyField label="client_secret" masked value="chave_exemplo_123" />);

    await userEvent.click(screen.getByRole('button', { name: 'Copiar client_secret' }));

    expect(screen.getByRole('status')).toHaveTextContent('Não foi possível copiar.');
    expect(screen.getByRole('status')).not.toHaveTextContent('selecionado');
    expect(container).not.toHaveTextContent('chave_exemplo_123');
  });

  it('oculta do DOM o valor mascarado, mas copia o valor inteiro', async () => {
    const writeText = mockClipboard();
    const { container } = render(<CopyField label="client_secret" masked value="chave_exemplo_123" />);

    expect(container).not.toHaveTextContent('chave_exemplo_123');
    expect(screen.getByText('Valor oculto')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copiar client_secret' }));
    expect(writeText).toHaveBeenCalledWith('chave_exemplo_123');

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    expect(container).toHaveTextContent('chave_exemplo_123');
    expect(screen.getByRole('button', { name: 'Ocultar' })).toBeInTheDocument();
  });

  it('esconde o valor com a mesma quantidade de pontos, qualquer que seja o tamanho', () => {
    const { container, rerender } = render(<CopyField label="client_secret" masked value="abc" />);
    const pontos = () => container.querySelector('[aria-hidden="true"]')?.textContent;
    const curto = pontos();

    rerender(<CopyField label="client_secret" masked value={'x'.repeat(40)} />);

    expect(curto).toMatch(/^•+$/);
    expect(pontos()).toBe(curto);
  });

  it('um valor novo nasce oculto já no primeiro quadro, mesmo depois de revelar o anterior', async () => {
    const quadros: string[] = [];

    function Sonda() {
      // Roda no mesmo commit do CopyField, antes dos efeitos passivos: vê o que a tela pintaria.
      useLayoutEffect(() => {
        quadros.push(document.body.textContent ?? '');
      });

      return null;
    }

    const { rerender } = render(
      <>
        <CopyField label="client_secret" masked value="chave_exemplo_123" />
        <Sonda />
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }));
    rerender(
      <>
        <CopyField label="client_secret" masked value="chave_exemplo_456" />
        <Sonda />
      </>,
    );

    expect(quadros.some((quadro) => quadro.includes('chave_exemplo_456'))).toBe(false);
    expect(screen.getByRole('button', { name: 'Mostrar' })).toBeInTheDocument();
  });

  it('troca os textos por labels', () => {
    render(<CopyField label="Token" labels={{ copy: 'Copy', hiddenValue: 'Hidden value', show: 'Show' }} masked value="chave_exemplo_123" />);

    expect(screen.getByRole('button', { name: 'Copy Token' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument();
    expect(screen.getByText('Hidden value')).toBeInTheDocument();
  });
});
