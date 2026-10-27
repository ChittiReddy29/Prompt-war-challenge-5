import { useState } from 'react';
import { categoryLabel, type ScheduledTask } from '../engine';
import type { Occasion } from '../schemas';
import { formatDate } from '../lib/format';
import { Icon, type IconName } from './Icon';
import { Field } from './ui';

export interface TaskRowProps {
  task: ScheduledTask;
  occasion: Occasion;
  titles: Record<string, string>;
  pushedBy: string | null;
  onStatus: (id: string, status: 'todo' | 'done') => void;
  onDelay: (id: string, days: number) => void;
  onAssignee: (id: string, assignee: string) => void;
}

function Flag({ icon, text }: { icon: IconName; text: string }) {
  return (
    <span className="badge-warn shadow-xs">
      <Icon name={icon} className="h-3 w-3" /> {text}
    </span>
  );
}

export function TaskRow({
  task,
  occasion,
  titles,
  pushedBy,
  onStatus,
  onDelay,
  onAssignee,
}: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState(String(task.delayDays ?? 7));
  const done = task.status === 'done';
  const delayed = task.status === 'delayed';
  const shifted = task.effectiveDate !== task.dueDate;
  const problem =
    !done &&
    (task.flags.atRisk || task.flags.overdue || task.flags.impossible || task.flags.tooLate);
  const dayCount = Number(days);
  const daysValid = Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 365;
  const flagged = Boolean(pushedBy) || problem;

  return (
    <li
      className="relative pb-6 pl-8 sm:pl-9 last:pb-0"
      data-testid={`task-${task.id}`}
      data-affected={pushedBy ? 'true' : undefined}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all shadow-xs ${
          done
            ? 'border-ok bg-ok text-paper shadow-sm'
            : flagged
              ? 'border-warn bg-paper text-warn'
              : 'border-line bg-paper text-ink-soft'
        }`}
      >
        {done && <Icon name="check" className="h-3 w-3 stroke-[2.5]" />}
      </span>

      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-soft ${
          flagged
            ? 'border-warn/40 bg-warn-soft/40 hover:bg-warn-soft/60'
            : done
              ? 'border-line/60 bg-card/60 opacity-80'
              : 'border-line bg-card hover:border-line/90 hover:shadow-card'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4
              className={`text-base font-bold text-ink ${done ? 'text-ink-soft line-through' : ''}`}
            >
              {task.title}
            </h4>
            <p className="tabular mt-0.5 text-xs sm:text-sm text-ink-soft">
              {categoryLabel(occasion, task.category)} · Due {formatDate(task.dueDate)}
              {shifted && !done && (
                <span className="font-semibold text-warn">
                  {' '}
                  · Now expected {formatDate(task.effectiveDate)}
                </span>
              )}
            </p>
          </div>
          <span className={done ? 'badge-verified' : 'badge-estimate'}>
            {done && <Icon name="check" className="h-3 w-3" />}
            {done ? 'Done' : delayed ? `Delayed ${task.delayDays} days` : 'To do'}
          </span>
        </div>

        {flagged && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pushedBy && <Flag icon="alert" text={`Pushed by delay in "${pushedBy}"`} />}
            {task.flags.overdue && !done && <Flag icon="clock" text="Overdue" />}
            {task.flags.tooLate && !task.flags.overdue && !done && (
              <Flag icon="clock" text="Due date already passed" />
            )}
            {task.flags.atRisk && !pushedBy && !done && <Flag icon="alert" text="At risk" />}
            {task.flags.impossible && !done && (
              <Flag icon="stop" text="Cannot finish before the event" />
            )}
          </div>
        )}

        {task.dependsOn.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-semibold text-ink-soft">Needs:</span>
            {task.dependsOn.map((id) => (
              <span
                key={id}
                className="badge border border-line bg-paper/80 font-medium text-ink-soft"
              >
                {titles[id] ?? id}
              </span>
            ))}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary !min-h-9 !px-3 text-xs font-semibold"
              onClick={() => onStatus(task.id, done ? 'todo' : 'done')}
            >
              {done ? 'Mark as to do' : 'Done'}
            </button>
            <button
              type="button"
              className="btn-secondary !min-h-9 !px-3 text-xs font-semibold"
              onClick={() => setEditing((v) => !v)}
            >
              {delayed ? 'Change delay' : 'Mark delayed'}
            </button>
          </div>

          <div className="w-full sm:w-48">
            <Field label="Assignee">
              {(p) => (
                <input
                  {...p}
                  className="input !min-h-9 text-xs"
                  placeholder="e.g. Ramesh Uncle"
                  value={task.assignee ?? ''}
                  onChange={(e) => onAssignee(task.id, e.target.value)}
                />
              )}
            </Field>
          </div>
        </div>

        {editing && (
          <div className="mt-3 flex flex-wrap items-end gap-2.5 border-t border-line/60 pt-3">
            <Field label="Delayed by (days)" error={!daysValid ? 'Enter 1 to 365 days.' : null}>
              {(p) => (
                <input
                  {...p}
                  className="input !min-h-9 w-28 text-xs font-semibold"
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              )}
            </Field>
            <button
              type="button"
              className="btn-primary !min-h-9 !px-3 text-xs font-semibold"
              disabled={!daysValid}
              onClick={() => {
                onDelay(task.id, dayCount);
                setEditing(false);
              }}
            >
              Apply delay
            </button>
            {delayed && (
              <button
                type="button"
                className="btn-secondary !min-h-9 !px-3 text-xs"
                onClick={() => {
                  onDelay(task.id, 0);
                  setEditing(false);
                }}
              >
                Clear delay
              </button>
            )}
            <button
              type="button"
              className="btn-secondary !min-h-9 !px-3 text-xs"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
