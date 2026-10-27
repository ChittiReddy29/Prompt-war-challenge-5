import { diffDays, OCCASION_LABELS, toLakh } from '../engine';
import type { Plan } from '../schemas';
import { formatDate } from '../lib/format';
import { Icon } from './Icon';

function countdown(days: number): string {
  if (days > 1) return `${days} days to go`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Today';
  return 'This date has passed';
}

/** The event at a glance, shown above every tab so the plan always feels like one thing. */
export function PlanMasthead({ plan, today }: { plan: Plan; today: string }) {
  const days = diffDays(today, plan.eventDate);

  return (
    <section aria-label="Plan summary" className="mb-8">
      <div className="card relative overflow-hidden !p-6 sm:!p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2">
              <span className="rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                {OCCASION_LABELS[plan.occasion]}
              </span>
            </div>

            <h2
              id="plan-title"
              tabIndex={-1}
              className="text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl outline-none"
            >
              {OCCASION_LABELS[plan.occasion]}
              <span className="block text-ink-soft sm:inline">
                <span className="hidden sm:inline"> · </span>
                {formatDate(plan.eventDate)}
              </span>
            </h2>

            {plan.vibe && (
              <p className="mt-2 text-sm italic text-ink-soft sm:text-base">
                &ldquo;{plan.vibe}&rdquo;
              </p>
            )}
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-3 border-t border-line/80 pt-5 sm:grid-cols-3">
          <li className="flex items-center gap-3 rounded-xl border border-line/50 bg-paper/60 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name="users" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Guest Count
              </p>
              <p className="text-sm font-bold text-ink sm:text-base">{plan.guests} guests</p>
            </div>
          </li>
          <li className="flex items-center gap-3 rounded-xl border border-line/50 bg-paper/60 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name="wallet" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Total Target
              </p>
              <p className="text-sm font-bold text-ink sm:text-base">
                {toLakh(plan.totalBudget)} budget
              </p>
            </div>
          </li>
          <li className="flex items-center gap-3 rounded-xl border border-line/50 bg-paper/60 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name="calendar" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                Countdown
              </p>
              <p className="text-sm font-bold text-ink sm:text-base">{countdown(days)}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
