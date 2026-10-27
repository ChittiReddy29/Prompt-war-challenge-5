import { useMemo, useState } from 'react';
import {
  diffDays,
  planInsights,
  type Insight,
  type InsightSeverity,
  type InsightTab,
} from '../engine';
import type { Plan } from '../schemas';
import { reviewPlan, type RequestOptions } from '../lib/api';
import { useAiCall } from '../lib/useAiCall';
import { AskPlanner } from './AskPlanner';
import { Icon, type IconName } from './Icon';
import { AnswerMeta } from './ThinkingTrace';
import { AiError, AiLoading } from './ui';

const SEVERITY: Record<
  InsightSeverity,
  { label: string; icon: IconName; tone: string; bg: string }
> = {
  critical: {
    label: 'Urgent',
    icon: 'alert',
    tone: 'text-warn',
    bg: 'border-warn/30 bg-warn-soft/60',
  },
  warning: {
    label: 'Needs attention',
    icon: 'clock',
    tone: 'text-warn',
    bg: 'border-warn/20 bg-warn-soft/40',
  },
  suggestion: {
    label: 'Suggestion',
    icon: 'sparkle',
    tone: 'text-accent',
    bg: 'border-accent/20 bg-accent-soft/50',
  },
};

const TAB_LABEL: Record<InsightTab, string> = {
  budget: 'Budget',
  timeline: 'Timeline',
  vendors: 'Vendors',
};

const COLLAPSED = 3;

function InsightRow({
  insight,
  onNavigate,
}: {
  insight: Insight;
  onNavigate: (tab: InsightTab) => void;
}) {
  const s = SEVERITY[insight.severity];
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${s.bg}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon name={s.icon} className={`mt-0.5 h-4 w-4 shrink-0 ${s.tone}`} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink sm:text-sm">
            <span
              className={`mr-2 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.tone}`}
            >
              {s.label}
            </span>
            {insight.title}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft sm:text-sm">{insight.detail}</p>
        </div>
      </div>
      <button
        type="button"
        className="btn-secondary !min-h-8 shrink-0 text-xs font-semibold"
        onClick={() => onNavigate(insight.tab)}
      >
        Open {TAB_LABEL[insight.tab]}
      </button>
    </li>
  );
}

export function AssistantPanel({
  plan,
  today,
  onNavigate,
}: {
  plan: Plan;
  today: string;
  onNavigate: (tab: InsightTab) => void;
}) {
  const insights = useMemo(() => planInsights(plan, today), [plan, today]);
  const [expanded, setExpanded] = useState(false);
  const ai = useAiCall((options: RequestOptions, request: Parameters<typeof reviewPlan>[0]) =>
    reviewPlan(request, options),
  );
  const shown = expanded ? insights : insights.slice(0, COLLAPSED);
  const urgent = insights.filter((i) => i.severity !== 'suggestion').length;

  const askAi = () =>
    ai.run({
      occasion: plan.occasion,
      guests: plan.guests,
      totalBudget: plan.totalBudget,
      daysToEvent: diffDays(today, plan.eventDate),
      vibe: plan.vibe,
      insights: insights
        .slice(0, 10)
        .map(({ severity, title, detail }) => ({ severity, title, detail })),
    });

  return (
    <section className="card mb-8" aria-labelledby="assistant-h">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="assistant-h" className="flex items-center gap-2 text-lg sm:text-xl">
              <Icon name="sparkle" className="h-5 w-5 text-accent animate-pulse" />
              Your planning assistant
            </h2>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
              AI Powered
            </span>
          </div>
          <p className="hint" aria-live="polite">
            {urgent > 0
              ? `${urgent} ${urgent === 1 ? 'thing needs' : 'things need'} your attention.`
              : 'Nothing urgent. Here is what to do next.'}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary !min-h-10 text-xs sm:text-sm"
          onClick={() => void askAi()}
          disabled={insights.length === 0 || ai.state.status === 'loading'}
        >
          <Icon name="sparkle" className="h-4 w-4" />
          {ai.state.status === 'done' ? 'Refresh AI review' : 'Ask AI for a plan review'}
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-ok/30 bg-ok-soft p-3 text-xs font-semibold text-ok">
          <Icon name="check" className="h-4 w-4 shrink-0" />
          <span>Everything is on track.</span>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5" aria-label="What needs attention">
          {shown.map((insight) => (
            <InsightRow key={insight.id} insight={insight} onNavigate={onNavigate} />
          ))}
        </ul>
      )}

      {insights.length > COLLAPSED && (
        <div className="mt-3 text-center sm:text-left">
          <button
            type="button"
            className="btn-quiet !min-h-9 text-xs font-semibold"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Show less' : `Show all ${insights.length}`}
          </button>
        </div>
      )}

      <div aria-live="polite" className="mt-4">
        {ai.state.status === 'loading' && (
          <AiLoading label="Gemini is reviewing your plan…" progress={ai.progress} />
        )}
        {ai.state.status === 'error' && (
          <AiError message={ai.state.message} onRetry={() => void askAi()} />
        )}
        {ai.state.status === 'done' && (
          <div
            className="rounded-2xl border border-accent/25 bg-accent-soft/70 p-5 shadow-soft"
            data-testid="ai-review"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-on-accent text-xs">
                AI
              </span>
              <h3 className="text-sm font-bold text-ink">Comprehensive Architectural Review</h3>
            </div>
            <p className="mt-2 text-xs text-ink sm:text-sm">{ai.state.data.summary}</p>
            <ol className="mt-3.5 space-y-2 pl-4 text-xs sm:text-sm list-decimal text-ink">
              {ai.state.data.steps.map((step) => (
                <li key={step.title} className="pl-1">
                  <span className="font-bold text-ink">{step.title}.</span> {step.why}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] text-ink-soft">
              AI review of the facts above. It never adds prices, dates or vendors.
            </p>
            <AnswerMeta progress={ai.progress} />
          </div>
        )}
      </div>

      <AskPlanner plan={plan} today={today} />
    </section>
  );
}
