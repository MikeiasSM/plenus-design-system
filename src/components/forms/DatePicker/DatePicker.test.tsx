import { getLocalTimeZone, today } from '@internationalized/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { DatePicker } from './DatePicker';

function montar(props: Partial<React.ComponentProps<typeof DatePicker>> = {}) {
  render(<DatePicker label="Vencimento" {...props} />);
  return screen.getByLabelText('Vencimento');
}

describe('DatePicker', () => {
  it('comeca fechado e anuncia que abre um dialogo', () => {
    montar();

    const gatilho = screen.getByRole('button', { name: 'Abrir calendário' });
    expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog');
    expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exibe o valor recebido na convencao brasileira', () => {
    const campo = montar({ value: '2026-03-09' });

    expect(campo).toHaveValue('09/03/2026');
  });

  it('aplica a mascara e reporta a data digitada', () => {
    const mudou = vi.fn();
    const campo = montar({ onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '09032026' } });

    expect(campo).toHaveValue('09/03/2026');
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09');
  });

  it('nao apaga o valor enquanto a data digitada esta incompleta', () => {
    const mudou = vi.fn();
    const campo = montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '3102' } });

    expect(campo).toHaveValue('31/02');
    expect(mudou).not.toHaveBeenCalled();
  });

  it('passa a nulo quando o campo e esvaziado por inteiro', () => {
    const mudou = vi.fn();
    const campo = montar({ defaultValue: '2026-03-09', onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '' } });

    expect(mudou).toHaveBeenLastCalledWith(null);
  });

  it('nao grava por digitacao a data fora dos limites e a recusa ao sair', () => {
    const mudou = vi.fn();
    const campo = montar({ max: '2026-03-31', onValueChange: mudou });

    fireEvent.change(campo, { target: { value: '09032026' } });
    expect(mudou).toHaveBeenLastCalledWith('2026-03-09');

    mudou.mockClear();
    fireEvent.change(campo, { target: { value: '09092030' } });
    expect(mudou).not.toHaveBeenCalled();

    fireEvent.blur(campo);
    expect(campo).toHaveValue('09/09/2030');
    expect(screen.getByRole('alert')).toHaveTextContent('Data fora do intervalo permitido.');
    expect(mudou).not.toHaveBeenCalled();
  });

  it('abre o calendario pela seta para baixo e escolhe um dia', () => {
    const mudou = vi.fn();
    const campo = montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.keyDown(campo, { key: 'ArrowDown' });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith('2026-03-12');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navega entre os meses pelo cabecalho', () => {
    montar({ value: '2026-03-09' });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName(/março de 2026/i);

    fireEvent.click(screen.getByRole('button', { name: 'Próximo mês' }));
    expect(screen.getByRole('grid')).toHaveAccessibleName(/abril de 2026/i);
  });

  it('desabilita os dias fora da faixa permitida', () => {
    montar({ value: '2026-03-09', min: '2026-03-05' });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    expect(screen.getByRole('button', { name: '4 de março de 2026' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: '5 de março de 2026' })).not.toHaveAttribute('aria-disabled');
  });

  it('marca o dia escolhido e fecha com Escape devolvendo o foco', () => {
    montar({ value: '2026-03-09' });

    const gatilho = screen.getByRole('button', { name: 'Abrir calendário' });
    fireEvent.click(gatilho);

    expect(screen.getByRole('button', { name: '9 de março de 2026' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(gatilho).toHaveFocus();
  });

  it('anda pelo teclado dentro da grade e confirma com Enter', () => {
    const mudou = vi.fn();
    montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));

    const grade = screen.getByRole('grid');
    fireEvent.keyDown(grade, { key: 'ArrowRight' });
    fireEvent.keyDown(grade, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(mudou).toHaveBeenLastCalledWith('2026-03-10');
  });

  it('nao aplica nada antes de confirmar', () => {
    const mudou = vi.fn();
    montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));

    expect(mudou).not.toHaveBeenCalled();
  });

  it('descarta a escolha ao cancelar', () => {
    const mudou = vi.fn();
    montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: '12 de março de 2026' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mudou).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Vencimento')).toHaveValue('09/03/2026');
  });

  it('leva o calendario para hoje sem aplicar', () => {
    const mudou = vi.fn();
    const hoje = today(getLocalTimeZone());
    montar({ value: '2026-03-09', onValueChange: mudou });

    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }));
    expect(mudou).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(mudou).toHaveBeenLastCalledWith(hoje.toString());
  });

  describe('abertura controlável', () => {
    const gatilho = () => screen.getByRole('button', { name: 'Abrir calendário' });

    it('abre de início com defaultOpen', () => {
      render(<DatePicker label="Vencimento" defaultOpen />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(gatilho()).toHaveAttribute('aria-expanded', 'true');
    });

    it('avisa a abertura e o fechamento em cada via, sem controle', () => {
      const onOpenChange = vi.fn();
      render(<DatePicker label="Vencimento" onOpenChange={onOpenChange} />);
      const campo = screen.getByLabelText('Vencimento');

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
      const { rerender } = render(<DatePicker label="Vencimento" open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<DatePicker label="Vencimento" open />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<DatePicker label="Vencimento" open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(gatilho()).toHaveFocus();
    });

    it('controlado, só muda quando o produto atualiza open', () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<DatePicker label="Vencimento" onOpenChange={onOpenChange} open={false} />);

      fireEvent.click(gatilho());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<DatePicker label="Vencimento" onOpenChange={onOpenChange} open />);
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

    it('aceita so numeros; a barra fica com a mascara', () => {
      const campo = montar();

      expect(fireEvent.keyDown(campo, { key: 'a' })).toBe(false);
      expect(fireEvent.keyDown(campo, { key: ':' })).toBe(false);
      expect(fireEvent.keyDown(campo, { key: '5' })).toBe(true);
      expect(fireEvent.keyDown(campo, { key: '/' })).toBe(false);
      expect(fireEvent.keyDown(campo, { key: 'Tab' })).toBe(true);
      expect(fireEvent.keyDown(campo, { key: 'a', ctrlKey: true })).toBe(true);

      fireEvent.change(campo, { target: { value: '1a2-' } });
      expect(campo).toHaveValue('12');

      fireEvent.change(campo, { target: { value: '1/2' } });
      expect(campo).toHaveValue('12');
    });

    it('ignora a barra digitada e completa so pelos digitos', () => {
      const campo = montar();

      for (const tecla of ['1', '/', '1', '2']) {
        if (fireEvent.keyDown(campo, { key: tecla })) {
          fireEvent.change(campo, { target: { value: (campo as HTMLInputElement).value + tecla } });
        }
      }

      expect(campo).toHaveValue('11/2');
      fireEvent.blur(campo);
      expect(campo).toHaveValue('11/02/2026');
    });

    it('somente leitura, os atalhos nao mudam o valor', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '2026-03-09', onValueChange: mudou, readOnly: true });

      fireEvent.keyDown(campo, { key: 'h' });
      fireEvent.keyDown(campo, { key: '+' });
      fireEvent.keyDown(campo, { key: '-' });

      expect(campo).toHaveValue('09/03/2026');
      expect(mudou).not.toHaveBeenCalled();
    });

    it('H da a data de hoje, sem escrever a letra, e substitui o que houver', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '2026-03-09', onValueChange: mudou });

      expect(fireEvent.keyDown(campo, { key: 'h' })).toBe(false);
      expect(mudou).toHaveBeenLastCalledWith('2026-11-12');

      fireEvent.change(campo, { target: { value: '15' } });
      fireEvent.keyDown(campo, { key: 'H' });
      expect(campo).toHaveValue('12/11/2026');
    });

    it('+ e - mudam um dia, tambem os do teclado numerico', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '2026-03-31', onValueChange: mudou });

      expect(fireEvent.keyDown(campo, { key: '+', code: 'NumpadAdd' })).toBe(false);
      expect(mudou).toHaveBeenLastCalledWith('2026-04-01');

      fireEvent.keyDown(campo, { key: '-', code: 'NumpadSubtract' });
      fireEvent.keyDown(campo, { key: '-' });
      expect(mudou).toHaveBeenLastCalledWith('2026-03-30');
      expect(campo).toHaveValue('30/03/2026');
    });

    it('com o campo vazio, + e - partem de hoje', () => {
      const campo = montar();

      fireEvent.keyDown(campo, { key: '+' });
      expect(campo).toHaveValue('13/11/2026');
    });

    it('com texto invalido, + parte do ultimo valor valido', () => {
      const campo = montar({ defaultValue: '2026-03-09' });

      fireEvent.change(campo, { target: { value: '31/02' } });
      fireEvent.keyDown(campo, { key: '+' });

      expect(campo).toHaveValue('10/03/2026');
    });

    it('+ nao leva a data para fora dos limites', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '2026-03-31', max: '2026-03-31', onValueChange: mudou });

      fireEvent.keyDown(campo, { key: '+' });

      expect(mudou).not.toHaveBeenCalled();
      expect(campo).toHaveValue('31/03/2026');
    });

    it.each([
      ['1', '01/11/2026'],
      ['15', '15/11/2026'],
      ['215', '21/05/2026'],
      ['112', '11/02/2026'],
      ['2105', '21/05/2026'],
      ['260326', '26/03/2026'],
      ['260350', '26/03/2050'],
      ['21052026', '21/05/2026'],
    ])('ao sair, completa %s em %s', (digitado, esperado) => {
      const mudou = vi.fn();
      const campo = montar({ onValueChange: mudou });

      fireEvent.change(campo, { target: { value: digitado } });
      expect(mudou).not.toHaveBeenCalledWith(null);
      fireEvent.blur(campo);

      expect(campo).toHaveValue(esperado);
      expect(mudou).toHaveBeenLastCalledWith(esperado.split('/').reverse().join('-'));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('Enter completa o que foi digitado', () => {
      const campo = montar();

      fireEvent.change(campo, { target: { value: '15' } });
      fireEvent.keyDown(campo, { key: 'Enter' });

      expect(campo).toHaveValue('15/11/2026');
    });

    it.each(['12345', '1234567', '32', '3102', '0000'])('ao sair, %s e invalido', (digitado) => {
      const mudou = vi.fn();
      const aviso = vi.fn();
      const campo = montar({ defaultValue: '2026-03-09', onInvalid: aviso, onValueChange: mudou });

      fireEvent.change(campo, { target: { value: digitado } });
      const texto = (campo as HTMLInputElement).value;
      fireEvent.blur(campo);

      expect(screen.getByRole('alert')).toHaveTextContent('Data inválida.');
      expect(campo).toHaveAttribute('aria-invalid', 'true');
      expect(campo).toHaveValue(texto);
      expect(mudou).not.toHaveBeenCalled();
      expect(aviso).toHaveBeenCalledTimes(1);
      expect(aviso).toHaveBeenCalledWith(texto);
    });

    it('avisa o mesmo texto invalido uma vez so, mesmo com Enter e depois a saida', () => {
      const aviso = vi.fn();
      const campo = montar({ onInvalid: aviso });

      fireEvent.change(campo, { target: { value: '32' } });
      fireEvent.keyDown(campo, { key: 'Enter' });
      fireEvent.blur(campo);
      expect(aviso).toHaveBeenCalledTimes(1);

      fireEvent.change(campo, { target: { value: '3' } });
      fireEvent.change(campo, { target: { value: '32' } });
      fireEvent.blur(campo);
      expect(aviso).toHaveBeenCalledTimes(2);
    });

    it('o erro do produto prevalece sobre a mensagem do campo', () => {
      const campo = montar({ error: 'Obrigatório' });

      fireEvent.change(campo, { target: { value: '32' } });
      fireEvent.blur(campo);

      expect(screen.getByRole('alert')).toHaveTextContent('Obrigatório');
    });

    it('o erro vazio do produto nao esconde a mensagem do campo', () => {
      const campo = montar({ error: '' });

      fireEvent.change(campo, { target: { value: '32' } });
      fireEvent.blur(campo);

      expect(screen.getByRole('alert')).toHaveTextContent('Data inválida.');
      expect(campo).toHaveAttribute('aria-invalid', 'true');
    });

    it('a mensagem some quando o valor fica valido', () => {
      const campo = montar();

      fireEvent.change(campo, { target: { value: '32' } });
      fireEvent.blur(campo);
      expect(screen.getByRole('alert')).toBeInTheDocument();

      fireEvent.change(campo, { target: { value: '15112026' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(campo).not.toHaveAttribute('aria-invalid');
    });
  });
});
