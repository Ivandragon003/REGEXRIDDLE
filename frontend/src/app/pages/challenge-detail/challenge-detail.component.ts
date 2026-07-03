import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Attempt,
  AttemptResult,
  Challenge,
  ChallengesApiService,
} from '../../core/api/challenges-api.service';
import { errorMessage } from '../../core/api/api.constants';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-challenge-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './challenge-detail.component.html',
  styleUrl: './challenge-detail.component.css',
})
export class ChallengeDetailComponent {
  private route = inject(ActivatedRoute);
  private challengesApi = inject(ChallengesApiService);
  auth = inject(AuthService);

  id = '';

  challenge = signal<Challenge | null>(null);
  isLoading = signal(true);
  isError = signal(false);

  attempts = signal<Attempt[]>([]);

  regex = signal('');
  clientError = signal('');
  isPending = signal(false);
  serverError = signal('');
  result = signal<AttemptResult | null>(null);

  isOwner = computed(() => {
    const c = this.challenge();
    return this.auth.isAuthenticated() && c != null && this.auth.user()?.username === c.authorUsername;
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.id = id;
      this.regex.set('');
      this.clientError.set('');
      this.serverError.set('');
      this.result.set(null);
      this.load();
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.challengesApi.getById(this.id).subscribe({
      next: (data) => {
        this.challenge.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
      },
    });

    if (this.auth.isAuthenticated()) {
      this.loadAttempts();
    }
  }

  loadAttempts(): void {
    this.challengesApi.getAttempts(this.id).subscribe({
      next: (data) => this.attempts.set(data),
    });
  }

  handleSubmit(): void {
    this.clientError.set('');
    const value = this.regex();
    if (!value.trim()) {
      this.clientError.set('Inserisci una regex');
      return;
    }
    try {
      new RegExp(value);
    } catch {
      this.clientError.set('La regex non è sintatticamente valida');
      return;
    }

    this.isPending.set(true);
    this.serverError.set('');
    this.challengesApi.attempt(this.id, value).subscribe({
      next: (res) => {
        this.result.set(res);
        this.isPending.set(false);
        this.load();
      },
      error: (err) => {
        this.isPending.set(false);
        this.serverError.set(errorMessage(err));
      },
    });
  }

  formatDateTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  progressPct(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
