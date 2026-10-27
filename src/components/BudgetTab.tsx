import { useCallback, useMemo, useRef } from 'react';
import { useSyncedText } from '../lib/useSyncedText';
import {
  budgetStatus,
  categoryNeeds,
  formatINR,
  generateOverBudgetOptions,
  OCCASION_LABELS,
  parseGuests,
  parseINR,
  scaleGuests,
} from '../engine';
import { MAX_GUESTS, type Category, type Plan } from '../schemas';
import type { Action } from '../state/planStore';
import { AllocationBar, SWATCH_CLASS } from './AllocationBar';
import { BudgetSummaryCards } from './BudgetCards';
import { CategoryRow } from './CategoryRow';
import { Icon } from './Icon';
import { TradeoffPanel } from './TradeoffPanel';
import { Field } from './ui';

export function BudgetTab({ plan, dispatch }: { plan: Plan; dispatch: (action: Action) => void }) {
  const status = useMemo(() => budgetStatus(plan), [plan]);
  const needs = useMemo(() => categoryNeeds(plan), [plan]);
  const options = useMemo(() => generateOverBudgetOptions(plan), [plan]);
  const impact = useMemo(() => scaleGuests(plan, plan.guests), [plan]);

  const [guestsText, setGuestsText] = useSyncedText(String(plan.guests));
  const [budgetText, setBudgetText] = useSyncedText(String(plan.totalBudget));
  const [perPlateText, setPerPlateText] = useSyncedText(String(Math.round(plan.perPlate)));

  const onChange = useCallback(
    (category: Category, amount: number) => dispatch({ type: 'setAmount', category, amount }),
    [dispatch],
  );
  const onToggleLock = useCallback(
    (category: Category) => dispatch({ type: 'toggleLock', category }),
    [dispatch],
  );

  function commitGuests(value: string) {
    const guests = parseGuests(value);
    if (guests === null) setGuestsText(String(plan.guests));
    else dispatch({ type: 'setGuests', guests });
  }
  function commitBudget() {
    const parsed = parseINR(budgetText);
    if (parsed === null) setBudgetText(String(plan.totalBudget));
    else dispatch({ type: 'setTotal', total: parsed });
  }
  function commitPerPlate() {
    const parsed = perPlateText.trim() === '0' ? 0 : parseINR(perPlateText);
    if (parsed === null) setPerPlateText(String(Math.round(plan.perPlate)));
    else dispatch({ type: 'setPerPlate', perPlate: parsed });
  }

  const over = status.overBy > 0;
  const optionsRef = useRef<HTMLDivElement>(null);
  const showOptions = () => {
    optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    optionsRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-8">
      <section className="card !p-6 sm:!p-8" aria-labelledby="summary-h">
        <div className="flex items-center justify-between">
          <h2 id="summary-h" className="text-xl sm:text-2xl font-bold">
            Budget at a glance
          </h2>
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Financial Overview
          </span>
        </div>
        <BudgetSummaryCards status={status} />
        <div className="mt-6 border-t border-line/70 pt-6">
          <AllocationBar plan={plan} />
        </div>
      </section>

      <div
        role="status"
        aria-live="polite"
        data-testid="over-budget-region"
        className="sticky top-20 z-20"
      >
        {over ? (
          <div className="flex h-[4.5rem] items-center gap-3.5 rounded-2xl border border-warn/40 bg-warn-soft/95 px-5 text-warn shadow-elevated backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warn/15 text-warn">
              <Icon name="alert" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold sm:text-base">
                Over budget by {formatINR(status.overBy)}
              </p>
              <p className="truncate text-xs text-warn/90">
                {status.overByPct}% of your total. Nothing was changed automatically.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary shrink-0 !min-h-9 !px-4 text-xs font-semibold"
              onClick={showOptions}
            >
              Options
            </button>
          </div>
        ) : (
          <div className="flex h-[4.5rem] items-center gap-3.5 rounded-2xl border border-line bg-card/95 px-5 text-ink-soft shadow-soft backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ok/10 text-ok">
              <Icon name="check" className="h-5 w-5" />
            </div>
            <p className="truncate text-xs sm:text-sm font-semibold text-ink">
              Within budget. Everything adds up to {formatINR(status.total)}.
            </p>
          </div>
        )}
      </div>

      <section aria-labelledby="cats-h">
        <div className="mb-4">
          <h2 id="cats-h" className="text-xl font-bold">
            Where the money goes
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-ink-soft">
            Move one slider and the others adjust to keep the total the same. Lock a category to
            protect it.
          </p>
        </div>
        <div className="card divide-y divide-line/70 !p-0 overflow-hidden">
          {needs.map((need) => (
            <CategoryRow
              key={need.category}
              occasion={plan.occasion}
              category={need.category}
              amount={plan.allocation[need.category]}
              total={plan.totalBudget}
              locked={plan.locked.includes(need.category)}
              need={need}
              swatchClass={SWATCH_CLASS[need.category]}
              onChange={onChange}
              onToggleLock={onToggleLock}
            />
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-soft">
          Splits start from typical presets for a {OCCASION_LABELS[plan.occasion].toLowerCase()} and
          stay estimates until you accept a vendor quotation.
        </p>
      </section>

      <section className="card !p-6 sm:!p-8" aria-labelledby="controls-h">
        <h2 id="controls-h" className="text-xl font-bold">
          Guests and totals
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Field label="Number of guests">
            {(p) => (
              <input
                {...p}
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_GUESTS}
                value={guestsText}
                onChange={(e) => {
                  setGuestsText(e.target.value);
                  const guests = parseGuests(e.target.value);
                  if (guests !== null) dispatch({ type: 'setGuests', guests });
                }}
                onBlur={(e) => commitGuests(e.target.value)}
              />
            )}
          </Field>
          <Field label="Total budget (₹)" hint="Try 8 lakh or 8,00,000">
            {(p) => (
              <input
                {...p}
                className="input"
                value={budgetText}
                onChange={(e) => setBudgetText(e.target.value)}
                onBlur={commitBudget}
                onKeyDown={(e) => e.key === 'Enter' && commitBudget()}
              />
            )}
          </Field>
          <Field
            label="Catering cost per plate (₹)"
            hint="Starts from your catering share. Edit if you know better."
          >
            {(p) => (
              <input
                {...p}
                className="input"
                value={perPlateText}
                onChange={(e) => setPerPlateText(e.target.value)}
                onBlur={commitPerPlate}
                onKeyDown={(e) => e.key === 'Enter' && commitPerPlate()}
              />
            )}
          </Field>
        </div>
        <div className="mt-6 rounded-xl border border-line/60 bg-paper/60 p-4">
          <p className="tabular text-xs sm:text-sm text-ink" data-testid="guest-impact">
            {plan.guests} guests × {formatINR(Math.round(impact.perPlate))} per plate needs{' '}
            <strong>{formatINR(impact.requiredCatering)}</strong> for catering. You have budgeted{' '}
            <strong>{formatINR(impact.currentCatering)}</strong>
            {impact.overBy > 0 ? (
              <>
                :{' '}
                <span className="inline-flex items-center gap-1 font-bold text-warn">
                  <Icon name="alert" className="h-3.5 w-3.5" />
                  {formatINR(impact.overBy)} short.
                </span>
              </>
            ) : (
              '. That covers it.'
            )}
          </p>
        </div>
      </section>

      {over && (
        <div id="tradeoffs" ref={optionsRef} tabIndex={-1} className="outline-none">
          <TradeoffPanel
            plan={plan}
            options={options}
            overBy={status.overBy}
            onApply={(option) => dispatch({ type: 'applyOption', option })}
          />
        </div>
      )}
    </div>
  );
}
