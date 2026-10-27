import { useMemo } from 'react';
import {
  affectedByDelays,
  buildSchedule,
  compressTasks,
  scheduleCompression,
  diffDays,
  phaseFor,
  timelineToIcs,
  ScheduleError,
  type ScheduledTask,
} from '../engine';
import type { Plan } from '../schemas';
import { downloadText } from '../lib/download';
import { formatDate } from '../lib/format';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { RunSheet } from './RunSheet';
import { TaskRow } from './TaskRow';

const EMPTY: ScheduledTask[] = [];

export function TimelineTab({
  plan,
  today,
  dispatch,
}: {
  plan: Plan;
  today: string;
  dispatch: (action: Action) => void;
}) {
  const result = useMemo(() => {
    try {
      return { schedule: buildSchedule(plan.tasks, plan.eventDate, today), error: null };
    } catch (error) {
      return {
        schedule: EMPTY,
        error: error instanceof ScheduleError ? error.message : 'The timeline could not be built.',
      };
    }
  }, [plan.tasks, plan.eventDate, today]);
  const affected = useMemo(() => {
    try {
      return affectedByDelays(compressTasks(plan.tasks, plan.eventDate, today));
    } catch {
      return {};
    }
  }, [plan.tasks, plan.eventDate, today]);
  const compression = useMemo(
    () => scheduleCompression(plan.tasks, plan.eventDate, today),
    [plan.tasks, plan.eventDate, today],
  );
  const titles = useMemo(
    () => Object.fromEntries(plan.tasks.map((t) => [t.id, t.title])),
    [plan.tasks],
  );

  const groups = useMemo(() => {
    const map = new Map<number, { label: string; tasks: ScheduledTask[] }>();
    for (const task of result.schedule) {
      const phase = phaseFor(task.leadDays);
      const group = map.get(phase.order) ?? { label: phase.label, tasks: [] };
      group.tasks.push(task);
      map.set(phase.order, group);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([order, g]) => ({ order, ...g }));
  }, [result.schedule]);

  const daysToEvent = diffDays(today, plan.eventDate);
  const problems = result.schedule.filter(
    (t) => t.status !== 'done' && (t.flags.atRisk || t.flags.overdue || t.flags.impossible),
  ).length;

  if (result.error) {
    return (
      <div role="alert" className="card border-warn/40 bg-warn-soft/80 text-warn p-6">
        <p className="flex items-center gap-2.5 font-bold text-base">
          <Icon name="alert" className="h-5 w-5" />
          {result.error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="card !p-6 sm:!p-8" aria-labelledby="tl-h">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="tl-h" className="text-xl sm:text-2xl font-bold">
                Your timeline
              </h2>
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                DAG Schedule
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-ink">
              Event on <strong className="font-bold">{formatDate(plan.eventDate)}</strong>
              {daysToEvent > 0
                ? ` · ${daysToEvent} days to go`
                : daysToEvent === 0
                  ? ' · today'
                  : ' · this date has passed'}
            </p>
            <p className="hint">Delay a task and everything that depends on it moves too.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-secondary !min-h-10 text-xs sm:text-sm font-semibold"
              onClick={() =>
                downloadText(
                  `eventix-${plan.occasion}-${plan.eventDate}.ics`,
                  timelineToIcs(plan, result.schedule, today),
                  'text/calendar;charset=utf-8',
                )
              }
            >
              <Icon name="calendar" className="h-4 w-4" />
              Add timeline to calendar (.ics)
            </button>
            <div
              role="status"
              aria-live="polite"
              className="text-xs sm:text-sm font-bold [&>span]:flex [&>span]:items-center [&>span]:gap-1.5"
            >
              {problems > 0 ? (
                <span className="rounded-xl border border-warn/30 bg-warn-soft px-3 py-2 text-warn shadow-xs">
                  <Icon name="alert" className="h-4 w-4 shrink-0" />
                  {problems} {problems === 1 ? 'task needs' : 'tasks need'} attention
                </span>
              ) : (
                <span className="rounded-xl border border-ok/30 bg-ok-soft px-3 py-2 text-ok shadow-xs">
                  <Icon name="check" className="h-4 w-4 shrink-0" />
                  On track
                </span>
              )}
            </div>
          </div>
        </div>

        {compression.compressed && (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent-soft/70 p-4 text-xs sm:text-sm"
            data-testid="compressed-note"
          >
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span className="text-ink">
              Your event is <strong>{compression.availableDays} days away</strong>, sooner than the
              usual {compression.spanDays}-day plan, so every task has been pulled closer in the
              same order. Dates are tighter than usual.
            </span>
          </div>
        )}
      </section>

      {groups.map((g) => (
        <section key={g.order} aria-labelledby={`phase-${g.order}`} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-on-accent shadow-xs">
              0{g.order}
            </span>
            <h3
              id={`phase-${g.order}`}
              className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink"
            >
              {g.label}
            </h3>
            <div className="h-px flex-1 bg-line/80" />
          </div>
          <ul className="relative before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-0.5 before:bg-line/80 before:content-['']">
            {g.tasks.map((task) => {
              const cause = affected[task.id];
              return (
                <TaskRow
                  key={task.id}
                  task={task}
                  occasion={plan.occasion}
                  titles={titles}
                  pushedBy={cause ? (titles[cause] ?? null) : null}
                  onStatus={(id, status) => dispatch({ type: 'setTaskStatus', id, status })}
                  onDelay={(id, days) => dispatch({ type: 'setDelay', id, days })}
                  onAssignee={(id, assignee) => dispatch({ type: 'setAssignee', id, assignee })}
                />
              );
            })}
          </ul>
        </section>
      ))}

      <RunSheet occasion={plan.occasion} />
    </div>
  );
}
