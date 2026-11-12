import { useState, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ComboBox } from '../../forms/ComboBox/ComboBox';
import { DatePicker } from '../../forms/DatePicker/DatePicker';
import { DatePickerRange } from '../../forms/DatePickerRange/DatePickerRange';
import { DateTimePicker } from '../../forms/DateTimePicker/DateTimePicker';
import { Select } from '../../forms/Select/Select';
import { TimePicker } from '../../forms/TimePicker/TimePicker';
import { DataGrid, type DataGridColumn } from '../../data-display/DataGrid';
import { SortableList } from '../../data-display/SortableList/SortableList';
import { ChartTooltip } from '../../charts/ChartTooltip/ChartTooltip';
import { AppShell } from '../../navigation/AppShell/AppShell';
import { Menu } from '../Menu/Menu';
import { SidePanel } from './SidePanel';

const opcoes = [
  { label: 'São Paulo', value: 'sp' },
  { label: 'Rio de Janeiro', value: 'rj' },
];

function DentroDoPainel({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(true);

  return (
    <SidePanel onOpenChange={setAberto} open={aberto} title="Filtros">
      {children}
    </SidePanel>
  );
}

// Fechado, o painel continua no DOM, mas inerte.
const painelAberto = () => document.querySelector('aside')?.hasAttribute('inert') === false;

/** O Escape vai ao elemento com o foco, como no navegador. */
function escape() {
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
}

interface Pedido {
  id: string;
  cliente: string;
}

const colunas: DataGridColumn<Pedido>[] = [
  { id: 'id', header: 'Nº' },
  { editable: true, filter: 'text', id: 'cliente', header: 'Cliente' },
];

const grade = (
  <DataGrid columns={colunas} getRowId={(pedido) => pedido.id} label="Pedidos" rows={[{ cliente: 'Atacado Sul', id: 'P-1' }]} />
);

const cabecalho = () => screen.getByRole('columnheader', { name: /^Cliente/ });

interface Camada {
  nome: string;
  montar: () => ReactNode;
  abrir: () => void;
  aberta: () => boolean;
}

const camadas: Camada[] = [
  {
    nome: 'ComboBox',
    montar: () => <ComboBox label="Cidade" options={opcoes} />,
    abrir: () => {
      const campo = screen.getByRole('combobox');
      campo.focus();
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
    },
    aberta: () => screen.queryByRole('listbox') !== null,
  },
  {
    nome: 'ComboBox múltiplo',
    montar: () => <ComboBox label="Cidades" multiple options={opcoes} />,
    abrir: () => {
      const campo = screen.getByRole('combobox');
      campo.focus();
      fireEvent.keyDown(campo, { key: 'ArrowDown' });
    },
    aberta: () => screen.queryByRole('listbox') !== null,
  },
  {
    nome: 'Select',
    montar: () => <Select label="Forma" options={opcoes} />,
    abrir: () => fireEvent.click(screen.getByRole('combobox')),
    aberta: () => screen.queryByRole('listbox') !== null,
  },
  {
    nome: 'DatePicker',
    montar: () => <DatePicker label="Vencimento" />,
    abrir: () => fireEvent.click(screen.getByRole('button', { name: 'Abrir calendário' })),
    aberta: () => screen.queryByRole('dialog') !== null,
  },
  {
    nome: 'DatePickerRange',
    montar: () => <DatePickerRange label="Período" />,
    abrir: () => fireEvent.click(screen.getByRole('combobox', { name: 'Período' })),
    aberta: () => screen.queryByRole('dialog') !== null,
  },
  {
    nome: 'TimePicker',
    montar: () => <TimePicker label="Início" />,
    abrir: () => fireEvent.click(screen.getByRole('button', { name: /Abrir/ })),
    aberta: () => screen.queryByRole('dialog') !== null,
  },
  {
    nome: 'DateTimePicker',
    montar: () => <DateTimePicker label="Agendamento" />,
    abrir: () => fireEvent.click(screen.getByRole('button', { name: /Abrir/ })),
    aberta: () => screen.queryByRole('dialog') !== null,
  },
  {
    nome: 'Menu',
    montar: () => (
      <Menu items={[{ key: 'editar', label: 'Editar' }]} label="Ações">
        <button type="button">Ações</button>
      </Menu>
    ),
    abrir: () => {
      const gatilho = screen.getByRole('button', { name: 'Ações' });
      gatilho.focus();
      fireEvent.click(gatilho);
    },
    aberta: () => screen.queryByRole('menu') !== null,
  },
  {
    nome: 'DataGrid, filtro da coluna',
    montar: () => grade,
    abrir: () => {
      cabecalho().focus();
      fireEvent.keyDown(cabecalho(), { key: 'ArrowDown', altKey: true });
    },
    aberta: () => screen.queryByRole('dialog', { name: 'Filtro de Cliente' }) !== null,
  },
  {
    nome: 'DataGrid, menu da coluna',
    montar: () => grade,
    abrir: () => fireEvent.click(screen.getByRole('button', { name: 'Menu da coluna Cliente' })),
    aberta: () => screen.queryByRole('menu', { name: 'Menu da coluna Cliente' }) !== null,
  },
  {
    nome: 'DataGrid, edição de célula',
    montar: () => grade,
    abrir: () => {
      const celula = screen.getByRole('gridcell', { name: 'Atacado Sul' });
      celula.focus();
      fireEvent.keyDown(celula, { key: 'Enter' });
    },
    aberta: () => screen.queryByRole('textbox', { name: /Cliente/ }) !== null,
  },
  {
    nome: 'ChartTooltip ancorado',
    montar: () => (
      <ChartTooltip anchor={{ x: 120, y: 90 }} rows={[{ color: 'red', label: 'Prazo', values: [1] }]} title="Distribuição">
        <button type="button">marca</button>
      </ChartTooltip>
    ),
    abrir: () => screen.getByRole('button', { name: 'marca' }).focus(),
    aberta: () => screen.queryByText('Distribuição') !== null,
  },
  {
    nome: 'SortableList arrastando',
    montar: () => (
      <SortableList items={[{ key: 'a', title: 'Título' }, { key: 'b', title: 'Parágrafo' }]} label="Estrutura" onReorder={() => {}} />
    ),
    abrir: () => {
      const alca = screen.getByRole('button', { name: 'Reordenar Título' });
      alca.focus();
      // O jsdom não tem PointerEvent nem captura de ponteiro.
      window.PointerEvent = class extends MouseEvent {
        pointerId = 1;
      } as typeof PointerEvent;
      alca.setPointerCapture = vi.fn();
      fireEvent.pointerDown(alca, { button: 0, pointerId: 1 });
    },
    aberta: () => document.querySelector('[class*="dragging"]') !== null,
  },
  {
    nome: 'AppShell.Account aberta',
    montar: () => (
      <AppShell>
        <AppShell.Navigation>
          <AppShell.Rail>
            <AppShell.RailItem current icon="V" label="Vendas" />
          </AppShell.Rail>
          <AppShell.Panel
            account={
              <AppShell.Account avatar="RM" description="Roman Mecânica" name="Suporte">
                <AppShell.PanelItem label="Favoritos" />
              </AppShell.Account>
            }
            label="Vendas"
          >
            <AppShell.PanelItem label="Pedidos" />
          </AppShell.Panel>
        </AppShell.Navigation>
      </AppShell>
    ),
    abrir: () => {
      const gatilho = screen.getByRole('button', { name: /Suporte/ });
      gatilho.focus();
      fireEvent.click(gatilho);
    },
    aberta: () => screen.getByRole('button', { name: /Suporte/ }).getAttribute('aria-expanded') === 'true',
  },
];

describe('camadas de dentro do SidePanel', () => {
  afterEach(() => Reflect.deleteProperty(window, 'PointerEvent'));

  it.each(camadas)('$nome: o Escape fecha só a camada, e o próximo fecha o painel', ({ abrir, aberta, montar }) => {
    render(<DentroDoPainel>{montar()}</DentroDoPainel>);
    abrir();
    expect(aberta()).toBe(true);

    escape();

    expect(aberta()).toBe(false);
    expect(painelAberto()).toBe(true);

    // O foco devolvido à origem da camada é do navegador; aqui o Escape vai direto ao painel.
    fireEvent.keyDown(document.querySelector('aside')!, { key: 'Escape' });

    expect(painelAberto()).toBe(false);
  });
});
