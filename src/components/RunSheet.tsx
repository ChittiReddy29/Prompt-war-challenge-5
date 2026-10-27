import { RUN_SHEETS } from '../engine';
import type { Occasion } from '../schemas';

/** The day itself, in order. Suggested times only; families adjust them to their muhurat. */
export function RunSheet({ occasion }: { occasion: Occasion }) {
  return (
    <section className="card !p-6 sm:!p-8" aria-labelledby="runsheet-h">
      <h3
        id="runsheet-h"
        className="font-display text-lg sm:text-xl font-bold tracking-tight text-ink"
      >
        On the day: suggested run sheet
      </h3>
      <p className="hint">
        Typical timings to share with family and vendors. Adjust them to your muhurat and venue
        slot.
      </p>
      <ol className="mt-5 space-y-2.5">
        {RUN_SHEETS[occasion].map((item) => (
          <li
            key={item.time}
            className="flex items-center gap-4 rounded-xl border border-line/60 bg-paper/50 p-3 text-xs sm:text-sm transition-all hover:bg-paper"
          >
            <time className="tabular flex items-center justify-center rounded-lg border border-accent/25 bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent shrink-0">
              {item.time}
            </time>
            <span className="font-semibold text-ink">{item.title}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
