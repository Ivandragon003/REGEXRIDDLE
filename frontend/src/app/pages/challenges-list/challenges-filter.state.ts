import { Injectable, signal } from '@angular/core';

export type SortKey = 'recent' | 'attempts' | 'solved';
export type AuthorFilter = 'all' | 'mine' | 'others';

@Injectable({ providedIn: 'root' })
export class ChallengesFilterState {
  search = signal('');
  sort = signal<SortKey>('recent');
  authorFilter = signal<AuthorFilter>('all');
  hideSolved = signal(false);
}
