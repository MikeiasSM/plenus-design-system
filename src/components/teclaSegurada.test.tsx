import { act, fireEvent, render, screen } from '@testing-library/react';
import { Accordion } from './data-display/Accordion';
import { ButtonTile } from './actions/ButtonTile';
import { ChartBar } from './charts/ChartBar';
import { DataGrid, type DataGridColumn } from './data-display/DataGrid';
import { Tag } from './data-display/Tag';
import { ToastRegion } from './feedback/Toast';
import { dismissToast, showToast } from './feedback/Toast/toastStore';
import { ComboBox } from './forms/ComboBox';
import { DatePicker } from './forms/DatePicker';
import { Select } from './forms/Select';
import { IconFile } from './icons';
import { Button } from './actions/Button';
import { Menu } from './overlays/Menu';

const REPETIDO = { key: 'Enter', repeat: true };

describe('tecla segurada nos elementos feitos à mão', () => {
  it('Menu: o item cancela o Enter e o Espaço repetidos', () => {
    render(
      <Menu items={[{ key: 'duplicar', label: 'Duplicar', onSelect: vi.fn() }]} label="Ações">
        <Button>Ações</Button>
      </Menu>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ações' }));
    const item = screen.getByRole('menuitem', { name: 'Duplicar' });

    expect(fireEvent.keyDown(item, REPETIDO)).toBe(false);
    expect(fireEvent.keyDown(item, { key: ' ', repeat: true })).toBe(false);
    expect(fireEvent.keyDown(item, { key: 'Enter' })).toBe(true);
  });

  it('Menu: o gatilho que não é um Button também cancela o Enter repetido', () => {
    render(
      <Menu items={[{ key: 'a', label: 'A' }]} label="Ações">
        <span role="button" tabIndex={0}>
          Ações
        </span>
      </Menu>,
    );

    expect(fireEvent.keyDown(screen.getByRole('button', { name: 'Ações' }), REPETIDO)).toBe(false);
  });

  it('Select: a lista não escolhe e o gatilho não abre com o Enter repetido', () => {
    const onValueChange = vi.fn();
    render(<Select label="Forma" onValueChange={onValueChange} options={[{ value: 'pix', label: 'Pix' }]} />);
    const gatilho = screen.getByRole('combobox', { name: 'Forma' });

    fireEvent.keyDown(gatilho, REPETIDO);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.keyDown(gatilho, { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('listbox'), REPETIDO);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('ComboBox: o campo não escolhe com o Enter repetido', () => {
    const onValueChange = vi.fn();
    render(
      <ComboBox
        label="Cidade"
        onValueChange={onValueChange}
        options={[
          { value: 'sp', label: 'São Paulo' },
          { value: 'rj', label: 'Rio' },
        ]}
      />,
    );
    const campo = screen.getByRole('combobox', { name: 'Cidade' });

    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    expect(fireEvent.keyDown(campo, REPETIDO)).toBe(false);

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('DatePicker: o dia em foco não é escolhido pelo Enter repetido', () => {
    const onValueChange = vi.fn();
    render(<DatePicker label="Vencimento" onValueChange={onValueChange} value="2026-03-09" />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' }));
    const dia = screen.getByRole('button', { name: '9 de março de 2026' });
    act(() => dia.focus());
    fireEvent.keyDown(dia, { key: 'ArrowRight' });

    expect(fireEvent.keyDown(screen.getByRole('button', { name: '10 de março de 2026' }), REPETIDO)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onValueChange).not.toHaveBeenCalledWith('2026-03-10');
  });

  it('DatePicker: o gatilho do calendário cancela o Enter repetido', () => {
    render(<DatePicker label="Vencimento" />);

    expect(fireEvent.keyDown(screen.getByRole('button', { name: 'Abrir calendário' }), REPETIDO)).toBe(false);
  });

  it('gráfico: a marca não é ativada pelo Enter nem pelo Espaço repetidos', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 640 });
    const onMarkClick = vi.fn();
    render(<ChartBar categories={['A', 'B']} onMarkClick={onMarkClick} series={[{ label: 'S', values: [1, 2] }]} title="Barras" />);
    const marca = screen.getAllByRole('button', { name: /S, A/ })[0];
    act(() => marca.focus());

    fireEvent.keyDown(marca, { key: 'Enter' });
    fireEvent.keyDown(marca, REPETIDO);
    fireEvent.keyDown(marca, { key: ' ', repeat: true });

    expect(onMarkClick).toHaveBeenCalledTimes(1);
  });

  it('DataGrid: o Enter repetido na linha não repete a ação', () => {
    type Linha = { id: string; nome: string };
    const colunas: DataGridColumn<Linha>[] = [{ id: 'nome', header: 'Nome' }];
    const onRowActivate = vi.fn();
    render(
      <DataGrid
        columns={colunas}
        getRowId={(linha) => linha.id}
        label="Pedidos"
        onRowActivate={onRowActivate}
        rowClickAction="activate"
        rows={[{ id: '1', nome: 'Casa Norte' }]}
      />,
    );
    const celula = screen.getByRole('gridcell', { name: 'Casa Norte' });

    fireEvent.keyDown(celula, { key: 'Enter' });
    fireEvent.keyDown(celula, REPETIDO);
    fireEvent.keyDown(celula, REPETIDO);

    expect(onRowActivate).toHaveBeenCalledTimes(1);
  });

  it('botões nativos de alternar e remover cancelam o Enter repetido', () => {
    render(
      <>
        <ButtonTile icon={<IconFile />} label="Arquivo" />
        <Tag defaultSelected onRemove={vi.fn()}>
          Etiqueta
        </Tag>
        <Accordion items={[{ key: 'a', label: 'Envio', content: 'Regras' }]} />
      </>,
    );

    for (const nome of ['Arquivo', 'Etiqueta', /Remover/, /Envio/]) {
      expect(fireEvent.keyDown(screen.getByRole('button', { name: nome }), REPETIDO)).toBe(false);
    }
  });

  it('Toast: o botão de fechar cancela o Enter repetido', () => {
    let id = '';
    render(<ToastRegion />);
    act(() => {
      id = showToast({ duration: null, title: 'Aviso' });
    });

    expect(fireEvent.keyDown(screen.getByRole('button', { name: 'Fechar aviso' }), REPETIDO)).toBe(false);
    act(() => dismissToast(id));
  });
});
