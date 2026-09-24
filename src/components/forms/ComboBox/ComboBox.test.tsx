import { fireEvent, render, screen } from '@testing-library/react';
import { ComboBox, type ComboBoxOption } from './ComboBox';

const opcoes: ComboBoxOption[] = [
  { value: 'sp', label: 'Sao Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Belo Horizonte' },
  { value: 'gyn', label: 'Goiânia' },
];

function montar(props: Partial<React.ComponentProps<typeof ComboBox>> = {}) {
  render(<ComboBox label="Cidade" options={opcoes} {...props} />);
  return screen.getByRole('combobox', { name: 'Cidade' });
}

describe('ComboBox', () => {
  it('anuncia a autocompletar por lista e comeca fechado', () => {
    const campo = montar();

    expect(campo).toHaveAttribute('aria-autocomplete', 'list');
    expect(campo).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('filtra pelo texto digitado, ignorando caixa', () => {
    const campo = montar();
    fireEvent.change(campo, { target: { value: 'rio' } });

    expect(screen.getByRole('option', { name: 'Rio de Janeiro' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sao Paulo' })).not.toBeInTheDocument();
  });

  it('filtra sem acento o texto acentuado', () => {
    const campo = montar();

    fireEvent.change(campo, { target: { value: 'goiania' } });

    expect(screen.getByRole('option', { name: 'Goiânia' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Rio de Janeiro' })).not.toBeInTheDocument();
  });

  it('avisa quando nada corresponde', () => {
    fireEvent.change(montar(), { target: { value: 'curitiba' } });

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
  });

  it('escolhe pelo clique, preenche o campo e reporta o valor', () => {
    const onValueChange = vi.fn();
    const campo = montar({ onValueChange });
    fireEvent.change(campo, { target: { value: 'belo' } });
    fireEvent.click(screen.getByRole('option', { name: 'Belo Horizonte' }));

    expect(onValueChange).toHaveBeenCalledWith('mg');
    expect(campo).toHaveValue('Belo Horizonte');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('abre e percorre a lista completa pelo teclado', () => {
    const campo = montar();
    fireEvent.keyDown(campo, { key: 'ArrowDown' });

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Sao Paulo' }).id);

    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    expect(campo).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Rio de Janeiro' }).id);
  });

  it('confirma com Enter e limpa o filtro com Escape', () => {
    const onValueChange = vi.fn();
    const campo = montar({ onValueChange });

    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('sp');

    fireEvent.change(campo, { target: { value: 'xyz' } });
    fireEvent.keyDown(campo, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(campo).toHaveValue('Sao Paulo');
  });

  it('delega a busca ao produto sem filtrar por conta propria', () => {
    const buscar = vi.fn();
    const campo = montar({ onSearch: buscar });

    fireEvent.change(campo, { target: { value: 'goi' } });

    expect(buscar).toHaveBeenCalledWith('goi');
    expect(screen.getByRole('option', { name: 'Rio de Janeiro' })).toBeInTheDocument();
  });

  it('anuncia o carregamento da busca externa', () => {
    const campo = montar({ onSearch: vi.fn(), options: [], loading: true });

    fireEvent.click(campo);

    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Carregando')).toBeInTheDocument();
    expect(screen.queryByText('Nenhum resultado')).not.toBeInTheDocument();
  });
});
