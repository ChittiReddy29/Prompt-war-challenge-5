import { useState } from 'react';
import { budgetTier } from '../engine';
import type { Plan } from '../schemas';
import { suggestIdeas, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { Icon } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl border border-line/60 bg-paper/60 p-4 shadow-xs">
      <h4 className="font-bold text-xs uppercase tracking-wider text-ink-soft">{title}</h4>
      <ul className="mt-2.5 list-disc space-y-1.5 pl-4 text-xs sm:text-sm text-ink">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function IdeasPanel({ plan }: { plan: Plan }) {
  const [round, setRound] = useState(0);
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof suggestIdeas>[0]) =>
    suggestIdeas(request, options),
  );

  const generate = () => {
    setRound((r) => r + 1);
    return ai.run({
      occasion: plan.occasion,
      vibe: plan.vibe,
      guests: plan.guests,
      budgetTier: budgetTier(plan),
      nonNegotiables: plan.priorities,
      variation: round,
    });
  };

  const data = ai.state.status === 'done' ? ai.state.data : null;
  return (
    <section className="card !p-6 sm:!p-8" aria-labelledby="ideas-h">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="sparkle" className="h-5 w-5 text-accent animate-pulse" />
            <h2 id="ideas-h" className="text-xl font-bold text-ink">
              Ideas for your celebration
            </h2>
          </div>
          <p className="hint">
            AI suggestions · no prices. Tuned to your occasion, style and guest count.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary !min-h-10 text-xs sm:text-sm font-semibold shadow-md"
          onClick={() => void generate()}
          disabled={ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4" />
          {data ? 'Regenerate ideas' : 'Get ideas'}
        </button>
      </div>

      <div aria-live="polite" className="mt-5">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is thinking up ideas…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void generate()} />
        )}
        {data && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-ink mb-3">Themes</h3>
              <ul className="grid gap-4 md:grid-cols-2">
                {data.themes.map((t) => (
                  <li
                    key={t.title}
                    className="rounded-2xl border border-line bg-paper/50 p-4 shadow-soft transition-all hover:border-line/90 hover:bg-paper"
                  >
                    <p className="font-bold text-sm text-ink">{t.title}</p>
                    <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
                      {t.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <List title="Activities" items={data.activities} />
              <List title="Food style" items={data.foodStyle} />
              <List title="Personal touches" items={data.personalTouches} />
            </div>
            <AnswerMeta progress={ai.progress} />
            <figure className="rounded-2xl border border-accent/25 bg-accent-soft/70 p-5 shadow-soft">
              <figcaption className="text-xs font-bold uppercase tracking-wider text-accent">
                Invitation line
              </figcaption>
              <blockquote className="mt-2 font-display text-base sm:text-lg italic text-ink font-semibold">
                {data.invitationLine}
              </blockquote>
            </figure>
          </div>
        )}
      </div>
    </section>
  );
}
