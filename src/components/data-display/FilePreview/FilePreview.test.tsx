import { fireEvent, render, screen } from '@testing-library/react';
import { FileUpload } from '../../forms/FileUpload';
import { FilePreview } from './FilePreview';
import styles from './FilePreview.module.css';

describe('FilePreview', () => {
  it('is decorative by default and shows the image', () => {
    const { container } = render(<FilePreview src="/logo.png" />);

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('img')).toHaveAttribute('src', '/logo.png');
  });

  it('has a name when alt is given', () => {
    render(<FilePreview alt="Logo da loja" src="/logo.png" />);

    expect(screen.getByRole('img', { name: 'Logo da loja' })).toBeInTheDocument();
  });

  it('falls back to the icon without an image or when the image fails', () => {
    const { container, rerender } = render(<FilePreview src={null} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).not.toBeNull();

    rerender(<FilePreview src="/quebrada.png" />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
  });

  it('marks a video poster with play, and a plain file never shows the image', () => {
    const { container, rerender } = render(<FilePreview kind="video" src="/poster.jpg" />);
    expect(container.querySelector(`.${styles.play}`)).not.toBeNull();

    rerender(<FilePreview kind="file" src="/doc.pdf" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows the state on the border and in an icon, and the progress while uploading', () => {
    const { container, rerender } = render(<FilePreview progress={62} src="/logo.png" status="uploading" />);
    expect(container.firstChild).toHaveClass(styles.uploading!);
    expect((container.firstChild as HTMLElement).style.getPropertyValue('--file-preview-progress')).toBe('62%');

    rerender(<FilePreview src="/logo.png" status="uploading" />);
    expect(container.querySelector(`.${styles.indeterminate}`)).not.toBeNull();

    rerender(<FilePreview src="/logo.png" status="error" />);
    expect(container.firstChild).toHaveClass(styles.error!);
    expect(container.querySelector(`.${styles.stateError}`)).not.toBeNull();
  });

  it('shows the badge', () => {
    render(<FilePreview badge="PDF" kind="file" />);

    expect(screen.getByText('PDF', { selector: `.${styles.badge}` })).toBeInTheDocument();
  });
});

describe('FileUpload with preview', () => {
  it('puts the preview in place of the file icon, without a second name', () => {
    const { container } = render(
      <FileUpload
        items={[{ id: '1', name: 'logo-ipe.png', preview: { src: '/logo-ipe.png' }, size: 84000, status: 'done' }]}
        label="Logo"
        onFilesSelected={() => {}}
      />,
    );

    expect(container.querySelector('li img')).toHaveAttribute('src', '/logo-ipe.png');
    expect(screen.queryByRole('img', { name: /logo-ipe/ })).toBeNull();
  });
});
