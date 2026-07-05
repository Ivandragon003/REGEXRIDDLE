import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.constants';

export interface Challenge {
  id: number;
  title: string;
  description?: string | null;
  createdAt: string;
  authorUsername: string;
  totalAttempts: number;
  solvedByCount: number;
  exampleMatch: string;
  exampleNoMatch: string;
}

export interface Attempt {
  proposedRegex: string;
  attemptedAt: string;
  positiveMatched: number;
  totalPositive: number;
  negativeMatched: number;
  totalNegative: number;
  solved: boolean;
}

export interface AttemptResult {
  solved: boolean;
  positiveMatched: number;
  totalPositive: number;
  negativeMatched: number;
  totalNegative: number;
}

export interface CreateChallengePayload {
  title: string;
  description: string | null;
  secretRegex: string;
  exampleMatch: string;
  exampleNoMatch: string;
  controlStringsPositive: string[];
  controlStringsNegative: string[];
}

@Injectable({ providedIn: 'root' })
export class ChallengesApiService {
  private http = inject(HttpClient);

  getAll(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(`${API_BASE_URL}/challenges`);
  }

  getById(id: string): Observable<Challenge> {
    return this.http.get<Challenge>(`${API_BASE_URL}/challenges/${id}`);
  }

  getMy(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(`${API_BASE_URL}/challenges/my`);
  }

  getSolved(): Observable<number[]> {
    return this.http.get<number[]>(`${API_BASE_URL}/challenges/solved`);
  }

  create(data: CreateChallengePayload): Observable<Challenge> {
    return this.http.post<Challenge>(`${API_BASE_URL}/challenges`, data);
  }

  attempt(id: string, regex: string): Observable<AttemptResult> {
    return this.http.post<AttemptResult>(`${API_BASE_URL}/challenges/${id}/attempts`, { regex });
  }

  getAttempts(id: string): Observable<Attempt[]> {
    return this.http.get<Attempt[]>(`${API_BASE_URL}/challenges/${id}/attempts`);
  }
}
