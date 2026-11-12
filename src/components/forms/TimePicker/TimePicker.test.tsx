import { fireEvent, render, screen } from '@testing-library/react';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  it('aplica a mascara e reporta a hora digitada', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Inicio" onValueChange={mudou} />);

    const campo = screen.getByLabelText('Inicio');

    fireEvent.change(campo, { target: { value: '0945' } });
    expect(campo).toHaveValue('09:45');
    expect(mudou).toHaveBeenLastCalledWith('09:45');

    fireEvent.change(campo, { target: { value: '' } });
    expect(mudou).toHaveBeenLastCalledWith(null);
  });

  it('escolhe hora e minuto no painel proprio, sem o seletor nativo', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Inicio" defaultValue={'09:45'} onValueChange={mudou} />);

    expect(screen.getByLabelText('Inicio')).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));
    fireEvent.click(screen.getByRole('option', { name: '14:30' }));

    expect(mudou).toHaveBeenLastCalledWith('14:30');
  });

  it('oferece so as horas dentro da faixa', () => {
    render(<TimePicker label="Inicio" min={'08:00'} max={'18:00'} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));

    expect(screen.queryByRole('option', { name: '07:30' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: '08:00' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '18:00' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '18:30' })).not.toBeInTheDocument();
  });

  it('expoe erro de forma acessivel', () => {
    render(<TimePicker label="Inicio" error="Informe a hora." />);

    const campo = screen.getByLabelText('Inicio');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Informe a hora.');
  });

  it('oferece o dia inteiro, da meia-noite a ultima meia hora', () => {
    render(<TimePicker label="Inicio" />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));

    const horarios = screen.getAllByRole('option');
    expect(horarios).toHaveLength(48);
    expect(horarios[0]).toHaveTextContent('00:00');
    expect(horarios.at(-1)).toHaveTextContent('23:30');
    expect(screen.getByRole('option', { name: '23:00' })).toBeInTheDocument();
  });

  it('aceita a hora digitada no proprio painel', () => {
    const mudou = vi.fn();
    render(<TimePicker label="Inicio" onValueChange={mudou} />);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir seletor de hora' }));
    fireEvent.change(screen.getByLabelText('Horário em horas e minutos'), { target: { value: '2147' } });

    expect(mudou).toHaveBeenLastCalledWith('21:47');
  });

  describe('abertura controlável', () => {
    const gatilho = () => screen.getByRole('button', { name: 'Abrir seletor de hora' });

    it('abre de início com defaultOpen', () => {
      render(<TimePicker label="Inicio" defaultOpen />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(gatilho()).toHaveAttribute('aria-expanded', 'true');
    });

    it('avisa a abertura e o fechamento em cada via, sem controle', () => {
      const onOpenChange = vi.fn();
      render(<TimePicker label="Inicio" onOpenChange={onOpenChange} />);
      const campo = screen.getByLabelText('Inicio');

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
      fireEvent.click(screen.getAllByRole('option')[0]!);

      expect(onOpenChange.mock.calls).toEqual([[true], [false], [true], [false], [true], [false], [true], [false], [true], [false]]);
    });

    it('abre e fecha por open e devolve o foco ao botão', () => {
      const { rerender } = render(<TimePicker label="Inicio" open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<TimePicker label="Inicio" open />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(<TimePicker label="Inicio" open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(gatilho()).toHaveFocus();
    });

    it('controlado, só muda quando o produto atualiza open', () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(<TimePicker label="Inicio" onOpenChange={onOpenChange} open={false} />);

      fireEvent.click(gatilho());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<TimePicker label="Inicio" onOpenChange={onOpenChange} open />);
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

    function montar(props: Partial<React.ComponentProps<typeof TimePicker>> = {}) {
      render(<TimePicker label="Inicio" {...props} />);
      return screen.getByLabelText('Inicio') as HTMLInputElement;
    }

    function teclar(campo: HTMLInputElement, key: string, cursor: number) {
      campo.setSelectionRange(cursor, cursor);
      return fireEvent.keyDown(campo, { key });
    }

    it('aceita so numeros e os dois pontos', () => {
      const campo = montar();

      expect(fireEvent.keyDown(campo, { key: 'a' })).toBe(false);
      expect(fireEvent.keyDown(campo, { key: '/' })).toBe(false);
      expect(fireEvent.keyDown(campo, { key: '5' })).toBe(true);
      expect(fireEvent.keyDown(campo, { key: ':' })).toBe(true);

      fireEvent.change(campo, { target: { value: '1a2/' } });
      expect(campo).toHaveValue('12');
    });

    it('H da a hora atual exata, sem arredondar para o passo', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '09:00', onValueChange: mudou, step: 30 });

      expect(fireEvent.keyDown(campo, { key: 'H' })).toBe(false);

      expect(campo).toHaveValue('14:37');
      expect(mudou).toHaveBeenLastCalledWith('14:37');
    });

    it('+ e - mudam a hora com o cursor na hora e o minuto com o cursor no minuto', () => {
      const campo = montar({ defaultValue: '14:59' });

      teclar(campo, '+', 1);
      expect(campo).toHaveValue('15:59');

      teclar(campo, '+', 5);
      expect(campo).toHaveValue('16:00');

      teclar(campo, '-', 2);
      expect(campo).toHaveValue('15:00');

      teclar(campo, '-', 4);
      expect(campo).toHaveValue('14:59');
    });

    it('a virada e de relogio', () => {
      const campo = montar({ defaultValue: '23:10' });

      teclar(campo, '+', 0);
      expect(campo).toHaveValue('00:10');

      fireEvent.change(campo, { target: { value: '00:00' } });
      teclar(campo, '-', 5);
      expect(campo).toHaveValue('23:59');
    });

    it('mantem o cursor na parte alterada', () => {
      const campo = montar({ defaultValue: '14:30' });

      teclar(campo, '+', 4);
      teclar(campo, '+', campo.selectionStart ?? 0);

      expect(campo).toHaveValue('14:32');
    });

    it('com o campo vazio, + parte da hora atual', () => {
      const campo = montar();

      teclar(campo, '+', 0);

      expect(campo).toHaveValue('15:37');
    });

    it('o + do teclado numerico tambem age', () => {
      const campo = montar({ defaultValue: '10:00' });

      campo.setSelectionRange(1, 1);
      fireEvent.keyDown(campo, { key: '+', code: 'NumpadAdd' });

      expect(campo).toHaveValue('11:00');
    });

    it.each([
      ['8', '08:00'],
      ['14', '14:00'],
      ['830', '08:30'],
      ['1430', '14:30'],
    ])('ao sair, completa %s em %s', (digitado, esperado) => {
      const mudou = vi.fn();
      const campo = montar({ onValueChange: mudou });

      fireEvent.change(campo, { target: { value: digitado } });
      expect(mudou).not.toHaveBeenCalledWith(null);
      fireEvent.blur(campo);

      expect(campo).toHaveValue(esperado);
      expect(mudou).toHaveBeenLastCalledWith(esperado);
    });

    it('Enter completa o que foi digitado', () => {
      const campo = montar();

      fireEvent.change(campo, { target: { value: '8' } });
      fireEvent.keyDown(campo, { key: 'Enter' });

      expect(campo).toHaveValue('08:00');
    });

    it('nao apaga o valor enquanto a hora esta incompleta', () => {
      const mudou = vi.fn();
      const campo = montar({ defaultValue: '09:00', onValueChange: mudou });

      fireEvent.change(campo, { target: { value: '18:4' } });

      expect(mudou).not.toHaveBeenCalled();
    });

    it.each(['25', '1275'])('ao sair, %s e invalido', (digitado) => {
      const mudou = vi.fn();
      const aviso = vi.fn();
      const campo = montar({ defaultValue: '09:00', onInvalid: aviso, onValueChange: mudou });

      fireEvent.change(campo, { target: { value: digitado } });
      const texto = campo.value;
      fireEvent.blur(campo);

      expect(screen.getByRole('alert')).toHaveTextContent('Hora inválida.');
      expect(campo).toHaveAttribute('aria-invalid', 'true');
      expect(campo).toHaveValue(texto);
      expect(mudou).not.toHaveBeenCalled();
      expect(aviso).toHaveBeenCalledWith(texto);
    });

    it('recusa a hora fora dos limites e a mensagem some ao corrigir', () => {
      const mudou = vi.fn();
      const campo = montar({ max: '18:00', onValueChange: mudou });

      fireEvent.change(campo, { target: { value: '19:00' } });
      fireEvent.blur(campo);

      expect(screen.getByRole('alert')).toHaveTextContent('Hora fora do intervalo permitido.');
      expect(mudou).not.toHaveBeenCalled();

      fireEvent.change(campo, { target: { value: '17:00' } });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(mudou).toHaveBeenLastCalledWith('17:00');
    });

    it('o erro do produto prevalece', () => {
      const campo = montar({ error: 'Obrigatório' });

      fireEvent.change(campo, { target: { value: '25' } });
      fireEvent.blur(campo);

      expect(screen.getByRole('alert')).toHaveTextContent('Obrigatório');
    });
  });
});
