import { useState } from 'react';
import { CalendarDate, CalendarDateTime, Time, getLocalTimeZone, today } from '@internationalized/date';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DatePicker } from './DatePicker';
import { DateTimePicker } from './DateTimePicker';
import { lerEntradaDataHora } from '../../utils/formatters';
import { TimePicker } from './TimePicker';
import { gerarHorarios } from './TimePicker/TimeSlots';

describe('valor controlado vazio', () => {
  it('limpa a data quando o produto devolve null', () => {
    const { rerender } = render(
      <DatePicker label="Vencimento" value={new CalendarDate(2026, 8, 15)} />,
    );

    expect(screen.getByLabelText('Vencimento')).toHaveValue('15/08/2026');

    rerender(<DatePicker label="Vencimento" value={null} />);

    expect(screen.getByLabelText('Vencimento')).toHaveValue('');
  });

  it('limpa a hora quando o produto devolve null', () => {
    const { rerender } = render(<TimePicker label="Início" value={new Time(9, 30)} />);

    expect(screen.getByLabelText('Início')).toHaveValue('09:30');

    rerender(<TimePicker label="Início" value={null} />);

    expect(screen.getByLabelText('Início')).toHaveValue('');
  });
});

describe('lista de horarios', () => {
  it('nao trava com passo nao positivo', () => {
    expect(gerarHorarios(0)).toEqual([]);
    expect(gerarHorarios(-15)).toEqual([]);
  });

  it('gera do primeiro ao ultimo que couber no passo', () => {
    expect(gerarHorarios(30, new Time(9, 0), new Time(10, 0))).toHaveLength(3);
  });
});

describe('calendario', () => {
  it('abre no mes da data escolhida, e nao no mes corrente', () => {
    render(<DatePicker label="Vencimento" value={new CalendarDate(2027, 8, 15)} />);

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));

    expect(screen.getByText(/agosto de 2027/i)).toBeInTheDocument();
  });

  it('poe o foco no dia, e ele anda com as setas, para o leitor de tela anunciar cada dia', () => {
    render(<DatePicker label="Vencimento" value={new CalendarDate(2026, 3, 9)} />);

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));

    expect(screen.getByRole('button', { name: '9 de março de 2026' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' });

    const dez = screen.getByRole('button', { name: '10 de março de 2026' });

    expect(dez).toHaveFocus();
    expect(dez).toHaveAttribute('tabindex', '0');
  });

  it('nao puxa o foco para a grade ao trocar de mes pelo botao', () => {
    const mudou = vi.fn();
    render(<DatePicker label="Vencimento" onValueChange={mudou} value={new CalendarDate(2026, 3, 9)} />);

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));

    const proximo = screen.getByRole('button', { name: 'Próximo mês' });

    proximo.focus();
    fireEvent.click(proximo);

    // Com o foco roubado, o segundo Enter no botao escolhia um dia.
    expect(proximo).toHaveFocus();
  });

  it('leva a grade ao mes de hoje pelo Hoje, mesmo com o rascunho ja em hoje', () => {
    const hoje = today(getLocalTimeZone());
    const mesDeHoje = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(hoje.toDate(getLocalTimeZone()));

    render(<DatePicker label="Vencimento" value={hoje} />);

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));

    expect(screen.getByRole('grid')).toHaveAccessibleName(mesDeHoje);
  });
});

describe('leitura de data e hora digitadas', () => {
  it('assume meia-noite quando nao se digitou hora alguma', () => {
    expect(lerEntradaDataHora('09/03/2026')).toEqual(new CalendarDateTime(2026, 3, 9, 0, 0));
  });

  it('nao tem valor enquanto a hora esta pela metade', () => {
    expect(lerEntradaDataHora('09/03/2026 18:4')).toBeUndefined();
  });

  it('nao transforma hora impossivel em meia-noite', () => {
    expect(lerEntradaDataHora('09/03/2026 25:99')).toBeUndefined();
    expect(lerEntradaDataHora('09/03/2026 24:00')).toBeUndefined();
  });

  it('le a data e hora inteiras', () => {
    expect(lerEntradaDataHora('09/03/2026 18:40')).toEqual(new CalendarDateTime(2026, 3, 9, 18, 40));
  });
});

function enviado() {
  return Object.fromEntries(new FormData(screen.getByTestId('formulario') as HTMLFormElement).entries());
}

function digitar(campo: HTMLElement, teclas: string) {
  for (const tecla of teclas) {
    fireEvent.change(campo, { target: { value: (campo as HTMLInputElement).value + tecla } });
  }
}

function apagar(campo: HTMLElement) {
  fireEvent.change(campo, { target: { value: (campo as HTMLInputElement).value.slice(0, -1) } });
}

describe('laco controlado com o proprio setter', () => {
  function DataControlada() {
    const [data, setData] = useState<CalendarDate | null>(null);

    return <DatePicker label="Vencimento" name="vencimento" onValueChange={setData} value={data} />;
  }

  function HoraControlada() {
    const [hora, setHora] = useState<Time | null>(null);

    return <TimePicker label="Início" name="inicio" onValueChange={setHora} value={hora} />;
  }

  it('nao ressuscita a data apagada', () => {
    render(
      <form data-testid="formulario">
        <DataControlada />
      </form>,
    );

    const campo = screen.getByLabelText('Vencimento');

    digitar(campo, '10032026');
    apagar(campo);
    digitar(campo, '6');
    apagar(campo);
    fireEvent.blur(campo);

    expect(campo).toHaveValue('');
    expect(enviado()).toEqual({ vencimento: '' });
  });

  it('nao ressuscita a hora apagada', () => {
    render(
      <form data-testid="formulario">
        <HoraControlada />
      </form>,
    );

    const campo = screen.getByLabelText('Início');

    digitar(campo, '1030');
    fireEvent.change(campo, { target: { value: '' } });
    fireEvent.blur(campo);

    expect(campo).toHaveValue('');
    expect(enviado()).toEqual({ inicio: '' });
  });
});

describe('o valor da hora acompanha o texto', () => {
  it('nao guarda a hora anterior enquanto a nova esta pela metade ou e impossivel', () => {
    const mudou = vi.fn();
    render(<TimePicker defaultValue={new Time(18, 40)} label="Início" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Início');

    fireEvent.change(campo, { target: { value: '2599' } });
    expect(campo).toHaveValue('25:99');
    expect(mudou).toHaveBeenLastCalledWith(null);

    fireEvent.change(campo, { target: { value: '18:4' } });
    expect(mudou).toHaveBeenLastCalledWith(null);
  });

  it('recusa por digitacao a hora que a lista ja recusa', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Início" max={new Time(18, 0)} min={new Time(8, 0)} onValueChange={mudou} />);

    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '2300' } });
    expect(mudou).toHaveBeenLastCalledWith(null);

    mudou.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));
    fireEvent.change(screen.getByLabelText('Horário em horas e minutos'), { target: { value: '0600' } });
    expect(mudou).not.toHaveBeenCalled();
  });
});

describe('participacao dos seletores no formulario', () => {
  it('nao envia o valor de um seletor desabilitado', () => {
    render(
      <form data-testid="formulario">
        <DatePicker disabled label="Vencimento" name="vencimento" value={new CalendarDate(2026, 3, 9)} />
        <TimePicker disabled label="Início" name="inicio" value={new Time(9, 30)} />
        <DateTimePicker disabled label="Agenda" name="agenda" value={new CalendarDateTime(2026, 3, 9, 9, 30)} />
      </form>,
    );

    expect(enviado()).toEqual({});
  });

  it('volta ao valor inicial no reset do formulario', () => {
    render(
      <form data-testid="formulario">
        <DatePicker defaultValue={new CalendarDate(2026, 3, 9)} label="Vencimento" name="vencimento" />
        <TimePicker defaultValue={new Time(9, 30)} label="Início" name="inicio" />
        <DateTimePicker defaultValue={new CalendarDateTime(2026, 3, 9, 9, 30)} label="Agenda" name="agenda" />
      </form>,
    );

    fireEvent.change(screen.getByLabelText('Vencimento'), { target: { value: '01012030' } });
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '1800' } });
    fireEvent.change(screen.getByLabelText('Agenda'), { target: { value: '010120301800' } });

    act(() => (screen.getByTestId('formulario') as HTMLFormElement).reset());

    expect(screen.getByLabelText('Vencimento')).toHaveValue('09/03/2026');
    expect(screen.getByLabelText('Início')).toHaveValue('09:30');
    expect(screen.getByLabelText('Agenda')).toHaveValue('09/03/2026 09:30');
    expect(enviado()).toEqual({ vencimento: '2026-03-09', inicio: '09:30', agenda: '2026-03-09T09:30:00' });
  });
});

describe('edicao da data digitada', () => {
  it('reescreve o dia no meio da data sem gravar outra', () => {
    const mudou = vi.fn();
    render(<DatePicker defaultValue={new CalendarDate(2026, 3, 9)} label="Vencimento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Vencimento');

    fireEvent.change(campo, { target: { value: '1/03/2026' } });
    expect(campo).toHaveValue('1/03/2026');

    fireEvent.change(campo, { target: { value: '15/03/2026' } });
    expect(mudou).toHaveBeenLastCalledWith(new CalendarDate(2026, 3, 15));
  });

  it('le dia e mes sem zero a esquerda digitados tecla a tecla', () => {
    const mudou = vi.fn();
    render(<DatePicker label="Vencimento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Vencimento');

    digitar(campo, '1/3/2026');
    expect(mudou).toHaveBeenLastCalledWith(new CalendarDate(2026, 3, 1));

    fireEvent.blur(campo);
    expect(campo).toHaveValue('01/03/2026');
  });

  it('le data e hora coladas sem zero a esquerda', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agenda" onValueChange={mudou} />);

    fireEvent.change(screen.getByLabelText('Agenda'), { target: { value: '1/3/2026 18:40' } });

    expect(mudou).toHaveBeenLastCalledWith(new CalendarDateTime(2026, 3, 1, 18, 40));
  });
});

describe('teclado do painel de horas', () => {
  it('leva o foco para a lista ao abrir, partindo do horario escolhido', () => {
    const mudou = vi.fn();
    render(<TimePicker defaultValue={new Time(10, 30)} label="Início" onValueChange={mudou} />);

    fireEvent.keyDown(screen.getByLabelText('Início'), { key: 'ArrowDown' });

    const lista = screen.getByRole('listbox');
    const ativo = lista.getAttribute('aria-activedescendant') ?? '';

    expect(lista).toHaveFocus();
    expect(document.getElementById(ativo)).toHaveTextContent('10:30');

    fireEvent.keyDown(lista, { key: 'ArrowDown' });
    fireEvent.keyDown(lista, { key: 'Enter' });

    expect(mudou).toHaveBeenLastCalledWith(new Time(11, 0));
  });

  it('fecha com Escape mesmo com o foco no campo', () => {
    render(<TimePicker label="Início" />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));
    fireEvent.keyDown(screen.getByLabelText('Início'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('nao divide os ids das opcoes entre dois seletores de data e hora', () => {
    render(
      <>
        <DateTimePicker label="Inicio" />
        <DateTimePicker label="Fim" />
      </>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Abrir calendário' })[0]);
    const primeiro = screen.getByRole('listbox').id;
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Abrir calendário' })[1]);

    expect(screen.getByRole('listbox').id).not.toBe(primeiro);
  });
});
