import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'come-funziona',
    loadComponent: () =>
      import('./pages/how-it-works/how-it-works.component').then((m) => m.HowItWorksComponent),
  },
  {
    path: 'sfide',
    loadComponent: () =>
      import('./pages/challenges-list/challenges-list.component').then((m) => m.ChallengesListComponent),
  },
  {
    path: 'sfide/nuova',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/create-challenge/create-challenge.component').then(
        (m) => m.CreateChallengeComponent
      ),
  },
  {
    path: 'sfide/:id',
    loadComponent: () =>
      import('./pages/challenge-detail/challenge-detail.component').then(
        (m) => m.ChallengeDetailComponent
      ),
  },
  {
    path: 'classifica',
    loadComponent: () =>
      import('./pages/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
  },
  {
    path: 'profilo',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registrati',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
