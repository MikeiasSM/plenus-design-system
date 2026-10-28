import { DataGridScrollRoot } from './scrollRoot';

function placed(top: number) {
  const element = document.createElement('div');
  element.dataset.anchor = '';
  element.getBoundingClientRect = () => ({ top }) as DOMRect;
  return element;
}

function setup() {
  const scroller = document.createElement('div');
  const rows = [placed(-40), placed(10), placed(50)];
  rows.forEach((row) => scroller.append(row));
  scroller.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  document.body.append(scroller);

  const onHeightsChange = vi.fn();
  const root = new DataGridScrollRoot(onHeightsChange);
  root.scroller = scroller;
  scroller.scrollTop = 100;

  const move = (row: HTMLElement, top: number) => {
    row.getBoundingClientRect = () => ({ top }) as DOMRect;
  };

  return { move, onHeightsChange, root, rows, scroller };
}

describe('DataGridScrollRoot', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps the first visible row in place when a height above it changes', () => {
    const { move, onHeightsChange, root, rows, scroller } = setup();

    root.measure('a', 300, 240);
    move(rows[1], 70);
    root.restoreAnchor();

    expect(onHeightsChange).toHaveBeenCalled();
    expect(scroller.scrollTop).toBe(160);
  });

  it('keeps the first anchor through a change that climbs level by level', () => {
    const { move, root, rows, scroller } = setup();

    root.measure('a/b', 300, 240);
    root.restoreAnchor();
    move(rows[1], 90);
    root.measure('a', 400, 240);
    move(rows[1], 90);
    root.restoreAnchor();

    expect(scroller.scrollTop).toBe(180);
  });

  it('does not undo a scroll of the person, nor correct after a change of order', () => {
    const { move, root, rows, scroller } = setup();

    root.measure('a', 300, 240);
    scroller.scrollTop = 140;
    root.scrolled();
    move(rows[1], 70);
    root.restoreAnchor();
    expect(scroller.scrollTop).toBe(140);

    root.measure('b', 300, 240);
    root.releaseAnchor();
    move(rows[1], 130);
    root.restoreAnchor();
    expect(scroller.scrollTop).toBe(140);
  });

  it('ignores a measure equal to the one it keeps', () => {
    const { onHeightsChange, root } = setup();

    root.measure('a', 240, 240);

    expect(onHeightsChange).not.toHaveBeenCalled();
  });
});
