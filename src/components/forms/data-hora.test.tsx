import { useState, type ReactElement } from 'react';
import { CalendarDateTime, Time, getLocalTimeZone, today } from '@internationalized/date';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker } from './DatePicker';
import { DateTimePicker } from './DateTimePicker';
import { parseDateTimeInput } from '../../utils/formatters';
import { TimePicker } from './TimePicker';
import { gerarHorarios } from './TimePicker/TimeSlots';

describe('API em texto ISO', () => {
  it('recebe e devolve a data em texto, e trata texto invalido como vazio', () => {
    const mudou = vi.fn();
    const { rerender } = render(
      <DatePicker
        isDateUnavailable={(data) => data === '2026-03-10'}
        label="Vencimento"
        onValueChange={mudou}
        value="2026-03-09"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));
    expect(screen.getByRole('button', { name: '10 de março de 2026' })).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(mudou).toHaveBeenLastCalledWith('2026-03-12');

    rerender(<DatePicker label="Vencimento" value="nao e data" />);
    expect(screen.getByLabelText('Vencimento')).toHaveValue('');
  });
});

describe('valor controlado vazio', () => {
  it('limpa a data quando o produto devolve null', () => {
    const { rerender } = render(
      <DatePicker label="Vencimento" value={'2026-08-15'} />,
    );

    expect(screen.getByLabelText('Vencimento')).toHaveValue('15/08/2026');

    rerender(<DatePicker label="Vencimento" value={null} />);

    expect(screen.getByLabelText('Vencimento')).toHaveValue('');
  });

  it('limpa a hora quando o produto devolve null', () => {
    const { rerender } = render(<TimePicker label="Início" value={'09:30'} />);

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
    render(<DatePicker label="Vencimento" value={'2027-08-15'} />);

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));

    expect(screen.getByText(/agosto de 2027/i)).toBeInTheDocument();
  });

  it('poe o foco no dia, e ele anda com as setas, para o leitor de tela anunciar cada dia', () => {
    render(<DatePicker label="Vencimento" value={'2026-03-09'} />);

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));

    expect(screen.getByRole('button', { name: '9 de março de 2026' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' });

    const dez = screen.getByRole('button', { name: '10 de março de 2026' });

    expect(dez).toHaveFocus();
    expect(dez).toHaveAttribute('tabindex', '0');
  });

  it('nao puxa o foco para a grade ao trocar de mes pelo botao', () => {
    const mudou = vi.fn();
    render(<DatePicker label="Vencimento" onValueChange={mudou} value={'2026-03-09'} />);

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

    render(<DatePicker label="Vencimento" value={hoje.toString()} />);

    fireEvent.click(screen.getByRole('button', { name: /calend/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));

    expect(screen.getByRole('grid')).toHaveAccessibleName(mesDeHoje);
  });
});

describe('leitura de data e hora digitadas', () => {
  it('assume meia-noite quando nao se digitou hora alguma', () => {
    expect(parseDateTimeInput('09/03/2026')).toEqual(new CalendarDateTime(2026, 3, 9, 0, 0));
  });

  it('nao tem valor enquanto a hora esta pela metade', () => {
    expect(parseDateTimeInput('09/03/2026 18:4')).toBeUndefined();
  });

  it('nao transforma hora impossivel em meia-noite', () => {
    expect(parseDateTimeInput('09/03/2026 25:99')).toBeUndefined();
    expect(parseDateTimeInput('09/03/2026 24:00')).toBeUndefined();
  });

  it('le a data e hora inteiras', () => {
    expect(parseDateTimeInput('09/03/2026 18:40')).toEqual(new CalendarDateTime(2026, 3, 9, 18, 40));
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
    const [data, setData] = useState<string | null>(null);

    return <DatePicker label="Vencimento" name="vencimento" onValueChange={setData} value={data} />;
  }

  function HoraControlada() {
    const [hora, setHora] = useState<string | null>(null);

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
    while ((campo as HTMLInputElement).value) {
      apagar(campo);
    }
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
  it('nao apaga a hora anterior enquanto a nova esta pela metade ou e impossivel', () => {
    const mudou = vi.fn();
    render(<TimePicker defaultValue={'18:40'} label="Início" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Início');

    fireEvent.change(campo, { target: { value: '2599' } });
    expect(campo).toHaveValue('25:99');
    fireEvent.change(campo, { target: { value: '18:4' } });
    fireEvent.blur(campo);

    expect(mudou).not.toHaveBeenCalled();
  });

  it('recusa por digitacao a hora que a lista ja recusa', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Início" max={'18:00'} min={'08:00'} onValueChange={mudou} />);

    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '2300' } });
    fireEvent.blur(screen.getByLabelText('Início'));
    expect(mudou).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Hora fora do intervalo permitido.');

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
        <DatePicker disabled label="Vencimento" name="vencimento" value={'2026-03-09'} />
        <TimePicker disabled label="Início" name="inicio" value={'09:30'} />
        <DateTimePicker disabled label="Agenda" name="agenda" value={'2026-03-09T09:30'} />
      </form>,
    );

    expect(enviado()).toEqual({});
  });

  it('volta ao valor inicial no reset do formulario', () => {
    render(
      <form data-testid="formulario">
        <DatePicker defaultValue={'2026-03-09'} label="Vencimento" name="vencimento" />
        <TimePicker defaultValue={'09:30'} label="Início" name="inicio" />
        <DateTimePicker defaultValue={'2026-03-09T09:30'} label="Agenda" name="agenda" />
      </form>,
    );

    fireEvent.change(screen.getByLabelText('Vencimento'), { target: { value: '01012030' } });
    fireEvent.change(screen.getByLabelText('Início'), { target: { value: '1800' } });
    fireEvent.change(screen.getByLabelText('Agenda'), { target: { value: '010120301800' } });

    act(() => (screen.getByTestId('formulario') as HTMLFormElement).reset());

    expect(screen.getByLabelText('Vencimento')).toHaveValue('09/03/2026');
    expect(screen.getByLabelText('Início')).toHaveValue('09:30');
    expect(screen.getByLabelText('Agenda')).toHaveValue('09/03/2026 09:30');
    expect(enviado()).toEqual({ vencimento: '2026-03-09', inicio: '09:30', agenda: '2026-03-09T09:30' });
  });
});

describe('edicao da data digitada', () => {
  it('reescreve o dia no meio da data sem gravar outra', () => {
    const mudou = vi.fn();
    render(<DatePicker defaultValue={'2026-03-09'} label="Vencimento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Vencimento');

    fireEvent.change(campo, { target: { value: '1/03/2026' } });
    expect(campo).toHaveValue('1/03/2026');

    fireEvent.change(campo, { target: { value: '15/03/2026' } });
    expect(mudou).toHaveBeenLastCalledWith('2026-03-15');
  });

  it('le dia e mes sem zero a esquerda digitados tecla a tecla', () => {
    const mudou = vi.fn();
    render(<DatePicker label="Vencimento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Vencimento');

    digitar(campo, '1/3/2026');
    expect(mudou).toHaveBeenLastCalledWith('2026-03-01');

    fireEvent.blur(campo);
    expect(campo).toHaveValue('01/03/2026');
  });

  it('le data e hora coladas sem zero a esquerda', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agenda" onValueChange={mudou} />);

    fireEvent.change(screen.getByLabelText('Agenda'), { target: { value: '1/3/2026 18:40' } });

    expect(mudou).toHaveBeenLastCalledWith('2026-03-01T18:40');
  });

  it('pelo teclado, troca o dia selecionado e preserva o resto e o cursor', async () => {
    const user = userEvent.setup();
    const mudou = vi.fn();
    render(<DatePicker defaultValue={'2026-03-09'} label="Vencimento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Vencimento') as HTMLInputElement;

    await user.type(campo, '1', { initialSelectionEnd: 2, initialSelectionStart: 0 });
    expect(campo).toHaveValue('1/03/2026');
    expect(campo.selectionStart).toBe(1);

    await user.keyboard('5');
    expect(campo).toHaveValue('15/03/2026');
    expect(campo.selectionStart).toBe(2);
    expect(mudou).toHaveBeenLastCalledWith('2026-03-15');
  });

  it('pelo teclado, o dia de um digito no meio da data vale ao sair', async () => {
    const user = userEvent.setup();
    const mudou = vi.fn();
    render(<DatePicker defaultValue={'2026-03-09'} label="Vencimento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Vencimento') as HTMLInputElement;

    await user.type(campo, '1', { initialSelectionEnd: 2, initialSelectionStart: 0 });
    await user.tab();

    expect(campo).toHaveValue('01/03/2026');
    expect(mudou).toHaveBeenLastCalledWith('2026-03-01');
  });
});

describe('o separador digitado fecha o grupo', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 12, 14, 37));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function escrever(elemento: ReactElement, rotulo: string, teclas: string) {
    const user = userEvent.setup();
    render(elemento);
    const campo = screen.getByLabelText(rotulo) as HTMLInputElement;

    await user.type(campo, teclas);

    return { campo, user };
  }

  async function colar(elemento: ReactElement, rotulo: string, texto: string) {
    const user = userEvent.setup();
    render(elemento);
    const campo = screen.getByLabelText(rotulo) as HTMLInputElement;

    await user.click(campo);
    await user.paste(texto);

    return { campo, user };
  }

  async function conferir(
    campo: HTMLInputElement,
    user: ReturnType<typeof userEvent.setup>,
    tela: string | null,
    saida: string | null,
    invalido: string,
  ) {
    if (tela !== null) {
      expect(campo).toHaveValue(tela);
      expect(campo.selectionStart).toBe(tela.length);
    }

    if (saida !== null) {
      await user.tab();

      if (saida === 'invalido') {
        expect(screen.getByRole('alert')).toHaveTextContent(invalido);
      } else {
        expect(campo).toHaveValue(saida);
      }
    }
  }

  describe('na data', () => {
    it.each([
      ['2105', '21/05', '21/05/2026'],
      ['112', '11/2', '11/02/2026'],
      ['215', null, '21/05/2026'],
      ['1', '1', null],
      ['1/', '01/', null],
      ['1/3', '01/3', '01/03/2026'],
      ['1/3/', '01/03/', null],
      ['1/3/2026', '01/03/2026', null],
      ['1/12', '01/12', '01/12/2026'],
      ['1/3/26', null, '01/03/2026'],
      ['1/3/2', null, 'invalido'],
      ['1/3/202', null, 'invalido'],
      ['/', '', null],
      ['1//', '01/', null],
      ['21/', '21/', null],
      ['21//', '21/', null],
      ['1/3/2026/', '01/03/2026', null],
    ])('%s mostra %s e da %s ao sair', async (teclas, tela, saida) => {
      const { campo, user } = await escrever(<DatePicker label="Vencimento" />, 'Vencimento', teclas);

      await conferir(campo, user, tela, saida, 'Data inválida.');
    });

    it('a data inteira grava durante a digitacao', async () => {
      const mudou = vi.fn();
      await escrever(<DatePicker label="Vencimento" onValueChange={mudou} />, 'Vencimento', '1/3/2026');

      expect(mudou).toHaveBeenLastCalledWith('2026-03-01');
    });

    it.each([
      ['1/3/2026', '01/03/2026', '2026-03-01'],
      ['1/12', '01/12/2026', '2026-12-01'],
      ['2026-03-09', '09/03/2026', '2026-03-09'],
    ])('colar %s da %s', async (texto, saida, valor) => {
      const mudou = vi.fn();
      const { campo, user } = await colar(<DatePicker label="Vencimento" onValueChange={mudou} />, 'Vencimento', texto);

      await user.tab();
      expect(campo).toHaveValue(saida);
      expect(mudou).toHaveBeenLastCalledWith(valor);
    });
  });

  describe('na hora', () => {
    it.each([
      ['8:', '08:', '08:00'],
      ['8:3', '08:3', '08:30'],
      ['8:30', null, '08:30'],
      ['830', '83:0', '08:30'],
      ['25', null, 'invalido'],
      [':', '', null],
      ['8::', '08:', null],
      ['8:30:', '08:30', null],
    ])('%s mostra %s e da %s ao sair', async (teclas, tela, saida) => {
      const { campo, user } = await escrever(<TimePicker label="Início" />, 'Início', teclas);

      await conferir(campo, user, tela, saida, 'Hora inválida.');
    });

    it('colar 8:3 da 08:30', async () => {
      const { campo, user } = await colar(<TimePicker label="Início" />, 'Início', '8:3');

      await user.tab();
      expect(campo).toHaveValue('08:30');
    });
  });

  describe('na data e hora', () => {
    it.each([
      ['1/3/2026 8:3', '01/03/2026 08:3', '01/03/2026 08:30'],
      ['1/3/26 8:30', '01/03/26 08:30', '01/03/2026 08:30'],
      ['1/3 ', '01/3', null],
      ['1/3/ ', '01/03/', null],
      ['1/3/2 ', '01/03/2', null],
      ['1/3/2026  ', '01/03/2026 ', null],
      ['1/3/2026 8 ', '01/03/2026 8', null],
    ])('%s mostra %s e da %s ao sair', async (teclas, tela, saida) => {
      const { campo, user } = await escrever(<DateTimePicker label="Agenda" />, 'Agenda', teclas);

      await conferir(campo, user, tela, saida, 'Data inválida.');
    });

    it('durante a digitacao, so grava com a data e a hora completas', async () => {
      const mudou = vi.fn();
      const { user } = await escrever(<DateTimePicker label="Agenda" onValueChange={mudou} />, 'Agenda', '1/3/2026 8:3');

      expect(mudou).not.toHaveBeenCalled();
      await user.keyboard('0');
      expect(mudou).toHaveBeenLastCalledWith('2026-03-01T08:30');
    });

    it('so a data, ao sair, vale meia-noite', async () => {
      const mudou = vi.fn();
      const { user } = await escrever(<DateTimePicker label="Agenda" onValueChange={mudou} />, 'Agenda', '1/3/2026 ');

      expect(mudou).not.toHaveBeenCalled();
      await user.tab();
      expect(mudou).toHaveBeenLastCalledWith('2026-03-01T00:00');
    });

    it('digitado, 1/3/2026 8:3 grava 01/03/2026 08:30 ao sair', async () => {
      const mudou = vi.fn();
      const { campo, user } = await escrever(<DateTimePicker label="Agenda" onValueChange={mudou} />, 'Agenda', '1/3/2026 8:3');

      await user.tab();
      expect(campo).toHaveValue('01/03/2026 08:30');
      expect(mudou).toHaveBeenLastCalledWith('2026-03-01T08:30');
    });

    it('colado, 1/3/2026 8:3 grava 01/03/2026 08:30 ao sair', async () => {
      const mudou = vi.fn();
      const { campo, user } = await colar(<DateTimePicker label="Agenda" onValueChange={mudou} />, 'Agenda', '1/3/2026 8:3');

      expect(campo).toHaveValue('01/03/2026 08:3');
      await user.tab();
      expect(campo).toHaveValue('01/03/2026 08:30');
      expect(mudou).toHaveBeenLastCalledWith('2026-03-01T08:30');
    });
  });
});

describe('teclado do painel de horas', () => {
  it('leva o foco para a lista ao abrir, partindo do horario escolhido', () => {
    const mudou = vi.fn();
    render(<TimePicker defaultValue={'10:30'} label="Início" onValueChange={mudou} />);

    fireEvent.keyDown(screen.getByLabelText('Início'), { key: 'ArrowDown' });

    const lista = screen.getByRole('listbox');
    const ativo = lista.getAttribute('aria-activedescendant') ?? '';

    expect(lista).toHaveFocus();
    expect(document.getElementById(ativo)).toHaveTextContent('10:30');

    fireEvent.keyDown(lista, { key: 'ArrowDown' });
    fireEvent.keyDown(lista, { key: 'Enter' });

    expect(mudou).toHaveBeenLastCalledWith('11:00');
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
