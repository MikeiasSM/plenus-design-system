import { act, fireEvent, render, screen } from '@testing-library/react';
import { InputCurrency } from './InputCurrency';
import { InputNumber } from './InputNumber';
import { InputText } from './InputText';

describe('reinicio do formulario', () => {
  it('devolve os campos ao valor inicial', () => {
    render(
      <form data-testid="formulario">
        <InputText defaultValue="Ana" label="Nome" />
        <InputNumber defaultValue="10" label="Quantidade" />
        <InputCurrency defaultValue="1000" label="Valor" />
      </form>,
    );

    const nome = screen.getByLabelText('Nome');
    const quantidade = screen.getByLabelText('Quantidade');
    const valor = screen.getByLabelText('Valor');
    const valorInicial = (valor as HTMLInputElement).value;

    fireEvent.change(nome, { target: { value: 'Bruno' } });
    fireEvent.change(quantidade, { target: { value: '99' } });
    fireEvent.change(valor, { target: { value: '5000' } });

    const valorInicialDaMoeda = valorInicial;

    expect(quantidade).toHaveValue('99');

    // `fireEvent.reset` so dispara o evento; quem devolve o DOM ao inicial e o
    // proprio `reset` do formulario.
    act(() => (screen.getByTestId('formulario') as HTMLFormElement).reset());

    expect(nome).toHaveValue('Ana');
    expect(quantidade).toHaveValue('10');
    expect(valor).toHaveValue(valorInicialDaMoeda);
  });
});
