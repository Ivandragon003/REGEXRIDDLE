import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE_URL } from './api/api.constants';

// Aggiunge il token JWT alle richieste ed esegue il logout automatico su 401.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');
  // Non inviare mai il JWT verso URL esterni: protegge da future chiamate HTTP
  // aggiunte all'app per errore o da dipendenze non fidate.
  const isApiRequest = req.url.startsWith(API_BASE_URL);
  const authReq = token && isApiRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
