import { useState } from 'react';
import { categoryLabel } from '../engine';
import {
  CategorySchema,
  CATEGORIES,
  MAX_QUOTES_PER_CATEGORY,
  type Category,
  type Plan,
  type Quote,
} from '../schemas';
import { extractQuote, type RequestOptions } from '../lib/api';
import { newId } from '../lib/id';
import { useAiCall } from '../lib/useAiCall';
import type { Action } from '../state/planStore';
import { Icon } from './Icon';
import { QuoteResult } from './QuoteResult';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

const QUOTE_CATEGORIES = CATEGORIES.filter((c) => c !== 'contingency');

export function QuoteAnalyzer({
  plan,
  dispatch,
}: {
  plan: Plan;
  dispatch: (action: Action) => void;
}) {
  const [category, setCategory] = useState<Category>('catering');
  const [pasted, setPasted] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const ai = useAiCall((options: RequestOptions, text: string, category: Category) =>
    extractQuote(text, category, options),
  );

  const result = ai.state.status === 'done' ? { ...ai.state.data, category } : null;
  const full = plan.quotes.filter((q) => q.category === category).length >= MAX_QUOTES_PER_CATEGORY;

  const analyze = () => {
    setSaved(null);
    return ai.run(pasted, category);
  };

  function save(quote: Quote, accept: boolean) {
    dispatch({ type: 'addQuote', quote, id: newId(), accept });
    setSaved(
      accept
        ? 'Quotation accepted. This category now shows a verified quotation.'
        : 'Saved for comparison.',
    );
    ai.reset();
    setPasted('');
  }

  return (
    <section className="card !p-6 sm:!p-8" aria-labelledby="analyze-h">
      <div className="flex items-center gap-2 mb-1">
        <Icon name="sparkle" className="h-5 w-5 text-accent animate-pulse" />
        <h2 id="analyze-h" className="text-xl font-bold">
          Paste a vendor quotation
        </h2>
      </div>
      <p className="hint">
        Copy the message or PDF text your vendor sent. We pull out the details and flag the fine
        print.
      </p>
      <div className="mt-5 grid gap-5">
        <div>
          <label htmlFor="quote-cat" className="label">
            What is this quotation for?
          </label>
          <select
            id="quote-cat"
            className="input font-semibold"
            value={category}
            onChange={(e) => {
              const picked = CategorySchema.safeParse(e.target.value);
              if (picked.success) setCategory(picked.data);
            }}
          >
            {QUOTE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(plan.occasion, c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="quote-text" className="label">
            Quotation text
          </label>
          <textarea
            id="quote-text"
            className="input min-h-36 leading-relaxed"
            maxLength={6000}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste the vendor's message here…"
          />
          <p className="hint flex justify-between">
            <span>{pasted.length}/6000 characters</span>
            <span>Supports WhatsApp messages, email proposals & rate cards</span>
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-primary w-full sm:w-auto !min-h-11 px-6 shadow-md"
            disabled={pasted.trim() === '' || ai.state.status === 'loading'}
            onClick={() => void analyze()}
          >
            <Icon name="sparkle" className="h-4 w-4" />
            Analyze quotation
          </button>
        </div>
      </div>

      <div aria-live="polite" className="mt-4">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reading the quotation…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void analyze()} />
        )}
        {ai.state.status === 'done' && <AnswerMeta progress={ai.progress} />}
        {saved && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-ok/30 bg-ok-soft p-3 text-xs sm:text-sm font-semibold text-ok">
            <Icon name="check" className="h-4 w-4 shrink-0" />
            <span>{saved}</span>
          </div>
        )}
      </div>

      {result && (
        <QuoteResult
          quote={result}
          plan={plan}
          full={full}
          onSave={(accept) => save(result, accept)}
        />
      )}
    </section>
  );
}
