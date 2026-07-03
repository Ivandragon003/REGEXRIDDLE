import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Challenge, ChallengesApiService } from '../../core/api/challenges-api.service';
import { AuthService } from '../../core/auth.service';
import { ChallengeCardComponent } from '../../shared/challenge-card/challenge-card.component';

type SortKey = 'recent' | 'attempts' | 'solved';

const SORTS: Record<SortKey, { label: string; fn: (a: Challenge, b: Challenge) => number }> = {
  recent: {
    label: 'Più recenti',
    fn: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  },
  attempts: { label: 'Più tentate', fn: (a, b) => b.totalAttempts - a.totalAttempts },
  solved: { label: 'Più risolte', fn: (a, b) => b.solvedByCount - a.solvedByCount },
};

@Component({
  selector: 'app-challenges-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChallengeCardComponent],
  templateUrl: './challenges-list.component.html',
  styleUrl: './challenges-list.component.css',
})
export class ChallengesListComponent {
  private challengesApi = inject(ChallengesApiService);
  auth = inject(AuthService);

  sortKeys = Object.keys(SORTS) as SortKey[];
  sortLabel = (key: SortKey) => SORTS[key].label;

  search = signal('');
  sort = signal<SortKey>('recent');
  onlyMine = signal(false);
  hideSolved = signal(false);

  challenges = signal<Challenge[] | null>(null);
  solvedIds = signal<string[]>([]);
  isLoading = signal(true);
  isError = signal(false);

  filtered = computed(() => {
    const challenges = this.challenges();
    if (!challenges) return [];
    const q = this.search().trim().toLowerCase();
    const solvedSet = new Set(this.solvedIds());
    const user = this.auth.user();
    let result = challenges.filter((c) => {
      if (q && !c.title.toLowerCase().includes(q)) return false;
      if (this.onlyMine() && c.authorUsername !== user?.username) return false;
      if (this.hideSolved() && solvedSet.has(c.id)) return false;
      return true;
    });
    result = [...result].sort(SORTS[this.sort()].fn);
    return result;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.challengesApi.getAll().subscribe({
      next: (data) => {
        this.challenges.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
      },
    });

    if (this.auth.isAuthenticated()) {
      this.challengesApi.getSolved().subscribe({
        next: (ids) => this.solvedIds.set(ids),
      });
    }
  }

  toggleOnlyMine(): void {
    this.onlyMine.update((v) => !v);
  }

  toggleHideSolved(): void {
    this.hideSolved.update((v) => !v);
  }
}
