import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { LeaderboardApiService, LeaderboardEntry } from '../../core/api/leaderboard-api.service';
import { AuthService } from '../../core/auth.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
})
export class LeaderboardComponent {
  private leaderboardApi = inject(LeaderboardApiService);
  auth = inject(AuthService);

  data = signal<LeaderboardEntry[] | null>(null);
  isLoading = signal(true);
  isError = signal(false);
  skeletons = Array.from({ length: 6 });

  constructor() {
    this.leaderboardApi.get().subscribe({
      next: (res) => {
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  medal(rank: number): string {
    return MEDALS[rank] || String(rank);
  }

  isMe(username: string): boolean {
    return this.auth.user()?.username === username;
  }
}
