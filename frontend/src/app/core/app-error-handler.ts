import { ErrorHandler, Injectable, signal } from '@angular/core';

// Stato condiviso: AppComponent lo legge per mostrare la UI di fallback
// invece di una schermata bianca quando un componente lancia un errore.
@Injectable({ providedIn: 'root' })
export class AppErrorState {
  readonly hasError = signal(false);
}

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  constructor(private state: AppErrorState) {}

  handleError(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('Errore non gestito intercettato:', error);
    this.state.hasError.set(true);
  }
}
