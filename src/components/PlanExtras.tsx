import { categoryLabel } from '../engine';
import { CATEGORIES, type Category, type Occasion } from '../schemas';
import { Field } from './ui';

const PRIORITY_CATEGORIES = CATEGORIES.filter((c) => c !== 'contingency');

/** The optional part of the intake: style and the categories that matter most. */
export function PlanExtras({
  occasion,
  vibe,
  priorities,
  onVibe,
  onPriorities,
}: {
  occasion: Occasion;
  vibe: string;
  priorities: Category[];
  onVibe: (vibe: string) => void;
  onPriorities: (priorities: Category[]) => void;
}) {
  function toggle(category: Category) {
    onPriorities(
      priorities.includes(category)
        ? priorities.filter((c) => c !== category)
        : [...priorities, category],
    );
  }

  return (
    <details className="rounded-2xl border border-line/80 bg-paper/40 p-4 sm:p-5 shadow-xs transition-all">
      <summary className="min-h-11 cursor-pointer text-xs sm:text-sm font-bold text-ink hover:text-accent outline-none">
        Make it yours (optional)
      </summary>
      <div className="mt-4 space-y-5 border-t border-line/60 pt-4">
        <Field label="Style or vibe" hint="For example: traditional, minimal, fun for kids.">
          {(p) => (
            <input
              {...p}
              className="input"
              maxLength={200}
              placeholder="e.g. Royal Rajasthani, Eco-chic Minimalist, Retro Bollywood"
              value={vibe}
              onChange={(e) => onVibe(e.target.value)}
            />
          )}
        </Field>
        <fieldset>
          <legend className="label">
            What matters most? We give these categories more of the budget.
          </legend>
          <div className="grid gap-2 sm:grid-cols-2 mt-2">
            {PRIORITY_CATEGORIES.map((c) => {
              const checked = priorities.includes(c);
              return (
                <label
                  key={c}
                  className={`flex min-h-11 items-center gap-3 rounded-xl border p-2.5 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                    checked
                      ? 'border-accent/40 bg-accent-soft text-accent shadow-xs'
                      : 'border-line/60 bg-card text-ink hover:border-line hover:bg-paper'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-accent"
                    checked={checked}
                    onChange={() => toggle(c)}
                  />
                  <span>{categoryLabel(occasion, c)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </details>
  );
}
