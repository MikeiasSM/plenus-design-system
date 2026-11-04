import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../actions/Button';
import { ButtonIcon } from '../../actions/ButtonIcon';
import { SegmentedControl } from '../../forms/SegmentedControl';
import { Select } from '../../forms/Select';
import { IconFilter, IconPlus, IconTrash } from '../../icons';
import { Popover } from '../../overlays/Popover';
import { useDataGridContext } from './dataGridContext';
import { ConditionEditor, SetEditor, type DataGridFilterApplyMode } from './DataGridFilterPanel';
import {
  addItem,
  newCondition,
  removeItem,
  replaceItem,
  setLogic,
  type DataGridFilterBuilderColumn,
  type DataGridFilterPath,
} from './filterBuilderModel';
import {
  activeFilterOf,
  EMPTY_FILTER,
  isFilterGroup,
  operatorsOf,
  type DataGridFilter,
  type DataGridFilterCondition,
  type DataGridFilterLogic,
} from './filterModel';
import styles from './DataGrid.module.css';

/** Mesma espera do funil: no servidor, cada tecla seria uma consulta. */
const APPLY_DELAY = 250;

/** O que a parte lê da grade: as colunas que filtram, o filtro de agora e como aplicar. */
export interface DataGridFilterBuilderContext {
  applyMode: DataGridFilterApplyMode;
  columns: readonly DataGridFilterBuilderColumn[];
  filter: DataGridFilter;
  onApply: (next: DataGridFilter) => void;
  /** Valores do filtro por conjunto de uma coluna. */
  optionsOf: (columnId: string) => readonly string[];
}

export interface DataGridFilterBuilderProps {
  className?: string;
  label?: string;
}

function countConditions(group: DataGridFilter): number {
  return group.conditions.reduce<number>((sum, item) => sum + (isFilterGroup(item) ? countConditions(item) : 1), 0);
}

function nameOf(path: DataGridFilterPath) {
  return path.map((index) => index + 1).join('.');
}

/** Botão da barra que abre o construtor: condições de qualquer coluna, combinadas por E ou OU, em grupos. */
export function DataGridFilterBuilder({ className, label = 'Filtros' }: DataGridFilterBuilderProps) {
  const { filterBuilder } = useDataGridContext('DataGrid.FilterBuilder');
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const count = countConditions(activeFilterOf(filterBuilder.filter, filterBuilder.columns));

  return (
    <>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={className}
        ref={trigger}
        size="sm"
        variant={count > 0 ? 'soft' : 'secondary'}
        onClick={() => setOpen(!open)}
      >
        <IconFilter size={14} />
        {count > 0 ? `${label} (${count})` : label}
      </Button>
      <Popover
        aria-label="Construtor de filtros"
        className={styles.builderPopover}
        open={open}
        placement="bottom start"
        triggerRef={trigger}
        onOpenChange={setOpen}
      >
        <BuilderPanel context={filterBuilder} onClose={() => setOpen(false)} />
      </Popover>
    </>
  );
}

interface BuilderPanelProps {
  context: DataGridFilterBuilderContext;
  onClose: () => void;
}

/** O rascunho guarda as condições ainda sem valor; a grade só recebe o que já filtra. */
function BuilderPanel({ context, onClose }: BuilderPanelProps) {
  const { applyMode, columns, filter, onApply, optionsOf } = context;
  const [draft, setDraftState] = useState(filter);
  const [edited, setEdited] = useState(false);
  const built = useMemo(() => activeFilterOf(draft, columns), [draft, columns]);
  const builtKey = JSON.stringify(built);
  const pending = edited && applyMode === 'immediate' && builtKey !== JSON.stringify(activeFilterOf(filter, columns));
  const flush = useRef<(() => void) | null>(null);
  flush.current = pending ? () => onApply(built) : null;

  function change(update: (current: DataGridFilter) => DataGridFilter) {
    setEdited(true);
    setDraftState(update);
  }

  useEffect(() => {
    if (!pending) {
      return undefined;
    }

    const timer = setTimeout(() => flush.current?.(), APPLY_DELAY);
    return () => clearTimeout(timer);
  }, [pending, builtKey]);

  /* Fechar antes da espera aplica o que foi escrito. */
  useEffect(() => () => flush.current?.(), []);

  function clear() {
    setEdited(false);
    setDraftState(EMPTY_FILTER);
    onApply(EMPTY_FILTER);
  }

  return (
    <div className={styles.filterPanel}>
      {columns.length === 0 ? (
        <p className={styles.filterNote}>Nenhuma coluna desta grade filtra.</p>
      ) : (
        <GroupEditor
          columns={columns}
          group={draft}
          optionsOf={optionsOf}
          path={[]}
          onAdd={(path, item) => change((current) => addItem(current, path, item))}
          onLogic={(path, logic) => change((current) => setLogic(current, path, logic))}
          onRemove={(path) => change((current) => removeItem(current, path))}
          onReplace={(path, item) => change((current) => replaceItem(current, path, item))}
        />
      )}
      <div className={styles.filterActions}>
        <Button
          disabled={draft.conditions.length === 0 && filter.conditions.length === 0}
          size="sm"
          variant="ghost"
          onClick={clear}
        >
          Limpar
        </Button>
        {applyMode === 'button' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              onApply(built);
              onClose();
            }}
          >
            Aplicar
          </Button>
        )}
      </div>
    </div>
  );
}

interface GroupEditorProps {
  columns: readonly DataGridFilterBuilderColumn[];
  group: DataGridFilter;
  onAdd: (path: DataGridFilterPath, item: DataGridFilterCondition | DataGridFilter) => void;
  onLogic: (path: DataGridFilterPath, logic: DataGridFilterLogic) => void;
  onRemove: (path: DataGridFilterPath) => void;
  onReplace: (path: DataGridFilterPath, item: DataGridFilterCondition) => void;
  optionsOf: (columnId: string) => readonly string[];
  path: DataGridFilterPath;
}

function GroupEditor({ columns, group, onAdd, onLogic, onRemove, onReplace, optionsOf, path }: GroupEditorProps) {
  const nested = path.length > 0;
  const where = nested ? ` no grupo ${nameOf(path)}` : '';

  return (
    <div
      aria-label={nested ? `Grupo ${nameOf(path)}` : 'Condições'}
      className={nested ? styles.builderNested : styles.builderGroup}
      role="group"
    >
      {group.conditions.length > 1 && (
        <SegmentedControl
          items={[
            { label: 'E', value: 'and' },
            { label: 'OU', value: 'or' },
          ]}
          label={`Combinar as condições${where}`}
          size="sm"
          value={group.logic}
          onValueChange={(logic) => onLogic(path, logic as DataGridFilterLogic)}
        />
      )}
      {group.conditions.map((item, index) => {
        const itemPath = [...path, index];
        const name = nameOf(itemPath);

        return isFilterGroup(item) ? (
          <div className={styles.builderItem} key={name}>
            <GroupEditor
              columns={columns}
              group={item}
              optionsOf={optionsOf}
              path={itemPath}
              onAdd={onAdd}
              onLogic={onLogic}
              onRemove={onRemove}
              onReplace={onReplace}
            />
            <ButtonIcon
              icon={<IconTrash size={14} />}
              label={`Remover o grupo ${name}`}
              size="sm"
              variant="ghost"
              onClick={() => onRemove(itemPath)}
            />
          </div>
        ) : (
          <ConditionRow
            columns={columns}
            condition={item}
            key={name}
            name={name}
            optionsOf={optionsOf}
            onRemove={() => onRemove(itemPath)}
            onReplace={(next) => onReplace(itemPath, next)}
          />
        );
      })}
      <div className={styles.filterActions}>
        <Button
          aria-label={nested ? `Adicionar condição${where}` : undefined}
          size="sm"
          variant="ghost"
          onClick={() => onAdd(path, newCondition(columns[0]))}
        >
          <IconPlus size={14} />
          Condição
        </Button>
        <Button
          aria-label={nested ? `Adicionar grupo${where}` : undefined}
          size="sm"
          variant="ghost"
          onClick={() => onAdd(path, { logic: 'and', conditions: [newCondition(columns[0])] })}
        >
          <IconPlus size={14} />
          Grupo
        </Button>
      </div>
    </div>
  );
}

interface ConditionRowProps {
  columns: readonly DataGridFilterBuilderColumn[];
  condition: DataGridFilterCondition;
  name: string;
  onRemove: () => void;
  onReplace: (next: DataGridFilterCondition) => void;
  optionsOf: (columnId: string) => readonly string[];
}

function ConditionRow({ columns, condition, name, onRemove, onReplace, optionsOf }: ConditionRowProps) {
  const column = columns.find((candidate) => candidate.id === condition.columnId) ?? columns[0];
  const selected = Array.isArray(condition.value) ? (condition.value as string[]) : null;

  return (
    <div className={styles.builderItem}>
      <div className={styles.filterCondition}>
        <Select
          aria-label={`Coluna da condição ${name}`}
          options={columns.map((candidate) => ({ label: candidate.header, value: candidate.id }))}
          size="sm"
          value={column.id}
          onValueChange={(columnId) =>
            onReplace(newCondition(columns.find((candidate) => candidate.id === columnId) ?? column))
          }
        />
        {column.filter === 'set' ? (
          <SetEditor
            header={column.header}
            key={column.id}
            options={() => optionsOf(column.id)}
            selected={selected}
            onSelectedChange={(next) =>
              onReplace({ columnId: column.id, operator: condition.operator, value: next ?? undefined })
            }
          />
        ) : (
          <ConditionEditor
            condition={condition}
            key={column.id}
            header={column.header}
            kind={column.filter}
            label={`Condição ${name}`}
            operators={operatorsOf(column)}
            onChange={(next) => onReplace({ columnId: column.id, ...next })}
          />
        )}
      </div>
      <ButtonIcon
        icon={<IconTrash size={14} />}
        label={`Remover a condição ${name}`}
        size="sm"
        variant="ghost"
        onClick={onRemove}
      />
    </div>
  );
}
