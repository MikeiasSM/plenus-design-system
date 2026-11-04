import { act, fireEvent, render, screen } from '@testing-library/react';
import { IconSearch } from '../../icons';
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

  it('restores the character count after the form is reset', () => {
    render(
      <form>
        <InputText id="reset" label="Observação" defaultValue="Inicial" maxLength={20} showCharacterCount />
      </form>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Observação' }), { target: { value: 'Texto alterado' } });
    expect(screen.getByText('14/20')).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Observação' }) as HTMLInputElement;
    act(() => input.form!.reset());

    expect(input).toHaveValue('Inicial');
    expect(screen.getByText('7/20')).toBeInTheDocument();
  });

  it('conta na mesma medida do limite do navegador', () => {
    render(
      <InputText id="emoji" label="Apelido" defaultValue="oi 😀" maxLength={10} showCharacterCount />,
    );

    // 'oi ' e o emoji, que ocupa duas unidades UTF-16, exatamente como maxLength conta.
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('shows a decorative icon ahead of the text, keeping the label as the name', () => {
    const { container } = render(<InputText icon={<IconSearch />} label="Buscar" type="search" />);

    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toBeInTheDocument();
    expect(container.querySelector('svg')!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('offers the large size, with the icon following it', () => {
    render(<InputText icon={<IconSearch />} label="Buscar" size="lg" type="search" />);
    const input = screen.getByRole('searchbox', { name: 'Buscar' });

    expect(input.className).toContain('lg');
    expect(input.parentElement!.className).toContain('lg');
  });
  it('reports the text through onValueChange alongside the native onChange', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<InputText label="Cliente" onChange={onChange} onValueChange={onValueChange} />);

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Aurora' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('Aurora');
  });
});

describe('InputText com mask', () => {
  const CPF = '000.000.000-00';

  function edit(input: HTMLInputElement, text: string, caret: number, inputType = 'insertText') {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;

    act(() => {
      setValue.call(input, text);
      input.setSelectionRange(caret, caret);
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType }));
    });
  }

  it('formata ao digitar e entrega o texto formatado e o cru', () => {
    const onValueChange = vi.fn();
    const onRawValueChange = vi.fn();
    render(<InputText label="CPF" mask={CPF} onRawValueChange={onRawValueChange} onValueChange={onValueChange} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'CPF' });

    edit(input, '1234', 4);

    expect(input).toHaveValue('123.4');
    expect(onValueChange).toHaveBeenLastCalledWith('123.4');
    expect(onRawValueChange).toHaveBeenLastCalledWith('1234');
    expect(input.selectionStart).toBe(5);
  });

  it('cola texto cru ou formatado', () => {
    render(<InputText label="CPF" mask={CPF} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'CPF' });

    edit(input, '12345678909', 11, 'insertFromPaste');
    expect(input).toHaveValue('123.456.789-09');

    edit(input, '987.654.321-00', 14, 'insertFromPaste');
    expect(input).toHaveValue('987.654.321-00');
  });

  it('mantem o cursor ao digitar no meio', () => {
    render(<InputText defaultValue="123.456.789-09" label="CPF" mask={CPF} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'CPF' });

    edit(input, '1923.456.789-09', 2);

    expect(input).toHaveValue('192.345.678-90');
    expect(input.selectionStart).toBe(2);
  });

  it('apaga no meio sem pular para o fim', () => {
    render(<InputText defaultValue="123.456.789-09" label="CPF" mask={CPF} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'CPF' });

    edit(input, '123.46.789-09', 5, 'deleteContentBackward');

    expect(input).toHaveValue('123.467.890-9');
    expect(input.selectionStart).toBe(5);
  });

  it('apagar sobre o separador recua o cursor e Delete avanca sobre ele', () => {
    render(<InputText defaultValue="123.456" label="CPF" mask={CPF} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'CPF' });

    edit(input, '123456', 3, 'deleteContentBackward');
    expect(input).toHaveValue('123.456');
    expect(input.selectionStart).toBe(3);

    edit(input, '123456', 3, 'deleteContentForward');
    expect(input).toHaveValue('123.456');
    expect(input.selectionStart).toBe(4);
  });

  it('formata o valor controlado que chega cru', () => {
    render(<InputText label="CPF" mask={CPF} onChange={() => undefined} value="12345678909" />);

    expect(screen.getByRole('textbox', { name: 'CPF' })).toHaveValue('123.456.789-09');
  });

  it('aceita uma funcao de formatacao', () => {
    const onRawValueChange = vi.fn();
    render(<InputText label="Placa" mask={(text) => text.toUpperCase()} onRawValueChange={onRawValueChange} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Placa' });

    edit(input, 'abc1', 4);

    expect(input).toHaveValue('ABC1');
    expect(onRawValueChange).toHaveBeenLastCalledWith('ABC1');
  });

  it('sem mask deixa o texto como esta e nao avisa o cru', () => {
    const onRawValueChange = vi.fn();
    render(<InputText label="Nome" onRawValueChange={onRawValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Nome' });

    fireEvent.change(input, { target: { value: 'Ana-1' } });

    expect(input).toHaveValue('Ana-1');
    expect(onRawValueChange).not.toHaveBeenCalled();
  });
});
