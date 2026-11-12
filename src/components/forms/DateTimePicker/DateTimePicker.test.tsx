import { getLocalTimeZone, now, toCalendarDateTime, today } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { DateTimePicker } from './DateTimePicker';

describe('DateTimePicker', () => {
  it('apresenta data e hora no mesmo campo', () => {
    render(<DateTimePicker label="Agendamento" value={'2026-03-09T14:30'} />);

    expect(screen.getByLabelText('Agendamento')).toHaveValue('09/03/2026 14:30');
  });

  it('traz calendario e horas no mesmo painel', () => {
    render(<DateTimePicker label="Agendamento" value={'2026-03-09T14:30'} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Horário' })).toBeInTheDocument();
  });

  it('escolhe a hora no painel preservando a data', () => {
    const mudou = vi.fn();
    render(
      <DateTimePicker label="Agendamento" defaultValue={'2026-03-09T14:30'} onValueChange={mudou} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('option', { name: '08:30' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T08:30');
  });

  it('escolhe a data pelo calendario preservando a hora', () => {
    const mudou = vi.fn();
    render(
      <DateTimePicker label="Agendamento" defaultValue={'2026-03-09T14:30'} onValueChange={mudou} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith('2026-03-12T14:30');
  });

  it('aceita data e hora digitadas no mesmo campo', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Agendamento');
    fireEvent.change(campo, { target: { value: '090320261415' } });

    expect(campo).toHaveValue('09/03/2026 14:15');
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T14:15');
  });

  it('assume meia-noite quando a data vem antes da hora, so ao sair', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Agendamento');
    fireEvent.change(campo, { target: { value: '09032026' } });
    expect(mudou).not.toHaveBeenCalled();

    fireEvent.blur(campo);
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T00:00');
  });

  it('digitado tecla a tecla, grava so com a data e a hora completas', () => {
    const mudou = vi.fn();
    render(<DateTimePicker defaultValue="2026-01-05T10:00" label="Agendamento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Agendamento') as HTMLInputElement;
    fireEvent.change(campo, { target: { value: '' } });
    mudou.mockClear();

    for (const tecla of '090320261') {
      if (fireEvent.keyDown(campo, { key: tecla })) {
        fireEvent.change(campo, { target: { value: campo.value + tecla } });
      }
    }

    expect(campo).toHaveValue('09/03/2026 1');
    expect(mudou).not.toHaveBeenCalled();

    for (const tecla of '415') {
      if (fireEvent.keyDown(campo, { key: tecla })) {
        fireEvent.change(campo, { target: { value: campo.value + tecla } });
      }
    }

    expect(campo).toHaveValue('09/03/2026 14:15');
    expect(mudou).toHaveBeenCalledTimes(1);
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T14:15');
  });

  it('desabilita no calendario os dias fora dos limites', () => {
    render(
      <DateTimePicker
        label="Agendamento"
        value={'2026-03-09T14:30'}
        min={'2026-03-05'}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('button', { name: '4 de março de 2026' })).toHaveAttribute('aria-disabled', 'true');
  });
  it('apoia a hora em hoje quando ainda nao ha data', () => {
    const mudou = vi.fn();
    const hoje = today(getLocalTimeZone());
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('option', { name: '09:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith(`${hoje.toString()}T09:00`);
  });

  it('nao fixa a hora antes dos quatro digitos', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Agendamento');

    fireEvent.change(campo, { target: { value: '09032026184' } });
    expect(campo).toHaveValue('09/03/2026 18:4');
    expect(mudou).not.toHaveBeenCalled();

    fireEvent.change(campo, { target: { value: '090320261840' } });
    expect(campo).toHaveValue('09/03/2026 18:40');
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09T18:40');
  });

  it('preenche data e hora correntes pelo Agora', () => {
    const mudou = vi.fn();
    render(<DateTimePicker label="Agendamento" onValueChange={mudou} />);

    // Entre um instante e outro o relogio pode virar de minuto: o valor fica entre os dois, e nao igual ao segundo.
    const minutoCheio = () => toCalendarDateTime(now(getLocalTimeZone())).toString().slice(0, 16);
    const antes = minutoCheio();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agora' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    const depois = minutoCheio();
    const aplicado = String(mudou.mock.lastCall?.[0]);

    // No mesmo formato ISO, a ordem do texto e a do tempo.
    expect(aplicado >= antes && aplicado <= depois).toBe(true);
    expect(aplicado).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  describe('abertura controlável', () => {
    const gatilho = () => screen.getByRole('button', { name: 'Abrir calendário' });

    it('abre de início com defaultOpen', () => {
      render(<DateTimePicker label="Agendamento" defaultOpen />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(gatilho()).toHaveAttribute('aria-expanded', 'true');
    });

    it('avisa a abertura e o fechamento em cada via, sem controle', () => {
      const onOpenChange = vi.fn();
      render(<DateTimePicker label="Agendamento" onOpenChange={onOpenChange} />);
      const campo = screen.getByLabelText('Agendamento');

      fireEvent.click(gatilho());
      fireEvent.click(gatilho());
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
      fireEvent.keyDown(campo, { key: 'Escape' });
      fireEvent.click(gatilho());
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      fireEvent.click(gatilho());
      fireEvent.pointerDown(document.body);
      fireEvent.mouseDown(document.body);
      fireEvent.pointerUp(document.body);
      fireEvent.mouseUp(document.body);
      fireEvent.click(gatilho());
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

      expect(onOpenChange.mock.calls).toEqual([[true], [false], [true], [false], [true], [false], [true], [false], [true], [false]]);
    });

    it('abre e fecha por open e devolve o foco ao botão', () => {
      const { rerender } = render(<DateTimePicker label="Agendamento" open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<DateTimePicker label="Agendamento" open />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<DateTimePicker label="Agendamento" open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(gatilho()).toHaveFocus();
    });

    it('controlado, só muda quando o produto atualiza open', () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<DateTimePicker label="Agendamento" onOpenChange={onOpenChange} open={false} />);

      fireEvent.click(gatilho());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<DateTimePicker label="Agendamento" onOpenChange={onOpenChange} open />);
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('atalhos e completar', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 12, 14, 37));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function montar(props: Partial<React.ComponentProps<typeof DateTimePicker>> = {}) {
      render(<DateTimePicker label="Agendamento" {...props} />);
      return screen.getByLabelText('Agendamento') as HTMLInputElement;
    }

    function teclar(campo: HTMLInputElement, key: string, cursor: number) {
      campo.setSelectionRange(cursor, cursor);
      return fireEvent.keyDown(campo, { key });
    }

    it('aceita so numeros, barra, espaco e dois pontos', () => {
      const campo = montar();

      expect(fireEvent.keyDown(campo, { key: 'a' })).toBe(false);
      fireEvent.change(campo, { target: { value: '01/03/2026 8:3x' } });
      expect(campo).toHaveValue('01/03/2026 8:3');
    });

    it('anuncia a data e a hora novas so quando um atalho as troca', () => {
      const campo = montar({ defaultValue: '2026-11-22T14:36' });
      const anuncio = screen.getByRole('status');

      teclar(campo, '+', 15);
      expect(anuncio).toHaveTextContent('22 de novembro de 2026, 14:37');

      fireEvent.change(campo, { target: { value: '1' } });
      expect(anuncio).toHaveTextContent(/^$/);

      teclar(campo, 'h', 0);
      expect(anuncio).toHaveTextContent('12 de novembro de 2026, 14:37');
    });

    it('H da data e hora atuais', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '2026-03-09T08:00', onValueChange: mudou });

      expect(fireEvent.keyDown(campo, { key: 'h' })).toBe(false);

      expect(campo).toHaveValue('12/11/2026 14:37');
      expect(mudou).toHaveBeenLastCalledWith('2026-11-12T14:37');
    });

    it('+ e - mudam o dia, a hora ou o minuto conforme o cursor', () => {
      const campo = montar({ defaultValue: '2026-03-09T14:59' });

      teclar(campo, '+', 3);
      expect(campo).toHaveValue('10/03/2026 14:59');

      teclar(campo, '-', 12);
      expect(campo).toHaveValue('10/03/2026 13:59');

      teclar(campo, '+', 15);
      expect(campo).toHaveValue('10/03/2026 14:00');
    });

    it('a virada passa para a data', () => {
      const campo = montar({ defaultValue: '2026-12-31T23:30' });

      teclar(campo, '+', 12);
      expect(campo).toHaveValue('01/01/2027 00:30');

      teclar(campo, '-', 15);
      expect(campo).toHaveValue('01/01/2027 00:29');
    });

    it('com o campo vazio, + parte de agora', () => {
      const campo = montar();

      teclar(campo, '+', 0);

      expect(campo).toHaveValue('13/11/2026 14:37');
    });

    it('com texto invalido, + parte do ultimo valor valido', () => {
      const campo = montar({ defaultValue: '2026-03-09T08:00' });

      fireEvent.change(campo, { target: { value: '31/02' } });
      teclar(campo, '+', 0);

      expect(campo).toHaveValue('10/03/2026 08:00');
    });

    it('com so a data digitada, + parte dela a meia-noite', () => {
      const campo = montar({ defaultValue: '2026-03-09T08:00' });

      fireEvent.change(campo, { target: { value: '21052026' } });
      teclar(campo, '+', 10);

      expect(campo).toHaveValue('22/05/2026 00:00');
    });

    it('+ nao leva a data para fora dos limites', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '2026-03-31T10:00', max: '2026-03-31', onValueChange: mudou });

      teclar(campo, '+', 12);
      expect(campo).toHaveValue('31/03/2026 11:00');

      mudou.mockClear();
      teclar(campo, '+', 0);
      expect(mudou).not.toHaveBeenCalled();
    });

    it.each([
      ['21/05/2026 8', '21/05/2026 08:00'],
      ['21/05/2026 830', '21/05/2026 08:30'],
      ['21/05/2026 1430', '21/05/2026 14:30'],
      ['215', '21/05/2026 00:00'],
      ['21/05/26 ', '21/05/2026 00:00'],
    ])('ao sair, completa %s', (digitado, esperado) => {
      const campo = montar();

      fireEvent.change(campo, { target: { value: digitado } });
      fireEvent.blur(campo);

      expect(campo).toHaveValue(esperado);
    });

    it('Enter completa o que foi digitado', () => {
      const campo = montar();

      fireEvent.change(campo, { target: { value: '21/05/2026 8' } });
      fireEvent.keyDown(campo, { key: 'Enter' });

      expect(campo).toHaveValue('21/05/2026 08:00');
    });

    it('nao apaga o valor enquanto o texto esta incompleto', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '2026-03-09T08:00', onValueChange: mudou });

      fireEvent.change(campo, { target: { value: '21/05' } });

      expect(mudou).not.toHaveBeenCalled();
    });

    it('recusa a hora invalida com a mensagem da hora', () => {
      const mudou = vi.fn();
      const aviso = vi.fn();
      const campo = montar({ defaultValue: '2026-03-09T08:00', onInvalidText: aviso, onValueChange: mudou });

      fireEvent.change(campo, { target: { value: '21/05/2026 25' } });
      const texto = campo.value;
      fireEvent.blur(campo);

      expect(screen.getByRole('alert')).toHaveTextContent('Hora inválida.');
      expect(campo).toHaveAttribute('aria-invalid', 'true');
      expect(campo).toHaveValue(texto);
      expect(mudou).not.toHaveBeenCalled();
      expect(aviso).toHaveBeenCalledWith(texto, 'invalid');
    });

    it('recusa a data invalida e a fora dos limites', () => {
      const aviso = vi.fn();
      const campo = montar({ isDateUnavailable: (data) => data === '2026-03-10', max: '2026-03-31', onInvalidText: aviso });

      fireEvent.change(campo, { target: { value: '32/01/2026' } });
      fireEvent.blur(campo);
      expect(screen.getByRole('alert')).toHaveTextContent('Data inválida.');
      expect(aviso).toHaveBeenLastCalledWith('32/01/2026', 'invalid');

      fireEvent.change(campo, { target: { value: '09/09/2030 10:00' } });
      fireEvent.blur(campo);
      expect(screen.getByRole('alert')).toHaveTextContent('Data fora do intervalo permitido.');
      expect(aviso).toHaveBeenLastCalledWith('09/09/2030 10:00', 'outOfRange');

      fireEvent.change(campo, { target: { value: '10/03/2026 10:00' } });
      fireEvent.blur(campo);
      expect(aviso).toHaveBeenLastCalledWith('10/03/2026 10:00', 'outOfRange');
    });

    it('repassa ao campo o onInvalid nativo', () => {
      const nativo = vi.fn();
      const campo = montar({ onInvalid: nativo });

      fireEvent.invalid(campo);

      expect(nativo).toHaveBeenCalledTimes(1);
    });

    it('a mensagem some ao corrigir', () => {
      const campo = montar();

      fireEvent.change(campo, { target: { value: '32/01/2026' } });
      fireEvent.blur(campo);
      expect(screen.getByRole('alert')).toBeInTheDocument();

      fireEvent.change(campo, { target: { value: '15/11/2026 10:00' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('o erro do produto prevalece sobre a mensagem do campo', () => {
      const campo = montar({ error: 'Obrigatório' });

      fireEvent.change(campo, { target: { value: '32/01/2026' } });
      fireEvent.blur(campo);

      expect(screen.getByRole('alert')).toHaveTextContent('Obrigatório');
    });
  });
});
