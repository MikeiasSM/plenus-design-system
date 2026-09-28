// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { useRef } from 'react';
import { Dialog } from './Dialog';
import { Menu } from './Menu';
import { Popover } from './Popover';

function PopoverAberto() {
  const gatilho = useRef<HTMLButtonElement>(null);

  return (
    <Popover aria-label="Filtros" onClose={() => undefined} open triggerRef={gatilho}>
      Conteudo
    </Popover>
  );
}

describe('overlay aberto no servidor', () => {
  it('renderiza sem `document`, e o portal nasce na hidratacao', () => {
    expect(() => renderToString(<Dialog onClose={() => undefined} open title="Cadastro" />)).not.toThrow();
    expect(() => renderToString(<PopoverAberto />)).not.toThrow();
    expect(() =>
      renderToString(
        <Menu defaultOpen items={[{ key: 'editar', label: 'Editar' }]} label="Acoes">
          <button type="button">Acoes</button>
        </Menu>,
      ),
    ).not.toThrow();
  });
});
