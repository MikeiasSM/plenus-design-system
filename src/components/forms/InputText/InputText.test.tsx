import { render, screen } from '@testing-library/react';
import { InputText } from './InputText';

describe('InputText', () => {
  it('associates its label with the input', () => {
    render(<InputText id="email" label="E-mail" />);

    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute('id', 'email');
  });

  it('sets required semantics and renders the required indicator', () => {
    render(<InputText id="name" label="Nome" required />);

    expect(screen.getByRole('textbox', { name: 'Nome' })).toBeRequired();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes hint text through aria-describedby', () => {
    render(<InputText id="amount" label="Valor" hint="Informe o valor em reais." />);

    const input = screen.getByRole('textbox', { name: 'Valor' });
    const hint = screen.getByText('Informe o valor em reais.');

    expect(input).toHaveAttribute('aria-describedby', hint.id);
  });

  it('marks errors accessibly', () => {
    render(<InputText id="email" label="E-mail" error="E-mail invalido." />);

    const input = screen.getByRole('textbox', { name: 'E-mail' });
    const message = screen.getByText('E-mail invalido.');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', message.id);
  });

  it('supports the compact size and native input props', () => {
    render(<InputText label="Busca" size="sm" placeholder="Pesquisar" type="search" />);

    const input = screen.getByRole('searchbox', { name: 'Busca' });
    expect(input).toHaveAttribute('placeholder', 'Pesquisar');
    expect(input.className).toContain('sm');
  });

  it('counts characters and describes the limit accessibly', () => {
    render(
      <InputText
        id="description"
        label="Descrição"
        defaultValue="Inicial"
        maxLength={20}
        showCharacterCount
      />,
    );

    const input = screen.getByRole('textbox', { name: 'Descrição' });
    const count = screen.getByText('7/20');

    expect(count).not.toHaveAttribute('aria-live');
    expect(input).toHaveAttribute('aria-describedby', count.id);
  });

  it('updates the character count for controlled values', () => {
    const { rerender } = render(
      <InputText id="controlled" label="Controlado" value="abc" onChange={() => undefined} maxLength={10} showCharacterCount />,
    );

    expect(screen.getByText('3/10')).toBeInTheDocument();

    rerender(
      <InputText id="controlled" label="Controlado" value="abcdef" onChange={() => undefined} maxLength={10} showCharacterCount />,
    );

    expect(screen.getByText('6/10')).toBeInTheDocument();
  });
});
