import { isDevMode } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

// Base URL dell'API in base alla modalità di build:
//   - produzione (Docker + nginx proxy): /api
//   - sviluppo (ng serve): http://localhost:8080/api
export const API_BASE_URL = isDevMode() ? 'http://localhost:8080/api' : '/api';

// Origine del backend, per risolvere gli asset statici (es. avatar in /uploads).
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

// Estrae un messaggio leggibile dalla risposta di errore strutturata.
export function errorMessage(error: unknown, fallback = 'Si è verificato un errore'): string {
  if (error instanceof HttpErrorResponse) {
    return (error.error as { error?: string } | null)?.error || fallback;
  }
  return fallback;
}
