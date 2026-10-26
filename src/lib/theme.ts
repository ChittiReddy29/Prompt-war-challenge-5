import { useCallback, useEffect, useState } from 'react';

/** Supported visual theme modes. */
export type Theme = 'light' | 'dark';

/** Local storage persistence key for theme mode. */
export const THEME_KEY = 'eventix.theme';

function readStored(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/** Detects the host operating system's prefers-color-scheme preference. */
export function systemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Saved choice first, then the operating-system preference. */
export function initialTheme(): Theme {
  return readStored() ?? systemTheme();
}

/** Applies the specified theme attribute to document root. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Theme state that mirrors onto <html data-theme> and remembers an explicit choice. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // Remembering the choice is a convenience; the toggle still works without it.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
