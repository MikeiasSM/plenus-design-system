import { addItem, newCondition, removeItem, replaceItem, setLogic } from './filterBuilderModel';
import type { DataGridFilter } from './filterModel';

const column = { id: 'city', header: 'Cidade', filter: 'text' as const };
const empty: DataGridFilter = { logic: 'and', conditions: [] };

describe('filterBuilderModel', () => {
  it('starts a condition on the first operator of the column', () => {
    expect(newCondition(column)).toEqual({ columnId: 'city', operator: 'contains' });
  });

  it('adds conditions and nested groups at any depth', () => {
    const withGroup = addItem(empty, [], { logic: 'or', conditions: [] });
    const nested = addItem(withGroup, [0], newCondition(column));

    expect(nested).toEqual({
      logic: 'and',
      conditions: [{ logic: 'or', conditions: [{ columnId: 'city', operator: 'contains' }] }],
    });
    expect(empty.conditions).toHaveLength(0);
  });

  it('replaces one condition and the logic of one group, leaving the rest', () => {
    const start = addItem(addItem(empty, [], newCondition(column)), [], { logic: 'and', conditions: [newCondition(column)] });
    const changed = replaceItem(start, [1, 0], { columnId: 'city', operator: 'contains', value: 'Rio' });

    expect((changed.conditions[1] as DataGridFilter).conditions[0]).toMatchObject({ value: 'Rio' });
    expect(changed.conditions[0]).toEqual(start.conditions[0]);
    expect(setLogic(changed, [1], 'or').conditions[1]).toMatchObject({ logic: 'or' });
    expect(setLogic(changed, [], 'or').logic).toBe('or');
  });

  it('removes a condition and the group it leaves empty', () => {
    const start = addItem(addItem(empty, [], newCondition(column)), [], { logic: 'or', conditions: [newCondition(column)] });

    expect(removeItem(start, [0]).conditions).toHaveLength(1);
    expect(removeItem(start, [1, 0]).conditions).toHaveLength(1);
    expect(removeItem(start, [1, 0]).conditions[0]).not.toHaveProperty('conditions');
  });
});
