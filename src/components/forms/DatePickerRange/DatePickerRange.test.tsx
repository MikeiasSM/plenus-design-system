import { afterEach, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DatePickerRange, defaultDateRangeShortcuts, type DatePickerRangeProps } from '.';

function montar(props: Partial<DatePickerRangeProps> = {}) {
  render(<DatePickerRange label="Período" {...props} />);
  const gatilho = screen.getByRole('button', { name: 'Período' });
  gatilho.focus();
  return gatilho;
}

const dia = (nome: string) => screen.getByRole('button', { name: nome });

describe('DatePickerRange', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 2, 15, 12) });
  });

  afterEach(() => vi.useRealTimers());

  it('mostra o texto de apoio e abre o painel pelo gatilho', () => {
    const gatilho = montar();

    expect(gatilho).toHaveTextContent('Selecione o período');
    expect(gatilho).toHaveAttribute('aria-haspopup', 'dialog');

    fireEvent.click(gatilho);

    expect(gatilho).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog', { name: 'Período de Período' })).toBeInTheDocument();
  });

  it('escolhe o início e o fim, e só aplica ao confirmar', () => {
    const onValueChange = vi.fn();
    const gatilho = montar({ onValueChange });
    fireEvent.click(gatilho);

    fireEvent.click(dia('9 de março de 2026'));
    fireEvent.click(dia('13 de março de 2026'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(dia('11 de março de 2026')).toHaveClass(/rangeDay/);

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onValueChange).toHaveBeenCalledWith({ start: '2026-03-09', end: '2026-03-13' });
    expect(gatilho).toHaveTextContent('09/03/2026 – 13/03/2026');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('inverte as pontas quando o segundo dia vem antes do primeiro', () => {
    const onValueChange = vi.fn();
    fireEvent.click(montar({ onValueChange }));

    fireEvent.click(dia('13 de março de 2026'));
    fireEvent.click(dia('9 de março de 2026'));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onValueChange).toHaveBeenCalledWith({ start: '2026-03-09', end: '2026-03-13' });
  });

  it('não aplica com só o início escolhido', () => {
    fireEvent.click(montar());

    fireEvent.click(dia('9 de março de 2026'));

    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  });

  it('cancelar e Escape descartam o rascunho', () => {
    const onValueChange = vi.fn();
    const gatilho = montar({ onValueChange });

    fireEvent.click(gatilho);
    fireEvent.click(dia('9 de março de 2026'));
    fireEvent.click(dia('13 de março de 2026'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    fireEvent.click(gatilho);
    fireEvent.click(dia('9 de março de 2026'));
    fireEvent.click(dia('13 de março de 2026'));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(gatilho).toHaveTextContent('Selecione o período');
  });

  it('limpar e aplicar esvaziam o valor', () => {
    const onValueChange = vi.fn();
    const gatilho = montar({ defaultValue: { start: '2026-03-09', end: '2026-03-13' }, onValueChange });
    fireEvent.click(gatilho);

    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(gatilho).toHaveTextContent('Selecione o período');
  });

  it('controlado, só muda quando o produto atualiza o valor', () => {
    const gatilho = montar({ value: { start: '2026-03-01', end: '2026-03-02' } });
    fireEvent.click(gatilho);
    fireEvent.click(dia('9 de março de 2026'));
    fireEvent.click(dia('13 de março de 2026'));
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(gatilho).toHaveTextContent('01/03/2026 – 02/03/2026');
  });

  describe('atalhos', () => {
    it('sem a propriedade, não há atalho', () => {
      fireEvent.click(montar());

      expect(screen.queryByRole('button', { name: 'Hoje' })).not.toBeInTheDocument();
    });

    it('os do produto preenchem o rascunho com o dia da escolha e valem ao aplicar', () => {
      const onValueChange = vi.fn();
      fireEvent.click(
        montar({ onValueChange, shortcuts: [{ label: 'Quinzena', range: () => ({ start: '2026-03-01', end: '2026-03-15' }) }] }),
      );

      fireEvent.click(screen.getByRole('button', { name: 'Quinzena' }));

      expect(screen.getByRole('button', { name: 'Quinzena' })).toHaveAttribute('aria-pressed', 'true');
      expect(onValueChange).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

      expect(onValueChange).toHaveBeenCalledWith({ start: '2026-03-01', end: '2026-03-15' });
    });

    it.each([
      ['Hoje', '2026-03-15', '2026-03-15'],
      ['Ontem', '2026-03-14', '2026-03-14'],
      ['Últimos 7 dias', '2026-03-09', '2026-03-15'],
      ['Últimos 30 dias', '2026-02-14', '2026-03-15'],
      ['Este mês', '2026-03-01', '2026-03-31'],
      ['Mês passado', '2026-02-01', '2026-02-28'],
    ])('a lista pronta resolve "%s"', (nome, start, end) => {
      const onValueChange = vi.fn();
      fireEvent.click(montar({ onValueChange, shortcuts: defaultDateRangeShortcuts }));

      fireEvent.click(screen.getByRole('button', { name: nome }));
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

      expect(onValueChange).toHaveBeenCalledWith({ start, end });
    });

    it('o atalho fora de min e max fica desabilitado', () => {
      fireEvent.click(montar({ max: '2026-03-10', shortcuts: defaultDateRangeShortcuts }));

      expect(screen.getByRole('button', { name: 'Mês passado' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Este mês' })).toBeDisabled();
    });
  });

  it('leva o início e o fim ao formulário', () => {
    render(
      <form data-testid="formulario">
        <DatePickerRange defaultValue={{ start: '2026-03-09', end: '2026-03-13' }} endName="fim" startName="inicio" />
      </form>,
    );

    const dados = new FormData(screen.getByTestId('formulario') as HTMLFormElement);

    expect(dados.get('inicio')).toBe('2026-03-09');
    expect(dados.get('fim')).toBe('2026-03-13');
  });
});
