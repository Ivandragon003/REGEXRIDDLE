import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Protegge le route riservate: se non autenticato, redirige al login
// memorizzando la destinazione per tornarci dopo l'accesso.
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  router.navigate(['/login'], { state: { from: state.url } });
  return false;
};
