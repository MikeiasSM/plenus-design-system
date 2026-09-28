import { CalendarDate, CalendarDateTime, Time } from '@internationalized/date';
import { act, createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ComboBox } from './ComboBox';
import { DatePicker } from './DatePicker';
import { DateTimePicker } from './DateTimePicker';
import { Select } from './Select';
import { TimePicker } from './TimePicker';

const opcoes = [
  { label: 'Ativo', value: 'ativo' },
  { label: 'Inativo', value: 'inativo' },
];

function enviado() {
  const formulario = screen.getByTestId('formulario') as HTMLFormElement;

  return Object.fromEntries(new FormData(formulario).entries());
}

describe('participacao no formulario', () => {
  it('leva o valor de cada campo ao FormData', () => {
    render(
      <form data-testid="formulario">
        <Select label="Status" name="status" options={opcoes} value="ativo" />
        <ComboBox label="Cidade" name="cidade" options={opcoes} value="inativo" />
        <DatePicker label="Vencimento" name="vencimento" value={new CalendarDate(2026, 3, 9)} />
        <TimePicker label="Início" name="inicio" value={new Time(9, 30)} />
        <DateTimePicker
          label="Agendamento"
          name="agendamento"
          value={new CalendarDateTime(2026, 3, 9, 18, 40)}
        />
      </form>,
    );

    expect(enviado()).toEqual({
      status: 'ativo',
      cidade: 'inativo',
      vencimento: '2026-03-09',
      inicio: '09:30',
      agendamento: '2026-03-09T18:40:00',
    });
  });

  it('nao acrescenta campo algum quando o nome nao e informado', () => {
    render(
      <form data-testid="formulario">
        <Select label="Status" options={opcoes} value="ativo" />
      </form>,
    );

    expect(enviado()).toEqual({});
  });

  it('envia vazio quando o campo esta vazio, em vez de sumir do envio', () => {
    render(
      <form data-testid="formulario">
        <DatePicker label="Vencimento" name="vencimento" value={null} />
      </form>,
    );

    expect(enviado()).toEqual({ vencimento: '' });
  });

  it('nao envia o valor de Select e ComboBox desabilitados', () => {
    render(
      <form data-testid="formulario">
        <Select disabled label="Status" name="status" options={opcoes} value="ativo" />
        <ComboBox disabled label="Cidade" name="cidade" options={opcoes} value="inativo" />
      </form>,
    );

    expect(enviado()).toEqual({});
  });

  it('volta Select e ComboBox ao valor inicial no reset do formulario', () => {
    render(
      <form data-testid="formulario">
        <Select defaultValue="ativo" label="Status" name="status" options={opcoes} />
        <ComboBox defaultValue="ativo" label="Cidade" name="cidade" options={opcoes} />
      </form>,
    );

    fireEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    fireEvent.click(screen.getByRole('option', { name: 'Inativo' }));
    fireEvent.click(screen.getByRole('combobox', { name: 'Cidade' }));
    fireEvent.click(screen.getByRole('option', { name: 'Inativo' }));

    expect(enviado()).toEqual({ status: 'inativo', cidade: 'inativo' });

    act(() => (screen.getByTestId('formulario') as HTMLFormElement).reset());

    expect(enviado()).toEqual({ status: 'ativo', cidade: 'ativo' });
    expect(screen.getByRole('combobox', { name: 'Cidade' })).toHaveValue('Ativo');
  });

  it('mantem a escolha enquanto as opcoes ainda nao chegaram', () => {
    const { rerender } = render(
      <form data-testid="formulario">
        <Select label="Status" name="status" options={[]} value="ativo" />
        <ComboBox defaultValue="inativo" label="Cidade" name="cidade" options={[]} />
      </form>,
    );

    expect(enviado()).toEqual({ status: 'ativo', cidade: 'inativo' });

    rerender(
      <form data-testid="formulario">
        <Select label="Status" name="status" options={opcoes} value="ativo" />
        <ComboBox defaultValue="inativo" label="Cidade" name="cidade" options={opcoes} />
      </form>,
    );

    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveTextContent('Ativo');
    expect(screen.getByRole('combobox', { name: 'Cidade' })).toHaveValue('Inativo');
  });

  it('entrega o ref do controle de Select e ComboBox', () => {
    const gatilho = createRef<HTMLButtonElement>();
    const campo = createRef<HTMLInputElement>();

    render(
      <>
        <Select label="Status" options={opcoes} ref={gatilho} />
        <ComboBox label="Cidade" options={opcoes} ref={campo} />
      </>,
    );

    expect(gatilho.current).toBe(screen.getByRole('combobox', { name: 'Status' }));
    expect(campo.current).toBe(screen.getByRole('combobox', { name: 'Cidade' }));
  });
});

describe('propriedades nativas dos campos sem controle nativo', () => {
  it('nomeia, descreve e ouve o controle de Select, ComboBox e seletores', () => {
    const saiu = vi.fn();

    render(
      <>
        <span id="fora">Obrigatorio para faturar</span>
        <Select aria-describedby="fora" aria-label="Status" onBlur={saiu} options={opcoes} />
        <ComboBox aria-describedby="fora" aria-label="Cidade" onBlur={saiu} options={opcoes} />
        <DatePicker aria-describedby="fora" aria-label="Vencimento" onBlur={saiu} />
        <TimePicker aria-describedby="fora" aria-label="Inicio" onBlur={saiu} />
        <DateTimePicker aria-describedby="fora" aria-label="Agenda" onBlur={saiu} />
      </>,
    );

    const controles = [
      screen.getByRole('combobox', { name: 'Status' }),
      screen.getByRole('combobox', { name: 'Cidade' }),
      screen.getByRole('textbox', { name: 'Vencimento' }),
      screen.getByRole('textbox', { name: 'Inicio' }),
      screen.getByRole('textbox', { name: 'Agenda' }),
    ];

    for (const controle of controles) {
      expect(controle).toHaveAccessibleDescription('Obrigatorio para faturar');
      fireEvent.blur(controle);
    }

    expect(saiu).toHaveBeenCalledTimes(controles.length);
  });

  it('entrega o ref do campo de texto dos seletores e soma a classe a caixa', () => {
    const campo = createRef<HTMLInputElement>();

    render(<DatePicker className="largo" label="Vencimento" ref={campo} />);

    expect(campo.current).toBe(screen.getByLabelText('Vencimento'));
    expect(campo.current?.parentElement).toHaveClass('largo');
  });

  it('barra o envio do campo obrigatorio vazio e libera com o valor', () => {
    const { rerender } = render(
      <form data-testid="formulario">
        <Select label="Status" name="status" options={opcoes} required />
        <DatePicker label="Vencimento" name="vencimento" required />
      </form>,
    );

    const formulario = screen.getByTestId('formulario') as HTMLFormElement;

    expect(formulario.checkValidity()).toBe(false);

    rerender(
      <form data-testid="formulario">
        <Select label="Status" name="status" options={opcoes} required value="ativo" />
        <DatePicker label="Vencimento" name="vencimento" required value={new CalendarDate(2026, 3, 9)} />
      </form>,
    );

    expect(formulario.checkValidity()).toBe(true);
    expect(enviado()).toEqual({ status: 'ativo', vencimento: '2026-03-09' });
  });
});
