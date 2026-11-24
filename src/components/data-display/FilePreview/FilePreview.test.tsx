import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { FileUpload } from '../../forms/FileUpload';
import { FilePreview } from './FilePreview';
import styles from './FilePreview.module.css';

afterEach(() => {
  vi.restoreAllMocks();
});

/** O jsdom nao tem URL de objeto: cada chamada devolve um endereco novo, e as revogacoes ficam registradas. */
function espionarUrls() {
  let contador = 0;
  const criar = vi.fn(() => `blob:exemplo/${++contador}`);
  const revogar = vi.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: criar, writable: true });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revogar, writable: true });
  return { criar, revogar };
}

describe('FilePreview', () => {
  it('e decorativo por padrao e mostra a imagem', () => {
    const { container } = render(<FilePreview src="/logo.png" />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    const imagem = container.querySelector('img');
    expect(imagem).toHaveAttribute('src', '/logo.png');
    expect(imagem).toHaveAttribute('decoding', 'async');
    expect(imagem).toHaveAttribute('loading', 'lazy');
  });

  it('tem nome quando recebe alt', () => {
    render(<FilePreview alt="Logo de exemplo" src="/logo.png" />);

    expect(screen.getByRole('img', { name: 'Logo de exemplo' })).toBeInTheDocument();
  });

  it('cai no icone sem imagem ou quando a imagem falha', () => {
    const { container, rerender } = render(<FilePreview src={null} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();

    rerender(<FilePreview src="/quebrada.png" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
  });

  it('volta a tentar a imagem quando o endereco troca depois de uma falha', () => {
    const { container, rerender } = render(<FilePreview src="/quebrada.png" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();

    rerender(<FilePreview src="/outra.png" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/outra.png');

    rerender(<FilePreview src="/quebrada.png" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/quebrada.png');
  });

  it('cai no icone quando a imagem ja tinha falhado antes de montar, como na hidratacao', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      configurable: true,
      value: () => Promise.reject(new Error('quebrada')),
      writable: true,
    });

    try {
      const { container } = render(<FilePreview src="/quebrada.png" />);
      await act(async () => {});

      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('svg')).not.toBeNull();
    } finally {
      delete (HTMLImageElement.prototype as { decode?: unknown }).decode;
    }
  });

  it('mantem a imagem que ja carregou antes de montar', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(120);

    const { container } = render(<FilePreview src="/logo.png" />);
    await act(async () => {});

    expect(container.querySelector('img')).toHaveAttribute('src', '/logo.png');
  });

  it('cria a URL do arquivo ao montar e a revoga ao trocar o arquivo e ao desmontar', () => {
    const { criar, revogar } = espionarUrls();
    const primeiro = new Blob(['a'], { type: 'image/png' });
    const segundo = new Blob(['b'], { type: 'image/png' });

    const { container, rerender, unmount } = render(<FilePreview file={primeiro} progress={10} status="uploading" />);
    expect(criar).toHaveBeenCalledTimes(1);
    expect(criar).toHaveBeenCalledWith(primeiro);
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:exemplo/1');

    rerender(<FilePreview file={primeiro} progress={60} status="uploading" />);
    expect(criar).toHaveBeenCalledTimes(1);
    expect(revogar).not.toHaveBeenCalled();

    rerender(<FilePreview file={segundo} progress={60} status="uploading" />);
    expect(revogar).toHaveBeenCalledWith('blob:exemplo/1');
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:exemplo/2');

    unmount();
    expect(revogar).toHaveBeenCalledWith('blob:exemplo/2');
    expect(revogar).toHaveBeenCalledTimes(2);
  });

  it('revoga a URL quando o arquivo sai, e o file vale sobre o src', () => {
    const { criar, revogar } = espionarUrls();
    const arquivo = new Blob(['a'], { type: 'image/png' });

    const { container, rerender } = render(<FilePreview file={arquivo} src="/ignorado.png" />);
    expect(criar).toHaveBeenCalledTimes(1);
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:exemplo/1');

    rerender(<FilePreview file={null} />);
    expect(revogar).toHaveBeenCalledWith('blob:exemplo/1');
    expect(container.querySelector('img')).toBeNull();
  });

  it('marca o poster do video com o play, e o arquivo comum nunca mostra a imagem', () => {
    const { container, rerender } = render(<FilePreview kind="video" src="/poster.jpg" />);
    expect(container.querySelector(`.${styles.play} .${styles.playDisc} svg`)).not.toBeNull();

    rerender(<FilePreview kind="file" src="/doc.pdf" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('mostra o estado na borda e num icone, e o progresso durante o envio', () => {
    const { container, rerender } = render(<FilePreview progress={62} src="/logo.png" status="uploading" />);
    expect(container.firstChild).toHaveClass(styles.uploading!);
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--file-preview-progress')).toBe('62%');

    rerender(<FilePreview src="/logo.png" status="uploading" />);
    expect(container.querySelector(`.${styles.indeterminate}`)).not.toBeNull();

    rerender(<FilePreview src="/logo.png" status="error" />);
    expect(container.firstChild).toHaveClass(styles.error!);
    expect(container.querySelector(`.${styles.stateError}`)).not.toBeNull();
  });

  it('mantem o icone de estado no sm, para enviado e parado nao se distinguirem so pela cor', () => {
    const { container, rerender } = render(<FilePreview size="sm" src="/logo.png" status="done" />);
    expect(container.querySelector(`.${styles.stateDone} svg`)).not.toBeNull();

    rerender(<FilePreview size="sm" src="/logo.png" status="idle" />);
    expect(container.querySelector(`.${styles.state}`)).toBeNull();
  });

  it('limita o progresso e trata NaN como indeterminado', () => {
    const { container, rerender } = render(<FilePreview progress={140} status="uploading" />);
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--file-preview-progress')).toBe('100%');

    rerender(<FilePreview progress={Number.NaN} status="uploading" />);
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--file-preview-progress')).toBe('');
    expect(container.querySelector(`.${styles.indeterminate}`)).not.toBeNull();
  });

  it('desenha o play num disco de token e marca o erro em cores forcadas', () => {
    const css = readFileSync(resolve(__dirname, 'FilePreview.module.css'), 'utf8');

    expect(css).toMatch(/color-mix\(in srgb, var\(--pl-color-ink\) 80%, transparent\)/);
    expect(css).toMatch(/color: var\(--pl-color-on-ink\)/);
    expect(css).not.toMatch(/rgba\(|--pl-neutral-/);
    expect(css).toMatch(/@media \(forced-colors: active\)[\s\S]*\.error \{\s*border: 3px double CanvasText/);
  });

  it('mostra o selo, inclusive o zero', () => {
    const { rerender } = render(<FilePreview badge="PDF" kind="file" />);
    expect(screen.getByText('PDF', { selector: `.${styles.badge}` })).toBeInTheDocument();

    rerender(<FilePreview badge={0} kind="file" />);
    expect(screen.getByText('0', { selector: `.${styles.badge}` })).toBeInTheDocument();
  });
});

describe('FileUpload com previa', () => {
  it('poe a previa no lugar do icone do arquivo, sem um segundo nome', () => {
    const { container } = render(
      <FileUpload
        items={[{ id: '1', name: 'logo-exemplo.png', preview: { src: '/logo-exemplo.png' }, size: 84000, status: 'done' }]}
        label="Logo"
        onFilesSelected={() => {}}
      />,
    );

    expect(container.querySelector('li img')).toHaveAttribute('src', '/logo-exemplo.png');
    expect(screen.queryByRole('img', { name: /logo-exemplo/ })).toBeNull();
  });

  it('usa o quadro sm na linha e aceita o proprio arquivo, com a URL revogada ao remover o item', () => {
    const { criar, revogar } = espionarUrls();
    const arquivo = new File(['a'], 'foto-exemplo.png', { type: 'image/png' });
    const item = { id: '1', name: 'foto-exemplo.png', preview: { file: arquivo }, progress: 30, size: 1, status: 'uploading' as const };

    const { container, rerender } = render(<FileUpload items={[item]} label="Fotos" onFilesSelected={() => {}} />);
    expect(container.querySelector(`li .${styles.preview}`)).toHaveClass(styles.sm!);
    expect(container.querySelector('li img')).toHaveAttribute('src', 'blob:exemplo/1');

    rerender(<FileUpload items={[{ ...item, progress: 80 }]} label="Fotos" onFilesSelected={() => {}} />);
    expect(criar).toHaveBeenCalledTimes(1);

    rerender(<FileUpload items={[]} label="Fotos" onFilesSelected={() => {}} />);
    expect(revogar).toHaveBeenCalledWith('blob:exemplo/1');
  });
});
