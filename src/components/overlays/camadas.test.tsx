import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../actions/Button';
import { Toolbar } from '../actions/Toolbar';
import { ComboBox } from '../forms/ComboBox';
import { DatePicker } from '../forms/DatePicker';
import { DatePickerRange } from '../forms/DatePickerRange';
import { DateTimePicker } from '../forms/DateTimePicker';
import { Select } from '../forms/Select';
import { TimePicker } from '../forms/TimePicker';
import { Menu } from './Menu';
import { Popover } from './Popover';
import { Tooltip } from './Tooltip';

const tipos = [
  { value: 'nota', label: 'Nota' },
  { value: 'recibo', label: 'Recibo' },
];

// O react-aria põe `z-index: 100000` no estilo do painel; a camada passa a vir do token, depois dele.
const PAINEL = 'var(--pl-z-popover)';

describe('camadas dos painéis ancorados', () => {
  it('Popover usa --pl-z-popover', () => {
    function Tela() {
      const gatilho = useRef<HTMLButtonElement>(null);

      return (
        <>
          <Button ref={gatilho}>Filtros</Button>
          <Popover aria-label="Painel" open style={{ zIndex: 1 }} triggerRef={gatilho}>
            <Button>Aplicar</Button>
          </Popover>
        </>
      );
    }

    render(<Tela />);

    expect(screen.getByRole('dialog', { name: 'Painel' }).style.zIndex).toBe(PAINEL);
  });

  it('Menu usa --pl-z-popover, também com header', () => {
    render(
      <Menu header="Ana" items={[{ key: 'editar', label: 'Editar' }]} label="Ações" open>
        <Button>Ações</Button>
      </Menu>,
    );

    expect((screen.getByRole('menu').parentElement as HTMLElement).style.zIndex).toBe(PAINEL);
  });

  it('Menu sem header usa --pl-z-popover', () => {
    render(
      <Menu items={[{ key: 'editar', label: 'Editar' }]} label="Ações" open>
        <Button>Ações</Button>
      </Menu>,
    );

    expect(screen.getByRole('menu').style.zIndex).toBe(PAINEL);
  });

  it.each([
    ['Select', () => <Select label="Tipo" options={tipos} />],
    ['ComboBox', () => <ComboBox label="Tipo" options={tipos} />],
  ])('a lista do %s usa --pl-z-popover', (_nome, Campo) => {
    render(<Campo />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Tipo' }));

    const lista = screen.getByRole('listbox');
    const painel = lista.closest<HTMLElement>('[style*="z-index"]');

    expect(painel?.style.zIndex).toBe(PAINEL);
  });

  it.each([
    ['DatePicker', () => <DatePicker label="Quando" />, 'Abrir calendário'],
    ['DateTimePicker', () => <DateTimePicker label="Quando" />, 'Abrir calendário'],
    ['TimePicker', () => <TimePicker label="Quando" />, 'Abrir seletor de hora'],
  ])('o painel do %s usa --pl-z-popover', (_nome, Campo, abrir) => {
    render(<Campo />);
    fireEvent.click(screen.getByRole('button', { name: abrir }));

    expect(screen.getByRole('dialog').style.zIndex).toBe(PAINEL);
  });

  it('o painel do DatePickerRange usa --pl-z-popover', () => {
    render(<DatePickerRange label="Período" />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Período' }));

    expect(screen.getByRole('dialog', { name: 'Período de Período' }).style.zIndex).toBe(PAINEL);
  });

  it('a Toolbar ancorada usa --pl-z-popover', () => {
    function Editor() {
      const paragrafo = useRef<HTMLTextAreaElement>(null);

      return (
        <>
          <textarea aria-label="Parágrafo" ref={paragrafo} />
          <Toolbar anchorRef={paragrafo} label="Bloco">
            <Button>Negrito</Button>
          </Toolbar>
        </>
      );
    }

    render(<Editor />);

    expect(screen.getByRole('toolbar', { name: 'Bloco' }).style.zIndex).toBe(PAINEL);
  });

  it('o Tooltip fica na camada das dicas, e nunca abaixo dos painéis', () => {
    render(
      <Tooltip content="Ajuda">
        <button type="button">Alvo</button>
      </Tooltip>,
    );
    fireEvent.keyDown(document.body, { key: 'Tab' });
    act(() => screen.getByRole('button', { name: 'Alvo' }).focus());

    expect(screen.getByRole('tooltip').style.zIndex).toBe('max(var(--pl-z-tooltip), var(--pl-z-popover))');
  });
});
