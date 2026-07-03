import { Injectable, computed, signal } from '@angular/core';

export interface AuthUser {
  userId: string;
  username: string;
  avatarUrl?: string | null;
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenSignal = signal<string | null>(localStorage.getItem('token'));
  private userSignal = signal<AuthUser | null>(readStoredUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  login(token: string, userData: AuthUser): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    this.tokenSignal.set(token);
    this.userSignal.set(userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }

  // Aggiorna i dati utente locali (es. dopo cambio username/avatar).
  updateUser(patch: Partial<AuthUser>): void {
    const next = { ...(this.userSignal() as AuthUser), ...patch };
    localStorage.setItem('user', JSON.stringify(next));
    this.userSignal.set(next);
  }
}
