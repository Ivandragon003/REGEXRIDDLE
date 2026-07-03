import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.constants';

export interface UserProfile {
  username: string;
  email: string;
  avatarUrl: string | null;
  createdChallengesCount: number;
  solvedCount: number;
  totalAttempts: number;
  avgAttempts: number | null;
}

export interface UpdateUserPayload {
  username: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API_BASE_URL}/users/me`);
  }

  updateMe(data: UpdateUserPayload): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${API_BASE_URL}/users/me`, data);
  }

  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ avatarUrl: string }>(`${API_BASE_URL}/users/me/avatar`, form);
  }

  getByUsername(username: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${API_BASE_URL}/users/${username}`);
  }
}
