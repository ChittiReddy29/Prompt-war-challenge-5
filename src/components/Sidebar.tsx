import { useState, type KeyboardEvent, type MutableRefObject } from 'react';
import { planReadiness } from '../engine';
import { BRAND } from '../lib/branding';
import { useTheme } from '../lib/theme';
import type { Plan } from '../schemas';
import { shareHash } from '../state/share';
import { BrandMark, Icon, type IconName } from './Icon';
import { Confirm } from './ui';

export type TabId = 'setup' | 'budget' | 'timeline' | 'vendors';
export interface TabItem {
  readonly id: TabId;
  readonly label: string;
  readonly icon: IconName;
}

export function Sidebar({
  plan,
  tab,
  tabs,
  tabRefs,
  onSelectTab,
  onKeyDown,
  onReset,
}: {
  plan: Plan | null;
  tab: TabId;
  tabs: readonly TabItem[];
  tabRefs: MutableRefObject<Record<string, HTMLButtonElement | null>>;
  onSelectTab: (tab: TabId) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [share, setShare] = useState<{ status: 'copied' | 'manual'; url: string } | null>(null);
  const readiness = plan ? planReadiness(plan) : null;
  const { theme, toggle } = useTheme();

  async function copyLink(current: Plan) {
    const url = `${window.location.origin}${window.location.pathname}${shareHash(current)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShare({ status: 'copied', url });
    } catch {
      setShare({ status: 'manual', url });
    }
  }

  return (
    <header
      role="banner"
      className="no-print w-full shrink-0 border-b border-line/80 bg-card/95 backdrop-blur-md lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 xl:w-80 lg:flex-col lg:justify-between lg:border-b-0 lg:border-r lg:overflow-y-auto"
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-line/60 p-4 sm:px-6 lg:p-5">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9 shadow-sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-bold tracking-tight text-ink sm:text-lg">
                  {BRAND.name}
                </span>
                <span className="rounded-md border border-accent/25 bg-accent-soft/80 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-accent uppercase">
                  {BRAND.badge}
                </span>
              </div>
              <p className="text-[11px] font-medium text-ink-soft hidden sm:block">
                {BRAND.tagline}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary !min-h-9 !px-2.5"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 sm:p-4 lg:py-4">
          <div className="mb-2 hidden px-3 text-[10px] font-bold tracking-widest text-ink-muted uppercase lg:block">
            Workspace
          </div>
          <div
            role="tablist"
            aria-label="Plan sections"
            className="grid grid-cols-2 gap-1.5 rounded-2xl border border-line/60 bg-paper/50 p-1.5 sm:grid-cols-4 lg:flex lg:flex-col lg:gap-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
          >
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  role="tab"
                  type="button"
                  id={`tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={active ? 0 : -1}
                  className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 lg:w-full lg:text-sm ${
                    active
                      ? 'bg-accent text-on-accent shadow-sm'
                      : 'text-ink-soft hover:bg-paper/80 hover:text-ink'
                  }`}
                  onClick={() => onSelectTab(t.id)}
                  onKeyDown={onKeyDown}
                >
                  <Icon
                    name={t.icon}
                    className={`h-4 w-4 shrink-0 ${active ? 'text-on-accent' : 'text-ink-soft'}`}
                  />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {readiness && (
          <div
            className="mx-3 mb-3 rounded-2xl border border-line bg-paper/50 p-3.5 sm:mx-4 lg:mx-4"
            aria-label="Plan readiness"
          >
            <div className="flex items-baseline justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-ink">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                Plan readiness {readiness.percent}%
              </span>
              <span className="text-[11px] font-medium text-ink-soft">
                {readiness.tasksDone}/{readiness.tasksTotal} tasks
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-card border border-line/60 p-0.5">
              <progress
                className="block h-full w-full overflow-hidden rounded-full accent-accent transition-all duration-500"
                max={100}
                value={readiness.percent}
                aria-label="Plan readiness percent"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-ink-muted">
              {readiness.quotesVerified}/{readiness.quotesTotal} verified quotations
            </p>
          </div>
        )}

        {plan && (
          <div className="mx-3 mb-3 flex flex-wrap gap-1.5 border-t border-line/60 pt-3 sm:mx-4 lg:mx-4 lg:flex-col lg:gap-1">
            <button
              type="button"
              className="btn-secondary !min-h-9 !px-3 text-xs lg:w-full lg:justify-start"
              onClick={() => void copyLink(plan)}
              title="Share link"
            >
              <Icon name="link" className="h-4 w-4 text-accent" />
              <span>Share link</span>
            </button>
            <button
              type="button"
              className="btn-secondary !min-h-9 !px-3 text-xs lg:w-full lg:justify-start"
              onClick={() => window.print()}
              title="Print summary"
            >
              <Icon name="printer" className="h-4 w-4 text-ink-soft" />
              <span>Print summary</span>
            </button>
            <button
              type="button"
              className="btn-secondary !min-h-9 !px-3 text-xs text-warn/90 hover:text-warn hover:border-warn/40 lg:w-full lg:justify-start"
              onClick={() => setConfirmReset(true)}
              title="Reset plan"
            >
              <Icon name="reset" className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      <div className="hidden border-t border-line/60 p-4 lg:block">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{BRAND.engineName}</span>
          <span className="flex items-center gap-1.5 font-medium text-ok">
            <span className="h-2 w-2 rounded-full bg-ok" />
            Connected
          </span>
        </div>
      </div>

      <div className="p-3 sm:px-4" aria-live="polite">
        {share?.status === 'copied' && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-ok/30 bg-ok-soft/70 px-3 py-2 text-xs font-medium text-ok">
            <Icon name="check" className="h-4 w-4 shrink-0" />
            <span>Link copied. Anyone with it can open and collaborate on this plan.</span>
          </div>
        )}
        {share?.status === 'manual' && (
          <div className="mb-2 rounded-xl border border-line bg-paper p-3">
            <label htmlFor="share-url" className="label text-xs">
              Copy this link
            </label>
            <input
              id="share-url"
              readOnly
              className="input text-xs"
              value={share.url}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}
        {confirmReset && (
          <div className="mb-2">
            <Confirm
              prompt="Reset the whole plan? Your budget, timeline and quotations will be cleared from this browser."
              confirmLabel="Yes, reset"
              onCancel={() => setConfirmReset(false)}
              onConfirm={() => {
                setConfirmReset(false);
                setShare(null);
                onReset();
              }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
