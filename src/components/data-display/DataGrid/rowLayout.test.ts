import { buildRowLayout, rowAt, totalHeight, visibleWindow } from './rowLayout';

describe('rowLayout', () => {
  const layout = buildRowLayout([40, 100, 40, 40, 40]);

  it('accumulates the heights into offsets', () => {
    expect(layout.offsets).toEqual([0, 40, 140, 180, 220, 260]);
    expect(totalHeight(layout)).toBe(260);
  });

  it('finds the row under a position', () => {
    expect(rowAt(layout, 0)).toBe(0);
    expect(rowAt(layout, 139)).toBe(1);
    expect(rowAt(layout, 140)).toBe(2);
    expect(rowAt(layout, 9999)).toBe(4);
  });

  it('draws the visible rows plus the overscan, within bounds', () => {
    expect(visibleWindow(layout, 150, 50, 1)).toEqual({ start: 1, end: 5 });
    expect(visibleWindow(layout, 0, 30, 0)).toEqual({ start: 0, end: 1 });
    expect(visibleWindow(buildRowLayout([]), 0, 300, 4)).toEqual({ start: 0, end: 0 });
  });
});
