import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { IconSearch } from '../../icons';
import { InputText } from './InputText';
import styles from './InputText.module.css';
import { regrasDaFolha } from '../../../test/folha';

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

describe('InputText com fenda ao fim', () => {
  it('poe o end dentro do campo, depois da unit, sem esconde-lo do leitor de tela', () => {
    render(<InputText end={<button type="button">Buscar</button>} label="CEP" unit="BR" />);

    const input = screen.getByRole('textbox', { name: 'CEP' });
    const botao = screen.getByRole('button', { name: 'Buscar' });
    const involucro = input.parentElement!;

    expect(involucro).toHaveClass(styles.frame!);
    expect(involucro).toContainElement(botao);
    expect(botao.closest('[aria-hidden="true"]')).toBeNull();
    expect(screen.getByText('BR').compareDocumentPosition(botao) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(input).toHaveAccessibleDescription('BR');
  });

  it('o involucro desenha a borda, o erro e o tamanho; o input fica sem o visual do Field', () => {
    render(<InputText end={<span>fim</span>} error="CEP invalido." label="CEP" size="sm" />);

    const input = screen.getByRole('textbox', { name: 'CEP' });

    expect(input).toHaveClass(styles.inner!);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.parentElement).toHaveClass(styles.frame!, styles.sm!, styles.invalid!);
  });

  it('sem as propriedades novas, o input continua com o visual do Field e sem involucro', () => {
    render(<InputText label="Nome" />);

    const input = screen.getByRole('textbox', { name: 'Nome' });

    expect(input).not.toHaveClass(styles.inner!);
    expect(input.parentElement!.className).not.toContain(styles.frame!);
  });

  it('mantem o icone decorativo no involucro com fenda', () => {
    const { container } = render(<InputText end={<span>fim</span>} icon={<IconSearch />} label="Buscar" type="search" />);

    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveClass(styles.withIcon!);
    expect(container.querySelector('svg')!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('soma a className do consumidor ao input', () => {
    render(<InputText className="meu" clearable label="Nome" />);

    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveClass('meu', styles.inner!);
  });
});

describe('InputText clearable', () => {
  it('so mostra o botao com texto', () => {
    render(<InputText clearable label="Busca" />);

    expect(screen.queryByRole('button', { name: 'Limpar' })).toBeNull();

    fireEvent.change(screen.getByRole('textbox', { name: 'Busca' }), { target: { value: 'ana' } });

    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument();
  });

  it('limpa o campo nao controlado, chama onValueChange e onChange, e devolve o foco', () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<InputText clearable defaultValue="ana" label="Busca" onChange={onChange} onValueChange={onValueChange} />);

    const input = screen.getByRole('textbox', { name: 'Busca' });
    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(input).toHaveValue('');
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Limpar' })).toBeNull();
  });

  it('limpa o campo controlado pelo onValueChange', () => {
    function Controlado() {
      const [texto, setTexto] = useState('ana');

      return <InputText clearable label="Busca" onValueChange={setTexto} value={texto} />;
    }

    render(<Controlado />);
    const input = screen.getByRole('textbox', { name: 'Busca' });

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('aceita outro nome para o botao', () => {
    render(<InputText clearLabel="Apagar busca" clearable defaultValue="ana" label="Busca" />);

    expect(screen.getByRole('button', { name: 'Apagar busca' })).toBeInTheDocument();
  });

  it('nao oferece limpar no campo desabilitado ou somente leitura', () => {
    render(
      <>
        <InputText clearable defaultValue="ana" disabled label="Desabilitado" />
        <InputText clearable defaultValue="ana" label="Leitura" readOnly />
      </>,
    );

    expect(screen.queryByRole('button', { name: 'Limpar' })).toBeNull();
  });

  it('volta a mostrar o botao quando o formulario restaura o texto inicial', () => {
    render(
      <form>
        <InputText clearable defaultValue="ana" label="Busca" />
      </form>,
    );
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Busca' });

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));
    act(() => input.form!.reset());

    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument();
  });
});

describe('InputText loading', () => {
  it('anuncia o carregamento por uma regiao de status sempre montada, sem aria-busy no campo', () => {
    const { rerender } = render(<InputText label="Busca" loading={false} />);

    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    rerender(<InputText label="Busca" loading />);

    expect(screen.getByRole('status')).toBe(status);
    expect(status).toHaveTextContent('Carregando');
    expect(screen.getByRole('textbox', { name: 'Busca' })).not.toHaveAttribute('aria-busy');
  });

  it('mostra o Spinner decorativo ao fim enquanto carrega', () => {
    const { container, rerender } = render(<InputText label="Busca" loading loadingLabel="Buscando clientes" />);

    expect(screen.getByRole('status')).toHaveTextContent('Buscando clientes');
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();

    rerender(<InputText label="Busca" loading={false} loadingLabel="Buscando clientes" />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(container.querySelector(`.${styles.endSlot}`)).toBeNull();
  });

  it('sem loading, nao monta a regiao', () => {
    render(<InputText label="Busca" />);

    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('InputText com complemento e aside', () => {
  it('o complemento do rotulo nao entra no nome, e o aside fica fora da descricao', () => {
    render(
      <InputText
        aside={<button type="button">Buscar CEP</button>}
        error="CEP invalido."
        label="CEP"
        labelAddon={<a href="#ajuda">Nao sei meu CEP</a>}
      />,
    );

    const input = screen.getByRole('textbox', { name: 'CEP' });

    expect(input).toHaveAccessibleName('CEP');
    expect(input).toHaveAccessibleDescription('CEP invalido.');
    expect(screen.getByRole('link', { name: 'Nao sei meu CEP' }).closest('label')).toBeNull();
    expect(screen.getByRole('button', { name: 'Buscar CEP' })).toBeInTheDocument();
  });
});

describe('InputText: folha do involucro com fenda', () => {
  const regras = regrasDaFolha('src/components/forms/InputText/InputText.module.css');
  const campo = regrasDaFolha('src/components/forms/Field/Field.module.css');

  it('o involucro tem a altura e a borda do campo comum, e o input fica sem borda', () => {
    expect(regras.get('.frame')).toMatchObject({
      'min-height': campo.get('.control')!['min-height'],
      border: campo.get('.control')!.border,
      'border-radius': campo.get('.control')!['border-radius'],
    });
    expect(regras.get('.frame.sm')).toMatchObject({ 'min-height': campo.get('.sm')!['min-height'] });
    expect(regras.get('.frame.lg')).toMatchObject({ 'min-height': campo.get('.lg')!['min-height'] });
    expect(regras.get('.inner')).toMatchObject({ border: '0', background: 'transparent' });
  });

  it('desenha o foco por :focus-within, com o halo do campo, e o erro com a borda de perigo', () => {
    expect(regras.get('.frame:focus-within')).toEqual({
      'border-color': 'var(--pl-color-primary-strong)',
      'box-shadow': 'var(--pl-control-focus-halo)',
    });
    expect(regras.get('.frame.invalid')).toEqual({ 'border-color': 'var(--pl-color-danger)' });
    expect(regras.get('.frame:has(> .inner:disabled)')).toMatchObject({ opacity: '0.7' });
  });

  it('le a cor do icone inicial em --pl-input-icon-color, sem declara-la', () => {
    expect(regras.get('.icon')).toMatchObject({ color: 'var(--pl-input-icon-color, var(--pl-color-text-tertiary))' });

    for (const declaracoes of regras.values()) {
      expect(Object.keys(declaracoes)).not.toContain('--pl-input-icon-color');
    }
  });
});
