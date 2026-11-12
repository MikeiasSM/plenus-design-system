import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Tag } from './data-display/Tag';
import { ToastRegion } from './feedback/Toast';
import { dismissToast, showToast } from './feedback/Toast/toastStore';
import { FileUpload } from './forms/FileUpload';

function Etiquetas({ inicial }: { inicial: string[] }) {
  const [itens, setItens] = useState(inicial);

  return (
    <div data-testid="grupo">
      {itens.map((item) => (
        <Tag key={item} onRemove={() => setItens((atuais) => atuais.filter((atual) => atual !== item))}>
          {item}
        </Tag>
      ))}
    </div>
  );
}

function Anexos({ inicial }: { inicial: string[] }) {
  const [itens, setItens] = useState(inicial);

  return (
    <FileUpload
      items={itens.map((nome) => ({ id: nome, name: nome, size: 1, status: 'done' as const }))}
      label="Anexo"
      onFilesSelected={vi.fn()}
      onRemove={(id) => setItens((atuais) => atuais.filter((atual) => atual !== id))}
    />
  );
}

function remover(nome: string) {
  const botao = screen.getByRole('button', { name: `Remover ${nome}` });
  act(() => botao.focus());
  fireEvent.click(botao);
}

describe('o foco depois de remover nunca cai no body', () => {
  it('Tag: vai ao X da etiqueta seguinte', () => {
    render(<Etiquetas inicial={['a', 'b', 'c']} />);

    remover('b');

    expect(screen.getByRole('button', { name: 'Remover c' })).toHaveFocus();
  });

  it('Tag: sem seguinte, vai ao X da anterior', () => {
    render(<Etiquetas inicial={['a', 'b']} />);

    remover('b');

    expect(screen.getByRole('button', { name: 'Remover a' })).toHaveFocus();
  });

  it('Tag: sem nenhuma outra, vai ao contêiner', () => {
    render(<Etiquetas inicial={['a']} />);

    remover('a');

    expect(screen.getByTestId('grupo')).toHaveFocus();
  });

  it('Tag: quem não tinha o foco no X, como o toque no Safari, não o recebe', () => {
    render(<Etiquetas inicial={['a', 'b']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remover a' }));

    expect(document.body).toHaveFocus();
  });

  it('FileUpload: vai à lixeira do arquivo seguinte, depois à anterior e por fim ao campo', () => {
    render(<Anexos inicial={['a.pdf', 'b.pdf', 'c.pdf']} />);

    remover('b.pdf');
    expect(screen.getByRole('button', { name: 'Remover c.pdf' })).toHaveFocus();

    remover('c.pdf');
    expect(screen.getByRole('button', { name: 'Remover a.pdf' })).toHaveFocus();

    remover('a.pdf');
    expect(screen.getByLabelText('Anexo')).toHaveFocus();
  });

  it('Toast: depois da ação, o foco vai ao aviso seguinte', () => {
    const ids: string[] = [];
    render(<ToastRegion />);
    act(() => {
      ids.push(showToast({ action: { label: 'Desfazer', onClick: vi.fn() }, duration: null, title: 'Um' }));
      ids.push(showToast({ action: { label: 'Desfazer', onClick: vi.fn() }, duration: null, title: 'Dois' }));
    });
    const [primeiro, segundo] = screen.getAllByRole('button', { name: 'Desfazer' });
    act(() => primeiro.focus());

    fireEvent.click(primeiro);

    expect(segundo).toHaveFocus();
    act(() => ids.forEach(dismissToast));
  });
});
