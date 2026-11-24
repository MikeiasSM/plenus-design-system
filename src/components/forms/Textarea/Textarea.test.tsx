import { fireEvent, render, screen } from '@testing-library/react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a multiline control associated with its label', () => {
    render(<Textarea id="notes" label="Observacoes" />);

    const textarea = screen.getByRole('textbox', { name: 'Observacoes' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('id', 'notes');
  });

  it('marks errors accessibly through the shared field', () => {
    render(<Textarea label="Observacoes" error="Campo obrigatorio." />);

    const textarea = screen.getByRole('textbox', { name: 'Observacoes' });
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription('Campo obrigatorio.');
  });

  it('counts characters as the user types', () => {
    render(<Textarea label="Observacoes" maxLength={120} showCharacterCount />);

    const textarea = screen.getByRole('textbox', { name: 'Observacoes' });
    fireEvent.change(textarea, { target: { value: 'Alinhamento' } });

    expect(screen.getByText('11/120')).toBeInTheDocument();
  });

  it('exposes the requested number of rows', () => {
    render(<Textarea label="Observacoes" rows={8} />);

    expect(screen.getByRole('textbox', { name: 'Observacoes' })).toHaveAttribute('rows', '8');
  });
  it('reports the text through onValueChange alongside the native onChange', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<Textarea label="Observação" onChange={onChange} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByLabelText('Observação'), { target: { value: 'Entregar cedo' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('Entregar cedo');
  });

  it('repassa o complemento do rotulo e o aside ao Field, fora do nome e da descricao', () => {
    render(
      <Textarea
        aside={<button type="button">Sugerir texto</button>}
        hint="Aparece no resumo."
        label="Observacao"
        labelAddon={<span>Opcional</span>}
      />,
    );

    const campo = screen.getByRole('textbox', { name: 'Observacao' });

    expect(campo).toHaveAccessibleDescription('Aparece no resumo.');
    expect(screen.getByText('Opcional').closest('label')).toBeNull();
    expect(screen.getByRole('button', { name: 'Sugerir texto' })).toBeInTheDocument();
  });
});
