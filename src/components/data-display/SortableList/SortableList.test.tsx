import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SortableList, type SortableListItem } from './SortableList';
import styles from './SortableList.module.css';

const blocos: SortableListItem[] = [
  { excerpt: 'Como o editor funciona', key: 'titulo', title: 'Título' },
  { key: 'paragrafo', title: 'Parágrafo' },
  { key: 'citacao', level: 2, title: 'Citação' },
  { key: 'imagem', title: 'Imagem' },
];

function moverItem<T>(lista: readonly T[], de: number, para: number) {
  const copia = [...lista];
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item);
  return copia;
}

function Documento({ onReorder }: { onReorder?: (de: number, para: number) => void }) {
  const [itens, setItens] = useState(blocos);

  return (
    <SortableList
      defaultSelectedKey="paragrafo"
      items={itens}
      label="Estrutura"
      onReorder={(de, para) => {
        onReorder?.(de, para);
        setItens((atuais) => moverItem(atuais, de, para));
      }}
    />
  );
}

function linha(nome: string) {
  return screen.getByRole('row', { name: nome });
}

function titulos() {
  return screen.getAllByRole('row').map((row) => document.getElementById(row.getAttribute('aria-labelledby')!)?.textContent);
}

describe('SortableList', () => {
  it('e uma grade nomeada com uma unica parada de Tab, na linha escolhida', () => {
    render(<Documento />);

    expect(screen.getByRole('grid', { name: 'Estrutura' })).toBeInTheDocument();
    expect(linha('Parágrafo')).toHaveAttribute('aria-selected', 'true');
    expect(linha('Título')).toHaveAccessibleDescription('Como o editor funciona');
    expect(screen.getAllByRole('row').filter((row) => row.tabIndex === 0)).toEqual([linha('Parágrafo')]);
    expect(screen.getByRole('button', { name: 'Reordenar Imagem' })).toHaveAttribute('tabindex', '-1');
  });

  it('as setas, Home e End movem o foco e a escolha juntos', () => {
    const onSelectionChange = vi.fn();
    render(<SortableList items={blocos} label="Estrutura" onReorder={vi.fn()} onSelectionChange={onSelectionChange} />);

    act(() => linha('Título').focus());
    fireEvent.keyDown(linha('Título'), { key: 'ArrowDown' });
    expect(linha('Parágrafo')).toHaveFocus();
    expect(linha('Parágrafo')).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(linha('Parágrafo'), { key: 'End' });
    expect(linha('Imagem')).toHaveFocus();

    fireEvent.keyDown(linha('Imagem'), { key: 'Home' });
    expect(linha('Título')).toHaveFocus();
    expect(onSelectionChange.mock.calls).toEqual([['paragrafo'], ['imagem'], ['titulo']]);
  });

  it('controlada, so muda a escolha quando o produto aceita', () => {
    const onSelectionChange = vi.fn();
    render(
      <SortableList items={blocos} label="Estrutura" onReorder={vi.fn()} onSelectionChange={onSelectionChange} selectedKey={null} />,
    );

    fireEvent.click(screen.getByText('Imagem'));

    expect(onSelectionChange).toHaveBeenCalledWith('imagem');
    expect(screen.getAllByRole('row').every((row) => row.getAttribute('aria-selected') === 'false')).toBe(true);
  });

  it('o clique numa acao da linha nao escolhe a linha', () => {
    const onSelectionChange = vi.fn();
    const comAcao = blocos.map((bloco) => ({ ...bloco, actions: <button type="button">Excluir {bloco.title}</button> }));
    render(<SortableList items={comAcao} label="Estrutura" onReorder={vi.fn()} onSelectionChange={onSelectionChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Imagem' }));

    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('as setas para os lados percorrem a alca e as acoes, fora da ordem do Tab', () => {
    const comAcao = blocos.map((bloco) => ({ ...bloco, actions: <button type="button">Excluir {bloco.title}</button> }));
    render(<SortableList items={comAcao} label="Estrutura" onReorder={vi.fn()} />);
    const excluir = screen.getByRole('button', { name: 'Excluir Título' });

    act(() => linha('Título').focus());
    fireEvent.keyDown(linha('Título'), { key: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'Reordenar Título' })).toHaveFocus();

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(excluir).toHaveFocus();
    expect(excluir).toHaveAttribute('tabindex', '-1');

    fireEvent.keyDown(excluir, { key: 'ArrowLeft' });
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(linha('Título')).toHaveFocus();
  });

  it('Alt com as setas avisa onReorder, anuncia a posicao e mantem o foco no item', () => {
    const onReorder = vi.fn();
    render(<Documento onReorder={onReorder} />);

    act(() => linha('Parágrafo').focus());
    fireEvent.keyDown(linha('Parágrafo'), { altKey: true, key: 'ArrowDown' });

    expect(onReorder).toHaveBeenCalledWith(1, 2);
    expect(titulos()).toEqual(['Título', 'Citação', 'Parágrafo', 'Imagem']);
    expect(screen.getByRole('status')).toHaveTextContent('Movido para a posição 3 de 4');
    expect(linha('Parágrafo')).toHaveFocus();

    fireEvent.keyDown(linha('Título'), { altKey: true, key: 'ArrowUp' });
    expect(onReorder).toHaveBeenCalledTimes(1);
  });

  describe('arrasto pela alca', () => {
    // O jsdom nao tem PointerEvent nem captura de ponteiro.
    beforeEach(() => {
      window.PointerEvent = class extends MouseEvent {
        pointerId: number;

        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init);
          this.pointerId = init.pointerId ?? 0;
        }
      } as typeof PointerEvent;
      HTMLElement.prototype.setPointerCapture = vi.fn();
      // Linhas de 40px empilhadas: o meio da linha i fica em 40 * i + 20.
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
        const indice = [...(this.parentElement?.children ?? [])].indexOf(this);
        return { bottom: 40 * indice + 40, height: 40, left: 0, right: 200, top: 40 * indice, width: 200, x: 0, y: 40 * indice } as DOMRect;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      Reflect.deleteProperty(window, 'PointerEvent');
      Reflect.deleteProperty(HTMLElement.prototype, 'setPointerCapture');
    });

    it('mostra onde vai cair e, ao soltar, avisa onReorder', () => {
      const onReorder = vi.fn();
      render(<Documento onReorder={onReorder} />);
      const alca = screen.getByRole('button', { name: 'Reordenar Título' });

      fireEvent.pointerDown(alca, { button: 0, pointerId: 1 });
      fireEvent.pointerMove(alca, { clientY: 130, pointerId: 1 });
      expect(linha('Imagem')).toHaveClass(styles.dropBefore);

      fireEvent.pointerUp(alca, { pointerId: 1 });

      expect(onReorder).toHaveBeenCalledWith(0, 2);
      expect(screen.getByRole('status')).toHaveTextContent('Movido para a posição 3 de 4');
    });

    it('Esc cancela sem reordenar', () => {
      const onReorder = vi.fn();
      render(<Documento onReorder={onReorder} />);
      const alca = screen.getByRole('button', { name: 'Reordenar Título' });

      fireEvent.pointerDown(alca, { button: 0, pointerId: 1 });
      fireEvent.pointerMove(alca, { clientY: 150, pointerId: 1 });
      expect(linha('Imagem')).toHaveClass(styles.dropAfter);

      fireEvent.keyDown(document, { key: 'Escape' });
      fireEvent.pointerUp(alca, { pointerId: 1 });

      expect(onReorder).not.toHaveBeenCalled();
      expect(document.querySelector(`.${styles.dropBefore}, .${styles.dropAfter}`)).toBeNull();
    });
  });
});
