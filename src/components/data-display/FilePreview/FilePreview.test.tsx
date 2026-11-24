import { fireEvent, render, screen } from '@testing-library/react';
import { FileUpload } from '../../forms/FileUpload';
import { FilePreview } from './FilePreview';
import styles from './FilePreview.module.css';

describe('FilePreview', () => {
  it('e decorativo por padrao e mostra a imagem', () => {
    const { container } = render(<FilePreview src="/logo.png" />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('img')).toHaveAttribute('src', '/logo.png');
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

  it('marca o poster do video com o play, e o arquivo comum nunca mostra a imagem', () => {
    const { container, rerender } = render(<FilePreview kind="video" src="/poster.jpg" />);
    expect(container.querySelector(`.${styles.play}`)).not.toBeNull();

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

  it('mostra o selo', () => {
    render(<FilePreview badge="PDF" kind="file" />);

    expect(screen.getByText('PDF', { selector: `.${styles.badge}` })).toBeInTheDocument();
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
});
