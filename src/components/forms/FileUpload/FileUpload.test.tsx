import { fireEvent, render, screen } from '@testing-library/react';
import { FileUpload, type FileUploadItem } from './FileUpload';
import styles from './FileUpload.module.css';

const MB = 1024 ** 2;

function arquivo(nome: string, tipo: string, tamanho = 1024) {
  const file = new File(['x'], nome, { type: tipo });
  Object.defineProperty(file, 'size', { value: tamanho });
  return file;
}

function zona(container: HTMLElement) {
  return container.querySelector(`.${styles.zone}`)!;
}

describe('FileUpload', () => {
  it('nomeia o seletor nativo pelo rotulo e o descreve pelos tipos, o limite e a ajuda', () => {
    render(<FileUpload accept=".pdf,image/*" hint="Um arquivo por vez." label="Anexo" maxSize={5 * MB} onFilesSelected={vi.fn()} />);

    const seletor = screen.getByLabelText('Anexo');

    expect(seletor).toHaveAttribute('type', 'file');
    expect(seletor).toHaveAttribute('accept', '.pdf,image/*');
    expect(seletor).toHaveAccessibleDescription('PDF ou imagem, até 5 MB Um arquivo por vez.');
  });

  it('deixa o botao de escolher fora da tabulacao e o liga ao seletor nativo', () => {
    render(<FileUpload label="Anexo" onFilesSelected={vi.fn()} />);

    const seletor = screen.getByLabelText('Anexo');
    const abrir = vi.spyOn(seletor, 'click');
    const escolher = screen.getByText('escolha do computador');

    expect(screen.queryByRole('button', { name: 'escolha do computador' })).toBeNull();
    expect(escolher).toHaveAttribute('tabindex', '-1');

    fireEvent.click(escolher);

    expect(abrir).toHaveBeenCalled();
    expect(seletor).toHaveFocus();
  });

  it('entrega so os aceitos e anuncia o motivo da recusa no erro do campo', () => {
    const onFilesSelected = vi.fn();
    const onFilesRejected = vi.fn();
    render(
      <FileUpload
        accept=".pdf,image/*"
        label="Anexo"
        maxSize={5 * MB}
        multiple
        onFilesRejected={onFilesRejected}
        onFilesSelected={onFilesSelected}
      />,
    );

    const aceito = arquivo('contrato.pdf', 'application/pdf');
    const grande = arquivo('foto.png', 'image/png', 6 * MB);
    const planilha = arquivo('custos.xlsx', 'application/vnd.ms-excel');
    fireEvent.change(screen.getByLabelText('Anexo'), { target: { files: [aceito, grande, planilha] } });

    expect(onFilesSelected).toHaveBeenCalledWith([aceito]);
    expect(onFilesRejected).toHaveBeenCalledWith([
      { file: grande, reason: 'size' },
      { file: planilha, reason: 'type' },
    ]);
    expect(screen.getByRole('alert')).toHaveTextContent('foto.png passa de 5 MB. custos.xlsx não é PDF ou imagem.');
    expect(screen.getByLabelText('Anexo')).toHaveAttribute('aria-invalid', 'true');
  });

  it('diz o motivo sem nome quando veio um arquivo so, e limpa o erro na escolha seguinte', () => {
    render(<FileUpload label="Anexo" maxSize={5 * MB} onFilesSelected={vi.fn()} />);
    const seletor = screen.getByLabelText('Anexo');

    fireEvent.change(seletor, { target: { files: [arquivo('video.mp4', 'video/mp4', 8 * MB)] } });

    expect(screen.getByRole('alert')).toHaveTextContent('O arquivo passa de 5 MB.');

    fireEvent.change(seletor, { target: { files: [arquivo('nota.txt', 'text/plain')] } });

    expect(screen.queryByRole('alert')).toBeNull();
    expect(seletor).not.toHaveAttribute('aria-invalid');
  });

  it('o erro do produto vence a mensagem de recusa', () => {
    render(<FileUpload accept="image/*" error="Envie a capa do documento." label="Capa" onFilesSelected={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Capa'), { target: { files: [arquivo('a.pdf', 'application/pdf')] } });

    expect(screen.getByRole('alert')).toHaveTextContent('Envie a capa do documento.');
  });

  it('recebe o arquivo arrastado e marca a zona enquanto ele passa por cima', () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload label="Anexo" onFilesSelected={onFilesSelected} />);
    const primeiro = arquivo('a.pdf', 'application/pdf');

    fireEvent.dragEnter(zona(container), { dataTransfer: { files: [], dropEffect: 'none' } });

    expect(zona(container)).toHaveClass(styles.dragging);

    fireEvent.drop(zona(container), { dataTransfer: { files: [primeiro, arquivo('b.pdf', 'application/pdf')] } });

    expect(zona(container)).not.toHaveClass(styles.dragging);
    expect(onFilesSelected).toHaveBeenCalledWith([primeiro]);
  });

  it('desabilitado, ignora o que for solto e desabilita o seletor', () => {
    const onFilesSelected = vi.fn();
    const { container } = render(<FileUpload disabled label="Anexo" onFilesSelected={onFilesSelected} />);

    fireEvent.drop(zona(container), { dataTransfer: { files: [arquivo('a.pdf', 'application/pdf')] } });

    expect(onFilesSelected).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Anexo')).toBeDisabled();
  });

  it('mostra cada envio com tamanho, progresso e a acao do seu estado', () => {
    const onCancel = vi.fn();
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    const items: FileUploadItem[] = [
      { id: '1', name: 'relatorio.pdf', progress: 40, size: 24.6 * MB, status: 'uploading' },
      { id: '2', name: 'capa.png', size: 512 * 1024, status: 'done' },
      { error: 'A conexão caiu.', id: '3', name: 'video.mp4', size: 3 * MB, status: 'error' },
    ];
    render(
      <FileUpload items={items} label="Anexo" onCancel={onCancel} onFilesSelected={vi.fn()} onRemove={onRemove} onRetry={onRetry} />,
    );

    expect(screen.getByText('24,6 MB')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Enviando relatorio.pdf' })).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('A conexão caiu.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remover relatorio.pdf' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar envio de relatorio.pdf' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remover capa.png' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo: video.mp4' }));

    expect(onCancel).toHaveBeenCalledWith('1');
    expect(onRemove).toHaveBeenCalledWith('2');
    expect(onRetry).toHaveBeenCalledWith('3');
  });

  it('anuncia a mudanca de estado de cada envio', () => {
    const item: FileUploadItem = { id: '1', name: 'a.pdf', progress: 90, size: MB, status: 'uploading' };
    const { rerender } = render(<FileUpload items={[item]} label="Anexo" onFilesSelected={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Enviando');

    rerender(<FileUpload items={[{ ...item, status: 'done' }]} label="Anexo" onFilesSelected={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Enviado');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
