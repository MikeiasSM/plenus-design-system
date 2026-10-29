import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '../../actions/Button';
import { Checkbox } from '../../forms/Checkbox';
import { DatePicker } from '../../forms/DatePicker';
import { InputNumber } from '../../forms/InputNumber';
import { InputText } from '../../forms/InputText';
import { SegmentedControl } from '../../forms/SegmentedControl';
import { Select } from '../../forms/Select';
import { IconSearch } from '../../icons';
import { containsTerm } from '../../../utils/textSearch';
import {
  isComplete,
  isFilterGroup,
  numberOf,
  type DataGridFilter,
  type DataGridFilterCondition,
  type DataGridFilterKind,
  type DataGridFilterLogic,
  type DataGridFilterOperator,
} from './filterModel';
import styles from './DataGrid.module.css';

/** Mesma espera da busca: no servidor, cada tecla seria uma consulta. */
const APPLY_DELAY = 250;
/** Teto da lista do conjunto; a busca do painel alcança o resto. */
const MAX_OPTIONS = 200;

export type DataGridFilterApplyMode = 'immediate' | 'button';

interface DraftCondition {
  operator: string;
  /** Texto do campo enquanto se escreve; vira número ou data ao filtrar. */
  value?: unknown;
}

interface Draft {
  conditions: DraftCondition[];
  logic: DataGridFilterLogic;
}

interface DataGridFilterPanelProps {
  applyMode: DataGridFilterApplyMode;
  columnId: string;
  header: string;
  kind: DataGridFilterKind;
  onChange: (columnId: string, next: DataGridFilter | null) => void;
  onClose: () => void;
  operators: readonly DataGridFilterOperator[];
  /** Valores do conjunto, calculados sem o filtro desta coluna. */
  options: () => readonly string[];
  value: DataGridFilter | null;
}

function draftOf(value: DataGridFilter | null, operators: readonly DataGridFilterOperator[]): Draft {
  const conditions = (value?.conditions ?? []).filter((item): item is DataGridFilterCondition => !isFilterGroup(item));

  return {
    logic: value?.logic ?? 'and',
    conditions:
      conditions.length > 0
        ? conditions.slice(0, 2).map(({ operator, value: operand }) => ({ operator, value: operand }))
        : [{ operator: operators.find((operator) => operator.operand !== 'none')?.id ?? '' }],
  };
}

/** O filtro do funil cabe no editor: até duas condições soltas, ou o conjunto pelo operador `in`. */
function fitsEditor(value: DataGridFilter | null, kind: DataGridFilterKind) {
  if (!value) {
    return true;
  }

  const simple = value.conditions.every((item) => !isFilterGroup(item));
  return kind === 'set'
    ? simple && value.conditions.length === 1 && (value.conditions[0] as DataGridFilterCondition).operator === 'in'
    : simple && value.conditions.length <= 2;
}

/** O número digitado vai ao modelo como número; o resto, como está. */
function operandOf(kind: DataGridFilterKind, value: unknown) {
  if (kind !== 'number' || value === undefined || value === '') {
    return value;
  }

  return Array.isArray(value) ? value.map((part) => (part === '' ? part : numberOf(part))) : numberOf(value);
}

export function DataGridFilterPanel({
  applyMode,
  columnId,
  header,
  kind,
  onChange,
  onClose,
  operators,
  options,
  value,
}: DataGridFilterPanelProps) {
  const [editable, setEditable] = useState(() => fitsEditor(value, kind));
  const [draft, setDraftState] = useState(() => draftOf(value, operators));
  const [selected, setSelectedState] = useState<readonly string[] | null>(() => {
    const condition = value?.conditions[0];
    return condition && !isFilterGroup(condition) && Array.isArray(condition.value) ? condition.value : null;
  });
  /* Só a edição da pessoa aplica: abrir o painel nunca reescreve o filtro, nem o que mudou por fora. */
  const [edited, setEdited] = useState(false);
  const built = kind === 'set' ? setFilterOf(selected) : conditionsFilterOf(draft);
  const builtKey = JSON.stringify(built);
  const pending = edited && applyMode === 'immediate' && builtKey !== JSON.stringify(value);
  const flush = useRef<(() => void) | null>(null);
  flush.current = pending ? () => onChange(columnId, built) : null;

  function setDraft(update: (current: Draft) => Draft) {
    setEdited(true);
    setDraftState(update);
  }

  function setSelected(next: readonly string[] | null) {
    setEdited(true);
    setSelectedState(next);
  }

  /* As condições valem em sequência: a segunda não filtra enquanto a primeira está incompleta. */
  function conditionsFilterOf(next: Draft): DataGridFilter | null {
    const complete: DataGridFilterCondition[] = [];
    for (const condition of next.conditions) {
      const operator = operators.find((candidate) => candidate.id === condition.operator);
      const model = { columnId, operator: condition.operator, value: operandOf(kind, condition.value) };
      if (!operator || !isComplete(model, operator)) {
        break;
      }
      complete.push(operator.operand === 'none' ? { columnId, operator: model.operator } : model);
    }

    /* Com uma condição só, o E/OU não muda nada: igual ao modelo guardado, que não a envolve em grupo. */
    return complete.length === 0 ? null : { logic: complete.length === 1 ? 'and' : next.logic, conditions: complete };
  }

  function setFilterOf(next: readonly string[] | null): DataGridFilter | null {
    return next === null ? null : { logic: 'and', conditions: [{ columnId, operator: 'in', value: next }] };
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
    setDraftState(draftOf(null, operators));
    setSelectedState(null);
    setEdited(false);
    setEditable(true);
    onChange(columnId, null);
  }

  function updateCondition(index: number, next: DraftCondition) {
    setDraft((current) => ({ ...current, conditions: current.conditions.map((condition, i) => (i === index ? next : condition)) }));
  }

  const first = draft.conditions[0];
  const firstOperator = operators.find((operator) => operator.id === first?.operator);
  const canAddSecond = kind !== 'set' && kind !== 'boolean' && firstOperator !== undefined && isComplete({ columnId, ...first, value: operandOf(kind, first.value) }, firstOperator);

  return (
    <div className={styles.filterPanel}>
      {!editable ? (
        <p className={styles.filterNote}>Este filtro foi montado fora do funil e não cabe nele. Limpe para escrever outro.</p>
      ) : kind === 'set' ? (
        <SetEditor header={header} options={options} selected={selected} onSelectedChange={setSelected} />
      ) : (
        <>
          <ConditionEditor
            condition={first}
            header={header}
            kind={kind}
            label="Condição"
            operators={operators}
            optionalLabel={kind === 'boolean' ? 'Todos' : undefined}
            onChange={(next) => updateCondition(0, next)}
          />
          {canAddSecond && (
            <>
              <SegmentedControl
                items={[
                  { label: 'E', value: 'and' },
                  { label: 'OU', value: 'or' },
                ]}
                label="Combinar as condições"
                size="sm"
                value={draft.logic}
                onValueChange={(logic) => setDraft((current) => ({ ...current, logic: logic as DataGridFilterLogic }))}
              />
              <ConditionEditor
                condition={draft.conditions[1] ?? { operator: '' }}
                header={header}
                kind={kind}
                label="Segunda condição"
                operators={operators}
                optionalLabel="Nenhuma"
                onChange={(next) =>
                  setDraft((current) => ({
                    ...current,
                    conditions: next.operator ? [current.conditions[0], next] : [current.conditions[0]],
                  }))
                }
              />
            </>
          )}
        </>
      )}
      <div className={styles.filterActions}>
        <Button disabled={value === null && built === null} size="sm" type="button" variant="ghost" onClick={clear}>
          Limpar
        </Button>
        {applyMode === 'button' && editable && (
          <Button
            size="sm"
            type="button"
            variant="primary"
            onClick={() => {
              onChange(columnId, built);
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

interface ConditionEditorProps {
  condition: DraftCondition;
  header: string;
  kind: DataGridFilterKind;
  label: string;
  onChange: (next: DraftCondition) => void;
  operators: readonly DataGridFilterOperator[];
  /** Opção sem condição, que não filtra. */
  optionalLabel?: string;
}

function ConditionEditor({ condition, header, kind, label, onChange, operators, optionalLabel }: ConditionEditorProps) {
  const operator = operators.find((candidate) => candidate.id === condition.operator);
  const selectOptions = [
    ...(optionalLabel ? [{ label: optionalLabel, value: '' }] : []),
    ...operators.map((candidate) => ({ label: candidate.label, value: candidate.id })),
  ];

  function changeOperator(id: string) {
    const next = operators.find((candidate) => candidate.id === id);
    const keepsValue = next && operator && next.operand === operator.operand;
    onChange({ operator: id, value: keepsValue ? condition.value : undefined });
  }

  return (
    <div className={styles.filterCondition}>
      <Select
        aria-label={`${label} de ${header}`}
        options={selectOptions}
        size="sm"
        value={condition.operator}
        onValueChange={changeOperator}
      />
      {operator?.operand === 'single' && (
        <OperandEditor kind={kind} label={`Valor de ${header}`} value={condition.value} onChange={(value) => onChange({ ...condition, value })} />
      )}
      {operator?.operand === 'range' && (
        <div className={styles.filterRange}>
          {(['De', 'Até'] as const).map((part, index) => {
            const range = Array.isArray(condition.value) ? condition.value : ['', ''];
            return (
              <OperandEditor
                key={part}
                kind={kind}
                label={`${part}, ${header}`}
                value={range[index]}
                onChange={(value) => onChange({ ...condition, value: range.map((item, i) => (i === index ? value : item)) })}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface OperandEditorProps {
  kind: DataGridFilterKind;
  label: string;
  onChange: (value: unknown) => void;
  value: unknown;
}

function OperandEditor({ kind, label, onChange, value }: OperandEditorProps) {
  if (kind === 'date') {
    return <DatePicker aria-label={label} size="sm" value={typeof value === 'string' && value ? value : null} onValueChange={(next) => onChange(next ?? '')} />;
  }
  if (kind === 'number') {
    return <InputNumber aria-label={label} decimalScale={4} placeholder="Valor" size="sm" value={value === undefined ? '' : (value as string | number)} onValueChange={onChange} />;
  }

  return <InputText aria-label={label} placeholder="Valor" size="sm" value={typeof value === 'string' ? value : ''} onValueChange={onChange} />;
}

interface SetEditorProps {
  header: string;
  onSelectedChange: (selected: readonly string[] | null) => void;
  options: () => readonly string[];
  /** `null` é todos marcados: sem filtro. */
  selected: readonly string[] | null;
}

function SetEditor({ header, onSelectedChange, options: optionsOf, selected }: SetEditorProps) {
  const [term, setTerm] = useState('');
  const [options] = useState(optionsOf);
  const found = useMemo(() => options.filter((option) => containsTerm(option || 'Vazio', term)), [options, term]);
  const listId = useId();
  const isChecked = (option: string) => selected === null || selected.includes(option);
  const allFound = found.every(isChecked);
  const someFound = found.some(isChecked);

  /* Todos marcados de novo volta a ser "sem filtro". */
  function commit(next: readonly string[]) {
    onSelectedChange(options.every((option) => next.includes(option)) ? null : next);
  }

  function toggle(option: string, checked: boolean) {
    const current = selected ?? options;
    commit(checked ? [...current, option] : current.filter((item) => item !== option));
  }

  function toggleFound() {
    const current = selected ?? options;
    commit(allFound ? current.filter((item) => !found.includes(item)) : [...new Set([...current, ...found])]);
  }

  /* As setas andam entre os valores, como numa lista; sem isso, rolam a página. */
  function moveAmongOptions(event: KeyboardEvent<HTMLDivElement>) {
    const boxes = [...event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
    const index = boxes.indexOf(event.target as HTMLInputElement);
    const targets: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: boxes.length - 1 };
    const next = targets[event.key];

    if (index < 0 || next === undefined) {
      return;
    }

    event.preventDefault();
    boxes[Math.min(Math.max(next, 0), boxes.length - 1)].focus();
  }

  return (
    <>
      <InputText
        aria-controls={listId}
        aria-label={`Buscar valores de ${header}`}
        icon={<IconSearch size={14} />}
        placeholder="Buscar"
        size="sm"
        type="search"
        value={term}
        onValueChange={setTerm}
      />
      <div className={styles.filterOptions} id={listId} onKeyDown={moveAmongOptions}>
        <Checkbox
          checked={allFound && found.length > 0}
          indeterminate={someFound && !allFound}
          label={term ? `Selecionar os ${found.length} encontrados` : 'Selecionar todos'}
          onCheckedChange={toggleFound}
        />
        {found.slice(0, MAX_OPTIONS).map((option) => (
          <Checkbox
            checked={isChecked(option)}
            key={option}
            label={option || '(Vazio)'}
            onCheckedChange={(checked) => toggle(option, checked)}
          />
        ))}
        {found.length > MAX_OPTIONS && (
          <p className={styles.filterNote}>Mais {found.length - MAX_OPTIONS} valores. Refine a busca.</p>
        )}
      </div>
    </>
  );
}
