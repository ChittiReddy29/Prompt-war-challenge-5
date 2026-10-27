import { useState, type KeyboardEvent } from 'react';
import type { IntakeParse } from '../schemas';
import { parseIntake, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { Icon } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

export const EXAMPLE_EVENT =
  'Shaadi in Pune, 200 guests, 8 lakh budget, mid-Feb, simple ceremony but premium food';

/**
 * Free-text intake. Gemini reads the description; the parent decides which fields to fill and
 * returns their names so we can tell the user exactly what changed.
 */
export function DescribeEvent({ onParsed }: { onParsed: (result: IntakeParse) => string[] }) {
  const [description, setDescription] = useState('');
  const [filled, setFilled] = useState<string | null>(null);
  const ai = useAiCall((options: RequestOptions, text: string) => parseIntake(text, options));

  /** Tab on an empty box accepts the example, like ghost-text autocomplete in an editor. */
  function acceptExample(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab' || event.shiftKey || description !== '') return;
    event.preventDefault();
    setDescription(EXAMPLE_EVENT);
  }

  async function fill() {
    setFilled(null);
    const result = await ai.run(description);
    if (!result) return;
    const found = onParsed(result);
    setFilled(
      found.length
        ? `Filled ${found.join(', ')}. Please check the details before creating your plan.`
        : 'We could not find event details in that text. You can fill the form below by hand.',
    );
  }

  return (
    <section
      className="card lg:sticky lg:top-24 !p-6 sm:!p-8 shadow-card"
      aria-labelledby="describe-h"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon name="sparkle" className="h-5 w-5 text-accent animate-pulse" />
        <h2 id="describe-h" className="text-lg sm:text-xl font-bold">
          Describe your event
        </h2>
      </div>
      <p className="hint">
        Write it the way you would tell a friend. We will fill the form for you.
      </p>
      <label htmlFor="describe" className="sr-only">
        Event description
      </label>
      <textarea
        id="describe"
        className="input mt-4 min-h-32 text-xs sm:text-sm leading-relaxed"
        maxLength={1000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={EXAMPLE_EVENT}
        aria-describedby={description === '' ? 'describe-tab-hint' : undefined}
        onKeyDown={acceptExample}
      />
      {description === '' && (
        <p id="describe-tab-hint" className="hint flex items-center gap-1.5 mt-2">
          Press{' '}
          <kbd className="rounded-md border border-line bg-paper px-1.5 py-0.5 text-[11px] font-mono font-bold text-ink-soft shadow-xs">
            Tab
          </kbd>{' '}
          to use this example.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn-primary w-full sm:w-auto !min-h-10 text-xs sm:text-sm font-semibold shadow-md"
          onClick={() => void fill()}
          disabled={description.trim() === '' || ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4" />
          Fill form from description
        </button>
        <span className="text-xs text-ink-soft font-medium">
          {description.length}/1000 · AI suggestion
        </span>
      </div>
      <div className="mt-4" aria-live="polite">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reading your description…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void fill()} />
        )}
        {filled && ai.state.status === 'done' && (
          <div className="rounded-xl border border-accent/25 bg-accent-soft/80 p-3.5">
            <p className="text-xs sm:text-sm font-semibold text-accent">{filled}</p>
            <AnswerMeta progress={ai.progress} />
          </div>
        )}
      </div>
    </section>
  );
}
