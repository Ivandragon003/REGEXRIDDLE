import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { AppErrorState } from './core/app-error-handler';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  errorState = inject(AppErrorState);

  reset(): void {
    this.errorState.hasError.set(false);
    window.location.assign('/');
  }
}
