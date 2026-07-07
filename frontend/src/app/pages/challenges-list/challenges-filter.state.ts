import { Injectable, signal } from '@angular/core';

export type SortKey = 'recent' | 'attempts' | 'solved';
export type AuthorFilter = 'all' | 'mine' | 'others';

/** Stato dei filtri della lista sfide, condiviso a livello di app così da
 * sopravvivere alla distruzione/ricreazione del componente quando si esce
 * e si rientra nella pagina (es. aprendo il dettaglio di una sfida). */
@Injectable({ providedIn: 'root' })
export class ChallengesFilterState {
  search = signal('');
  sort = signal<SortKey>('recent');
  authorFilter = signal<AuthorFilter>('all');
  hideSolved = signal(false);
}
