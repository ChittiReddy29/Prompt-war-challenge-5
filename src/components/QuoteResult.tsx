import { useState } from 'react';
import {
  categoryLabel,
  compareQuote,
  effectiveCost,
  formatINR,
  inquiryDraft,
  missingFields,
} from '../engine';
import { MAX_QUOTES_PER_CATEGORY, type Plan, type Quote } from '../schemas';
import { Icon } from './Icon';
import { QuoteFacts } from './QuoteFacts';

/** One analysed quote: facts, engine flags, cost against budget, inquiry draft and actions. */
export function QuoteResult({
  quote,
  plan,
  full,
  onSave,
}: {
  quote: Quote;
  plan: Plan;
  full: boolean;
  onSave: (accept: boolean) => void;
}) {
  const [copied, setCopied] = useState<'done' | 'failed' | null>(null);
  const flags = compareQuote(quote, plan);
  const missing = missingFields(quote);
  const cost = effectiveCost(quote, plan.guests);
  const draft = inquiryDraft(quote, plan);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
  }

  return (
    <div
      className="mt-6 space-y-5 rounded-2xl border border-line/80 bg-paper/60 p-5 sm:p-6 shadow-soft"
      data-testid="quote-result"
    >
      <div className="flex items-center justify-between border-b border-line/60 pb-3">
        <h3 className="text-base sm:text-lg font-bold text-ink">
          What we found (AI extraction, please verify)
        </h3>
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
          Parsed Data
        </span>
      </div>

      <QuoteFacts quote={quote} guests={plan.guests} />

      {cost !== null && (
        <div className="rounded-xl border border-line bg-card p-3.5 text-xs sm:text-sm text-ink shadow-xs">
          Effective cost <strong className="font-bold text-ink">{formatINR(cost)}</strong> against a{' '}
          {categoryLabel(plan.occasion, quote.category)} budget of{' '}
          <strong className="font-bold text-ink">
            {formatINR(plan.allocation[quote.category])}
          </strong>
          .
        </div>
      )}

      <div role="status" aria-live="polite" className="rounded-xl border border-line bg-card p-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-ink-soft">
          Things to check
        </h4>
        {flags.length === 0 ? (
          <p className="mt-2 flex items-center gap-2 text-xs sm:text-sm font-semibold text-ok">
            <Icon name="check" className="h-4 w-4" />
            Nothing worrying found.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-xs sm:text-sm">
            {flags.map((f) => (
              <li key={f.code} className="flex items-start gap-1.5 font-semibold text-warn">
                <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{f.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {missing.length > 0 && (
        <p className="text-xs text-ink-soft">
          {missing.length} details are missing. Copy the message below to ask for exactly those.
        </p>
      )}

      <div className="flex flex-wrap gap-2.5 pt-2">
        <button
          type="button"
          className="btn-secondary !min-h-10 text-xs sm:text-sm font-semibold"
          onClick={() => void copyDraft()}
        >
          <Icon name="mail" className="h-4 w-4" />
          Copy inquiry message
        </button>
        <button
          type="button"
          className="btn-secondary !min-h-10 text-xs sm:text-sm font-semibold"
          disabled={full}
          onClick={() => onSave(false)}
        >
          Save for comparison
        </button>
        <button
          type="button"
          className="btn-primary !min-h-10 text-xs sm:text-sm font-semibold shadow-md"
          disabled={full || cost === null}
          onClick={() => onSave(true)}
        >
          <Icon name="check" className="h-4 w-4" />
          Accept quotation
        </button>
      </div>

      {full && (
        <p className="text-xs font-medium text-warn">
          You already have {MAX_QUOTES_PER_CATEGORY} quotations for this category. Remove one below
          to add another.
        </p>
      )}
      {cost === null && (
        <p className="text-xs font-medium text-ink-soft">
          A quotation needs a price before it can be accepted.
        </p>
      )}

      <div aria-live="polite">
        {copied === 'done' && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-ok">
            <Icon name="check" className="h-4 w-4" />
            <span>Message copied.</span>
          </div>
        )}
        {copied === 'failed' && (
          <div className="space-y-1.5">
            <p className="text-xs sm:text-sm font-semibold text-ink">
              Copy was blocked. Select the message below and copy it:
            </p>
            <textarea
              readOnly
              aria-label="Inquiry message"
              className="input mt-1 min-h-32 text-xs"
              value={draft}
            />
          </div>
        )}
      </div>
    </div>
  );
}
