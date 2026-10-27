import { categoryLabel, compareQuote, effectiveCost, formatINR } from '../engine';
import { CATEGORIES, type Category, type Plan, type StoredQuote } from '../schemas';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { EstimateBadge } from './ui';

function CategoryTable({
  plan,
  category,
  quotes,
  dispatch,
}: {
  plan: Plan;
  category: Category;
  quotes: StoredQuote[];
  dispatch: (a: Action) => void;
}) {
  const label = categoryLabel(plan.occasion, category);
  const budget = plan.allocation[category];
  const cols = quotes.map((s) => {
    const cost = effectiveCost(s.quote, plan.guests);
    return { s, cost, flags: compareQuote(s.quote, plan) };
  });
  const cell = (render: (c: (typeof cols)[number]) => React.ReactNode) =>
    cols.map((c) => (
      <td
        key={c.s.id}
        className={`px-4 py-3.5 text-xs sm:text-sm ${c.s.accepted ? 'bg-accent-soft/30 font-medium' : ''}`}
      >
        {render(c)}
      </td>
    ));

  return (
    <section
      className="card !p-6 sm:!p-8 overflow-x-auto shadow-card"
      aria-labelledby={`cmp-${category}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
        <div>
          <h3 id={`cmp-${category}`} className="text-base sm:text-lg font-bold text-ink">
            {label}: compare quotations
          </h3>
          <p className="hint">Budget for this category: {formatINR(budget)}</p>
        </div>
        <EstimateBadge verified={quotes.some((q) => q.accepted)} />
      </div>
      <table className="mt-4 min-w-[32rem] rounded-xl overflow-hidden border border-line/70">
        <caption className="sr-only">Side-by-side quotations for {label}</caption>
        <thead>
          <tr className="bg-paper/80 border-b border-line">
            <th
              scope="col"
              className="w-1/3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-ink-soft"
            >
              <span>Metric / Spec</span>
            </th>
            {cols.map((c, i) => (
              <th
                key={c.s.id}
                scope="col"
                className={`px-4 py-3 text-left font-bold text-ink ${c.s.accepted ? 'bg-accent-soft/50 text-accent' : ''}`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{c.s.quote.vendorName ?? `Quotation ${i + 1}`}</span>
                  {c.s.accepted && (
                    <span className="badge-verified ml-1.5 !px-2 !py-0.5 text-[10px]">
                      <Icon name="check" className="h-2.5 w-2.5" /> Accepted
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60 bg-card">
          <tr>
            <th scope="row" className="px-4 py-3 text-xs font-bold text-ink-soft">
              Effective cost ({plan.guests} guests)
            </th>
            {cell((c) =>
              c.cost === null ? (
                'Not stated'
              ) : (
                <strong className="font-bold text-ink">{formatINR(c.cost)}</strong>
              ),
            )}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 text-xs font-bold text-ink-soft">
              Against budget
            </th>
            {cell((c) =>
              c.cost === null ? (
                '-'
              ) : c.cost > budget ? (
                <span className="inline-flex items-center gap-1 font-bold text-warn">
                  <Icon name="alert" className="h-3.5 w-3.5" />
                  {formatINR(c.cost - budget)} over
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-ok">
                  <Icon name="check" className="h-3.5 w-3.5" />
                  {formatINR(budget - c.cost)} under
                </span>
              ),
            )}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 text-xs font-bold text-ink-soft">
              Per plate
            </th>
            {cell((c) =>
              c.s.quote.pricePerPlate === null ? '-' : formatINR(c.s.quote.pricePerPlate),
            )}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 text-xs font-bold text-ink-soft">
              Guest minimum
            </th>
            {cell((c) => c.s.quote.guestMinimum ?? '-')}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 text-xs font-bold text-ink-soft">
              Advance payment
            </th>
            {cell((c) =>
              c.s.quote.advancePercent === null ? '-' : `${c.s.quote.advancePercent}%`,
            )}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 text-xs font-bold text-ink-soft">
              Tax / GST
            </th>
            {cell((c) =>
              c.s.quote.taxIncluded === null
                ? 'Not stated'
                : c.s.quote.taxIncluded
                  ? 'Included'
                  : 'Extra',
            )}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 text-xs font-bold text-ink-soft">
              Things to check
            </th>
            {cell((c) =>
              c.flags.length === 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-ok">
                  <Icon name="check" className="h-3.5 w-3.5" />
                  None
                </span>
              ) : (
                <ul className="space-y-1">
                  {c.flags.map((f) => (
                    <li key={f.code} className="text-xs font-semibold text-warn">
                      <Icon name="alert" className="mr-1 inline h-3.5 w-3.5" />
                      {f.message}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 text-xs font-bold text-ink-soft">
              Actions
            </th>
            {cell((c) => (
              <div className="flex flex-wrap gap-2">
                {!c.s.accepted && (
                  <button
                    type="button"
                    className="btn-primary !min-h-8 !px-3 text-xs"
                    disabled={c.cost === null}
                    onClick={() => dispatch({ type: 'acceptQuote', id: c.s.id })}
                  >
                    Accept
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary !min-h-8 !px-3 text-xs text-warn/80 hover:text-warn hover:border-warn/40"
                  onClick={() => dispatch({ type: 'removeQuote', id: c.s.id })}
                >
                  Remove
                </button>
              </div>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function QuoteComparison({ plan, dispatch }: { plan: Plan; dispatch: (a: Action) => void }) {
  const groups = CATEGORIES.map((c) => ({
    c,
    quotes: plan.quotes.filter((q) => q.category === c),
  })).filter((g) => g.quotes.length > 0);
  if (groups.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm font-semibold text-ink">No vendor quotations saved yet.</p>
        <p className="mt-1 text-xs text-ink-soft max-w-md mx-auto">
          Analyze a quotation above from WhatsApp or PDF proposals and save it to compare
          side-by-side.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <CategoryTable key={g.c} plan={plan} category={g.c} quotes={g.quotes} dispatch={dispatch} />
      ))}
    </div>
  );
}
