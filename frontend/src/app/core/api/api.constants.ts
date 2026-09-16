import { isDevMode } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export const API_BASE_URL = isDevMode() ? 'http://localhost:8080/api' : '/api';

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/')) return null;
  return `${API_ORIGIN}${path}`;
}

export function errorMessage(error: unknown, fallback = 'Si è verificato un errore'): string {
  if (error instanceof HttpErrorResponse) {
    return (error.error as { error?: string } | null)?.error || fallback;
  }
  return fallback;
}
