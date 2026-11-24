import { render, screen } from '@testing-library/react';
import { Meter } from './Meter';

describe('Meter', () => {
  it('exposes the measure through meter semantics, named by the visible label', () => {
    render(<Meter label="Armazenamento" value={40} />);

    const meter = screen.getByRole('meter', { name: 'Armazenamento' });
    expect(meter).toHaveAttribute('aria-valuenow', '40');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuetext', '40%');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Armazenamento')).toBeVisible();
  });

  it('writes the default value as the percentage of the range, below the track and in aria-valuetext', () => {
    render(<Meter label="Cota" value={7} min={2} max={12} />);

    const meter = screen.getByRole('meter', { name: 'Cota' });
    expect(meter).toHaveAttribute('aria-valuemin', '2');
    expect(meter).toHaveAttribute('aria-valuemax', '12');
    expect(meter).toHaveAttribute('aria-valuetext', '50%');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('formats the default percentage in the given locale', () => {
    render(<Meter label="Cota" value={12.5} locale="en-US" />);

    expect(screen.getByRole('meter', { name: 'Cota' })).toHaveAttribute('aria-valuetext', '13%');
  });

  it('takes valueLabel as a string', () => {
    render(<Meter label="Armazenamento" value={7.2} max={10} valueLabel="7,2 de 10 GB" />);

    expect(screen.getByRole('meter', { name: 'Armazenamento' })).toHaveAttribute('aria-valuetext', '7,2 de 10 GB');
    expect(screen.getByText('7,2 de 10 GB')).toBeInTheDocument();
  });

  it('takes valueLabel as a function of the clamped value', () => {
    const valueLabel = vi.fn((value: number) => `${value} de 5`);
    render(<Meter label="Nota" value={7} max={5} valueLabel={valueLabel} />);

    expect(valueLabel).toHaveBeenCalledWith(5);
    expect(screen.getByRole('meter', { name: 'Nota' })).toHaveAttribute('aria-valuetext', '5 de 5');
    expect(screen.getByText('5 de 5')).toBeInTheDocument();
  });

  it('clamps the value between min and max', () => {
    const { rerender } = render(<Meter label="Uso" value={180} />);
    expect(screen.getByRole('meter', { name: 'Uso' })).toHaveAttribute('aria-valuenow', '100');

    rerender(<Meter label="Uso" value={-20} min={10} />);
    const meter = screen.getByRole('meter', { name: 'Uso' });
    expect(meter).toHaveAttribute('aria-valuenow', '10');
    expect(meter).toHaveAttribute('aria-valuetext', '0%');
  });

  it('stays in the brand tone without low, high or optimum', () => {
    render(<Meter label="Uso" value={95} />);

    expect(screen.getByRole('meter', { name: 'Uso' })).toHaveAttribute('data-tone', 'brand');
  });

  it.each([
    [2, 'success'],
    [5, 'success'],
    [6, 'warning'],
    [8, 'warning'],
    [9, 'danger'],
  ])('with the optimum below low, %s reads as %s', (value, tone) => {
    render(<Meter label="Armazenamento" value={value} max={10} low={5} high={8} optimum={0} />);

    expect(screen.getByRole('meter', { name: 'Armazenamento' })).toHaveAttribute('data-tone', tone);
  });

  it.each([
    [4.8, 'success'],
    [4.5, 'success'],
    [3.5, 'warning'],
    [3, 'warning'],
    [2.9, 'danger'],
  ])('with the optimum above high, %s reads as %s', (value, tone) => {
    render(<Meter label="Nota" value={value} max={5} low={3} high={4.5} optimum={5} />);

    expect(screen.getByRole('meter', { name: 'Nota' })).toHaveAttribute('data-tone', tone);
  });

  it.each([
    [20, 'warning'],
    [50, 'success'],
    [80, 'warning'],
  ])('with the optimum between low and high, %s reads as %s and never as danger', (value, tone) => {
    render(<Meter label="Umidade" value={value} low={40} high={60} optimum={50} />);

    expect(screen.getByRole('meter', { name: 'Umidade' })).toHaveAttribute('data-tone', tone);
  });

  it('puts a missing optimum in the middle of the range', () => {
    const { rerender } = render(<Meter label="Uso" value={50} low={30} high={70} />);
    expect(screen.getByRole('meter', { name: 'Uso' })).toHaveAttribute('data-tone', 'success');

    rerender(<Meter label="Uso" value={90} low={30} high={70} />);
    expect(screen.getByRole('meter', { name: 'Uso' })).toHaveAttribute('data-tone', 'warning');
  });

  it('reads only high as a ceiling when the optimum is low', () => {
    const { rerender } = render(<Meter label="Uso" value={60} high={80} optimum={0} />);
    expect(screen.getByRole('meter', { name: 'Uso' })).toHaveAttribute('data-tone', 'success');

    rerender(<Meter label="Uso" value={90} high={80} optimum={0} />);
    expect(screen.getByRole('meter', { name: 'Uso' })).toHaveAttribute('data-tone', 'warning');
  });

  it('takes native props and className on the meter element', () => {
    render(<Meter className="cota" data-testid="cota" label="Cota" value={30} />);

    const meter = screen.getByTestId('cota');
    expect(meter).toHaveAttribute('role', 'meter');
    expect(meter.className).toContain('cota');
  });
});
