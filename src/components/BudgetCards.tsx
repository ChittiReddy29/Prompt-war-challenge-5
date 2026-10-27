import { formatINR, toLakh, type BudgetStatus } from '../engine';

export function BudgetSummaryCards({ status }: { status: BudgetStatus }) {
  return (
    <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-line/60 bg-paper/60 p-5 shadow-soft">
        <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Total budget
        </dt>
        <dd className="tabular mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {formatINR(status.total)}
        </dd>
        <dd className="mt-1 text-xs font-medium text-accent">{toLakh(status.total)}</dd>
      </div>
      <div className="rounded-2xl border border-line/60 bg-paper/60 p-5 shadow-soft">
        <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Committed (verified quotations)
        </dt>
        <dd className="tabular mt-1.5 font-display text-2xl font-bold tracking-tight text-ok sm:text-3xl">
          {formatINR(status.committed)}
        </dd>
        <dd className="mt-1 text-xs font-medium text-ink-soft">Locked with accepted quotes</dd>
      </div>
      <div className="rounded-2xl border border-line/60 bg-paper/60 p-5 shadow-soft">
        <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Estimated (not yet quoted)
        </dt>
        <dd className="tabular mt-1.5 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {formatINR(status.estimated)}
        </dd>
        <dd className="mt-1 text-xs font-medium text-ink-soft">Open for quote comparison</dd>
      </div>
    </dl>
  );
}
