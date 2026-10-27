import { useEffect } from 'react';
import type { Occasion } from '../schemas';
import { describeChanges } from '../lib/format';
import type { ToastData } from '../state/planStore';
import { Icon } from './Icon';

/** Shows what moved after a budget change. Always mounted so screen readers announce updates. */
export function Toast({
  toast,
  occasion,
  onDismiss,
}: {
  toast: ToastData | null;
  occasion: Occasion;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 8000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const text = toast
    ? [describeChanges(occasion, toast.changes), toast.note].filter(Boolean).join(' ')
    : '';

  return (
    <div
      aria-live="polite"
      role="status"
      className="no-print pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {toast && text && (
        <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl border border-line/20 bg-ink px-4 py-3 text-xs sm:text-sm text-paper shadow-elevated backdrop-blur-md">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
            <Icon name="check" className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
          <p className="flex-1 font-medium leading-normal">{text}</p>
          <button
            type="button"
            className="btn !min-h-8 shrink-0 rounded-lg px-2.5 text-xs font-semibold text-paper/90 hover:text-paper hover:bg-white/10"
            onClick={onDismiss}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
