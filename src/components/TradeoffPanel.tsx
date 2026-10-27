import { useState } from 'react';
import { formatINR, type TradeoffOption } from '../engine';
import type { Plan } from '../schemas';
import { explainTradeoffs, type RequestOptions } from '../lib/api';
import { describeChanges } from '../lib/format';
import { useAiCall } from '../lib/useAiCall';
import { Icon } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading, Confirm } from './ui';

export function TradeoffPanel({
  plan,
  options,
  overBy,
  onApply,
}: {
  plan: Plan;
  options: TradeoffOption[];
  overBy: number;
  onApply: (option: TradeoffOption) => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof explainTradeoffs>[0]) =>
    explainTradeoffs(request, options),
  );

  const explain = () =>
    ai.run({
      occasion: plan.occasion,
      guests: plan.guests,
      totalBudget: plan.totalBudget,
      overBy,
      priorities: plan.priorities,
      options: options.map((o) => ({
        id: o.id,
        title: o.title,
        coversRupees: o.coversRupees,
        summary: o.description,
        warning: o.warning,
      })),
    });

  if (options.length === 0) {
    return (
      <section className="card !p-6 sm:!p-8" aria-labelledby="options-h">
        <h2 id="options-h" className="text-xl font-bold text-ink">
          Ways to close the gap
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-ink-soft">
          No automatic option fits {formatINR(overBy)}. Try fewer guests, a bigger total budget, or
          unlock categories so money can move.
        </p>
      </section>
    );
  }

  const explanations = ai.state.status === 'done' ? ai.state.data.explanations : [];
  return (
    <section className="card !p-6 sm:!p-8 shadow-card" aria-labelledby="options-h">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
        <div>
          <h2 id="options-h" className="text-xl font-bold text-ink">
            Ways to close the gap
          </h2>
          <p className="hint">Nothing changes until you apply an option.</p>
        </div>
        <button
          type="button"
          className="btn-secondary !min-h-10 text-xs sm:text-sm font-semibold"
          onClick={() => void explain()}
          disabled={ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4 text-accent" />
          Explain these options
        </button>
      </div>

      <div aria-live="polite" className="mt-3">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is explaining the options…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void explain()} />
        )}
        {ai.state.status === 'done' && <AnswerMeta progress={ai.progress} />}
      </div>

      <ul className="mt-6 grid gap-5 md:grid-cols-3">
        {options.map((o) => {
          const explanation = explanations.find((e) => e.optionId === o.id);
          return (
            <li
              key={o.id}
              className="flex flex-col rounded-2xl border border-line bg-paper/50 p-5 shadow-soft transition-all hover:border-line/90 hover:bg-paper"
            >
              <h3 className="text-base font-bold text-ink">{o.title}</h3>
              <p className="mt-1 text-xs text-ink-soft sm:text-sm">{o.description}</p>
              {o.changes.length > 0 && (
                <div className="mt-3 rounded-lg border border-line/60 bg-card p-2 text-xs font-semibold text-ink">
                  {describeChanges(plan.occasion, o.changes)}
                </div>
              )}
              {o.warning && (
                <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-warn">
                  <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{o.warning}</span>
                </p>
              )}
              {explanation && (
                <div className="mt-3 rounded-xl border border-accent/20 bg-accent-soft/70 p-3 text-xs sm:text-sm">
                  <p className="text-ink">{explanation.summary}</p>
                  <p className="mt-1 font-bold text-accent">Best when: {explanation.bestWhen}</p>
                  <p className="mt-1 text-[11px] text-ink-soft">
                    AI explanation of the figures above
                  </p>
                </div>
              )}
              <div className="mt-auto pt-5">
                {confirming === o.id ? (
                  <Confirm
                    prompt={`Apply "${o.title}"? You can still adjust everything afterwards.`}
                    confirmLabel="Yes, apply"
                    onCancel={() => setConfirming(null)}
                    onConfirm={() => {
                      onApply(o);
                      setConfirming(null);
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="btn-primary w-full !min-h-10 text-xs sm:text-sm font-semibold shadow-md"
                    onClick={() => setConfirming(o.id)}
                  >
                    Apply
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
