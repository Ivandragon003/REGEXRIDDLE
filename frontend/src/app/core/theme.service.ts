import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeSignal = signal<Theme>(getInitialTheme());
  readonly theme = this.themeSignal.asReadonly();

  constructor() {
    document.documentElement.setAttribute('data-theme', this.themeSignal());
  }

  toggleTheme(): void {
    const next: Theme = this.themeSignal() === 'dark' ? 'light' : 'dark';
    this.themeSignal.set(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }
}
