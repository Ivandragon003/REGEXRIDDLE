import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.constants';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl: string | null;
  solvedCount: number;
  avgAttempts: number;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardApiService {
  private http = inject(HttpClient);

  get(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${API_BASE_URL}/leaderboard`);
  }
}
