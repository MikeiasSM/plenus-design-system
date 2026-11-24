import { copyText, selectContents } from './clipboard';

describe('copyText', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('devolve verdadeiro quando a cópia dá certo', async () => {
    const escrever = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText: escrever } });

    await expect(copyText('chave_exemplo_123')).resolves.toBe(true);
    expect(escrever).toHaveBeenCalledWith('chave_exemplo_123');
  });

  it('devolve falso, sem rejeitar, quando o navegador recusa a cópia', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new DOMException('negado', 'NotAllowedError')) } });

    await expect(copyText('chave_exemplo_123')).resolves.toBe(false);
  });

  it('devolve falso quando a página não tem a Clipboard API', async () => {
    vi.stubGlobal('navigator', {});

    await expect(copyText('chave_exemplo_123')).resolves.toBe(false);
  });
});

describe('selectContents', () => {
  it('seleciona o texto do elemento', () => {
    const elemento = document.createElement('code');
    elemento.textContent = 'loja-exemplo';
    document.body.append(elemento);

    selectContents(elemento);

    expect(window.getSelection()?.toString()).toBe('loja-exemplo');
    elemento.remove();
  });
});
